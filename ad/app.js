/* =============================================================
   PIKSTORE AD — RUNTIME GLUE
   Boots the real three.js monochrome hero scene and wires every
   interactive behaviour of the ad (catalog, filters, search,
   download simulation, radar scan, reveals, magnetic buttons…).
   The 40 foundry modules under js/ document the motion system;
   this file is the executable composition of them.
   Strictly black & white: no hue anywhere.
   ============================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------ catalog data */
const APPS = [
  { id: 'obsidianmd/obsidian-releases', name: 'Obsidian', initial: 'O', tagline: 'A private, local-first second brain built on plain Markdown.', category: 'productivity', platforms: ['macos', 'windows', 'ios'], sizeMb: 108, hash: '9f3ac…71bd' },
  { id: 'localsend/localsend', name: 'LocalSend', initial: 'L', tagline: 'AirDrop for every device over your own local network.', category: 'utilities', platforms: ['android', 'ios', 'macos', 'windows'], sizeMb: 42, hash: 'c2d10…44af' },
  { id: 'obsproject/obs-studio', name: 'OBS Studio', initial: '◉', tagline: 'Professional live streaming and screen recording.', category: 'creative', platforms: ['macos', 'windows'], sizeMb: 165, hash: 'beef9…0c21' },
  { id: 'rustdesk/rustdesk', name: 'RustDesk', initial: 'R', tagline: 'Open-source remote desktop with self-hostable relay.', category: 'utilities', platforms: ['android', 'macos', 'windows'], sizeMb: 27, hash: '7aa02…9e3f' },
  { id: 'logseq/logseq', name: 'Logseq', initial: 'Λ', tagline: 'Privacy-first, open-source knowledge base.', category: 'productivity', platforms: ['android', 'ios', 'macos', 'windows'], sizeMb: 94, hash: '51bc7…d0aa' },
  { id: 'AppFlowy-IO/AppFlowy', name: 'AppFlowy', initial: 'A', tagline: 'Notes, docs and project workflow board — yours.', category: 'productivity', platforms: ['android', 'ios', 'macos', 'windows'], sizeMb: 61, hash: 'e4f56…31b0' },
  { id: 'microsoft/vscode', name: 'VSCodium', initial: '</>', tagline: 'Code editing. Redefined. Telemetry-free build.', category: 'developer', platforms: ['macos', 'windows'], sizeMb: 132, hash: '0d9fe…77c1' },
  { id: 'zen-browser/desktop', name: 'Zen Browser', initial: '禅', tagline: 'Beautifully designed, privacy-focused browser.', category: 'privacy', platforms: ['macos', 'windows'], sizeMb: 88, hash: 'ff102…a5b9' },
  { id: 'keepassx-reboot/keepassxc', name: 'KeePassXC', initial: '⚿', tagline: 'Offline password manager that never calls home.', category: 'privacy', platforms: ['macos', 'windows'], sizeMb: 19, hash: '3c7d8…e2f4' },
  { id: 'audacity/audacity', name: 'Audacity', initial: '∿', tagline: 'Free, easy-to-use multitrack audio editor.', category: 'creative', platforms: ['macos', 'windows'], sizeMb: 56, hash: '88ab1…04de' },
  { id: 'upscayl/upscayl', name: 'Upscayl', initial: 'U', tagline: 'AI image upscaling, fully local, lossless feel.', category: 'creative', platforms: ['macos', 'windows'], sizeMb: 121, hash: '6e0c3…92fa' },
  { id: 'ollama/ollama', name: 'Ollama', initial: 'λ', tagline: 'Run large language models on your own hardware.', category: 'developer', platforms: ['macos', 'windows'], sizeMb: 74, hash: 'd5b77…1c08' },
];

/* ------------------------------------------------ toast island */
const island = $('[data-island]');
const islandText = $('[data-island-text]');
let islandTimer = 0;
function toast(msg, ms = 2600) {
  if (!island) return;
  islandText.textContent = msg;
  island.classList.add('is-up');
  clearTimeout(islandTimer);
  islandTimer = setTimeout(() => island.classList.remove('is-up'), ms);
}

