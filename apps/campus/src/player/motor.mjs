import RAPIER from '@dimforge/rapier3d-compat';
let boot;
/** Rapier compat embeds WASM in JS: the offline Viewer never fetches physics code. */
export function initPhysics() { return boot ??= RAPIER.init(); }
export {RAPIER};
const identity = {x:0,y:0,z:0,w:1};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);

export function directionalSlopeSpeed(normal={x:0,y:1,z:0}, direction={x:0,z:0}, movement={}) {
  const mag=Math.hypot(direction.x||0,direction.z||0);
  if(mag<1e-7||!Number.isFinite(normal?.y)||normal.y<=1e-4)return {multiplier:1,degrees:0};
  const ux=(direction.x||0)/mag,uz=(direction.z||0)/mag;
  const grade=-((normal.x||0)*ux+(normal.z||0)*uz)/normal.y;
  const degrees=Math.atan(grade)*180/Math.PI,dead=movement.slopeSpeedDeadbandDegrees??2;
  if(degrees>dead){
    const limit=Math.max(dead+.01,movement.climbDegrees??42),t=clamp((degrees-dead)/(limit-dead),0,1),minimum=movement.uphillSpeedMinMultiplier??.45;
    return {multiplier:1-(1-minimum)*t,degrees};
  }
  if(degrees<-dead){
    const full=Math.max(dead+.01,movement.downhillFullEffectDegrees??18),t=clamp((-degrees-dead)/(full-dead),0,1),maximum=movement.downhillSpeedMaxMultiplier??1.12;
    return {multiplier:1+(maximum-1)*t,degrees};
  }
  return {multiplier:1,degrees};
}

/** Simulation state is independent of the scene graph. One capsule and one set of
 * kinematic rules are used at every doorway, ramp, stair and frame rate. */
