import * as THREE from "three";

const canvas=document.querySelector("#world");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xf0ae88);
scene.fog=new THREE.FogExp2(0xb6a5a1,.0018);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,1400);
camera.position.set(66,48,145);

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;

scene.add(new THREE.HemisphereLight(0xffcf9e,0x58705c,2.25));
const sunLight=new THREE.DirectionalLight(0xffd1a0,3.7);sunLight.position.set(-95,120,150);sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.camera.left=-220;sunLight.shadow.camera.right=220;sunLight.shadow.camera.top=220;sunLight.shadow.camera.bottom=-220;
scene.add(sunLight);

const city=new THREE.Group();scene.add(city);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let entered=false,dragging=false,moved=false,startX=0,startY=0,yaw=.72,pitch=.19,targetYaw=yaw,targetPitch=pitch;
const selectable=[];

// Photographic-style sunset backdrop.
const skyCanvas=document.createElement("canvas");skyCanvas.width=1024;skyCanvas.height=512;
const ctx=skyCanvas.getContext("2d");
const gradient=ctx.createLinearGradient(0,0,0,512);
gradient.addColorStop(0,"#4f477c");gradient.addColorStop(.22,"#b76e94");gradient.addColorStop(.48,"#ef8a72");gradient.addColorStop(.68,"#ffd08a");gradient.addColorStop(.82,"#b9b0a1");gradient.addColorStop(1,"#798f83");
ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
for(let i=0;i<90;i++){
 const x=Math.random()*1024,y=35+Math.random()*310,w=50+Math.random()*240,h=5+Math.random()*18;
 ctx.save();ctx.translate(x,y);ctx.rotate(-.12+Math.random()*.24);
 ctx.fillStyle=i%4===0?"rgba(255,224,183,.30)":"rgba(255,152,140,.22)";
 ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();
}
const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.mapping=THREE.EquirectangularReflectionMapping;skyTexture.colorSpace=THREE.SRGBColorSpace;
scene.background=skyTexture;

function plane(width,height,color,x,z,rough=.9){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.02}));m.rotation.x=-Math.PI/2;m.position.set(x,.02,z);m.receiveShadow=true;scene.add(m);return m;
}
plane(520,520,0x7d8253,0,-30,.95);

// Roads form a visible block network and buildings are always placed inside blocks.
const roadMaterial=new THREE.MeshStandardMaterial({color:0x454a48,roughness:.86});
function roadWidth(z,width=8){const r=new THREE.Mesh(new THREE.PlaneGeometry(400,width),roadMaterial);r.rotation.x=-Math.PI/2;r.position.set(0,.05,z);r.receiveShadow=true;scene.add(r);}
for(const z of [-130,-82,-34,14,62,110])roadWidth(z,9);
for(const x of [-145,-95,-45,5,55,105,155]){const r=new THREE.Mesh(new THREE.PlaneGeometry(9,310),roadMaterial);r.rotation.x=-Math.PI/2;r.position.set(x,.06,-15);r.receiveShadow=true;scene.add(r);}

// River and curved water feature.
const waterMat=new THREE.MeshPhysicalMaterial({color:0x5d918e,roughness:.16,metalness:.12,transparent:true,opacity:.82,clearcoat:1});
const river=new THREE.Mesh(new THREE.ShapeGeometry(makeRiverShape()),waterMat);river.rotation.x=-Math.PI/2;river.position.set(0,.09,-8);river.receiveShadow=true;scene.add(river);
function makeRiverShape(){const s=new THREE.Shape();s.moveTo(-28,-145);s.lineTo(-13,-145);s.bezierCurveTo(-35,-85,-8,-35,-22,14);s.bezierCurveTo(-34,54,-12,88,-25,145);s.lineTo(-42,145);s.bezierCurveTo(-32,92,-50,55,-38,14);s.bezierCurveTo(-24,-38,-55,-84,-28,-145);return s}

// Distinctly urban towers and apartments: material, podium, crown and window grid.
const windowMat=new THREE.MeshStandardMaterial({color:0x587782,roughness:.18,metalness:.58});
const litWindow=new THREE.MeshStandardMaterial({color:0xe3bc8a,roughness:.32,metalness:.12,emissive:0x7a4c24,emissiveIntensity:.08});
const concrete=[0xb9a792,0xd0c0a7,0xa99b87,0xcabda6].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.78}));
const glass=[0x607f86,0x718b8d,0x526e7b,0x87999a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.22,metalness:.48}));