/* ------------------------------------------------ three.js hero */
async function bootHero() {
  const host = $('#ad-stage');
  if (!host) return;
  let THREE;
  try {
    THREE = await import('three');
  } catch {
    document.body.classList.add('no-webgl');
    return;
  }
  if (!webglAvailable()) { document.body.classList.add('no-webgl'); return; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0a0a, 7, 30);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  /* lights — pure white key, soft grey fill */
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(4, 6, 8);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(-6, -2, -5);
  const amb = new THREE.AmbientLight(0x222222, 1.2);
  scene.add(key, rim, amb);

  /* chrome torus knot core */
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.3, 0.34, 220, 36),
    new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 1.0, roughness: 0.16, emissive: 0x060606 })
  );
  knot.position.set(0, 0.4, -2);
  scene.add(knot);

  /* wireframe shell */
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.7, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
  );
  shell.position.copy(knot.position);
  scene.add(shell);

  /* floating monoliths */
  const monolithMat = new THREE.MeshStandardMaterial({ color: 0x101010, metalness: 0.85, roughness: 0.3, emissive: 0x000000 });
  const monoliths = [];
  for (let i = 0; i < 9; i++) {
    const h = 1.2 + Math.random() * 2.4;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), monolithMat.clone());
    m.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 8, -3 - Math.random() * 10);
    m.rotation.y = Math.random() * Math.PI;
    scene.add(m);
    monoliths.push({ mesh: m, spin: 0.05 + Math.random() * 0.12, bob: 0.2 + Math.random() * 0.5, phase: Math.random() * 6.28, baseY: m.position.y });
  }

  /* particle nebula */
  const N = document.documentElement.dataset.quality === 'low' ? 1800 : 4200;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const ang = t * Math.PI * 2 * 2.4 + Math.random() * 0.7;
    const rad = t * 9 + (Math.random() - 0.5) * 1.4;
    pos[i * 3] = Math.cos(ang) * rad;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6 * (1 - t * 0.6);
    pos[i * 3 + 2] = Math.sin(ang) * rad;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const nebula = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  nebula.position.z = -4;
  scene.add(nebula);

  /* orbit rings with satellites (platform devices) */
  const orbits = new THREE.Group();
  orbits.position.copy(knot.position);
  orbits.rotation.x = 1.15;
  const ringSpeeds = [0.3, -0.44, 0.62];
  const rings = ringSpeeds.map((sp, i) => {
    const r = 2.2 + i * 0.85;
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        new Array(96).fill(0).map((_, k) => {
          const a = (k / 96) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
        })
      ),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })
    );
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.userData = { sp, r, sat };
    ring.add(sat);
    orbits.add(ring);
    return ring;
  });
  scene.add(orbits);

  /* pointer state */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    ptr.tx = (e.clientX / innerWidth) * 2 - 1;
    ptr.ty = (e.clientY / innerHeight) * 2 - 1;
    document.documentElement.style.setProperty('--px', ptr.tx.toFixed(3));
    document.documentElement.style.setProperty('--py', ptr.ty.toFixed(3));
  }, { passive: true });

  let scrollP = 0;
  addEventListener('scroll', () => {
    scrollP = clamp(scrollY / Math.max(1, document.body.scrollHeight - innerHeight), 0, 1);
  }, { passive: true });

  const clock = new THREE.Clock();
  let raf = 0, visible = true;
  document.addEventListener('visibilitychange', () => (visible = !document.hidden));

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible || reduced) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    ptr.x = lerp(ptr.x, ptr.tx, 1 - Math.exp(-dt * 3));
    ptr.y = lerp(ptr.y, ptr.ty, 1 - Math.exp(-dt * 3));

    knot.rotation.y += dt * 0.24;
    knot.rotation.x = Math.sin(t * 0.3) * 0.18;
    shell.rotation.z -= dt * 0.05;
    shell.rotation.y += dt * 0.02;

    nebula.rotation.y += dt * 0.05;
    nebula.material.opacity = 0.55 + Math.sin(t * 0.8) * 0.15;

    for (const m of monoliths) {
      m.mesh.rotation.y += dt * m.spin;
      m.mesh.position.y = m.baseY + Math.sin(t * m.bob + m.phase) * 0.4;
      const near = clamp(1 - Math.abs(m.mesh.position.z + 6) / 10, 0, 1);
      m.mesh.material.emissiveIntensity = 0.4 * near;
      m.mesh.material.emissive.setScalar(0.25 * near);
    }
    for (const ring of rings) {
      ring.rotation.z += dt * ring.userData.sp;
      const a = t * ring.userData.sp * 2;
      ring.userData.sat.position.set(Math.cos(a) * ring.userData.r, Math.sin(a) * ring.userData.r, 0);
    }

    camera.position.x = lerp(camera.position.x, ptr.x * 1.7, 1 - Math.exp(-dt * 3));
    camera.position.y = lerp(camera.position.y, -ptr.y * 1.0 - scrollP * 3.2, 1 - Math.exp(-dt * 3));
    camera.position.z = 7.4 + scrollP * 4.5;
    camera.lookAt(0, 0.4 - scrollP * 2.2, -2);

    renderer.render(scene, camera);
  }
  frame();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  addEventListener('pik:quality', e => {
    if (e.detail?.tier === 'low') nebula.geometry.setDrawRange(0, 1500);
    else nebula.geometry.setDrawRange(0, N);
  });
}

