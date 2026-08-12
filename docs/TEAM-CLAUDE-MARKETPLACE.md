# Publish to Claude Code as an org plugin (admin)

This repo is also a **Claude Code plugin marketplace**: `.claude-plugin/marketplace.json` +
plugin under `plugins/confluence-mermaid/`. It shares the plugin directory with the
[Cursor Team Marketplace](./TEAM-CURSOR-MARKETPLACE.md) — one `skills/` folder, two manifests.

```text
.claude-plugin/marketplace.json                 catalog (marketplace: confluence-mermaid-marketplace)
plugins/confluence-mermaid/
├── .claude-plugin/plugin.json                  Claude Code manifest
├── .cursor-plugin/plugin.json                  Cursor manifest
└── skills/confluence-mermaid/SKILL.md          the skill itself (mirror of skills/…, do not edit here)
```

## Prerequisites

- The Forge app is installed on the target Confluence site (`evalua.atlassian.net`). Without it the
  skill produces pages that show *Error loading the extension!*
- Repo reachable by teammates: https://github.com/jfernandeze/confluence-mermaid
  (private repos require the user's git credentials to have access)

## How teammates install it

```bash
/plugin marketplace add jfernandeze/confluence-mermaid
```

```bash
/plugin install confluence-mermaid@confluence-mermaid-marketplace
```

Then in any session: `/confluence-mermaid`, or just ask for a Mermaid diagram on a Confluence page
and Claude picks it up from the skill description.

To pick up a later version: `/plugin marketplace update confluence-mermaid-marketplace`.

## Rolling it out to the whole organization

Two levels, pick one.

### A) Prompt-on-trust, per repository

Add to a repo's `.claude/settings.json` (committed). Teammates get prompted to install the
marketplace when they trust that project folder:

```json
{
  "extraKnownMarketplaces": {
    "confluence-mermaid-marketplace": {
      "source": {
        "source": "github",
        "repo": "jfernandeze/confluence-mermaid"
      }
    }
  },
  "enabledPlugins": {
    "confluence-mermaid@confluence-mermaid-marketplace": true
  }
}
```

`enabledPlugins` is optional — drop it if you want people to opt in themselves.

### B) Pushed by IT, everywhere

Same two keys, but in the **managed settings** file that your device management deploys, so nobody
has to add anything. That is an IT action, not a repo change.

| Platform | Managed settings path |
|---|---|
| Windows | `C:\ProgramData\ClaudeCode\managed-settings.json` |
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux | `/etc/claude-code/managed-settings.json` |

For evalua: start with **A** on the repos where people document architecture, and move to **B** if
adoption is good.

## Update the skill later

1. Edit the canonical `skills/confluence-mermaid/SKILL.md` — **never** the copies.
2. `npm run sync:skills` (mirrors it into `.claude/`, `.cursor/` and the plugin).
3. Bump `version` in **both** `plugins/confluence-mermaid/.claude-plugin/plugin.json` and
   `.cursor-plugin/plugin.json`, and in `.claude-plugin/marketplace.json`. Without a version bump
   users keep the cached copy.
4. Commit + push to `master`.
5. Teammates run `/plugin marketplace update confluence-mermaid-marketplace`.

`npm run check:skills` fails if any copy has drifted — worth wiring into CI so a stale skill never
ships to the team.

## Local smoke test before publishing

```bash
/plugin marketplace add ./
```

Run it from the repo root; Claude Code reads `.claude-plugin/marketplace.json` from the local path.
Install, then check that `/confluence-mermaid` appears in the skill list.

## Naming note

The marketplace is named `confluence-mermaid-marketplace`, matching the Cursor one. If you later
publish more org skills, rename it to something broader (for example `evalua-tools`) and list the
plugins together — a marketplace can hold many plugins, and each user can register only **one**
marketplace per name. Use the `renames` field in `marketplace.json` so existing installs migrate
automatically.