export class PlayerMotor {
  constructor(world, config, ensureRegion=(_position,_force=false)=>{},validateSpawn=(_position)=>false) {
    this.world=world; this.config=config; this.ensureRegion=ensureRegion;this.validateSpawn=validateSpawn;
    this.half=config.body.height/2;
    this.body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.collider=world.createCollider(RAPIER.ColliderDesc.capsule(this.half-config.body.radius,config.body.radius),this.body);
    this.controller=world.createCharacterController(config.body.skin);
    this.controller.setUp({x:0,y:1,z:0}); this.controller.setSlideEnabled(true);
    this.controller.setMaxSlopeClimbAngle(config.movement.climbDegrees*Math.PI/180);
    this.controller.setMinSlopeSlideAngle(config.movement.slideDegrees*Math.PI/180);
    this.controller.enableAutostep(config.movement.maxStep,config.movement.stepWidth,false);
    this.controller.enableSnapToGround(config.movement.snapDistance);
    this.controller.setApplyImpulsesToDynamicBodies(false);
    this.position={x:0,y:1,z:0}; this.previous={...this.position};
    this.velocity={x:0,y:0,z:0}; this.grounded=false; this.heading=0;
    this.travel=0;this.actualSpeed=0;this.ticks=0;this.droppedSeconds=0;this.accumulator=0;
    this.groundNormal={x:0,y:1,z:0};this.slopeDegrees=0;this.slopeSpeedMultiplier=1;
    this.paused=true;this.blocked=false;this.collisions=[];this.lastSafe=null;this.respawns=0;
  }
  /** Reset only to an explicit checkpoint, rejecting a capsule overlapping solids.
   * The small inset ignores skin-contact while retaining low-ceiling/wall rejection. */
  spawn(feet, heading=0) {
    if(!feet.every(Number.isFinite))throw Error('Non-finite spawn');
    const target={x:feet[0],y:feet[1]+this.half,z:feet[2]};
    this.ensureRegion(target,true);this.world.step();
    const inset=.012,shape=new RAPIER.Capsule(this.half-this.config.body.radius,this.config.body.radius-inset);
    if(this.validateSpawn(target)||this.world.intersectionWithShape(target,identity,shape,undefined,undefined,this.collider,this.body))throw Error('Checkpoint intersects solid geometry');
    this.position=target; this.previous={...target}; this.body.setTranslation(target,true);this.body.setNextKinematicTranslation(target);
    this.velocity={x:0,y:0,z:0};this.grounded=false;this.actualSpeed=0;this.heading=heading;this.accumulator=0;this.collisions=[];this.blocked=false;
    this.groundNormal={x:0,y:1,z:0};this.slopeDegrees=0;this.slopeSpeedMultiplier=1;
    this.world.step();this.lastSafe={feet:[...feet],heading};
  }
  setPaused(value) { this.paused=Boolean(value);this.accumulator=0;this.velocity.x=0;this.velocity.z=0;this.actualSpeed=0; }
  advance(seconds,input) {
    if(this.paused)return 0;
    if(!Number.isFinite(seconds)||seconds<0)return 0;
    const s=this.config.simulation,dt=1/s.hz;
    const accepted=Math.min(seconds,s.maxFrameSeconds);this.droppedSeconds+=seconds-accepted;
    this.accumulator+=accepted;let steps=0;
    while(this.accumulator+1e-9>=dt&&steps<s.maxCatchupSteps){this.step(input,dt);this.accumulator-=dt;steps++;}
    if(this.accumulator>=dt){this.droppedSeconds+=this.accumulator;this.accumulator=0;}
    return steps;
  }
  sampleGroundNormal() {
    if(!this.grounded)return {x:0,y:1,z:0};
    const feet=this.feet(),ray=new RAPIER.Ray({x:feet[0],y:feet[1]+.42,z:feet[2]},{x:0,y:-1,z:0});
    const hit=this.world.castRayAndGetNormal(ray,.90,true,undefined,undefined,this.collider,this.body);
    return hit&&hit.normal&&hit.normal.y>.05?{x:hit.normal.x,y:hit.normal.y,z:hit.normal.z}:{x:0,y:1,z:0};
  }
  /** Public for deterministic QA; ordinary input and tests execute this same motor. */
  step(input={x:0,z:0,run:false}, dt=1/this.config.simulation.hz) {
    this.ensureRegion(this.position);
    const m=this.config.movement,mag=Math.hypot(input.x||0,input.z||0),scale=mag>1?1/mag:1,dir={x:(input.x||0)*scale,z:(input.z||0)*scale};
    this.groundNormal=this.sampleGroundNormal();
    const slope=directionalSlopeSpeed(this.groundNormal,dir,m);this.slopeDegrees=slope.degrees;this.slopeSpeedMultiplier=slope.multiplier;
    const speed=(input.run?m.runSpeed:m.walkSpeed)*slope.multiplier,tx=dir.x*speed,tz=dir.z*speed;
    const rate=mag>0?m.acceleration:m.braking;
    const dx=tx-this.velocity.x,dz=tz-this.velocity.z,d=Math.hypot(dx,dz),a=Math.min(1,rate*dt/(d||1));
    this.velocity.x+=dx*a;this.velocity.z+=dz*a;
    this.velocity.y=this.grounded?-m.groundStickSpeed:Math.max(-m.terminalSpeed,this.velocity.y-m.gravity*dt);
    const desired={x:this.velocity.x*dt,y:this.velocity.y*dt,z:this.velocity.z*dt};
    this.controller.computeColliderMovement(this.collider,desired);
    const delta=this.controller.computedMovement();
    if(![delta.x,delta.y,delta.z].every(Number.isFinite))throw Error('Non-finite physics movement');
    this.previous={...this.position};
    this.position={x:this.position.x+delta.x,y:this.position.y+delta.y,z:this.position.z+delta.z};
    this.grounded=this.controller.computedGrounded();
    if(this.grounded||delta.y>desired.y+.001)this.velocity.y=0;
    const distance=Math.hypot(delta.x,delta.z);this.actualSpeed=distance/dt;this.travel+=distance;
    const intended=Math.hypot(desired.x,desired.z);this.blocked=intended>.001&&distance<intended*.55;
    if(distance>.0001){const desiredHeading=Math.atan2(delta.x,delta.z),diff=Math.atan2(Math.sin(desiredHeading-this.heading),Math.cos(desiredHeading-this.heading));this.heading+=diff*Math.min(1,dt*14);}
    this.collisions=[];
    for(let i=0;i<this.controller.numComputedCollisions();i++){const c=this.controller.computedCollision(i);if(c)this.collisions.push({handle:c.collider?.handle,normal:c.normal1,toi:c.toi});}
    this.body.setNextKinematicTranslation(this.position); this.world.timestep=dt;this.world.step();this.ticks++;
  }
  feet() { return [this.position.x,this.position.y-this.half,this.position.z]; }
  reset() { if(this.lastSafe){this.respawns++;this.spawn(this.lastSafe.feet,this.lastSafe.heading);} }
  state() { return {feet:this.feet(),velocity:{...this.velocity},grounded:this.grounded,groundNormal:{...this.groundNormal},slopeDegrees:this.slopeDegrees,slopeSpeedMultiplier:this.slopeSpeedMultiplier,heading:this.heading,actualSpeed:this.actualSpeed,blocked:this.blocked,travel:this.travel,ticks:this.ticks,paused:this.paused,droppedSeconds:this.droppedSeconds,respawns:this.respawns,collisionCount:this.collisions.length}; }
  dispose() {this.world.removeCharacterController(this.controller);this.world.removeRigidBody(this.body);}
}

