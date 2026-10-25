(function () {
  // Hero background video — autoplay is set directly in the HTML (muted
  // autoplay is reliably exempt from browser gesture requirements; a JS
  // .play() call at load time isn't equally reliable). Reduced-motion
  // visitors get paused on the poster frame (their feature image, if set)
  // instead, rather than gating playback on JS running successfully.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.hero-video').forEach((video) => {
      video.pause();
    });
  }

  // Homepage video feature — click-to-play YouTube. The video comes from
  // the #home-video page's body, rendered inert inside a <template>: the
  // first YouTube embed or link found there wins. The iframe is only
  // created on click, so an unplayed video costs nothing on page load.
  const videoFeature = document.getElementById('video-feature');
  if (videoFeature) {
    const source = videoFeature.querySelector('template[data-video-source]');
    const html = source ? source.innerHTML : '';
    const match = html.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    const videoId = videoFeature.getAttribute('data-youtube-id') || (match ? match[1] : '');
    const playBtn = videoFeature.querySelector('button');
    if (!videoId) {
      // Nothing playable on the page yet — don't advertise a dead button.
      if (playBtn) playBtn.hidden = true;
      videoFeature.style.cursor = 'default';
    } else {
      const play = () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.title = (videoFeature.querySelector('h2') || {}).textContent || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
        videoFeature.replaceChildren(iframe);
        videoFeature.style.cursor = 'default';
        iframe.focus();
      };
      videoFeature.addEventListener('click', play, { once: true });
    }
  }

  // --- Appearance + text size ---------------------------------------------
  // The inline <head> script applies saved choices before first paint; this
  // wires up the header toggle and the article "Aa" panel, and keeps every
  // open tab in sync. A site-level lock (Light/Dark theme setting) sets
  // data-scheme-lock on <html>, and the switches aren't rendered at all.
  const root = document.documentElement;
  const schemeLocked = root.hasAttribute('data-scheme-lock');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function readPref(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function writePref(key, value) {
    try {
      if (value) localStorage.setItem(key, value); else localStorage.removeItem(key);
    } catch {}
  }
  function isDark() {
    const forced = root.getAttribute('data-theme');
    return forced ? forced === 'dark' : darkQuery.matches;
  }
  function syncAppearanceUI() {
    const label = isDark() ? 'Switch to light mode' : 'Switch to dark mode';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', label);
      btn.title = label;
    });
    const pref = readPref('acta_theme') || 'system';
    document.querySelectorAll('input[name="rc-theme"]').forEach((r) => { r.checked = r.value === pref; });
    const size = root.getAttribute('data-text-size') || 'default';
    document.querySelectorAll('input[name="rc-size"]').forEach((r) => { r.checked = r.value === size; });
  }
  function applyTheme(pref) {
    if (schemeLocked) return;
    if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
    else root.removeAttribute('data-theme');
    syncAppearanceUI();
  }
  function applyTextSize(size) {
    if (size === 'small' || size === 'large') root.setAttribute('data-text-size', size);
    else root.removeAttribute('data-text-size');
    syncAppearanceUI();
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      writePref('acta_theme', next);
      applyTheme(next);
    });
  });
  document.querySelectorAll('input[name="rc-theme"]').forEach((r) => {
    r.addEventListener('change', () => {
      writePref('acta_theme', r.value === 'system' ? null : r.value);
      applyTheme(r.value);
    });
  });
  document.querySelectorAll('input[name="rc-size"]').forEach((r) => {
    r.addEventListener('change', () => {
      writePref('acta_text_size', r.value === 'default' ? null : r.value);
      applyTextSize(r.value);
    });
  });
  darkQuery.addEventListener('change', syncAppearanceUI);

  // Cross-tab sync. Removed on pagehide so the listener doesn't keep the
  // page out of the back/forward cache.
  function onStorage(e) {
    if (e.key === 'acta_theme') applyTheme(e.newValue || 'system');
    if (e.key === 'acta_text_size') applyTextSize(e.newValue || 'default');
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener('pagehide', () => window.removeEventListener('storage', onStorage));
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      window.addEventListener('storage', onStorage);
      applyTheme(readPref('acta_theme') || 'system');
      applyTextSize(readPref('acta_text_size') || 'default');
    }
  });
  syncAppearanceUI();

  // "Aa" popover: a plain disclosure. Escape or a click outside closes it
  // and returns focus to the button.
  const rcBtn = document.getElementById('reader-controls-btn');
  const rcPanel = document.getElementById('reader-controls-panel');
  if (rcBtn && rcPanel) {
    const setOpen = (open, restoreFocus) => {
      rcPanel.hidden = !open;
      rcBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        const checked = rcPanel.querySelector('input:checked') || rcPanel.querySelector('input');
        if (checked) checked.focus();
      } else if (restoreFocus) {
        rcBtn.focus();
      }
    };
    rcBtn.addEventListener('click', () => setOpen(rcPanel.hidden, false));
    document.addEventListener('click', (e) => {
      if (!rcPanel.hidden && !rcPanel.contains(e.target) && !rcBtn.contains(e.target)) setOpen(false, false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !rcPanel.hidden) setOpen(false, true);
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const articleBody = document.querySelector('.post-template .article-body');

  // --- "In this story" contents list (#toc) --------------------------------
  // Built from the article's own top-level H2s, with H3s nested under the
  // H2 before them. Headings inside cards (callouts, toggles) aren't direct
  // children of the body, so they're skipped. Fewer than two H2s: stays hidden.
  const toc = document.querySelector('[data-toc]');
  if (toc && articleBody) {
    const headings = [...articleBody.querySelectorAll(':scope > h2, :scope > h3')];
    const h2Count = headings.filter((h) => h.tagName === 'H2').length;
    const list = toc.querySelector('.story-toc__list');
    if (h2Count >= 2 && list) {
      let currentSub = null;
      const links = [];
      headings.forEach((h, i) => {
        if (!h.id) h.id = `section-${i + 1}`;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.textContent = h.textContent.trim();
        li.appendChild(a);
        links.push([h, a]);
        if (h.tagName === 'H2' || !list.lastElementChild) {
          list.appendChild(li);
          currentSub = null;
        } else {
          if (!currentSub) {
            currentSub = document.createElement('ol');
            list.lastElementChild.appendChild(currentSub);
          }
          currentSub.appendChild(li);
        }
        a.addEventListener('click', (e) => {
          e.preventDefault();
          h.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', `#${h.id}`);
        });
      });
      toc.hidden = false;
      // Phones start collapsed so the story's opening still leads.
      if (window.matchMedia('(max-width: 1023px)').matches) toc.querySelector('details').open = false;

      // Highlight the section currently being read.
      if ('IntersectionObserver' in window) {
        const visible = new Set();
        const mark = () => {
          let active = null;
          for (const [h, a] of links) {
            if (visible.has(h) || h.getBoundingClientRect().top < 120) active = a;
            if (visible.has(h)) break;
          }
          links.forEach(([, a]) => a.removeAttribute('aria-current'));
          if (active) active.setAttribute('aria-current', 'true');
        };
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
          mark();
        }, { rootMargin: '-90px 0px -55% 0px' });
        links.forEach(([h]) => io.observe(h));
      }
    }
  }

  // --- Video hero (#video) ---------------------------------------------------
  // Lift the first uploaded video / YouTube / Vimeo embed out of the body into
  // the hero frame. It's only moved once a supported video is found, so a
  // #video post without one keeps a plain poster and an untouched body.
  const videoHero = document.querySelector('[data-video-hero]');
  if (videoHero && articleBody) {
    const embedRe = /(youtube(?:-nocookie)?\.com|youtu\.be|vimeo\.com)/i;
    const source = [...articleBody.querySelectorAll('.kg-video-card, .kg-embed-card, iframe')]
      .find((el) => el.matches('.kg-video-card') || embedRe.test((el.matches('iframe') ? el : el.querySelector('iframe') || {}).src || ''));
    const card = source && (source.closest('.kg-video-card, .kg-embed-card, figure') || source);
    const playBtn = videoHero.querySelector('.hero-video__play');
    if (card && playBtn) {
      card.remove();
      playBtn.hidden = false;
      playBtn.addEventListener('click', () => {
        const poster = videoHero.querySelector('.hero-video__poster');
        if (poster) poster.remove();
        playBtn.remove();
        videoHero.appendChild(card);
        const iframe = card.matches('iframe') ? card : card.querySelector('iframe');
        const video = card.querySelector('video');
        if (iframe) {
          const url = new URL(iframe.src, location.href);
          url.searchParams.set('autoplay', '1');
          iframe.src = url.toString();
          iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
          iframe.focus();
        } else if (video) {
          video.play().catch(() => {});
          video.focus();
        }
      }, { once: true });
    } else if (articleBody) {
      console.warn('[acta] #video post has no uploaded video, YouTube or Vimeo embed in its body — showing the poster only.');
    }
  }

  // --- Slideshow hero (#hero-slideshow) -------------------------------------
  // Slide one is the feature image (server-rendered); the first gallery card's
  // images are appended and that gallery is removed from the body.
  const slideshow = document.querySelector('[data-slideshow]');
  if (slideshow && articleBody) {
    const track = slideshow.querySelector('.hero-slideshow__track');
    const gallery = articleBody.querySelector('.kg-gallery-card');
    const imgs = gallery ? [...gallery.querySelectorAll('img')] : [];
    if (track && imgs.length) {
      imgs.forEach((src, i) => {
        const fig = document.createElement('figure');
        fig.className = 'hero-slideshow__slide';
        fig.setAttribute('aria-roledescription', 'slide');
        fig.setAttribute('aria-label', String(i + 2));
        const blur = document.createElement('div');
        blur.className = 'hero-slideshow__blur';
        blur.style.backgroundImage = `url("${src.currentSrc || src.src}")`;
        const img = document.createElement('img');
        img.src = src.src;
        if (src.srcset) { img.srcset = src.srcset; img.sizes = '(max-width: 1280px) 100vw, 1280px'; }
        img.alt = src.alt || '';
        img.loading = 'lazy';
        fig.append(blur, img);
        if (src.alt) {
          const cap = document.createElement('figcaption');
          cap.textContent = src.alt;
          fig.appendChild(cap);
        }
        track.appendChild(fig);
      });
      gallery.remove();

      const slides = [...track.children];
      const prev = slideshow.querySelector('.hero-slideshow__arrow--prev');
      const next = slideshow.querySelector('.hero-slideshow__arrow--next');
      const dots = slideshow.querySelector('.hero-slideshow__dots');
      const status = slideshow.querySelector('.hero-slideshow__status');
      let index = 0;
      const dotBtns = slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Photo ${i + 1} of ${slides.length}`);
        b.addEventListener('click', () => go(i));
        dots.appendChild(b);
        return b;
      });
      function go(i) {
        index = Math.max(0, Math.min(slides.length - 1, i));
        slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
        dotBtns.forEach((b, n) => b.setAttribute('aria-current', String(n === index)));
        prev.disabled = index === 0;
        next.disabled = index === slides.length - 1;
        status.textContent = `Photo ${index + 1} of ${slides.length}`;
      }
      prev.hidden = next.hidden = dots.hidden = false;
      prev.addEventListener('click', () => go(index - 1));
      next.addEventListener('click', () => go(index + 1));
      slideshow.tabIndex = 0;
      slideshow.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      });
      let touchX = null;
      track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX = null;
      });
      go(0);
    }
  }

  // --- Homepage carousels ----------------------------------------------------
  // Scroll-snap tracks work by swipe/trackpad on their own; this adds arrow
  // buttons (shown only when the track actually overflows) that page by one
  // visible width and grey out at either end.
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.carousel__track');
    const arrows = carousel.querySelector('.carousel__arrows');
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    if (!track || !arrows || !prev || !next) return;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      arrows.hidden = max <= 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };
    const page = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  // Reading progress
  const bar = document.getElementById('progress-bar');
  const headerEl = document.querySelector('header');
  let progressTicking = false;
  function updateProgress() {
    progressTicking = false;
    headerEl?.classList.toggle('header-scrolled', window.scrollY > 8);
    if (!bar) return;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(1, Math.max(0, window.scrollY / max));
    bar.style.transform = `scaleX(${pct})`;
  }
  function requestProgressUpdate() {
    if (progressTicking) return;
    progressTicking = true;
    requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate, { passive: true });
  updateProgress();

  // Wordmark initials fallback for the smallest screens — derived from the
  // rendered site title so it holds for whatever name is set in Admin.
  document.querySelectorAll('.wordmark-full').forEach((el) => {
    const initials = el.textContent.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase();
    const short = el.parentElement.querySelector('.wordmark-short');
    if (short) short.textContent = initials;
  });

  // Nav drawer
  const drawer = document.getElementById('nav-drawer');
  const scrim = document.getElementById('nav-scrim');
  const drawerTrap = drawer ? makeFocusTrap(drawer, () => closeMenu()) : null;
  let menuReturnFocus = null;

  function openMenu() {
    if (!drawer || !scrim) return;
    menuReturnFocus = document.activeElement;
    drawer.style.transform = 'translateX(0)';
    drawer.setAttribute('aria-hidden', 'false');
    scrim.style.opacity = '1';
    scrim.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    drawerTrap?.activate();
    drawer.querySelector('[data-close-menu]')?.focus();
  }
  function closeMenu() {
    if (!drawer || !scrim) return;
    drawerTrap?.deactivate();
    drawer.style.transform = 'translateX(-100%)';
    drawer.setAttribute('aria-hidden', 'true');
    scrim.style.opacity = '0';
    scrim.style.pointerEvents = 'none';
    document.body.style.overflow = '';
    menuReturnFocus?.focus();
    menuReturnFocus = null;
  }
  document.querySelectorAll('[data-hamburger]').forEach((el) => el.addEventListener('click', openMenu));
  document.querySelectorAll('[data-close-menu]').forEach((el) => el.addEventListener('click', closeMenu));
  scrim?.addEventListener('click', closeMenu);

  // Account dropdown — event delegation so it works even when inside a
  // hidden element.
  const acctDropdown = document.getElementById('acct-dropdown');
  function setAcctOpen(open) {
    if (!acctDropdown) return;
    acctDropdown.style.display = open ? 'block' : 'none';
    document.getElementById('acct-trigger')?.setAttribute('aria-expanded', String(open));
  }
  document.addEventListener('click', (e) => {
    const trigger = document.getElementById('acct-trigger');
    if (trigger?.contains(e.target)) {
      setAcctOpen(acctDropdown?.style.display !== 'block');
      return;
    }
    if (acctDropdown && !acctDropdown.contains(e.target)) {
      setAcctOpen(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && acctDropdown?.style.display === 'block') {
      setAcctOpen(false);
      document.getElementById('acct-trigger')?.focus();
    }
  });

  // Portal (data-portal="signin"/"account"/"signup/...") handles its own
  // click wiring and closes the trigger's dropdown via its own overlay, so
  // no click delegation is needed here beyond closing our dropdown first.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-portal]')) setAcctOpen(false);
  });

  // Scroll-reveal — fades/slides .reveal sections in as they enter the
  // viewport. The CSS only applies under prefers-reduced-motion:
  // no-preference, so this observer is harmless (just adds a class
  // nothing reacts to) for motion-sensitive users or unsupported browsers.
  //
  // The opacity:0 starting state in CSS is scoped to html.js-reveal,
  // added here rather than baked into .reveal unconditionally — content
  // must never be able to get stuck invisible if this script is blocked,
  // errors, or an observer just never fires for some edge case. Only
  // commit to hiding anything once we're actually about to manage
  // revealing it.
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
    // Safety net: if an observed element somehow never fires (e.g. zero
    // height at observe-time, tab backgrounded through the whole
    // intersection window), force it visible after a few seconds rather
    // than leaving it hidden indefinitely.
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => el.classList.add('is-visible'));
    }, 4000);
  }

  // --- Search -----------------------------------------------------------
  // Same weighted-scoring approach as the Astro build, but the index is no
  // longer baked in at build time — it's fetched once from Ghost's Content
  // API and cached in memory for the rest of the session.

  // Ghost injects its search (sodo-search) and Portal scripts via
  // ghost_head, each carrying the site's public, read-only Content API key
  // in data-key — reuse that rather than asking for a key in theme settings.
  function contentApi() {
    const tag = document.querySelector('script[data-sodo-search][data-key], script[data-ghost][data-key]');
    const key = tag ? tag.getAttribute('data-key') : '';
    const url = ((window.ACTA_CONTENT_API || {}).url || '').replace(/\/$/, '');
    return { url, key };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Shared focus-trap utility. Returns activate/deactivate functions.
  // While active, Tab/Shift+Tab cycle within `container` and Escape calls `onEscape`.
  function makeFocusTrap(container, onEscape) {
    const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';
    function getFocusable() {
      return Array.from(container.querySelectorAll(FOCUSABLE));
    }
    function handleKeydown(e) {
      if (e.key === 'Escape') { onEscape?.(); return; }
      if (e.key !== 'Tab') return;
      const els = getFocusable();
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    return {
      activate() { container.addEventListener('keydown', handleKeydown); },
      deactivate() { container.removeEventListener('keydown', handleKeydown); },
    };
  }

  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-overlay-input');
  const panel = document.getElementById('search-results-panel');
  const closeBtn = document.getElementById('search-overlay-close');

  let searchIndexPromise = null;
  function getSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;
    const { url, key } = contentApi();
    if (!url || !key) {
      searchIndexPromise = Promise.resolve([]);
      return searchIndexPromise;
    }
    const fields = 'id,slug,title,custom_excerpt,feature_image,reading_time,url,published_at';
    const endpoint = `${url}/ghost/api/content/posts/?key=${key}&limit=all&include=tags,authors&fields=${fields}`;
    searchIndexPromise = fetch(endpoint)
      .then((res) => res.json())
      .then((data) => (data.posts || []).map((p) => ({
        id: p.id,
        title: p.title || '',
        slug: p.slug,
        url: p.url,
        kicker: (p.tags && p.tags[0] && p.tags[0].name) || '',
        tags: (p.tags || []).map((t) => t.name).join(' '),
        dek: p.custom_excerpt || '',
        byline: (p.authors && p.authors[0] && `By ${p.authors[0].name}`) || '',
        readTime: p.reading_time ? `${p.reading_time} min` : '',
        image: p.feature_image || null,
        bg: '#2b3a55',
        date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      })))
      .catch(() => []);
    return searchIndexPromise;
  }

  function score(a, terms) {
    let s = 0;
    const fields = [
      [a.title, 4], [a.kicker, 3],
      [a.tags || '', 3],
      [a.dek, 2], [a.byline, 1],
    ];
    for (const term of terms) {
      for (const [text, w] of fields) {
        if (text.toLowerCase().includes(term)) s += w;
      }
    }
    return s;
  }

  function renderResults(q, index) {
    if (!panel) return;
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { panel.innerHTML = ''; panel.style.display = 'none'; return; }

    const terms = trimmed.split(/\s+/);
    const results = index
      .map((a) => ({ ...a, _s: score(a, terms) }))
      .filter((a) => a._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, 8);

    if (results.length === 0) {
      panel.style.display = 'block';
      panel.innerHTML = `<div style="padding:28px 24px;text-align:center;font:400 16px/1.5 'Newsreader',Georgia,serif;color:var(--ink-muted);">No results for "<strong style="color:var(--ink);">${escapeHtml(q)}</strong>"</div>`;
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = results.map((a, i) => `
      <a class="card-link" href="${escapeHtml(a.url)}" style="display:flex;gap:16px;align-items:center;padding:14px 20px;text-decoration:none;color:inherit;${i < results.length - 1 ? 'border-bottom:1px solid var(--rule-faint);' : ''}">
        <div class="article-image-frame" style="flex:0 0 auto;width:68px;height:50px;border-radius:4px;overflow:hidden;background:${a.bg};">
          ${a.image ? `<img src="${escapeHtml(a.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">` : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font:600 14px/1 'Archivo';letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:5px;">${escapeHtml(a.kicker)}</div>
          <div style="font:600 15px/1.25 'Archivo',sans-serif;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(a.title)}</div>
          <div style="font:400 14px/1 'Archivo';color:var(--ink-muted);margin-top:4px;">${escapeHtml(a.byline)}${a.byline && a.readTime ? ' · ' : ''}${escapeHtml(a.readTime)}</div>
        </div>
      </a>
    `).join('');
  }

  const searchTrap = overlay ? makeFocusTrap(overlay, () => closeSearch()) : null;
  let searchReturnFocus = null;

  function openSearch() {
    if (!overlay) return;
    searchReturnFocus = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    searchTrap?.activate();
    getSearchIndex();
    setTimeout(() => input?.focus(), 30);
  }
  function closeSearch() {
    if (!overlay) return;
    searchTrap?.deactivate();
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (panel) { panel.innerHTML = ''; panel.style.display = 'none'; }
    searchReturnFocus?.focus();
    searchReturnFocus = null;
  }
  window.openSiteSearch = openSearch;

  document.getElementById('search-toggle')?.addEventListener('click', openSearch);
  closeBtn?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch(); }
  });

  let debounce;
  input?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      getSearchIndex().then((index) => renderResults(input.value, index));
    }, 150);
  });

  // --- Post page: share links, copy link, save-for-later -----------------
  const shareURL = encodeURIComponent(location.href);
  const shareText = encodeURIComponent(document.title);
  const shareHrefs = {
    x: `https://twitter.com/intent/tweet?url=${shareURL}&text=${shareText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareURL}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareURL}`,
  };
  document.querySelectorAll('[data-share]').forEach((el) => {
    const href = shareHrefs[el.getAttribute('data-share')];
    if (href) el.setAttribute('href', href);
  });

  document.querySelectorAll('[data-copy-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = btn.getAttribute('data-copy-link');
      if (!url) return;
      await navigator.clipboard.writeText(url);
      const original = btn.innerHTML;
      btn.innerHTML = '<span style="font:700 14px/1 Archivo;color:var(--ink);">Copied</span>';
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
  });

  // Koenig toggle cards — Ghost renders the markup but leaves the open/close
  // behavior to the theme, keyed off data-kg-toggle-state (see screen.css).
  document.querySelectorAll('.kg-toggle-card').forEach((card) => {
    const heading = card.querySelector('.kg-toggle-heading');
    heading?.addEventListener('click', () => {
      const isOpen = card.getAttribute('data-kg-toggle-state') === 'open';
      card.setAttribute('data-kg-toggle-state', isOpen ? 'close' : 'open');
    });
  });

  // Koenig before/after cards — no Ghost core default exists for this one
  // (unlike audio/video/product/file/nft, which are covered by card_assets
  // in package.json), so the drag-slider behavior is fully theme-owned.
  document.querySelectorAll('.kg-before-after-card-slider').forEach((slider) => {
    const input = slider.querySelector('.kg-before-after-card-slider-input');
    input?.addEventListener('input', () => {
      slider.style.setProperty('--kg-before-position', `${input.value}%`);
    });
  });

  // --- Tag page: dynamic subcategory chips + filtering + load more -------
  const catGrid = document.getElementById('cat-grid');
  if (catGrid) {
    const hero = document.getElementById('cat-hero');
    const chipBar = document.getElementById('chip-bar');
    const empty = document.getElementById('cat-empty');
    const count = document.getElementById('cat-count');
    const moreWrap = document.getElementById('load-more-wrap');
    const cards = Array.from(catGrid.children);
    const total = (hero ? 1 : 0) + cards.length;
    const nextAnchor = document.getElementById('cat-next-page');
    let nextPageUrl = nextAnchor ? nextAnchor.href : null;

    const subs = [];
    [hero, ...cards].forEach((el) => {
      const sub = el?.dataset.sub;
      if (sub && !subs.includes(sub)) subs.push(sub);
    });

    if (chipBar && subs.length > 0) {
      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.textContent = 'All';
      allChip.dataset.chip = '';
      chipBar.appendChild(allChip);
      subs.forEach((sub) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = sub;
        chip.dataset.chip = sub;
        chipBar.appendChild(chip);
      });

      const chips = Array.from(chipBar.children);
      function paintChip(el, active) {
        el.style.font = "600 14px/1 'Archivo'";
        el.style.letterSpacing = '.06em';
        el.style.textTransform = 'uppercase';
        el.style.padding = '9px 15px';
        el.style.borderRadius = '100px';
        el.style.cursor = 'pointer';
        el.style.color = active ? 'var(--paper)' : 'var(--ink-soft)';
        el.style.background = active ? 'var(--ink)' : 'transparent';
        el.style.border = `1px solid ${active ? 'var(--ink)' : 'var(--rule-strong)'}`;
        el.classList.toggle('chip-active', active);
        el.setAttribute('data-chip', el.dataset.chip);
      }
      chips.forEach((c, i) => paintChip(c, i === 0));

      function applyFilter(filter) {
        let visible = 0;
        if (hero) {
          const show = filter === '' || hero.dataset.sub === filter;
          hero.style.display = show ? '' : 'none';
          if (show) visible++;
        }
        catGrid.classList.toggle('show-all', filter !== '');
        cards.forEach((card) => {
          if (filter === '') {
            card.style.display = '';
            visible++;
          } else {
            const show = card.dataset.sub === filter;
            card.style.display = show ? 'flex' : 'none';
            if (show) visible++;
          }
        });
        if (moreWrap) moreWrap.style.display = filter === '' && nextPageUrl ? 'flex' : 'none';
        if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
        if (count) count.textContent = `${filter === '' ? total : visible} stories`;
      }

      chips.forEach((c) => {
        c.addEventListener('click', () => {
          chips.forEach((other) => paintChip(other, other === c));
          applyFilter(c.dataset.chip);
        });
      });

      applyFilter('');
    } else if (moreWrap && nextPageUrl) {
      moreWrap.style.display = 'flex';
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', async () => {
        if (!nextPageUrl) return;
        loadMoreBtn.textContent = 'Loading…';
        loadMoreBtn.disabled = true;
        try {
          const res = await fetch(nextPageUrl);
          const html = await res.text();
          const parser = new DOMParser();
          const nextDoc = parser.parseFromString(html, 'text/html');
          const newCards = Array.from(nextDoc.querySelectorAll('#cat-grid .card-link'));
          newCards.forEach((c) => catGrid.appendChild(c.cloneNode(true)));
          const nextNextAnchor = nextDoc.getElementById('cat-next-page');
          nextPageUrl = nextNextAnchor ? nextNextAnchor.href : null;
          loadMoreBtn.textContent = 'Load More Stories';
          loadMoreBtn.disabled = false;
          if (!nextPageUrl && moreWrap) moreWrap.style.display = 'none';
          const newTotal = (hero ? 1 : 0) + catGrid.children.length;
          if (count) count.textContent = `${newTotal}${nextPageUrl ? '+' : ''} stories`;
        } catch (e) {
          loadMoreBtn.textContent = 'Load More Stories';
          loadMoreBtn.disabled = false;
        }
      });
    }
  }

  // --- Author page: load more ---------------------------------------------
  const authorGrid = document.getElementById('author-grid');
  if (authorGrid && authorGrid.children.length > 6) {
    document.getElementById('author-load-more-wrap')?.style.setProperty('display', 'flex');
    document.getElementById('author-load-more-btn')?.addEventListener('click', () => {
      authorGrid.classList.add('show-all');
      const wrap = document.getElementById('author-load-more-wrap');
      if (wrap) wrap.style.display = 'none';
    });
  }

  // --- Saved articles (localStorage, no login required) ------------------
  const SAVE_KEY = 'acta_saved';
  function getSavedSlugs() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch { return []; }
  }
  function setSavedSlugs(list) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch {}
  }

  // Saved page — fetches matching posts from the Content API and renders them.
  const savedGrid = document.getElementById('saved-grid');
  if (savedGrid) {
    const subtitle = document.getElementById('saved-subtitle');
    const emptyState = document.getElementById('saved-empty');

    function savedCardHTML(p) {
      const kicker = escapeHtml((p.tags && p.tags[0] && p.tags[0].name) || '');
      const title = escapeHtml(p.title || '');
      const dek = escapeHtml(p.custom_excerpt || '');
      const readTime = p.reading_time ? `${p.reading_time} min read` : '';
      const date = p.published_at
        ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const img = p.feature_image || null;
      return `
        <a class="card-link" href="${escapeHtml(p.url)}" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;">
          <div class="article-image-frame" style="position:relative;overflow:hidden;width:100%;aspect-ratio:3/2;margin-bottom:15px;background:#2b3a55;">
            ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">` : `<div class="text-card-fill" data-layout="text"><p>${dek}</p></div>`}
            <button class="unsave-btn" type="button" data-slug="${escapeHtml(p.slug)}" aria-label="Remove from saved" style="position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(22,19,13,0.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent,#f5c518)" stroke="var(--accent,#f5c518)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 4h12v16l-6-4-6 4z"></path></svg>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">
            <span style="width:4px;height:14px;background:var(--accent,#f5c518);display:block;"></span>
            <span style="font:600 14px/1 var(--gh-font-heading,'Archivo');letter-spacing:.14em;text-transform:uppercase;color:var(--ink);">${kicker}</span>
          </div>
          <h3 style="font:600 21px/1.2 var(--gh-font-heading,'Archivo'),sans-serif;color:var(--ink);margin:0 0 9px;text-wrap:balance;">${title}</h3>
          ${dek && img ? `<p style="font:400 15px/1.5 var(--gh-font-body,'Newsreader'),Georgia,serif;color:var(--ink-muted);margin:0 0 10px;">${dek}</p>` : ''}
          <div style="font:600 14px/1 var(--gh-font-heading,'Archivo');letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);">${date}${date && readTime ? ' · ' : ''}${readTime}</div>
        </a>`;
    }

    function renderSaved(posts) {
      const n = posts.length;
      if (subtitle) {
        subtitle.textContent = n > 0
          ? `${n} ${n === 1 ? 'story' : 'stories'} you've bookmarked to read later.`
          : 'Nothing saved yet.';
      }
      if (n === 0) {
        savedGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      savedGrid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      savedGrid.innerHTML = posts.map(savedCardHTML).join('');
      savedGrid.querySelectorAll('.unsave-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSavedSlugs(getSavedSlugs().filter((s) => s !== btn.dataset.slug));
          btn.closest('a')?.remove();
          const remaining = savedGrid.querySelectorAll('.card-link').length;
          if (remaining === 0) renderSaved([]);
          else if (subtitle) subtitle.textContent = `${remaining} ${remaining === 1 ? 'story' : 'stories'} you've bookmarked to read later.`;
        });
      });
    }

    const slugs = getSavedSlugs();
    if (slugs.length === 0) {
      renderSaved([]);
    } else {
      const { url: apiUrl, key: apiKey } = contentApi();
      if (apiUrl && apiKey) {
        const filter = encodeURIComponent(`slug:[${slugs.join(',')}]`);
        const fields = 'slug,title,custom_excerpt,feature_image,reading_time,url,published_at';
        fetch(`${apiUrl}/ghost/api/content/posts/?key=${apiKey}&filter=${filter}&include=tags&fields=${fields}&limit=all`)
          .then((r) => r.json())
          .then((data) => {
            // preserve the user's save order
            const map = Object.fromEntries((data.posts || []).map((p) => [p.slug, p]));
            renderSaved(slugs.map((s) => map[s]).filter(Boolean));
          })
          .catch(() => renderSaved([]));
      } else {
        if (subtitle) subtitle.textContent = 'Configure the Content API key in theme settings to load saved stories.';
      }
    }
  }

  // Bookmark toggle — on post pages, sync the button state with localStorage.
  const bookmarkBtn = document.querySelector('[data-bookmark]');
  if (bookmarkBtn) {
    const slug = bookmarkBtn.getAttribute('data-bookmark');
    const icon = bookmarkBtn.querySelector('.bookmark-icon');

    function updateBookmarkUI(saved) {
      bookmarkBtn.setAttribute('aria-pressed', String(saved));
      bookmarkBtn.setAttribute('aria-label', saved ? 'Remove from saved' : 'Save for later');
      if (icon) {
        // Set via style, not attributes: SVG presentation attributes don't
        // resolve var(), and the unsaved stroke follows the ink color.
        icon.style.fill = saved ? 'var(--accent,#f5c518)' : 'none';
        icon.style.stroke = saved ? 'var(--accent,#f5c518)' : 'currentColor';
      }
    }

    updateBookmarkUI(getSavedSlugs().includes(slug));

    bookmarkBtn.addEventListener('click', () => {
      const current = getSavedSlugs();
      const isSaved = current.includes(slug);
      setSavedSlugs(isSaved ? current.filter((s) => s !== slug) : [...current, slug]);
      updateBookmarkUI(!isSaved);
    });
  }

  // --- Native share sheet (mobile) ---------------------------------------
  // On devices that support navigator.share (iOS/Android), swap the
  // individual social buttons for a single native share button.
  const nativeShareBtn = document.getElementById('native-share-btn');
  if (nativeShareBtn && navigator.share && window.matchMedia('(hover:none),(pointer:coarse)').matches) {
    const shareBar = document.getElementById('share-bar');
    // Hide the individual share controls, show the native button
    if (shareBar) {
      shareBar.querySelectorAll('[data-share],[data-copy-link],.share-label').forEach((el) => {
        el.style.display = 'none';
      });
    }
    nativeShareBtn.style.display = 'flex';
    nativeShareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({ title: document.title, url: location.href });
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share failed:', err);
      }
    });
  }

  // --- External links in article body ------------------------------------
  // Add target="_blank" + rel="noopener noreferrer" to any external link
  // inside the article body that an editor may have written without them.
  document.querySelectorAll('.article-body a[href]').forEach((a) => {
    try {
      if (new URL(a.href).origin !== location.origin) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    } catch {}
  });
})();
