// B03_ACTIVE_ENTRY
import batch03Input from '../../../data/m11b/batch03/input.json';
import {applyB03Layout,adaptB03Terrain,buildB03Model} from './batch03-core.mjs';
import {buildB03Facility,finishB03Integration,checkB03Access} from './batch03-scene';
// B02_ACTIVE_ENTRY
import batch02Input from '../../../data/m11b/batch02/input.json';
import {applyB02Layout,buildB02Model} from './batch02-core.mjs';
import {buildB02Facility} from './batch02-scene';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import source from '../../../data/m10/campus-layout.json';
import { bounds, footprint, courtRects, checkLayout } from './layout-core.mjs';
import './style.css';
import terrainBase from '../../../data/m11a/terrain-input.json';
import patchInput from '../../../data/m11a/patch02/input.json';
import {applyPatch02,patch02Checks,galleryRoute,gymWorld} from './patch02-core.mjs';
import {buildPatch02Gym,setGymCutaway} from './patch02-gym';
import {installTerrain} from './terrain-scene';
import patch03Input from '../../../data/m11a/patch03/input.json';
import {buildTerrainModel} from './terrain-core.mjs';
import {buildPatch03Model,patch03Checks} from './patch03-core.mjs';
import {installPatch03Geometry} from './patch03-scene';
import patch04Base from '../../../data/m11a/patch04/input.json';
import batch01Input from '../../../data/m11b/batch01-r2/input.json';
import {buildPatch04Model,patch04Checks} from './patch04-core.mjs';
import {installPatch04Geometry} from './patch04-scene';
import {applyB01R2,buildB01R2Model as buildBatch01Model,b01R2Checks} from './b01-r2-core.mjs';
import {r3Facility as batch01Facility,installR3Details} from './b01-r3-scene';
import revision3Base from '../../../data/m11b/batch01-r3/input.json';
import shutterFix from '../../../data/m11b/batch01-r3/shutter-fix.json';
const revision3Input={...revision3Base,version:shutterFix.version,status:shutterFix.status,entrances:{...revision3Base.entrances,...shutterFix.entrances}};
import {applyB01R3Layout,adaptB01R3Terrain,buildB01R3Model,b01R3Checks} from './b01-shutter-fix.mjs';
import { edgeWidth } from './revision-core.mjs';
import { r4Facility, setToiletSection } from './revision-r4-scene';
import { r3Facility, buildR3Thresholds } from './revision-r3-scene';
import { revisedFacility, buildRevisionParts } from './revision-scene';

