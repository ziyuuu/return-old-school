import * as THREE from 'three';
/** Lossless vertex reuse. No position rounding, normal smoothing, decimation,
 * face removal or triangle reordering. All float attribute bits must match.
 * A typed hash table avoids millions of transient string keys at startup.
 */
export function indexExactGeometry(geometry) {
  const attributes=Object.entries(geometry.attributes),count=geometry.attributes.position?.count??0;
  if(geometry.index||count<256||geometry.morphAttributes.position?.length||attributes.some(([,a])=>a.isInterleavedBufferAttribute||!(a.array instanceof Float32Array)||a.count!==count))return {changed:false,verticesBefore:count,verticesAfter:count};
  const specs=attributes.map(([name,a])=>({name,a,bits:new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length)}));
  let capacity=1;while(capacity<count*1.5)capacity*=2;
  const table=new Int32Array(capacity).fill(-1),representatives=new Uint32Array(count),indices=new Uint32Array(count);let unique=0;
  for(let i=0;i<count;i++){
    let hash=2166136261;
    for(const s of specs)for(let j=0;j<s.a.itemSize;j++){hash=Math.imul(hash^s.bits[i*s.a.itemSize+j],16777619);}
    hash^=hash>>>16;let slot=hash&(capacity-1);
    for(;;){
      const entry=table[slot];
      if(entry===-1){table[slot]=unique;representatives[unique]=i;indices[i]=unique++;break;}
      const other=representatives[entry];let equal=true;
      for(const s of specs){for(let j=0;j<s.a.itemSize;j++)if(s.bits[i*s.a.itemSize+j]!==s.bits[other*s.a.itemSize+j]){equal=false;break;}if(!equal)break;}
      if(equal){indices[i]=entry;break;}slot=(slot+1)&(capacity-1);
    }
  }
  const stride=specs.reduce((n,s)=>n+s.a.itemSize*4,0);
  if(unique*stride+indices.byteLength>=count*stride)return {changed:false,verticesBefore:count,verticesAfter:count};
  for(const s of specs){
    const output=new Float32Array(unique*s.a.itemSize),bits=new Uint32Array(output.buffer);
    for(let i=0;i<unique;i++)for(let j=0;j<s.a.itemSize;j++)bits[i*s.a.itemSize+j]=s.bits[representatives[i]*s.a.itemSize+j];
    const attr=new THREE.BufferAttribute(output,s.a.itemSize,s.a.normalized);attr.setUsage(s.a.usage);attr.name=s.a.name;
    geometry.setAttribute(s.name,attr);
  }
  geometry.setIndex(new THREE.BufferAttribute(indices,1));
  return {changed:true,verticesBefore:count,verticesAfter:unique};
}
export function packCampusGeometry(scene) {
  const start=performance.now(),seen=new Set();let changed=0,verticesBefore=0,verticesAfter=0,bytesBefore=0,bytesAfter=0,trianglesBefore=0,trianglesAfter=0;
  const bytes=g=>Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);
  scene.traverse(o=>{if(!o.isMesh||o.userData.player||seen.has(o.geometry))return;const g=o.geometry;seen.add(g);
    bytesBefore+=bytes(g);trianglesBefore+=(g.index?.count??g.attributes.position.count)/3;
    const r=indexExactGeometry(g);changed+=Number(r.changed);verticesBefore+=r.verticesBefore;verticesAfter+=r.verticesAfter;
    bytesAfter+=bytes(g);trianglesAfter+=(g.index?.count??g.attributes.position.count)/3;
  });
  return {method:'Bit-exact index reuse across every attribute; all faces and winding retained',changed,verticesBefore,verticesAfter,bytesBefore,bytesAfter,trianglesBefore,trianglesAfter,initializationMs:performance.now()-start};
}
