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

scene.add(new THREE.HemisphereLight(0xffc98c, 0x2f5d69, 2.15));
const sunlight = new THREE.DirectionalLight(0xffd39a, 4.2);
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

function ground(width, depth, color, x, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  scene.add(mesh);
}

ground(330, 150, 0x397f91, -20, 5);
ground(90, 260, 0xd7bd94, -28, -30);
ground(38, 270, 0x26343a, 42, -18);
ground(13, 270, 0xbba98e, 18, -18);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(13, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffc187 })
);
sun.position.set(-82, 27, -155);
scene.add(sun);

const selectable = [];
const sectionKeys = Object.keys(sections);
function addBuilding(key, data) {
  const index = sectionKeys.indexOf(key);
  const height = key === "future" ? 38 : key === "about" ? 34 : key === "projects" ? 44 : 28;
  const width = key === "projects" ? 18 : 14;
  const depth = 9;
  const colors = [0xe4aa90, 0x78aeb0, 0xd0a99e, 0xe7c38c, 0x91b3a8];
  const group = new THREE.Group();
  group.position.set(...data.position);

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.48 })
  );
  building.position.y = height / 2;
  building.userData.section = key;
  group.add(building);
  selectable.push(building);

  const trim = new THREE.LineSegments(
    new THREE.EdgesGeometry(building.geometry),
    new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.72 })
  );
  trim.position.copy(building.position);
  group.add(trim);

  for (let y = 4; y < height; y += 5) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1, 0.16, depth + 1),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.4 })
    );
    band.position.y = y;
    group.add(band);
  }
  for (let y = 3; y < height; y += 4) {
    for (let x = -width / 2 + 2; x < width / 2; x += 3) {
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 1.5),
        new THREE.MeshBasicMaterial({ color: 0x4d7e8a, transparent: true, opacity: 0.68 })
      );
      windowMesh.position.set(x, y, depth / 2 + 0.01);
      group.add(windowMesh);
    }
  }
  city.add(group);
}
Object.entries(sections).forEach(([key, data]) => addBuilding(key, data));

function addPalm(x, z, scale = 1) {
  const palm = new THREE.Group();
  palm.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.52, 8 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x92744c })
  );
  trunk.position.y = 4 * scale;
  palm.add(trunk);
  const leaves = new THREE.MeshStandardMaterial({ color: 0x3d7658, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.75 * scale, 5 * scale, 4), leaves);
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
  if (Object.values(sections).some(({ position }) => Math.hypot(x - position[0], z - position[2]) < 15)) continue;
  const height = 5 + Math.random() * 30;
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(5 + Math.random() * 10, height, 5 + Math.random() * 8),
    new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.58 })
  );
  building.position.set(x, height / 2, z);
  city.add(building);
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

  // Keep each car's animation and wraparound checks inside the loop scope.
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