// M1.0 hypotheses, not site measurements. No gameplay or night layer.
type Vec3 = [number, number, number];
type Facility = typeof source.facilities[number];
const patch=applyPatch02(source,terrainBase,patchInput);
const effective=applyB01R2(patch.layout,patch.terrain,patch04Base,batch01Input);
const r2Layout=effective.layout;
const layout:typeof source=applyB03Layout(applyB02Layout(applyB01R3Layout(r2Layout,revision3Input),batch02Input),batch03Input);
const patch04Input=effective.site;
const requestedVertical=new URLSearchParams(location.search).get('vertical');
const verticalScheme=requestedVertical==='patch02'?'patch02':requestedVertical==='patch03'?'patch03':'patch04';
const p03Model=verticalScheme!=='patch02'?buildPatch03Model(layout,effective.spec,patch03Input):null;
const rawCurrentModel=verticalScheme==='patch04'?buildPatch04Model(p03Model,patch04Input):p03Model;
const currentModel=adaptB03Terrain(adaptB01R3Terrain(rawCurrentModel??buildTerrainModel(layout,effective.spec),layout,revision3Input),layout,batch03Input);
const b03Model=buildB03Model(layout,currentModel,batch03Input);
const b01Model=buildB01R3Model(layout,currentModel,batch01Input,revision3Input);
const b02Model=buildB02Model(layout,currentModel,batch02Input);
let b01Bridge:any=null;
const terrainSpec=p03Model?.spec??effective.spec;
const report=p03Model?patch03Checks(patch.layout,patch.terrain,patch03Input):patch02Checks(layout,terrainSpec,patchInput,source);
const b01Report=b01R3Checks(r2Layout,layout,b01Model,revision3Input);
let p03Geometry:any=null;
let terrainSystem:any=null;
const groundEye=(x:number,z:number)=>layout.navigation.reviewHeight+(terrainSystem?.enabled?terrainSystem.surfaceHeight(x,z):0);
const cameraPresets:any={...layout.cameraPresets,
 'terrain-entrance':{label:'门内上坡 · 5% H工作方案',position:[-7,2.6,2],target:[0,1.3,27]},
 'terrain-gym':{label:'主路 → 体育馆前坪与正门',position:[8,7.8,47],target:[-35,8.5,45]},
 'gym':{label:'体育馆正门朝主路',position:[16,10,48],target:[-36,9,45]},
 'gym-p02-front':{label:'体育馆正门 · 前坪 / 主路',position:[16,8.2,46],target:[-37,9,45]},
 'gym-p02-oblique':{label:'体育馆折面 · 左梯与前坪',position:[9,12,95],target:[-41,9,46]},
 'gym-p02-loop':{label:'绕馆环路 · 避开音乐楼及泳池',position:[-140,110,118],target:[-38,0,49]},
 'gym-p02-stair':{label:'正门左侧外梯 · 通观赛层',position:[-9,11,80],target:[-31,4.7,63]},
 'gym-p02-gallery':{label:'观赛层平台 · 实体楼梯顶端',position:[-36,7.5,63],target:[-46,1.6,45]},
 'terrain-library':{label:'图书馆入口 · 3级H台阶',position:[68,3.8,232],target:[75,1.1,246]},
 'terrain-longya':{label:'长雅入口 · 6级H台阶',position:[120,4.3,236],target:[129,1.8,250]},
 'terrain-field':{label:'后缘跑道与前庭 · H地坪过渡',position:[120,5,192],target:[94,.2,183]},
 'terrain-main':{label:'主路 · 温和纵坡工作方案',position:[-8,3.2,167],target:[0,.8,204]},
 'terrain-gap':{label:'主楼/厕所 · 平接与桥下净空',position:[6.5,2.19,217],target:[6.5,2.19,238]}
};
if(p03Model)for(const preset of Object.values(cameraPresets) as any[]){preset.position=[...preset.position];preset.target=[...preset.target];preset.position[1]+=2.2;preset.target[1]+=2.2;}
Object.assign(cameraPresets,{
 'p03-gate-out':{label:'01 门外看上坡 · 42m / +3.00m H',position:[-1,1.72,-14],target:[0,3.8,49]},
 'p03-gate-in':{label:'02 门内沿坡向上 · 主坡9.5% H',position:[1,1.9,6],target:[0,4.4,44]},
 'p03-crest':{label:'03 坡顶回望校门',position:[1,4.7,49],target:[0,.9,0]},
 'p03-gym-field':{label:'04 体育馆前坪 → 下沉操场',position:[-8,5.2,52],target:[55,1.9,80]},
 'p03-field-gym':{label:'05 操场内 → 体育馆',position:[47,3.5,66],target:[-34,8,45]},
 'p03-edge':{label:'06 场边横看高差 · 下沉1.20m H',position:[30,3.6,72],target:[24,2.7,114]},
 'p03-rostrum':{label:'07 主席台 · 台顶接外围标高 H',position:[40,4.6,132],target:[19,2.8,110]},
 'p03-rear':{label:'08 后缘跑道 / 沙坑 · 同层运动面',position:[115,4.4,174],target:[84,2.1,185]},
 'p03-access':{label:'09 西侧上下场台阶 · 8级 H',position:[34,5,51],target:[25,2.5,60]},
 'p03-section':{label:'10 高位纵剖审阅 · 真实1×标高',position:[150,105,-80],target:[17,1,90]},
 'p03-ramp':{label:'11 东侧上下场缓坡 · 18m H',position:[134,8,180],target:[122,2.3,155]}
});
Object.assign(cameraPresets,{
 'b01-front':{label:'旧主楼 · 操场正面',position:[69,15,146],target:[69,10,224]},
 'b01-oblique':{label:'主楼、厕所与连接桥 · 斜前',position:[-27,28,168],target:[42,11,224]},
 'b01-entry':{label:'主教学楼正门 · 三旗前坪',position:[76,7.5,200],target:[69,6.5,220]},
 'b01-rear':{label:'旧主楼背面 · 通旧图书馆',position:[105,23,242],target:[61,12,225]},
 'b01-terrace':{label:'四楼后坪 · 退台与门洞',position:[110,22,237],target:[60,16,226]},
 'b01-toilet':{label:'厕所 · 两端入口和连续外廊',position:[10,12,207],target:[-10,10,224]},
 'b01-bridge':{label:'四层连接桥 · 实体栏杆',position:[10,18,200],target:[5,10,224]},
 'b01-floor2':{label:'二层剖看 · 教学楼—桥—两端门',position:[6,19,207],target:[-4,7.3,224]},
 'b01-underpass':{label:'桥下道路 · 通旧图书馆',position:[6.5,5.2,211],target:[6.5,5.2,239]},
 'b01-overview':{label:'第一批总览 · 既定前坪不变',position:[-24,76,148],target:[57,8,224]},
 'p04-courts':{label:'已确认基底 · 篮球场抬高',position:[5,8,125],target:[-38,4,120]},
 'p04-flags':{label:'已确认基底 · 三旗与前坪',position:[102,8,201],target:[64,5,192.5]},
 'p04-shop':{label:'已确认基底 · 食堂下层小卖部',position:[138,6,143],target:[153,4.8,149]}
});
Object.assign(cameraPresets,{
 'r2-front':{label:'五层旧主楼 · 中央功能区前凸',position:[73,14,119],target:[73,12,221]},
 'r2-overview':{label:'第二轮 · 五层主楼、连续厕所和共轴图书馆',position:[-65,75,125],target:[51,10,227]},
 'r2-entry':{label:'中央国旗 → 主楼正门 / 功能区',position:[80,8,195],target:[73,9,216]},
 'r2-rear':{label:'三层后排教室 · 四楼大坪 · 五层单排主体',position:[134,33,255],target:[76,13,225]},
 'r2-terrace':{label:'四楼后坪 · 内侧有顶廊 / 外侧露天',position:[35,16.6,229.5],target:[111,16.55,225.8]},
 'r2-fifth':{label:'五楼走廊 · 下方四楼后坪',position:[35,20.35,224.5],target:[111,20.3,224.5]},
 'r2-section':{label:'侧剖校核 · 下三层双排 / 四层坪 / 五层廊',position:[140,24,231],target:[91,13,224]},
 'r2-floor2':{label:'二层剖看 · 双排教室与中走廊',position:[73,54,209],target:[73,7.3,224]},
 'r2-side':{label:'教学楼侧门 · 凸出门廊与内退门洞',position:[132,6.8,212],target:[122.5,5.5,224]},
 'r2-bridge5':{label:'第五层连接 · H延续逐层相连原则',position:[12,25,211],target:[4,19.7,224]},
 'r2-library':{label:'主楼后门 → 中轴图书馆入口',position:[73,5.4,234],target:[73,7,249]},
 'r2-axis':{label:'四节点共轴 · 08 → 中央国旗 → 15 → 18',position:[73,360,154],target:[73,0,154]}
});
Object.assign(cameraPresets,{
 'r3-front':{label:'R3 整体正面 · 两端内退入口 / 中央浅弧',position:[73,14,109],target:[73,11.7,221]},
 'r3-overview':{label:'R3 全楼斜前 · 五层前伸墙与一层门廊',position:[-14,44,144],target:[66,11,219]},
 'r3-west':{label:'左端入口 · 正面内退 / 右侧五层实墙向前伸',position:[16.5,7.6,202.5],target:[28.3,6.2,217]},
 'r3-east':{label:'右端入口 · 正面内退 / 左侧五层实墙向前伸',position:[129.5,7.6,202.5],target:[117.7,6.2,217]},
 'r3-wall':{label:'五层主体墙超过门罩 · 不是短U形门斗',position:[17,22,202],target:[29.5,13,218]},
 'r3-porch-plan':{label:'端部俯看 · 仅首层剖看，门洞朝操场',position:[26.6,30,214],target:[26.6,3.4,216.5]},
 'r3-arc':{label:'中央功能区浅弧 · 墙/楼板/檐口同源',position:[83,13,199],target:[73,12,216]},
 'r3-arc-plan':{label:'中央曲线俯看 · 轴线与最前点不变',position:[73,45,214],target:[73,9,217]},
 'r3-axis':{label:'共轴保持 · 运动场 / 国旗 / 主楼 / 图书馆',position:[73,360,154],target:[73,0,154]},
 'r3-section':{label:'R2五层剖面保持 · 三层后排 / 四楼大坪',position:[140,24,231],target:[91,13,224]}
});
Object.assign(cameraPresets,{
 'r3-west-front':{label:'图面左端入口正视 · 真实门洞与三级台阶',position:[26.6,5.3,209],target:[26.6,5.1,219]},
 'r3-east-front':{label:'图面右端入口正视 · 真实门洞与三级台阶',position:[119.4,5.3,209],target:[119.4,5.1,219]}
});
// SHUTTER_FIX_VIEWS
Object.assign(cameraPresets,{
 'r3-west':{label:'左端 · 侧墙开启卷帘门 / 放大雨棚',position:[20.8,6.7,211.8],target:[28.0,5.1,217.5]},
 'r3-east':{label:'右端 · 侧墙开启卷帘门 / 放大雨棚',position:[125.2,6.7,211.8],target:[118.0,5.1,217.5]},
 'r3-west-front':{label:'左端正看 · 后墙封回 / 两柱外移',position:[25.0,5.8,207.5],target:[26.5,5.1,218]},
 'r3-east-front':{label:'右端正看 · 后墙封回 / 两柱外移',position:[121.0,5.8,207.5],target:[119.5,5.1,218]},
 'r3-porch-plan':{label:'首层俯看 · 雨棚覆盖与平台',position:[27,20,216.4],target:[27,3.45,217]},
 'r31-west-door':{label:'左端卷帘门近看 · 无关闭门板',position:[23.5,5.3,214.9],target:[28.5,4.95,217.5]},
 'r31-east-door':{label:'右端卷帘门近看 · 无关闭门板',position:[122.5,5.3,214.9],target:[117.5,4.95,217.5]}
});
cameraPresets['r2-side']=cameraPresets['r3-east'];
// B03 photo directions are approximate; no photogrammetric camera solution is claimed.
Object.assign(cameraPresets,{
 'b03-library':{label:'旧图书馆 · 原位三层H / 大窗 / 攀藤',position:[49,14,234],target:[73,10.2,252],fov:58},
 'b03-photo-library':{label:'S03-049 · 内退入口 / 暗红门框 / 蓝色告示板',position:[72.3,7.1,237.5],target:[72.3,7.6,247.2],fov:59},
 'b03-library-lobby':{label:'真正门洞内 · 最小门厅与后花园出口',position:[73,6.85,249.5],target:[73,6.8,258.5],fov:64},
 'b03-uphill':{label:'主楼后门出发 · 路面爬升 / 不抬主楼后坪',position:[73,5.2,232.4],target:[73,7.5,248],fov:58},
 'b03-gap':{label:'桥下通路向图书馆 · 后路横向渐升',position:[6.5,5.2,233],target:[45,6.3,240],fov:60},
 'b03-garden':{label:'后花园 · 对称双弧梯与中央圆平台（平台H）',position:[89,13,288],target:[59.5,7,268],fov:58},
 'b03-spiral':{label:'左右对称弧梯 → 圆平台H → 中央上梯 → 二层入口',position:[58.5,10.6,283],target:[58.5,7,266.7],fov:58},
 'b03-spiral-top':{label:'中央上梯与二层真门洞 · 无封闭圆盘或堵口栏杆',position:[58.5,10.65,265],target:[58.5,10.3,258.7],fov:66},
 'b03-garden-plan':{label:'双梯对称与汇合路径 · 同源俯视 / 圆平台H',position:[58.5,37,283],target:[58.5,6.5,267.2],fov:56},
 'b03-canteen':{label:'面对食堂：左打印 ｜ 中楼梯 ｜ 右下层小卖部',position:[128,8.0,152],target:[154,6.8,152],fov:60},
 'b03-photo-canteen':{label:'S03-031附近机位 · 中央宽梯 / 两侧下层店面',position:[131,5.5,152],target:[152,7.1,152],fov:60},
 'b03-canteen-lobby':{label:'中央宽梯后方 · 上层食堂门厅',position:[157.5,8.54,152],target:[147,8.54,152],fov:66},
 'b03-print':{label:'正面左侧打印门面 · 独立真开口 / 内部分间H',position:[146.2,4.9,145.4],target:[154.5,4.8,145.4],fov:68},
 'b03-shop':{label:'正面右侧小卖部 · 12仍在11下层 / 门面细节H',position:[146.2,4.9,158.7],target:[155,4.8,158.7],fov:68},
 'b03-shop-inside':{label:'小卖部内回望 · 不虚构货架和商品',position:[155.5,4.9,158.7],target:[147,4.9,158.7],fov:69},
 'b03-perimeter':{label:'食堂外围道路与家属区间隙',position:[205,38,171],target:[164,6,149],fov:60},
 'b03-overview':{label:'第三批全景 · 图书馆与生活组团',position:[200,107,306],target:[88,6,222],fov:55},
 'b03-axis':{label:'已认可四节点主轴 · 图书馆只调标高',position:[73,325,200],target:[73,0,200],fov:48}
});
// B02 presets: photo matching is approximate, not a solved camera calibration.
Object.assign(cameraPresets,{
 'b02-photo-front':{label:'体育馆 · S03-020 低位斜正面',position:[16,5.35,82],target:[-39,12.5,44],fov:38},
 'b02-photo-side':{label:'体育馆 · S03-017 右前侧折面',position:[4,5.3,0],target:[-39,12,46],fov:49},
 'b02-front':{label:'主路正看 · 真正门洞在内退正墙',position:[26,7.1,45],target:[-36,12,45],fov:43},
 'b02-entry':{label:'前坪 / 低台阶 / 体育馆门厅',position:[-11,5.5,48],target:[-29.8,5.2,45],fov:49},
 'b02-lobby':{label:'体育馆门厅内回望 · 门后非实心墙',position:[-32.3,5.34,46.5],target:[-20,5.2,45],fov:62},
 'b02-stair':{label:'面对正门的左侧 · 外梯到观赛层',position:[-12,11.6,77],target:[-30,7.6,62],fov:51},
 'b02-stair-top':{label:'梯顶落脚 / 真正上层侧门',position:[-36.1,9.52,65],target:[-35.6,9.3,58.6],fov:66},
 'b02-gallery':{label:'短观赛廊 · 回到前平台的开口',position:[-33,9.5,58.3],target:[-27.3,9.3,58.3],fov:66},
 'b02-music':{label:'四层音乐楼 · 贴馆 / 既有入口',position:[-98,24,103],target:[-61,10,67],fov:48},
 'b02-music-entry':{label:'音乐楼南侧入口 · H保守补全',position:[-71.5,6.3,85],target:[-68,5.25,76.5],fov:58},
 'b02-music-lobby':{label:'音乐楼最小门厅内回望',position:[-68,5.28,75],target:[-68,5.3,81],fov:67},
 'b02-loop':{label:'绕馆道路关键转角 · 不穿共享墙',position:[-105,44,107],target:[-65,4,69],fov:49},
 'b02-field':{label:'下沉运动面看馆 · 前坪不降低',position:[49,4.2,64],target:[-31,9.3,44],fov:47},
 'b02-overview':{label:'第二批组团及既有运动区',position:[49,94,133],target:[-40,6,61],fov:48}
});

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=el<HTMLDivElement>('viewport');
let renderer: THREE.WebGLRenderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});}
catch {el('error').hidden=false;el('error').textContent='此浏览器无法建立 WebGL2 场景。请在支持硬件加速的桌面浏览器中打开；本文件不是静态图片。';throw new Error('WebGL2 unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.append(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();el('error').hidden=false;el('error').textContent='WebGL 上下文已丢失。当前只有校核视角，无游戏进度；恢复后刷新即可重新加载。';});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());

const scene=new THREE.Scene();scene.background=new THREE.Color('#edf0e8');
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.08,1100);
const topCamera=new THREE.OrthographicCamera(-200,200,200,-200,1,1100);
topCamera.up.set(0,0,-1);
let active:THREE.PerspectiveCamera|THREE.OrthographicCamera=camera;
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=1.2;controls.maxDistance=900;controls.maxPolarAngle=Math.PI*.495;
const topControls=new OrbitControls(topCamera,renderer.domElement);
topControls.enableRotate=false;topControls.enableDamping=true;topControls.enabled=false;topControls.minZoom=.45;topControls.maxZoom=8;
const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(190,260,-80);sun.target.position.set(45,0,135);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-250,right:250,top:250,bottom:-250,near:1,far:900});sun.shadow.normalBias=.18;sun.shadow.bias=-.00015;
scene.add(sun,sun.target);
const sunDirection=new THREE.Vector3(145,260,-215).normalize();
function setReviewShadow(target:number[],detail=false){
 if(detail){sun.target.position.set(target[0],target[1],target[2]);sun.position.copy(sun.target.position).addScaledVector(sunDirection,365);}
 else{sun.position.set(190,260,-80);sun.target.position.set(45,0,135);}
 const extent=detail?38:250;
 Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:900});
 sun.shadow.normalBias=detail?.10:.18;sun.shadow.bias=detail?-.00008:-.00015;
 sun.shadow.camera.updateProjectionMatrix();sun.target.updateMatrixWorld();sun.updateMatrixWorld();sun.shadow.needsUpdate=true;
}

