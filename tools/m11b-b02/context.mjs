import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {applyPatch02} from '../../apps/campus/src/patch02-core.mjs';
import {applyB01R2} from '../../apps/campus/src/b01-r2-core.mjs';
import {applyB01R3Layout,adaptB01R3Terrain} from '../../apps/campus/src/b01-shutter-fix.mjs';
import {buildPatch03Model} from '../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model} from '../../apps/campus/src/patch04-core.mjs';
import {applyB02Layout,buildB02Model} from '../../apps/campus/src/batch02-core.mjs';
export const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(root+p,'utf8'));
export function context(){
 const patch=applyPatch02(read('data/m10/campus-layout.json'),read('data/m11a/terrain-input.json'),read('data/m11a/patch02/input.json'));
 const e=applyB01R2(patch.layout,patch.terrain,read('data/m11a/patch04/input.json'),read('data/m11b/batch01-r2/input.json'));
 const r=read('data/m11b/batch01-r3/input.json'),fix=read('data/m11b/batch01-r3/shutter-fix.json');
 const r3={...r,version:fix.version,status:fix.status,entrances:{...r.entrances,...fix.entrances}};
 const base=applyB01R3Layout(e.layout,r3),p=read('data/m11b/batch02/input.json'),layout=applyB02Layout(base,p);
 const terrain=adaptB01R3Terrain(buildPatch04Model(buildPatch03Model(layout,e.spec,read('data/m11a/patch03/input.json')),e.site),layout,r3);
 return {base,layout,terrain,p,model:buildB02Model(layout,terrain,p)};
}
