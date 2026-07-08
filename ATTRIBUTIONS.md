# Attributions

Unlike the original Astro version of this theme, the Ghost theme itself ships **no bundled photography** — post, author, and feature images all live in Ghost's own media library (`content/images/`) rather than in the theme package, so there's no image-licensing surface here to track.

## Fonts

- [Archivo](https://fonts.google.com/specimen/Archivo) — Google Fonts, [SIL Open Font License](https://fonts.google.com/specimen/Archivo/license)
- [Newsreader](https://fonts.google.com/specimen/Newsreader) — Google Fonts, [SIL Open Font License](https://fonts.google.com/specimen/Newsreader/license)

Both are loaded directly from Google Fonts (`default.hbs`) — no local font files are shipped.

## Icons

No icon library is used. Every icon in the theme is a hand-authored inline SVG.

## Card assets

Audio, video, NFT, product, and file Koenig cards are styled and scripted by Ghost core's own default card assets (via the `card_assets` config in `package.json`), not by this theme — see `README.md` for details.

## Demo / seed content

`scripts/migrate-from-astro.mjs` is a one-time dev tool for pulling the original Astro version's demo articles into a Ghost instance for local testing. Any photography it imports comes from that separate Astro project's `src/assets/images/` and is **not** part of this theme package — if those images are ever used on a public-facing demo or marketing site, they need their own licensing review independent of this file (see the equivalent `ATTRIBUTIONS.md` in the Astro repo, which flags several of those images as unverified-source placeholders).
