# Publish to Cursor Team Marketplace (admin)

This repo is a **Team Marketplace** source: `.cursor-plugin/marketplace.json` + plugin under `plugins/confluence-mermaid/`.

## Prerequisites

- Cursor **Teams** or **Enterprise** plan
- You are a **team admin**
- Repo on GitHub: https://github.com/jfernandeze/confluence-mermaid  
  (private repos need the [Cursor GitHub App](https://cursor.com/docs/integrations/github.md) with access)

## Import (one-time)

1. Open [Cursor Dashboard → Plugins](https://cursor.com/dashboard?tab=plugins)
2. Under **Team Marketplaces**, click **Add Marketplace** / **Import from Repo**
3. Paste: `https://github.com/jfernandeze/confluence-mermaid`
4. Confirm Cursor parses the plugin **confluence-mermaid**
5. Set **Marketplace Access** (whole team or Organization Groups)
6. Optionally enable **Auto Refresh** (needs GitHub App on the repo)
7. Save

## Installation mode for the plugin

In the marketplace settings, set **confluence-mermaid** to:

| Mode | Effect |
|---|---|
| **Default Off** | Teammates install from **Customize** when they want |
| **Default On** | Installed for everyone; they can opt out |
| **Required** | Always on; cannot uninstall |

Suggested: start with **Default On**, or **Required** if everyone should insert Mermaid via AI.

## How teammates use it

1. Open **Customize** in Cursor → find **Confluence Mermaid** from the team marketplace
2. Install (if Default Off)
3. In Agent chat: `/confluence-mermaid` or ask to add a Mermaid diagram to Confluence

## Update the skill later

1. Edit `plugins/confluence-mermaid/skills/confluence-mermaid/SKILL.md` (keep `skills/` and `.cursor/skills/` in sync if you still use those)
2. Bump `version` in `plugins/confluence-mermaid/.cursor-plugin/plugin.json`
3. Commit + push to `master`
4. Dashboard → Refresh marketplace (or wait for Auto Refresh)

## Local smoke test (optional)

```text
%USERPROFILE%\.cursor\plugins\local\confluence-mermaid
```

Copy `plugins/confluence-mermaid/*` there, then **Developer: Reload Window**, and check Customize for the skill.
