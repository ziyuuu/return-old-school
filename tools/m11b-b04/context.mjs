import fs from 'node:fs';
import {context as previous,root} from '../m11b-b03/context.mjs';
import {applyB04Layout,buildB04Model} from '../../apps/campus/src/batch04-core.mjs';
export {root};
export function context(){
  const base=previous(),p=JSON.parse(fs.readFileSync(root+'data/m11b/batch04/input.json','utf8'));
  const layout=applyB04Layout(base.layout,p),terrain=base.terrain;
  return {previous:base,p,layout,terrain,model:buildB04Model(layout,terrain,p)};
}
