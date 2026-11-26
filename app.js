import * as THREE from "three";

const canvas=document.querySelector("#world");
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc78b68);scene.fog=new THREE.FogExp2(0xc58e70,.006);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,900);camera.position.set(52,32,82);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let entered=false,dragging=false,moved=false,startX=0,startY=0,yaw=.58,pitch=.22,targetYaw=yaw,targetPitch=pitch;
scene.add(new THREE.HemisphereLight(0xffc98c,0x2f5d69,2.15));
const sunset=new THREE.DirectionalLight(0xffd39a,4.2);sunset.position.set(-70,55,80);scene.add(sunset);
const pink=new THREE.PointLight(0xff9a78,220,170);pink.position.set(-25,18,-20);scene.add(pink);

const city=new THREE.Group();scene.add(city);

// Atlantic Ocean
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(330,150,45,20),new THREE.MeshPhysicalMaterial({color:0x397f91,metalness:.12,roughness:.22,transparent:true,opacity:.92,clearcoat:.8,clearcoatRoughness:.18}));ocean.position.set(-20,-.05,5);ocean.rotation.x=-Math.PI/2;scene.add(ocean);

// Miami shoreline and boulevard
const beach=new THREE.Mesh(new THREE.PlaneGeometry(90,260),new THREE.MeshStandardMaterial({color:0xd7bd94,roughness:.82}));beach.position.set(-28,.03,-30);beach.rotation.x=-Math.PI/2;scene.add(beach);
const shoreline=new THREE.Mesh(new THREE.PlaneGeometry(3,260),new THREE.MeshBasicMaterial({color:0xffe2b8,transparent:true,opacity:.78}));shoreline.position.set(17,.08,-30);shoreline.rotation.x=-Math.PI/2;scene.add(shoreline);
const road=new THREE.Mesh(new THREE.PlaneGeometry(38,270),new THREE.MeshStandardMaterial({color:0x26343a,roughness:.5,metalness:.08}));road.position.set(42,.04,-18);road.rotation.x=-Math.PI/2;scene.add(road);
const promenade=new THREE.Mesh(new THREE.PlaneGeometry(13,270),new THREE.MeshStandardMaterial({color:0xbba98e,roughness:.72}));promenade.position.set(18,.06,-18);promenade.rotation.x=-Math.PI/2;scene.add(promenade);
const laneLine=new THREE.LineBasicMaterial({color:0xffc27d,transparent:true,opacity:.62});
for(const x of [31,53]){const pts=[new THREE.Vector3(x,.09,-145),new THREE.Vector3(x,.09,115)];scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),laneLine))}

// Large low sun, as in the reference skyline
const sun=new THREE.Mesh(new THREE.SphereGeometry(13,32,32),new THREE.MeshBasicMaterial({color:0xffc187,transparent:true,opacity:.95}));sun.position.set(-82,27,-155);scene.add(sun);

const sections={
 about:{name:"Downtown",position:[28,0,-8],color:0xff8e72},
 skills:{name:"Art District",position:[52,0,-48],color:0x68bfc6},
 projects:{name:"South Pointe",position:[70,0,-95],color:0xffb18d},
 experience:{name:"Collins Avenue",position:[25,0,50],color:0x73bdb9},
 life:{name:"Lincoln Road",position:[66,0,55],color:0xffc078},
 future:{name:"Miami Marina",position:[35,0,-125],color:0x88bdd0}
};
const selectable=[];

