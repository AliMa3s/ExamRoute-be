/* ExamRoute Belgium - vanilla JS app */
(function () {
  'use strict';

  const STORAGE_KEY = 'examroute.lang';

  // ===================== i18n =====================
  const I18N = {
    nl: {
      chooseLanguage: 'Kies je taal',
      tagline: 'Belgische oefenroutes',
      searchPlaceholder: 'Zoek stad, regio, examencentrum of adres',
      filterAll: 'Alle', filterBrussels: 'Brussel', filterFlanders: 'Vlaanderen', filterWallonia: 'Wallonië',
      cities: 'Steden', centers: 'Examencentra', routes: 'Oefenroutes', back: 'Terug',
      noResults: 'Geen resultaten gevonden.',
      disclaimerShort: 'Enkel ter oefening. Bevestig officiële details bij het examencentrum.',
      disclaimerLong: 'Enkel ter oefening. Dit zijn voorgestelde oefenroutes, geen officiële examenroutes. Bevestig altijd de details bij het examencentrum.',
      openMaps: 'Open in Google Maps',
      address: 'Adres', operator: 'Operator', phone: 'Telefoon',
      duration: 'min', distance: 'km', focus: 'Focus', notes: 'Aandachtspunten',
      cityCount: (n) => `${n} stad${n === 1 ? '' : 'en'}`,
      regionFlanders: 'Vlaanderen', regionWallonia: 'Wallonië', regionBrussels: 'Brussel',
      centerCount: (n) => `${n} centrum${n === 1 ? '' : 's'}`,
      aboutTitle: 'Over ExamRoute',
      aboutVersion: 'Versie 1.0',
      aboutText: 'ExamRoute helpt Belgische leerling-bestuurders bij het verkennen van oefenroutes rond officiële examencentra in Vlaanderen, Brussel en Wallonië.',
      aboutDisclaimer: 'Enkel ter oefening. Dit zijn voorgestelde oefenroutes, geen officiële examenroutes. Bevestig altijd de details bij het examencentrum.',
      aboutSupport: 'Steun dit project',
      aboutClose: 'Sluiten',
      useMyLocation: 'Vertrek vanaf mijn locatie',
      locationHint: 'Toon de route vanaf waar je bent',
      locationLoading: 'Locatie ophalen…',
      locationActive: 'Huidige locatie wordt gebruikt',
      locationDenied: 'Locatietoegang geweigerd',
      locationUnsupported: 'Locatie niet beschikbaar'
    },
    en: {
      chooseLanguage: 'Choose your language',
      tagline: 'Belgian practice routes',
      searchPlaceholder: 'Search city, region, center, address',
      filterAll: 'All', filterBrussels: 'Brussels', filterFlanders: 'Flanders', filterWallonia: 'Wallonia',
      cities: 'Cities', centers: 'Exam centers', routes: 'Practice routes', back: 'Back',
      noResults: 'No matching cities found.',
      disclaimerShort: 'Practice guidance only. Confirm official exam details with the exam center.',
      disclaimerLong: 'Practice guidance only. These are suggested practice routes and not official exam routes. Always confirm details with the exam center.',
      openMaps: 'Open in Google Maps',
      address: 'Address', operator: 'Operator', phone: 'Phone',
      duration: 'min', distance: 'km', focus: 'Focus', notes: 'Key points',
      cityCount: (n) => `${n} ${n === 1 ? 'city' : 'cities'}`,
      regionFlanders: 'Flanders', regionWallonia: 'Wallonia', regionBrussels: 'Brussels',
      centerCount: (n) => `${n} ${n === 1 ? 'center' : 'centers'}`,
      aboutTitle: 'About ExamRoute',
      aboutVersion: 'Version 1.0',
      aboutText: 'ExamRoute helps Belgian learner drivers explore practice routes around official exam centers — across Flanders, Brussels and Wallonia.',
      aboutDisclaimer: 'Practice guidance only. These are suggested practice routes and not official exam routes. Always confirm details with the exam center.',
      aboutSupport: 'Support this project',
      aboutClose: 'Close',
      useMyLocation: 'Start from my location',
      locationHint: 'Show directions from where you are',
      locationLoading: 'Getting location…',
      locationActive: 'Using current location',
      locationDenied: 'Location access denied',
      locationUnsupported: 'Location unavailable'
    },
    fr: {
      chooseLanguage: 'Choisissez votre langue',
      tagline: 'Itinéraires d\'examen belges',
      searchPlaceholder: 'Ville, région, centre ou adresse',
      filterAll: 'Toutes', filterBrussels: 'Bruxelles', filterFlanders: 'Flandre', filterWallonia: 'Wallonie',
      cities: 'Villes', centers: 'Centres d\'examen', routes: 'Itinéraires de pratique', back: 'Retour',
      noResults: 'Aucune ville trouvée.',
      disclaimerShort: 'À titre indicatif. Confirmez les détails officiels avec le centre d\'examen.',
      disclaimerLong: 'À titre indicatif uniquement. Ce sont des itinéraires de pratique suggérés et non des itinéraires officiels. Confirmez toujours les détails avec le centre d\'examen.',
      openMaps: 'Ouvrir dans Google Maps',
      address: 'Adresse', operator: 'Opérateur', phone: 'Téléphone',
      duration: 'min', distance: 'km', focus: 'Objectif', notes: 'Points clés',
      cityCount: (n) => `${n} ville${n === 1 ? '' : 's'}`,
      regionFlanders: 'Flandre', regionWallonia: 'Wallonie', regionBrussels: 'Bruxelles',
      centerCount: (n) => `${n} centre${n === 1 ? '' : 's'}`,
      aboutTitle: 'À propos d\'ExamRoute',
      aboutVersion: 'Version 1.0',
      aboutText: 'ExamRoute aide les apprentis conducteurs belges à explorer des itinéraires de pratique autour des centres d\'examen officiels — en Flandre, à Bruxelles et en Wallonie.',
      aboutDisclaimer: 'À titre indicatif uniquement. Ce sont des itinéraires de pratique suggérés et non des itinéraires officiels. Confirmez toujours les détails avec le centre d\'examen.',
      aboutSupport: 'Soutenir ce projet',
      aboutClose: 'Fermer',
      useMyLocation: 'Partir depuis ma position',
      locationHint: 'Itinéraire depuis votre position',
      locationLoading: 'Localisation en cours…',
      locationActive: 'Position actuelle utilisée',
      locationDenied: 'Accès à la localisation refusé',
      locationUnsupported: 'Localisation indisponible'
    }
  };

  // ===================== Data =====================
  // Cities, centers and route overrides live in data.js. That file is
  // loaded before app.js (see index.html) and exposes window.EXAM_ROUTE_DATA.
  const CITIES = (window.EXAM_ROUTE_DATA && window.EXAM_ROUTE_DATA.cities) || [];

  // ===================== State =====================
  const state = {
    lang: 'en',
    region: 'all',
    query: '',
    screen: 'language',
    selectedCityId: null,
    selectedCenterId: null,
    useLocation: false,
    userLocation: null,
    locationStatus: 'idle' // idle | loading | granted | denied | unsupported
  };

  function buildRouteUrl(route, center, cityName) {
    // Use the documented ?api=1 format. The Android Google Maps app
    // parses origin/destination/waypoints from this format natively;
    // the /maps/dir/A/B/C/... path style only renders 2 stops in the
    // mobile Maps app.
    const places = (route.path && route.path.length >= 2)
      ? route.path.map(p => p + ', ' + cityName)
      : [center.address];

    let origin, destination, waypoints;
    if (state.userLocation) {
      origin = state.userLocation.lat.toFixed(6) + ',' + state.userLocation.lng.toFixed(6);
      destination = places[places.length - 1];
      waypoints = places.slice(0, -1);
    } else {
      origin = places[0];
      destination = places[places.length - 1];
      waypoints = places.slice(1, -1);
    }

    let url = 'https://www.google.com/maps/dir/?api=1';
    url += '&origin=' + encodeURIComponent(origin);
    url += '&destination=' + encodeURIComponent(destination);
    if (waypoints.length > 0) {
      url += '&waypoints=' + waypoints.map(encodeURIComponent).join('%7C');
    }
    url += '&travelmode=driving';
    return url;
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      state.locationStatus = 'unsupported';
      state.useLocation = false;
      const tgl = $('#useLocationToggle');
      if (tgl) tgl.checked = false;
      updateLocationUI();
      return;
    }
    state.locationStatus = 'loading';
    state.locationError = null;
    updateLocationUI();
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.locationStatus = 'granted';
        state.locationError = null;
        updateLocationUI();
        refreshRouteUrls();
      },
      err => {
        state.userLocation = null;
        state.locationStatus = 'denied';
        // PositionError.code: 1=denied, 2=unavailable, 3=timeout
        const codeMap = { 1: 'PERMISSION_DENIED', 2: 'POSITION_UNAVAILABLE', 3: 'TIMEOUT' };
        state.locationError = (codeMap[err && err.code] || 'ERROR') + (err && err.message ? ': ' + err.message : '');
        state.useLocation = false;
        const tgl = $('#useLocationToggle');
        if (tgl) tgl.checked = false;
        updateLocationUI();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function updateLocationUI() {
    const el = $('#locStatus');
    if (!el) return;
    el.classList.toggle('loc-status-active', state.locationStatus === 'granted');
    el.classList.toggle('loc-status-error', state.locationStatus === 'denied' || state.locationStatus === 'unsupported');

    if (state.locationStatus === 'granted' && state.userLocation) {
      el.removeAttribute('data-i18n');
      const lat = state.userLocation.lat.toFixed(4);
      const lng = state.userLocation.lng.toFixed(4);
      el.textContent = t().locationActive + ' · ' + lat + ', ' + lng;
      return;
    }
    if (state.locationStatus === 'denied' && state.locationError) {
      el.removeAttribute('data-i18n');
      el.textContent = t().locationDenied + ' · ' + state.locationError;
      return;
    }
    const map = {
      loading: 'locationLoading',
      denied: 'locationDenied',
      unsupported: 'locationUnsupported',
      idle: 'locationHint'
    };
    const key = map[state.locationStatus] || 'locationHint';
    el.setAttribute('data-i18n', key);
    el.textContent = t()[key];
  }

  function refreshRouteUrls() {
    if (state.screen !== 'center') return;
    const city = CITIES.find(c => c.id === state.selectedCityId);
    if (!city) return;
    const center = city.centers.find(c => c.id === state.selectedCenterId);
    if (!center) return;
    const cards = $$('.route-card');
    cards.forEach((card, idx) => {
      const route = center.routes[idx];
      if (!route) return;
      const btn = card.querySelector('.maps-btn');
      if (btn) btn.setAttribute('href', buildRouteUrl(route, center, city.name.nl));
    });
  }

  // ===================== DOM helpers =====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  function t() { return I18N[state.lang]; }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const v = t()[key];
      if (typeof v === 'string') el.textContent = v;
    });
    $$('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const v = t()[key];
      if (typeof v === 'string') el.setAttribute('placeholder', v);
    });
    const currentLangEl = $('#currentLang');
    if (currentLangEl) currentLangEl.textContent = state.lang.toUpperCase();
    const searchInput = $('#searchInput');
    if (searchInput) searchInput.value = state.query;
  }

  // ===================== Hash routing =====================
  // URL hash gives us:
  //   - Working WebView/browser back button
  //   - Shareable deep links to a specific city or center
  // Hashes: #/, #/home, #/city/:cityId, #/city/:cityId/center/:centerId
  let suppressHashHandler = false;

  function buildHash(screen) {
    if (screen === 'language') return '#/';
    if (screen === 'home') return '#/home';
    if (screen === 'city') return '#/city/' + encodeURIComponent(state.selectedCityId || '');
    if (screen === 'center') return '#/city/' + encodeURIComponent(state.selectedCityId || '') + '/center/' + encodeURIComponent(state.selectedCenterId || '');
    return '#/';
  }

  function navigate(screen, opts) {
    opts = opts || {};
    if (opts.cityId !== undefined) state.selectedCityId = opts.cityId;
    if (opts.centerId !== undefined) state.selectedCenterId = opts.centerId;
    const newHash = buildHash(screen);
    suppressHashHandler = true;
    if (opts.replace) {
      history.replaceState(null, '', newHash);
    } else if (location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
    suppressHashHandler = false;
    renderForScreen(screen);
  }

  function renderForScreen(screen) {
    state.screen = screen;
    if (screen === 'home') {
      renderHome();
    } else if (screen === 'city') {
      if (!renderCity(state.selectedCityId)) { navigate('home', { replace: true }); return; }
    } else if (screen === 'center') {
      if (!renderCenter(state.selectedCityId, state.selectedCenterId)) { navigate('home', { replace: true }); return; }
    }
    showScreen(screen);
  }

  function parseHash() {
    const h = (location.hash || '').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    // parts: ['city', cityId, 'center', centerId] or ['city', cityId] or ['home'] or []
    if (parts.length === 0) return { screen: state.lang ? 'home' : 'language' };
    if (parts[0] === 'home') return { screen: 'home' };
    if (parts[0] === 'city' && parts[1]) {
      if (parts[2] === 'center' && parts[3]) {
        return { screen: 'center', cityId: decodeURIComponent(parts[1]), centerId: decodeURIComponent(parts[3]) };
      }
      return { screen: 'city', cityId: decodeURIComponent(parts[1]) };
    }
    return { screen: 'home' };
  }

  function onHashChange() {
    if (suppressHashHandler) return;
    const parsed = parseHash();
    // If user lands deep without picking a language yet, still allow it
    // (we have a stored or default language already applied at boot).
    if (parsed.screen === 'language') { showScreen('language'); state.screen = 'language'; return; }
    if (parsed.cityId !== undefined) state.selectedCityId = parsed.cityId;
    if (parsed.centerId !== undefined) state.selectedCenterId = parsed.centerId;
    renderForScreen(parsed.screen);
  }

  function showScreen(name) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const map = { language: 'screen-language', home: 'screen-home', city: 'screen-city', center: 'screen-center' };
    const el = document.getElementById(map[name]);
    if (el) el.classList.add('active');
    const fab = $('#aboutFab');
    if (fab) fab.hidden = (name === 'language');
    window.scrollTo(0, 0);
  }

  function openAbout() {
    const m = $('#aboutModal');
    if (!m) return;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }
  function closeAbout() {
    const m = $('#aboutModal');
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => { m.hidden = true; }, 180);
    document.body.style.overflow = '';
  }

  // ===================== Rendering =====================
  function regionLabel(region) {
    if (region === 'flanders') return t().regionFlanders;
    if (region === 'wallonia') return t().regionWallonia;
    return t().regionBrussels;
  }
  function difficultyClass(diff) {
    const en = diff.en.toLowerCase();
    if (en.includes('easy')) return 'easy';
    if (en.includes('hard')) return 'hard';
    return 'medium';
  }
  function matchesQuery(city) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [city.name.nl, city.name.en, city.name.fr, city.region, regionLabel(city.region), city.province.nl, city.province.en, city.province.fr];
    city.centers.forEach(c => haystack.push(c.name.nl, c.name.en, c.name.fr, c.address, c.operator));
    return haystack.join(' | ').toLowerCase().includes(q);
  }
  function getFilteredCities() {
    return CITIES.filter(c => {
      if (state.region !== 'all' && c.region !== state.region) return false;
      if (!matchesQuery(c)) return false;
      return true;
    });
  }

  function renderHome() {
    const grid = $('#cityGrid');
    const empty = $('#cityEmpty');
    const count = $('#cityCount');
    const list = getFilteredCities();
    grid.innerHTML = '';
    list.forEach((city, index) => {
      const card = document.createElement('button');
      card.className = 'card city-card';
      card.setAttribute('data-city-id', city.id);
      const cityName = city.name[state.lang];
      const p = paletteFor(city.id, index);
      const accentStyle = `background:${p.accent}`;
      const badgeStyle = `background:${p.bg};color:${p.text};border-color:${p.border}`;
      card.innerHTML = `
        <div class="city-accent" style="${accentStyle}"></div>
        <div class="city-badge" style="${badgeStyle}">${escapeHtml(cityInitial(cityName))}</div>
        <div class="city-body">
          <h3 class="city-name">${escapeHtml(cityName)}</h3>
          <p class="city-meta">${escapeHtml(city.province[state.lang])}</p>
        </div>
        <div class="card-foot">
          <span class="region-pill ${city.region}">${escapeHtml(regionLabel(city.region))}</span>
          <span class="center-count-pill">${escapeHtml(t().centerCount(city.centers.length))}</span>
        </div>
      `;
      card.addEventListener('click', () => navigate('city', { cityId: city.id }));
      grid.appendChild(card);
    });
    count.textContent = t().cityCount(list.length);
    empty.hidden = list.length !== 0;
  }

  function renderCity(cityId) {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return false;
    $('#cityName').textContent = city.name[state.lang];
    $('#cityMeta').textContent = `${regionLabel(city.region)} · ${city.province[state.lang]}`;
    const list = $('#centerList');
    list.innerHTML = '';
    const p = paletteFor(city.id, 0);
    city.centers.forEach(center => {
      const item = document.createElement('div');
      item.className = 'center-card';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      const headerStyle = `background:${p.bg};border-color:${p.border}`;
      const badgeStyle = `background:${p.accent};color:#fff`;
      const iconStyle = `color:${p.text}`;
      item.innerHTML = `
        <div class="center-header" style="${headerStyle}">
          <div class="center-pin" style="${iconStyle}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
          </div>
          <div class="center-route-badge" style="${badgeStyle}">
            <strong>${center.routes.length}</strong>
            <span>${escapeHtml(t().routes.toLowerCase())}</span>
          </div>
        </div>
        <div class="center-body">
          <h3 class="center-name">${escapeHtml(center.name[state.lang])}</h3>
          <p class="center-sub">
            <svg class="row-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
            <span>${escapeHtml(center.address)}</span>
          </p>
          <div class="center-chips">
            <span class="chip chip-operator">${escapeHtml(center.operator)}</span>
            <a class="chip chip-phone" href="tel:${escapeHtml(center.phone.replace(/\s+/g,''))}" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 15.5a12.5 12.5 0 0 1-3.93-.63 1 1 0 0 0-1 .25l-2.2 2.2a15 15 0 0 1-6.59-6.59l2.2-2.2a1 1 0 0 0 .25-1A12.5 12.5 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1A17 17 0 0 0 20 21a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/></svg>
              ${escapeHtml(center.phone)}
            </a>
          </div>
        </div>
        <div class="center-cta" style="color:${p.accent}">
          <span>${escapeHtml(t().routes)}</span>
          <span class="cta-arrow">›</span>
        </div>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let tel: link fire
        navigate('center', { cityId: city.id, centerId: center.id });
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('center', { cityId: city.id, centerId: center.id });
        }
      });
      list.appendChild(item);
    });
    return true;
  }

  function renderCenter(cityId, centerId) {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return false;
    const center = city.centers.find(c => c.id === centerId);
    if (!center) return false;
    $('#centerName').textContent = center.name[state.lang];
    $('#centerMeta').textContent = `${city.name[state.lang]} · ${regionLabel(city.region)}`;
    const tgl = $('#useLocationToggle');
    if (tgl) tgl.checked = state.useLocation && state.locationStatus === 'granted';
    updateLocationUI();
    const list = $('#routeList');
    list.innerHTML = '';
    center.routes.forEach(route => {
      const card = document.createElement('div');
      card.className = 'route-card';
      const dc = difficultyClass(route.difficulty);
      card.innerHTML = `
        <div class="route-image${route.imageUrl ? ' has-photo' : ''}">
          ${route.imageUrl ? `<img src="${escapeHtml(route.imageUrl)}" alt="${escapeHtml(route.label[state.lang])}" loading="lazy" />` : routeIllustration(route.image)}
          <span class="route-label">${escapeHtml(route.label[state.lang])}</span>
          <span class="route-difficulty ${dc}">${escapeHtml(route.difficulty[state.lang])}</span>
        </div>
        <div class="route-body">
          <h3 class="route-focus">${escapeHtml(route.focus[state.lang])}</h3>
          <div class="route-stats">
            <span class="route-stat"><strong>${route.durationMin}</strong> ${escapeHtml(t().duration)}</span>
            <span class="route-stat"><strong>${route.distanceKm}</strong> ${escapeHtml(t().distance)}</span>
          </div>
          <div class="route-tags">
            ${route.tags.map(tag => `<span class="route-tag">${escapeHtml(tag[state.lang])}</span>`).join('')}
          </div>
          ${route.path ? `<ol class="route-path">${route.path.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ol>` : ''}
          <div class="route-notes">
            <ul>${route.notes.map(n => `<li>${escapeHtml(n[state.lang])}</li>`).join('')}</ul>
          </div>
          <a class="maps-btn" href="${buildRouteUrl(route, center, city.name.nl)}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
            ${escapeHtml(t().openMaps)}
          </a>
        </div>
      `;
      list.appendChild(card);
    });
    return true;
  }

  function routeIllustration(kind) {
    if (kind === 'A') {
      return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs><linearGradient id="gA" x1="0" x2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="1" stop-color="#333"/></linearGradient></defs>
        <rect width="300" height="120" fill="url(#gA)"/>
        <g stroke="#fcbf1e" stroke-width="3" fill="none" stroke-linecap="round">
          <path d="M0,90 Q60,90 80,70 T140,60 T220,70 T300,55"/>
          <path d="M0,100 Q60,100 80,80 T140,70 T220,80 T300,65" opacity="0.4"/>
        </g>
        <g fill="#d62828"><circle cx="80" cy="70" r="4"/><circle cx="220" cy="70" r="4"/></g>
        <g fill="#fff" opacity="0.85"><rect x="40" y="30" width="14" height="22" rx="2"/><rect x="58" y="36" width="14" height="16" rx="2"/><rect x="240" y="26" width="14" height="26" rx="2"/></g>
      </svg>`;
    }
    if (kind === 'B') {
      return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
        <rect width="300" height="120" fill="#1a1a1a"/>
        <g stroke="#fcbf1e" stroke-width="2" fill="none" stroke-dasharray="6 6">
          <rect x="40" y="40" width="60" height="40" rx="3"/>
          <rect x="120" y="40" width="60" height="40" rx="3"/>
          <rect x="200" y="40" width="60" height="40" rx="3"/>
        </g>
        <g fill="#d62828"><rect x="130" y="48" width="40" height="24" rx="3"/></g>
        <g stroke="#fff" stroke-width="1.5" opacity="0.4"><line x1="0" y1="20" x2="300" y2="20"/><line x1="0" y1="100" x2="300" y2="100"/></g>
      </svg>`;
    }
    return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
      <rect width="300" height="120" fill="#111"/>
      <g stroke="#fff" stroke-width="1" opacity="0.15"><line x1="0" y1="40" x2="300" y2="40"/><line x1="0" y1="60" x2="300" y2="60"/><line x1="0" y1="80" x2="300" y2="80"/></g>
      <path d="M-10,80 C50,30 120,110 180,60 C220,30 260,70 310,40" stroke="#fcbf1e" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-10,80 C50,30 120,110 180,60 C220,30 260,70 310,40" stroke="#d62828" stroke-width="1" fill="none" stroke-dasharray="4 6" opacity="0.7"/>
      <circle cx="20" cy="76" r="5" fill="#fff"/><circle cx="280" cy="44" r="5" fill="#d62828"/>
    </svg>`;
  }

  // City color palette — deterministic per city id so colors stay stable.
  const CITY_PALETTES = [
    { accent: '#fcbf1e', bg: '#fff3c4', text: '#5e4a00', border: '#f1d77b' }, // yellow
    { accent: '#7cb342', bg: '#e6f4d6', text: '#2e4d10', border: '#bcdb95' }, // green
    { accent: '#42a5f5', bg: '#d8ecfb', text: '#0d3a5e', border: '#9ec9eb' }, // sky
    { accent: '#ef6c5e', bg: '#fde0dc', text: '#6b1d15', border: '#f0b5ad' }, // coral
    { accent: '#ab7df0', bg: '#ece0fa', text: '#3a1f6b', border: '#c8b2ea' }, // lavender
    { accent: '#26a69a', bg: '#d4f0ed', text: '#0d4540', border: '#9dd2cc' }, // teal
    { accent: '#ec407a', bg: '#fbdce8', text: '#6b1a3a', border: '#eeb1c8' }, // pink
    { accent: '#ff8a3d', bg: '#fde4cf', text: '#6b3010', border: '#f1be91' }, // orange
    { accent: '#5c6bc0', bg: '#dde0f1', text: '#1f266b', border: '#a8b0db' }, // indigo
    { accent: '#8d6e63', bg: '#e7ddd6', text: '#3e2a1f', border: '#bfa899' }, // brown
    { accent: '#00838f', bg: '#cfe9ec', text: '#003c44', border: '#92c9d0' }, // dark cyan
    { accent: '#c0ca33', bg: '#eef0c4', text: '#3e421a', border: '#d4d98c' }  // lime
  ];
  // Hard-pinned colors for specific cities — overrides the cycle.
  const CITY_COLOR_PINS = {
    gent: 5 // teal
  };
  function paletteFor(cityId, index) {
    if (CITY_COLOR_PINS[cityId] != null) return CITY_PALETTES[CITY_COLOR_PINS[cityId]];
    return CITY_PALETTES[index % CITY_PALETTES.length];
  }

  function cityInitial(name) {
    const cleaned = name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    return cleaned ? cleaned[0].toUpperCase() : '·';
  }
  function initials(name) {
    const parts = name.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ===================== Language persistence =====================
  function loadLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) { /* localStorage unavailable */ }
    return null;
  }
  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  // ===================== Event wiring =====================
  function init() {
    const saved = loadLang();
    const hasLang = !!saved;
    state.lang = saved || 'en';
    applyI18n();

    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.getAttribute('data-lang');
        saveLang(state.lang);
        applyI18n();
        navigate('home');
      });
    });

    $('#langToggle').addEventListener('click', () => {
      const order = ['nl', 'en', 'fr'];
      state.lang = order[(order.indexOf(state.lang) + 1) % order.length];
      saveLang(state.lang);
      applyI18n();
      if (state.screen === 'home') renderHome();
      if (state.screen === 'city') renderCity(state.selectedCityId);
      if (state.screen === 'center') renderCenter(state.selectedCityId, state.selectedCenterId);
    });

    $('#searchInput').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderHome();
    });

    $$('#regionFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#regionFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.region = btn.getAttribute('data-region');
        renderHome();
      });
    });

    // Back buttons: use history.back so the URL hash stays in sync and the
    // hardware/Android back button also works the same way.
    $$('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (history.length > 1) history.back();
        else navigate('home', { replace: true });
      });
    });

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);

    // Rebuild the Maps URL at click time so we always use the latest
    // state.userLocation, even if it arrived after the page rendered.
    $('#routeList').addEventListener('click', (e) => {
      const btn = e.target.closest('.maps-btn');
      if (!btn) return;
      const card = btn.closest('.route-card');
      if (!card) return;
      const idx = Array.from(card.parentNode.children).indexOf(card);
      const city = CITIES.find(c => c.id === state.selectedCityId);
      if (!city) return;
      const center = city.centers.find(c => c.id === state.selectedCenterId);
      if (!center) return;
      const route = center.routes[idx];
      if (!route) return;
      btn.href = buildRouteUrl(route, center, city.name.nl);
    });

    $('#useLocationToggle').addEventListener('change', (e) => {
      state.useLocation = e.target.checked;
      if (state.useLocation) {
        requestLocation();
      } else {
        state.userLocation = null;
        state.locationStatus = 'idle';
        updateLocationUI();
        refreshRouteUrls();
      }
    });

    $('#aboutFab').addEventListener('click', openAbout);
    $$('#aboutModal [data-close]').forEach(el => el.addEventListener('click', closeAbout));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#aboutModal').hidden) closeAbout();
    });

    // Initial route decision
    const parsed = parseHash();
    if (parsed.screen === 'language' || (!hasLang && parsed.screen === 'home' && !location.hash)) {
      // No saved language and no deep link → show splash
      if (!hasLang) {
        showScreen('language');
        state.screen = 'language';
        history.replaceState(null, '', '#/');
        return;
      }
    }
    // Language is known (or deep link present): go to the resolved screen
    if (parsed.cityId !== undefined) state.selectedCityId = parsed.cityId;
    if (parsed.centerId !== undefined) state.selectedCenterId = parsed.centerId;
    const target = parsed.screen === 'language' ? 'home' : parsed.screen;
    navigate(target, { replace: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
