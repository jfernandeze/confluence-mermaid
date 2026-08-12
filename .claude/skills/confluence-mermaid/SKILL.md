---
name: confluence-mermaid
description: >-
  Insert or update Mermaid diagrams in Confluence Cloud via the confluence-mermaid
  Forge macro (ADF extension with guestParams/config). Use when the user asks for
  Confluence Mermaid, architecture/sequence/state diagrams on a wiki page, or
  AI/API page updates that should render as Mermaid SVG.
---

# confluence-mermaid (Confluence Cloud)

Render Mermaid in Confluence with the **confluence-mermaid** Forge app (block macro).
Source is stored in macro **config** / **guestParams** and rendered client-side.

## When to use

- Create or edit a Confluence page that should show a Mermaid diagram
- User mentions `/mermaid`, Mermaid, flowchart, sequence, or state diagram in Confluence
- Prefer this over plain `codeBlock` Mermaid when the site has the app installed

## Production IDs (evalua / published app)

| | |
|---|---|
| `APP_ID` | `efdf9273-2980-4c7b-9039-baf6371eb8da` |
| `ENV_ID` | `aa4638bc-29a8-4fd8-bbc9-634f11ccd440` |
| Macro key | `mermaid-diagram` |

If the site uses a different Forge install, ask for that site's `APP_ID` / `ENV_ID`.

## ADF node (required shape)

Use type **`extension`** (block). Put the **same** Mermaid `source` (and `theme`) in both `guestParams` and `config`.

**Do:**

- Short `extensionKey`: `<APP_ID>/<ENV_ID>/static/mermaid-diagram`
- `extensionType`: `com.atlassian.ecosystem`
- `forgeEnvironment`: `PRODUCTION` for production installs

**Do not:**

- Use `bodiedExtension` for this app's current layout
- Prefix `extensionKey` with `ari:cloud:ecosystem::extension/` (often → *Error loading the extension!*)
- Put source only in a page `codeBlock` and expect the Forge macro to pick it up

```json
{
  "type": "extension",
  "attrs": {
    "layout": "default",
    "extensionType": "com.atlassian.ecosystem",
    "extensionKey": "efdf9273-2980-4c7b-9039-baf6371eb8da/aa4638bc-29a8-4fd8-bbc9-634f11ccd440/static/mermaid-diagram",
    "parameters": {
      "forgeEnvironment": "PRODUCTION",
      "extensionId": "ari:cloud:ecosystem::extension/efdf9273-2980-4c7b-9039-baf6371eb8da/aa4638bc-29a8-4fd8-bbc9-634f11ccd440/static/mermaid-diagram",
      "extensionTitle": "Mermaid",
      "guestParams": {
        "theme": "neutral",
        "source": "flowchart LR\n  A[API] --> B[SVG]"
      },
      "config": {
        "theme": "neutral",
        "source": "flowchart LR\n  A[API] --> B[SVG]"
      }
    }
  }
}
```

Themes: `default` | `neutral` | `dark` | `forest` | `base`.

## Workflow

1. Draft valid Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.).
2. Escape newlines as `\n` inside the JSON `source` string.
3. Create/update the page with ADF that includes the extension node above (Atlassian MCP: `contentFormat: "adf"`, or Confluence REST with ADF body).
4. To change a diagram later, update `guestParams.source` and `config.source` together (keep them identical).
5. Verify in the browser: Forge iframe should show SVG (not empty / not *Error loading the extension!*).

## Mermaid authoring tips

- Prefer simple edge labels; avoid `/` inside `|label|` text on Mermaid 11 (`REST ADF` not `REST / ADF`).
- Keep diagrams readable; split into multiple macros if huge.
- For humans editing later: they can use `/mermaid` and the config modal (same `source` field).

## Good starter diagrams

**Flowchart**

```text
flowchart TB
  subgraph Authors
    AI[AI]
    Dev[Developer]
  end
  AI -->|REST ADF| Page[Page]
  Dev -->|slash command| Page
  Page --> SVG[SVG]
```

**Sequence**

```text
sequenceDiagram
  autonumber
  actor U as User
  participant C as Confluence
  participant A as Mermaid app
  U->>C: Open page
  C->>A: Load macro
  A-->>C: SVG
```

**State**

```text
stateDiagram-v2
  [*] --> Draft
  Draft --> Published: save
  Published --> [*]
```

## If insert fails

| Symptom | Fix |
|---|---|
| Error loading the extension | Use short `extensionKey`, not full ARI |
| Empty macro / no diagram | Ensure `source` is non-empty in **both** `config` and `guestParams` |
| Mermaid parse error | Simplify labels; check diagram type keyword and newlines |
| Wrong site | Confirm app installed; use that install's APP_ID/ENV_ID |
