# Acta Cosmica (Ghost) — Marketplace Readiness Plan

Working doc for prepping the **Ghost** version of Acta Cosmica for sale. This is a
different codebase from the Astro version's own `MARKETPLACE_PLAN.md` (Astro
marketplace + Lemon Squeezy) — Ghost's marketplace has entirely different
submission mechanics, so nothing in the old plan carries over except the general
"sell via Lemon Squeezy" channel decision.

**Repo:** [github.com/bradthomasdesign/ActaCosmicaGhost](https://github.com/bradthomasdesign/ActaCosmicaGhost),
local folder `~/Sites/ActaCosmicaGhost`. Started as a copy of the Astro repo
(`~/Sites/markur` / `bradthomasdesign/actacosmica`), but now has its own clean
git history — no Astro commits, no Astro source tracked. `~/Sites/markur`
remains the separate, untouched live Astro site.

**Distribution plan — changed 2026-07-27: free, not paid.** Brad's decision:
the Ghost version is given away **free to newsletter subscribers of
bradthomas.io**, not sold. This supersedes the Standard/Extended paid-license
plan below for this theme specifically — the Astro version's own pricing/
Lemon Squeezy plan (`~/Sites/markur/MARKETPLACE_PLAN.md`) is untouched, still
paid. **Open question, not yet decided:** what actually delivers the file to
a subscriber — still routing through the already-configured Lemon Squeezy
listing at a $0 price (keeps license/download tracking), or gating it as a
bradthomas.io newsletter/member perk (e.g. a Ghost members-only download link,
since bradthomas.io itself may be Ghost-powered) with no Lemon Squeezy
involved at all? Confirm before touching the Lemon Squeezy listing config.

Status key: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Theme correctness — verified against a real local Ghost instance

- [x] **gscan passes clean** — `npm test` reports zero errors, zero warnings.
- [x] **`card_assets` conflict found and fixed.** Was `true`, which let Ghost's
      own default Koenig card CSS silently override this theme's
      callout/toggle/button/header/gallery/bookmark styling (confirmed via
      `.kg-btn-accent` rendering Ghost's core brand pink instead of the
      theme's accent color). Scoped to
      `{"include": ["audio","video","nft","product","file"]}` — Ghost now
      only supplies the complex interactive cards this theme doesn't
      reimplement, while the theme's own CSS wins everywhere else.
      Re-verified against Ghost's own theme-activation validator (a more
      thorough check than the standalone `gscan` CLI): **zero errors, zero
      warnings**, down from 2 errors + ~60 warnings before the fix.
- [x] **`error.hbs` bug found and fixed.** Was using `{{error.statusCode}}`/
      `{{error.message}}` (per a misleading gscan CLI suggestion) which
      rendered blank at runtime. Ghost's own Casper theme uses bare
      `{{statusCode}}`/`{{message}}` — switched to match, confirmed a real
      404 request now renders "404" / "Page not found" correctly.
- [x] **Koenig card CSS** — bookmark (incl. author/publisher byline), gallery,
      callout (all color variants), toggle (incl. working open/close JS),
      button, header, blockquote-alt, and a fully custom before/after
      image-comparison slider (CSS `clip-path` + drag JS — Ghost core ships
      no default for this card at all) are all theme-owned and verified by
      injecting Ghost's real card markup into a live rendered page and
      checking computed styles.
- [x] **Paywall/member gating** — verified live: a members-only test post
      correctly shows the theme's "This story is for subscribers" CTA to a
      non-member visitor.
- [x] **Secondary navigation** — verified live: footer "Company" column
      correctly pulls from Settings → Navigation → Secondary Navigation.
- [x] **`package.json` `license` field fixed.** Was `"MIT"`, which directly
      contradicts `LICENSE.md`'s actual proprietary Standard/Extended terms
      (MIT permits resale/redistribution; the real license forbids it).
      Changed to `"SEE LICENSE IN LICENSE.md"`.
- [x] **README/ATTRIBUTIONS rewritten for Ghost** — both previously described
      the Astro version (npm/astro dev, Content Collections, image licensing
      for bundled photos). Rewritten: Ghost install/dev workflow, real
      feature list, custom settings table, template list. `ATTRIBUTIONS.md`
      now correctly notes the theme ships **zero images** (Ghost themes pull
      content images from the site's own media library, not the theme
      package) — so the Astro version's unresolved image-licensing question
      doesn't carry over to the theme package itself. It *does* still apply
      to whatever demo/photography ends up on the live marketing site.
- [x] **Packaging script** — `scripts/package-theme.mjs` (`npm run package`)
      zips just the files Ghost needs (`.hbs`, `partials/`, `assets/`,
      `package.json`, `LICENSE.md`) into `dist-theme/acta-cosmica.zip`,
      wrapped in a single `acta-cosmica/` folder. Validated against gscan's
      own `checkZip` (the exact function Ghost's upload endpoint calls):
      199 checks passed, 0 failed.

## Known non-issue (don't re-investigate)

- **"Login/magic-link sign-in fails locally"** — not a theme bug. The local
  dev Ghost instance has no SMTP server configured
  (`ECONNREFUSED 127.0.0.1:1025`), so any flow that needs Ghost to *send*
  an email (member magic-link sign-in, password reset) fails by design in
  this environment. Resolved by the live PikaPods + Mailgun setup
  (in progress, Brad's side) — nothing to fix in the theme.

---

## Launch checklist — go-to-market mechanics (updated 2026-07-15)

- [~] **Live hosting** — decided: **MagicPages** (switched from the earlier
      PikaPods + Mailgun plan). MagicPages is Ghost-specific managed hosting,
      so transactional email (member magic-links, etc.) should be handled by
      the platform rather than a separately configured Mailgun instance —
      worth confirming during setup rather than assuming. Not yet live.
- [~] **Real demo content** — decision made: same content as the Astro
      demo. `scripts/migrate-from-astro.mjs` already does exactly this (pulls
      `~/Sites/markur`'s articles/authors/tags into a live Ghost instance via
      the Admin API) — it just needs to be **run against the MagicPages site**
      once it's up (`GHOST_URL=<magicpages-url> GHOST_ADMIN_KEY=<id:secret>
      npm run migrate`, per the usage comment at the top of the script).
      Still needs the leftover "Koenig Card Test Post" deleted before the
      site goes public.
- [ ] **Properly licensed demo photography — discrepancy found, needs a
      decision.** Brad's recollection was that this art was sourced from
      Pexels/Unsplash. Checked `~/Sites/markur/ATTRIBUTIONS.md` (the
      authoritative record) directly and that's only true for **one** image:
      `author-alvarez.jpg` (Pexels, Jordan Bergendahl, no attribution
      required). Every other image — all article photography, the other 4
      author portraits, homepage imagery — is logged there as **unverified,
      no recoverable source** (no EXIF/IPTC metadata, original sourcing never
      recorded). That file is the ground truth for what actually happened,
      not this note or memory of the session that picked the images. Two
      ways forward: (a) re-source the unverified images fresh from
      Pexels/Unsplash now, recording source + photographer + license in
      `ATTRIBUTIONS.md` as each one is added (the Alvarez row is the
      template), or (b) if there's a receipt/download history somewhere else
      (a Pexels/Unsplash account's download log, browser history from when
      they were added) that would verify the existing files, check that
      before treating them as unverified. Blocks a public demo either way —
      shipping unverified stock photography on a for-sale product's demo
      site is a real risk if any of them turn out not to be actually free.
- [x] **Stripe configured** — done (Brad's side).
- [~] **Screenshots** — Astro version's screenshots exist and can serve as
      layout/shot-list reference, but Ghost's rendered UI differs enough
      (paywall CTA, comments, membership page pricing pulled from Settings)
      that new screenshots are still needed once the MagicPages demo has
      real content. Not blocked on anything except live content existing.
- [x] **Storefront listing copy** — Ghost-specific version drafted below,
      grounded in `README.md`'s verified feature list (not copied from the
      Astro copy's Astro-specific claims). Ready for Brad's review before
      posting anywhere.
- [x] **Ghost Marketplace submission requirements** — researched. Summary:
  - Theme must pass **GScan** (already does — `npm test`, 0 errors/warnings).
  - Responsive/mobile-friendly; support the latest 2 versions of Chrome,
    Firefox, Safari, and Edge.
  - All assets must be loaded via Ghost's `{{asset}}` helper — confirmed
    true throughout this theme (checked for any hardcoded `/assets/` or
    `/public/` paths outside the helper; found none).
  - Must include a **"Published with Ghost" link to Ghost.org** — already
    present (`partials/site-footer.hbs:57`, `{{t "Powered by Ghost"}}` →
    `https://ghost.org/`). No action needed.
  - Needs a **working demo on a URL with a valid SSL cert, embeddable via
    iframe from `*.ghost.org`** — i.e. the MagicPages demo must not send an
    `X-Frame-Options`/CSP `frame-ancestors` header that blocks embedding from
    ghost.org. Worth testing directly once the demo is live (open it in an
    iframe, or check response headers) — MagicPages being Ghost-focused
    hosting makes this likely fine by default, but "likely" isn't
    "confirmed."
  - Needs a **sane file structure** and a **detailed README.md** — this
    theme's `README.md` covers install steps, feature list, full template
    table, custom-settings table, a Saved Stories setup section, and
    support/license/credits. Should satisfy this.
  - Biggest rejection reason per Ghost's own guidance: **lack of
    originality** — looking like yet another Casper fork. Worth keeping in
    mind for the listing copy/screenshots: lead with what's genuinely custom
    (the before/after image-comparison card, the weighted search overlay,
    the photo-of-the-day homepage feature), not generic "responsive theme"
    claims.
  - Sources: [Ghost Marketplace: Submit your theme](https://ghost.org/themes/submit/), [Ghost Marketplace](https://ghost.org/marketplace/)
- [~] **Lemon Squeezy — status unclear after the 2026-07-27 free-giveaway
      decision.** Was marked done (listing/product configured, paid), but
      that predates the decision to give this away free to bradthomas.io
      subscribers instead of selling it. Don't assume the existing paid
      listing is still the plan — confirm whether it gets repurposed as a $0
      listing, replaced by a bradthomas.io-native delivery mechanism, or left
      as-is for a possible future paid SKU. `dist-theme/acta-cosmica.zip`
      itself is still current either way.

---

## Storefront listing copy — Ghost version (drafted 2026-07-15)

Adapted from the Astro version's copy (`~/Sites/markur/MARKETPLACE_PLAN.md`,
same CyberTech-inspired structure), but every feature claim below is
re-verified against **this** codebase's own `README.md` and templates —
nothing Astro-specific (Content Collections, static-site claims) carried over
unchecked.

---

### Acta Cosmica — News & Magazine Theme for Ghost

Acta Cosmica is a premium news and magazine theme for [Ghost](https://ghost.org),
built for online publishers, independent journalists, niche digital
newsrooms, and content-driven media brands that want to publish with the
polish of a real newsroom and convert readers into loyal subscribers and
members.

Designed around real editorial workflows, Acta Cosmica combines
photo-forward storytelling, a fully configurable category system, and
considered typographic design — backed by Ghost's own native membership,
comments, and newsletter tools, so subscriber conversion isn't bolted on
after the fact.

**This Theme Requires Ghost 5.0.0+ 🎉**

Ported from the original Astro version of Acta Cosmica into a native Ghost
theme, so publishers get Ghost's built-in Koenig editor, memberships,
comments, search, and newsletters instead of a static-site content pipeline.

**🚀 What Makes Acta Cosmica Stand Out**
- **Fully configurable category system** — categories are Ghost tags; nav,
  footer, and homepage spotlight rows are driven by the theme's custom
  settings and Ghost's own navigation settings, no template edits needed
- **Native Ghost membership & paywall** — free/members-only/paid post gating
  with a branded subscribe CTA; tier pricing on the membership page pulls
  live from Settings → Membership, no manual syncing
- **Native comments, search, and newsletters** — Ghost's built-in commenting,
  a custom weighted full-text search overlay (⌘K shortcut) powered by the
  Content API, and a newsletter signup wired to Ghost's own newsletter
  feature
- **Full Koenig editor card support** — bookmark, gallery, callout, toggle,
  button, header, and a fully custom before/after image-comparison card are
  styled directly by the theme; audio, video, NFT, product, and file cards
  stay in sync with Ghost core's own defaults
- **Saved stories** — readers can bookmark any article with a single tap;
  bookmarks live in the browser (no account required) and are displayed on a
  dedicated `/saved` page with one-tap removal
- **Mobile-native sharing** — on iOS and Android, the article share bar
  collapses to a single "Share" button that opens the OS share sheet; falls
  back to individual social links on desktop
- **Reader UX** — a reading progress bar, a writers directory with live
  story counts, and a branded 404 page
- **Optional autoplaying hero video** — swap the top story's background for
  a looping video via a custom setting, no per-post upload needed

**🎯 Design DNA**
- **Editorial Broadsheet Aesthetic** — warm cream backgrounds against
  near-black ink, with a single configurable accent color
- **Considered Typography** — Archivo, a bold grotesque sans, for display
  type and UI; Newsreader, a literary serif, for body copy
- **Photo-First Layouts** — full-bleed hero imagery, a photo-of-the-day
  homepage feature, and Koenig's wide/full-bleed image support tuned to the
  theme's own reading column
- **Fully responsive**, accessible (skip link, focus-visible states,
  reduced-motion support throughout)

**📦 Included (Fully Coded)**
✔ Homepage — hero, latest-stories rail, configurable category spotlight rows, photo-of-the-day, click-to-play video
✔ Article page — hero, byline, share links (native OS share sheet on mobile), bookmark button, paywall CTA, related stories, native comments
✔ Saved stories page — browser-local bookmarks, no account required
✔ Generic pages (About, Contact, legal pages, and more)
✔ Membership page with live tier pricing from Settings → Membership
✔ Writers directory with live story counts
✔ Category/tag archive with subcategory chip filtering
✔ Author profile pages
✔ Branded 404 page

**⚙️ Built On**
- Ghost 5.0.0+ — native Koenig editor, memberships, comments, newsletters
- Tailwind CSS v4 — compiled to a static stylesheet, no runtime dependency
- Google Fonts — Archivo + Newsreader
- Hand-tuned inline SVG icons — no icon library dependency
- Vanilla JS — nav drawer, reading progress bar, search overlay; no
  client-side JS framework
- SEO-ready via Ghost's own `{{ghost_head}}` output (meta tags, Open
  Graph/Twitter cards, canonical URLs, sitemap, RSS)

**⚡ Quick Setup**
1. Download `acta-cosmica.zip`
2. In Ghost Admin: Settings → Design → Change theme → Upload theme
3. Activate it
4. Configure custom settings under Settings → Design → Brand (accent color,
   spotlight categories, social links, and more)

**🎁 Perfect For**
- Online Newspapers & Magazines
- Independent Journalists & Newsletter Writers
- Niche Vertical Publishers (science, tech, culture, local news, and more)
- Membership-Funded Newsrooms
- Local News Outlets
- Photography & Photojournalism-Led Publications
- Content-Driven Media Brands
- Anyone launching a subscription or reader-funded publication on Ghost

**Pricing: free for bradthomas.io newsletter subscribers** (decided
2026-07-27) — not sold via Standard/Extended license like the Astro version.
`LICENSE.md` still needs a look before publishing: its current text describes
a paid Standard/Extended structure, which no longer matches how this theme is
actually being distributed — worth a pass to make sure the license terms
still make sense for a free subscriber giveaway (e.g. can a subscriber use it
on unlimited projects, or does some restriction still apply?).

**🆓 Free Updates & Support — still undecided**, independent of the
free-vs-paid pricing question above. Don't add a commitment like "free
lifetime updates" without Brad actually deciding what's being promised —
that's a support obligation, not marketing copy.

*(Suggested tags, not verified against Ghost's actual current tag taxonomy:
news, magazine, editorial, blog, journalism, photography, membership — check
these against the live submission form rather than assuming.)*

---

## Notes for picking this back up

- Local dev loop: `~/Sites/ghost-local` (Ghost CLI install, symlinks this
  theme in as `acta-cosmica`) — note it needs Node 22 on `PATH`
  specifically for `ghost run` (the installed `better-sqlite3` native
  module was built against Node 22's ABI; the shell's default `node` here
  is v20, which fails with `ERR_DLOPEN_FAILED` until Node 22's bin dir is
  prepended to `PATH`).
- After any `package.json` `config` changes (like `card_assets`), Ghost
  needs a full restart to pick them up — reactivating the theme via the
  Admin API alone isn't enough, the config is cached at boot.
- Regenerate the zip with `npm run package` any time theme files change.