function seeded(seed){let v=seed>>>0;return()=>((v=(v*1664525+1013904223)>>>0)/4294967296)}
function building({x,z,w=12,d=9,h=30,seed=1,section=null,iconic=false}){
 const rnd=seeded(seed);const group=new THREE.Group();group.position.set(x,0,z);
 const baseH=Math.min(6,h*.16);
 const podium=new THREE.Mesh(new THREE.BoxGeometry(w+3,baseH,d+3),concrete[Math.floor(rnd()*concrete.length)]);podium.position.y=baseH/2;podium.castShadow=true;podium.receiveShadow=true;group.add(podium);
 const bw=w*(iconic?.82:.92),bd=d*(iconic?.86:.94),bh=h-baseH;
 const body=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),glass[Math.floor(rnd()*glass.length)]);body.position.y=baseH+bh/2;body.castShadow=true;body.receiveShadow=true;if(section){body.userData.section=section;selectable.push(body)}group.add(body);

 // Window bands on front and side faces.
 const floors=Math.max(4,Math.floor(bh/3));
 const cols=Math.max(3,Math.floor(bw/2));
 const paneGeo=new THREE.BoxGeometry(.9,1.55,.08);
 for(let face=0;face<2;face++){
  for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
   const mat=rnd()>.72?litWindow:windowMat;
   const pane=new THREE.Mesh(paneGeo,mat);
   if(face===0){pane.position.set(-bw/2+(c+.5)*bw/cols,baseH+2.1+f*(bh-2)/floors,bd/2+.05);pane.scale.x=.72}
   else{pane.position.set(bw/2+.05,baseH+2.1+f*(bh-2)/floors,-bd/2+(c+.5)*bd/cols);pane.rotation.y=Math.PI/2;pane.scale.x=.72}
   group.add(pane);
  }
 }
 // Horizontal floor slabs and mullions.
 const slabMat=new THREE.MeshStandardMaterial({color:0xb5aa99,roughness:.48,metalness:.18});
 for(let f=2;f<bh;f+=4){const slab=new THREE.Mesh(new THREE.BoxGeometry(bw+.25,.10,bd+.25),slabMat);slab.position.y=baseH+f;slab.castShadow=true;group.add(slab)}
 // Roof cap and mechanical penthouse.
 const cap=new THREE.Mesh(new THREE.BoxGeometry(bw*.72,1.5,bd*.72),concrete[2]);cap.position.y=h+.75;cap.castShadow=true;group.add(cap);
 const plant=new THREE.Mesh(new THREE.BoxGeometry(bw*.34,2,bd*.42),concrete[1]);plant.position.set(-bw*.14,h+2.2,0);plant.castShadow=true;group.add(plant);
 if(iconic){const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.07,.12,7,8),concrete[2]);antenna.position.set(bw*.25,h+6,0);antenna.castShadow=true;group.add(antenna)}
 city.add(group);return group;
}

const sections={about:{name:"Downtown",position:[-20,-35],color:0xff9874},skills:{name:"Arts District",position:[35,-72],color:0x8ec5c1},projects:{name:"South Pointe",position:[82,-115],color:0xf9b28b},experience:{name:"Collins Avenue",position:[-65,18],color:0x82baa9},life:{name:"Lincoln Road",position:[85,55],color:0xb9b27a},future:{name:"Miami Marina",position:[12,-150],color:0x91bdcb}};

// Skyline is restricted to blocks away from roads and distributed around the centre.
const heights=[55,62,78,48,58,68];let s=0;
Object.entries(sections).forEach(([key,d],i)=>building({x:d.position[0],z:d.position[1],w:key==="projects"?18:14,d:12,h:heights[i],seed:500+i*81,section:key,iconic:i<4}));
for(let i=0;i<105;i++){
 const bx=[-125,-75,-25,25,75,125][i%6]+(Math.random()*12-6);
 const bz=[-155,-105,-55,-5,45,95][Math.floor(i/6)%6]+(Math.random()*10-5);
 if(Math.abs(bx)<52&&Math.abs(bz)<25)continue;
 if(Object.values(sections).some(d=>Math.hypot(bx-d.position[0],bz-d.position[1])<22))continue;
 building({x:bx,z:bz,w:7+Math.random()*9,d:7+Math.random()*8,h:12+Math.random()*38,seed:900+i*29,iconic:i%19===0});
}

// Dense palm and park planting between residential blocks.
function palm(x,z,scale=1){const g=new THREE.Group();g.position.set(x,0,z);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25*scale,.48*scale,7*scale,8),new THREE.MeshStandardMaterial({color:0x92754c,roughness:.86}));trunk.position.y=3.5*scale;g.add(trunk);const leafMat=new THREE.MeshStandardMaterial({color:0x3f754a,roughness:.78,side:THREE.DoubleSide});for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.75*scale,5*scale,5),leafMat);leaf.position.set(Math.cos(i/9*Math.PI*2)*1.8*scale,7*scale,Math.sin(i/9*Math.PI*2)*1.8*scale);leaf.rotation.z=i/9*Math.PI*2;g.add(leaf)}city.add(g)}
for(let i=0;i<160;i++){const x=-170+Math.random()*340,z=-155+Math.random()*300;if(Math.abs(x)<6||Math.abs(z%48)<8)continue;palm(x,z,.45+Math.random()*.8)}

