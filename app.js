import * as THREE from "three";

const canvas = document.querySelector("#world");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030713);
scene.fog = new THREE.FogExp2(0x07101f, 0.0085);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 700);
camera.position.set(58, 38, 82);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let entered = false, dragging = false, moved = false;
let startX = 0, startY = 0, yaw = 0.62, pitch = 0.24;
let targetYaw = yaw, targetPitch = pitch;

scene.add(new THREE.HemisphereLight(0x7cbcff, 0x090b13, 1.35));
const moon = new THREE.DirectionalLight(0xbfe2ff, 3.2);
moon.position.set(-45, 70, 35); scene.add(moon);
const core = new THREE.PointLight(0x3aa8ff, 350, 180); core.position.set(0, 24, 8); scene.add(core);

const city = new THREE.Group(); scene.add(city);

const ground = new THREE.Mesh(new THREE.CircleGeometry(170, 96), new THREE.MeshStandardMaterial({ color:0x08101d, metalness:.65, roughness:.38 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -.05; scene.add(ground);

const grid = new THREE.GridHelper(250, 50, 0x174d78, 0x10243a); grid.position.y = .01; grid.material.transparent=true; grid.material.opacity=.34; scene.add(grid);

function neonRoad(x, z, length, horizontal=false) {
  const road = new THREE.Mesh(new THREE.BoxGeometry(horizontal?length:1.5,.035,horizontal?1.5:length),new THREE.MeshBasicMaterial({color:0x163858,transparent:true,opacity:.65}));
  road.position.set(x,.02,z); scene.add(road);
  const line = new THREE.Mesh(new THREE.BoxGeometry(horizontal?length:.05,.045,horizontal?.05:length),new THREE.MeshBasicMaterial({color:0x55baff,transparent:true,opacity:.42}));
  line.position.set(x,.04,z); scene.add(line);
}
for(let i=-5;i<=5;i++){neonRoad(i*18,0,170,false);neonRoad(0,i*18,170,true)}

const sections = {
  about:{name:"Central Nexus",position:[0,0,0],color:0x55aaff},
  skills:{name:"Tech District",position:[-36,0,-18],color:0x63c4ff},
  projects:{name:"Project Harbor",position:[36,0,-18],color:0x69a7ff},
  experience:{name:"Innovation Quarter",position:[-38,0,28],color:0x72d0ff},
  life:{name:"Life District",position:[38,0,32],color:0x91baff},
  future:{name:"Future Spire",position:[0,0,48],color:0x315fff}
};
const selectable=[];

function createWindowGrid(group,w,h,d,color){
  const windowMat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.42});
  const count=Math.floor(h/3);
  for(let y=2;y<h;y+=3){
    for(let x=-w/2+1;x<w/2;x+=2){
      const windowMesh=new THREE.Mesh(new THREE.PlaneGeometry(.75,.38),windowMat);
      windowMesh.position.set(x,y,d/2+.012); windowMesh.userData.window=true; group.add(windowMesh);
    }
  }
}

function makeBuilding(key,data){
  const group=new THREE.Group(); group.position.set(...data.position);
  const h=key==="future"?36:key==="about"?30:key==="projects"?26:22;
  const w=key==="projects"?13:10, d=key==="projects"?9:10;
  const bodyMat=new THREE.MeshStandardMaterial({color:key==="future"?0x101d3c:0x0c1728,metalness:.78,roughness:.22,emissive:data.color,emissiveIntensity:.06});
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bodyMat); body.position.y=h/2; body.userData.key=key; group.add(body); selectable.push(body);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),new THREE.LineBasicMaterial({color:data.color,transparent:true,opacity:.75})); edges.position.copy(body.position); group.add(edges);
  createWindowGrid(group,w,h,d,data.color);
  for(let i=-1;i<=1;i+=2){const band=new THREE.Mesh(new THREE.BoxGeometry(.12,h*.9,.12),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.8}));band.position.set(i*w*.31,h*.5,d/2+.03);group.add(band)}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.07,8,32),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.9}));ring.position.set(0,h+.9,0);ring.rotation.x=Math.PI/2;group.add(ring);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,key==="future"?8:3,8),new THREE.MeshBasicMaterial({color:data.color}));crown.position.set(0,h+(key==="future"?4:1),0);group.add(crown);
  city.add(group);
}
Object.entries(sections).forEach(([key,data])=>makeBuilding(key,data));

const blockColors=[0x0b1524,0x101c2d,0x091326];
for(let i=0;i<170;i++){
  let x=(Math.random()-.5)*155, z=(Math.random()-.5)*155;
  if(Math.abs(x)%18<7||Math.abs(z)%18<7) continue;
  let tooClose=false; for(const d of Object.values(sections)){const dx=x-d.position[0],dz=z-d.position[2];if(Math.sqrt(dx*dx+dz*dz)<18)tooClose=true} if(tooClose)continue;
  const h=4+Math.random()*24,w=3+Math.random()*7,d=3+Math.random()*7;
  const mat=new THREE.MeshStandardMaterial({color:blockColors[i%3],metalness:.72,roughness:.28,emissive:0x071329,emissiveIntensity:.25});
  const tower=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);tower.position.set(x,h/2,z);city.add(tower);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(tower.geometry),new THREE.LineBasicMaterial({color:i%5===0?0x3474a9:0x1b3a5b,transparent:true,opacity:.5}));edge.position.copy(tower.position);city.add(edge);
  if(h>12){for(let y=3;y<h;y+=3){const win=new THREE.Mesh(new THREE.PlaneGeometry(w*.65,.18),new THREE.MeshBasicMaterial({color:Math.random()>.75?0x67c4ff:0x315d82,transparent:true,opacity:.55}));win.position.set(x,y,z+d/2+.012);city.add(win)}}
}