// Architectural colours use a Canvas Ramp LUT. Debug lines/HTML are a separate annotation layer.
const ramps=[
 ['#788f8d','#b7c6b6','#e9e5d2'],
 ['#476b63','#75907b','#a6b493'],
 ['#637f7b','#9caaa0','#cad0bc'],
 ['#806d63','#b6937c','#d4b89b'],
 ['#527374','#8aa4a0','#b9d0c3'],
 ['#6c7a79','#9eaba7','#c8d0c6'],
 ['#687a7a','#a2afaa','#ccd2c2'],
 ['#8c7d5e','#c1b186','#e5d7ad'],
 ['#73827c','#becbbb','#f2f0da'],
 ['#345c77','#397b9b','#57a3ba'],['#3e595e','#526b6a','#698179'],
 ['#6f6760','#95735e','#ba8b65'],['#6f816b','#c4aa5a','#e6c555'],['#3e7068','#4c9479','#74b089'],
 ['#82918d','#cad0c4','#efede1'],['#5b6f6d','#aeb9b3','#d9dfd4'],['#253d41','#405e60','#73918b'],['#774f4c','#a77770','#c69c92'],['#811e24','#b5252b','#d33b3c'],['#bb9436','#e5bb4e','#f8d169'],['#58383b','#845254','#a87673'],['#345a7b','#477da3','#7ba5c1']
];
const lutCanvas=document.createElement('canvas');lutCanvas.width=256;lutCanvas.height=ramps.length;
const ctx=lutCanvas.getContext('2d')!;
ramps.forEach((row,y)=>row.forEach((colour,j)=>{ctx.fillStyle=colour;const starts=[0,95,182],ends=[95,182,256];ctx.fillRect(starts[j],y,ends[j]-starts[j],1);}));
const lut=new THREE.CanvasTexture(lutCanvas);lut.colorSpace=THREE.SRGBColorSpace;lut.minFilter=lut.magFilter=THREE.NearestFilter;lut.generateMipmaps=false;lut.flipY=false;
const mats=ramps.map((_,row)=>{
 const mat=new THREE.MeshLambertMaterial({color:0xffffff});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.uRamp={value:lut};shader.uniforms.uRampRow={value:(row+.5)/ramps.length};
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nuniform sampler2D uRamp;\nuniform float uRampRow;');
  shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
   'float rampIntensity = 0.7;\n#if NUM_DIR_LIGHTS > 0\nrampIntensity = dot(normal, normalize(directionalLights[0].direction)) * 0.5 + 0.5;\n#endif\nrampIntensity *= getShadowMask();\nvec3 outgoingLight = texture2D(uRamp, vec2(clamp(rampIntensity,0.002,0.998),uRampRow)).rgb;');
 };
 mat.customProgramCacheKey=()=>`yali-ramp-${row}`;return mat;
});
const volumes=new THREE.Group(), surfaces=new THREE.Group(), outlines=new THREE.Group(), routeOverlay=new THREE.Group();
scene.add(surfaces,volumes,outlines,routeOverlay);routeOverlay.visible=false;
const roots=new Map<string,THREE.Group>(), pickables:THREE.Object3D[]=[], labels=new Map<string,{node:HTMLDivElement,point:THREE.Vector3}>();
const keyLabels=new Set(['01','02','03','06','08','10','11','13','15','17','18','20','23','24','25','26','27']);
const solidKinds=new Set(['building','music','auxiliary','context','toilet-pool','canteen']);
function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,pos:Vec3=[0,0,0]){
 const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,row=0){return mesh(new THREE.BoxGeometry(w,h,d),mats[row],parent,[x,y+h/2,z]);}
