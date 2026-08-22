# Dubai British School Jumeirah Park — School Interconnectivity Platform

An interactive guide to the systems, processes and practices across Dubai British School Jumeirah Park and the ways they influence one another. The experience begins with six simple card-based entry points and reveals only the relationships relevant to the user's current focus, with an optional spacious full-school map showing all 30 items and 102 clearly directed relationships in either complete or focused mode.

## Files

- `index.html` — semantic page structure and metadata
- `styles.css` — responsive Dubai British School Jumeirah Park visual design
- `app.js` — unified navigation, item reveals, breadcrumbs, incoming/outgoing connection behaviour and the zoomable full-school map
- `data.js` — the 30 school items and 102 directed relationships
- `tools/extract-data.mjs` — regenerates `data.js` from the original map HTML
- `tools/validate.mjs` — checks counts, categories, IDs and relationship references

## Updating school content

Edit `data.js` for a small manual change. Each node has an `id`, `title`, `group` and `description`. Each relationship has a `source`, `target` and future-ready `type`; `source → target` means the source influences the target.

For a complete refresh from the original map, run:

```powershell
node tools/extract-data.mjs "C:\path\to\school-interconnectivity-map.html"
```

Keep node IDs stable, use only the six established category names, and check that every relationship refers to existing node IDs.

Validate the data model with `node tools/validate.mjs` before publishing.

## Preview locally

The site has no dependencies or build step. Open `index.html` directly, or serve the folder with any static web server.

## GitHub Pages

After merging to `main`, open the repository's **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then choose `main` and `/ (root)`. Future commits to `main` will update the same published URL automatically.
