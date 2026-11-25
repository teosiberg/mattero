import * as THREE from "three";

const canvas = document.querySelector("#world");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050816, 0.012);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 500);
camera.position.set(38, 28, 58);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let entered = false;
let dragging = false;
let moved = false;
let startX = 0;
let startY = 0;
let yaw = 0.46;
let pitch = 0.18;
let targetYaw = yaw;
let targetPitch = pitch;

scene.add(new THREE.AmbientLight(0x52698c, 1.1));

const moon = new THREE.DirectionalLight(0xaacfff, 2.8);
moon.position.set(-20, 45, 25);
scene.add(moon);

const blue = new THREE.PointLight(0x227eff, 170, 110);
blue.position.set(0, 18, 8);
scene.add(blue);

const city = new THREE.Group();
scene.add(city);

const glass = new THREE.MeshStandardMaterial({
  color: 0x0d1b32,
  metalness: 0.75,
  roughness: 0.22,
  emissive: 0x071528,
  emissiveIntensity: 0.7
});

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(75, 64),
  new THREE.MeshStandardMaterial({ color: 0x07101d, metalness: 0.7, roughness: 0.45 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

for (let i = -4; i <= 4; i++) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.025, 150),
    new THREE.MeshBasicMaterial({ color: 0x1d3b62, transparent: true, opacity: 0.45 })
  );
  road.position.set(i * 12, 0, 0);
  scene.add(road);

  const roadCross = road.clone();
  roadCross.rotation.y = Math.PI / 2;
  scene.add(roadCross);
}

const sections = {
  about: { name: "About Me", position: [0, 0, 0], color: 0x55aaff },
  skills: { name: "My Skills", position: [-24, 0, -13], color: 0x63c4ff },
  projects: { name: "My Projects", position: [23, 0, -13], color: 0x69a7ff },
  experience: { name: "Experience", position: [-26, 0, 18], color: 0x72d0ff },
  life: { name: "My Life", position: [24, 0, 20], color: 0x91baff },
  future: { name: "My Future", position: [0, 0, 28], color: 0x315fff }
};

const selectable = [];

function makeBuilding(key, data) {
  const group = new THREE.Group();
  group.position.set(...data.position);

  const height = key === "future" ? 18 : key === "about" ? 21 : 14;
  const width = key === "projects" ? 10 : 8;
  const depth = key === "projects" ? 7 : 8;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    glass
  );
  body.position.y = height / 2;
  body.userData.key = key;
  group.add(body);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.55
    })
  );
  edges.position.copy(body.position);
  group.add(edges);

  for (let i = -1; i <= 1; i++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, height * 0.9, 0.12),
      new THREE.MeshBasicMaterial({ color: data.color })
    );
    band.position.set(i * width * 0.28, height * 0.5, depth / 2 + 0.02);
    group.add(band);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.06, 8, 32),
    new THREE.MeshBasicMaterial({ color: data.color })
  );
  ring.position.set(0, height + 0.8, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  city.add(group);
  selectable.push(body);
}

Object.entries(sections).forEach(([key, data]) => makeBuilding(key, data));

for (let i = 0; i < 35; i++) {
  const angle = i / 35 * Math.PI * 2;
  const radius = 38 + (i % 4) * 3;
  const height = 2 + ((i * 7) % 8);

  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, height, 1.5),
    glass
  );
  tower.position.set(
    Math.cos(angle) * radius,
    height / 2,
    Math.sin(angle) * radius
  );
  city.add(tower);
}

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];

for (let i = 0; i < 700; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 260,
    15 + Math.random() * 150,
    (Math.random() - 0.5) * 260
  );
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);

scene.add(new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0x94baff,
    size: 0.16,
    transparent: true,
    opacity: 0.7
  })
));

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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

  if (dragging) {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;

    targetYaw += dx * 0.004;
    targetPitch = Math.max(-0.15, Math.min(0.65, targetPitch - dy * 0.003));

    startX = event.clientX;
    startY = event.clientY;
  }
});

canvas.addEventListener("pointerup", event => {
  dragging = false;

  if (!moved && entered) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, false)[0];

    if (hit) openSection(hit.object.userData.key);
  }
});

canvas.addEventListener("wheel", event => {
  if (!entered) return;

  const center = new THREE.Vector3(0, 8, 0);
  const distance = camera.position.distanceTo(center);
  const next = Math.max(
    28,
    Math.min(90, distance + event.deltaY * 0.035)
  );

  camera.position.normalize().multiplyScalar(next);
}, { passive: true });

