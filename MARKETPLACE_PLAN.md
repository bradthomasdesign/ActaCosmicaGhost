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

**Distribution plan:** Ghost's official theme marketplace (marketplace.ghost.org)
first, plus direct sale via Lemon Squeezy. Ghost's marketplace links out to
wherever the theme is actually sold (same model as Astro's own marketplace) —
it doesn't process payment itself.

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

## Launch checklist — go-to-market mechanics (open)

- [~] **Live hosting** — Ghost on PikaPods + Mailgun for transactional email,
      in progress (Brad's side, outside this repo).
- [ ] **Real demo content** — currently only has whatever
      `migrate-from-astro.mjs` pulls in, plus leftover test posts from local
      QA (delete the "Koenig Card Test Post" before this goes anywhere
      public). Needs either a proper migration run or fresh demo articles.
- [ ] **Properly licensed demo photography** — carried over from the Astro
      plan: the original demo images have no recoverable source/license.
      A public demo site needs real, cleared photos regardless of which
      version (Astro or Ghost) is showing them.
- [ ] **Stripe configured** — needed for the membership/paywall demo to be
      clickable end-to-end; currently off locally (`paid_members_enabled:
      false`, no Stripe keys).
- [ ] **Screenshots** — both Ghost Marketplace and Lemon Squeezy need real
      preview images; blocked on the live site having real content first.
- [ ] **Storefront listing copy** — the Astro version's drafted copy
      (features, pitch, "Perfect For" list) is a reasonable structural
      starting point but needs a full rewrite for Ghost specifics: Koenig
      editor instead of Markdown/Content Collections, native
      membership/Stripe instead of a stub account page, Ghost's own
      SEO/sitemap/RSS instead of `@astrojs/*` integrations, etc. Not started.
- [ ] **Ghost Marketplace submission requirements** — not yet researched.
      Ghost's process is different from Astro's; don't assume anything from
      the old plan (repo-visibility requirements, screenshot specs, review
      process, etc. all need fresh verification directly against
      marketplace.ghost.org's current submission flow).
- [ ] **Lemon Squeezy product** — not created. No listing, no price set, no
      file uploaded yet. `dist-theme/acta-cosmica.zip` is ready to attach
      once the listing exists.

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
