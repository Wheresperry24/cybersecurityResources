# Cybersecurity Resources

A static, curated collection of cybersecurity tools, frameworks, training platforms, and reference materials..

## Features

- **Category-based organization** — Resources grouped into logical categories
- **Multi-tag filtering** — Select multiple tags to narrow results (AND logic)
- **Live tag counters** — See how many resources match each tag in real time
- **Collapsible categories** — Expand/collapse sections, all open by default
- **Download labels** — Downloadable resources display a colored badge
- **Alphabetical sorting** — Resources sorted A-Z within each category
- **Responsive layout** — Works on desktop and mobile
- **Dark theme** — Minimal, sharp-edged design
- **Error handling** — Graceful messages for missing or malformed JSON
- **Static deployment** — Optimized for Cloudflare Pages, GitHub Pages, etc.

## Project Structure

```
cybersecurityResources/
├── public/                     # Cloudflare Pages build output directory
│   ├── index.html              # Main HTML page
│   ├── css/
│   │   └── style.css           # All styles (dark theme, responsive)
│   ├── js/
│   │   └── app.js              # JSON loading, rendering, filtering
│   └── data/
│       └── resources.json      # Resource data (edit this to add/remove resources)
└── README.md
```

## Adding Resources

Edit `public/data/resources.json`. Each resource object supports:

```json
{
  "title": "Resource Name",
  "url": "https://example.com",
  "description": "Brief description of the resource.",
  "category": "Category Name",
  "tags": ["tag1", "tag2", "tag3"],
  "type": "website",
  "downloadable": false
}
```

| Field          | Required | Description                                          |
|----------------|----------|------------------------------------------------------|
| `title`        | Yes      | Display name of the resource                         |
| `url`          | Yes      | Link URL (opens in new tab)                          |
| `category`     | Yes      | Grouping category                                    |
| `description`  | No       | Short description shown beside the link              |
| `tags`         | No       | Array of tags for filtering                          |
| `type`         | No       | `"website"` or `"download"`                          |
| `downloadable` | No       | `true` shows a colored download badge                |

## Deployment

### Cloudflare Pages

1. Push this repository to GitHub
2. Connect the repo in the Cloudflare Pages dashboard
3. Set **Build command** to `exit 0`
4. Set **Build output directory** to `public`

### Local Development

Serve the `public` directory with any static file server:

```bash
# Python
cd public && python -m http.server 8000

# Node.js
npx serve public
```

> **Note:** `fetch()` requires a server — opening `index.html` directly via `file://` won't load the JSON in most browsers.

## License

MIT
