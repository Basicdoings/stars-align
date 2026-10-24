import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { Engine } from '@babylonjs/core/Engines/engine.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder.js';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.js';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder.js';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder.js';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.js';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Scene } from '@babylonjs/core/scene.js';

const playerPalette = {
  Bluezi: ['#7657e8','#7d5742','#17101d'], Boyd: ['#df5e69','#9a6b4a','#202020'], 'South Boy': ['#e5a43b','#654532','#101318'],
  Pluto: ['#3889ca','#8b5e46','#241526'], Government: ['#4daa77','#604032','#15120f'], Dino: ['#b35ac5','#986c51','#211318'],
  'On D': ['#e6753f','#704b38','#171319'], Edna: ['#dc5a9c','#8d5e47','#261322']
};
const npcPalette = [
  ['#f05ea8','#895c43','#251623'], ['#41c9c5','#754b37','#161421'], ['#f2b34d','#7d523c','#211711'],
  ['#6b91e8','#5e4031','#151a25'], ['#7acb72','#9a6b4c','#1b1715'], ['#d77be8','#674536','#291529']
];
const themes = {
  arrival: ['#11182b','#f0b85c','#070b18'], district: ['#182239','#ed9d4f','#080b1d'], lounge: ['#2b1c36','#c973dc','#110d20'],
  club: ['#201535','#ff557f','#090718'], gate: ['#17203c','#7c79ff','#080b20'], bridge: ['#14263c','#52a5cb','#06101e']
};
let active = null;

const hex = value => Color3.FromHexString(value);
function makeMaterial(scene, name, color, {emissive=false, alpha=1}={}) {
  const mat = new StandardMaterial(name, scene); mat.diffuseColor = hex(color); mat.specularColor = new Color3(.08,.08,.12); mat.alpha = alpha;
  if (emissive) mat.emissiveColor = hex(color).scale(.7); return mat;
}
function addBox(scene, name, options, position, mat, parent=null) {
  const mesh=CreateBox(name,options,scene);mesh.position.copyFrom(position);mesh.material=mat;mesh.isPickable=false;if(parent)mesh.parent=parent;return mesh;
}
function addCylinder(scene,name,options,position,mat,parent=null){const mesh=CreateCylinder(name,options,scene);mesh.position.copyFrom(position);mesh.material=mat;mesh.isPickable=false;if(parent)mesh.parent=parent;return mesh;}
function ellipsoid(scene,name,position,scale,mat,parent){const mesh=CreateSphere(name,{diameter:1,segments:8},scene);mesh.position.copyFrom(position);mesh.scaling.copyFrom(scale);mesh.material=mat;mesh.parent=parent;mesh.isPickable=false;return mesh;}
function toWorld(position){return new Vector3((position.x-50)*.24,0,(position.y-62)*.18)}
function toNormalized(point){return{x:Math.max(8,Math.min(92,point.x/.24+50)),y:Math.max(36,Math.min(88,point.z/.18+62))}}

