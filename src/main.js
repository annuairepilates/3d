import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildReformer } from './reformer.js';

/* ── Scene setup ── */
const canvas  = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene  = new THREE.Scene();
scene.fog    = new THREE.Fog(0x0a0a0f, 6, 20);

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
camera.position.set(2.2, 1.1, 2.8);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.15, 0);
controls.enableDamping    = true;
controls.dampingFactor    = 0.06;
controls.minDistance      = 1.2;
controls.maxDistance      = 6;
controls.maxPolarAngle    = Math.PI * 0.85;
controls.autoRotate       = true;
controls.autoRotateSpeed  = 0.6;

/* ── Lighting ── */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff8e8, 1.4);
keyLight.position.set(3, 5, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near   = 0.5;
keyLight.shadow.camera.far    = 20;
keyLight.shadow.camera.left   = -4;
keyLight.shadow.camera.right  = 4;
keyLight.shadow.camera.top    = 4;
keyLight.shadow.camera.bottom = -4;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.5);
fillLight.position.set(-2, 2, -3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe8c0, 0.8);
rimLight.position.set(0, 1, -4);
scene.add(rimLight);

/* ── Ground ── */
const groundGeo = new THREE.CircleGeometry(3.5, 64);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x111118, roughness: 0.9, metalness: 0.0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.31;
ground.receiveShadow = true;
scene.add(ground);

/* ── Subtle ground glow ── */
const glowGeo = new THREE.CircleGeometry(1.8, 64);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xc8973d, transparent: true, opacity: 0.06,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.rotation.x = -Math.PI / 2;
glow.position.y = -0.305;
scene.add(glow);

/* ── Build reformer ── */
const config = {
  wood:        'maple',
  upholstery:  'black',
  metal:       'matte_black',
  springCount: 5,
};

const reformerGroup = buildReformer(config);
scene.add(reformerGroup);

/* ── Resize ── */
function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

/* ── Animate ── */
let frameId;
function animate() {
  frameId = requestAnimationFrame(animate);
  resize();
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ── Loading done ── */
setTimeout(() => {
  const loading = document.getElementById('loading');
  loading.classList.add('done');
}, 800);

/* ── Orbit hint fade ── */
const hint = document.getElementById('orbit-hint');
setTimeout(() => hint.classList.add('fade-out'), 4000);
controls.addEventListener('start', () => hint.classList.add('fade-out'));

/* ── Color palettes ── */
const WOOD_COLORS = {
  maple:      { base: 0xd4a050, mid: 0xc08030, dark: 0xa06020 },
  walnut:     { base: 0x6b3a20, mid: 0x4a2510, dark: 0x2e1508 },
  white:      { base: 0xf0ede8, mid: 0xd8d4ce, dark: 0xb8b4ae },
  black_wood: { base: 0x252525, mid: 0x181818, dark: 0x0d0d0d },
  ash:        { base: 0xa89880, mid: 0x887860, dark: 0x605840 },
  cherry:     { base: 0x9a4828, mid: 0x6a2e14, dark: 0x481c08 },
};

const UPHOLSTERY_COLORS = {
  black:    0x121212,
  charcoal: 0x2e2e2e,
  gray:     0x808080,
  beige:    0xb89878,
  navy:     0x0e1830,
  burgundy: 0x4a0e1a,
  sage:     0x5a7a5a,
  cream:    0xd8cbb0,
};

const METAL_COLORS = {
  matte_black: { color: 0x1a1a1a, metalness: 0.5, roughness: 0.8 },
  chrome:      { color: 0xcccccc, metalness: 0.95, roughness: 0.1 },
  gold:        { color: 0xc8a030, metalness: 0.9, roughness: 0.25 },
  rose_gold:   { color: 0xc07858, metalness: 0.85, roughness: 0.2 },
};

const PRICE_BASE = {
  maple: 3490, walnut: 3790, white: 3690, black_wood: 3890, ash: 3590, cherry: 3690,
};
const UPHOLSTERY_PREMIUM = {
  black: 0, charcoal: 0, gray: 100, beige: 150, navy: 150, burgundy: 200, sage: 200, cream: 150,
};
const METAL_PREMIUM = {
  matte_black: 0, chrome: 100, gold: 300, rose_gold: 250,
};

/* ── Apply config to 3D model ── */
function applyConfig() {
  const wood       = WOOD_COLORS[config.wood];
  const upholColor = UPHOLSTERY_COLORS[config.upholstery];
  const metal      = METAL_COLORS[config.metal];

  reformerGroup.traverse(obj => {
    if (!obj.isMesh) return;
    const tag = obj.userData.tag;

    if (tag === 'frame_main') {
      obj.material.color.setHex(wood.base);
    } else if (tag === 'frame_dark') {
      obj.material.color.setHex(wood.mid);
    } else if (tag === 'frame_stripe') {
      obj.material.color.setHex(wood.dark);
    } else if (tag === 'carriage') {
      obj.material.color.setHex(upholColor);
    } else if (tag === 'headrest') {
      obj.material.color.setHex(upholColor);
    } else if (tag === 'shoulder_block') {
      obj.material.color.setHex(upholColor);
    } else if (tag === 'metal') {
      obj.material.color.setHex(metal.color);
      obj.material.metalness = metal.metalness;
      obj.material.roughness = metal.roughness;
    } else if (tag === 'rope') {
      obj.material.color.setHex(metal.color === 0x1a1a1a ? 0x1a1a1a : metal.color);
    }
  });

  /* update price */
  const price = PRICE_BASE[config.wood]
    + (UPHOLSTERY_PREMIUM[config.upholstery] || 0)
    + (METAL_PREMIUM[config.metal] || 0)
    + (config.springCount === 6 ? 200 : 0);
  document.getElementById('price-value').textContent =
    price.toLocaleString('fr-FR') + ' €';
}

/* ── Option cards ── */
document.querySelectorAll('.option-card').forEach(card => {
  card.addEventListener('click', () => {
    const group = card.dataset.group;
    const value = card.dataset.value;
    const label = card.dataset.label;

    document.querySelectorAll(`.option-card[data-group="${group}"]`)
      .forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    if (group === 'wood') {
      config.wood = value;
      document.getElementById('summary-wood').textContent = label;
    } else if (group === 'upholstery') {
      config.upholstery = value;
      document.getElementById('summary-upholstery').textContent = label;
    } else if (group === 'metal') {
      config.metal = value;
      document.getElementById('summary-metal').textContent = label;
    } else if (group === 'spring') {
      config.springCount = value === 'pro' ? 6 : 5;
    }

    applyConfig();
    controls.autoRotate = false;
  });
});

/* ── View presets ── */
const VIEW_PRESETS = {
  perspective: { pos: [2.2, 1.1, 2.8], target: [0, 0.15, 0] },
  front:       { pos: [0, 0.5, 3.5],   target: [0, 0.15, 0] },
  side:        { pos: [3.5, 0.5, 0],   target: [0, 0.15, 0] },
  top:         { pos: [0, 3.5, 0.001], target: [0, 0, 0]    },
};

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const preset = VIEW_PRESETS[btn.dataset.view];
    if (!preset) return;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos    = new THREE.Vector3(...preset.pos);
    const endTarget = new THREE.Vector3(...preset.target);
    const duration  = 800;
    const t0        = performance.now();

    function animateCamera(now) {
      const t = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      camera.position.lerpVectors(startPos, endPos, e);
      controls.target.lerpVectors(startTarget, endTarget, e);
      controls.update();
      if (t < 1) requestAnimationFrame(animateCamera);
    }
    requestAnimationFrame(animateCamera);

    controls.autoRotate = false;
  });
});

