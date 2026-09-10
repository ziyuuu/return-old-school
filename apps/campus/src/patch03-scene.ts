import * as THREE from 'three';
/** Render the actual pit edges/access solids, not decals or a generated illustration. */
export function installPatch03Geometry(api:any, model:any){
 const {scene,surfaces,volumes,mats,box}=api,p=model.p;
 const solid=new THREE.Group();solid.name='P03-terrain-structures';volumes.add(solid);
 const access=new THREE.Group();access.name='P03-access-surfaces';surfaces.add(access);
 const debug=new THREE.Group();debug.name='P03-debug';scene.add(debug);
 const materialParts:Record<string,THREE.BufferGeometry[]>={wall:[],edge:[],railing:[],fence:[]};
 function beam(type:string,a:number[],b:number[],w:number,h:number){const A=new THREE.Vector3(...a as [number,number,number]),B=new THREE.Vector3(...b as [number,number,number]),d=B.clone().sub(A),g=new THREE.BoxGeometry(w,h,d.length()),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());g.applyMatrix4(new THREE.Matrix4().compose(A.add(B).multiplyScalar(.5),q,new THREE.Vector3(1,1,1)));materialParts[type].push(g);}
 function post(type:string,x:number,y:number,z:number,h:number,w=.07){const g=new THREE.BoxGeometry(w,h,w);g.translate(x,y+h/2,z);materialParts[type].push(g);}
 function wedge(type:string,a:number[],b:number[],bottom:number,ya:number,yb:number,width:number){
  if(Math.max(ya,yb)<=bottom+.001)return;
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rx=dz/len*width/2,rz=-dx/len*width/2;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([a[0]-rx,bottom,a[1]-rz,a[0]+rx,bottom,a[1]+rz,b[0]+rx,bottom,b[1]+rz,b[0]-rx,bottom,b[1]-rz,a[0]-rx,ya,a[1]-rz,a[0]+rx,ya,a[1]+rz,b[0]+rx,yb,b[1]+rz,b[0]-rx,yb,b[1]-rz],3));g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);g.computeVertexNormals();materialParts[type].push(g);
 }
 for(let j=0;j<model.boundary.length;j++){
  const a=model.boundary[j],b=model.boundary[(j+1)%model.boundary.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.5);
  for(let i=0;i<n;i++){
   const A=[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n],B=[a[0]+(b[0]-a[0])*(i+1)/n,a[1]+(b[1]-a[1])*(i+1)/n],x=(A[0]+B[0])/2,z=(A[1]+B[1])/2;
   if(model.openingAt(x,z))continue;
   const ya=model.boundaryTop(...A),yb=model.boundaryTop(...B),type=x>120?'fence':'railing';
   wedge('wall',A,B,p.field.lower-.10,ya,yb,p.barrier.retainingThickness);
   beam('edge',[A[0],ya+.025,A[1]],[B[0],yb+.025,B[1]],.32,p.barrier.edgeCapHeight);
   for(const h of type==='fence'?[.35,.68,1.05]:[.50,1.05])beam(type,[A[0],ya+h,A[1]],[B[0],yb+h,B[1]],.045,.045);
   if(i%5===0||i===0||model.openingAt(A[0]-(B[0]-A[0])*.5,A[1]-(B[1]-A[1])*.5))post(type,A[0],ya,A[1],p.barrier.railingHeight);
   if(type==='fence')post(type,x,(ya+yb)/2,z,p.barrier.fenceHeight,.028);
  }
 }
 const ramp=p.access.find((a:any)=>a.kind==='ramp'),[rx,rz,rx1,rz1]=ramp.bounds;
 // Hold the upper road beside the carved ramp. The ramp remains open at its head and field-side landing.
 for(const [A,B]of [[[rx1,rz],[rx1,rz1]],[[rx1,rz1],[rx,rz1]]]){
  const n=Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1]));for(let i=0;i<n;i++){const a=[A[0]+(B[0]-A[0])*i/n,A[1]+(B[1]-A[1])*i/n],b=[A[0]+(B[0]-A[0])*(i+1)/n,A[1]+(B[1]-A[1])*(i+1)/n];wedge('wall',a,b,Math.min(model.rampHeight(...a),model.rampHeight(...b))-.08,3,3,.22);}}
 beam('railing',[rx1,4.05,rz],[rx1,4.05,rz1],.05,.05);beam('railing',[rx1,3.5,rz],[rx1,3.5,rz1],.05,.05);
 for(let z=rz;z<=rz1;z+=2.2)post('railing',rx1,3,z,1.05);
 function merged(name:string,geos:THREE.BufferGeometry[],row:number){const pos:number[]=[],idx:number[]=[];for(const g of geos){const a=g.getAttribute('position');const start=pos.length/3;for(let i=0;i<a.count;i++)pos.push(a.getX(i),a.getY(i),a.getZ(i));if(g.index)for(const v of g.index.array)idx.push(start+v);else for(let i=0;i<a.count;i++)idx.push(start+i);g.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,mats[row]);m.name=name;m.userData={role:name,evidence:'H',terrain:true};m.castShadow=m.receiveShadow=true;solid.add(m);return m;}
 const categories:any={};for(const [type,geos]of Object.entries(materialParts))categories[type]=merged('P03-'+type,geos,type==='wall'?6:type==='edge'?0:5);
 function path(id:string,a:number[],b:number[],width:number){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/.4)),pos:number[]=[],idx:number[]=[];for(let i=0;i<=n;i++)for(const side of [-1,1]){const x=a[0]+dx*i/n+side*dz/len*width/2,z=a[1]+dz*i/n-side*dx/len*width/2;pos.push(x,model.groundHeight(x,z)+.044,z);}for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mats[2]);m.name=id;m.userData={role:'access',hypothesis:true};m.receiveShadow=true;access.add(m);}
 for(const a of p.access){if(a.id!=='P03-ROSTRUM')path(a.id+'-approach',a.approach[0],a.approach[1],a.width);path(a.id+'-landing',a.landing[0],a.landing[1],a.width);}
 const deck=box(solid,4,1.24,16,14,1.8,110,6);deck.name='P03-ROSTRUM-upper-deck';deck.userData.role='upper-stage-access';
 // Procedural debug overlays, always optional and never a substitute for terrain solids.
 const debugGroups:any={};for(const name of ['terrain elevation','retaining edge','fence/railing','access points','slope profile']){const g=new THREE.Group();g.name='P03-debug-'+name;g.visible=false;debug.add(g);debugGroups[name]=g;}
 function line(points:number[][],group:THREE.Group,color:number){const g=new THREE.BufferGeometry().setFromPoints(points.map(a=>new THREE.Vector3(...a as [number,number,number])));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,depthTest:false}));l.renderOrder=50;group.add(l);}
 for(const z of [2,10,34,44,80,114,188,198])line(Array.from({length:121},(_,i)=>{const x=-20+i*1.2;return[x,model.groundHeight(x,z)+.1,z]}),debugGroups['terrain elevation'],0x12647e);
 for(let i=0;i<model.boundary.length;i++){const a=model.boundary[i],b=model.boundary[(i+1)%model.boundary.length];line([[a[0],3.12,a[1]],[b[0],3.12,b[1]]],debugGroups['retaining edge'],0xc87823);}
 for(const a of p.access){line([[a.start[0],a.kind==='ramp'?3.14:1.94,a.start[1]],[a.end[0],a.kind==='ramp'?1.94:3.14,a.end[1]]],debugGroups['access points'],0x106c48);const c=a.kind==='ramp'?[121,168]:a.end;line([[c[0],1.8,c[1]],[c[0],5,c[1]]],debugGroups['access points'],0x106c48);}
 line(Array.from({length:49},(_,z)=>[4.2,model.upperHeight(0,z)+.15,z]),debugGroups['slope profile'],0xb84928);
 for(const z of [2,10,34,44])line([[4.2,0,z],[4.2,model.upperHeight(0,z)+.4,z]],debugGroups['slope profile'],0xb84928);
 const barrierDebug=new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(14,1.8,42),new THREE.Vector3(125,4.05,188)),0x684996);debugGroups['fence/railing'].add(barrierDebug);
 function setDebug(name:string,on:boolean){if(debugGroups[name])debugGroups[name].visible=on;return !!debugGroups[name]?.visible;}
 function snapshot(){scene.updateMatrixWorld(true);const result:any={};for(const parent of [solid,access])parent.traverse((o:any)=>{if(o instanceof THREE.Mesh){const b=new THREE.Box3().setFromObject(o);result[o.name]={min:b.min.toArray(),max:b.max.toArray(),role:o.userData.role};}});return result;}
 return{solid,access,debug,setDebug,snapshot};
}
