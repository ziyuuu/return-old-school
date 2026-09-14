import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

/** Clone export-only resources. Never change the running avatar's material bank.
 * r180's metal/roughness merge uses drawImage, which rejects DataTexture.image.
 * Copy RGBA bytes into a canvas without colour conversion or vertical flipping.
 */
export function prepareAvatarExport(source) {
  const root = cloneSkeleton(source);
  root.getObjectByName('C2-contact-shadow')?.removeFromParent();
  const materials = new Map(), textures = new Map(), skeletons = new Set();
  const stats = { convertedTextures: 0, texturePixels: 0, materialCopies: 0 };
  function textureForExport(texture) {
    if (!texture?.isDataTexture) return texture;
    if (textures.has(texture)) return textures.get(texture);
    const { data, width, height } = texture.image;
    if (texture.type !== THREE.UnsignedByteType || texture.format !== THREE.RGBAFormat ||
        !(data instanceof Uint8Array || data instanceof Uint8ClampedArray) ||
        data.length !== width * height * 4) {
      throw new Error('Avatar export requires unsigned-byte RGBA procedural textures.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas2D unavailable for procedural GLB texture export.');
    const pixels = ctx.createImageData(width, height); pixels.data.set(data);
    ctx.putImageData(pixels, 0, 0);
    const copy = new THREE.Texture().copy(texture);
    copy.source = new THREE.Source(canvas);
    // Texture.copy preserves colour space, sampler, UV transform and flipY.
    copy.needsUpdate = true;
    textures.set(texture, copy);
    stats.convertedTextures++; stats.texturePixels += width * height;
    return copy;
  }
  function materialForExport(material) {
    if (materials.has(material)) return materials.get(material);
    const copy = material.clone();
    for (const key of Object.keys(copy)) {
      if (copy[key]?.isTexture) copy[key] = textureForExport(copy[key]);
    }
    materials.set(material, copy); stats.materialCopies++;
    return copy;
  }
  root.traverse(object => {
    if (object.isMesh) {
      object.material = Array.isArray(object.material)
        ? object.material.map(materialForExport) : materialForExport(object.material);
    }
    if (object.isSkinnedMesh) skeletons.add(object.skeleton);
  });
  root.updateMatrixWorld(true);
  return { root, stats, dispose() {
    materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    skeletons.forEach(s => s.dispose()); root.removeFromParent();
    // Geometry is shared by reference and intentionally NOT disposed here.
  } };
}

/** Bake existing gait clips and export a separate skeleton; restore live pose even on failure. */
export async function exportAvatarGLB(avatar) {
  const saved = [];
  avatar.root.traverse(object => saved.push({ object, position: object.position.clone(),
    quaternion: object.quaternion.clone(), scale: object.scale.clone() }));
  let prepared, animations;
  try {
    animations = avatar.animationClips();
    prepared = prepareAvatarExport(avatar.root);
  } finally {
    saved.forEach(({ object, position, quaternion, scale }) => {
      object.position.copy(position); object.quaternion.copy(quaternion); object.scale.copy(scale);
    });
    avatar.root.updateMatrixWorld(true);
    avatar.root.traverse(object => { if (object.isSkinnedMesh) object.skeleton.update(); });
  }
  try {
    return await new GLTFExporter().parseAsync(prepared.root, {
      binary: true, onlyVisible: true, animations,
    });
  } finally {
    prepared.dispose();
  }
}