function line(points:number[][],parent:THREE.Object3D,colour='#829c8c',dash=false){
 const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p as Vec3)));
 const mat=dash?new THREE.LineDashedMaterial({color:colour,dashSize:2,gapSize:1.2}):new THREE.LineBasicMaterial({color:colour});
 const l=new THREE.Line(g,mat);if(dash)l.computeLineDistances();parent.add(l);return l;
}
function rect(parent:THREE.Object3D,minX:number,minZ:number,maxX:number,maxZ:number,y=.17,colour='#7d9688'){
 return line([[minX,y,minZ],[maxX,y,minZ],[maxX,y,maxZ],[minX,y,maxZ],[minX,y,minZ]],parent,colour);
}
function ribbon(points:Vec3[],width:number,row=2,y=.02,parent:THREE.Object3D=surfaces){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  if(len<.01)continue;
  const m=box(parent,width,.045,len,(a[0]+b[0])/2,y,(a[2]+b[2])/2,row);m.rotation.y=Math.atan2(dx,dz);m.castShadow=false;
 }
}
const [minX,minZ,maxX,maxZ]=layout.ground.bounds;
box(surfaces,maxX-minX,1.4,maxZ-minZ,(minX+maxX)/2,-1.5,(minZ+maxZ)/2,1);
box(surfaces,1600,.1,1600,50,-1.75,130,2);
box(surfaces,maxX-minX,.06,12,(minX+maxX)/2,-.04,-12,2);
line([[minX,0,-12],[maxX,0,-12]],outlines,'#f3efe0',true);
rect(outlines,minX,0,maxX,maxZ,.12,'#748e80');
for(const [a,b] of layout.navigation.edges){
 const pa=layout.navigation.nodes[a as keyof typeof layout.navigation.nodes] as Vec3,pb=layout.navigation.nodes[b as keyof typeof layout.navigation.nodes] as Vec3;
 const before=surfaces.children.length;
 ribbon([pa,pb],edgeWidth(layout,a,b));
 for(const o of surfaces.children.slice(before)){o.name=`road-${a}--${b}`;o.userData.route=[a,b];o.userData.width=edgeWidth(layout,a,b);}
 line([[pa[0],.3,pa[2]],[pb[0],.3,pb[2]]],routeOverlay,'#b2793f',true);
}
const grid=new THREE.GridHelper(360,36,'#6a8f85','#a7b9a9');grid.position.set(51,-.005,139);grid.visible=false;scene.add(grid);
const axes=new THREE.AxesHelper(16);axes.position.y=.2;scene.add(axes);
rect(outlines,-2,-2,2,2,.18,'#b38146');
const shortLabels:Record<string,string>={'10':'主席台','23':'沙坑','02':'侧门','20':'家属区','24':'音乐楼 · 4F','25':'主楼厕所','26':'池畔厕所','27':'校名石'};
function addLabel(f:Facility){if(!f.position)return;
 const node=document.createElement('div');node.className='facility-label';node.innerHTML=`<b>${f.id}</b>${shortLabels[f.id] ?? f.name.replace(/（.*?）/g,'').replace('旧主教学楼／教室','旧主教学楼')}`;
 node.onclick=()=>selectFacility(f.id,true);viewport.append(node);
 labels.set(f.id,{node,point:new THREE.Vector3(f.position[0],(f.size?.[1]??0)+1.8,f.position[2])});
}
function addFootprint(f:Facility){const p=footprint(f);if(!p)return;line([...p,p[0]].map((v:number[])=>[v[0],.2,v[1]]),outlines,'#779286',true);}
for(const f of layout.facilities){
 if(!f.position||!f.size)continue;
 const [x,y,z]=f.position,[w,h,d]=f.size,g=new THREE.Group();g.name=`F${f.id}`;g.userData.facility=f.id;g.position.set(x,y,z);roots.set(f.id,g);
 (['field','courts','straight-track','pool','forecourt','sandpit','garden','route','marker','subspace'].includes(f.kind)?surfaces:volumes).add(g);
 addFootprint(f);addLabel(f);
 if(buildB03Facility(f,g,{mats},b03Model) || buildB02Facility(f,g,{mats},b02Model) || batch01Facility(f,g,{mats},b01Model) || buildPatch02Gym(f,g,{box,mesh,line,rect,mats,layout},patchInput) || r4Facility(f,g,{box,mesh,line,rect,mats,layout}) || r3Facility(f,g,{box,mesh,line,rect,mats,layout}) || revisedFacility(f,g,{box,mesh,line,rect,mats,layout})) {
  // R2 builds real openings / larger envelopes without replacing unrelated facilities.
 } else if(solidKinds.has(f.kind)){
  if(f.kind==='context'){
    box(g,w,.1,d,0,0,0,5);
    for(const [px,pz,pw,pd,ph] of [[-13,-13,18,20,16],[13,-11,15,25,22],[-10,16,28,16,13],[17,18,11,15,18]])box(g,pw,ph,pd,px,0,pz,5);
  }else if(f.kind==='canteen'){
    box(g,w,7.2,d,0,3.6,0,0);box(g,w,.3,d,0,3.3,0,6);
    for(const px of [-w/2+1,0,w/2-1])for(const pz of [-d/2+1,d/2-1])box(g,.7,3.3,.7,px,0,pz,6);
  }else box(g,w,h,d,0,0,0,f.kind==='auxiliary'?6:0);
  if(f.floors&&f.floors>1&&f.kind!=='context')for(let j=1;j<f.floors;j++)rect(g,-w/2,-d/2,w/2,d/2,h*j/f.floors,'#809890');
  if(f.kind!=='context')box(g,w+.12,.24,d+.12,0,h+.02,0,6);
 } else if(f.kind==='teaching'){
   // A real open front corridor lets every floor bridge meet open space.
   box(g,w,h,d-2.1,0,0,1.05,0);
   for(let j=0;j<(f.floors??4);j++){
    box(g,w,.18,2.1,0,j*3.8,-d/2+1.05,6);
    for(let k=0;k<=12;k++)box(g,.32,3.6,.32,-w/2+.2+k*(w-.4)/12,j*3.8,-d/2+.18,6);
   }
 } else if(f.kind==='gym'){
   const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.62);s.lineTo(w*.29,h);s.lineTo(-w*.29,h);s.lineTo(-w/2,h*.62);s.closePath();
   mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),mats[0],g,[0,0,-d/2]);
   box(g,w-2,.3,3,0,3.8,-d/2+1.5,6);box(g,w*.54,.25,.16,0,h*.6,-d/2-.1,5);
 } else if(f.kind==='gate'){
   box(g,3,5.2,d,-w/2+1.5,0,0,0);box(g,4,7,d,w/2-2,0,0,0);box(g,w,1.6,d,0,5.2,0,0);
 } else if(f.kind==='stone'){
   const m=mesh(new THREE.IcosahedronGeometry(1,0),mats[7],g,[0,h/2,0]);m.scale.set(w/2,h/2,d/2);
 } else if(f.kind==='field'){
   const s=new THREE.Shape(),r=w/2,halfStraight=d/2-r;
   s.moveTo(-r,-halfStraight);s.absarc(0,-halfStraight,r,Math.PI,Math.PI*2,false);s.lineTo(r,halfStraight);s.absarc(0,halfStraight,r,0,Math.PI,false);s.closePath();
   const outer=mesh(new THREE.ShapeGeometry(s,40),mats[3],g,[0,.08,0]);outer.rotation.x=-Math.PI/2;outer.castShadow=false;
   const inner=mesh(new THREE.ShapeGeometry(s,40),mats[1],g,[0,.16,0]);inner.rotation.x=-Math.PI/2;inner.scale.set(.86,.88,1);inner.castShadow=false;
   for(const scale of [.94,.98]){const pts=s.getPoints(100).map(v=>[v.x*scale,.12,-v.y*(.98-(1-scale)*.4)]);line([...pts,pts[0]],g,'#e1dfca');}
   rect(g,-w*.31,-d*.32,w*.31,d*.32,.22,'#e8e8d2');line([[-w*.31,.22,0],[w*.31,.22,0]],g,'#e8e8d2');
 } else if(f.kind==='courts'){
   box(g,w,.08,d,0,0,0,1);
   for(const c of courtRects(layout)){
    rect(g,c.minX-x,c.minZ-z,c.maxX-x,c.maxZ-z,.11,'#f3eed8');
    line([[c.minX-x,.11,(c.minZ+c.maxZ)/2-z],[c.maxX-x,.11,(c.minZ+c.maxZ)/2-z]],g,'#f3eed8');
   }
 } else if(f.kind==='straight-track'){
   box(g,w,.08,d,0,0,0,3);for(let i=1;i<6;i++)line([[-w/2+w*i/6,.10,-d/2],[-w/2+w*i/6,.10,d/2]],g,'#e9dfc8');
 } else if(f.kind==='pool'){
   box(g,w,.15,d,0,0,0,4);rect(g,-w/2,-d/2,w/2,d/2,.18,'#dce5d9');
 } else if(f.kind==='sandpit')box(g,w,.12,d,0,0,0,7);
 else if(f.kind==='forecourt'){
   box(g,w,.08,d,0,0,0,2);box(g,2.6,.22,2.6,-8,.08,0,0);
   mesh(new THREE.CylinderGeometry(.07,.08,10,8),mats[6],g,[-8,5.3,0]);
 } else if(f.kind==='garden')box(g,w,.1,d,0,0,0,1);
 else if(f.kind==='subspace')box(g,w,h,d,0,0,0,5);
 else if(f.kind==='marker')rect(g,-w/2,-d/2,w/2,d/2,.12,'#a5825d');
 else if(f.kind==='rostrum')box(g,w,h,d,0,0,0,0);
 g.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.facility=f.id;pickables.push(o);}});
}
const extraStart=surfaces.children.length;
const {structures,roofs}=buildRevisionParts(layout,{volumes,surfaces,box,line,rect,roots,pickables});
const extraAnchored=p03Model?surfaces.children.slice(extraStart):[];
if(p03Model){
 // One sports datum, only millimetric render separation. Original R4 X/Z and indices stay intact.
 const field=roots.get('08')!;field.traverse(o=>{if(o instanceof THREE.Mesh)o.position.y=o===field.children[0]?.04:.044;else if(o instanceof THREE.Line){const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,.055);a.needsUpdate=true;}});
 roots.get('23')!.position.y=-.08;
 extraAnchored.forEach((o,i)=>{o.userData.terrainAnchor='08';o.position.y-=o instanceof THREE.Mesh?.125:i===extraAnchored.length-1?.175:.13;});
}

