import * as THREE from "three";

const canvas = document.querySelector("#world");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 1200);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

scene.add(new THREE.HemisphereLight(0xffd9b2, 0x53624c, 2.15));
const sun = new THREE.DirectionalLight(0xffc28e, 3.2);
sun.position.set(-100, 120, 120);
scene.add(sun);
scene.fog = new THREE.Fog(0xc69b8c, 250, 720);

const city = new THREE.Group();
scene.add(city);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const selectable = [];
let entered = false;
let dragging = false;
let moved = false;
let lastX = 0;
let lastY = 0;
let yaw = 0.72;
let pitch = 0.19;
let targetYaw = yaw;
let targetPitch = pitch;

// Soft sunset sky with layered cloud streaks.
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyContext = skyCanvas.getContext("2d");
const skyGradient = skyContext.createLinearGradient(0, 0, 0, 512);
skyGradient.addColorStop(0, "#62547e");
skyGradient.addColorStop(0.28, "#c26f88");
skyGradient.addColorStop(0.54, "#ff986e");
skyGradient.addColorStop(0.69, "#ffd087");
skyGradient.addColorStop(0.82, "#b7b3a0");
skyGradient.addColorStop(1, "#738c76");
skyContext.fillStyle = skyGradient;
skyContext.fillRect(0, 0, 1024, 512);
for (let i = 0; i < 100; i++) {
  const x = Math.random() * 1024;
  const y = 35 + Math.random() * 310;
  const width = 50 + Math.random() * 230;
  const height = 4 + Math.random() * 16;
  skyContext.save();
  skyContext.translate(x, y);
  skyContext.rotate(-0.1 + Math.random() * 0.2);
  skyContext.fillStyle = i % 3 === 0 ? "rgba(255,220,176,.34)" : "rgba(255,140,147,.24)";
  skyContext.beginPath();
  skyContext.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  skyContext.fill();
  skyContext.restore();
}
const sky = new THREE.CanvasTexture(skyCanvas);
sky.mapping = THREE.EquirectangularReflectionMapping;
sky.colorSpace = THREE.SRGBColorSpace;
scene.background = sky;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(560, 560),
  new THREE.MeshStandardMaterial({ color: 0x68734b, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.15, -20);
ground.receiveShadow = true;
scene.add(ground);

// Street grid. Lots are derived from these exact road boundaries, so no structure can spawn on asphalt.
const roadXs = [-145, -95, -45, 5, 55, 105, 155];
const roadZs = [-130, -82, -34, 14, 62, 110];
const roadWidth = 9;
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x474945, roughness: 0.88 });
const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xb9ad91, roughness: 0.92 });

for (const z of roadZs) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(340, roadWidth), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(5, 0.015, z);
  road.receiveShadow = true;
  scene.add(road);
  // Paired sidewalks run along both sides of each street.
  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(340, 2.2), sidewalkMaterial);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(5, 0.045, z + side * (roadWidth / 2 + 1.1));
    scene.add(walk);
  }
}
for (const x of roadXs) {
  const width = x === 5 ? 12 : roadWidth;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, 290), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.025, -10);
  road.receiveShadow = true;
  scene.add(road);
  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 290), sidewalkMaterial);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(x + side * (width / 2 + 1.1), 0.05, -10);
    scene.add(walk);
  }
}

// A narrow urban river; streets crossing it receive small bridge decks.
const riverMaterial = new THREE.MeshPhysicalMaterial({ color: 0x588c87, roughness: 0.18, metalness: 0.1, clearcoat: 0.9 });
const riverShape = new THREE.Shape();
riverShape.moveTo(-39, -150);
riverShape.lineTo(-25, -150);
riverShape.bezierCurveTo(-43, -90, -20, -45, -35, 0);
riverShape.bezierCurveTo(-47, 45, -22, 90, -33, 150);
riverShape.lineTo(-48, 150);
riverShape.bezierCurveTo(-38, 90, -57, 48, -47, 0);
riverShape.bezierCurveTo(-35, -48, -59, -95, -39, -150);
const river = new THREE.Mesh(new THREE.ShapeGeometry(riverShape, 20), riverMaterial);
river.rotation.x = -Math.PI / 2;
river.position.y = 0.07;
scene.add(river);
for (const z of roadZs) {
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(22, 0.45, roadWidth + 2), sidewalkMaterial);
  bridge.position.set(-38, 0.28, z);
  bridge.receiveShadow = true;
  scene.add(bridge);
}

