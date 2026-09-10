import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {applyPatch02} from '../../../apps/campus/src/patch02-core.mjs';
import {buildPatch03Model} from '../../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model} from '../../../apps/campus/src/patch04-core.mjs';
import {applyB01R2} from '../../../apps/campus/src/b01-r2-core.mjs';
import {applyB01R3Layout,adaptB01R3Terrain,buildB01R3Model,b01R3Checks} from '../../../apps/campus/src/b01-r3-core.mjs';
export const root=fileURLToPath(new URL('../../../',import.meta.url));
export const read=p=>JSON.parse(fs.readFileSync(root+p,'utf8'));
export function context(){const r2=read('data/m11b/batch01-r2/input.json'),p=read('data/m11b/batch01-r3/input.json'),q=applyPatch02(read('data/m10/campus-layout.json'),read('data/m11a/terrain-input.json'),read('data/m11a/patch02/input.json')),e=applyB01R2(q.layout,q.terrain,read('data/m11a/patch04/input.json'),r2),before=e.layout,layout=applyB01R3Layout(before,p),baseTerrain=buildPatch04Model(buildPatch03Model(layout,e.spec,read('data/m11a/patch03/input.json')),e.site),terrain=adaptB01R3Terrain(baseTerrain,layout,p),model=buildB01R3Model(layout,terrain,r2,p);return{r2,p,q,e,before,layout,baseTerrain,terrain,model,report:b01R3Checks(before,layout,model,p)};}
