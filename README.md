# confluence-mermaid

Free, open-source **Atlassian Forge** macro for **Confluence Cloud** that renders [Mermaid](https://mermaid.js.org/) diagrams **in the browser**.

- No backend functions
- No Confluence API scopes
- No external network calls
- Diagram source stays in the macro config on the page

Built to share with the community: fork it, register your own Forge app id, deploy to your site, and iterate.

## Requirements

- Node.js 20+
- An Atlassian account with access to a Confluence Cloud site
- [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/) (`npm i -g @forge/cli`)

## Quick start (contributors / testers)

```bash
git clone https://github.com/jfernandeze/confluence-mermaid.git
cd confluence-mermaid
npm run install:all
npm run build

forge login
forge register    # writes your app id into manifest.yml — do not commit someone else's id
forge deploy
forge install
```

When modules or permissions change later:

```bash
npm run build
forge deploy
forge install --upgrade
```

> **App id:** the repo ships with a placeholder `app.id`. Everyone who deploys must run `forge register` (or use their own id). Keep personal app ids out of PRs unless you own the published app.

Forks: change the clone URL to your fork, then follow the same steps.

## Usage

1. Edit a Confluence page.
2. Type `/mermaid` and insert the **Mermaid** macro.
3. Write diagram source (or keep the starter flowchart).
4. Choose a theme and click **Save diagram**.

## Project layout

```
manifest.yml          Forge app descriptor (zero scopes)
static/shared/        Mermaid render helper (DOMPurify + mermaid)
static/view/          Macro view (page render)
static/config/        Macro editor modal (source + live preview)
```

## Privacy model

The only declared permission is `content.styles: unsafe-inline`, which Mermaid needs for SVG `style` attributes. There is no `function` module, no `scopes`, and no `external` fetch — diagram data never leaves the Confluence page / reader browser via this app.

## Contributing

Issues and PRs are welcome. For local testing, use a Confluence Cloud developer site, keep `app.id` local to your Forge account, and describe the diagram types / browsers you verified.

## License

Apache-2.0
