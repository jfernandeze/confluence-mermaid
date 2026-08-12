# Privacy Policy — confluence-mermaid

Last updated: 2026-08-12

## Summary

**confluence-mermaid** is a free Atlassian Forge app for Confluence Cloud. It renders Mermaid diagrams in the user's browser. It does not collect, store, or transmit diagram content or personal data to the app developer.

## What the app does

- Stores Mermaid source and display options in the Confluence page macro configuration (Atlassian-hosted page content).
- Renders diagrams client-side inside the Forge iframe using Mermaid and DOMPurify.
- Requests no Confluence API scopes and declares no external network access.
- Declares only the Forge permission needed for Mermaid SVG inline styles (`content.styles: unsafe-inline`).

## Data we do not collect

We do not operate a backend for this app. We do not receive:

- Mermaid diagram source or rendered images
- Confluence page content
- User profiles, emails, or account identifiers via this app
- Analytics or tracking data from the macro UI

## Data processed by Atlassian

When you install and use the app, Atlassian processes installation and runtime data under their terms as the Forge platform provider. Diagram source remains in your Confluence site as page content.

## Contact

For privacy questions about this open-source app, open an issue at:

https://github.com/jfernandeze/confluence-mermaid/issues

Or contact the maintainer via the GitHub profile associated with that repository.

## Changes

We may update this policy as the app evolves. The latest version will live in this file in the public repository.
