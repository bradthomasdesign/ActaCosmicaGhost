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
  // API (public, read-only key configured as a theme setting) and cached
  // in memory for the rest of the session.

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
    const { url, key } = window.ACTA_CONTENT_API || {};
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
      panel.innerHTML = `<div style="padding:28px 24px;text-align:center;font:400 16px/1.5 'Newsreader',Georgia,serif;color:#6b6459;">No results for "<strong style="color:#16130d;">${escapeHtml(q)}</strong>"</div>`;
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = results.map((a, i) => `
      <a class="card-link" href="${escapeHtml(a.url)}" style="display:flex;gap:16px;align-items:center;padding:14px 20px;text-decoration:none;color:inherit;${i < results.length - 1 ? 'border-bottom:1px solid #f0ede8;' : ''}">
        <div class="article-image-frame" style="flex:0 0 auto;width:68px;height:50px;border-radius:4px;overflow:hidden;background:${a.bg};">
          ${a.image ? `<img src="${escapeHtml(a.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">` : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font:600 14px/1 'Archivo';letter-spacing:.1em;text-transform:uppercase;color:#6b6459;margin-bottom:5px;">${escapeHtml(a.kicker)}</div>
          <div style="font:600 15px/1.25 'Archivo',sans-serif;color:#16130d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(a.title)}</div>
          <div style="font:400 14px/1 'Archivo';color:#6b6459;margin-top:4px;">${escapeHtml(a.byline)}${a.byline && a.readTime ? ' · ' : ''}${escapeHtml(a.readTime)}</div>
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
      btn.innerHTML = '<span style="font:700 14px/1 Archivo;color:#16130d;">Copied</span>';
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
        el.style.color = active ? '#fff' : '#4a4437';
        el.style.background = active ? '#16130d' : 'transparent';
        el.style.border = `1px solid ${active ? '#16130d' : '#948d80'}`;
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
            ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">` : ''}
            <button class="unsave-btn" type="button" data-slug="${escapeHtml(p.slug)}" aria-label="Remove from saved" style="position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(22,19,13,0.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent,#f5c518)" stroke="var(--accent,#f5c518)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 4h12v16l-6-4-6 4z"></path></svg>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">
            <span style="width:4px;height:14px;background:var(--accent,#f5c518);display:block;"></span>
            <span style="font:600 14px/1 var(--gh-font-heading,'Archivo');letter-spacing:.14em;text-transform:uppercase;color:#16130d;">${kicker}</span>
          </div>
          <h3 style="font:600 21px/1.2 var(--gh-font-heading,'Archivo'),sans-serif;color:#16130d;margin:0 0 9px;text-wrap:balance;">${title}</h3>
          ${dek ? `<p style="font:400 15px/1.5 var(--gh-font-body,'Newsreader'),Georgia,serif;color:#6b6459;margin:0 0 10px;">${dek}</p>` : ''}
          <div style="font:600 14px/1 var(--gh-font-heading,'Archivo');letter-spacing:.05em;text-transform:uppercase;color:#6b6459;">${date}${date && readTime ? ' · ' : ''}${readTime}</div>
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
      const { url: apiUrl, key: apiKey } = window.ACTA_CONTENT_API || {};
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
        icon.setAttribute('fill', saved ? 'var(--accent,#f5c518)' : 'none');
        icon.setAttribute('stroke', saved ? 'var(--accent,#f5c518)' : '#16130d');
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