function decoBuilding(key,data){
 const group=new THREE.Group();group.position.set(...data.position);
 const h=key=== "future"?38:key=== "about"?34:key=== "projects"?44:28;
 const w=key=== "projects"?18:14,d=9;
 const pastel=[0xe4aa90,0x78aeb0,0xd0a99e,0xe7c38c,0x91b3a8][Object.keys(sections).indexOf(key)%5];
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:pastel,metalness:.08,roughness:.48,emissive:data.color,emissiveIntensity:.025}));body.position.y=h/2;body.userData.section=key;group.add(body);selectable.push(body);
 const trim=new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),new THREE.LineBasicMaterial({color:data.color,transparent:true,opacity:.72}));trim.position.copy(body.position);group.add(trim);
 for(let y=4;y<h;y+=5){const stripe=new THREE.Mesh(new THREE.BoxGeometry(w+1,.16,d+1),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.40}));stripe.position.set(0,y,0);group.add(stripe)}
 for(let y=3;y<h;y+=4){for(let x=-w/2+2;x<w/2;x+=3){const win=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.5),new THREE.MeshBasicMaterial({color:0x4d7e8a,transparent:true,opacity:.68}));win.position.set(x,y,d/2+.01);group.add(win)}}
 const rail=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.09,.09),new THREE.MeshBasicMaterial({color:data.color}));rail.position.set(0,h+.5,d/2+.1);group.add(rail);
 city.add(group);
}
Object.entries(sections).forEach(([key,data])=>decoBuilding(key,data));

function palm(x,z,scale=1){const palmGroup=new THREE.Group();palmGroup.position.set(x,0,z);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.52,8*scale,8),new THREE.MeshStandardMaterial({color:0x92744c,roughness:.75}));trunk.position.y=4*scale;palmGroup.add(trunk);const leafMat=new THREE.MeshStandardMaterial({color:0x3d7658,roughness:.62,side:THREE.DoubleSide});for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.75*scale,5*scale,4),leafMat);leaf.position.set(Math.cos(i/9*Math.PI*2)*1.9*scale,8*scale,Math.sin(i/9*Math.PI*2)*1.9*scale);leaf.rotation.z=i/9*Math.PI*2;palmGroup.add(leaf)}city.add(palmGroup)}
for(let z=-128;z<118;z+=15){palm(19,z,1);if(z%30===-8)palm(62,z,.82)}

for(let i=0;i<95;i++){const x=20+Math.random()*135,z=-145+Math.random()*270;if(Math.abs(z)<145&&x>20&&x<95){let close=false;for(const d of Object.values(sections)){if(Math.hypot(x-d.position[0],z-d.position[2])<15)close=true}if(close)continue}const h=5+Math.random()*30,w=5+Math.random()*10,d=5+Math.random()*8;const colors=[0xdba58e,0x74aaa9,0xd4b9a4,0xcba18f,0x91b3a4];const mat=new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.58,metalness:.04});const building=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);building.position.set(x,h/2,z);city.add(building)}

const shimmer=[];for(let i=0;i<220;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.12+Math.random()*.8,.04),new THREE.MeshBasicMaterial({color:i%3===0?0xffbf92:0x91ddd3,transparent:true,opacity:.35+Math.random()*.45}));m.position.set(-115+Math.random()*250,.08,-70+Math.random()*150);m.rotation.x=-Math.PI/2;scene.add(m);shimmer.push(m)}
const traffic=[];for(let i=0;i<45;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(.7,.25,1.6),new THREE.MeshBasicMaterial({color:i%3===0?0xff916e:i%3===1?0x78cfd0:0xffc477}));c.position.set(i%2?[31,53][i%2]:31,.28,-145+Math.random()*260);traffic.push(c);scene.add(c)}

