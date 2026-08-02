---
name: linkedin-post-audit
description: Audit your own LinkedIn posts against the outcome you actually want, not impressions. Use when someone asks what their LinkedIn content is doing, which posts work, why a post underperformed, or what to write next. Read-only, own account only.
---

# LinkedIn post audit

Most people grade their LinkedIn on impressions. Impressions are the easiest number to grow and frequently the least connected to what they wanted. This skill pulls the numbers that are connected, from the person's own analytics, and tells them which posts actually did work.

**Read-only. Own account only.** This reads pages the user is already logged into and already owns. Never log in, never handle credentials, never touch another account, never post or edit anything.

## Before you start: make sure input is actually reaching the page

If you are driving a browser rather than having the user paste into their own console, check these first. Skipping them produces a confident, entirely fabricated audit, because the failure mode is silence rather than an error.

1. **Logged in already?** If the page shows a login form or a security checkpoint, stop and tell the user. Do not attempt to log in and do not touch credentials.
   LinkedIn also interrupts with security-key enrolment prompts (register a USB hardware key for 2FA) that are modal enough to block the whole session. Never act on one. It is both a security setting and an authentication credential, and the hardware is in the user's hand regardless. Stop, describe what is on screen, and let them clear it.
2. **Is the pane a sane size?** Resize to roughly 1280x900. A small pane (393x419 has happened) breaks clicking outright.
3. **Is the pane actually rendering?** A hidden or non-compositing pane returns success for every click, with correct-looking coordinates, and lands nothing.
4. **Verify one click before trusting any of them.** Click a text field, then read `document.activeElement`. Anything other than the field means input is not arriving, and everything downstream is invented. Do not proceed.
5. **If clicks miss, switch coordinate space.** Element references and screenshot coordinates can disagree when the pane is scaled. Try the other one rather than concluding the page is broken.

If the user offers to just paste the scripts into their own console, take that. It has none of these problems.

## Step 0: get the goal before pulling anything

Ask what the posting is FOR. The answer decides which metric is the real one, and the whole audit is worthless without it.

| Goal | The metric that matters | The metric that lies |
|---|---|---|
| Get hired / found | Followers gained, profile views from post | Impressions |
| Build an audience | Followers gained per 1K impressions | Reactions |
| Drive to a product or repo | Link clicks, saves | Impressions |
| Be useful to peers | Saves, meaningful comments | Reactions |
| Sell | Profile views, DMs | Everything else |

If they say "engagement", push once. Engagement is not a goal, it is a proxy someone sold them.

## Step 1: collect the post list

Open `https://www.linkedin.com/in/<their-handle>/recent-activity/all/`.

Run `scripts/collect.js` in the browser console. It scrolls, accumulates, and survives the problem below.

**LinkedIn virtualizes this list.** Posts are removed from the DOM as you scroll past them. A naive "scroll to the bottom then read the page" loses most of the data and, worse, loses it silently. The script accumulates into `window.__liAudit` on every pass, so anything seen once is kept. This is not a theoretical concern: in the run this skill came from, the single best-performing post was missing from the activity page entirely and the analysis nearly shipped without it.

Note also that the scroll container differs by page. The activity page scrolls on `documentElement`; the main feed scrolls on `main`. The script detects this.

## Step 2: reconcile against the analytics dashboard

Do not trust the activity page to be complete. Open:

`https://www.linkedin.com/analytics/creator/content/?timeRange=past_90_days`

Cross-check its "top performing posts" against what you collected. Any post there that the collector missed, add by hand. Widen to a year if the account posts rarely.

If a post appears in analytics but not in the activity feed, the analytics number wins. It is the authoritative source.

## Step 3: pull deep metrics on the top and bottom posts

The activity page gives impressions and comments. Saves, followers gained, profile views and out-of-network share only exist on the per-post summary:

`https://www.linkedin.com/analytics/post-summary/<urn>/`

Do this for the top 5 and the bottom 5 by impressions, plus anything anomalous. Ten pages is enough to find the pattern and keeps the browsing modest. Run `scripts/post-summary.js` on each.

## Step 4: compute the ratios, not the totals

Totals reward whatever got lucky once. Ratios show what the writing did.

- **Followers gained per 1,000 impressions.** The single most useful number for anyone building a presence.
- **Saves.** The strongest available proxy for "useful enough to return to". Usually near zero, which is what makes a non-zero result loud.
- **Out-of-network share.** The algorithm's own verdict on whether strangers should see it. High share plus low engagement is the clearest negative signal available: distribution was granted and the audience declined.
- **Profile views from post.** Closest thing to intent.

## Step 5: find the discriminating comparison

The mistake here is comparing across a variable that co-varies with everything else, then crediting that variable. Someone will say "my posts in language X do better" when they have three of them and one is an outlier.

Look for **pairs that hold everything constant but one thing.** Same author, same topic, same language, close in time, very different outcome. Those pairs carry nearly all the information. One such pair beats twenty loosely comparable posts.

Check and report explicitly:
- Does the gap survive dropping the single best post? If not, say so.
- How many posts are in the smaller group? If it is under five, the finding is a hypothesis, not a result.
- Is the proposed cause confounded with format, topic, or recency?

## Step 6: report

Lead with the discriminating comparison, not a table. Then:

1. The metric they were watching and why it was wrong for their goal.
2. The pair that isolates the real driver.
3. What the winning posts did that the others did not, as concrete observable traits and not adjectives.
4. What is not working, said plainly. This is the part people skip and the part with the value in it.
5. Sample-size caveats, stated in the report and not buried.

## What tends to come out

Not laws. Starting hypotheses to test against their data, and each one has been wrong somewhere.

- Impressions and follower conversion are often uncorrelated, sometimes inverted.
- Posts that ship a usable artifact convert far better than posts that argue a position.
- Reproducible method plus named failures outperforms polished conclusions.
- Hashtags usually show no detectable effect.
- Personal and congratulatory posts reach well and convert badly.
- Language usually explains far less than it appears to.

Test each against the actual data. Report the ones that hold and the ones that do not.

## Honesty rules

- Report findings that contradict what the user believes, including about work they are attached to. That is most of the value.
- A single outlier is a hypothesis. Label it n=1 in the output.
- Do not manufacture a trend from four posts.
- If the data does not support a conclusion, say there is no conclusion yet.