const glassMaterials = [0x526e7c, 0x68828a, 0x748b8b, 0x879595].map(color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.24, metalness: 0.45 })
);
const stoneMaterials = [0xc6b49b, 0xd4c4a9, 0xb5a38f, 0xcbbba1].map(color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86 })
);
const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x617984, roughness: 0.2, metalness: 0.45 });
const warmWindowMaterial = new THREE.MeshStandardMaterial({ color: 0xe7bd87, roughness: 0.28, emissive: 0x75441e, emissiveIntensity: 0.08 });

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function makeBuilding({ x, z, width, depth, height, seed, section = null, tower = false }) {
  const random = seeded(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const podiumHeight = Math.min(5.5, height * 0.17);
  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(width + 2.2, podiumHeight, depth + 2.2),
    stoneMaterials[Math.floor(random() * stoneMaterials.length)]
  );
  podium.position.y = podiumHeight / 2;
  group.add(podium);

  const bodyWidth = width * (tower ? 0.82 : 0.94);
  const bodyDepth = depth * (tower ? 0.84 : 0.94);
  const bodyHeight = height - podiumHeight;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
    glassMaterials[Math.floor(random() * glassMaterials.length)]
  );
  body.position.y = podiumHeight + bodyHeight / 2;
  if (section) {
    body.userData.section = section;
    selectable.push(body);
  }
  group.add(body);

  // Repeated window bays and floor slabs produce a legible facade at skyline distance.
  const floors = Math.max(3, Math.floor(bodyHeight / (tower ? 3.5 : 3.1)));
  const columns = Math.max(3, Math.floor(bodyWidth / 2.1));
  const paneGeometry = new THREE.BoxGeometry(Math.max(0.55, bodyWidth / columns * 0.65), 1.45, 0.09);
  for (let floor = 0; floor < floors; floor++) {
    for (let column = 0; column < columns; column++) {
      const pane = new THREE.Mesh(paneGeometry, random() > 0.78 ? warmWindowMaterial : windowMaterial);
      pane.position.set(
        -bodyWidth / 2 + (column + 0.5) * bodyWidth / columns,
        podiumHeight + 1.7 + floor * (bodyHeight - 2) / floors,
        bodyDepth / 2 + 0.06
      );
      group.add(pane);
    }
  }
  const slabMaterial = new THREE.MeshStandardMaterial({ color: 0xc0b29e, roughness: 0.55, metalness: 0.12 });
  for (let y = 3.5; y < bodyHeight; y += 4) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth + 0.18, 0.1, bodyDepth + 0.18), slabMaterial);
    slab.position.y = podiumHeight + y;
    group.add(slab);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.7, 1.15, bodyDepth * 0.72), stoneMaterials[1]);
  roof.position.y = height + 0.55;
  group.add(roof);
  if (tower) {
    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.32, 1.9, bodyDepth * 0.4), stoneMaterials[2]);
    penthouse.position.set(-bodyWidth * 0.12, height + 2.05, 0);
    group.add(penthouse);
    if (height > 56) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 6, 6), stoneMaterials[2]);
      mast.position.set(bodyWidth * 0.2, height + 5.5, 0);
      group.add(mast);
    }
  }
  city.add(group);
  return { x, z, width: width + 2.2, depth: depth + 2.2 };
}

// Reserve landmark footprints in actual block interiors, not at arbitrary road-adjacent coordinates.
const sectionData = {
  about: { name: "Downtown", lot: [-95, -82, -45, -34], color: 0xff9874, height: 66 },
  skills: { name: "Arts District", lot: [-45, -34, 5, 14], color: 0x8ec5c1, height: 54 },
  projects: { name: "South Pointe", lot: [55, -82, 105, -34], color: 0xf9b28b, height: 76 },
  experience: { name: "Collins Avenue", lot: [5, 14, 55, 62], color: 0x82baa9, height: 47 },
  life: { name: "Lincoln Road", lot: [105, 62, 155, 110], color: 0xb9b27a, height: 56 },
  future: { name: "Miami Marina", lot: [-145, 14, -95, 62], color: 0x91bdcb, height: 61 }
};
const footprints = [];
for (const [key, data] of Object.entries(sectionData)) {
  const [x0, z0, x1, z1] = data.lot;
  const x = (x0 + x1) / 2;
  const z = (z0 + z1) / 2;
  const fp = makeBuilding({ x, z, width: 15, depth: 12, height: data.height, seed: 750 + footprints.length * 31, section: key, tower: true });
  footprints.push(fp);
}

