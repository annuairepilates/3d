import * as THREE from 'three';

/*
  Pilates Reformer – procedural 3D model built from Three.js primitives.

  Dimensions are scaled roughly 1 unit = 0.5 m for comfortable scene sizing.
  Real reformer ≈ 2.4 m long × 0.6 m wide × 0.3 m tall.
  We use: length = 4.8 units, width = 1.2, height = 0.6.

  Coordinate system: X = lengthwise, Y = up, Z = width.
  Origin at center-bottom of the frame.
*/

const MAPLE = 0xd4a050;
const BLACK  = 0x121212;
const METAL_BLK = 0x1a1a1a;

function mat(color, roughness = 0.7, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(w, h, d, color, roughness, metalness) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat(color, roughness, metalness));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(rt, rb, h, segs, color, roughness, metalness) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
  const mesh = new THREE.Mesh(geo, mat(color, roughness, metalness));
  mesh.castShadow = true;
  return mesh;
}

function tag(mesh, t) { mesh.userData.tag = t; return mesh; }
function tagGroup(group, t) {
  group.traverse(c => { if (c.isMesh) c.userData.tag = t; });
  return group;
}

/* ── Rounded box helper (uses BoxGeometry + beveled look via scale) ── */
function rBox(w, h, d, color, roughness = 0.7, metalness = 0.05) {
  const m = box(w, h, d, color, roughness, metalness);
  return m;
}