/* ── Reset ── */
document.getElementById('btn-reset').addEventListener('click', () => {
  config.wood        = 'maple';
  config.upholstery  = 'black';
  config.metal       = 'matte_black';
  config.springCount = 5;

  document.querySelectorAll('.option-card').forEach(c => {
    c.classList.toggle('active',
      (c.dataset.group === 'wood'        && c.dataset.value === 'maple')       ||
      (c.dataset.group === 'upholstery'  && c.dataset.value === 'black')       ||
      (c.dataset.group === 'metal'       && c.dataset.value === 'matte_black') ||
      (c.dataset.group === 'spring'      && c.dataset.value === 'standard'));
  });

  document.getElementById('summary-wood').textContent        = 'Érable naturel';
  document.getElementById('summary-upholstery').textContent  = 'Noir';
  document.getElementById('summary-metal').textContent       = 'Noir mat';

  applyConfig();
  controls.autoRotate = true;
});

/* ── Quote modal ── */
function openModal() {
  const display = document.getElementById('modal-config-display');
  const woodLabel = document.querySelector('.option-card.active[data-group="wood"]')?.dataset.label;
  const uphLabel  = document.querySelector('.option-card.active[data-group="upholstery"]')?.dataset.label;
  const metLabel  = document.querySelector('.option-card.active[data-group="metal"]')?.dataset.label;
  const sprLabel  = config.springCount === 6 ? 'Pro (6 ressorts)' : 'Standard (5 ressorts)';
  display.innerHTML =
    `<strong>Cadre :</strong> ${woodLabel}<br>` +
    `<strong>Revêtement :</strong> ${uphLabel}<br>` +
    `<strong>Métal :</strong> ${metLabel}<br>` +
    `<strong>Ressorts :</strong> ${sprLabel}<br>` +
    `<strong>Estimation :</strong> ${document.getElementById('price-value').textContent}`;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

document.getElementById('btn-quote').addEventListener('click', openModal);
document.getElementById('btn-quote-2').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('hidden');
});
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay'))
    document.getElementById('modal-overlay').classList.add('hidden');
});

document.getElementById('quote-form').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = '✓ Demande envoyée !';
  btn.disabled = true;
  setTimeout(() => {
    document.getElementById('modal-overlay').classList.add('hidden');
    btn.textContent = 'Envoyer ma demande';
    btn.disabled = false;
  }, 2000);
});

/* ── Screenshot ── */
document.getElementById('btn-screenshot').addEventListener('click', () => {
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `reformer-config-${Date.now()}.png`;
  a.click();
});
