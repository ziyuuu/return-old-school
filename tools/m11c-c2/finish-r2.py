"""Apply narrowly scoped R2 corrections to the existing rig, never replace C1.
This is an idempotent source migration. CI records its normal Git commit before export.
"""
from pathlib import Path
import hashlib

p=Path('apps/campus/src/player/student-rig.mjs')
s=p.read_text()
if 'const widthScale=.89;' not in s:
    assert hashlib.sha256(s.encode()).hexdigest() == '567a036374e23803925c8cefea858b9468e73027afef2413647d339a415329dc', 'Unexpected rig source; stop rather than overwrite concurrent work'
    s=s.replace("const root=new THREE.Group();root.name='C2-student-avatar';root.userData={player:true,artVersion:'C2.R2'};", "const root=new THREE.Group();root.name='C2-student-avatar';root.userData={player:true,artVersion:'C2.R2'};\n  const widthScale=.89; // H art-proportion correction; never changes the C1 capsule.\n  const restJoints=JOINTS.map(([name,parent,p])=>[name,parent,[p[0]*widthScale,p[1],p[2]]]);")
    s=s.replace("bones[i].position.copy(V(p));if(parent>=0){bones[i].position.sub(V(JOINTS[parent][2]));", "bones[i].position.copy(V(restJoints[i][2]));if(parent>=0){bones[i].position.sub(V(restJoints[parent][2]));")
    s=s.replace("if(color)paint(g,color); weights(g,weightFn??(()=>[bone,1]));", "if(color)paint(g,color); weights(g,weightFn??(()=>[bone,1]));\n    g.scale(bone===2?1:widthScale,1,1); // Face remains designed, clothing retains loose ease.")
    s=s.replace("[ [.861,.161,.105],[.882,.185,.114],[.925,.207,.132]", "[ [.850,.197,.112],[.875,.203,.116],[.925,.207,.132]")
    s=s.replace("[[.851,.163,.106],[.864,.164,.108],[.882,.185,.113]]", "[[.842,.195,.110],[.857,.200,.114],[.877,.203,.116]]")
    s=s.replace("[.83,.113,.108,s*.103,0]", "[.83,.104,.102,s*.101,0]")
    s=s.replace("return [y,...[1,2,3,4].map(i=>(a[i]??0)+((b[i]??0)-(a[i]??0))*t)];", """return [y,...[1,2,3,4].map(i=>{
      const pa=profiles[Math.max(0,k-1)],pb=profiles[Math.min(profiles.length-1,k+2)],av=a[i]??0,bv=b[i]??0,h=b[0]-a[0];
      const d=(bv-av)/h, m0=(bv-(pa[i]??0))/(b[0]-pa[0]),m1=((pb[i]??0)-av)/(pb[0]-a[0]);
      const limit=m=>d===0||m*d<=0?0:Math.sign(d)*Math.min(Math.abs(m),Math.abs(d)*2);
      return (2*t*t*t-3*t*t+1)*av+(t*t*t-2*t*t+t)*h*limit(m0)+(-2*t*t*t+3*t*t)*bv+(t*t*t-t*t)*h*limit(m1);
    })];""")
    s=s.replace("s*.116,1.363,.075", "s*.103,1.363,.082").replace("s*.074,1.318,.128", "s*.068,1.326,.126")
    s=s.replace("j<18;j++", "j<14;j++").replace("j/18*TAU+layer*.17", "j/14*TAU+layer*.29")
    s=s.replace("lock(a,st,en,.018-layer*.001,.006+layer*.001,j)","lock(a,st,en,.027-layer*.001,.010+layer*.002,j)")
    s=s.replace(".28*Math.sin(t*Math.PI/2)",".22*Math.sin(t*Math.PI/2)")
    s=s.replace("[.076,.053,.146]", "[.073,.046,.132]").replace("[.079,.024,.149]", "[.077,.022,.137]")
    s=s.replace(".056,.155],[.069,.024,.048]", ".054,.148],[.065,.022,.043]")
    s=s.replace("const clips=[];\n    for(const [name,speed,duration]", "const saved=bones.map(b=>({q:b.quaternion.clone(),p:b.position.clone()}));\n    const clips=[];\n    for(const [name,speed,duration]")
    s=s.replace("pose(0,0);return clips;", "bones.forEach((b,i)=>{b.quaternion.copy(saved[i].q);b.position.copy(saved[i].p);});root.updateMatrixWorld(true);skeleton.update();return clips;")
    p.write_text(s)

p=Path('apps/campus/src/player/player-mode.ts')
s=p.read_text().replace('当前学生形象依据08/09届校友资料做证据有界工作重建：偏大尺码秋季校服轮廓可信，精确剪裁/配色比例/发型为H；不虚构校徽或个人身份。C3再做全校园连续走测。','C2 R2 学生形象按用户确认的白领、蓝身、上白下红横带与左胸 YL 制作。精确染色、裁剪、YL字形及通用脸型为H；不对应真实个人。C3再做全校园连续走测。')
p.write_text(s)

p=Path('tools/m11c-c2/export-r2.mjs')
s=p.read_text()
if '// Notices travel with every offline distribution' not in s:
    s+='''
// Notices travel with every offline distribution; no external font/photo files.
await fs.copyFile(path.join(root,'artifacts/m11c-c2/THIRD_PARTY_NOTICES.txt'),path.join(out,'THIRD_PARTY_NOTICES.txt'));
await fs.copyFile(path.join(root,'artifacts/m11c-c1/APACHE-2.0.txt'),path.join(out,'APACHE-2.0.txt'));
'''
    p.write_text(s)