function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

/* ------------------------------------------------ CSS starfields */
function seedStars() {
  $$('[data-starfield-layer]').forEach(layer => {
    const n = layer.dataset.starfieldLayer === 'near' ? 60 : 90;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (-Math.random() * 4) + 's';
      s.style.opacity = 0.2 + Math.random() * 0.6;
      frag.appendChild(s);
    }
    layer.appendChild(frag);
  });
}

/* ------------------------------------------------ waveforms bars */
function seedWaveform() {
  const w = $('[data-waveform]');
  if (!w) return;
  for (let i = 0; i < 28; i++) {
    const b = document.createElement('i');
    b.style.setProperty('--i', i);
    b.style.animationDelay = (-i * 0.07) + 's';
    w.appendChild(b);
  }
}

/* ------------------------------------------------ catalog cards */
let activeCat = 'all', activePlatform = 'all', query = '';

function cardHTML(app) {
  return `
  <article class="ad-card sheen" data-cat="${app.category}" data-platforms="${app.platforms.join(' ')}" data-name="${app.name.toLowerCase()} ${app.tagline.toLowerCase()}" data-tilt>
    <div class="ad-row gap-3 ad-card__depth">
      <span class="ad-appicon">${app.initial}</span>
      <div style="min-width:0">
        <h3 class="font-semibold">${app.name}</h3>
        <p class="text-xs text-faint ad-mono">${app.id}</p>
      </div>
      <div class="ad-spacer"></div>
      <button class="btn-get" data-get="${app.id}" data-size="${app.sizeMb}" data-hot>Get</button>
    </div>
    <p class="ad-body text-sm ad-card__depth">${app.tagline}</p>
    <div class="ad-row flex-wrap gap-2 mt-a ad-card__depth">
      <span class="ad-chip">${app.category}</span>
      ${app.platforms.map(p => `<span class="ad-chip">${p}</span>`).join('')}
      <span class="ad-chip ad-chip--verified">sha-256 ${app.hash}</span>
    </div>
  </article>`;
}

function renderCatalog() {
  const grid = $('#catalog-grid');
  if (!grid) return;
  const q = query.trim().toLowerCase();
  const list = APPS.filter(a =>
    (activeCat === 'all' || a.category === activeCat) &&
    (activePlatform === 'all' || a.platforms.includes(activePlatform)) &&
    (!q || (a.name + ' ' + a.tagline).toLowerCase().includes(q))
  );
  grid.innerHTML = list.map(cardHTML).join('');
  $('#empty-state').hidden = list.length > 0;
  grid.classList.remove('is-in');
  requestAnimationFrame(() => grid.classList.add('is-in'));
  bindCards(grid);
}

function bindCards(scope) {
  $$('[data-get]', scope).forEach(btn => {
    btn.addEventListener('click', () => simulateDownload(btn));
  });
  $$('[data-tilt]', scope).forEach(el => attachTilt(el));
}

/* ------------------------------------------------ tilt + magnetic */
function attachTilt(el) {
  if (!finePointer || reduced) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
    el.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.012)`;
    el.style.setProperty('--sx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
    el.style.setProperty('--sy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

function initMagnets() {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = 'transform 60ms linear';
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 420ms cubic-bezier(.34,1.56,.64,1)';
      el.style.transform = '';
    });
  });
}

/* ------------------------------------------------ spotlight */
function initSpotlight() {
  const sp = $('[data-spotlight]');
  if (!sp || !finePointer) return;
  let px = innerWidth / 2, py = innerHeight / 2, cx = px, cy = py, on = false;
  addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    if (!on) { on = true; sp.classList.add('is-on'); }
  }, { passive: true });
  (function tick() {
    cx = lerp(cx, px, 0.16); cy = lerp(cy, py, 0.16);
    sp.style.setProperty('--mx', cx + 'px');
    sp.style.setProperty('--my', cy + 'px');
    requestAnimationFrame(tick);
  })();
}

/* ------------------------------------------------ custom cursor */
function initCursor() {
  if (!finePointer || reduced) return;
  const dot = $('[data-cursor]'), ring = $('[data-cursor-ring]');
  if (!dot || !ring) return;
  let rx = innerWidth / 2, ry = innerHeight / 2;
  addEventListener('pointermove', e => {
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%,-50%)`;
  }, { passive: true });
  (function tick() {
    const hot = document.querySelector(':hover')?.closest?.('a,button,[data-hot]');
    rx = lerp(rx, innerWidth / 2, 0); // noop keeps structure symmetric
    requestAnimationFrame(tick);
  })();
  addEventListener('pointermove', e => {
    const t = e.target.closest('a, button, [data-hot]');
    ring.classList.toggle('is-hot', !!t);
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
  }, { passive: true });
}

