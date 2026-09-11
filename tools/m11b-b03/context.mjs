import fs from 'node:fs';
import {context as previous,root} from '../m11b-b02/context.mjs';
import {applyB03Layout,adaptB03Terrain,buildB03Model} from '../../apps/campus/src/batch03-core.mjs';
export {root};
export function context(){const b=previous(),p=JSON.parse(fs.readFileSync(root+'data/m11b/batch03/input.json','utf8')),layout=applyB03Layout(b.layout,p),terrain=adaptB03Terrain(b.terrain,layout,p);return {previous:b,p,layout,terrain,model:buildB03Model(layout,terrain,p)};}