/* ══════════════════════════════════════════════════
   MAIN BUILD FUNCTION
══════════════════════════════════════════════════ */
export function buildReformer(cfg) {
  const g = new THREE.Group();

  // ── Frame rails (two long side beams) ──────────────────────
  const RAIL_L = 4.8;
  const RAIL_H = 0.22;
  const RAIL_W = 0.22;
  const FRAME_W_INNER = 1.0; // distance between inside faces of rails

  for (let side of [-1, 1]) {
    const rail = rBox(RAIL_L, RAIL_H, RAIL_W, MAPLE, 0.72);
    rail.position.set(0, 0, side * (FRAME_W_INNER / 2 + RAIL_W / 2));
    tag(rail, 'frame_main');
    g.add(rail);

    // Stripe inlay (decorative laminate lines on top of rails)
    for (let i = -2; i <= 2; i++) {
      const stripe = rBox(RAIL_L, 0.005, 0.015, 0x6a3a10, 0.8);
      stripe.position.set(0, RAIL_H / 2 + 0.003, side * (FRAME_W_INNER / 2 + RAIL_W / 2) + i * 0.034);
      tag(stripe, 'frame_stripe');
      g.add(stripe);
    }
  }

  // ── End boards (head & foot) ────────────────────────────────
  const END_H = 0.22;
  const END_W  = FRAME_W_INNER + RAIL_W * 2;
  const END_D  = RAIL_W;

  for (let end of [-1, 1]) {
    const endBoard = rBox(END_D, END_H, END_W, MAPLE, 0.72);
    endBoard.position.set(end * (RAIL_L / 2), 0, 0);
    tag(endBoard, 'frame_main');
    g.add(endBoard);
  }

  // ── Legs (4 corner legs) ────────────────────────────────────
  const LEG_H = 0.22;
  const LEG_W = 0.18;
  const leg_y = -(RAIL_H / 2 + LEG_H / 2);
  for (let lx of [-1, 1]) {
    for (let lz of [-1, 1]) {
      const leg = rBox(LEG_W, LEG_H, LEG_W, MAPLE, 0.75);
      leg.position.set(
        lx * (RAIL_L / 2 - LEG_W / 2 + 0.01),
        leg_y,
        lz * (FRAME_W_INNER / 2 + RAIL_W / 2)
      );
      tag(leg, 'frame_dark');
      g.add(leg);
    }
  }

  // ── Carriage (sliding platform) ─────────────────────────────
  const CAR_L  = 1.25;
  const CAR_W  = FRAME_W_INNER + 0.02;
  const CAR_H  = 0.06;
  const car_y  = RAIL_H / 2 + CAR_H / 2;

  const carriageBase = rBox(CAR_L, CAR_H, CAR_W, 0x2a2a2a, 0.8);
  carriageBase.position.set(-0.3, car_y, 0);
  tag(carriageBase, 'frame_dark');
  g.add(carriageBase);

  // Carriage padding (upholstery)
  const padH = 0.06;
  const carriagePad = rBox(CAR_L - 0.04, padH, CAR_W - 0.04, BLACK, 0.85, 0.02);
  carriagePad.position.set(-0.3, car_y + CAR_H / 2 + padH / 2, 0);
  tag(carriagePad, 'carriage');
  g.add(carriagePad);

  // ── Headrest ─────────────────────────────────────────────────
  const hr_y = car_y + CAR_H / 2 + padH + 0.035;
  const headrest = rBox(0.28, 0.07, 0.54, BLACK, 0.85, 0.02);
  headrest.position.set(-0.3 - CAR_L / 2 + 0.18, hr_y, 0);
  tag(headrest, 'headrest');
  g.add(headrest);

  // Headrest hinge/support (metal)
  const hingeL = rBox(0.04, 0.06, 0.04, METAL_BLK, 0.5, 0.6);
  hingeL.position.set(-0.3 - CAR_L / 2 + 0.18, car_y + CAR_H / 2 + padH, -0.18);
  tag(hingeL, 'metal');
  g.add(hingeL);
  const hingeR = hingeL.clone();
  hingeR.position.z = 0.18;
  tag(hingeR, 'metal');
  g.add(hingeR);

  // ── Shoulder blocks (2 blocks) ────────────────────────────────
  for (let side of [-1, 1]) {
    const sb = rBox(0.14, 0.1, 0.12, BLACK, 0.85, 0.02);
    sb.position.set(-0.3 + CAR_L / 2 - 0.1, car_y + CAR_H / 2 + padH + 0.05, side * 0.22);
    tag(sb, 'shoulder_block');
    g.add(sb);

    const sbMount = cyl(0.025, 0.025, 0.08, 8, METAL_BLK, 0.6, 0.6);
    sbMount.rotation.z = Math.PI / 2;
    sbMount.position.set(-0.3 + CAR_L / 2 - 0.1, car_y + CAR_H / 2 + padH + 0.05, side * 0.22);
    tag(sbMount, 'metal');
    g.add(sbMount);
  }

  // ── Carriage wheels / rollers (visible on sides) ──────────────
  for (let side of [-1, 1]) {
    for (let pos of [-0.35, 0.05]) {
      const wheel = cyl(0.035, 0.035, 0.04, 16, 0x222222, 0.9, 0.05);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(-0.3 + pos, RAIL_H / 2 - 0.04, side * (FRAME_W_INNER / 2 + 0.02));
      tag(wheel, 'metal');
      g.add(wheel);
    }
  }

  // ── Springs ──────────────────────────────────────────────────
  const springColors = [0xffcc00, 0x00bb44, 0xff3322, 0x00bb44, 0xffcc00, 0x00bb44];
  const SPRING_COUNT = cfg.springCount || 5;
  const spring_x_start = -0.3 + CAR_L / 2 + 0.1;
  const spring_x_end   = RAIL_L / 2 - 0.15;
  const spring_len = spring_x_end - spring_x_start;

  // Spring spacing in Z
  const zPositions = [];
  const spread = 0.64;
  for (let i = 0; i < SPRING_COUNT; i++) {
    zPositions.push(-spread / 2 + (i / (SPRING_COUNT - 1)) * spread);
  }

  zPositions.forEach((z, i) => {
    // Spring body (coil approximated as tapered cylinder)
    const springBody = cyl(0.018, 0.018, spring_len - 0.05, 8, 0x888888, 0.6, 0.5);
    springBody.rotation.z = Math.PI / 2;
    springBody.position.set(spring_x_start + spring_len / 2, RAIL_H / 2 - 0.06, z);
    springBody.userData.tag = 'spring';
    g.add(springBody);

    // Spring ring clip (colored indicator)
    const ring = cyl(0.03, 0.03, 0.015, 12, springColors[i] || 0x888888, 0.5, 0.0);
    ring.rotation.z = Math.PI / 2;
    ring.position.set(spring_x_start + spring_len * 0.6, RAIL_H / 2 - 0.06, z);
    ring.userData.tag = 'spring_ring';
    g.add(ring);
  });

  // ── Spring rail (the black slider bar) ───────────────────────
  const springRail = rBox(spring_len + 0.1, 0.04, 0.08, METAL_BLK, 0.7, 0.7);
  springRail.position.set(spring_x_start + spring_len / 2, RAIL_H / 2 - 0.06, 0);
  tag(springRail, 'metal');
  g.add(springRail);

  // ── Footbar platform (standing board at foot end) ──────────────
  const FB_L = 0.35;
  const FB_W = END_W;
  const footBoard = rBox(FB_L, 0.04, FB_W, MAPLE, 0.72);
  footBoard.position.set(RAIL_L / 2 - FB_L / 2 - 0.01, RAIL_H / 2 + 0.02, 0);
  tag(footBoard, 'frame_dark');
  g.add(footBoard);

  // Footboard stripes (anti-slip / decorative)
  for (let si = -2; si <= 2; si++) {
    const fstripe = rBox(FB_L, 0.006, 0.025, 0x1a1a1a, 0.95);
    fstripe.position.set(RAIL_L / 2 - FB_L / 2 - 0.01, RAIL_H / 2 + 0.04 + 0.003, si * 0.1);
    tag(fstripe, 'frame_stripe');
    g.add(fstripe);
  }

  // ── Riser bar / footbar (U-shaped metal bar at foot end) ────────
  buildRiserBar(g, RAIL_L / 2 - 0.05, RAIL_H, END_W);

  // ── Pulley tower / A-frame at head end ─────────────────────────
  buildPulleyTower(g, -RAIL_L / 2, RAIL_H, FRAME_W_INNER);

  // ── Transport wheels (at foot end) ───────────────────────────
  for (let side of [-1, 1]) {
    const tw = cyl(0.04, 0.04, 0.03, 16, 0x1a1a1a, 0.9, 0.1);
    tw.rotation.z = Math.PI / 2;
    tw.position.set(RAIL_L / 2 + 0.01, -(RAIL_H / 2 + LEG_H) + 0.04, side * 0.35);
    tag(tw, 'metal');
    g.add(tw);

    // Axle
    const axle = cyl(0.008, 0.008, 0.06, 8, 0x888888, 0.3, 0.8);
    axle.rotation.z = Math.PI / 2;
    axle.position.copy(tw.position);
    tag(axle, 'metal');
    g.add(axle);

    // Strap
    const strap = rBox(0.04, 0.22, 0.025, METAL_BLK, 0.9);
    strap.position.set(RAIL_L / 2 + 0.01, -(RAIL_H / 2 + LEG_H) + 0.04 + 0.11, side * 0.35);
    tag(strap, 'metal');
    g.add(strap);
  }

  // ── Rope guides / cords ───────────────────────────────────────
  buildRopes(g, -RAIL_L / 2, RAIL_H, FRAME_W_INNER, -0.3);

  // Center the group vertically so bottom sits at y=0
  g.position.y = RAIL_H / 2 + LEG_H;
  // Slight offset to better center visually
  g.position.x = 0;

  return g;
}

