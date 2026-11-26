import * as THREE from "three";

const canvas = document.querySelector("#world");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd38c79, 170, 390);

// A hand-painted equirectangular sky: warm horizon, vivid sunset and soft cloud streaks.
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext("2d");
const skyGradient = skyCtx.createLinearGradient(0, 0, 0, 512);
skyGradient.addColorStop(0, "#715585");
skyGradient.addColorStop(0.23, "#d66e80");
skyGradient.addColorStop(0.48, "#ff986d");
skyGradient.addColorStop(0.63, "#ffd184");
skyGradient.addColorStop(0.72, "#f6b77c");
skyGradient.addColorStop(1, "#9ba9a0");
skyCtx.fillStyle = skyGradient;
skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
for (let cloud = 0; cloud < 85; cloud++) {
  const x = Math.random() * skyCanvas.width;
  const y = 55 + Math.random() * 260;
  const width = 60 + Math.random() * 250;
  const height = 5 + Math.random() * 18;
  const cloudGradient = skyCtx.createRadialGradient(x, y, 0, x, y, width);
  cloudGradient.addColorStop(0, cloud % 3 ? "rgba(255,195,170,.34)" : "rgba(255,220,165,.32)");
  cloudGradient.addColorStop(1, "rgba(255,160,150,0)");
  skyCtx.fillStyle = cloudGradient;
  skyCtx.save();
  skyCtx.translate(x, y);
  skyCtx.rotate(-0.09 + Math.random() * 0.18);
  skyCtx.scale(1, height / width);
  skyCtx.fillRect(-width, -width, width * 2, width * 2);
  skyCtx.restore();
}
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;

const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 900);
camera.position.set(52, 32, 82);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

scene.add(new THREE.HemisphereLight(0xffdfc0, 0x40584d, 2.0));
const sunLight = new THREE.DirectionalLight(0xffc18c, 3.8);
sunLight.position.set(-90, 75, 110);
scene.add(sunLight);
const warmFill = new THREE.DirectionalLight(0xff8b72, 1.0);
warmFill.position.set(80, 35, -20);
scene.add(warmFill);

const city = new THREE.Group();
scene.add(city);
const sections = {
  about: { name: "Downtown", position: [28, 0, -8], color: 0xff9a78 },
  skills: { name: "Arts District", position: [52, 0, -48], color: 0xf6c48c },
  projects: { name: "South Pointe", position: [70, 0, -95], color: 0xffb18d },
  experience: { name: "Collins Avenue", position: [25, 0, 50], color: 0x86b9ae },
  life: { name: "Lincoln Road", position: [66, 0, 55], color: 0xa2c49c },
  future: { name: "Miami Marina", position: [35, 0, -125], color: 0x9ab8c3 }
};

function ground(width, depth, color, x, z, roughness = 0.92) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color, roughness }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, -0.12, z);
  scene.add(mesh);
  return mesh;
}

ground(380, 380, 0x536b50, 20, -35);
// Urban blocks and roads on both sides of the winding river.
ground(18, 310, 0x55514b, 28, -10, 0.95);
ground(18, 310, 0x5d554b, 58, -10, 0.95);
const riverMat = new THREE.MeshPhysicalMaterial({ color: 0x597f83, roughness: 0.19, metalness: 0.16, clearcoat: 0.9, clearcoatRoughness: 0.12 });
function riverSegment(a, b, width) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(width, length), riverMat);
  water.rotation.x = -Math.PI / 2;
  water.rotation.z = -Math.atan2(dx, dz);
  water.position.set((a[0] + b[0]) / 2, 0.03, (a[1] + b[1]) / 2);
  scene.add(water);
}
const riverPoints = [[-18, 118], [-8, 92], [-14, 65], [-4, 38], [-9, 12], [4, -15], [1, -43], [18, -70], [20, -108], [35, -145]];
for (let i = 0; i < riverPoints.length - 1; i++) riverSegment(riverPoints[i], riverPoints[i + 1], 13 + Math.sin(i * 1.7) * 2);

