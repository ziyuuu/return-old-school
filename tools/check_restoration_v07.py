"""Validate documented topology and inference separation, not real-world accuracy."""
from pathlib import Path
import csv, json

ROOT = Path(__file__).resolve().parents[1]
def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

def main():
    constraints = load('data/spatial-constraints.json')
    c = {row['id']: row for row in constraints['constraints']}
    assert c['SP-SPORT-AUX-03']['storeys'] == 1
    assert c['SP-MUSIC-04']['storeys'] == 4
    assert c['SP-MUSIC-04']['detached'] is True
    assert c['SP-TOILET-MAIN-01']['connects_every_floor'] is True
    assert c['SP-TOILET-MAIN-01']['doors_face'] == '15'
    assert c['SP-BASKETBALL-01']['grid'] == [3, 2]
    p = load('data/restoration/masterplan-local-patch.json')
    r = p['rectangles_layout']
    track, courts, aux = r['track_05'], r['courts_06'], r['aux_28']
    assert track[2] == courts[0], 'Court block must directly abut track'
    assert (track[1], track[3]) == (courts[1], courts[3])
    assert aux[2] < track[0], 'Auxiliary group must remain image-left'
    assert r['pool_toilet_26'][2] <= r['pool_04'][0]
    assert p['track_binding']['project_id'] != p['track_binding']['separate_from']
    assert p['measured_scale'] is False
    a = load('data/restoration/assumption-register-v07.json')
    assert len(a['items']) == 12
    assert a['global_metric_scale_established'] is False
    assert all(row['survey_verified'] is False for row in a['items'])
    assert len({row['id'] for row in a['items']}) == 12
    with (ROOT/'data/restoration/facility-register.csv').open(encoding='utf-8-sig', newline='') as f:
        facilities = list(csv.DictReader(f))
    assert len(facilities) == 28 and len({x['id'] for x in facilities}) == 28
    print('PASS: documented relations, 28 facility IDs, 12 separate assumptions. Not a survey or 3D test.')

if __name__ == '__main__':
    main()