function building(scene,x,z,width,height,depth,color,accent,index){
  addBox(scene,`building-${index}`,{width,height,depth},new Vector3(x,height/2,z),makeMaterial(scene,`building-mat-${index}`,color));
  const trim=makeMaterial(scene,`trim-${index}`,'#a49a8a');
  const glass=makeMaterial(scene,`glass-${index}`,'#ffd8a0',{emissive:true});
  for(let floor=0;floor<Math.floor(height/1.4);floor++)for(const offset of [-.27,.27]){
    addBox(scene,`window-${index}-${floor}-${offset}`,{width:width*.19,height:.64,depth:.04},new Vector3(x+width*offset,1+floor*1.4,z-depth/2-.025),glass);
  }
  addBox(scene,`roof-trim-${index}`,{width:width+.15,height:.16,depth:depth+.15},new Vector3(x,height,z),trim);
  addBox(scene,`door-${index}`,{width:.7,height:1.8,depth:.06},new Vector3(x,.9,z-depth/2-.04),makeMaterial(scene,`door-mat-${index}`,'#182328'));
  const sign=addBox(scene,`sign-${index}`,{width:width*.62,height:.42,depth:.12},new Vector3(x,Math.min(height-.5,2.25),z-depth/2-.08),makeMaterial(scene,`sign-mat-${index}`,accent,{emissive:true}));
  return sign.material;
}
function streetLamp(scene,x,z,index,accent){
  addCylinder(scene,`lamp-post-${index}`,{diameter:.1,height:3},new Vector3(x,1.5,z),makeMaterial(scene,`lamp-post-mat-${index}`,'#31384b'));
  addCylinder(scene,`lamp-${index}`,{diameter:.32,height:.22},new Vector3(x,3,z),makeMaterial(scene,`lamp-mat-${index}`,accent,{emissive:true}));
}
function marketStall(scene,x,z,index,color){
  const wood=makeMaterial(scene,`stall-wood-${index}`,'#60422e');const cloth=makeMaterial(scene,`stall-cloth-${index}`,color);
  addBox(scene,`stall-counter-${index}`,{width:2.25,height:.8,depth:1.1},new Vector3(x,.4,z),wood);
  addBox(scene,`stall-roof-${index}`,{width:2.65,height:.14,depth:1.55},new Vector3(x,2.05,z),cloth);
  for(const dx of [-1,1])addCylinder(scene,`stall-pole-${index}-${dx}`,{diameter:.08,height:2},new Vector3(x+dx,1,z),wood);
}
function vehicle(scene,index,color,z,type='car'){
  const root=new TransformNode(`${type}-${index}`,scene);const mat=makeMaterial(scene,`${type}-mat-${index}`,color);
  addBox(scene,`${type}-body-${index}`,{width:type==='bus'?3.7:2.2,height:type==='bus'?1.45:.65,depth:type==='bus'?1.25:1.05},new Vector3(0,type==='bus'?.82:.45,0),mat,root);
  addBox(scene,`${type}-roof-${index}`,{width:type==='bus'?3.3:1.25,height:.38,depth:.9},new Vector3(type==='bus'?0:-.2,type==='bus'?1.55:.91,0),makeMaterial(scene,`${type}-glass-${index}`,'#17283a'),root);
  root.position.z=z;return root;
}
function loungeFurniture(scene,accent){
  const sofa=makeMaterial(scene,'sofa','#5b3568');for(const x of [-5,4.8]){addBox(scene,`sofa-seat-${x}`,{width:4,height:.55,depth:1.4},new Vector3(x,.38,2.5),sofa);addBox(scene,`sofa-back-${x}`,{width:4,height:1.15,depth:.35},new Vector3(x,1,3.05),sofa);}
  for(const x of [-5,0,5]){addCylinder(scene,`table-${x}`,{diameter:1.5,height:.5},new Vector3(x,.25,-1.2),makeMaterial(scene,`table-mat-${x}`,'#3d2e46'));addCylinder(scene,`table-glow-${x}`,{diameter:.25,height:.12},new Vector3(x,.57,-1.2),accent);}
  for(const x of [-9,9]){addCylinder(scene,`plant-pot-${x}`,{diameterTop:.55,diameterBottom:.4,height:.7},new Vector3(x,.35,4.8),makeMaterial(scene,`pot-${x}`,'#bd704c'));addCylinder(scene,`plant-${x}`,{diameterTop:0,diameterBottom:1.15,height:1.8},new Vector3(x,1.45,4.8),makeMaterial(scene,`leaf-${x}`,'#3f8a62'));}
  const wood=makeMaterial(scene,'lounge-walnut','#71513d');
  const brass=makeMaterial(scene,'lounge-brass','#c5a16b');
  const linen=makeMaterial(scene,'lounge-linen','#e3d6bc');
  addBox(scene,'woven-rug',{width:12,height:.025,depth:6},new Vector3(0,.02,.4),makeMaterial(scene,'rug','#784b4b'));
  for(let i=-5;i<=5;i++)addBox(scene,`rug-thread-${i}`,{width:.04,height:.028,depth:5.8},new Vector3(i,.03,.4),brass);
  addBox(scene,'bar-counter',{width:5.7,height:1.15,depth:1.25},new Vector3(7.3,.575,4.5),wood);
  addBox(scene,'bar-top',{width:6,height:.12,depth:1.45},new Vector3(7.3,1.2,4.5),makeMaterial(scene,'stone','#c9bba7'));
  for(let i=0;i<4;i++){
    const x=5.2+i*1.35;
    addCylinder(scene,`stool-stem-${i}`,{diameter:.08,height:.8,tessellation:8},new Vector3(x,.4,3),brass);
    addCylinder(scene,`stool-seat-${i}`,{diameter:.6,height:.15,tessellation:12},new Vector3(x,.87,3),wood);
    addCylinder(scene,`bottle-${i}`,{diameter:.13,height:.38,tessellation:8},new Vector3(x,1.45,4.7),makeMaterial(scene,`bottle-glass-${i}`,['#43745d','#bb8752','#486d88','#745c89'][i]));
  }
  for(const x of [-7,0,7]){
    addCylinder(scene,`pendant-cord-${x}`,{height:1.2,diameter:.025,tessellation:6},new Vector3(x,4.2,1),darkMaterial(scene));
    addCylinder(scene,`pendant-shade-${x}`,{height:.42,diameterTop:.3,diameterBottom:1,tessellation:12},new Vector3(x,3.55,1),linen);
    const light=new PointLight(`pendant-light-${x}`,new Vector3(x,3.2,1),scene);light.diffuse=hex('#ffd4a0');light.intensity=.35;light.range=6;
  }
  for(let i=0;i<3;i++){
    const x=-7+i*2.6;
    addBox(scene,`art-frame-${i}`,{width:1.7,height:1.5,depth:.12},new Vector3(x,2.65,6.45),brass);
    addBox(scene,`art-canvas-${i}`,{width:1.48,height:1.28,depth:.03},new Vector3(x,2.65,6.36),makeMaterial(scene,`art-paint-${i}`,['#305d66','#bd674b','#66537f'][i]));
    addCylinder(scene,`art-disc-${i}`,{diameter:.65,height:.035,tessellation:20},new Vector3(x,2.65,6.32),linen).rotation.x=Math.PI/2;
  }
  worldSign(scene,'MOSAIC','LOUNGE · LAGOS',new Vector3(3.5,3.2,6.35),4);
}
function darkMaterial(scene){return scene.getMaterialByName('fixture-dark')||makeMaterial(scene,'fixture-dark','#24252c');}
function worldSign(scene,title,subtitle,position,width){
  const texture=new DynamicTexture(`sign-text-${title}`,{width:1024,height:256},scene,false);
  const ctx=texture.getContext();ctx.fillStyle='#19282b';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#bc9c6a';ctx.lineWidth=8;ctx.strokeRect(12,12,1000,232);ctx.textAlign='center';ctx.fillStyle='#eadbc0';ctx.font='600 78px Georgia';ctx.fillText(title,512,125);ctx.font='24px Arial';ctx.fillText(subtitle,512,190);texture.update();
  const panel=CreatePlane(`sign-board-${title}`,{width,height:width/4},scene);panel.position.copyFrom(position);panel.isPickable=false;
  const mat=new StandardMaterial(`sign-board-mat-${title}`,scene);mat.diffuseTexture=texture;mat.emissiveColor=new Color3(.25,.25,.25);panel.material=mat;
}
function clubFloor(scene,movers){
  const colors=['#f04f87','#7357dd','#36b9c7','#e8ac45'];for(let x=-3;x<=3;x++)for(let z=-2;z<=2;z++){const mat=makeMaterial(scene,`tile-${x}-${z}`,colors[(x+z+12)%colors.length],{emissive:true});addBox(scene,`dance-tile-${x}-${z}`,{width:1.45,height:.06,depth:1.35},new Vector3(x*1.5,.06,z*1.4),mat);movers.push({kind:'pulse',material:mat,base:hex(colors[(x+z+12)%colors.length]),offset:(x+z)*.4});}
  const booth=addBox(scene,'dj-booth',{width:5,height:1.25,depth:1.2},new Vector3(0,.62,5.2),makeMaterial(scene,'booth','#482052'));addBox(scene,'dj-strip',{width:4.5,height:.18,depth:.05},new Vector3(0,.85,4.57),makeMaterial(scene,'dj-strip-mat','#ff4f9a',{emissive:true}));return booth;
}
function airport(scene,movers){
  for(let z=-5;z<=5;z+=2)addBox(scene,`runway-light-${z}`,{width:.18,height:.08,depth:.38},new Vector3(-3,.08,z),makeMaterial(scene,`runway-light-mat-${z}`,'#ffd577',{emissive:true}));
  const plane=new TransformNode('arrival-plane',scene);addBox(scene,'plane-body',{width:6,height:1.05,depth:1.15},Vector3.Zero(),makeMaterial(scene,'plane-white','#d9ddea'),plane);addBox(scene,'plane-wing',{width:2.4,height:.12,depth:5.2},new Vector3(.2,0,0),makeMaterial(scene,'plane-wing-mat','#9ea8be'),plane);addBox(scene,'plane-tail',{width:1.1,height:1.5,depth:.18},new Vector3(2.45,.65,0),makeMaterial(scene,'plane-tail-mat','#7657e8'),plane);plane.position=new Vector3(-7,6,2);movers.push({kind:'plane',node:plane});
  for(const x of [-9,-5,6,9])building(scene,x,5,3.5,3+Math.abs(x)%2,3,'#273451','#68a6d4',`terminal-${x}`);
  for(const [i,x] of [-7,5,8].entries())movers.push({kind:'service',node:vehicle(scene,`service-${i}`,'#e9c24f',-4+i*1.4),speed:.18+i*.04,offset:x});
}
function bridge(scene,movers){
  const water=CreateGround('lagoon-water',{width:24,height:14},scene);water.position.y=-.18;water.material=makeMaterial(scene,'water','#0d4664',{emissive:true});water.isPickable=false;
  addBox(scene,'bridge-road',{width:8,height:.22,depth:14},new Vector3(0,.02,0),makeMaterial(scene,'bridge-road-mat','#30394a'));
  for(const x of [-4.4,4.4]){addBox(scene,`rail-${x}`,{width:.18,height:.75,depth:14},new Vector3(x,.42,0),makeMaterial(scene,`rail-mat-${x}`,'#778196'));}
  for(let i=0;i<4;i++){const car=vehicle(scene,`bridge-${i}`,['#e66563','#e8a948','#4c8ed1','#e7e6db'][i],-4+i*2.5);movers.push({kind:'car',node:car,speed:.45+i*.07,offset:i*5});}
  const boat=vehicle(scene,'boat','#f0eee5',5,'bus');boat.scaling=new Vector3(.65,.45,.75);movers.push({kind:'boat',node:boat,speed:.18,offset:2});
}
function gate(scene,sceneId,movers){
  const wall=makeMaterial(scene,'gate-wall','#283150');for(const x of [-8,8])addBox(scene,`gate-block-${x}`,{width:4.5,height:5,depth:3},new Vector3(x,2.5,3.8),wall);addBox(scene,'gate-arch',{width:12,height:.7,depth:1},new Vector3(0,4.5,4.5),makeMaterial(scene,'gate-light','#7c79ff',{emissive:true}));
  const scanner=addBox(scene,'scanner',{width:1.25,height:2.2,depth:.8},new Vector3(-2,1.1,-1.5),makeMaterial(scene,'scanner-mat','#343b5d'));const screen=addBox(scene,'scanner-screen',{width:.72,height:.5,depth:.05},new Vector3(-2,1.5,-1.93),makeMaterial(scene,'scanner-glow','#63e2d1',{emissive:true}));movers.push({kind:'pulse',material:screen.material,base:hex('#63e2d1'),offset:0});
  if(sceneId==='launch'){const ship=new TransformNode('spaceship',scene);addCylinder(scene,'ship-core',{diameter:3.5,height:7,tessellation:8},new Vector3(0,3.5,0),makeMaterial(scene,'ship-body','#c7cfdf'),ship).rotation.z=Math.PI/2;addBox(scene,'ship-wing',{width:3,height:.2,depth:7},new Vector3(0,2.8,0),makeMaterial(scene,'ship-wing-mat','#6f79a8'),ship);ship.position=new Vector3(5,1,-1);addBox(scene,'boarding-ramp',{width:4,height:.15,depth:2},new Vector3(1.8,.16,-1),makeMaterial(scene,'ramp','#69738a'));movers.push({kind:'ship',node:ship});}
}
function buildWorld(scene,setting,sceneId){
  const theme=themes[setting]||themes.district;const movers=[];const ground=CreateGround('walkable-ground',{width:24,height:14,subdivisions:1},scene);ground.material=makeMaterial(scene,'ground',theme[0]);ground.isPickable=true;
  if(setting==='arrival')airport(scene,movers);
  else if(setting==='lounge'||setting==='club'){addBox(scene,'back-wall',{width:24,height:4,depth:.35},new Vector3(0,2,6.7),makeMaterial(scene,'back-wall-mat',setting==='club'?'#32184b':'#45264f'));addBox(scene,'left-wall',{width:.35,height:4,depth:14},new Vector3(-11.8,2,0),makeMaterial(scene,'left-wall-mat','#39233f'));if(setting==='club')clubFloor(scene,movers);else loungeFurniture(scene,makeMaterial(scene,'lounge-accent',theme[1],{emissive:true}));}
  else if(setting==='bridge')bridge(scene,movers);
  else if(setting==='gate')gate(scene,sceneId,movers);
  else {addBox(scene,'road',{width:7,height:.05,depth:14},new Vector3(0,.03,0),makeMaterial(scene,'road-mat','#30374a'));for(const [i,x] of [-9,-6,6,9].entries())building(scene,x,4,3.6,3.8+(i%3),5,['#2b3550','#313a55','#3a314c','#283852'][i],theme[1],i);for(const [i,pos] of [[-4,-4],[4,-3.5],[-4,1.8],[4,2.2]].entries())streetLamp(scene,pos[0],pos[1],i,theme[1]);marketStall(scene,7,-3.8,0,'#dc644f');marketStall(scene,-8,-3,1,'#e5a942');for(let i=0;i<4;i++){const type=i===1?'bus':'car';movers.push({kind:'car',node:vehicle(scene,i,['#df5d65','#e5a43b','#3889ca','#dedede'][i],-2+i*1.7,type),speed:.38+i*.09,offset:i*5});}}
  if(setting==='district'){
    const paving=makeMaterial(scene,'paving','#686b72');
    for(const side of [-1,1])addBox(scene,`pavement-${side}`,{width:7.7,height:.1,depth:14},new Vector3(side*7.6,.01,0),paving);
    const paint=makeMaterial(scene,'road-paint','#d9c9a0');
    for(let z=-6;z<7;z+=2)addBox(scene,`lane-mark-${z}`,{width:.08,height:.015,depth:.8},new Vector3(0,.065,z),paint);
    for(const x of [-10,10]){
      const trunk=makeMaterial(scene,`palm-trunk-${x}`,'#856448'),leaf=makeMaterial(scene,`palm-leaf-${x}`,'#42745b');
      addCylinder(scene,`palm-${x}`,{height:4,diameterBottom:.3,diameterTop:.18,tessellation:7},new Vector3(x,2,-4),trunk);
      for(let i=0;i<5;i++){const frond=addBox(scene,`frond-${x}-${i}`,{width:.45,height:.08,depth:2.1},new Vector3(x+Math.sin(i*1.256)*.65,4,-4+Math.cos(i*1.256)*.65),leaf);frond.rotation.y=i*1.256;frond.rotation.x=.25;}
    }
    worldSign(scene,'LAGOS','ARRIVALS · PICKUP',new Vector3(-6,3.1,1.35),3.2);
    worldSign(scene,'OUTSIDE','MUSIC · FOOD · LATE NIGHTS',new Vector3(7,3.3,1.35),3.4);
  }
  return{theme,movers};
}