// Fit every background building to its street block with edge clearance; no random placement across roads.
let buildingId = 0;
for (let zi = 0; zi < roadZs.length - 1; zi++) {
  for (let xi = 0; xi < roadXs.length - 1; xi++) {
    const x0 = roadXs[xi] + roadWidth / 2 + 4;
    const x1 = roadXs[xi + 1] - roadWidth / 2 - 4;
    const z0 = roadZs[zi] + roadWidth / 2 + 4;
    const z1 = roadZs[zi + 1] - roadWidth / 2 - 4;
    const centerX = (x0 + x1) / 2;
    const centerZ = (z0 + z1) / 2;
    const hasLandmark = footprints.some(fp => Math.abs(fp.x - centerX) < 24 && Math.abs(fp.z - centerZ) < 24);
    if (hasLandmark) continue;
    const width = 7 + Math.random() * 5;
    const depth = 6 + Math.random() * 5;
    const x = THREE.MathUtils.clamp(centerX + (Math.random() - 0.5) * 9, x0 + width / 2, x1 - width / 2);
    const z = THREE.MathUtils.clamp(centerZ + (Math.random() - 0.5) * 8, z0 + depth / 2, z1 - depth / 2);
    makeBuilding({ x, z, width, depth, height: 16 + Math.random() * 32, seed: 1200 + buildingId++ * 41, tower: Math.random() > 0.55 });
  }
}

// Single-family houses occupy small parcels wholly inside the same block boundaries.
const houseMaterials = [0xe1d5c1, 0xd3c5ad, 0xc8d1c3, 0xd8bda2].map(color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x916a57, roughness: 0.92 });
const occupied = [...footprints];
for (let zi = 0; zi < roadZs.length - 1; zi++) {
  for (let xi = 0; xi < roadXs.length - 1; xi++) {
    const x0 = roadXs[xi] + 8;
    const x1 = roadXs[xi + 1] - 8;
    const z0 = roadZs[zi] + 8;
    const z1 = roadZs[zi + 1] - 8;
    const cols = 3;
    const rows = 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = x0 + (col + 0.5) * (x1 - x0) / cols;
        const z = z0 + (row + 0.5) * (z1 - z0) / rows;
        if (occupied.some(fp => Math.abs(x - fp.x) < fp.width / 2 + 5 && Math.abs(z - fp.z) < fp.depth / 2 + 5)) continue;
        const width = Math.min(6.6, (x1 - x0) / cols - 2);
        const depth = Math.min(6, (z1 - z0) / rows - 2);
        const height = 3.4 + Math.random() * 1.3;
        const house = new THREE.Group();
        house.position.set(x, 0, z);
        const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), houseMaterials[Math.floor(Math.random() * houseMaterials.length)]);
        walls.position.y = height / 2;
        house.add(walls);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, 2.2, 4), roofMaterial);
        roof.position.y = height + 1.1;
        roof.rotation.y = Math.PI / 4;
        house.add(roof);
        const porch = new THREE.Mesh(new THREE.BoxGeometry(width * 0.48, 0.22, 1.8), houseMaterials[1]);
        porch.position.set(0, 1.6, depth / 2 + 0.8);
        house.add(porch);
        city.add(house);
        occupied.push({ x, z, width, depth });
      }
    }
  }
}

// Trees are placed on parcels/riverbanks only and kept clear of structures and road corridors.
const foliage = [0x3f6546, 0x52734c, 0x6e8050, 0x385d45, 0x79824d].map(color =>
  new THREE.MeshStandardMaterial({ color, roughness: 1 })
);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x735b42, roughness: 1 });
function addTree(x, z, scale, palm = false) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.36 * scale, 3.7 * scale, 7), trunkMaterial);
  trunk.position.y = 1.85 * scale;
  tree.add(trunk);
  if (palm) {
    for (let i = 0; i < 8; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.58 * scale, 4.5 * scale, 5), foliage[0]);
      frond.position.set(Math.cos(i * Math.PI / 4) * 1.4 * scale, 4.1 * scale, Math.sin(i * Math.PI / 4) * 1.4 * scale);
      frond.rotation.z = Math.PI / 2 - i * Math.PI / 4;
      tree.add(frond);
    }
  } else {
    const crownMaterial = foliage[Math.floor(Math.random() * foliage.length)];
    for (let i = 0; i < 4; i++) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry((1.6 + Math.random()) * scale, 1), crownMaterial);
      crown.position.set((Math.random() - 0.5) * 1.8 * scale, (4.1 + Math.random() * 1.4) * scale, (Math.random() - 0.5) * 1.8 * scale);
      tree.add(crown);
    }
  }
  city.add(tree);
}
for (let zi = 0; zi < roadZs.length - 1; zi++) {
  for (let xi = 0; xi < roadXs.length - 1; xi++) {
    const x0 = roadXs[xi] + 7;
    const x1 = roadXs[xi + 1] - 7;
    const z0 = roadZs[zi] + 7;
    const z1 = roadZs[zi + 1] - 7;
    for (let i = 0; i < 2; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      const z = z0 + Math.random() * (z1 - z0);
      if (occupied.some(fp => Math.abs(x - fp.x) < fp.width / 2 + 2 && Math.abs(z - fp.z) < fp.depth / 2 + 2)) continue;
      addTree(x, z, 0.55 + Math.random() * 0.55, Math.random() > 0.82);
    }
  }
}