/** Sweep a sphere along the complete camera boom, not a single centre ray.
 * Camera retracts immediately and recovers slowly, never interpolating past a hit. */
export class FollowCamera {
  constructor(world, motor, config){this.world=world;this.motor=motor;this.config=config;this.yaw=0;this.pitch=config.camera.pitch;this.zoom=config.camera.distance;this.distance=this.zoom;this.firstPerson=false;this.hit=false;this.position={x:0,y:0,z:0};this.target={x:0,y:0,z:0};}
  orbit(dx,dy){const c=this.config.camera;this.yaw-=dx*c.sensitivity;this.pitch=clamp(this.pitch+dy*c.sensitivity,c.minimumPitch,c.maximumPitch);}
  zoomBy(delta){const c=this.config.camera;this.zoom=clamp(this.zoom+delta*.004,c.minimumDistance,c.maximumDistance);}
  update(dt=1/60){
    const p=this.motor.position,c=this.config.camera;
    this.target={x:p.x,y:p.y-this.motor.half+(this.firstPerson?c.eyeHeight:c.targetHeight),z:p.z};
    const dir={x:-Math.sin(this.yaw)*Math.cos(this.pitch),y:Math.sin(this.pitch),z:-Math.cos(this.yaw)*Math.cos(this.pitch)};
    const cast=this.world.castShape(this.target,identity,dir,new RAPIER.Ball(c.radius),.015,this.zoom,true,undefined,undefined,this.motor.collider,this.motor.body);
    const allowed=cast?Math.max(0,cast.time_of_impact-.025):this.zoom;this.hit=Boolean(cast);
    this.distance=allowed<this.distance?allowed:Math.min(allowed,this.distance+(allowed-this.distance)*(1-Math.exp(-c.recoveryRate*Math.max(0,dt))));
    const d=this.firstPerson?0:this.distance;
    this.position={x:this.target.x+dir.x*d,y:this.target.y+dir.y*d,z:this.target.z+dir.z*d};
    const look=this.firstPerson?{x:this.target.x-dir.x,y:this.target.y-dir.y,z:this.target.z-dir.z}:this.target;
    return {position:this.position,target:look,distance:d,allowedDistance:allowed,obstructed:this.hit,firstPerson:this.firstPerson,hideAvatar:this.firstPerson||d<.55};
  }
  moveVector(side,forward){return {x:-Math.cos(this.yaw)*side+Math.sin(this.yaw)*forward,z:Math.sin(this.yaw)*side+Math.cos(this.yaw)*forward};}
}