function updatePointer(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1}
canvas.addEventListener("pointerdown",e=>{dragging=true;moved=false;startX=e.clientX;startY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{updatePointer(e);if(dragging){const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;targetYaw+=dx*.004;targetPitch=Math.max(-.12,Math.min(.42,targetPitch-dy*.003))}});
canvas.addEventListener("pointerup",e=>{dragging=false;if(!moved&&entered){updatePointer(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,false)[0];if(hit)openSection(hit.object.userData.section)}});
canvas.addEventListener("wheel",e=>{if(!entered)return;const center=new THREE.Vector3(35,8,-10),distance=camera.position.distanceTo(center);camera.position.normalize().multiplyScalar(Math.max(28,Math.min(150,distance+e.deltaY*.08)))},{passive:true});

function animate(){requestAnimationFrame(animate);const time=performance.now();yaw+=(targetYaw-yaw)*.055;pitch+=(targetPitch-pitch)*.055;if(entered){const radius=88;camera.position.x=35+Math.sin(yaw)*radius*Math.cos(pitch);camera.position.z=-10+Math.cos(yaw)*radius*Math.cos(pitch);camera.position.y=25+Math.sin(pitch)*radius;camera.lookAt(35,10,-10)}else{camera.position.x=52+Math.sin(time*.00008)*5;camera.lookAt(35,10,-20)}for(let i=0;i<traffic.length;i++)traffic[i].position.z+=i%2?.09:-.09;if(traffic[i].position.z>115)traffic[i].position.z=-145;if(traffic[i].position.z<-145)traffic[i].position.z=115;for(let i=0;i<shimmer.length;i+=2){shimmer[i].position.x+=.018;if(shimmer[i].position.x>145)shimmer[i].position.x=-115}renderer.render(scene,camera)}animate();

const content={about:`<p class="kicker">01 — Downtown</p><h2>Chi sono</h2><p>Mi chiamo Mattero. Studio tecnologia, sviluppo e architetture digitali, con lo sguardo rivolto al futuro del cloud computing.</p><p>Mi muovo tra software, infrastruttura e design di esperienze digitali.</p>`,skills:`<p class="kicker">02 — Art District</p><h2>Competenze</h2><p>Un laboratorio in continuo aggiornamento tra sviluppo software, dati e infrastrutture.</p><ul><li><b>HTML / CSS / JavaScript</b>Interfacce responsive e interattive</li><li><b>Cloud & DevOps</b>Virtualizzazione, rete e automazione</li><li><b>Python</b>Scripting e soluzioni applicative</li></ul>`,projects:`<p class="kicker">03 — South Pointe</p><h2>Lavori selezionati</h2><div class="project-grid"><article class="project-card"><strong>Zekrom</strong><span>Virtual Assistant</span></article><article class="project-card"><strong>ReclAIM</strong><span>AI Platform</span></article><article class="project-card"><strong>Portfolio</strong><span>Digital Experience</span></article><article class="project-card"><strong>Lab</strong><span>Cloud Project</span></article></div>`,experience:`<p class="kicker">04 — Collins Avenue</p><h2>Esperienza</h2><p>Esperienze formative sul campo, dalla scrittura del software alla comprensione di sistemi reali.</p><ul><li><b>Ronda Elance</b>Frontend, UI e sviluppo applicativo</li><li><b>Project Work</b>Progetti tecnici multidisciplinari</li><li><b>Laboratori Cloud</b>Infrastrutture e ambienti virtuali</li></ul>`,life:`<p class="kicker">05 — Lincoln Road</p><h2>Oltre lo schermo</h2><p>Lo sport, la curiosità e le persone danno forma alla mia visione personale e professionale.</p><ul><li><b>Calcio</b>Teamwork e disciplina</li><li><b>Trekking</b>Esplorazione e prospettiva</li><li><b>Technology</b>Ricerca continua</li></ul>`,future:`<p class="kicker">06 — Miami Marina</p><h2>Prossima destinazione</h2><p>La strada verso una carriera internazionale nel cloud.</p><div class="timeline"><div><b>2026</b><br>Completo il percorso formativo</div><div><b>2027</b><br>Certificazioni cloud</div><div><b>Beyond</b><br>Esperienza globale e infrastrutture scalabili</div></div>`};

const boot=document.querySelector("#boot"),panel=document.querySelector("#panel"),panelContent=document.querySelector("#panelContent"),sectorName=document.querySelector("#sector strong");
function openSection(key){panelContent.innerHTML=content[key];panel.classList.add("open");sectorName.textContent=sections[key].name;const p=sections[key].position;targetYaw=Math.atan2(p[0]-35,p[2]+10)}
document.querySelector("#enter").addEventListener("click",()=>{entered=true;boot.classList.add("entered");document.querySelector(".topbar").classList.add("visible");document.querySelector("#sector").classList.add("visible");document.querySelector("#hint").classList.add("visible")});
document.querySelector("#close").addEventListener("click",()=>panel.classList.remove("open"));
document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>openSection(b.dataset.section)));
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
