---
name: confluence-mermaid
description: >-
  Insert or update Mermaid diagrams in Confluence Cloud via the confluence-mermaid
  Forge macro (ADF extension with guestParams/config). Use when the user asks for
  Confluence Mermaid, architecture/sequence/state diagrams on a wiki page, or
  AI/API page updates that should render as Mermaid SVG.
---

# confluence-mermaid (Confluence Cloud)

**Skill version:** 1.1.1

Render Mermaid in Confluence with the **confluence-mermaid** Forge app (block macro).
Source is stored in macro **config** / **guestParams** and rendered client-side.

> **Prerequisite:** the Forge app must already be installed on the target site. If it is not,
> every macro shows *Error loading the extension!* and nothing below will fix it — a site
> admin has to install the app first.

## When to use

- Create or edit a Confluence page that should show a Mermaid diagram
- User mentions `/mermaid`, Mermaid, flowchart, sequence, or state diagram in Confluence
- Prefer this over plain `codeBlock` Mermaid when the site has the app installed

## Step 0 — resolve the IDs you need

Do this **before** writing any ADF. Four values; do not ask the user for what you can look up.

| Value | How to get it |
|---|---|
| `cloudId` | `getAccessibleAtlassianResources` → `id` of the target site. A site hostname (`evalua.atlassian.net`) also works as `cloudId` in most tools. |
| `spaceId` | `getConfluenceSpaces` with `keys: "<SPACE_KEY>"` → `id`. For a **personal** space the key is `~<accountId>`; get the accountId from `atlassianUserInfo`. |
| `parentId` | Optional. Omit to nest under the space homepage. |
| `APP_ID` / `ENV_ID` | Table below for this org; see *Other sites* if the target is a different install. |

### Production IDs (evalua / published app)

| | |
|---|---|
| `APP_ID` | `efdf9273-2980-4c7b-9039-baf6371eb8da` |
| `ENV_ID` | `aa4638bc-29a8-4fd8-bbc9-634f11ccd440` |
| Macro key | `mermaid-diagram` |

### Other sites

Do not guess the IDs. In order of preference:

1. Read a page that already contains the macro: `getConfluencePage` with `contentFormat: "adf"`, then copy
   `attrs.extensionKey` verbatim — it is already `<APP_ID>/<ENV_ID>/static/mermaid-diagram`.
2. Search for one: CQL `type=page AND text ~ "mermaid-diagram"`.
3. If the app owner is at hand, `forge install --list` prints the app and environment ids.
4. Only then ask the user.

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

Themes: `default` | `neutral` | `dark` | `forest` | `base`. Prefer `neutral`.

## Sending the page

- `contentFormat: "adf"`.
- **`body` is a JSON *string***, not an object — serialize the whole document before passing it.
- The document is `{"type":"doc","version":1,"content":[ ... ]}`; the extension nodes are top-level
  children of `content`, alongside headings and paragraphs.
- Newlines inside `source` are `\n` escapes in that JSON string.
- Accented and non-ASCII text needs no special handling: Confluence stores it as HTML entities but
  the ADF round-trips clean.

## Workflow

1. Resolve IDs (Step 0).
2. Draft valid Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, …).
3. Build the ADF document with one `extension` node per diagram.
4. `createConfluencePage` / `updateConfluencePage` with `contentFormat: "adf"`.
5. Verify (below).
6. To change a diagram later, update `guestParams.source` **and** `config.source` together — keep them identical.

## Verify

Re-read the page with `getConfluencePage`, `contentFormat: "adf"`, and assert for **every** `extension` node:

- `attrs.extensionKey` has no `ari:cloud:ecosystem::extension/` prefix
- `attrs.parameters.config.source` is non-empty
- `attrs.parameters.guestParams.source` equals `config.source`

That catches essentially every insert-time failure and needs no browser.

A visual check (the Forge iframe actually painting an SVG) requires a **logged-in** browser session —
a headless agent cannot do it. Only Mermaid *syntax* errors survive the assertions above, so if the
round-trip is clean, hand the page URL to the user rather than claiming the diagram renders.

## Mermaid authoring tips

- Avoid `/` inside `|edge label|` text on Mermaid 11 (`REST ADF`, not `REST / ADF`).
- Avoid `-->` inside a node label — `A[from --> to]` breaks the parser. Write `A[from to]`.
- Quote labels containing `(`, `)`, `:` or `,`: `A["Config (modal)"]`.
- **Prefer `TB` over `LR` for chains longer than ~4 nodes.** The macro scales the SVG to the page
  column width, so a wide `flowchart LR` shrinks until the labels are unreadable at 100% zoom.
  Diagrams that grow downwards (`TB`, `sequenceDiagram`, `stateDiagram-v2`) keep their text size.
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
| Error loading the extension | Use short `extensionKey`, not full ARI — or the app is not installed on the site |
| Empty macro / no diagram | Ensure `source` is non-empty in **both** `config` and `guestParams` |
| Mermaid parse error | Simplify labels; check diagram type keyword and `\n` newlines |
| API rejects the body | `body` must be a JSON *string* with `contentFormat: "adf"` |
| Wrong site | Confirm app installed; use that install's APP_ID/ENV_ID (Step 0) |