if(verticalScheme==='patch04'){const g=roots.get('06')!;g.children[0].position.y=0;g.traverse(o=>{if(o instanceof THREE.Line){const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,.046);}});}
const selection=new THREE.Box3Helper(new THREE.Box3(),0xbc8a45);selection.visible=false;scene.add(selection);
let selected='',view='overview',fly=false,tour=false,labelsOn=true,planOnly=false;
let theta=0,phi=0,pointerDown=false,pointerLast=[0,0],clickStart=[0,0],last=0;
const keys=new Set<string>();
const select=el<HTMLSelectElement>('facility');
for(const f of layout.facilities){const o=document.createElement('option');o.value=f.id;o.textContent=`${f.id}  ${f.name}${f.position?'':' · 未定位'}`;select.append(o);}
el('check-summary').textContent=`空间约束 ${report.results.filter(r=>r.passed).length} / ${report.results.length}`;
el('checks').innerHTML=report.results.map(r=>`<div>${r.passed?'✓':'✕'} ${r.id}</div>`).join('');
function toast(text:string){el('toast').textContent=text;el('toast').classList.add('visible');setTimeout(()=>el('toast').classList.remove('visible'),3200);}
function setInspector(open:boolean){el('inspector').hidden=!open;el('inspect-btn').setAttribute('aria-expanded',String(open));}
function selectFacility(id:string,focus=false){
 const f=layout.facilities.find(v=>v.id===id);if(!f)return;
 selected=id;select.value=id;setInspector(true);
 const b=f.position&&f.size?bounds(f):null;selection.visible=Boolean(b);
 if(b)selection.box.set(new THREE.Vector3(b.minX,.1,b.minZ),new THREE.Vector3(b.maxX,(f.size?.[1]??0)+.6,b.maxZ));
 el('details').innerHTML=`${terrainSystem&&f.position?`<div class="terrain-note">地坪适配：H ${(terrainSystem.model.anchors[f.id]?.floor??0).toFixed(2)} m；主门相对零点，非海拔。${terrainSystem.enabled?'当前已开启':'相对零地坪对照'}</div>`:''}<h3>${f.id} / ${f.name}</h3><span class="tag">${f.position?'H · 米制位置推定':'U · 未定位，不生成占地'}</span><dl><dt>工作中心</dt><dd>${f.position?f.position.map(n=>n.toFixed(2)).join(' / ')+' m':'无坐标'}</dd><dt>占地 × 高</dt><dd>${f.size?`${f.size[0]} × ${f.size[2]} / ${f.size[1]} m`:'尚未指定'}</dd><dt>楼层</dt><dd>${f.floors??'—'} ${f.floors?`[${f.evidence.floorCount}]`:''}</dd><dt>来源</dt><dd>${f.evidence.reference}</dd></dl><p>${f.note}</p><p><strong>后续核对：</strong>${f.evidence.unknowns}</p>`;
 if(focus&&f.position&&f.size){stopModes();active=camera;controls.enabled=true;topControls.enabled=false;
  const radius=Math.max(f.size[0],f.size[2],20);controls.target.set(...f.position as Vec3).y=Math.min(f.size[1]/2,9);
  camera.position.copy(controls.target).add(new THREE.Vector3(radius*.85,radius*.85,radius*1.15));controls.update();
 }
}
select.onchange=()=>selectFacility(select.value,true);
el('inspect-btn').onclick=()=>{if(!selected)selectFacility('01',false);else setInspector(el('inspector').hidden);};
el('close-inspector').onclick=()=>setInspector(false);
function stopModes(){fly=false;tour=false;keys.clear();el('fly-btn').classList.remove('active');el('tour-btn').classList.remove('active');el('help').textContent='拖动环绕 · 右键平移 · 滚轮缩放 · 点击体块查证';}
let toiletLevel=0;
function setToiletLevel(level:number,focus=false){
 toiletLevel=level;setToiletSection(roots,level);b01Bridge?.setSection(level);el<HTMLSelectElement>('toilet-level').value=String(level);
 if(focus&&level){stopModes();active=camera;controls.enabled=true;topControls.enabled=false;const y=(level-1)*3.8+(terrainSystem?.enabled?terrainSystem.model.anchors['25'].floor:0);camera.position.set(7,y+10,238);controls.target.set(-10,y+1,224);controls.update();}
}
function setView(name:string){
 const preset=cameraPresets[name];if(!preset)return;
 // Narrow screens keep B03 cameras in known free space, not inside B01.
 const p=(innerWidth<700&&name==='b03-library')?{...preset,position:[73,8.5,237.5],target:[73,8,247.2],fov:68}:(innerWidth<700&&name==='b03-canteen')?{...preset,position:[116,17,152],target:[153,6,152],fov:72}:preset;controls.maxPolarAngle=(name.startsWith('b02-')||name.startsWith('b03-'))?Math.PI*.85:Math.PI*.495;camera.fov=p.fov??43;camera.updateProjectionMatrix();setReviewShadow(p.target,(name.startsWith('b02-')||name.startsWith('b03-'))||name.startsWith('terrain-')||name.startsWith('gym-p02-')||name.startsWith('p03-')||name.startsWith('b01-')||(name.startsWith('r2-')||name.startsWith('r3-'))||name.startsWith('p04-'));stopModes();view=name;setToiletLevel(name==='r3-porch-plan'?1:name==='toilet-floor'||name==='b01-floor2'||name==='r2-floor2'?2:0);
 b01Bridge?.setMode((name==='r2-section'||name==='r3-section')?'section':(name==='r2-axis'||name==='r3-axis')?'axis':'normal');
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.view===name));
 active=(name==='top'||(name==='r2-axis'||name==='r3-axis'))?topCamera:camera;controls.enabled=(name!=='top'&&name!=='r2-axis');topControls.enabled=(name==='top'||(name==='r2-axis'||name==='r3-axis'));
 active.position.set(...p.position as Vec3);active.up.set(...((name==='top'||(name==='r2-axis'||name==='r3-axis'))?[0,0,-1]:[0,1,0]) as Vec3);
 ((name==='top'||(name==='r2-axis'||name==='r3-axis'))?topControls:controls).target.set(...p.target as Vec3);if(innerWidth<700&&!name.startsWith('b03-')&&((name.startsWith('b02-')||name.startsWith('b03-'))||name.startsWith('b01-')||(name.startsWith('r2-')||name.startsWith('r3-')))&&name!=='r2-axis'){const t=new THREE.Vector3(...p.target as Vec3);active.position.sub(t).multiplyScalar((name.startsWith('b02-')||name.startsWith('b03-'))?1.9:2.6).add(t);}
 active.lookAt(...p.target as Vec3);
 if((name==='top'||(name==='r2-axis'||name==='r3-axis'))){topCamera.zoom=(name==='r2-axis'||name==='r3-axis')?1.5:1;topCamera.updateProjectionMatrix();}controls.update();topControls.update();
 el('view-name').innerHTML=`${p.label}<span>B03 图书馆 / 后花园 / 食堂 · 待校友审阅｜B01、B02 已认可</span>`;
}
for(const btn of document.querySelectorAll<HTMLButtonElement>('[data-view]'))btn.onclick=()=>setView(btn.dataset.view!);
el<HTMLSelectElement>('toilet-level').onchange=e=>setToiletLevel(Number((e.target as HTMLSelectElement).value),true);
el<HTMLInputElement>('labels-check').onchange=e=>labelsOn=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('roofs-check').onchange=e=>roofs.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('grid-check').onchange=e=>grid.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('routes-check').onchange=e=>routeOverlay.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('footprints-check').onchange=e=>{planOnly=(e.target as HTMLInputElement).checked;volumes.visible=!planOnly;roots.get('12')!.visible=!planOnly;if(planOnly)setView('top');};
function download(name:string,data:Blob|string){const u=typeof data==='string'?data:URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=name;a.click();if(typeof data!=='string')setTimeout(()=>URL.revokeObjectURL(u),1000);}
el('download-layout').onclick=()=>download(`campus-layout-${layout.version}.json`,new Blob([JSON.stringify(layout,null,2)],{type:'application/json'}));
el('capture-btn').onclick=()=>{renderer.render(scene,active);download(`yali-M11A-${view}.png`,renderer.domElement.toDataURL('image/png'));toast('已输出当前场景截图。');};
el('fly-btn').onclick=()=>{setReviewShadow([45,0,135],false);
 if(fly){setView(view);return;}stopModes();fly=true;active=camera;controls.enabled=topControls.enabled=false;camera.up.set(0,1,0);
 const direction=camera.getWorldDirection(new THREE.Vector3());phi=Math.asin(direction.y);theta=Math.atan2(-direction.x,-direction.z);
 el('fly-btn').classList.add('active');el('help').textContent='WASD 平移 · Q/R 升降 · 拖动观察 · Shift 加速 · Esc 退出（无碰撞）';toast('自由校核相机：允许穿过体量检查，不是人物控制器。');
};
const tourPath=layout.navigation.tourPath;
let tourEdge=0,tourT=0;
el('tour-btn').onclick=()=>{setReviewShadow([45,0,135],false);if(tour){setView('overview');return;}stopModes();tour=true;active=camera;controls.enabled=topControls.enabled=false;camera.up.set(0,1,0);tourEdge=tourT=0;const start=layout.navigation.nodes[tourPath[0] as keyof typeof layout.navigation.nodes],next=layout.navigation.nodes[tourPath[1] as keyof typeof layout.navigation.nodes];camera.position.set(start[0],groundEye(start[0],start[2]),start[2]);camera.lookAt(next[0],groundEye(next[0],next[2]),next[2]);el('tour-btn').classList.add('active');el('help').textContent='沿连通图进行地面路线巡览 · 点击停止或 Esc · 不是物理角色';};
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=true;pointerLast=clickStart=[e.clientX,e.clientY];});
window.addEventListener('pointerup',e=>{
 if(pointerDown&&!fly&&!tour&&Math.hypot(e.clientX-clickStart[0],e.clientY-clickStart[1])<5){
  const r=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),active);
  const hit=ray.intersectObjects(pickables.filter(v=>!planOnly||v.parent?.parent!==volumes),false)[0];if(hit?.object.userData.facility)selectFacility(hit.object.userData.facility);
 }pointerDown=false;
});
window.addEventListener('pointermove',e=>{if(pointerDown&&fly){theta-=(e.clientX-pointerLast[0])*.004;phi=THREE.MathUtils.clamp(phi-(e.clientY-pointerLast[1])*.004,-1.45,1.45);pointerLast=[e.clientX,e.clientY];}});
window.addEventListener('keydown',e=>{if((e.target as HTMLElement)?.matches('input,select,textarea'))return;if(e.key==='Escape'){setView(view);setInspector(false);return;}keys.add(e.code);if(fly&&['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyR','Space'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();pointerDown=false;});
function resize(){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 const aspect=innerWidth/innerHeight;const half=Math.max(190,175/aspect);
 topCamera.left=-half*aspect;topCamera.right=half*aspect;topCamera.top=half;topCamera.bottom=-half;topCamera.updateProjectionMatrix();
}window.addEventListener('resize',resize);resize();
const projected=new THREE.Vector3();
function render(time:number){
 const dt=Math.min((time-last)/1000||0,.05);last=time;
 if(fly){
  const speed=(keys.has('ShiftLeft')?65:18)*dt,forward=new THREE.Vector3(-Math.sin(theta),0,-Math.cos(theta)),right=new THREE.Vector3(Math.cos(theta),0,-Math.sin(theta));
  const movement=new THREE.Vector3();if(keys.has('KeyW'))movement.add(forward);if(keys.has('KeyS'))movement.sub(forward);if(keys.has('KeyD'))movement.add(right);if(keys.has('KeyA'))movement.sub(right);
  if(keys.has('KeyR'))movement.y+=1;if(keys.has('KeyQ'))movement.y-=1;if(movement.lengthSq())camera.position.addScaledVector(movement.normalize(),speed);
  camera.position.y=Math.max(.8,camera.position.y);camera.rotation.order='YXZ';camera.rotation.set(phi,theta,0);
 }else if(tour){
  const a=layout.navigation.nodes[tourPath[tourEdge] as keyof typeof layout.navigation.nodes],b=layout.navigation.nodes[tourPath[(tourEdge+1)%tourPath.length] as keyof typeof layout.navigation.nodes];
  const len=Math.hypot(b[0]-a[0],b[2]-a[2]);tourT+=dt*12/Math.max(len,1);
  if(tourT>=1){tourT=0;tourEdge++;if(tourEdge>=tourPath.length-1){setView('overview');return;}}
  const tx=THREE.MathUtils.lerp(a[0],b[0],tourT),tz=THREE.MathUtils.lerp(a[2],b[2],tourT);camera.position.set(tx,groundEye(tx,tz),tz);const lt=Math.min(1,tourT+3/Math.max(len,1)),lx=THREE.MathUtils.lerp(a[0],b[0],lt),lz=THREE.MathUtils.lerp(a[2],b[2],lt);camera.lookAt(lx,groundEye(lx,lz),lz);
 }else {if(controls.enabled)controls.update();if(topControls.enabled)topControls.update();}
 renderer.render(scene,active);
 for(const [id,label] of labels){
  projected.copy(label.point).project(active);const visible=labelsOn&&(keyLabels.has(id)||selected===id||view==='sports'&&['04','05','24','26','28'].includes(id)||view==='teaching'&&id==='25')&&projected.z<1&&projected.z>-1;
  label.node.style.display=visible?'block':'none';const ox=view==='top'?(id==='27'?-35:id==='02'?35:0):0,oy=view==='top'?(id==='01'?-18:['02','27'].includes(id)?8:0):0;label.node.style.left=`${(projected.x*.5+.5)*innerWidth+ox}px`;label.node.style.top=`${(-projected.y*.5+.5)*innerHeight+oy}px`;label.node.classList.toggle('selected',selected===id);
 }
}
setView('r3-overview');renderer.setAnimationLoop(render);
buildR3Thresholds(layout,{surfaces,box});
terrainSystem=installTerrain({scene,surfaces,volumes,outlines,routeOverlay,roots,labels,layout,box,mats,structures,reportOverride:report,modelOverride:currentModel,extraAnchored},terrainSpec);
function setTerrain(_on:boolean){terrainSystem.setEnabled(true);el<HTMLInputElement>('terrain-check').checked=true;el('terrain-state').textContent=verticalScheme==='patch04'?'已确认 P4 基底 · 1×':verticalScheme==='patch03'?'P3 高程对照 · 1×':'P2 高程对照 · 1×';if(selected)selectFacility(selected,false);}
function changeVertical(scheme:string){const u=new URL(location.href);u.searchParams.set('vertical',scheme);u.searchParams.set('view',view);location.href=u.href;}
if(p03Model)p03Geometry=installPatch03Geometry({scene,surfaces,volumes,mats,box},p03Model);
if(verticalScheme==='patch04')installPatch04Geometry({scene,surfaces,volumes,roots,terrainSystem,box,mats,layout},currentModel,patch04Input);
finishB03Integration({scene,roots,mats},b03Model);
b01Bridge=installR3Details({volumes,roots,structures,mats,scene,renderer,site:patch04Input,terrain:currentModel??terrainSystem.model},b01Model);
setToiletLevel(0);

el<HTMLInputElement>('terrain-check').onchange=e=>setTerrain((e.target as HTMLInputElement).checked);
el('terrain-compare').onclick=()=>changeVertical(verticalScheme==='patch04'?'patch03':'patch04');
el<HTMLSelectElement>('vertical-scheme').value=verticalScheme;el<HTMLSelectElement>('vertical-scheme').onchange=e=>changeVertical((e.target as HTMLSelectElement).value);
for(const c of document.querySelectorAll<HTMLInputElement>('[data-p03-debug]'))c.onchange=()=>p03Geometry?.setDebug(c.dataset.p03Debug!,c.checked);
el('terrain-export').onclick=()=>download('yali-m11a-terrain-working.json',new Blob([JSON.stringify(terrainSystem.model.exportData(),null,2)],{type:'application/json'}));
el('terrain-summary').textContent=`地坪检查 ${terrainSystem.report.results.filter((x:any)=>x.passed).length}/${terrainSystem.report.results.length}`;
el('terrain-checks').innerHTML=terrainSystem.report.results.map((r:any)=>`<div>${r.passed?'✓':'✕'} ${r.id}</div>`).join('');
Object.assign(window,{__YALI_M11A__:{ready:true,version:terrainSpec.version,state:()=>terrainSystem.state(),setEnabled:setTerrain,
 inspect:terrainSystem.inspect,groundEye,probeGround:terrainSystem.probeGround,probeActual:terrainSystem.probeActual,
 exportData:()=>terrainSystem.model.exportData(),setView,model:terrainSystem.model,
 getRoots:()=>Object.fromEntries([...roots].map(([id,g])=>[id,g.position.toArray()]))}});
setTerrain(true);
const params=new URLSearchParams(location.search);if(params.has('view'))setView(params.get('view')!);if(params.get('clean')==='1')document.body.classList.add('clean');
function probeSegment(a:number[],b:number[]){
 scene.updateMatrixWorld(true);
 const origin=new THREE.Vector3(...a as Vec3),end=new THREE.Vector3(...b as Vec3),distance=origin.distanceTo(end);
 const ray=new THREE.Raycaster(origin,end.sub(origin).normalize(),.001,Math.max(.001,distance-.001));
 const meshes:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.geometry)meshes.push(o);});
 return ray.intersectObjects(meshes,false).map(h=>({name:h.object.name,facility:h.object.userData.facility||null,distance:h.distance}));
}
function geometrySnapshot(){
 scene.updateMatrixWorld(true);
 const snapshot:any={};const extra:THREE.Object3D[]=[];roots.get('25')?.traverse(o=>{if(o.name)extra.push(o);});extra.push(...surfaces.children.filter(o=>o.name.startsWith('road-')));
 for(const object of [...extra,...roots.values(),...roots.get('20')!.children,structures,...structures.children,roofs,...roofs.children,...structures.children.filter(v=>v!==roofs)]){
  const bb=new THREE.Box3().setFromObject(object);snapshot[object.name]={min:bb.min.toArray(),max:bb.max.toArray(),visible:object.visible};
 }
 return snapshot;
}
Object.assign(window,{__YALI_M10__:{version:layout.version,layout,report,setView,selectFacility,setToiletLevel,probeSegment,geometrySnapshot,
 probeFloor:(x:number,y:number,z:number)=>{scene.updateMatrixWorld(true);const objects:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)objects.push(o);});const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.5,z),new THREE.Vector3(0,-1,0),0,.8);return ray.intersectObjects(objects,false).map(h=>({name:h.object.name,y:h.point.y}));},
 probeSurface:(x:number,z:number)=>{scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,3,z),new THREE.Vector3(0,-1,0),0,3.1);return ray.intersectObjects(surfaces.children,true).filter(h=>h.point.y>0).map(h=>({name:h.object.name,y:h.point.y}));},
 getState:()=>({toiletLevel,view,fly,tour,selected,camera:active.position.toArray(),renderer:renderer.info.render,canvas:[renderer.domElement.width,renderer.domElement.height],labelsOn,planOnly,roofsVisible:roofs.visible,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION)}),ready:true}});