const starGeometry=new THREE.BufferGeometry(),starPositions=[];
for(let i=0;i<900;i++)starPositions.push((Math.random()-.5)*460,20+Math.random()*180,(Math.random()-.5)*460);
starGeometry.setAttribute("position",new THREE.Float32BufferAttribute(starPositions,3));
scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x9fcfff,size:.18,transparent:true,opacity:.65})));

const traffic=[];
for(let i=0;i<70;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),new THREE.MeshBasicMaterial({color:i%3===0?0xff4d7d:0x70d2ff}));mesh.position.set((i%11-5)*18,.4,(Math.random()-.5)*150);mesh.userData.axis=i%2;mesh.userData.speed=.04+Math.random()*.12;city.add(mesh);traffic.push(mesh)}

function updatePointer(event){const rect=canvas.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1}
canvas.addEventListener("pointerdown",e=>{dragging=true;moved=false;startX=e.clientX;startY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{updatePointer(e);if(dragging){const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;targetYaw+=dx*.004;targetPitch=Math.max(-.12,Math.min(.68,targetPitch-dy*.003));startX=e.clientX;startY=e.clientY}});
canvas.addEventListener("pointerup",e=>{dragging=false;if(!moved&&entered){updatePointer(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,false)[0];if(hit)openSection(hit.object.userData.key)}});
canvas.addEventListener("wheel",e=>{if(!entered)return;const center=new THREE.Vector3(0,8,0),distance=camera.position.distanceTo(center);camera.position.normalize().multiplyScalar(Math.max(28,Math.min(125,distance+e.deltaY*.035)))},{passive:true});

function animate(){requestAnimationFrame(animate);const time=performance.now();yaw+=(targetYaw-yaw)*.055;pitch+=(targetPitch-pitch)*.055;
if(entered){const radius=88;camera.position.x=Math.sin(yaw)*radius*Math.cos(pitch);camera.position.z=Math.cos(yaw)*radius*Math.cos(pitch);camera.position.y=20+radius*Math.sin(pitch);camera.lookAt(0,10,0)}else{camera.position.x=58*Math.cos(time*.000055);camera.position.z=82*Math.cos(time*.000055);camera.lookAt(0,10,0)}
traffic.forEach((v,i)=>{if(v.userData.axis===0){v.position.x=((v.position.x+v.userData.speed+85)%170)-85}else{v.position.z=((v.position.z+v.userData.speed+85)%170)-85}});
city.children.forEach(o=>{if(o.type==="Group")o.children.forEach(c=>{if(c.geometry?.type==="TorusGeometry")c.rotation.z+=.004})});renderer.render(scene,camera)}
animate();

const content={
about:`<p class="kicker">01 — Central Nexus</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p><ul><li><b>Percorso</b><span>ITS Incom</span></li><li><b>Focus</b><span>Software & Cloud</span></li><li><b>Missione</b><span>Costruire il futuro</span></li></ul>`,
skills:`<p class="kicker">02 — Tech District</p><h2>Competenze</h2><p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b><span>Web</span></li><li><b>C++ / C#</b><span>Software</span></li><li><b>SQL / Database</b><span>Data</span></li><li><b>Cloud Computing</b><span>In progress</span></li><li><b>Cybersecurity</b><span>Foundation</span></li></ul>`,
projects:`<p class="kicker">03 — Project Harbor</p><h2>Lavori selezionati</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>Volontari</strong><span>Digital Platform</span></article><article class="project-card"><strong>Cloud Lab</strong><span>Future Project</span></article><article class="project-card"><strong>ITS Projects</strong><span>Development</span></article></div>`,
experience:`<p class="kicker">04 — Innovation Quarter</p><h2>Esperienza</h2><p>Esperienze formative sul campo, dalla scrittura del software alla comprensione di sistemi reali.</p><ul><li><b>Ronda Elettronica</b><span>Stage</span></li><li><b>C++</b><span>Sviluppo</span></li><li><b>C#</b><span>Applicazioni</span></li><li><b>Problem solving</b><span>Acquisito</span></li></ul>`,
life:`<p class="kicker">05 — Life District</p><h2>Oltre lo schermo</h2><p>Lo sport, la curiosità e le persone danno forma alla mia visione personale e professionale.</p><ul><li><b>Calcio</b><span>Sport</span></li><li><b>Tecnologia</b><span>Passione</span></li><li><b>Viaggi</b><span>Ambizione</span></li><li><b>Nuove culture</b><span>Interesse</span></li></ul>`,
future:`<p class="kicker">06 — Future Spire</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso ITS</div><div><b>Next</b><br>Entrata nel mondo Cloud</div><div><b>Future</b><br>Cloud Developer internazionale</div></div>`};

const panel=document.querySelector("#panel"),panelContent=document.querySelector("#panelContent"),sectorName=document.querySelector("#sector strong");
function openSection(key){panelContent.innerHTML=content[key];panel.classList.add("open");sectorName.textContent=sections[key].name;const position=sections[key].position;targetYaw=Math.atan2(position[0],position[2])}
document.querySelector("#close").addEventListener("click",()=>panel.classList.remove("open"));
document.querySelectorAll("[data-section]").forEach(button=>button.addEventListener("click",()=>openSection(button.dataset.section)));
document.querySelector("#enter").addEventListener("click",()=>{entered=true;document.querySelector("#boot").classList.add("hidden");document.querySelector(".topbar").classList.add("visible");document.querySelector(".sector").classList.add("visible");document.querySelector(".hint").classList.add("visible")});
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
