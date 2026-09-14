import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STUDENT_PROFILE,locomotionState,locomotionParams} from '../../../apps/campus/src/player/student-avatar-profile.mjs';

test('C2 profile stays evidence-bounded and never invents a logo',()=>{assert.equal(STUDENT_PROFILE.uniform.logo,false);assert.match(STUDENT_PROFILE.evidence,/09届/);assert.ok(STUDENT_PROFILE.height>1.5&&STUDENT_PROFILE.height<1.85);});
test('locomotion states are driven by actual speed and grounding',()=>{assert.equal(locomotionState(0,true),'idle');assert.equal(locomotionState(1.4,true),'walk');assert.equal(locomotionState(3,true),'run');assert.equal(locomotionState(1,false),'air');assert.ok(locomotionParams(3,true).stride>locomotionParams(1,true).stride);});
test('student avatar uses shared materials and no external image/model asset',()=>{const s=fs.readFileSync(new URL('../../../apps/campus/src/player/student-avatar.ts',import.meta.url),'utf8');assert.ok(s.includes('surfaceMaterial'));assert.ok(!/TextureLoader|GLTFLoader|https?:\/\/|logo\.png|emblem\.(png|jpg|jpeg|webp)/i.test(s));});
test('player mode is wired to the C2 avatar while retaining C1 collision runtime',()=>{const s=fs.readFileSync(new URL('../../../apps/campus/src/player/player-mode.ts',import.meta.url),'utf8');assert.ok(s.includes('createStudentAvatar'));assert.ok(s.includes('avatar.state()'));assert.ok(s.includes('CampusCollisionWorld'));});