function animate() {
  requestAnimationFrame(animate);

  yaw += (targetYaw - yaw) * 0.055;
  pitch += (targetPitch - pitch) * 0.055;

  if (entered) {
    const radius = 65;
    camera.position.x = Math.sin(yaw) * radius * Math.cos(pitch);
    camera.position.z = Math.cos(yaw) * radius * Math.cos(pitch);
    camera.position.y = 17 + radius * Math.sin(pitch);
    camera.lookAt(0, 8, 0);
  } else {
    camera.position.x = 38 * Math.cos(performance.now() * 0.00007);
    camera.position.z = 58 * Math.cos(performance.now() * 0.00007);
    camera.lookAt(0, 7, 0);
  }

  city.children.forEach(object => {
    if (object.type === "Group") {
      object.children.forEach(child => {
        if (child.geometry?.type === "TorusGeometry") {
          child.rotation.z += 0.004;
        }
      });
    }
  });

  renderer.render(scene, camera);
}

animate();

const content = {
  about: `
    <p class="kicker">01 — About Me</p>
    <h2>Chi sono</h2>
    <p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p>
    <ul>
      <li><b>Percorso</b><span>ITS Incom</span></li>
      <li><b>Focus</b><span>Software & Cloud</span></li>
      <li><b>Missione</b><span>Costruire il futuro</span></li>
    </ul>
  `,
  skills: `
    <p class="kicker">02 — My Skills</p>
    <h2>Competenze</h2>
    <p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p>
    <ul>
      <li><b>HTML / CSS / JavaScript</b><span>Web</span></li>
      <li><b>C++ / C#</b><span>Software</span></li>
      <li><b>SQL / Database</b><span>Data</span></li>
      <li><b>Cloud Computing</b><span>In progress</span></li>
      <li><b>Cybersecurity</b><span>Foundation</span></li>
    </ul>
  `,
  projects: `
    <p class="kicker">03 — My Projects</p>
    <h2>Lavori selezionati</h2>
    <div class="project-grid">
      <article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article>
      <article class="project-card"><strong>Volontari</strong><span>Digital Platform</span></article>
      <article class="project-card"><strong>Cloud Lab</strong><span>Future Project</span></article>
      <article class="project-card"><strong>ITS Projects</strong><span>Development</span></article>
    </div>
  `,
  experience: `
    <p class="kicker">04 — Experience</p>
    <h2>Esperienza</h2>
    <p>Esperienze formative sul campo, dalla scrittura del software alla comprensione di sistemi reali.</p>
    <ul>
      <li><b>Ronda Elettronica</b><span>Stage</span></li>
      <li><b>C++</b><span>Sviluppo</span></li>
      <li><b>C#</b><span>Applicazioni</span></li>
      <li><b>Problem solving</b><span>Acquisito</span></li>
    </ul>
  `,
  life: `
    <p class="kicker">05 — My Life</p>
    <h2>Oltre lo schermo</h2>
    <p>Lo sport, la curiosità e le persone danno forma alla mia visione personale e professionale.</p>
    <ul>
      <li><b>Calcio</b><span>Sport</span></li>
      <li><b>Tecnologia</b><span>Passione</span></li>
      <li><b>Viaggi</b><span>Ambizione</span></li>
      <li><b>Nuove culture</b><span>Interesse</span></li>
    </ul>
  `,
  future: `
    <p class="kicker">06 — My Future</p>
    <h2>Prossima destinazione</h2>
    <p>La strada verso una carriera internazionale nel cloud.</p>
    <div class="timeline">
      <div><b>2026</b><br>Completo il percorso ITS</div>
      <div><b>Next</b><br>Entrata nel mondo Cloud</div>
      <div><b>Future</b><br>Cloud Developer internazionale</div>
    </div>
  `
};

const panel = document.querySelector("#panel");
const panelContent = document.querySelector("#panelContent");
const sectorName = document.querySelector("#sector strong");

function openSection(key) {
  panelContent.innerHTML = content[key];
  panel.classList.add("open");
  sectorName.textContent = sections[key].name;

  const position = sections[key].position;
  targetYaw = Math.atan2(position[0], position[2]);
}

document.querySelector("#close").addEventListener("click", () => {
  panel.classList.remove("open");
});

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => {
    openSection(button.dataset.section);
  });
});

document.querySelector("#enter").addEventListener("click", () => {
  entered = true;
  document.querySelector("#boot").classList.add("hidden");
  document.querySelector(".topbar").classList.add("visible");
  document.querySelector(".sector").classList.add("visible");
  document.querySelector(".hint").classList.add("visible");
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});