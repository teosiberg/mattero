import * as THREE from "three";

const canvas=document.querySelector("#world");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x071827);scene.fog=new THREE.FogExp2(0x071827,.0075);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,900);camera.position.set(52,32,82);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let entered=false,dragging=false,moved=false,startX=0,startY=0,yaw=.58,pitch=.22,targetYaw=yaw,targetPitch=pitch;
scene.add(new THREE.HemisphereLight(0x8ed7ff,0x234f64,1.7));
const sunset=new THREE.DirectionalLight(0xffa6c6,3.4);sunset.position.set(-70,45,80);scene.add(sunset);
const pink=new THREE.PointLight(0xff58b6,260,170);pink.position.set(-25,18,-20);scene.add(pink);

const city=new THREE.Group();scene.add(city);

// Atlantic Ocean
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(330,150,45,20),new THREE.MeshPhysicalMaterial({color:0x087f9a,metalness:.15,roughness:.18,transparent:true,opacity:.92,clearcoat:1,clearcoatRoughness:.12}));ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-.35,-92);scene.add(ocean);

// Miami Beach sands
const beach=new THREE.Mesh(new THREE.PlaneGeometry(90,260),new THREE.MeshStandardMaterial({color:0xd8c69e,roughness:.75,metalness:.05}));beach.position.set(-28,.03,-30);beach.rotation.x=-Math.PI/2;scene.add(beach);
const shoreline=new THREE.Mesh(new THREE.PlaneGeometry(3,260),new THREE.MeshBasicMaterial({color:0xdaf8ef,transparent:true,opacity:.78}));shoreline.position.set(17,.08,-30);shoreline.rotation.x=-Math.PI/2;scene.add(shoreline);

// Ocean Drive asphalt and Art Deco boulevard
const road=new THREE.Mesh(new THREE.PlaneGeometry(38,270),new THREE.MeshStandardMaterial({color:0x26313a,roughness:.45,metalness:.12}));road.position.set(42,.04,-18);road.rotation.x=-Math.PI/2;scene.add(road);
const promenade=new THREE.Mesh(new THREE.PlaneGeometry(13,270),new THREE.MeshStandardMaterial({color:0xb9ad91,roughness:.72}));promenade.position.set(18,.06,-18);promenade.rotation.x=-Math.PI/2;scene.add(promenade);
const laneLine=new THREE.LineBasicMaterial({color:0xffb09a,transparent:true,opacity:.7});
for(const x of [31,53]){const pts=[new THREE.Vector3(x,.09,-145),new THREE.Vector3(x,.09,115)];const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),laneLine);scene.add(line)}

// Pink Miami sun
const sun=new THREE.Mesh(new THREE.SphereGeometry(16,32,32),new THREE.MeshBasicMaterial({color:0xffb08b,transparent:true,opacity:.85}));sun.position.set(-80,31,-160);scene.add(sun);

const sections={
about:{name:"Ocean Drive",position:[28,0,-8],color:0xff73ba},
skills:{name:"Art District",position:[52,0,-48],color:0x68d8ff},
projects:{name:"South Pointe",position:[70,0,-95],color:0xffa4ce},
experience:{name:"Collins Avenue",position:[25,0,50],color:0x73ead8},
life:{name:"Lincoln Road",position:[66,0,55],color:0xffb174},
future:{name:"Miami Marina",position:[35,0,-125],color:0x88c8ff}
};
const selectable=[];

