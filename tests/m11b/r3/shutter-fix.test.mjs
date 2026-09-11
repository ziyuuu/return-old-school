import test from 'node:test';
import assert from 'node:assert/strict';
import {context} from '../../../tools/m11b/shutter-fix/context.mjs';
import {b01R3Checks} from '../../../apps/campus/src/b01-shutter-fix.mjs';
const c=context();
for(const v of c.report.results)test(v.id,()=>assert.equal(v.passed,true));
test('closed roller is detected in actual geometry',()=>{
 const m={...c.model,worldParts:[...c.model.worldParts]},a=m.access[0];
 m.worldParts.push({id:'blocked',shape:'box',size:[.3,2.5,2.5],center:[a.door[0],a.door[1]+1.3,a.door[2]]});
 assert.equal(b01R3Checks(c.before,c.layout,m,c.p).passed,false);
});
test('missing route floor is detected',()=>{
 const m={...c.model,worldParts:c.model.worldParts.filter(q=>q.id!=='R3-west-landing')};
 assert.equal(b01R3Checks(c.before,c.layout,m,c.p).passed,false);
});
