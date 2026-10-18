# Cordelia's Portfolio

Portfolio site for a professional digital artist.

## Stack

- **Astro** (static output) for the site
- **Vercel** for hosting, deployed from GitHub on every push
- **Cloudinary** as the home for the artwork: full-resolution originals are stored there, and the site requests sized, AVIF/WebP versions for thumbnails and gallery views, with a link to the full-quality original
- **Astro content collections** (`src/content/artwork/`) for artwork details such as title, year, medium, and the Cloudinary image ID. No database.

## Folders

- `src/pages/` site pages
- `src/layouts/`, `src/components/` shared page structure and UI
- `src/content/artwork/` one entry per piece
- `public/` static files (favicon, etc.)
- `artwork-originals/` local, git-ignored staging area for full-res masters
- `docs/` planning notes

## Development

```bash
npm install
npm run dev
```