/* ------------------------------------------------ download sim */
function simulateDownload(btn) {
  if (btn.dataset.state === 'scanning') return;
  const size = parseFloat(btn.dataset.size || '50');
  btn.dataset.state = 'scanning';
  btn.innerHTML = '<span class="btn-get__spinner"></span>';
  toast(`Fetching ${btn.dataset.get.split('/')[1]} · verifying sha-256…`);

  const bar = $('[data-download-bar] .ad-progress__fill');
  const label = $('[data-download-label]');
  const sizeEl = $('[data-download-size]');
  let p = 0;
  const iv = setInterval(() => {
    p += 0.03 + Math.random() * 0.05;
    if (bar) bar.style.setProperty('--p', clamp(p, 0, 1) * 100 + '%');
    if (label) label.textContent = p < 0.45 ? 'fetching signed asset…' : p < 0.9 ? 'virus scan sweep…' : 'installing…';
    if (sizeEl) sizeEl.textContent = `${Math.round(clamp(p, 0, 1) * size)} / ${size} MB`;
    if (p >= 1.05) {
      clearInterval(iv);
      btn.dataset.state = 'done';
      btn.textContent = '✓ Open';
      if (label) label.textContent = 'verified · safe';
      toast(`${btn.dataset.get.split('/')[1]} verified — 0 threats found.`);
      drawChecks();
      setTimeout(() => {
        btn.dataset.state = '';
        btn.textContent = 'Get';
        if (bar) bar.style.setProperty('--p', '0%');
        if (label) label.textContent = 'idle';
        if (sizeEl) sizeEl.textContent = '— MB';
      }, 5200);
    }
  }, 120);
}

function drawChecks() {
  $$('[data-checkdraw]').forEach((c, i) =>
    setTimeout(() => c.classList.add('is-on'), i * 160));
  setTimeout(() => $$('[data-checkdraw]').forEach(c => c.classList.remove('is-on')), 6000);
}

/* ------------------------------------------------ filters */
function initFilters() {
  $$('[data-categories] .ad-cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('[data-categories] .ad-cat-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeCat = pill.dataset.cat;
      renderCatalog();
      flipGrid();
    });
  });
  $$('[data-platforms] .ad-platform').forEach(seg => {
    seg.addEventListener('click', () => {
      $$('[data-platforms] .ad-platform').forEach(s => { s.classList.remove('is-selected'); s.setAttribute('aria-selected', 'false'); });
      seg.classList.add('is-selected'); seg.setAttribute('aria-selected', 'true');
      moveThumb(seg);
      activePlatform = seg.textContent.trim().toLowerCase();
      if (activePlatform === 'all') activePlatform = 'all';
      renderCatalog();
    });
  });
  const first = $('[data-platforms] .ad-platform.is-selected') || $('[data-platforms] .ad-platform');
  if (first) moveThumb(first);
}

function moveThumb(seg) {
  const thumb = $('.ad-platforms__thumb');
  if (!thumb) return;
  const host = seg.parentElement.getBoundingClientRect(), r = seg.getBoundingClientRect();
  thumb.style.left = (r.left - host.left) + 'px';
  thumb.style.width = r.width + 'px';
}

function flipGrid() { /* stagger class handles animation; hook kept for parity */ }

/* ------------------------------------------------ search */
function initSearch() {
  const input = $('[data-search-input]');
  if (!input) return;
  let deb;
  input.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => { query = input.value; renderCatalog(); }, 140);
  });
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); }
  });
}

/* ------------------------------------------------ kinetic letters */
function initKinetic() {
  $$('[data-kinetic]').forEach(h => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch, i) => {
            const s = document.createElement('span');
            s.textContent = ch === ' ' ? '\u00A0' : ch;
            s.style.setProperty('--i', i % 12);
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !['BR'].includes(n.tagName)) walk(n);
      });
    };
    walk(h);
  });
}