// City blocks: glass towers with visible floor plates, window grids, crowns and podiums.
const glassMats = [
  new THREE.MeshStandardMaterial({ color: 0x66828a, metalness: 0.48, roughness: 0.23 }),
  new THREE.MeshStandardMaterial({ color: 0x7d8f8c, metalness: 0.38, roughness: 0.28 }),
  new THREE.MeshStandardMaterial({ color: 0x536c7d, metalness: 0.55, roughness: 0.2 })
];
const stoneMats = [0xc6aa91, 0xd2b99d, 0xb9a18b, 0xd4c5a9].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
const windowGeo = new THREE.BoxGeometry(1, 1, 0.1);
const selectable = [];
function makeTower({ position, width, depth, height, seed, section, landmark = false }) {
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  const group = new THREE.Group();
  group.position.set(...position);
  const material = glassMats[Math.floor(random() * glassMats.length)];
  const stone = stoneMats[Math.floor(random() * stoneMats.length)];
  const podiumH = Math.min(7, height * 0.17);
  const podium = new THREE.Mesh(new THREE.BoxGeometry(width + 4, podiumH, depth + 3), stone);
  podium.position.y = podiumH / 2;
  group.add(podium);
  const taper = landmark ? 0.82 : 0.9;
  const bodyW = width * taper, bodyD = depth * 0.9, bodyH = height - podiumH;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), material);
  body.position.y = podiumH + bodyH / 2;
  body.userData.section = section;
  group.add(body);
  if (section) selectable.push(body);

  const floors = Math.max(3, Math.floor(bodyH / (landmark ? 3.2 : 4.2)));
  const columns = Math.max(3, Math.floor(bodyW / 2.2));
  const panes = new THREE.InstancedMesh(windowGeo, glassMats[2], floors * columns);
  const dummy = new THREE.Object3D();
  let paneIndex = 0;
  for (let floor = 0; floor < floors; floor++) {
    for (let column = 0; column < columns; column++) {
      dummy.position.set(-bodyW / 2 + (column + 0.5) * bodyW / columns, podiumH + 1.25 + floor * (bodyH - 2) / floors, bodyD / 2 + 0.06);
      dummy.scale.set(bodyW / columns * 0.62, 1.65, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      panes.setMatrixAt(paneIndex, dummy.matrix);
      panes.setColorAt(paneIndex, new THREE.Color(random() > 0.56 ? 0xffd5a0 : (random() > 0.5 ? 0x9ab9bb : 0x738a91)));
      paneIndex++;
    }
  }
  panes.count = paneIndex;
  panes.instanceMatrix.needsUpdate = true;
  if (panes.instanceColor) panes.instanceColor.needsUpdate = true;
  group.add(panes);

  const mullionMat = new THREE.MeshStandardMaterial({ color: 0xc3b29c, roughness: 0.5, metalness: 0.32 });
  const mullions = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, bodyH, 0.18), mullionMat, columns + 1);
  for (let col = 0; col <= columns; col++) {
    dummy.position.set(-bodyW / 2 + col * bodyW / columns, podiumH + bodyH / 2, bodyD / 2 + 0.12);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mullions.setMatrixAt(col, dummy.matrix);
  }
  mullions.instanceMatrix.needsUpdate = true;
  group.add(mullions);

  // Roof parapet and equipment, plus the stepped crowns that break up the skyline.
  const crown = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, 1.2, bodyD * 0.72), stone);
  crown.position.set(0, height + 0.6, 0);
  group.add(crown);
  const rooftopPlant = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.34, 2.1, bodyD * 0.4), stoneMats[(seed + 1) % stoneMats.length]);
  rooftopPlant.position.set(-bodyW * 0.12, height + 2.25, 0);
  group.add(rooftopPlant);
  if (landmark) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 8, 7), stone);
    antenna.position.set(bodyW * 0.22, height + 6.5, 0);
    group.add(antenna);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 0.35, 2.1), stone);
  canopy.position.set(0, 2.5, depth / 2 + 2.3);
  group.add(canopy);
  city.add(group);
}

