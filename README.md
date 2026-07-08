# Acta Cosmica — News & Magazine Theme for Ghost

A photo-forward news and magazine theme for [Ghost](https://ghost.org), built around real editorial workflows: breaking stories, deep features, staff bios, and reader membership — with the credibility of an established newsroom.

Ported from the original Astro version of Acta Cosmica into a native Ghost theme, so publishers get Ghost's built-in editor, memberships, comments, search, and newsletters instead of a static-site content pipeline.

**Requires Ghost `>=5.0.0`.**

---

## Installation

1. Download `acta-cosmica.zip` (run `npm run package` to build one from source — see below).
2. In Ghost Admin, go to **Settings → Design → Change theme → Upload theme**.
3. Upload the zip, activate it.
4. Configure the theme's custom settings under **Settings → Design → Brand** (see [Custom settings](#custom-settings) below).

### Local development

```sh
npm install
npm run dev     # watches assets/css/screen.css, rebuilds assets/built/screen.css on change
```

Then symlink (or copy) this folder into a local Ghost install's `content/themes/` directory, activate it in Admin, and edit `.hbs`/CSS files directly — Ghost recompiles templates per request in development mode, so changes show up on refresh.

```sh
npm run build     # one-off production build of assets/built/screen.css
npm test          # runs gscan — Ghost's theme compatibility checker
npm run package   # builds + zips the theme into dist-theme/acta-cosmica.zip, ready to upload
```

---

## Features

- **Fully configurable category system** — categories are Ghost tags; nav, footer, and homepage spotlight rows are driven by the theme's custom settings and Ghost's own navigation settings, no template edits needed
- **Native Ghost membership & paywall** — free/members-only/paid post gating via `{{#unless access}}`, with a branded subscribe CTA; tier pricing on the membership page pulls live from **Settings → Membership**
- **Native comments, search, and newsletters** — Ghost's built-in commenting, a custom weighted full-text search overlay (⌘K shortcut) powered by the Content API, and a newsletter signup wired to Ghost's newsletter feature
- **Full Koenig editor card support** — bookmark, gallery, callout, toggle, button, header, and before/after image-comparison cards are styled directly by the theme; audio, video, NFT, product, and file cards are served by Ghost's own default card assets (see `card_assets` in `package.json`) rather than reimplemented, so they stay in sync with Ghost core
- **Reader UX** — reading progress bar, a writers directory with live story counts, and a branded 404 page
- **Optional autoplaying hero video** — swap the top story's background for a looping video via a custom setting, no per-post upload needed
- **Fully responsive**, accessible (skip link, focus-visible states, reduced-motion support throughout), and SEO-ready via Ghost's own `{{ghost_head}}` output

---

## Templates included

| Template | Used for |
|---|---|
| `index.hbs` | Homepage — hero, latest rail, category spotlight rows, photo-of-the-day, click-to-play video |
| `post.hbs` | Article page — hero, byline, share, paywall CTA, related stories |
| `page.hbs` | Generic pages (About, Contact, legal pages, etc.) |
| `page-membership.hbs` | Membership page — live tier pricing from Settings → Membership |
| `page-writers.hbs` | Writers directory |
| `tag.hbs` | Category/tag archive |
| `author.hbs` | Author profile |
| `error.hbs` | 404 and other error pages |

---

## Custom settings

Configured under **Settings → Design → Brand** in Ghost Admin:

| Setting | Purpose |
|---|---|
| `accent_color` | Site-wide accent color (progress bar, kickers, buttons, accent squares) |
| `accent_text_light` | Turn on if a dark accent color makes button text hard to read (swaps button text from dark to white) |
| `hero_video_url` | Direct `.mp4`/`.webm` URL — autoplays as the top story's background instead of its feature image |
| `spotlight_category_1` / `spotlight_category_2` | Tag slugs featured as their own homepage rows |
| `footer_description` | Footer masthead blurb |
| `show_footer_credit`, `footer_credit_label`, `footer_credit_name`, `footer_credit_url` | Optional "designed and built by" footer credit |
| `social_bluesky`, `social_mastodon`, `social_instagram`, `social_youtube` | Icon-only social links (Facebook/Twitter/Threads use Ghost's own built-in social settings) |
| `content_api_key` | A **Content API** key (Settings → Integrations → Add custom integration), used client-side by the search overlay — safe to expose, as Content API keys are read-only |
| `featured_video_youtube_id`, `featured_video_title`, `featured_video_thumbnail` | Homepage click-to-play video feature |

Site navigation and secondary (footer) navigation are managed the standard Ghost way, under **Settings → Navigation**.

---

## Support

Questions, bug reports, or licensing questions: **brad.thomas@gmail.com**.

## License

See [LICENSE.md](LICENSE.md) for the Standard/Extended license terms.

## Credits

- Fonts: [Archivo](https://fonts.google.com/specimen/Archivo) and [Newsreader](https://fonts.google.com/specimen/Newsreader), both via Google Fonts, both open source (SIL Open Font License)
- No icon library — all icons are hand-tuned inline SVG
- Originally designed and built as an [Astro](https://astro.build) theme, then ported to Ghost
