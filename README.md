# Acta Cosmica — News & Magazine Theme for Ghost

A photo-forward news and magazine theme for [Ghost](https://ghost.org), built around real editorial workflows: breaking stories, deep features, staff bios, and reader membership — with the credibility of an established newsroom.

Ported from the original Astro version of Acta Cosmica into a native Ghost theme, so publishers get Ghost's built-in editor, memberships, comments, search, and newsletters instead of a static-site content pipeline.

**Requires Ghost `>=6.37.0`** (for the full set of native social accounts).

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
- **Saved stories** — readers can bookmark any article with the bookmark button in the byline bar; bookmarks live in `localStorage` (no account required) and are displayed on a dedicated `/saved` page with one-tap removal
- **Native share sheet on mobile** — on iOS and Android, the share buttons in the article byline collapse to a single "Share" tap that opens the OS share sheet; falls back to the individual social buttons on desktop
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
| `page-saved.hbs` | Saved stories — auto-assigned to any Ghost page with the slug `saved` |
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
| `footer_description` | Footer masthead blurb |
| `show_footer_credit`, `footer_credit_label`, `footer_credit_name`, `footer_credit_url` | Optional "designed and built by" footer credit |

Site navigation and secondary (footer) navigation are managed the standard Ghost way, under **Settings → Navigation**.

Social links come from Ghost's own **Settings → General → Social accounts** (X, Facebook, LinkedIn, Bluesky, Threads, Mastodon, TikTok, YouTube, Instagram) and appear in the header and footer for every account you fill in. Ghost pre-fills Facebook and X with Ghost's own accounts on a new site — clear those fields if they aren't yours.

Search and the saved-stories page use the site's public Content API key, which the theme reads automatically from the scripts Ghost already adds to every page — there's no key to configure.

---

## Homepage sections and video

These homepage features are driven by Ghost pages rather than theme settings, so you can add, reorder, or hide them without touching Design settings.

**Section rows.** Each homepage row of four stories is one Ghost page:

1. **Pages → New page**, titled after the section (e.g. "Homepage section: Science" — the title isn't shown on the homepage).
2. In **Page settings → Tags**, add the section's public tag **first** (e.g. `Science`), then the internal tag `#home-spotlight`. The first tag picks the stories and names the row.
3. Publish. Rows are ordered by the page's publish date, newest first; the newest row sits above Photo of the Day and the rest follow it. Republish a page to move its row to the top. Draft or delete the page to remove the row.

Section pages are automatically marked `noindex`, and if someone opens one at its own URL they see that section's row rather than an empty page.

**Video feature.** Create a page tagged `#home-video`. Its title is the caption, its feature image is the poster, and the first YouTube embed or link in its body is the video, which plays in place when clicked. Draft or delete the page to hide the feature.

---

## Saved Stories setup

The saved stories feature requires a one-time step in Ghost Admin:

1. Go to **Pages → New page**.
2. Set the title to anything (e.g. "Saved Stories") and the **slug to `saved`** — Ghost auto-assigns `page-saved.hbs` to any page with this slug.
3. Publish the page.
4. Optionally add `/saved/` to your site navigation under **Settings → Navigation**.

Bookmarks are stored in `localStorage` under the key `acta_saved` — the same key used by the original Astro build, so any reader who bookmarked stories there will see them carry over automatically. No account or login is required.

---

## Upgrading from earlier versions

Several theme settings moved to native Ghost features. After uploading the new version, redo these once in Ghost Admin so your site looks the same as before:

| Old theme setting | Where it lives now |
|---|---|
| Spotlight category 1 / 2 | One page per row tagged `<your tag>` + `#home-spotlight` — see [Homepage sections and video](#homepage-sections-and-video). Publish the old "category 1" page last so it stays the top row. |
| Featured video ID / title / thumbnail | A page tagged `#home-video` with the YouTube link in its body, the title as its title, and the thumbnail as its feature image |
| Bluesky / Mastodon / Instagram / YouTube | **Settings → General → Social accounts** |
| Content API key | Nothing to do — read automatically |

---

## Support

Questions, bug reports, or licensing questions: **brad.thomas@gmail.com**.

## License

See [LICENSE.md](LICENSE.md) for the Standard/Extended license terms.

## Credits

- Fonts: [Archivo](https://fonts.google.com/specimen/Archivo) and [Newsreader](https://fonts.google.com/specimen/Newsreader), both via Google Fonts, both open source (SIL Open Font License)
- No icon library — all icons are hand-tuned inline SVG
- Originally designed and built as an [Astro](https://astro.build) theme, then ported to Ghost
