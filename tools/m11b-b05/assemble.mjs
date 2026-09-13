/** Assemble archived evidence without regenerating the tested Viewer or its pixels.
 * Input: gh run download 34752358220 -p 'B05-R11-*' --dir <B05_ARTIFACT_ROOT>.
 * Each original report and all per-frame measurements remain available.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const incoming=path.resolve(process.env.B05_ARTIFACT_ROOT||'.b05-incoming');
const phase=process.env.B05_PHASE||'final-r1.1',qa=path.join(root,'qa/m11b-b05',phase);
const digest=b=>createHash('sha256').update(b).digest('hex');
const wanted=process.env.B05_VIEWER_SHA256||'d9e91cad8a2cf49af997da14e4a4ba97066f6115c01517473c049c22815b5e4e';
const source=process.env.B05_SOURCE_COMMIT;assert.match(source||'',/^[0-9a-f]{40}$/,'Set B05_SOURCE_COMMIT to the exact tested source');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):[path.join(dir,f.name)]);
const parse=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const copy=(src,dst)=>{fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))assert.equal(digest(fs.readFileSync(dst)),digest(fs.readFileSync(src)),'Refusing to replace different evidence: '+dst);else fs.copyFileSync(src,dst);};
const one=(files,suffix)=>{const hits=files.filter(f=>f.replaceAll('\\','/').endsWith(suffix));assert.equal(hits.length,1,suffix);return hits[0];};
const build=walk(path.join(incoming,'B05-R11-build'));
const v=one(build,'/artifacts/m11b-b05/Yali_B05_R1_1_Viewer.html');assert.equal(digest(fs.readFileSync(v)),wanted);
const manifest=one(build,'/artifacts/m11b-b05/viewer-manifest.json'),m=parse(manifest);assert.equal(m.sha256,wanted);assert.equal(m.gitHead,source);
for(const [file,h]of Object.entries(m.sources))assert.equal(digest(fs.readFileSync(path.join(root,file))),h,'Changed runtime '+file);
for(const name of ['Yali_B05_R1_1_Viewer.html','viewer-manifest.json','THIRD_PARTY_NOTICES.txt'])copy(one(build,'/artifacts/m11b-b05/'+name),path.join(root,'artifacts/m11b-b05',name));
for(const name of ['build.log','tests.tap','remote-refs.txt'])copy(one(build,'/qa/m11b-b05/'+phase+'/build/'+name),path.join(qa,'build',name));
const groups=['gate','courts','field','residential','checks','regression','mobile','fallback','baseline'];
const provenance={run:process.env.B05_RUN_ID,runtimeSourceCommit:source,viewerSHA256:wanted,method:'Unmodified GitHub Actions artifacts from this exact run; validated source, Viewer and screenshot digests',artifacts:[]};
function importReport(artifact,subdir){
 const files=walk(path.join(incoming,artifact)),reportFile=one(files,'/report.json'),r=parse(reportFile);
 assert.equal(r.sourceCommit,source);assert.equal(r.phase,phase);assert.equal(r.passed,true,artifact+' incomplete');
 assert.equal(r.viewerSHA256,r.baseline?'d8e2b969802cfefcaba9d27da496f26ef8e9d1d85eb2a8bc7681d243f3002eda':wanted);
 assert.equal(r.errors.length,0);assert.equal(r.externalRequests.length,0);
 const dir=path.dirname(reportFile);
 for(const view of r.views){const f=path.join(dir,view.file);assert.equal(digest(fs.readFileSync(f)),view.sha256);copy(f,path.join(qa,subdir,view.file));}
 copy(reportFile,path.join(qa,subdir,'report.json'));
 if(fs.existsSync(path.join(dir,'capture.log')))copy(path.join(dir,'capture.log'),path.join(qa,subdir,'capture.log'));
 provenance.artifacts.push({name:artifact,reportSHA256:digest(fs.readFileSync(reportFile)),destination:`${phase}/${subdir}/report.json`});
 return r;
}
for(const group of groups)assert.equal(importReport('B05-R11-'+group,group).group,group);
const perf=[];
for(const view of ['b05-gate-close','b05-hoop','b05-overview']){
 const r=importReport('B05-R11-measure-'+view,'performance-resume/'+view);
 assert.equal(r.group,'performance');assert.equal(r.views.length,1);assert.equal(r.views[0].view,view);
 assert.equal(r.samples.length,60);assert.ok(r.samples.every(s=>Number.isFinite(s.ms)&&s.ms>0&&s.calls>0&&s.triangles>0));
 assert.equal(r.views[0].performance.samples,60);perf.push(r);
 copy(path.join(qa,'performance-resume',view,r.views[0].file),path.join(qa,'performance',r.views[0].file));
}
const combined={...perf[0],aggregation:{method:'Three separately completed actual browser sessions; no invented or rescaled measurements',sessions:perf.map(r=>({view:r.views[0].view,run:r.run,startedAt:r.startedAt,completedAt:r.completedAt,environment:r.environment,report:`../performance-resume/${r.views[0].view}/report.json`}))},environment:{...perf[0].environment,separateBrowserSessions:3},views:perf.flatMap(r=>r.views),startedAt:perf.map(r=>r.startedAt).sort()[0],completedAt:perf.map(r=>r.completedAt).sort().at(-1),warnings:perf.flatMap(r=>r.warnings),passed:true};
delete combined.samples;delete combined.warmup;
put(path.join(qa,'performance/report.json'),combined);
put(path.join(root,'qa/m11b-b05/artifact-provenance.json'),provenance);
console.log('ASSEMBLED',wanted,source,'9 visual/check groups + 3 complete frame-pacing sessions');