Object.entries(sections).forEach(([key, data], i) => {
  makeTower({ position: data.position, width: key === "projects" ? 20 : 15, depth: 11, height: [50, 58, 68, 43, 53, 61][i], seed: 783 + i * 139, section: key, landmark: true });
});
// Dense downtown cluster aligned along the horizon, with shorter buildings toward the foreground.
for (let i = 0; i < 95; i++) {
  const z = -155 + Math.random() * 290;
  const x = 25 + Math.random() * 125;
  if (Math.abs(z) < 145 && x < 90 && Object.values(sections).some(({ position }) => Math.hypot(x - position[0], z - position[2]) < 17)) continue;
  const skylineFactor = Math.max(0.28, 1 - Math.abs(z + 35) / 210);
  const height = 9 + Math.random() * 34 * skylineFactor;
  makeTower({ position: [x, 0, z], width: 6 + Math.random() * 10, depth: 6 + Math.random() * 9, height, seed: 4000 + i * 67, landmark: false });
}

// Low-rise neighbourhood houses, porches and pale roofs nearer the viewer.
const houseMats = [0xe3d7c3, 0xd2c3ad, 0xc9d1c5, 0xd7bba3].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
for (let i = 0; i < 56; i++) {
  const side = i % 2 ? 1 : -1;
  const z = 55 + Math.random() * 120;
  const x = side < 0 ? -58 + Math.random() * 38 : 8 + Math.random() * 37;
  const w = 5 + Math.random() * 6, d = 5 + Math.random() * 7, h = 3 + Math.random() * 3;
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  const main = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMats[i % houseMats.length]);
  main.position.y = h / 2;
  house.add(main);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.4, 4), new THREE.MeshStandardMaterial({ color: 0x8e6655, roughness: 0.9 }));
  roof.position.y = h + 1.2;
  roof.rotation.y = Math.PI / 4;
  house.add(roof);
  city.add(house);
}

// Park trees: layered rounded crowns, varied heights and tones to create a green foreground.
const treeMaterials = [0x426746, 0x54764c, 0x6d8050, 0x3e6047, 0x78844e].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x705941, roughness: 1 });
function makeTree(x, z, scale = 1, palm = false) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.45 * scale, 4.5 * scale, 7), trunkMaterial);
  trunk.position.y = 2.25 * scale;
  tree.add(trunk);
  if (palm) {
    for (let leaf = 0; leaf < 8; leaf++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.7 * scale, 5.2 * scale, 5), treeMaterials[0]);
      frond.position.set(Math.cos(leaf * Math.PI / 4) * 1.7 * scale, 4.8 * scale, Math.sin(leaf * Math.PI / 4) * 1.7 * scale);
      frond.rotation.z = Math.PI / 2 - leaf * Math.PI / 4;
      tree.add(frond);
    }
  } else {
    const crownMaterial = treeMaterials[Math.floor(Math.random() * treeMaterials.length)];
    for (let cluster = 0; cluster < 5; cluster++) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry((2.2 + Math.random() * 1.5) * scale, 1), crownMaterial);
      crown.position.set((Math.random() - 0.5) * 2.6 * scale, (4.8 + Math.random() * 2.6) * scale, (Math.random() - 0.5) * 2.6 * scale);
      tree.add(crown);
    }
  }
  city.add(tree);
}
for (let i = 0; i < 165; i++) {
  const z = -150 + Math.random() * 300;
  const x = -70 + Math.random() * 210;
  const nearLandmark = Object.values(sections).some(({ position }) => Math.hypot(x - position[0], z - position[2]) < 12);
  if (!nearLandmark) makeTree(x, z, 0.65 + Math.random() * 0.8, i % 13 === 0);
}