// Patch02 diagnostics expose the actual rendered shell and supported gallery route.
let gymCutaway=false;
el<HTMLInputElement>('gym-cutaway').onchange=e=>{gymCutaway=(e.target as HTMLInputElement).checked;setGymCutaway(roots,gymCutaway);};
function visibleMeshList(){const list:THREE.Object3D[]=[];scene.traverse((o:any)=>{let a:THREE.Object3D|null=o;while(a){if(!a.visible)return;a=a.parent;}if(o instanceof THREE.Mesh)list.push(o);});return list;}
function p02Support(x:number,y:number,z:number){scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.35,z),new THREE.Vector3(0,-1,0),0,.7);return ray.intersectObjects(visibleMeshList(),false).map(v=>({name:v.object.name,y:v.point.y,role:v.object.userData.role}));}
function p02Snapshot(){scene.updateMatrixWorld(true);const d:any={};scene.traverse(o=>{if(o.name.startsWith('P02-')){const b=new THREE.Box3().setFromObject(o);d[o.name]={min:b.min.toArray(),max:b.max.toArray(),role:o.userData.role,visible:o.visible};}});return d;}
Object.assign(window,{__YALI_P02__:{ready:true,version:patchInput.version,layout,report,parameters:patchInput,source,
 geometrySnapshot:p02Snapshot,support:p02Support,probe:terrainSystem.probeActual,
 galleryRoute:()=>b02Model.routes.find((r:any)=>r.id==='spectator')!.points,legacyParametersOnly:true,
 setCutaway:(v:boolean)=>{gymCutaway=v;el<HTMLInputElement>('gym-cutaway').checked=v;setGymCutaway(roots,v);},
 getState:()=>({gymCutaway,terrain:terrainSystem.enabled}),
 exportData:()=>({layout,terrain:terrainSystem.model.exportData(),patch:patchInput,checks:report})}});