// Houses in the lower foreground, with pitched roofs and yards.
const houseColors=[0xd2c4ab,0xe1d3b9,0xbcc6ad,0xd1b49b].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.9}));
for(let i=0;i<90;i++){const side=i%2?-1:1;const x=side*(20+Math.random()*145),z=-150+Math.random()*300;if(Object.values(sections).some(d=>Math.hypot(x-d.position[0],z-d.position[1])<18))continue;const w=5+Math.random()*7,d=5+Math.random()*7,h=3+Math.random()*3;const g=new THREE.Group();g.position.set(x,0,z);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),houseColors[i%houseColors.length]);m.position.y=h/2;m.castShadow=true;m.receiveShadow=true;g.add(m);const roof=new THREE.Mesh(new THREE.ConeGeometry(w*.72,2.2,4),new THREE.MeshStandardMaterial({color:0x956a57,roughness:.88}));roof.position.y=h+1.1;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);city.add(g)}

const traffic=[];
for(let i=0;i<42;i++){const lane=i%2?7:-7;const z=-145+Math.random()*290;const car=new THREE.Mesh(new THREE.BoxGeometry(1.2,.32,2.2),new THREE.MeshStandardMaterial({color:[0xd6c5aa,0x6f8987,0x9a5e50][i%3],metalness:.22,roughness:.4}));car.position.set(lane,.28,z);car.castShadow=true;traffic.push(car);scene.add(car)}

canvas.addEventListener("pointerdown",e=>{dragging=true;moved=false;startX=e.clientX;startY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;if(dragging){const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;targetYaw+=dx*.004;targetPitch=Math.max(-.12,Math.min(.42,targetPitch-dy*.003));startX=e.clientX;startY=e.clientY}});
canvas.addEventListener("pointerup",e=>{dragging=false;if(!moved&&entered){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,false)[0];if(hit)openSection(hit.object.userData.section)}});

const content={about:`<p class="kicker">01 — Downtown</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p>`,skills:`<p class="kicker">02 — Arts District</p><h2>Competenze</h2><p>Sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b>Interfacce responsive e interattive</li><li><b>Cloud &amp; DevOps</b>Virtualizzazione, rete e automazione</li><li><b>Python</b>Scripting e soluzioni applicative</li></ul>`,projects:`<p class="kicker">03 — South Pointe</p><h2>Progetti</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>ReclAIM</strong><span>AI Platform</span></article><article class="project-card"><strong>Portfolio</strong><span>Digital Experience</span></article><article class="project-card"><strong>Lab</strong><span>Cloud Project</span></article></div>`,experience:`<p class="kicker">04 — Collins Avenue</p><h2>Esperienza</h2><p>Esperienze formative nella scrittura del software e nella comprensione di sistemi reali.</p>`,life:`<p class="kicker">05 — Lincoln Road</p><h2>Oltre lo schermo</h2><p>Sport, curiosità e persone danno forma alla mia visione personale e professionale.</p>`,future:`<p class="kicker">06 — Miami Marina</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso formativo</div><div><b>2027</b><br>Certificazioni cloud</div><div><b>Beyond</b><br>Esperienza globale e infrastrutture scalabili</div></div>`};
const panel=document.querySelector("#panel"),panelContent=document.querySelector("#panelContent"),sectorName=document.querySelector("#sector strong");
function openSection(key){if(!content[key])return;panelContent.innerHTML=content[key];panel.classList.add("open");sectorName.textContent=sections[key].name;const p=sections[key].position;targetYaw=Math.atan2(p[0]-35,p[1]+30)}
document.querySelector("#enter").addEventListener("click",()=>{entered=true;document.querySelector("#boot").classList.add("entered");document.querySelector(".topbar").classList.add("visible");document.querySelector("#sector").classList.add("visible");document.querySelector("#hint").classList.add("visible")});
document.querySelector("#close").addEventListener("click",()=>panel.classList.remove("open"));document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>openSection(b.dataset.section)));

function animate(){requestAnimationFrame(animate);yaw+=(targetYaw-yaw)*.055;pitch+=(targetPitch-pitch)*.055;if(entered){const r=105;camera.position.set(35+Math.sin(yaw)*r*Math.cos(pitch),28+Math.sin(pitch)*r,-25+Math.cos(yaw)*r*Math.cos(pitch));camera.lookAt(35,12,-25)}else{camera.position.set(66+Math.sin(performance.now()*.00008)*4,48,145);camera.lookAt(35,11,-25)}for(let i=0;i<traffic.length;i++){traffic[i].position.z+=i%2?.06:-.06;if(traffic[i].position.z>145)traffic[i].position.z=-145;if(traffic[i].position.z<-145)traffic[i].position.z=145}renderer.render(scene,camera)}animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8))});
