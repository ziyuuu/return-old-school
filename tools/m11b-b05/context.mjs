import fs from 'node:fs';
import {context as previous,root} from '../m11b-b04/context.mjs';
import {buildB05Model} from '../../apps/campus/src/batch05-core.mjs';
export {root};
export function context(){
 const base=previous(),p=JSON.parse(fs.readFileSync(new URL('../../data/m11b/batch05/input.json',import.meta.url),'utf8'));
 // B01R2 adjusted the flag centre from the old raw P04 value: follow cumulative input.
 const site=structuredClone(JSON.parse(fs.readFileSync(new URL('../../data/m11a/patch04/input.json',import.meta.url),'utf8')));
 site.forecourt.flag.center=[...JSON.parse(fs.readFileSync(new URL('../../data/m11b/batch01-r2/input.json',import.meta.url),'utf8')).axis.flagCenterAfter];
 return {previous:base,p,site,layout:base.layout,terrain:base.terrain,model:buildB05Model(base.layout,base.terrain,p,site)};
}