Object.assign(window,{__YALI_P03__:{ready:true,verticalScheme,input:patch03Input,report,
 model:p03Model,setView,setDebug:(name:string,on:boolean)=>p03Geometry?.setDebug(name,on),
 support:p02Support,probe:terrainSystem.probeActual,geometrySnapshot:()=>p03Geometry?.snapshot(),
 renderNow:()=>renderer.render(scene,active),glError:()=>renderer.getContext().getError(),
 getState:()=>({verticalScheme,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,contextLost:renderer.getContext().isContextLost()}),
 surfaceHits:(x:number,z:number)=>{scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0),0,50);return ray.intersectObjects(visibleMeshList(),false).map(h=>({name:h.object.name,facility:h.object.userData.facility,y:h.point.y}));}
}});
renderer.domElement.addEventListener('webglcontextlost',()=>{el('error').hidden=false;el('error').textContent='WebGL上下文丢失，请重新载入；当前为静态校园校核场景。';});

Object.assign(window,{__YALI_B01__:{ready:true,input:batch01Input,model:b01Model,report:b01Report,setView,setSection:setToiletLevel,
 renderNow:()=>renderer.render(scene,active),support:p02Support,probe:terrainSystem.probeActual,
 getState:()=>({view,verticalScheme,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION),glError:renderer.getContext().getError(),contextLost:renderer.getContext().isContextLost(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:active.position.toArray()}),
 snapshot:()=>{scene.updateMatrixWorld(true);const out:any={};scene.traverse(o=>{if(o.name.startsWith('B01-')||(o.name.startsWith('R2-')||o.name.startsWith('R3-'))||o.name.startsWith('P04-')){const b=new THREE.Box3().setFromObject(o);out[o.name]={min:b.min.toArray(),max:b.max.toArray(),visible:o.visible,role:o.userData.role};}});return out;},
 countFlags:()=>visibleMeshList().filter(o=>o.name.startsWith('P04-flagpole-')).length,
 setLabels:(on:boolean)=>{labelsOn=on;},
 exportData:()=>b01Model.exportData()
}});