const traffic = [];
for (let i = 0; i < 26; i++) {
  const car = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 1.7), new THREE.MeshStandardMaterial({ color: [0xdac6a8, 0x758a89, 0x9c5947][i % 3], metalness: 0.2, roughness: 0.45 }));
  car.position.set(i % 2 ? 53 : 31, 0.3, -145 + Math.random() * 260);
  traffic.push(car);
  scene.add(car);
}

let entered = false, dragging = false, moved = false;
let startX = 0, startY = 0, yaw = 0.58, pitch = 0.22;
let targetYaw = yaw, targetPitch = pitch;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

const content = {
  about: `<p class="kicker">01 — Downtown</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p>`,
  skills: `<p class="kicker">02 — Arts District</p><h2>Competenze</h2><p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b>Interfacce responsive e interattive</li><li><b>Cloud &amp; DevOps</b>Virtualizzazione, rete e automazione</li><li><b>Python</b>Scripting e soluzioni applicative</li></ul>`,
  projects: `<p class="kicker">03 — South Pointe</p><h2>Lavori selezionati</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>ReclAIM</strong><span>AI Platform</span></article><article class="project-card"><strong>Portfolio</strong><span>Digital Experience</span></article><article class="project-card"><strong>Lab</strong><span>Cloud Project</span></article></div>`,
  experience: `<p class="kicker">04 — Collins Avenue</p><h2>Esperienza</h2><p>Esperienze formative sul campo, dalla scrittura del software alla comprensione di sistemi reali.</p>`,
  life: `<p class="kicker">05 — Lincoln Road</p><h2>Oltre lo schermo</h2><p>Lo sport, la curiosità e le persone danno forma alla mia visione personale e professionale.</p>`,
  future: `<p class="kicker">06 — Miami Marina</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso formativo</div><div><b>2027</b><br>Certificazioni cloud</div><div><b>Beyond</b><br>Esperienza globale e infrastrutture scalabili</div></div>`
};
const panel = document.querySelector("#panel");
const panelContent = document.querySelector("#panelContent");
const sectorName = document.querySelector("#sector strong");
function openSection(key) {
  if (!content[key]) return;
  panelContent.innerHTML = content[key];
  panel.classList.add("open");
  sectorName.textContent = sections[key].name;
  const position = sections[key].position;
  targetYaw = Math.atan2(position[0] - 35, position[2] + 10);
}

canvas.addEventListener("pointerdown", event => {
  dragging = true; moved = false; startX = event.clientX; startY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  updatePointer(event);
  if (!dragging) return;
  const dx = event.clientX - startX, dy = event.clientY - startY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.004;
  targetPitch = Math.max(-0.12, Math.min(0.42, targetPitch - dy * 0.003));
  startX = event.clientX; startY = event.clientY;
});
canvas.addEventListener("pointerup", event => {
  dragging = false;
  if (!moved && entered) {
    updatePointer(event); raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, false)[0];
    if (hit) openSection(hit.object.userData.section);
  }
});
canvas.addEventListener("wheel", event => {
  if (entered) targetPitch = Math.max(-0.12, Math.min(0.42, targetPitch + event.deltaY * 0.0002));
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
    const radius = 105;
    camera.position.set(35 + Math.sin(yaw) * radius * Math.cos(pitch), 29 + Math.sin(pitch) * radius, -18 + Math.cos(yaw) * radius * Math.cos(pitch));
    camera.lookAt(35, 9, -28);
  } else {
    camera.position.set(52 + Math.sin(performance.now() * 0.00008) * 4, 34, 82);
    camera.lookAt(35, 10, -28);
  }
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].position.z += i % 2 ? 0.06 : -0.06;
    if (traffic[i].position.z > 115) traffic[i].position.z = -145;
    if (traffic[i].position.z < -145) traffic[i].position.z = 115;
  }
  renderer.render(scene, camera);
}
animate();
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
});