/* ------------------------------------------------ scramble decode */
function initScramble() {
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*<>=+';
  $$('.text-chrome').forEach(el => {
    const original = el.textContent;
    const run = () => {
      let f = 0;
      const iv = setInterval(() => {
        f++;
        el.textContent = [...original].map((c, i) =>
          i < f ? c : (c === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0])).join('');
        if (f >= original.length) { clearInterval(iv); el.textContent = original; }
      }, 34);
    };
    const io = new IntersectionObserver(e => {
      if (e[0].isIntersecting && !reduced) { run(); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
  });
}

/* ------------------------------------------------ counters */
function initCounters() {
  $$('[data-counter]').forEach(el => {
    const target = parseInt(el.dataset.target || '100', 10);
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      (function tick(now) {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 });
    io.observe(el);
  });
}

/* ------------------------------------------------ reveals */
function initReveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '-8% 0px' });
  $$('.fade-up, .stagger, [data-reveal]').forEach(el => io.observe(el));
}

/* ------------------------------------------------ pipeline steps */
function initPipeline() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      $$('.ad-step', en.target).forEach((s, i) =>
        setTimeout(() => s.classList.add('is-live'), i * 420));
      io.unobserve(en.target);
    });
  }, { threshold: 0.4 });
  $$('[data-pipeline]').forEach(p => io.observe(p));
}

/* ------------------------------------------------ header + rail */
function initHeaderRail() {
  const header = $('[data-header]');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    header?.classList.toggle('ad-header--scrolled', y > 24);
    if (header) header.classList.toggle('ad-header--hidden', y - lastY > 8 && y > 160);
    lastY = y;
    const p = clamp(y / Math.max(1, document.body.scrollHeight - innerHeight), 0, 1);
    const fill = $('.ad-rail__fill');
    if (fill) fill.style.height = (p * 100).toFixed(2) + '%';
    $$('.ad-rail__node').forEach((n, i, arr) => {
      n.classList.toggle('is-passed', p >= i / (arr.length - 1) - 0.001);
    });
    // nav active section
    $$('main section[id]').forEach(sec => {
      const link = $(`.ad-nav__link[href="#${sec.id}"]`);
      if (link) link.classList.toggle('is-active',
        sec.getBoundingClientRect().top <= innerHeight * 0.4 && sec.getBoundingClientRect().bottom > innerHeight * 0.35);
    });
  }, { passive: true });
}

/* ------------------------------------------------ terminal typing */
function initTerminal() {
  const body = $('[data-terminal-body]');
  if (!body) return;
  const lines = [
    '> pikscan verify obs-studio-installer.dmg',
    '> fetch release asset from <b>github.com/obsproject/obs-studio</b>',
    '> sha256 <b>beef9…0c21</b> matches author signature ✔',
    '> scanning 4 engines … <b>0 threats</b> · quarantine empty',
    '> curator review: tagline honest, permissions minimal ✔',
    '> listing is <b>vouched</b>. ready to install.',
  ];
  let li = 0, ci = 0;
  const caret = document.createElement('span');
  caret.className = 'ad-caret';
  function type() {
    if (li >= lines.length) { setTimeout(reset, 4200); return; }
    const line = lines[li];
    ci += 1 + (Math.random() > 0.7 ? 1 : 0);
    const shown = line.slice(0, ci).replace(/&lt;/g, '<');
    body.innerHTML = keep(li) + `<div>${stripTagsDynamic(shown)}</div>`;
    body.appendChild(caret);
    if (ci >= line.length) { li++; ci = 0; setTimeout(type, 420); }
    else setTimeout(type, 16 + Math.random() * 30);
  }
  function reset() { body.innerHTML = ''; li = 0; ci = 0; type(); }
  function keep(upTo) {
    return lines.slice(0, upTo).map(l => `<div>${l}</div>`).join('');
  }
  function stripTagsDynamic(s) {
    // allow our intentional <b> tags but avoid broken ones mid-type
    const open = (s.match(/<b>/g) || []).length, close = (s.match(/<\/b>/g) || []).length;
    return open > close ? s + '</b>' : s;
  }
  if (reduced) { body.innerHTML = lines.map(l => `<div>${l}</div>`).join(''); }
  else {
    const io = new IntersectionObserver(e => {
      if (e[0].isIntersecting) { io.disconnect(); type(); }
    }, { threshold: 0.3 });
    io.observe(body);
  }
}