// Traffic travels along the vertical avenues, centered on the asphalt lanes.
const traffic = [];
for (let i = 0; i < 30; i++) {
  const laneRoad = roadXs[i % roadXs.length];
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.32, 2.05),
    new THREE.MeshStandardMaterial({ color: [0xd6c6ad, 0x748783, 0x995f50][i % 3], metalness: 0.16, roughness: 0.45 })
  );
  car.position.set(laneRoad + (i % 2 ? -1.6 : 1.6), 0.28, -140 + Math.random() * 280);
  traffic.push(car);
  scene.add(car);
}

const content = {
  about: `<p class="kicker">01 — Downtown</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p>`,
  skills: `<p class="kicker">02 — Arts District</p><h2>Competenze</h2><p>Sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b>Interfacce responsive e interattive</li><li><b>Cloud &amp; DevOps</b>Virtualizzazione, rete e automazione</li><li><b>Python</b>Scripting e soluzioni applicative</li></ul>`,
  projects: `<p class="kicker">03 — South Pointe</p><h2>Progetti</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>ReclAIM</strong><span>AI Platform</span></article><article class="project-card"><strong>Portfolio</strong><span>Digital Experience</span></article><article class="project-card"><strong>Lab</strong><span>Cloud Project</span></article></div>`,
  experience: `<p class="kicker">04 — Collins Avenue</p><h2>Esperienza</h2><p>Esperienze formative nella scrittura del software e nella comprensione di sistemi reali.</p>`,
  life: `<p class="kicker">05 — Lincoln Road</p><h2>Oltre lo schermo</h2><p>Sport, curiosità e persone danno forma alla mia visione personale e professionale.</p>`,
  future: `<p class="kicker">06 — Miami Marina</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso formativo</div><div><b>2027</b><br>Certificazioni cloud</div><div><b>Beyond</b><br>Esperienza globale e infrastrutture scalabili</div></div>`
};
const panel = document.querySelector("#panel");
const panelContent = document.querySelector("#panelContent");
const sectorName = document.querySelector("#sector strong");
function openSection(key) {
  if (!content[key]) return;
  panelContent.innerHTML = content[key];
  panel.classList.add("open");
  sectorName.textContent = sectionData[key].name;
  const [x0, z0, x1, z1] = sectionData[key].lot;
  targetYaw = Math.atan2((x0 + x1) / 2 - 35, (z0 + z1) / 2 + 25);
}

canvas.addEventListener("pointerdown", event => {
  dragging = true; moved = false; lastX = event.clientX; lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  if (!dragging) return;
  const dx = event.clientX - lastX, dy = event.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.004;
  targetPitch = THREE.MathUtils.clamp(targetPitch - dy * 0.003, -0.12, 0.42);
  lastX = event.clientX; lastY = event.clientY;
});
canvas.addEventListener("pointerup", event => {
  dragging = false;
  if (!moved && entered) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, false)[0];
    if (hit) openSection(hit.object.userData.section);
  }
});
canvas.addEventListener("wheel", event => {
  if (entered) targetPitch = THREE.MathUtils.clamp(targetPitch + event.deltaY * 0.0002, -0.12, 0.42);
}, { passive: true });

document.querySelector("#enter").addEventListener("click", () => {
  entered = true;
  document.querySelector("#boot").classList.add("entered");
  document.querySelector(".topbar").classList.add("visible");
  document.querySelector("#sector").classList.add("visible");
  document.querySelector("#hint").classList.add("visible");
});
document.querySelector("#close").addEventListener("click", () => panel.classList.remove("open"));
document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => openSection(button.dataset.section)));

function animate() {
  requestAnimationFrame(animate);
  yaw += (targetYaw - yaw) * 0.055;
  pitch += (targetPitch - pitch) * 0.055;
  if (entered) {
    const radius = 110;
    camera.position.set(35 + Math.sin(yaw) * radius * Math.cos(pitch), 29 + Math.sin(pitch) * radius, -24 + Math.cos(yaw) * radius * Math.cos(pitch));
    camera.lookAt(35, 10, -26);
  } else {
    camera.position.set(66 + Math.sin(performance.now() * 0.00008) * 4, 48, 145);
    camera.lookAt(35, 11, -25);
  }
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].position.z += i % 2 ? 0.055 : -0.055;
    if (traffic[i].position.z > 140) traffic[i].position.z = -140;
    if (traffic[i].position.z < -140) traffic[i].position.z = 140;
  }
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
});
