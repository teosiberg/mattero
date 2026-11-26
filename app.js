import * as THREE from "three";

const canvas = document.querySelector("#world");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc78b68);
scene.fog = new THREE.FogExp2(0xc58e70, 0.006);

const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

scene.add(new THREE.HemisphereLight(0xffd5a5, 0x304c50, 2.1));
const sunlight = new THREE.DirectionalLight(0xffcf98, 4.2);
sunlight.position.set(-70, 55, 80);
scene.add(sunlight);
const warmLight = new THREE.PointLight(0xff9a78, 220, 170);
warmLight.position.set(-25, 18, -20);
scene.add(warmLight);

const city = new THREE.Group();
scene.add(city);
const sections = {
  about: { name: "Downtown", position: [28, 0, -8], color: 0xff8e72 },
  skills: { name: "Art District", position: [52, 0, -48], color: 0x68bfc6 },
  projects: { name: "South Pointe", position: [70, 0, -95], color: 0xffb18d },
  experience: { name: "Collins Avenue", position: [25, 0, 50], color: 0x73bdb9 },
  life: { name: "Lincoln Road", position: [66, 0, 55], color: 0xffc078 },
  future: { name: "Miami Marina", position: [35, 0, -125], color: 0x88bdd0 }
};

function ground(width, depth, color, x, z, roughness = 0.8) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color, roughness })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  return mesh;
}

ground(330, 150, 0x397f91, -20, 5, 0.3);
ground(90, 260, 0xd7bd94, -28, -30);
ground(38, 270, 0x26343a, 42, -18, 0.72);
ground(13, 270, 0xbba98e, 18, -18);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(13, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffc187 })
);
sun.position.set(-82, 27, -155);
scene.add(sun);

// Seeded variation keeps facade details stable between page loads.
function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const glassMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x4e7883, roughness: 0.24, metalness: 0.55, emissive: 0x111c1b, emissiveIntensity: 0.12 }),
  new THREE.MeshStandardMaterial({ color: 0x708d8b, roughness: 0.28, metalness: 0.42, emissive: 0x30261d, emissiveIntensity: 0.16 }),
  new THREE.MeshStandardMaterial({ color: 0x526d7a, roughness: 0.2, metalness: 0.62, emissive: 0x161b22, emissiveIntensity: 0.12 })
];
const concreteMaterials = [0xc6aa91, 0xd0b69b, 0xb9987e, 0xcbbca3].map(color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02 })
);
const windowGeometry = new THREE.BoxGeometry(1, 1, 0.12);
const selectable = [];

function addWindowFacade(group, width, depth, height, rng, fullDetail) {
  const floorHeight = fullDetail ? 2.65 : 3.15;
  const columns = Math.max(2, Math.floor(width / (fullDetail ? 2.25 : 3.2)));
  const rows = Math.max(2, Math.floor((height - 2) / floorHeight));
  const paneWidth = (width - 1.1) / columns * (fullDetail ? 0.7 : 0.62);
  const paneHeight = floorHeight * (fullDetail ? 0.66 : 0.58);
  const faces = fullDetail ? ["front", "back", "left", "right"] : ["front"];

  for (const face of faces) {
    const panes = new THREE.InstancedMesh(windowGeometry, glassMaterials[Math.floor(rng() * glassMaterials.length)], rows * columns);
    const transform = new THREE.Object3D();
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const horizontal = -width / 2 + 0.8 + (column + 0.5) * (width - 1.6) / columns;
        const y = 1.35 + row * floorHeight + floorHeight / 2;
        const lit = rng() > 0.58;
        transform.position.y = y;
        transform.rotation.set(0, 0, 0);
        if (face === "front" || face === "back") {
          transform.position.x = horizontal;
          transform.position.z = face === "front" ? depth / 2 + 0.07 : -depth / 2 - 0.07;
          transform.scale.set(paneWidth, paneHeight, 1);
          if (face === "back") transform.rotation.y = Math.PI;
        } else {
          const sideZ = -depth / 2 + 0.55 + (column + 0.5) * (depth - 1.1) / columns;
          transform.position.x = face === "right" ? width / 2 + 0.07 : -width / 2 - 0.07;
          transform.position.z = sideZ;
          transform.scale.set(paneWidth, paneHeight, 1);
          transform.rotation.y = face === "right" ? Math.PI / 2 : -Math.PI / 2;
        }
        transform.updateMatrix();
        panes.setMatrixAt(index, transform.matrix);
        panes.setColorAt(index, new THREE.Color(lit ? 0xffd29a : (rng() > 0.5 ? 0x9abdc0 : 0x728b91)));
        index++;
      }
    }
    panes.count = index;
    panes.instanceMatrix.needsUpdate = true;
    if (panes.instanceColor) panes.instanceColor.needsUpdate = true;
    group.add(panes);
  }
}