/* ------------------------------------------------ accordion */
function initAccordion() {
  $$('[data-accordion] .ad-acc').forEach(acc => {
    const q = $('.ad-acc__q', acc);
    q.addEventListener('click', () => {
      const open = acc.classList.contains('is-open');
      $$('[data-accordion] .ad-acc').forEach(a => a.classList.remove('is-open'));
      if (!open) acc.classList.add('is-open');
      q.setAttribute('aria-expanded', String(!open));
    });
  });
}

/* ------------------------------------------------ radar modal */
function initRadar() {
  const modal = $('[data-radar-modal]');
  if (!modal) return;
  const fill = $('[data-radar-fill]', modal);
  const status = $('[data-radar-status]', modal);
  let timer = 0;
  const open = () => {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    let p = 0;
    clearInterval(timer);
    if (fill) fill.style.setProperty('--p', '0%');
    timer = setInterval(() => {
      p += 0.02 + Math.random() * 0.03;
      if (fill) fill.style.setProperty('--p', clamp(p, 0, 1) * 100 + '%');
      if (status) status.textContent = p < 0.35 ? 'scanning engine 1/4…' : p < 0.6 ? 'engine 2/4 · heuristics…' : p < 0.9 ? 'engines 3–4/4 · deep inspect…' : 'clean ✔ 0 threats';
      if (p >= 1.02) { clearInterval(timer); toast('Scan complete — 0 threats. Release is vouched.'); }
    }, 110);
  };
  const close = () => { modal.classList.remove('is-open'); document.body.style.overflow = ''; clearInterval(timer); };
  $$('[data-open-radar]').forEach(b => b.addEventListener('click', open));
  $$('[data-close-radar]').forEach(b => b.addEventListener('click', close));
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ------------------------------------------------ demo get */
function initDemoGet() {
  $('[data-demo-get]')?.addEventListener('click', () => {
    const fake = { dataset: { state: '', get: 'obsproject/obs-studio', size: '165' } };
    const real = document.createElement('button');
    real.className = 'btn-get';
    Object.assign(fake, {
      textContent: 'Get',
      set innerHTML(v) { real.innerHTML = v; },
    });
    toast('Simulating download in the Discover grid…');
    $('#discover')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => {
      const first = $('#catalog-grid [data-get]');
      if (first) simulateDownload(first);
    }, 700);
  });
}

/* ------------------------------------------------ preloader */
function initPreloader() {
  const pre = $('#ad-preloader'), num = $('#preloader-num'), bar = $('#preloader-bar');
  if (!pre) return;
  let pct = 0;
  const iv = setInterval(() => {
    pct = Math.min(100, pct + 4 + Math.random() * 9);
    if (num) num.textContent = String(Math.floor(pct)).padStart(3, '0');
    if (bar) bar.style.width = pct + '%';
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(() => pre.classList.add('is-done'), 350);
      setTimeout(() => toast('PikStore ad loaded — everything here is B&W.'), 1400);
    }
  }, reduced ? 20 : 90);
}

/* ------------------------------------------------ fps governor evt */
function initGovernor() {
  let frames = [], last = performance.now();
  (function loop(now) {
    frames.push(now - last); last = now;
    if (frames.length > 60) {
      frames.shift();
      const med = [...frames].sort((a, b) => a - b)[30];
      const tier = med > 24 ? 'low' : med > 17 ? 'medium' : 'high';
      if (document.documentElement.dataset.quality !== tier) {
        document.documentElement.dataset.quality = tier;
        dispatchEvent(new CustomEvent('pik:quality', { detail: { tier, med } }));
      }
    }
    requestAnimationFrame(loop);
  })(last);
}

/* ------------------------------------------------ marquee seam */
function initMarquee() {
  const track = $('[data-marquee]');
  if (!track) return;
  track.innerHTML += track.innerHTML; // duplicate for seamless loop
}

/* ------------------------------------------------ boot all */
(async function main() {
  seedStars();
  seedWaveform();
  renderCatalog();
  initFilters();
  initSearch();
  initKinetic();
  initScramble();
  initCounters();
  initReveals();
  initPipeline();
  initHeaderRail();
  initTerminal();
  initAccordion();
  initRadar();
  initDemoGet();
  initMagnets();
  initSpotlight();
  initCursor();
  initMarquee();
  initPreloader();
  if (!reduced) initGovernor();
  await bootHero();
})();
