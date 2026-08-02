/*
 * linkedin-post-audit / collect.js
 *
 * Paste into the browser console on your OWN LinkedIn activity page:
 *   https://www.linkedin.com/in/<your-handle>/recent-activity/all/
 *
 * Read-only. It reads pages you are already logged into and already own.
 * It does not post, edit, follow, message, or send anything anywhere.
 *
 * Why this is not just "scroll to the bottom and read the page":
 * LinkedIn virtualizes the activity list. Posts are removed from the DOM once
 * you scroll past them, so a single read at the bottom silently loses most of
 * your history. This accumulates on every pass instead, and persists to
 * localStorage so a reload does not cost you the collection.
 */

(function () {
  var KEY = '__liAudit_posts';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }

  var store = load();

  // The scroll container differs by page: the activity page scrolls on
  // documentElement, the main feed scrolls on <main>. Pick whichever actually
  // has overflow rather than assuming.
  function scroller() {
    var m = document.querySelector('main');
    if (m && m.scrollHeight > m.clientHeight + 50) return m;
    return document.scrollingElement || document.documentElement;
  }

  function num(s) { return s ? parseInt(String(s).replace(/[,\s]/g, ''), 10) : null; }

  function collect() {
    var added = 0;
    var nodes = document.querySelectorAll('[data-urn],[data-id]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var urn = el.getAttribute('data-urn') || el.getAttribute('data-id') || '';
      if (urn.indexOf('urn:li:activity') !== 0) continue;

      // Non-breaking spaces show up throughout LinkedIn's markup.
      var txt = (el.innerText || '').replace(/ /g, ' ');

      // "N impressions" only renders on your own posts. That is the filter
      // that separates your posts from things you commented on or reshared.
      var imp = (txt.match(/([\d,]+)\s+impressions/) || [])[1];
      if (!imp) continue;

      // Keep the richest version seen. A collapsed card has less text than an
      // expanded one, and we may see the same post in both states.
      if (store[urn] && store[urn].chars >= txt.length) continue;

      var body = txt.replace(/^[\s\S]*?\n\s*(?:\d+\s*(?:d|w|mo|h|yr)\s*•)/, '');
      var heb = (body.match(/[֐-׿]/g) || []).length;
      var lat = (body.match(/[A-Za-z]/g) || []).length;

      store[urn] = {
        urn: urn,
        impressions: num(imp),
        comments: num((txt.match(/([\d,]+)\s+comments?/) || [])[1]) || 0,
        reposts: num((txt.match(/([\d,]+)\s+reposts?/) || [])[1]) || 0,
        age: ((txt.match(/\n\s*(\d+\s*(?:d|w|mo|h|yr))\s*(?:•|\n)/) || [])[1] || '?').replace(/\s/g, ''),
        lang: heb > lat ? 'HE' : 'EN',
        hashtags: (txt.match(/hashtag/g) || []).length,
        words: body.split(/\s+/).filter(Boolean).length,
        chars: txt.length,
        head: body.slice(0, 120).replace(/\s+/g, ' ').trim(),
        summaryUrl: 'https://www.linkedin.com/analytics/post-summary/' + urn + '/'
      };
      added++;
    }
    if (added) save(store);
    return added;
  }

  var api = {
    store: store,

    collect: collect,

    /* Scroll and collect until the page stops producing new posts.
       passes: how many scroll steps to attempt. Raise it for long histories. */
    run: function (passes) {
      passes = passes || 40;
      var el = scroller(), idle = 0, i = 0;
      return new Promise(function (resolve) {
        (function step() {
          collect();
          var before = Object.keys(store).length;
          el.scrollTop = el.scrollHeight;
          setTimeout(function () {
            var got = collect();
            var after = Object.keys(store).length;
            idle = after > before || got ? 0 : idle + 1;
            i++;
            console.log('pass ' + i + ' — ' + after + ' posts');
            // Three consecutive quiet passes means the list is exhausted.
            if (i >= passes || idle >= 3) {
              console.log('done. ' + after + ' posts collected.');
              console.log('Next: api.table(), api.csv(), api.summaryUrls()');
              resolve(api.rows());
            } else step();
          }, 1200);
        })();
      });
    },

    rows: function () {
      return Object.keys(store).map(function (k) { return store[k]; })
        .sort(function (a, b) { return b.impressions - a.impressions; });
    },

    table: function () {
      console.table(api.rows().map(function (r) {
        return {
          imp: r.impressions, cmt: r.comments, lang: r.lang,
          tags: r.hashtags, words: r.words, age: r.age, head: r.head.slice(0, 60)
        };
      }));
    },

    /* The posts worth opening the per-post summary for: top 5 and bottom 5.
       Saves, followers gained, profile views and out-of-network share exist
       only on those pages. Ten is enough to find the pattern. */
    summaryUrls: function (n) {
      n = n || 5;
      var r = api.rows();
      return r.slice(0, n).concat(r.slice(-n)).map(function (x) { return x.summaryUrl; });
    },

    csv: function () {
      var cols = ['urn', 'age', 'lang', 'impressions', 'comments', 'reposts', 'hashtags', 'words', 'head'];
      var out = [cols.join(',')].concat(api.rows().map(function (r) {
        return cols.map(function (c) {
          return '"' + String(r[c] == null ? '' : r[c]).replace(/"/g, '""') + '"';
        }).join(',');
      })).join('\n');
      console.log(out);
      if (typeof copy === 'function') { copy(out); console.log('(copied to clipboard)'); }
      return out;
    },

    reset: function () { localStorage.removeItem(KEY); console.log('cleared'); }
  };

  window.__liAudit = api;
  console.log('linkedin-post-audit ready. ' + Object.keys(store).length + ' posts already stored.');
  console.log('Run: __liAudit.run()');
  return api;
})();