function decoBuilding(key,data){
 const group=new THREE.Group();group.position.set(...data.position);
 const h=key=== "future"?34:key=== "about"?30:key=== "projects"?38:24;
 const w=key=== "projects"?16:12,d=8;
 const pastel=[0xf0b6a8,0x7fc9c7,0xd7b4ca,0xf2d49a,0x8fc8bc][Object.keys(sections).indexOf(key)%5];
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:pastel,metalness:.08,roughness:.5,emissive:data.color,emissiveIntensity:.025}));body.position.y=h/2;body.userData.key=key;group.add(body);selectable.push(body);
 const trim=new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),new THREE.LineBasicMaterial({color:data.color,transparent:true,opacity:.82}));trim.position.copy(body.position);group.add(trim);
 // Streamline Moderne horizontal fins
 for(let y=4;y<h;y+=5){const stripe=new THREE.Mesh(new THREE.BoxGeometry(w+1,.18,d+1),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.48}));stripe.position.set(0,y,0);group.add(stripe)}
 // Rounded-style windows
 for(let y=3;y<h;y+=4){for(let x=-w/2+2;x<w/2;x+=3){const win=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.7),new THREE.MeshBasicMaterial({color:0x81d8df,transparent:true,opacity:.78}));win.position.set(x,y,d/2+.012);group.add(win)}}
 // Neon rooftop sign rail
 const rail=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.09,.09),new THREE.MeshBasicMaterial({color:data.color}));rail.position.set(0,h+.5,d/2+.1);group.add(rail);
 city.add(group);
}
Object.entries(sections).forEach(([key,data])=>decoBuilding(key,data));

// Palm-lined Ocean Drive
function palm(x,z,scale=1){
 const palmGroup=new THREE.Group();palmGroup.position.set(x,0,z);
 const trunkMat=new THREE.MeshStandardMaterial({color:0x9a754a,roughness:.75});
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.52,8*scale,8),trunkMat);trunk.position.y=4*scale;palmGroup.add(trunk);
 const leafMat=new THREE.MeshStandardMaterial({color:0x2d7e63,roughness:.62,side:THREE.DoubleSide});
 for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.75*scale,5*scale,4),leafMat);leaf.position.y=8*scale;leaf.position.x=Math.cos(i/9*Math.PI*2)*1.9*scale;leaf.position.z=Math.sin(i/9*Math.PI*2)*1.9*scale;leaf.rotation.z=Math.PI/2.8;leaf.rotation.y=i/9*Math.PI*2;palmGroup.add(leaf)}
 city.add(palmGroup);
}
for(let z=-128;z<118;z+=15){palm(19,z,1);if(z%30===-8)palm(62,z,.82)}

// Surrounding pastel Miami hotel skyline
for(let i=0;i<95;i++){const x=20+Math.random()*135,z=-145+Math.random()*270;if(Math.abs(z)<145&&x>20&&x<95){let close=false;for(const d of Object.values(sections)){if(Math.hypot(x-d.position[0],z-d.position[2])<15)close=true}if(close)continue}
 const h=5+Math.random()*28,w=5+Math.random()*10,d=5+Math.random()*8;const colors=[0xe8b8ad,0x91cbc7,0xe1c9b3,0xdda4bf,0xb4d6ca];const mat=new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.48,metalness:.05,emissive:0x172033,emissiveIntensity:.05});const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);b.position.set(x,h/2,z);city.add(b);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry),new THREE.LineBasicMaterial({color:i%4===0?0xff85bd:0x73c4bc,transparent:true,opacity:.38}));edge.position.copy(b.position);city.add(edge)
}

// Ocean reflections and moving traffic
const shimmer=[];for(let i=0;i<220;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.12+Math.random()*.8,.04),new THREE.MeshBasicMaterial({color:i%3===0?0xffc7aa:0x91fff1,transparent:true,opacity:.5}));m.rotation.x=-Math.PI/2;m.position.set((Math.random()-.5)*300,.02,-10-Math.random()*145);scene.add(m);shimmer.push(m)}
const traffic=[];for(let i=0;i<45;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(.7,.25,1.6),new THREE.MeshBasicMaterial({color:i%3===0?0xff74b7:i%3===1?0x67e3d5:0xffcc75}));c.position.set(i%2===0?31:53,.22,-130+Math.random()*250);c.userData.dir=i%2===0?1:-1;c.userData.speed=.08+Math.random()*.13;city.add(c);traffic.push(c)}

