import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {prepareAvatarExport,exportAvatarGLB} from '../../../apps/campus/src/player/avatar-export.mjs';

function fixture() {
  const data = new Uint8Array([11, 23, 47, 255, 53, 101, 193, 255]);
  const texture = new THREE.DataTexture(data, 2, 1);
  texture.wrapS = THREE.RepeatWrapping; texture.repeat.set(2, 3); texture.flipY = false;
  const material = new THREE.MeshPhysicalMaterial({map:texture,roughnessMap:texture});
  const geometry = new THREE.BoxGeometry(1, 1, 1), root = new THREE.Group();
  root.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
  const shadow = new THREE.Object3D(); shadow.name='C2-contact-shadow'; root.add(shadow);
  return {root,geometry,material,texture,data,shadow};
}
function withCanvas(callback) {
  const previous = globalThis.document;
  globalThis.document = {createElement() {
    const canvas = {width:0,height:0,pixels:null};
    canvas.getContext = () => ({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>canvas.pixels=p.data});
    return canvas;
  }};
  return Promise.resolve().then(callback).finally(()=>{if(previous)globalThis.document=previous;else delete globalThis.document;});
}
test('export-only texture conversion preserves bytes, colour space and UV sampler without mutating shared maps',()=>withCanvas(()=>{
  const f=fixture(),prepared=prepareAvatarExport(f.root),mesh=prepared.root.children[0],m=mesh.material;
  assert.notEqual(m,f.material);assert.equal(prepared.root.children[1].material,m);
  assert.equal(m.map,m.roughnessMap);assert.equal(m.map.isDataTexture,undefined);
  assert.deepEqual([...m.map.image.pixels],[...f.data]);assert.equal(m.map.flipY,false);
  assert.equal(m.map.colorSpace,f.texture.colorSpace);assert.equal(m.map.wrapS,THREE.RepeatWrapping);
  assert.deepEqual(m.map.repeat.toArray(),[2,3]);assert.equal(f.material.map,f.texture);
  assert.equal(f.texture.image.data,f.data);assert.equal(f.shadow.visible,true);
  assert.equal(prepared.root.getObjectByName('C2-contact-shadow'),undefined);
  assert.equal(prepared.stats.convertedTextures,1);assert.equal(prepared.stats.materialCopies,1);
  let geometryDisposed=false;f.geometry.addEventListener('dispose',()=>geometryDisposed=true);
  prepared.dispose();assert.equal(geometryDisposed,false);
}));
test('failed export restores live rig transforms and leaves its contact shadow visible',()=>withCanvas(async()=>{
  const f=fixture();f.texture.type=THREE.FloatType;f.root.position.set(4,5,6);
  const avatar={root:f.root,animationClips:()=>{f.root.position.set(0,0,0);return [];}};
  await assert.rejects(exportAvatarGLB(avatar),/unsigned-byte RGBA/);
  assert.deepEqual(f.root.position.toArray(),[4,5,6]);assert.equal(f.shadow.visible,true);
  assert.equal(f.material.roughnessMap,f.texture);
}));