/* ── Riser bar (folding footbar) ──────────────────────────────── */
function buildRiserBar(g, x, railH, frameW) {
  const barR = 0.025;
  const barH = 0.55;
  const barW = frameW * 0.72;
  const baseY = railH / 2 + 0.02;
  const angle  = Math.PI * 0.35; // angled forward

  // Two vertical uprights
  for (let side of [-1, 1]) {
    const upright = cyl(barR, barR, barH, 12, METAL_BLK, 0.5, 0.6);
    upright.rotation.z = angle;
    upright.position.set(
      x - Math.sin(angle) * barH / 2 + 0.03,
      baseY + Math.cos(angle) * barH / 2,
      side * (barW / 2)
    );
    tag(upright, 'metal');
    g.add(upright);

    // Hinge plate
    const hinge = rBox(0.08, 0.04, 0.04, 0x888888, 0.4, 0.8);
    hinge.position.set(x + 0.02, baseY, side * (barW / 2));
    tag(hinge, 'metal');
    g.add(hinge);
  }

  // Horizontal grab bar (top of U)
  const grabBar = cyl(barR, barR, barW, 12, METAL_BLK, 0.5, 0.6);
  grabBar.rotation.z = Math.PI / 2;
  grabBar.position.set(
    x - Math.sin(angle) * barH + 0.03,
    baseY + Math.cos(angle) * barH,
    0
  );
  tag(grabBar, 'metal');
  g.add(grabBar);
}

