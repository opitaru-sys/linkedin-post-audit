# linkedin-post-audit

Audit your own LinkedIn posts against the outcome you actually wanted, instead of against impressions.

Impressions are the easiest number on LinkedIn to grow and frequently the least connected to what you were trying to do. This is a skill file plus two console scripts that pull the numbers that are connected, from your own analytics, and tell you which of your posts actually worked.

Read-only. Your own account only. It reads pages you are already logged into and already own, and it never posts, edits, follows, messages, or sends anything.

## Why this exists

I graded my own posting on impressions for a year. Then I pulled fourteen months of my own analytics properly and found this:

| | Best post by impressions | A post from three weeks ago |
|---|---|---|
| Impressions | 15,312 | 6,512 |
| Followers gained | 7 | 11 |
| Saves | 0 | 42 |
| Followers per 1K impressions | 0.46 | 1.69 |

Less than half the reach, more followers, and the only post in fourteen months anyone saved. The number I had been watching was not attached to the thing I wanted.

That is a measurement problem before it is a content problem, which is the reason this is a skill and not a growth checklist.

## Use it

There are two paths and the manual one is genuinely easier. Start there.

### By hand (no setup)

Open your activity page, open devtools, paste `scripts/collect.js` into the console, run `__liAudit.run()`. Then open the pages `__liAudit.summaryUrls()` gives you and paste `scripts/post-summary.js` into each.

```
https://www.linkedin.com/in/<your-handle>/recent-activity/all/
```

That is the whole thing. You are already logged in, so there is nothing to connect and nothing to authorize.

### With an agent (Claude Code and similar)

Drop `SKILL.md` in your skills directory and ask it to audit your LinkedIn. It will ask what your posting is for before pulling anything, because that answer decides which metric is the real one.

This path is more convenient once it works and it has real setup friction. Read the next section before you start.

## Setup friction on the agent path

None of this applies if you are pasting into your own console. All of it applies if an agent is driving a browser for you.

- **The agent needs a browser pane already logged into your LinkedIn.** It should never log in for you and never touch your credentials. If it lands on a login form or a security checkpoint, the correct behaviour is to stop and tell you, not to work around it.
- **The pane has to actually be on screen and rendering.** If it is minimised, hidden, or not compositing, something worse than an error happens: every click reports success, with plausible coordinates, and nothing lands. You get silence, not a failure.
- **Check the pane size first.** A pane that comes up small (I have seen 393x419) breaks clicking entirely. Resize to something like 1280x900 before anything else.
- **Verify a click before typing into anything.** Click the target, then read `document.activeElement`. If it is still `BODY`, input is not reaching the page and everything after that point is fiction. This one check is worth more than any amount of retrying.
- **Clicks can be dispatched in a different coordinate space than the one the accessibility tree reports.** When the pane is scaled, coordinates read off a screenshot work and element references do not. If clicks are missing, switch spaces and retry rather than assuming the page is broken.
- **LinkedIn may interrupt with a security-key enrolment prompt.** In my case it repeatedly asked to register a USB hardware key for two-factor auth, and it was modal enough to block the whole session. **An agent must never touch this.** It is a security setting and an authentication credential, two categories no automation should act on for you, and the physical key is in your hand anyway. The correct behaviour is to stop, say what is on screen, and let you enrol or dismiss it yourself. The run continues normally afterwards.
- **Expect a harness permission prompt the first time.** Depending on the tool, the first attempt to drive the browser may raise a dialog you have to approve before anything proceeds.

The general shape: this is a read-only job, so if something is stuck, stop and look rather than pushing through. A silent no-op is the failure mode to watch for, not a crash.

## Side effects

Small, local, and reversible. The scripts write your collected data to `localStorage` on linkedin.com so a page reload does not lose the collection. Clear it with `__liAudit.reset()`. Nothing is sent anywhere, and nothing on LinkedIn's side is modified.

## The one bug worth knowing about

LinkedIn virtualizes the activity list. Posts are dropped from the DOM as you scroll past them, so scrolling to the bottom and reading the page loses most of your history and loses it silently.

`collect.js` accumulates on every pass and persists to localStorage instead. This is not hypothetical. My single best-performing post was missing from the activity page entirely, and the analysis nearly shipped without it. Always reconcile what you collect against the analytics dashboard:

```
https://www.linkedin.com/analytics/creator/content/?timeRange=past_90_days
```

If a post shows up there and not in your collection, the dashboard is right.

## What it looks at

- **Followers gained per 1,000 impressions.** The most useful single number if you are trying to be found.
- **Saves.** The best available proxy for "useful enough to come back to". Usually zero, which is what makes a real number loud.
- **Out-of-network share.** The algorithm's own verdict on whether strangers should see it. A high share with low engagement is the clearest bad sign there is, because distribution was granted and the audience declined it.
- **Profile views from post.** The closest thing to intent.

## What it will probably tell you

Hypotheses to test against your data, not laws. Each has been wrong somewhere.

- Impressions and follower conversion are often uncorrelated and sometimes inverted.
- Posts that ship a usable artifact convert far better than posts that argue a position.
- A reproducible method with named failures beats a polished conclusion.
- Hashtags usually show no detectable effect.
- Personal and congratulatory posts reach well and convert badly.
- Language explains much less than it looks like it does.

## Limits, stated up front

- One account's data is one account's data. Findings here are starting points for your own audit, not conclusions about LinkedIn.
- The artifact finding that prompted this rests on a single post. It is the strongest signal in my data by a wide margin and it is still n=1.
- The scripts read LinkedIn's rendered DOM, so LinkedIn can break them at any time without warning. If a field comes back null, the selector moved.
- Posts older than roughly eight months sit in a different algorithm era and are weak evidence for what happens now.

## Licence

MIT. Take it, change it, no attribution needed.