function addTower({ key, position, width, depth, height, seed, selectableBuilding = false, detailed = true, colorIndex = 0 }) {
  const rng = seeded(seed);
  const group = new THREE.Group();
  group.position.set(...position);
  const glassMaterial = glassMaterials[colorIndex % glassMaterials.length];
  const concreteMaterial = concreteMaterials[colorIndex % concreteMaterials.length];
  const podiumHeight = Math.min(height * 0.18, 7);

  // Wider, stepped podium and recessed tower give the silhouette a more convincing scale.
  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(width + 4, podiumHeight, depth + 3),
    concreteMaterial
  );
  podium.position.y = podiumHeight / 2;
  group.add(podium);

  const towerWidth = width * (height > 38 ? 0.82 : 0.9);
  const towerDepth = depth * (height > 38 ? 0.86 : 0.92);
  const towerHeight = height - podiumHeight;
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth),
    glassMaterial
  );
  tower.position.y = podiumHeight + towerHeight / 2;
  tower.userData.section = key;
  group.add(tower);
  if (selectableBuilding) selectable.push(tower);

  addWindowFacade(group, towerWidth, towerDepth, towerHeight, rng, detailed);

  // Strong vertical mullions and fine floor bands catch the low sunset light.
  const finMaterial = new THREE.MeshStandardMaterial({ color: 0xb9a58e, roughness: 0.5, metalness: 0.25 });
  const finCount = Math.max(4, Math.floor(towerWidth / (detailed ? 3.2 : 4.5)));
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, towerHeight, 0.2), finMaterial, finCount * 2);
  const transform = new THREE.Object3D();
  let finIndex = 0;
  for (const face of ["front", "back"]) {
    for (let fin = 0; fin < finCount; fin++) {
      transform.position.set(
        -towerWidth / 2 + (fin + 0.5) * towerWidth / finCount,
        podiumHeight + towerHeight / 2,
        face === "front" ? towerDepth / 2 + 0.13 : -towerDepth / 2 - 0.13
      );
      transform.rotation.set(0, face === "front" ? 0 : Math.PI, 0);
      transform.updateMatrix();
      fins.setMatrixAt(finIndex++, transform.matrix);
    }
  }
  fins.count = finIndex;
  fins.instanceMatrix.needsUpdate = true;
  group.add(fins);

  if (detailed) {
    const beltGeometry = new THREE.BoxGeometry(towerWidth + 0.5, 0.12, towerDepth + 0.5);
    const beltCount = Math.floor(towerHeight / 5);
    const belts = new THREE.InstancedMesh(beltGeometry, finMaterial, beltCount);
    for (let i = 0; i < beltCount; i++) {
      transform.position.set(0, podiumHeight + 2.5 + i * 5, 0);
      transform.rotation.set(0, 0, 0);
      transform.scale.set(1, 1, 1);
      transform.updateMatrix();
      belts.setMatrixAt(i, transform.matrix);
    }
    belts.instanceMatrix.needsUpdate = true;
    group.add(belts);

    // Roof parapet, mechanical penthouse, water tanks and a slender antenna.
    const roofY = height;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(towerWidth * 0.72, 1.3, towerDepth * 0.72),
      concreteMaterial
    );
    cap.position.set(0, roofY + 0.65, 0);
    group.add(cap);
    const plant = new THREE.Mesh(
      new THREE.BoxGeometry(towerWidth * 0.38, 1.8, towerDepth * 0.45),
      concreteMaterials[(colorIndex + 1) % concreteMaterials.length]
    );
    plant.position.set(-towerWidth * 0.12, roofY + 2.2, 0);
    group.add(plant);
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.09, Math.max(2, height * 0.12), 6),
      new THREE.MeshStandardMaterial({ color: 0x766e63, metalness: 0.65, roughness: 0.35 })
    );
    antenna.position.set(towerWidth * 0.22, roofY + 1.2 + Math.max(2, height * 0.06), 0);
    group.add(antenna);

    // Shaded entrance canopy makes the podium read as a real street-level base.
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.52, 0.32, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x4e5e5a, metalness: 0.35, roughness: 0.4 })
    );
    canopy.position.set(0, 2.5, depth / 2 + 2.5);
    group.add(canopy);
  }

  city.add(group);
}

