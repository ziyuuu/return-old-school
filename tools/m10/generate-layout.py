"""Resolve compact spatial input with the existing M0 register; no models or sites are fetched."""
import csv, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
layout=json.loads((ROOT/'data/m10/layout-input.json').read_text())
with (ROOT/'data/restoration/facility-register.csv').open(encoding='utf-8-sig',newline='') as stream:
    records={r['id']:r for r in csv.DictReader(stream)}
columns=layout.pop('facilityColumns')
rows=layout.pop('facilityRows')
facilities=[]
for values in rows:
    row=dict(zip(columns,values));source=records[row['id']]
    f={k:row[k] for k in ('id','kind','position','size','floors','parent','note')}
    f.update(name=source['name'],yaw=0,surveyVerified=False,sourceDiagram={'rect':row['sourceRect']},evidence={
        'position':'H' if row['position'] is not None else 'U',
        'dimensions':'H' if row['size'] is not None else 'U',
        'floorCount':row['floorEvidence'],'sourceIds':row['assumptionIds'],
        'reference':source.get('evidence',source.get('references','M0 register')),
        'unknowns':source['gaps']
    })
    facilities.append(f)
layout['facilities']=facilities
out=ROOT/'data/m10/campus-layout.json'
out.write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(facilities),'semantic objects;',sum(f['position'] is not None for f in facilities),'working locations; no surveyed coordinates.')