/* ── Pulley tower (head end A-frame with pulleys) ─────────────── */
function buildPulleyTower(g, x, railH, frameWInner) {
  const towerH = 0.8;
  const towerW = frameWInner * 0.8;
  const baseY  = railH / 2;

  // Main vertical post
  const post = cyl(0.028, 0.028, towerH, 10, MAPLE, 0.7);
  post.position.set(x + 0.12, baseY + towerH / 2, 0);
  tag(post, 'frame_main');
  g.add(post);

  // Two side arms spreading outward
  for (let side of [-1, 1]) {
    const arm = cyl(0.018, 0.018, towerW * 0.55, 10, MAPLE, 0.7);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(x + 0.12, baseY + towerH * 0.85, side * towerW * 0.28);
    tag(arm, 'frame_main');
    g.add(arm);

    // Pulley wheel
    const pulley = cyl(0.045, 0.045, 0.02, 16, 0x666666, 0.4, 0.7);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.set(x + 0.12, baseY + towerH * 0.85, side * towerW * 0.5);
    tag(pulley, 'metal');
    g.add(pulley);

    // Pulley pin
    const pin = cyl(0.012, 0.012, 0.06, 8, 0x888888, 0.3, 0.8);
    pin.rotation.z = Math.PI / 2;
    pin.position.copy(pulley.position);
    tag(pin, 'metal');
    g.add(pin);
  }

  // Base support plate
  const base = rBox(0.22, 0.04, frameWInner + 0.1, MAPLE, 0.7);
  base.position.set(x + 0.12, baseY + 0.02, 0);
  tag(base, 'frame_main');
  g.add(base);

  // Tension screw knobs (side)
  for (let side of [-1, 1]) {
    const knob = cyl(0.03, 0.03, 0.04, 8, METAL_BLK, 0.5, 0.6);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(x + 0.12, baseY + towerH * 0.4, side * (frameWInner / 2 + 0.05));
    tag(knob, 'metal');
    g.add(knob);
  }
}

/* ── Ropes / cords ─────────────────────────────────────────────── */
function buildRopes(g, towerX, railH, frameWInner, carriageX) {
  const pulleyH = railH / 2 + 0.8 * 0.85; // matches tower pulley Y
  const pulleyZ  = frameWInner * 0.4;
  const ropeR    = 0.007;

  // We approximate each rope as a tube using a CatmullRomCurve3
  const ropeEnds = [
    { z: -0.18, handleX: carriageX - 0.3, handleY: railH / 2 + 0.18 },
    { z:  0.18, handleX: carriageX - 0.3, handleY: railH / 2 + 0.18 },
  ];

  ropeEnds.forEach((r, idx) => {
    const side = idx === 0 ? -1 : 1;
    const py   = railH / 2 + 0.68;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(r.handleX, r.handleY, r.z),
      new THREE.Vector3(towerX + 0.4, py * 0.6, r.z),
      new THREE.Vector3(towerX + 0.12, py, side * pulleyZ),
    ]);

    const tubeGeo = new THREE.TubeGeometry(curve, 24, ropeR, 6, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.9, metalness: 0.0,
    }));
    tubeMesh.castShadow = true;
    tubeMesh.userData.tag = 'rope';
    g.add(tubeMesh);

    // Hand grip loops (at handle end)
    const loop = cyl(0.025, 0.025, 0.1, 8, 0x888888, 0.5, 0.5);
    loop.position.set(r.handleX - 0.06, r.handleY, r.z);
    tag(loop, 'metal');
    g.add(loop);
  });

  // Second set of ropes going around & back (longer workout ropes)
  for (let side of [-1, 1]) {
    const r2 = 0.006;
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(carriageX - 0.28, railH / 2 + 0.14, side * 0.1),
      new THREE.Vector3(towerX + 0.35, railH / 2 + 0.5, side * 0.2),
      new THREE.Vector3(towerX + 0.12, railH / 2 + 0.68, side * pulleyZ * 0.85),
    ]);
    const geo2 = new THREE.TubeGeometry(curve2, 20, r2, 5, false);
    const mesh2 = new THREE.Mesh(geo2, new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.9,
    }));
    mesh2.userData.tag = 'rope';
    g.add(mesh2);
  }
}
