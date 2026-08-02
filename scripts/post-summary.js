/*
 * linkedin-post-audit / post-summary.js
 *
 * Paste into the browser console on a post-summary page:
 *   https://www.linkedin.com/analytics/post-summary/urn:li:activity:<id>/
 *
 * Get the list of pages worth visiting from collect.js:
 *   __liAudit.summaryUrls()
 *
 * These pages hold the numbers that actually answer "did this work":
 * saves, followers gained, profile views, and out-of-network share.
 * None of them appear on the activity feed.
 *
 * Read-only. Merges into the same localStorage record collect.js writes.
 */

(function () {
  var KEY = '__liAudit_deep';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  var store = load();
  var t = (document.querySelector('main') || document.body).innerText.replace(/ /g, ' ');

  function g(re) { var m = t.match(re); return m ? m[1] : null; }
  function n(s) { return s ? parseInt(String(s).replace(/,/g, ''), 10) : null; }

  var urn = (location.pathname.match(/(urn:li:activity:\d+)/) || [])[1];
  if (!urn) { console.warn('Not a post-summary page. Open one first.'); return; }

  var rec = {
    urn: urn,
    age: g(/posted this • (\S+)/),
    impressions: n(g(/([\d,]+)\s*\n+\s*Impressions/)),
    membersReached: n(g(/([\d,]+)\s*\n+\s*Members reached/)),
    outOfNetwork: g(/Out-of-network\s*\n+\s*(\d+%)/),
    profileViews: n(g(/(\d+)\s*\n+\s*Profile viewers from this post/)),
    followersGained: n(g(/(\d+)\s*\n+\s*Followers gained from this post/)),
    engagements: n(g(/([\d,]+)\s*\n+\s*Social engagements/)),
    reactions: n(g(/Reactions\s*\n+\s*([\d,]+)/)),
    comments: n(g(/Comments\s*\n+\s*([\d,]+)/)),
    reposts: n(g(/Reposts\s*\n+\s*([\d,]+)/)),
    saves: n(g(/Saves\s*\n+\s*([\d,]+)/)),
    linkClicks: n(g(/([\d,]+)\s*\n+\s*Link engagements/))
  };

  // The ratio is the point. Totals reward whatever got lucky once.
  rec.followersPer1k = rec.impressions
    ? Math.round((rec.followersGained || 0) / rec.impressions * 1000 * 100) / 100
    : null;
  rec.savesPer1k = rec.impressions
    ? Math.round((rec.saves || 0) / rec.impressions * 1000 * 100) / 100
    : null;

  store[urn] = rec;
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}

  console.table([rec]);
  console.log(Object.keys(store).length + ' posts with deep metrics stored.');
  console.log('Export all: JSON.parse(localStorage.__liAudit_deep)');

  window.__liAuditDeep = store;
  return rec;
})();
