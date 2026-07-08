(function () {
  // Masthead date — set client-side so it's always the visitor's current
  // date regardless of when the page was cached/rendered.
  const today = `${new Date().toLocaleDateString('en-US', { weekday: 'long' })} · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  document.querySelectorAll('[data-today]').forEach((el) => { el.textContent = today; });

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
  function openMenu() {
    if (!drawer || !scrim) return;
    drawer.style.transform = 'translateX(0)';
    scrim.style.opacity = '1';
    scrim.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (!drawer || !scrim) return;
    drawer.style.transform = 'translateX(-100%)';
    scrim.style.opacity = '0';
    scrim.style.pointerEvents = 'none';
    document.body.style.overflow = '';
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
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  // --- Search -----------------------------------------------------------
  // Same weighted-scoring approach as the Astro build, but the index is no
  // longer baked in at build time — it's fetched once from Ghost's Content
  // API (public, read-only key configured as a theme setting) and cached
  // in memory for the rest of the session.
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
      panel.innerHTML = `<div style="padding:28px 24px;text-align:center;font:400 16px/1.5 'Newsreader',Georgia,serif;color:#6b6459;">No results for "<strong style="color:#16130d;">${q}</strong>"</div>`;
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = results.map((a, i) => `
      <a class="card-link" href="${a.url}" style="display:flex;gap:16px;align-items:center;padding:14px 20px;text-decoration:none;color:inherit;${i < results.length - 1 ? 'border-bottom:1px solid #f0ede8;' : ''}">
        <div class="article-image-frame" style="flex:0 0 auto;width:68px;height:50px;border-radius:4px;overflow:hidden;background:${a.bg};">
          ${a.image ? `<img src="${a.image}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">` : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font:600 10px/1 'Archivo';letter-spacing:.1em;text-transform:uppercase;color:#6b6459;margin-bottom:5px;">${a.kicker}</div>
          <div style="font:600 15px/1.25 'Archivo',sans-serif;color:#16130d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</div>
          <div style="font:400 12px/1 'Archivo';color:#6b6459;margin-top:4px;">${a.byline}${a.byline && a.readTime ? ' · ' : ''}${a.readTime}</div>
        </div>
      </a>
    `).join('');
  }

  function openSearch() {
    if (!overlay) return;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    getSearchIndex();
    setTimeout(() => input?.focus(), 30);
  }
  function closeSearch() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (panel) { panel.innerHTML = ''; panel.style.display = 'none'; }
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
      btn.innerHTML = '<span style="font:700 10px/1 Archivo;color:#16130d;">Copied</span>';
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
        el.style.font = "600 12px/1 'Archivo'";
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
        if (moreWrap) moreWrap.style.display = filter === '' && cards.length > 5 ? 'flex' : 'none';
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
    } else if (moreWrap && cards.length > 5) {
      moreWrap.style.display = 'flex';
    }

    document.getElementById('load-more-btn')?.addEventListener('click', () => {
      catGrid.classList.add('show-all');
      if (moreWrap) moreWrap.style.display = 'none';
    });
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
})();
