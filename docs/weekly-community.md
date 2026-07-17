# Weekly community operations

The weekly loop uses the free Kit and Tally APIs plus GitHub Actions. It does not require Kit Creator Pro, Tally Pro, an application server, or a database.

## One-time setup

1. In Kit, open **Settings → Developer → V4 Keys**, create a key named `foidslop-github-actions`, and copy it immediately.
2. In Tally, open **Settings → API keys**, create a key named `foidslop-github-actions`, and copy it.
3. In GitHub repository **Settings → Secrets and variables → Actions**, create repository secrets named `KIT_API_KEY` and `TALLY_API_KEY` with those values.
4. Run the **Weekly Slop Community Loop** workflow manually with mode `dry-run`, operation `open`, and poll `2026-07-24`.
5. Run it again with mode `bootstrap` and poll `2026-07-24`. This snapshots the existing form, preserves its styles and evidence fields, adds the `poll_id` hidden field, and updates the live choices.
6. During initial setup, keep `newsletter.automationEnabled` false and run mode `dispatch` for the same poll to create a Kit draft.
7. Review the draft and complete the Kit settings below. After the test email, confirmation, reply, and unsubscribe flow all work, change `newsletter.automationEnabled` to `true`. The live configuration is now enabled.

The Sunday schedule then opens the poll, publishes the site, and schedules the dispatch for 10 AM New York time. Thursday runs just after 6 PM New York time and resolves the vote. A shared workflow concurrency group prevents daily and weekly publishing from pushing at the same time.

## Kit form and confirmation design

In the Kit form's **General** settings:

- After subscribe: redirect to `https://foidslop.com/check-inbox`
- After confirming: redirect to `https://foidslop.com/subscribed`
- From address: `foidslop <dispatch@foidslop.com>`
- Reply-to: `dispatch@foidslop.com`
- Auto-confirm new subscribers: off

Use Kit's free Text Only or default email template. Do not add a remote font, header image, or tracking script. Where the free editor exposes colors, use:

- Background: `#f4f1e8`
- Text: `#171815`
- Button or accent: `#ef4a35`
- Maximum content width: 600px

If Kit does not expose the button-color control on the free plan, use its native black or monochrome button rather than Kit blue.

Set the confirmation email to:

- Subject: `Confirm The Weekly Slop`
- Masthead: `FOID SLOP / THE WEEKLY SLOP`
- Heading: `ONE LAST CLICK.`
- Body: `Confirm that you want seven dinners for one and one short note every Sunday.`
- Button: `Confirm my subscription`
- Final line: `If you did not request this, ignore this email.`

Keep Kit's required mailing address, unsubscribe/profile links, and free-plan branding. Send a real test, reply to it, and verify that `dispatch@foidslop.com` reaches the intended inbox. Free Cloudflare Email Routing can provide forwarding if the address currently sends but does not receive.

## Tally design contract

The automation patches the complete existing form and changes only the poll question, its three stable option blocks, the supporting deadline/result text, required state, redirect, and hidden poll identifier. It must preserve the report, photo, alias, publication permission, rights confirmation, logo, and all other blocks.

Keep the free Tally design at:

- Background: `#08090b`
- Text: `#f4f1e8`
- Accent and button: `#ef4a35`
- Font: Inter
- Page width: 700px
- Logo: 72px
- Inputs: dark surface with a subtle light border
- Completion redirect: `https://foidslop.com/#table`

Do not enable paid custom CSS. The same form stays available for notes and photos after voting closes; late poll answers are ignored by the resolver.

## Manual and recovery commands

All commands accept `--date YYYY-MM-DD` or `--poll YYYY-MM-DD`.

```sh
node scripts/weekly-community.js queue-check
node scripts/weekly-community.js open --poll 2026-07-24 --dry-run
node scripts/weekly-community.js resolve --poll 2026-07-24 --dry-run
node scripts/weekly-community.js dispatch --poll 2026-07-24 --dry-run
node scripts/weekly-community.js dispatch --poll 2026-07-24
node scripts/weekly-community.js dispatch --poll 2026-07-24 --send
```

Without `--send`, dispatch follows `newsletter.automationEnabled`. Kit broadcasts use the description marker `foidslop-weekly:<Sunday date>`, so rerunning a draft or scheduled week updates it instead of creating another copy.

If a publish fails after changing Tally, the workflow restores the temporary form snapshot automatically. It never force-pushes. Raw Tally submissions are held in memory only; Git and workflow logs receive aggregate counts.