Object.entries(sections).forEach(([key, data], index) => {
  const heights = [39, 48, 57, 34, 43, 52];
  addTower({
    key,
    position: data.position,
    width: key === "projects" ? 19 : 15,
    depth: key === "projects" ? 12 : 10,
    height: heights[index],
    seed: 782 + index * 149,
    selectableBuilding: true,
    detailed: true,
    colorIndex: index
  });
});

function addPalm(x, z, scale = 1) {
  const palm = new THREE.Group();
  palm.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scale, 0.52 * scale, 8 * scale, 10),
    new THREE.MeshStandardMaterial({ color: 0x92744c, roughness: 0.78 })
  );
  trunk.position.y = 4 * scale;
  palm.add(trunk);
  const leaves = new THREE.MeshStandardMaterial({ color: 0x3d7658, side: THREE.DoubleSide, roughness: 0.7 });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.75 * scale, 5 * scale, 5), leaves);
    leaf.position.set(Math.cos(i / 9 * Math.PI * 2) * 1.9 * scale, 8 * scale, Math.sin(i / 9 * Math.PI * 2) * 1.9 * scale);
    leaf.rotation.z = i / 9 * Math.PI * 2;
    palm.add(leaf);
  }
  city.add(palm);
}
for (let z = -128; z < 118; z += 15) addPalm(19, z);

const palette = [0xdba58e, 0x74aaa9, 0xd4b9a4, 0xcba18f, 0x91b3a4];
for (let i = 0; i < 95; i++) {
  const x = 20 + Math.random() * 135;
  const z = -145 + Math.random() * 270;
  if (Object.values(sections).some(({ position }) => Math.hypot(x - position[0], z - position[2]) < 17)) continue;
  const height = 8 + Math.random() * 34;
  const width = 5 + Math.random() * 9;
  const depth = 5 + Math.random() * 8;
  const detailed = i < 28;
  addTower({
    position: [x, 0, z],
    width,
    depth,
    height,
    seed: 2901 + i * 73,
    detailed,
    colorIndex: i % palette.length
  });
}

const traffic = [];
for (let i = 0; i < 45; i++) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.25, 1.6),
    new THREE.MeshBasicMaterial({ color: [0xff916e, 0x78cfd0, 0xffc477][i % 3] })
  );
  car.position.set(i % 2 ? 53 : 31, 0.28, -145 + Math.random() * 260);
  traffic.push(car);
  scene.add(car);
}

let entered = false;
let dragging = false;
let moved = false;
let startX = 0;
let startY = 0;
let yaw = 0.58;
let pitch = 0.22;
let targetYaw = yaw;
let targetPitch = pitch;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

const content = {
  about: `<p class="kicker">01 — Downtown</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p>`,
  skills: `<p class="kicker">02 — Art District</p><h2>Competenze</h2><p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b>Interfacce responsive e interattive</li><li><b>Cloud &amp; DevOps</b>Virtualizzazione, rete e automazione</li><li><b>Python</b>Scripting e soluzioni applicative</li></ul>`,
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
  dragging = true;
  moved = false;
  startX = event.clientX;
  startY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  updatePointer(event);
  if (!dragging) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.004;
  targetPitch = Math.max(-0.12, Math.min(0.42, targetPitch - dy * 0.003));
  startX = event.clientX;
  startY = event.clientY;
});
canvas.addEventListener("pointerup", event => {
  dragging = false;
  if (!moved && entered) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
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
document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => openSection(button.dataset.section));
});

function animate() {
  requestAnimationFrame(animate);
  yaw += (targetYaw - yaw) * 0.055;
  pitch += (targetPitch - pitch) * 0.055;
  const time = performance.now();
  if (entered) {
    const radius = 88;
    camera.position.set(
      35 + Math.sin(yaw) * radius * Math.cos(pitch),
      25 + Math.sin(pitch) * radius,
      -10 + Math.cos(yaw) * radius * Math.cos(pitch)
    );
    camera.lookAt(35, 10, -10);
  } else {
    camera.position.set(52 + Math.sin(time * 0.00008) * 5, 32, 82);
    camera.lookAt(35, 10, -20);
  }

  for (let i = 0; i < traffic.length; i++) {
    const car = traffic[i];
    car.position.z += i % 2 ? 0.09 : -0.09;
    if (car.position.z > 115) car.position.z = -145;
    if (car.position.z < -145) car.position.z = 115;
  }
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
