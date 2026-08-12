# Marketplace listing checklist (free app)

Order matters:

1. **Install on evalua first** via Developer Console install link (while logged in as `jose.fernandez@eugen.solutions`).
2. **Then** submit to Marketplace — after submission, private install links for this app stop working.

## Already done

- [x] App registered in Developer Space `confluence-mermaid`
- [x] Deployed to **production**
- [x] Tested on personal site `karruchero.atlassian.net`
- [x] Privacy policy: [PRIVACY.md](./PRIVACY.md)
- [x] Open source Apache-2.0 repo

## You do in the browser (personal Forge owner account)

### A) Install on company site (do this before Marketplace submit)

1. Open https://developer.atlassian.com/console/myapps/efdf9273-2980-4c7b-9039-baf6371eb8da/distribution
2. Enable **Sharing** if not already.
3. Copy the installation link.
4. Open that link while logged into Atlassian as **jose.fernandez@eugen.solutions**.
5. Install on **evalua.atlassian.net** → Confluence → production.

### B) Marketplace listing (free)

1. Keep Sharing enabled in Distribution.
2. Create / open Marketplace partner account for your Developer Space.
3. Create listing: https://marketplace.atlassian.com/manage/apps/create
4. Choose **Forge app** and select `confluence-mermaid`.
5. Set pricing to **Free**.
6. Fill listing fields:
   - Name: `confluence-mermaid` (or a friendlier public name)
   - Category: diagrams / documentation visuals
   - Short + long description (client-side Mermaid, no scopes, open source)
   - Privacy policy URL:  
     `https://github.com/jfernandeze/confluence-mermaid/blob/master/PRIVACY.md`
   - Support / source:  
     `https://github.com/jfernandeze/confluence-mermaid`
   - Screenshots from the working macro on karruchero or evalua
7. Submit for Atlassian review (often ~1 week).

## Notes

- Free Forge apps do **not** need `app.licensing.enabled` in `manifest.yml`.
- Do not commit your personal `app.id` from local `manifest.yml` to GitHub.
- After Marketplace approval, company users can install from **Apps → Find new apps** on evalua.
