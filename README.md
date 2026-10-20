# Cordelia's Portfolio

Portfolio site for a professional digital artist.

## Stack

- **Astro** (static output) for the site
- **Vercel** for hosting (Cordelia's account), deployed from GitHub on every push to `main`
- **Sanity** as the content manager and image host: Cordelia uploads full-resolution originals and fills in title, year, medium and description in Sanity Studio. The site requests sized AVIF/WebP versions from Sanity's image CDN for thumbnails and gallery views, with a link to the full-quality original. No separate database.

## Editing the home page

In Sanity Studio, switch on **Include on landing page** for any artwork to add it to the full-screen slideshow. Open **Landing page** to drag pieces into order, change the seconds per piece, pick the transition, edit the name card text, and set her Instagram, Cara and LinkedIn links. The site reads Sanity when it builds, so changes appear after the next deploy.

## Projects

Each **Project** in the Studio has a title, an optional description, a card image (crop it to a tall poster shape) and an ordered list of pieces. Drag cards into order on **Projects page**. Any piece can carry an MP4 in its Video field; the gallery shows its image with a play button.

## Folders

- `src/pages/` site pages
- `src/layouts/`, `src/components/` shared page structure and UI
- `studio/` Sanity Studio (the admin where artwork is managed), connected to Sanity project `ke2xjwml` (dataset `production`)
- `public/` static files (favicon, etc.)
- `artwork-originals/` local, git-ignored staging area for full-res masters
- `docs/` planning notes

## Development

```bash
npm install
npm run dev            # website

cd studio && npm install
npm run dev            # Sanity Studio
```
