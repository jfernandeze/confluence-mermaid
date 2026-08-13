# Distribution map

This repo ships **two products** that travel through different channels. Confusing them is the
main way this goes wrong, so start here.

| Product | What it does | Channel | Installed by |
|---|---|---|---|
| **Forge app** (`manifest.yml`, `static/`) | Renders the SVG inside the Confluence page | Atlassian Marketplace | A Confluence admin, per site |
| **Agent skill** (`skills/confluence-mermaid/SKILL.md`) | Teaches an AI agent the exact ADF node to insert | Claude Code plugin · Cursor Team Marketplace · claude.ai Organization skills | A Claude/Cursor admin, per org |

Both are required. Without the app, the skill produces pages that show *Error loading the
extension!*. Without the skill, the app works but only by hand via `/mermaid`.

## The IDs are app-scoped, not site-scoped

`APP_ID` and `ENV_ID` belong to the **Forge app**, not to each installation. Every site that
installs the published app resolves the same `extensionKey`:

```text
<APP_ID>/<ENV_ID>/static/mermaid-diagram
```

So the IDs hardcoded in `SKILL.md` are correct for **every** company that installs this app from
the Marketplace — the skill needs no per-customer parameterization. The whole repo contains exactly
one pair of IDs, and that pair has been used against two different Confluence sites.

The consequence to watch: if the Marketplace listing is ever created against a **new** Forge app
instead of `efdf9273-…`, the IDs change and must be updated everywhere they appear (`README.md`,
`skills/…/SKILL.md`, and the two mirrors + plugin copy, all handled by `npm run sync:skills`).

## Skill channels

One canonical file, four copies, three audiences.

```text
skills/confluence-mermaid/SKILL.md          canonical — the only file you edit
├── .claude/skills/…/SKILL.md               this repo, Claude Code
├── .cursor/skills/…/SKILL.md               this repo, Cursor
└── plugins/confluence-mermaid/skills/…     what teammates actually receive
```

`npm run sync:skills` mirrors the canonical file into all three. `npm run check:skills` exits
non-zero if any has drifted — wire it into CI, because the plugin copy is the one that ships and it
has silently gone stale before.

| Channel | Reaches | Updates | Status |
|---|---|---|---|
| Claude Code plugin marketplace | Claude Code users | `claude plugin marketplace update` (pulls from GitHub) | Live — installed and verified at 1.1.0 |
| claude.ai Organization skills | claude.ai / Desktop / Cowork users | Manual re-upload of a zip | Live on the evalua org |
| Cursor Team Marketplace | Cursor users | Dashboard refresh | Structure in repo; import not yet done |
| Atlassian Marketplace (the app) | Any company's Confluence | Atlassian review | **Not submitted** — see [MARKETPLACE.md](../MARKETPLACE.md) |

Per-channel instructions: [TEAM-CLAUDE-MARKETPLACE.md](./TEAM-CLAUDE-MARKETPLACE.md),
[TEAM-CURSOR-MARKETPLACE.md](./TEAM-CURSOR-MARKETPLACE.md).

### Claude Code

```bash
claude plugin marketplace add jfernandeze/confluence-mermaid
```

```bash
claude plugin install confluence-mermaid@confluence-mermaid-marketplace
```

The CLI works from any terminal; the interactive `/plugin` panel inside Claude Code is equivalent.
For org-wide rollout without asking anyone to type anything, see the `extraKnownMarketplaces` and
`enabledPlugins` settings in [TEAM-CLAUDE-MARKETPLACE.md](./TEAM-CLAUDE-MARKETPLACE.md).

### claude.ai Organization skills

Admin console → **Skills** → *Organization skills* → **Add**, and upload a zip containing
`confluence-mermaid/SKILL.md`. Rebuild it after any skill change:

```bash
npm run sync:skills
```

then zip `skills/confluence-mermaid/`. This channel does **not** auto-update from GitHub — every
edit needs a fresh upload, which is the most likely source of version skew between teams.

Members also need the **Atlassian connector** enabled. The skill describes the ADF node; the
connector is what actually writes to Confluence.

## Release checklist for a skill change

1. Edit `skills/confluence-mermaid/SKILL.md` — never a copy.
2. Bump the `**Skill version:**` line in that file, and the `version` in all four manifests:
   `plugins/confluence-mermaid/.claude-plugin/plugin.json`,
   `plugins/confluence-mermaid/.cursor-plugin/plugin.json`, `.claude-plugin/marketplace.json`
   (both places), and `.cursor-plugin/marketplace.json`. Without a bump, installed users keep the
   cached copy.
3. `npm run sync:skills`
4. `npm run check:skills` — fails on a drifted copy *or* a version that disagrees with the skill.
5. `claude plugin validate .` and `claude plugin validate ./plugins/confluence-mermaid`
6. Commit, push to `master`. Claude Code and Cursor users pull from here.
7. `npm run pack:skill`, then upload the zip to claude.ai Organization skills. This step is manual
   and is the one that gets forgotten — the version line inside the skill is what lets you tell,
   later, which copy someone actually got.

The organization has Cowork-only users, Claude Code-only users, and people on both, so both channels
must stay live and people in the overlap will see the skill twice. That is harmless while the
versions match, which is what step 4 enforces.

## Verified vs not

Verified:

- API insert round-trips: three `extension` nodes re-read from Confluence with `contentFormat: adf`
  keep the short `extensionKey` and identical non-empty `source` in `guestParams` and `config`.
- Both plugin manifests pass `claude plugin validate`.
- `claude plugin marketplace add` + `install` from GitHub succeed; the installed `SKILL.md` is
  byte-identical to the canonical one.
- `check:skills` detects real drift (it caught the stale plugin copy).
- **Visual render**, in a browser on the live page: flowchart, sequence and state all paint their
  SVG, with correct edge labels and no *Error loading the extension!*. This also surfaced a defect
  the round-trip assertions cannot see — wide `flowchart LR` graphs are scaled down to the column
  width until their labels are unreadable, now covered in the skill's authoring tips.

Not verified:

- **Skill invocation from the installed plugin** in a fresh session (as opposed to the repo-local
  copy).
- The Cursor Team Marketplace import.