function avatarTexture(scene,character,local,paletteIndex=0){
  const texture=new DynamicTexture(`avatar-${character}-${paletteIndex}`,{width:160,height:240},scene,false);texture.hasAlpha=true;const ctx=texture.getContext();const [outfit,skin,hair]=playerPalette[character]||npcPalette[paletteIndex%npcPalette.length];ctx.clearRect(0,0,160,240);
  ctx.fillStyle='#161522';ctx.fillRect(48,164,22,58);ctx.fillRect(89,164,22,58);ctx.fillStyle=outfit;ctx.beginPath();ctx.roundRect(38,76,84,96,18);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(48,83,9,72);
  ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(18,88,22,76,10);ctx.roundRect(120,88,22,76,10);ctx.fill();ctx.beginPath();ctx.arc(80,49,34,0,Math.PI*2);ctx.fill();ctx.fillStyle=hair;ctx.beginPath();ctx.arc(80,39,35,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='#17131d';ctx.fillRect(65,48,6,4);ctx.fillRect(91,48,6,4);ctx.strokeStyle='#3c2520';ctx.lineWidth=3;ctx.beginPath();ctx.arc(81,60,10,.2,2.8);ctx.stroke();
  if(character==='Bluezi'){ctx.strokeStyle='#d8d3ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(80,55,20,0,Math.PI*2);ctx.stroke();}if(character==='Edna'||character.includes('Vibe')){ctx.fillStyle='#ffcf6d';ctx.beginPath();ctx.arc(112,54,7,0,Math.PI*2);ctx.fill();}
  if(local){ctx.strokeStyle='#ffd17d';ctx.lineWidth=6;ctx.strokeRect(6,6,148,228)}texture.update();return texture;
}
function labelTexture(scene,label,local){const texture=new DynamicTexture(`label-${label}`,{width:256,height:64},scene,false);texture.hasAlpha=true;const ctx=texture.getContext();ctx.fillStyle=local?'#ffc36d':'rgba(8,11,29,.88)';ctx.beginPath();ctx.roundRect(3,3,250,58,15);ctx.fill();ctx.fillStyle=local?'#241129':'#fff';ctx.font='700 24px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label+(local?' · YOU':''),128,32);texture.update();return texture}
function createAvatar(scene,player,{local=false,label=true,paletteIndex=0,mode='idle'}={}){
  const root=new TransformNode(`person-${player.id}`,scene);root.position.copyFrom(toWorld(player.position));
  const plane=new TransformNode(`body-${player.id}`,scene);plane.parent=root;
  plane.rotation.y=Math.PI;
  const [outfit,skin,hair]=playerPalette[player.character]||npcPalette[paletteIndex%npcPalette.length];
  const cloth=makeMaterial(scene,`cloth-${player.id}`,outfit);
  const skinMat=makeMaterial(scene,`skin-${player.id}`,skin);
  const dark=makeMaterial(scene,`dark-${player.id}`,hair);
  const gold=makeMaterial(scene,`gold-${player.id}`,'#f6c65d');
  const trousers=makeMaterial(scene,`trousers-${player.id}`,'#252d3e');
  const shoes=makeMaterial(scene,`shoes-${player.id}`,'#d9d5cd');
  const female=player.character==='Edna'||player.character.includes('Vibe');
  const torso=addCylinder(scene,`torso-${player.id}`,{height:.85,diameterTop:female?.58:.7,diameterBottom:.47,tessellation:8},new Vector3(0,1.96,0),cloth,plane);torso.scaling.z=.62;
  ellipsoid(scene,`hips-${player.id}`,new Vector3(0,1.49,0),new Vector3(.53,.35,.32),trousers,plane);
  addCylinder(scene,`neck-${player.id}`,{height:.22,diameter:.19,tessellation:8},new Vector3(0,2.48,0),skinMat,plane);
  ellipsoid(scene,`head-${player.id}`,new Vector3(0,2.77,0),new Vector3(.37,.48,.35),skinMat,plane);
  ellipsoid(scene,`jaw-${player.id}`,new Vector3(0,2.63,.035),new Vector3(.28,.2,.28),skinMat,plane);
  ellipsoid(scene,`hair-${player.id}`,new Vector3(0,2.96,-.025),new Vector3(.39,.2,.35),dark,plane);
  for(const side of [-1,1]){
    ellipsoid(scene,`ear-${player.id}-${side}`,new Vector3(side*.19,2.76,0),new Vector3(.07,.12,.07),skinMat,plane);
    addBox(scene,`eye-${player.id}-${side}`,{width:.055,height:.025,depth:.018},new Vector3(side*.084,2.8,.163),dark,plane);
    addBox(scene,`brow-${player.id}-${side}`,{width:.075,height:.018,depth:.02},new Vector3(side*.084,2.85,.155),dark,plane);
  }
  ellipsoid(scene,`nose-${player.id}`,new Vector3(0,2.74,.18),new Vector3(.075,.105,.09),skinMat,plane);
  addBox(scene,`mouth-${player.id}`,{width:.1,height:.018,depth:.012},new Vector3(0,2.65,.168),dark,plane);
  if(player.character==='Bluezi'||female){
    for(let i=0;i<9;i++){
      const angle=i/9*Math.PI*2;
      addCylinder(scene,`locks-${player.id}-${i}`,{height:female?.46:.27,diameter:.065,tessellation:5},new Vector3(Math.cos(angle)*.17,female?2.76:2.97,Math.sin(angle)*.15-.04),dark,plane);
    }
  }
  // A small necklace and jacket seam make the silhouette read as clothing.
  addBox(scene,`pendant-${player.id}`,{width:.075,height:.1,depth:.025},new Vector3(0,2.18,.22),gold,plane);
  addBox(scene,`jacket-seam-${player.id}`,{width:.025,height:.65,depth:.025},new Vector3(0,1.97,.205),dark,plane);
  const limbs=[];
  for(const side of [-1,1]){
    const arm=new TransformNode(`arm-${player.id}-${side}`,scene);arm.parent=plane;arm.position.set(side*(female?.3:.37),2.3,0);
    ellipsoid(scene,`shoulder-${player.id}-${side}`,new Vector3(0,-.06,0),new Vector3(.22,.26,.24),cloth,arm);
    addCylinder(scene,`sleeve-${player.id}-${side}`,{height:.46,diameterTop:.21,diameterBottom:.16,tessellation:8},new Vector3(0,-.27,0),cloth,arm);
    const elbow=new TransformNode(`elbow-${player.id}-${side}`,scene);elbow.parent=arm;elbow.position.y=-.5;elbow.rotation.x=-.12;
    addCylinder(scene,`forearm-${player.id}-${side}`,{height:.4,diameterTop:.16,diameterBottom:.11,tessellation:8},new Vector3(0,-.2,0),skinMat,elbow);
    ellipsoid(scene,`hand-${player.id}-${side}`,new Vector3(0,-.46,.015),new Vector3(.12,.2,.1),skinMat,elbow);
    const leg=new TransformNode(`leg-${player.id}-${side}`,scene);leg.parent=plane;leg.position.set(side*.15,1.42,0);
    addCylinder(scene,`thigh-${player.id}-${side}`,{height:.63,diameterTop:.26,diameterBottom:.2,tessellation:8},new Vector3(0,-.315,0),trousers,leg);
    const knee=new TransformNode(`knee-${player.id}-${side}`,scene);knee.parent=leg;knee.position.y=-.63;
    addCylinder(scene,`shin-${player.id}-${side}`,{height:.62,diameterTop:.2,diameterBottom:.14,tessellation:8},new Vector3(0,-.31,0),trousers,knee);
    ellipsoid(scene,`shoe-${player.id}-${side}`,new Vector3(0,-.69,.085),new Vector3(.21,.18,.39),shoes,knee);
    limbs.push({arm,leg,knee,elbow,side});
  }
  if(local){const ring=CreateCylinder(`you-ring-${player.id}`,{height:.015,diameter:1.25,tessellation:24},scene);ring.parent=root;ring.position.y=.015;ring.material=makeMaterial(scene,`you-ring-mat-${player.id}`,'#edb953',{alpha:.45});ring.isPickable=false;}
  const shadow=CreateDisc(`shadow-${player.id}`,{radius:.55,tessellation:24},scene);shadow.parent=root;shadow.rotation.x=Math.PI/2;shadow.position.y=.02;shadow.material=makeMaterial(scene,`shadow-mat-${player.id}`,'#03040a',{alpha:.45});shadow.isPickable=false;
  if(label){const tag=CreatePlane(`label-${player.id}`,{width:1.45,height:.3},scene);tag.parent=root;tag.position.y=3.3;tag.billboardMode=Mesh.BILLBOARDMODE_ALL;tag.isPickable=false;const tagMat=new StandardMaterial(`label-mat-${player.id}`,scene);tagMat.diffuseTexture=labelTexture(scene,player.character,local);tagMat.opacityTexture=tagMat.diffuseTexture;tagMat.disableLighting=true;tagMat.emissiveColor=Color3.White();tag.material=tagMat;}
  return{root,plane,limbs,target:toWorld(player.position),origin:toWorld(player.position),phase:Math.random()*Math.PI*2,mode};
}
const crowdLayouts={
  street:[['Hawker',72,55,'work'],['Commuter',30,58,'walk'],['Vendor',18,72,'work'],['Traveler',84,68,'walk'],['Driver',53,51,'talk'],['Student',38,74,'walk'],['Courier',64,73,'walk'],['Friend',76,63,'talk']],
  memory:[['Vibe Scout',54,60,'talk'],['Vibe Girl',65,62,'talk'],['Guest',82,70,'walk'],['Host',63,71,'work'],['Server',18,70,'work'],['Guest',43,49,'walk']],
  lounge:[['Vibe Girl',66,53,'talk'],['Vibe Girl',72,58,'talk'],['Host',25,66,'work'],['Guest',45,48,'talk'],['Guest',76,74,'talk'],['Server',34,72,'walk']],
  dance:[['DJ',50,43,'work'],['Dancer',35,62,'dance'],['Dancer',46,68,'dance'],['Dancer',58,64,'dance'],['Dancer',69,70,'dance'],['Friend',28,73,'dance'],['Guest',78,60,'dance'],['Server',18,72,'walk'],['Photographer',83,72,'work']],
  rival:[['Rival',65,54,'talk'],['Rival',72,56,'talk'],['Rival',79,58,'talk'],['Bystander',26,66,'walk'],['Rider',84,72,'work'],['Vendor',18,73,'work'],['Friend',40,71,'talk']],
  chase:[['Commuter',22,72,'walk'],['Runner',36,68,'walk'],['Vendor',77,72,'work'],['Bystander',61,63,'talk']],
  checkpoint:[['Guard',57,70,'work'],['Technician',68,53,'work'],['Traveler',35,72,'walk'],['Traveler',43,68,'talk'],['Officer',78,67,'walk']],
  launch:[['Ground Crew',36,70,'work'],['Ground Crew',67,69,'work'],['Traveler',44,73,'walk'],['Traveler',54,68,'talk'],['Technician',73,57,'work']]
};
function createCrowd(scene,sceneId){return(crowdLayouts[sceneId]||[]).map(([name,x,y,mode],i)=>createAvatar(scene,{id:`npc-${sceneId}-${i}`,character:name,position:{x,y}},{paletteIndex:i,mode}));}
function animateRig(person,time,moving,dancing=false){
  const stride=Math.sin(time*2.4+person.phase);
  person.plane.position.y=moving?Math.abs(stride)*.035:dancing?Math.abs(stride)*.1:0;
  person.plane.rotation.z=dancing?stride*.1:0;
  for(const {arm,leg,knee,elbow,side} of person.limbs){
    leg.rotation.x=moving?stride*.55*side:0;
    knee.rotation.x=moving?Math.max(0,-stride*side)*.65:0;
    elbow.rotation.x=dancing?-.9:-.12;
    arm.rotation.x=moving?-stride*.5*side:dancing?-1+stride*.5*side:Math.sin(time*.65+person.phase)*.06;
    arm.rotation.z=dancing?side*.65:side*.08;
  }
}
function faceMovement(person,dx,dz){if(Math.hypot(dx,dz)>.0001)person.plane.rotation.y=Math.atan2(dx,dz);}
function animatePerson(person,time){
  const before=person.root.position.clone();
  if(person.mode==='walk'){
    person.root.position.x=person.origin.x+Math.sin(time*.28+person.phase)*1.8;
    person.root.position.z=person.origin.z+Math.cos(time*.2+person.phase)*.5;
    faceMovement(person,person.root.position.x-before.x,person.root.position.z-before.z);
  }
  animateRig(person,time,person.mode==='walk',person.mode==='dance');
  if(person.mode==='talk'||person.mode==='work'){
    person.limbs[0].arm.rotation.x=-.45+Math.sin(time*.8+person.phase)*.2;
    person.limbs[0].elbow.rotation.x=-.55;
  }
}

function setup(canvas,state,onMove){
  const engine=new Engine(canvas,true,{antialias:true,preserveDrawingBuffer:false,stencil:false},false);engine.setHardwareScalingLevel(Math.max(1,window.devicePixelRatio/1.5));const setting=state.phase==='arrival'?'arrival':state.challenge?.id==='chase'?'bridge':state.challenge?.setting||'district';const scene=new Scene(engine);const world=buildWorld(scene,setting,state.challenge?.id);scene.clearColor=Color4.FromHexString(`${world.theme[2]}ff`);
  const camera=new ArcRotateCamera('fixed-camera',-Math.PI/2,1.02,24,new Vector3(0,0,0),scene);camera.lowerRadiusLimit=camera.upperRadiusLimit=24;camera.inputs.clear();const ambient=new HemisphericLight('ambient',new Vector3(0,1,0),scene);ambient.intensity=.72;const sun=new DirectionalLight('warm-light',new Vector3(-.4,-1,.35),scene);sun.intensity=.82;sun.diffuse=hex('#ffd1a1');const glow=new PointLight('street-glow',new Vector3(4,4,-2),scene);glow.diffuse=hex(world.theme[1]);glow.intensity=setting==='club'?1.5:.55;glow.range=15;
  const avatars=new Map();if(setting!=='arrival')for(const p of state.players)avatars.set(p.id,createAvatar(scene,p,{local:p.id===state.me?.id}));const crowd=setting==='arrival'?[]:createCrowd(scene,state.challenge?.id);
  const runtime={engine,scene,avatars,state,resize:null};
  if(setting!=='arrival'){
    camera.lowerRadiusLimit=12;camera.upperRadiusLimit=26;
    camera.radius=canvas.clientWidth<600?21:17;
    camera.beta=.92;
  }
  scene.onPointerDown=(_,pick)=>{if(!['intro','review'].includes(runtime.state.phase)||!pick?.hit||pick.pickedMesh?.name!=='walkable-ground')return;onMove(toNormalized(pick.pickedPoint));};
  engine.runRenderLoop(()=>{
    const time=performance.now()*.004;
    const dt=Math.min(engine.getDeltaTime()/1000,.1);
    const blend=1-Math.exp(-10*dt);
    const story=runtime.state.phase==='story';
    const progress=Math.max(0,Math.min(1,1-(runtime.state.endsAt-Date.now())/(runtime.state.phaseDuration||18000)));
    const lead=avatars.get(runtime.state.me?.id);
    const actor=crowd[0];
    for(const avatar of avatars.values()){
      const before=avatar.root.position.clone();
      const destination=avatar.target.clone();
      if(story&&actor){
        // Authored approach is presentation only; server movement remains locked.
        const approach=Vector3.Lerp(avatar.origin,actor.origin,Math.min(.55,progress*2));
        destination.copyFrom(approach);
      }
      Vector3.LerpToRef(avatar.root.position,destination,blend,avatar.root.position);
      const moving=Vector3.Distance(avatar.root.position,destination)>.025;
      faceMovement(avatar,avatar.root.position.x-before.x,avatar.root.position.z-before.z);
      animateRig(avatar,time,moving,runtime.state.challenge?.id==='dance'&&runtime.state.phase==='active');
      if(story&&actor&&!moving)faceMovement(avatar,actor.root.position.x-avatar.root.position.x,actor.root.position.z-avatar.root.position.z);
    }
    const localAvatar=avatars.get(runtime.state.me?.id);
    if(story&&lead&&actor){
      const beat=Math.min(2,Math.floor(progress*3));
      const shot=window.StarsStory?.[runtime.state.challenge?.id]?.[beat]?.[2]||'wide';
      const focus=shot==='crew'?lead.root.position.clone():shot==='npc'?actor.root.position.clone():Vector3.Lerp(lead.root.position,actor.root.position,.5);
      focus.y=1.45;
      camera.setTarget(Vector3.Lerp(camera.target,focus,1-Math.exp(-3*dt)));
      const narrow=canvas.clientWidth<600;
      const desired=shot==='wide'?(narrow?17:14):(narrow?12:9);
      camera.radius+=(desired-camera.radius)*(1-Math.exp(-2*dt));
      camera.beta+=(1.24-camera.beta)*(1-Math.exp(-2*dt));
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const angle=-Math.PI/2+(reduced?0:Math.sin(progress*Math.PI)*.18);
      camera.alpha+=(angle-camera.alpha)*(1-Math.exp(-2*dt));
      faceMovement(actor,lead.root.position.x-actor.root.position.x,lead.root.position.z-actor.root.position.z);
    } else if(localAvatar){
      camera.radius+=((canvas.clientWidth<600?21:17)-camera.radius)*(1-Math.exp(-2*dt));
      camera.beta+=(.92-camera.beta)*(1-Math.exp(-2*dt));
      camera.alpha+=(-Math.PI/2-camera.alpha)*(1-Math.exp(-2*dt));
      const focus=localAvatar.root.position.clone();focus.y=.9;
      focus.x=Math.max(-6,Math.min(6,focus.x));focus.z=Math.max(-2,Math.min(2,focus.z));
      camera.setTarget(Vector3.Lerp(camera.target,focus,1-Math.exp(-4*dt)));
    }
    crowd.forEach(person=>animatePerson(person,time));
    for(const mover of world.movers){
      if(mover.kind==='plane'){mover.node.position.x=-9+(time*.42%18);mover.node.position.y=Math.max(.9,6.3-(time*.14%6));}
      else if(mover.kind==='car'||mover.kind==='service')mover.node.position.x=((time*mover.speed+mover.offset)%25)-12.5;
      else if(mover.kind==='boat'){mover.node.position.x=Math.sin(time*.15)*8;mover.node.position.z=5.2;}
      else if(mover.kind==='pulse')mover.base.scaleToRef(.55+Math.sin(time*1.7+mover.offset)*.22,mover.material.emissiveColor);
      else if(mover.kind==='ship')mover.node.position.y=1+Math.sin(time*.3)*.08;
    }
    glow.intensity=(setting==='club'?1.25:.5)+Math.sin(time*.8)*.15;scene.render();
  });
  const resize=()=>engine.resize();runtime.resize=resize;window.addEventListener('resize',resize);return runtime;
}
export function mount(canvas,state,onMove){dispose();active=setup(canvas,state,onMove)}
export function update(state){if(!active)return;active.state=state;active.engine.resize();for(const p of state.players){const avatar=active.avatars.get(p.id);if(avatar&&p.position)avatar.target=toWorld(p.position)}}
export function dispose(){if(!active)return;window.removeEventListener('resize',active.resize);active.scene.dispose();active.engine.dispose();active=null}
