---
codebase_path: /Users/akoskristof/Projects/fife-app-expo
created: '2026-08-21T01:13:12+00:00'
id: f5eb
priority: unset
status: raw
title: Kéne egy admin site, ahol tudok hírlevelet küldeni egy formmal.
updated: '2026-08-21T01:20:46+00:00'
---

## Notes

Több mindent is szeretnék majd a jövőben az admin-ra tenni, egyelőre csak a hírleveleket szeretném követni.

## Claude Analysis

_Last generated: 2026-08-21 01:14 UTC (codebase: none)_

### Not enough info!! Tell me more! What for, what will be in it?

The notes only say (translated from Hungarian): *"I'd like to add more things to the admin panel in the future, but for now I just want to track newsletters."* That's it — no details on:

- What "the admin" is (a web app admin panel? a CMS? a custom dashboard?)
- What "tracking newsletters" means concretely — sent history? subscriber list? open/click rates? scheduling? drafting content?
- Who uses this admin — just you, or a team?
- What platform/stack the newsletters currently run on (Mailchimp, custom SMTP, a homegrown sender?)
- What "more things" you're planning to eventually bolt onto the admin (this affects whether newsletter tracking should be built as a standalone module or as the first piece of a larger admin framework)

Before building anything, it'd help to clarify: is this a brand-new admin panel being created from scratch just to house newsletter tracking, or does an admin panel already exist somewhere that this feature gets added to?

### Priority?

Unclear from the notes, but the phrasing ("egyelőre csak" — "for now, just") suggests newsletter tracking is the immediate, scoped priority, with everything else explicitly deferred. So: **high priority for newsletter tracking specifically, low/no priority for anything else in the admin right now.**

### What are the potential problems with the idea?

- **Scope creep risk**: "more things in the future" with no list invites the admin panel to sprawl unpredictably if each future feature isn't scoped before building.
- **No defined data source**: without knowing where newsletter data comes from (a sending service's API, a database table, manual entry), "tracking" can't be designed — is it read-only reporting or does it also send/manage newsletters?
- **Building for an unknown future**: designing the admin's architecture now to "leave room" for unspecified future features can lead to premature abstraction — better to build narrowly for newsletters and refactor when the next feature is actually known.
- **Access/auth**: an admin panel implies some form of authentication/authorization that isn't mentioned at all — a real security gap if skipped.
- **Ambiguous success criteria**: "track" is vague enough that a built feature could miss the actual need (e.g., you wanted subscriber counts, but get send logs instead).

### What we gain with the idea

- Visibility into newsletter activity (sends, subscribers, engagement — whichever ends up being tracked) in one central place.
- A foundation (the admin panel) that can be extended incrementally as new needs surface, without having to build a new tool from scratch each time.
- Reduced reliance on manually checking a third-party newsletter tool/dashboard, if the goal is to consolidate.

### 3 Ways to achieve the goal

1. **Minimal tracking table**: A simple admin page listing newsletters sent (date, subject, recipient count) pulled from an existing database table or sending service's API/webhook logs — no new sending logic, just visibility.
2. **Embed/proxy an existing provider's dashboard or stats**: If newsletters are sent via a service like Mailchimp/SendGrid, pull their stats via API into your admin UI instead of building storage yourself.
3. **Full newsletter management module**: Build tracking plus authoring/sending/scheduling inside the admin panel, treating this as the first vertical slice of a larger admin system.

### 3 alternatives

1. **Skip building admin UI, use the provider's native dashboard** — if you're using a third-party newsletter service, its own analytics might already answer "how are newsletters doing" without any custom work.
2. **A simple scheduled report** (e.g., a weekly email or Slack message summarizing newsletter stats) instead of an interactive admin page — lower build cost if you just need visibility, not interaction.
3. **A spreadsheet/log with manual or semi-automated entry** as a stopgap — useful if newsletter volume is low and a full admin feature isn't worth the investment yet.

### An image how should it look like

No visual style, brand, or layout details were given, so this is a generic guess at a minimal newsletter-tracking admin page:

```
┌─────────────────────────────────────────────┐
│  Admin                                  ⚙ 👤 │
├───────────┬─────────────────────────────────┤
│ Dashboard │  Newsletters                     │
│ Newsletters│ ┌─────────────────────────────┐ │
│ (future)  │ │ Search...        [+ New]     │ │
│ (future)  │ └─────────────────────────────┘ │
│           │                                   │
│           │  Date       Subject        Sent  │
│           │  2026-08-14 Weekly Update   1,204 │
│           │  2026-08-07 Product News      980 │
│           │  2026-07-31 Summer Promo    1,150 │
│           │                                   │
└───────────┴─────────────────────────────────┘
```

Left sidebar with "Newsletters" as the active item and empty space reserved for future modules; main panel a simple table of past newsletters.
