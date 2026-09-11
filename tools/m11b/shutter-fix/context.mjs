import {context as oldContext} from '../r3/model.mjs';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {applyB01R3Layout,adaptB01R3Terrain,buildB01R3Model,b01R3Checks} from '../../../apps/campus/src/b01-shutter-fix.mjs';
export const root=fileURLToPath(new URL('../../../',import.meta.url));
export function context(){
 const old=oldContext(), fix=JSON.parse(fs.readFileSync(root+'data/m11b/batch01-r3/shutter-fix.json'));
 const p={...old.p,version:fix.version,status:fix.status,entrances:{...old.p.entrances,...fix.entrances}};
 const layout=applyB01R3Layout(old.before,p),terrain=adaptB01R3Terrain(old.baseTerrain,layout,p);
 const model=buildB01R3Model(layout,terrain,old.r2,p);
 return {...old,p,fix,layout,terrain,model,report:b01R3Checks(old.before,layout,model,p)};
}