Object.assign(window,{__YALI_R2__:{...((window as any).__YALI_B01__),layout,baseLayout:patch.layout,changes:effective.changes,site:patch04Input,setAxis:(on:boolean)=>b01Bridge.setAxis(on),detailState:()=>b01Bridge.state()}});
labelsOn=false;el<HTMLInputElement>('labels-check').checked=false;
el<HTMLInputElement>('r2-axis-check').onchange=e=>b01Bridge.setAxis((e.target as HTMLInputElement).checked);

Object.assign(window,{__YALI_R3__:{...((window as any).__YALI_R2__),r3:revision3Input,model:b01Model,report:b01Report,baseLayout:r2Layout,terrain:currentModel}});

// B02 access diagnostics raycast the FULL visible scene, not a proxy or flight path.
Object.assign(window,{__YALI_B02__:{ready:true,version:batch02Input.version,input:batch02Input,model:b02Model,layout,
 setView,support:p02Support,probe:terrainSystem.probeActual,setLabels:(on:boolean)=>{labelsOn=on;},
 renderNow:()=>renderer.render(scene,active),getState:()=>({view,verticalScheme,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION),glError:renderer.getContext().getError(),contextLost:renderer.getContext().isContextLost(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:active.position.toArray()}),
 snapshot:()=>{scene.updateMatrixWorld(true);return visibleMeshList().filter(o=>o.name.startsWith('B02-')||o.name.startsWith('P02-GYM-')).map(o=>{const b=new THREE.Box3().setFromObject(o);return {name:o.name,role:o.userData.role,min:b.min.toArray(),max:b.max.toArray()};});},
 checkAccess:()=>{
  scene.updateMatrixWorld(true);const meshes=visibleMeshList();
  const ray=(a:number[],b:number[])=>{const o=new THREE.Vector3(...a as Vec3),end=new THREE.Vector3(...b as Vec3),len=o.distanceTo(end);if(len<.004)return [];return new THREE.Raycaster(o,end.sub(o).normalize(),.002,len-.002).intersectObjects(meshes,false).map(h=>({name:h.object.name,distance:h.distance,y:h.point.y}));};
  const result=[];
  for(const r of b02Model.routes){const bad:any[]=[],points=r.points;let supports=0,clearances=0,maxRiser=0;
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=len?-dz/len:0,nz=len?dx/len:0;
    maxRiser=Math.max(maxRiser,Math.abs(a[1]-b[1]));
    // Consecutive tread-centre transitions stay above both nosings; check at three widths.
    for(const off of [-.38,0,.38]){
     const h=Math.max(a[1],b[1]);
     for(const dy of [.25,1.1,1.9]){clearances++;const hits=ray([a[0]+nx*off,h+dy,a[2]+nz*off],[b[0]+nx*off,h+dy,b[2]+nz*off]);if(hits.length)bad.push({kind:'body',segment:i,off,dy,hits:hits.slice(0,3)});}
     const N=Math.max(1,Math.ceil(len/.7));
     for(let j=0;j<=N;j++){
      const u=j/N,x=a[0]+dx*u+nx*off,z=a[2]+dz*u+nz*off,y=a[1]+(b[1]-a[1])*u;
      supports++;const hits=ray([x,y+.23,z],[x,y-.23,z]);
      const floor=hits.find(q=>Math.abs(q.y-y)<.2);
      if(!floor)bad.push({kind:'floor',segment:i,off,q:[x,y,z],hits:hits.slice(0,2)});
      // Vertical capsule clearance from the ACTUAL support height catches overhead slabs.
      if(floor){clearances++;const overhead=ray([x,floor.y+.19,z],[x,floor.y+1.9,z]);if(overhead.length)bad.push({kind:'head',segment:i,off,q:[x,floor.y,z],hits:overhead.slice(0,3)});}
     }
    }
   }
   result.push({id:r.id,label:r.label,supports,clearances,maxWaypointRise:maxRiser,bad:bad.slice(0,30),failures:bad.length});
  }
  // Check across near the full portal width and height, independent of route centre.
  const doors=b02Model.portals.map((d:any)=>{const n=new THREE.Vector3(...d.normal as Vec3).normalize(),side=new THREE.Vector3(n.z,0,-n.x),c=new THREE.Vector3(...d.center as Vec3),bad:any[]=[];let probes=0;
   for(const off of [-d.width/2+.18,0,d.width/2-.18])for(const h of [.25,1.5,d.height-.2]){const q=c.clone().addScaledVector(side,off);q.y=d.floor+h;const a=q.clone().addScaledVector(n,.55),b=q.clone().addScaledVector(n,-.55);probes++;const hits=ray(a.toArray(),b.toArray());if(hits.length)bad.push({off,h,hits});}return {id:d.id,probes,bad};});
  return {routes:result,doors,sharedWallBlocked:ray([-60,4.9,65.3],[-60,4.9,66.7]).length>0,legacyGymCount:meshes.filter(o=>o.name.startsWith('P02-GYM-')&&o.userData.facility==='03').length,retainedSiteNames:meshes.filter(o=>o.name==='P02-GYM-FORECOURT').map(o=>o.name)};
 }
}});
if(!params.has('view'))setView(innerWidth<700?'b03-library':'b03-canteen');

el<HTMLSelectElement>('b02-view-select').onchange=e=>setView((e.target as HTMLSelectElement).value);

Object.assign(window,{__YALI_B03__:{...((window as any).__YALI_B02__),ready:true,version:batch03Input.version,input:batch03Input,model:b03Model,terrain:currentModel,checkAccess:()=>checkB03Access(scene,visibleMeshList(),b03Model)}});
