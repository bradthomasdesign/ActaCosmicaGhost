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
- **Per-post article options** — an automatic "In this story" contents list, plus internal tags for a video hero, split-image and slideshow heroes, and per-post drop caps (see [Article options](#article-options-internal-tags)); stories without a photo render as designed text cards
- **Dark mode and reader controls** — a full dark theme that follows each reader's device by default, a light/dark switch in the header, and an "Aa" panel on every article for text size (Small / Default / Large) and appearance (Light / Dark / System). Choices are remembered per reader, applied before the page paints (no flash), and synced across open tabs. Site owners can lock the whole site to Light or Dark instead
- **Print-ready articles** — a newspaper-style print layout with a cover, running headers, page numbers and a source line
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
| `color_scheme` | **System** (default) follows each reader's device and shows the light/dark switch and the Appearance option in the article "Aa" panel. **Light** or **Dark** locks every page to that mode and hides both switches (text size stays available) |
| `accent_text_light` | Turn on if a dark accent color makes button text hard to read (swaps button text from dark to white) |
| `hero_video_url` | Direct `.mp4`/`.webm` URL — autoplays as the top story's background instead of its feature image |
| `footer_description` | Footer masthead blurb |
| `show_footer_credit`, `footer_credit_label`, `footer_credit_name`, `footer_credit_url` | Optional "designed and built by" footer credit |

Site navigation is managed the standard Ghost way, under **Settings → Navigation**:

- **Primary navigation** drives the header's section bar and the slide-out menu. Links that don't fit on one line collapse into a **More** menu. To nest links, start a label with a dash — `-Astronomy` placed under `Science` becomes part of a Science dropdown in the header and an indented sub-link in the slide-out menu.
- **Legal links** in the footer's bottom row come from pages tagged `#footer-legal-link` (newest first; the page title is the link text). Until you tag one, the theme shows its stock Privacy Policy, Terms of Use and Cookie Policy links (`/privacy/`, `/terms/`, `/cookies/`).
- **Secondary navigation** fills the footer's **About** column — list the pages you want there (About, Writers, Membership, Contact…), in order. The column hides while the list is empty.
- The footer's **Sections** column links the sections featured on your homepage (one per homepage section page, in homepage order), so it stays short and always matches the front page. It hides when the homepage has no section rows.

Social links come from Ghost's own **Settings → General → Social accounts** (X, Facebook, LinkedIn, Bluesky, Threads, Mastodon, TikTok, YouTube, Instagram) and appear in the header and footer for every account you fill in. Ghost pre-fills Facebook and X with Ghost's own accounts on a new site — clear those fields if they aren't yours.

Search and the saved-stories page use the site's public Content API key, which the theme reads automatically from the scripts Ghost already adds to every page — there's no key to configure.

---

## Homepage sections and video

These homepage features are driven by Ghost pages rather than theme settings, so you can add, reorder, or hide them without touching Design settings.

**Section rows.** Each homepage row is one Ghost page:

1. **Pages → New page**, titled after the section (e.g. "Homepage section: Science" — the title isn't shown on the homepage).
2. In **Page settings → Tags**, add the section's public tag **first** (e.g. `Science`), then **one** layout tag from the table below. The first tag picks the stories (every post carrying that tag) and names the row. Optionally write an **Excerpt** — it appears as an italic standfirst under the row heading.
3. Publish. Rows are ordered by the page's publish date, newest first; the newest row sits above Photo of the Day and the rest follow it. Republish a page to move its row to the top. Draft or delete the page to remove the row.

| Layout tag | Row |
|---|---|
| `#home-spotlight` | Four stories across (the original row; posts whose *primary* tag matches, excluding featured posts) |
| `#home-feature-package` | Big photo lead with headline overlaid, a second story, and stories 3–5 as a numbered list |
| `#home-feature-rail` | Big photo lead plus four equal image-right stories |
| `#home-briefing` | Up to 9 compact headlines with small thumbnails in a 3-column grid (the 9th shows on wide screens) |
| `#home-briefing-carousel` | Up to 27 briefing items, three to a column, in a swipeable carousel |
| `#home-asymmetric-lead-list` | A lead with two smaller stories beneath, and up to nine headlines down the side |
| `#home-opinion-hedcut` | Up to 6 columnist cards: author photo, italic headline, byline |
| `#home-tag-columns` | One column per **public tag on the page** (in tag order), each with a lead and four headlines — the only layout that doesn't need a first tag; the excerpt shows as a small label above |
| `#home-standard-3-column-grid` | Up to 9 cards in a carousel, three visible |
| `#home-standard-4-column-grid` | Up to 9 cards in a carousel, four visible |

A row with no matching stories doesn't render.

**Editor's Picks.** Feature posts with Ghost's **Featured** toggle. The first three featured posts fill the homepage hero, the lead story and the Editor's Pick block; featured posts four through eleven appear in an Editor's Picks carousel under the lead stories, two large stories to a view. With three or fewer featured posts the carousel doesn't show.

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

## Membership

Everything here follows your Ghost membership setup (**Settings → Membership**) — prices, tiers, trials and who may sign up are never typed into the theme.

**Membership page** (`/membership/`, the `page-membership.hbs` template). Shows a card per public tier with its description and benefits:
- Paid tiers appear once paid memberships can actually be bought (Stripe connected). The **Free** tier appears when "Free" is ticked under Signup portal → Available tiers.
- When both monthly and yearly prices are offered (Signup portal → Available prices), a **Monthly / Yearly** switch flips every price and checkout button, opening on your default price. Each paid plan also shows the other period with the yearly saving ("or $50 a year · save 17%") — the saving line only appears when yearly is genuinely cheaper.
- Tiers with a free trial say "Start your N-day trial". With more than one paid tier, the cheapest is marked **Most popular**.
- Signed-in readers see "Change plan" / "My account" instead of signup buttons.
- The page body (anything you write in the editor) appears below the plans under "Where your money goes".

**Membership band** — a sign-up band above the footer on every page. Turn it on by publishing a page with the slug `membership-cta`; draft or delete that page to turn it off.

| Page field | Shows as |
|---|---|
| Body | A Heading 2 headline followed by paragraphs. Highlight a few words in the headline (⌘/Ctrl + Alt + H) to set them in italic accent color. |
| Excerpt | Small label at the top (e.g. "Membership · Acta Cosmica") |
| Meta description | A second label on the right (e.g. "Reader-funded since 2026") |
| Meta title | Optional override for the badge above the price (otherwise "Start your N-day free trial" or "Membership") |

The right side adapts to the reader: visitors see your cheapest paid plan with checkout (or a free sign-up form if nothing is for sale yet, or a sign-in prompt on invite-only sites); free members see an Upgrade offer; paying members never see the band. It also steps aside on the membership page itself.

**Newsletter band** — the dark sign-up band near the bottom of most pages. Its copy is the theme's default until you publish a page with the slug `newsletter-band`: the page **Title** becomes the headline, its **Excerpt** the line beneath, and its **Meta title** the small label above (default "The [site name] Dispatch"). The page body isn't used.

**End-of-article prompt** — for logged-out readers on stories they can read in full (members-only stories already show the paywall prompt instead):
- Publish a page with slug `newsletter-cta` for a newsletter sign-off card: Heading 2 + paragraphs in the body, Excerpt = small label (default "Sign up"), Meta title = button text (default "Subscribe"), Meta description = fine print.
- Or publish `member-cta` for a membership pitch: Heading 2 + paragraphs, Excerpt = label, Meta title = button text (default "Become a member"). If both exist, the newsletter card wins.
- With neither page published, nothing extra appears.

---

## Ads

Ads are **off by default**. Turn on **Enable ads** in Design settings, then fill each spot by publishing a page with the matching slug — put an image banner (an Image card linked to the advertiser) or ad-network code (an HTML card) in the page body. No page, no ad in that spot; draft or delete the page to pull it. **Paying members never see ads**, and no ad script loads for them.

| Page slug | Where it appears | Banner size (desktop / phone) |
|---|---|---|
| `ad-header` | Strip at the very top of every page | 970×90 or 728×90 / 320×100 or 320×50 |
| `ad-home-top` | Below the homepage lead stories | 970×250 or 728×90 / 300×250 or 320×100 |
| `ad-feed` | Inside the story grid on section and writer pages | 970×250 or 728×90 / 300×250 or 320×100 |
| `ad-in-article` | Top of an article (only when the reader can read the full story) | 300×250 or 336×280 |
| `ad-post-footer` | End of an article, before the author card | 300×250 or 336×280 |
| `ad-mobile-anchor` | Small sticky banner at the bottom of phones, with a close button | 320×50 or 320×100 |

**Between homepage sections:** create a page tagged `#home-ad` with the ad in its body. It slots into the homepage section rows like any other section page (ordered by publish date), so you can run several.

**Desktop + phone creatives:** put two Image cards in the page — the desktop banner first, the phone banner second — and the right one shows at each screen size. Export images at 2× for sharp screens.

Banner links automatically open in a new tab and are marked `rel="sponsored"`.

**AdSense:** paste your publisher ID (`ca-pub-…`) into **AdSense publisher ID** to load AdSense once on every page (this also enables Auto ads — if you use Auto ads' own anchor, skip the `ad-mobile-anchor` page so phones don't get two). Paste each ad unit's code into the slot pages above. **Ad consent mode** (on by default) tells Google ads to set no advertising cookies for visitors in the EEA, UK and Switzerland until a consent tool allows them — turn it off if your consent platform already sets these defaults. Static image banners set no cookies at all. You'll likely also need an `ads.txt` at your domain root, which your host provides, not the theme.

---

## Printing

Every article has a **Print** button in its toolbar (hidden on stories the reader can't open in full). Printing — from the button or the browser's own Print command — produces a newspaper-style document rather than the web page:

- a cover with the publication name, section and date, headline, standfirst, byline and feature image;
- body text in serif type, justified, with the drop cap kept;
- the article title along the top of each page after the first, and the site name plus page numbers ("2 / 5") along the bottom (in browsers that support print page margins — Chrome and Edge);
- videos, audio, embeds and interactive cards replaced by a short "view it at the original article" line;
- a closing line crediting the publication with the article's full URL and the date it was printed.

Navigation, comments, related stories, sign-up prompts and ads are left off. On a members-only story a visitor can't read, only the cover prints, with a note pointing to the article.

---

## Writer profiles

Every writer manages their own profile in Ghost Admin — click your avatar (bottom left) → **Your profile**. The theme uses:

| Profile field | Where it shows |
|---|---|
| **Profile picture** | Article byline, the author card at the end of each article, the writer's page, the Writers directory, and opinion-column cards. Writers without a photo get a monogram of their initials in the accent color. |
| **Bio** | The author card at the end of each article, the writer's page, and the Writers directory |
| **Meta title** (under SEO on the profile) | The writer's role or title — e.g. "Senior Science Correspondent" — shown above their name on their page and in the Writers directory |
| **Location** | The writer's page |
| **Website** and **social accounts** (X, Bluesky, Threads, Mastodon, Instagram, LinkedIn, YouTube, TikTok, Facebook) | Buttons on the writer's page — only for the accounts the writer has filled in |

The author card at the end of every article links to "More from [writer]", so it stays useful even before a writer has written a bio.

---

## Article options (internal tags)

Add these in a post's **Post settings → Tags**. Tags starting with `#` are internal: they change how the post renders but never appear on public tag pages.

| Tag | What it does |
|---|---|
| *(automatic)* / `#no-toc` | Every post with two or more H2/H3 subheads gets an "In this story" contents list above the article: H2s are the entries, H3s nest under them (or are the entries in a post with no H2s). On wide screens (1360px and up) it sits in the margin to the left of the article and stays in view as you scroll; on narrower screens it's a box at the top of the article (collapsed on phones). It highlights the section being read. Tag a post `#no-toc` to leave it out. |
| `#video` | Turns the post into a video post: the first uploaded video, YouTube or Vimeo embed in the body moves into the hero, with the feature image as its poster. Playback starts on click. Story cards for the post get a ▶ badge. |
| ↳ persistent player | Once a reader presses play on a `#video` post, the video docks into a corner mini-player when they scroll past it, and keeps playing as they click through to other pages on the site. The mini-player has **Back to the article** (returns the video to the hero) and **Close** (stops playback). Readers who never press play — and search engines — get ordinary page loads. Turn it off, or move the mini-player to the bottom-left corner, under **Design settings → Post**. |
| `#hero-split-right` / `#hero-split-left` | Magazine-style opening: headline and standfirst beside a square-cropped feature image (image on the right or left). Stacks headline-first on phones. |
| `#hero-slideshow` | The feature image plus the images from the post's first gallery card become a manual slideshow hero (arrows, dots, ← / → keys, swipe). The gallery is removed from the body so photos aren't shown twice; captions come from each image's alt text. |
| `#no-dropcap` | Removes the drop cap from this post's opening paragraph. |
| `#dropcap` | On a **page**, adds the drop cap that posts get by default. |

Only one hero layout applies per post. If a post has several, `#video` wins, then `#hero-split-right`, `#hero-split-left`, `#hero-slideshow`. Split and slideshow heroes need a feature image and fall back to the standard hero without one.

**Stories without a feature image** render as text cards everywhere a card would show a photo: a heavy rule and the story's summary (its excerpt, or the opening of the post) fill the image space, so pictured and unpictured cards still line up. In the homepage "Latest" list, an unpictured story simply has no thumbnail.

---

### How the persistent player works (for developers)

After a reader presses play, clicking an on-site link opens the next page in a full-screen frame above the article, so the video's player is never reloaded. Each framed page is a normal page load, so its scripts, ads and analytics run exactly as usual; the address bar and title follow the framed page, and Back steps through it before returning to the article. Links that leave the site (or go to `/ghost/`) replace the whole window. Add `data-mp-reload` to a link to always force a normal page load.

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