function updatePointer(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1}
canvas.addEventListener("pointerdown",e=>{dragging=true;moved=false;startX=e.clientX;startY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{updatePointer(e);if(dragging){const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;targetYaw+=dx*.004;targetPitch=Math.max(-.12,Math.min(.68,targetPitch-dy*.003));startX=e.clientX;startY=e.clientY}});
canvas.addEventListener("pointerup",e=>{dragging=false;if(!moved&&entered){updatePointer(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,false)[0];if(hit)openSection(hit.object.userData.key)}});
canvas.addEventListener("wheel",e=>{if(!entered)return;const center=new THREE.Vector3(35,8,-10),distance=camera.position.distanceTo(center);camera.position.normalize().multiplyScalar(Math.max(28,Math.min(130,distance+e.deltaY*.035)))},{passive:true});

function animate(){requestAnimationFrame(animate);const time=performance.now();yaw+=(targetYaw-yaw)*.055;pitch+=(targetPitch-pitch)*.055;if(entered){const radius=88;camera.position.x=35+Math.sin(yaw)*radius*Math.cos(pitch);camera.position.z=-10+Math.cos(yaw)*radius*Math.cos(pitch);camera.position.y=20+radius*Math.sin(pitch);camera.lookAt(35,10,-10)}else{camera.position.x=52*Math.cos(time*.000055);camera.position.z=82*Math.cos(time*.000055);camera.lookAt(30,10,-20)}traffic.forEach(v=>{v.position.z+=v.userData.dir*v.userData.speed;if(v.position.z>125)v.position.z=-130;if(v.position.z<-130)v.position.z=125});shimmer.forEach((v,i)=>{v.material.opacity=.38+Math.sin(time*.0015+i)*.18});renderer.render(scene,camera)}animate();

const content={
about:`<p class="kicker">01 — Ocean Drive</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p><ul><li><b>Percorso</b><span>ITS Incom</span></li><li><b>Focus</b><span>Software & Cloud</span></li><li><b>Missione</b><span>Costruire il futuro</span></li></ul>`,
skills:`<p class="kicker">02 — Art District</p><h2>Competenze</h2><p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b><span>Web</span></li><li><b>C++ / C#</b><span>Software</span></li><li><b>SQL / Database</b><span>Data</span></li><li><b>Cloud Computing</b><span>In progress</span></li><li><b>Cybersecurity</b><span>Foundation</span></li></ul>`,
projects:`<p class="kicker">03 — South Pointe</p><h2>Lavori selezionati</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>Volontari</strong><span>Digital Platform</span></article><article class="project-card"><strong>Cloud Lab</strong><span>Future Project</span></article><article class="project-card"><strong>ITS Projects</strong><span>Development</span></article></div>`,
experience:`<p class="kicker">04 — Collins Avenue</p><h2>Esperienza</h2><p>Esperienze formative sul campo, dalla scrittura del software alla comprensione di sistemi reali.</p><ul><li><b>Ronda Elettronica</b><span>Stage</span></li><li><b>C++</b><span>Sviluppo</span></li><li><b>C#</b><span>Applicazioni</span></li><li><b>Problem solving</b><span>Acquisito</span></li></ul>`,
life:`<p class="kicker">05 — Lincoln Road</p><h2>Oltre lo schermo</h2><p>Lo sport, la curiosità e le persone danno forma alla mia visione personale e professionale.</p><ul><li><b>Calcio</b><span>Sport</span></li><li><b>Tecnologia</b><span>Passione</span></li><li><b>Viaggi</b><span>Ambizione</span></li><li><b>Nuove culture</b><span>Interesse</span></li></ul>`,
future:`<p class="kicker">06 — Miami Marina</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso ITS</div><div><b>Next</b><br>Entrata nel mondo Cloud</div><div><b>Future</b><br>Cloud Developer internazionale</div></div>`};

const panel=document.querySelector("#panel"),panelContent=document.querySelector("#panelContent"),sectorName=document.querySelector("#sector strong");
function openSection(key){panelContent.innerHTML=content[key];panel.classList.add("open");sectorName.textContent=sections[key].name;const p=sections[key].position;targetYaw=Math.atan2(p[0]-35,p[2]+10)}
document.querySelector("#close").addEventListener("click",()=>panel.classList.remove("open"));document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>openSection(b.dataset.section)));document.querySelector("#enter").addEventListener("click",()=>{entered=true;document.querySelector("#boot").classList.add("hidden");document.querySelector(".topbar").classList.add("visible");document.querySelector(".sector").classList.add("visible");document.querySelector(".hint").classList.add("visible")});window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
