import * as THREE from 'three';
/** Non-box B04 solids. Shape paths are actual geometry, including every arch/window hole. */
export function b04Geometry(p){
  const vec=q=>new THREE.Vector3(...q);
  if(p.shape==='rod'){
    const a=vec(p.a),b=vec(p.b),g=new THREE.CylinderGeometry(p.radius,p.radius,a.distanceTo(b),48);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());return g;
  }
  if(p.shape==='plan'){
    const shape=new THREE.Shape(p.points.map(([x,z])=>new THREE.Vector2(x,-z)));
    const g=new THREE.ExtrudeGeometry(shape,{depth:p.y1-p.y0,steps:1,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,p.y0,0);return g;
  }
  if(p.shape==='profile'){
    const shape=new THREE.Shape(p.outline.map(q=>new THREE.Vector2(...q)));
    for(const h of p.holes)shape.holes.push(new THREE.Path(h.map(q=>new THREE.Vector2(...q))));
    const g=new THREE.ExtrudeGeometry(shape,{depth:p.v1-p.v0,steps:1,bevelEnabled:false});g.translate(0,0,p.v0);
    const axes={'-Z':[[-1,0,0],[0,0,1]],'-X':[[0,0,1],[1,0,0]],'+X':[[0,0,-1],[-1,0,0]]},[U,V]=axes[p.front];
    const m=new THREE.Matrix4().set(U[0],0,V[0],0,0,1,0,0,U[2],0,V[2],0,0,0,0,1);g.applyMatrix4(m);
    // u is observer-right: this basis reverses handedness. Correct winding, not DoubleSide camouflage.
    if(m.determinant()<0){const ix=Array.from({length:g.attributes.position.count},(_,i)=>i);for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);}
    return g;
  }
  if(p.shape==='prism'){
    const n=p.points.length,vs=p.points.map(vec);vs.push(...p.points.map(q=>vec(q).add(vec(p.offset))));
    const centroid=vs.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/vs.length),faces=[];
    for(let i=1;i<n-1;i++)faces.push([0,i,i+1],[n,n+i,n+i+1]);
    for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+j],[i,n+j,n+i]);}
    const positions=[];
    for(let face of faces){const[a,b,c]=face.map(i=>vs[i]),normal=b.clone().sub(a).cross(c.clone().sub(a));if(normal.dot(a.clone().add(b).add(c).multiplyScalar(1/3).sub(centroid))<0)face=[face[0],face[2],face[1]];face.forEach(i=>positions.push(...vs[i].toArray()));}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));g.computeVertexNormals();return g;
  }
  throw Error('Unsupported B04 geometry '+p.shape);
}
