# Security policy

## Reporting a vulnerability

Report privately, not as a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/jfernandeze/confluence-mermaid/security/advisories/new)
on this repository. If that is unavailable to you, email the address listed as the security contact
on the app's Atlassian Marketplace listing.

Please include what you can: affected version, the Confluence site type, steps to reproduce, and the
impact you believe it has. A proof of concept helps but is not required to report.

**Response targets**, on a best-effort basis for a free open-source project maintained by one person:

| Stage | Target |
|---|---|
| Acknowledgement | 3 working days |
| Initial assessment | 10 working days |
| Fix or mitigation for a confirmed issue | 30 days, sooner if actively exploited |

You will get credit in the advisory unless you ask otherwise. Please give us a chance to ship a fix
before disclosing publicly.

## What this app can and cannot reach

The attack surface is deliberately small, and this shapes what a vulnerability here could do:

- **No API scopes.** The app cannot read or write your pages, spaces, users, or any other Confluence
  content through the REST API. It has no token to do so.
- **No server-side code.** There is no `function` module, so there is no backend of ours running
  anywhere, and no server to compromise.
- **No external network calls.** The manifest declares no `external` permission. Diagram source
  never leaves the reader's browser.
- **The only permission declared** is `content.styles: unsafe-inline`, which Mermaid needs to place
  style attributes on the SVG it generates.

Diagram source is stored in the macro's configuration, which is part of the Confluence page. It
lives and dies with the page, under your site's own access controls.

Rendering runs Mermaid with `securityLevel: 'strict'` and passes the generated SVG through DOMPurify
before it reaches the DOM. The realistic classes of issue are therefore in that rendering path —
for example a sanitiser bypass leading to script execution inside the macro's iframe. Those are
worth reporting.

## Supported versions

The latest version published on the Atlassian Marketplace receives fixes. Because Forge apps
auto-upgrade, sites are normally on it already.

## Scope

In scope: this repository, and the Forge app published from it.

Out of scope: Atlassian's own platform, Confluence itself, and the upstream
[Mermaid](https://github.com/mermaid-js/mermaid) and [DOMPurify](https://github.com/cure53/DOMPurify)
projects. Report those to their maintainers — though telling us too is appreciated, so we can pin or
patch.
