"""Test the real production site in Chromium. Software rendering is not performance certification."""
import json, os, subprocess, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'qa/m10';OUT.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['python','-m','http.server','8765','--directory',str(ROOT/'apps/campus/dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.5)
result={'test_type':'actual Chromium WebGL2 interaction capture','navigation':'HTTP production build and standalone file','gpu_performance_certified':False,'checks':[],'errors':[],'screenshots':[]}
def record(name,passed,detail=''):
    result['checks'].append({'name':name,'passed':bool(passed),'detail':detail})
    if not passed:raise AssertionError(name+': '+detail)
try:
    with sync_playwright() as p:
        opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
        if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        b=p.chromium.launch(**opts)
        page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1,accept_downloads=True)
        page.route('**/favicon.ico',lambda route:route.fulfill(status=204))
        page.on('pageerror',lambda e:result['errors'].append(str(e)))
        page.on('console',lambda m:result['errors'].append(m.text) if m.type=='error' else None)
        page.goto('http://127.0.0.1:8765',wait_until='networkidle')
        page.wait_for_function('window.__YALI_M10__?.ready',timeout=30000);page.wait_for_timeout(800)
        record('webgl boot',page.evaluate('window.__YALI_M10__.getState().webgl.includes("WebGL 2")'))
        record('runtime layout checks',page.evaluate('window.__YALI_M10__.report.passed'))
        for view in ['overview','top','sports','teaching','gym','gate']:
            page.locator(f'[data-view="{view}"]').click();page.wait_for_timeout(600)
            state=page.evaluate('window.__YALI_M10__.getState()')
            record('view '+view,state['view']==view and state['renderer']['triangles']>0)
            page.screenshot(path=str(OUT/f'{view}.png'));result['screenshots'].append(f'{view}.png')
        page.locator('#inspect-btn').click();page.select_option('#facility','24');page.wait_for_timeout(300)
        record('music evidence','四层' in page.locator('#details').inner_text() and '[A]' in page.locator('#details').inner_text())
        page.select_option('#facility','25');page.wait_for_timeout(300)
        record('toilet evidence','每层' in page.locator('#details').inner_text())
        page.screenshot(path=str(OUT/'toilet-evidence.png'));result['screenshots'].append('toilet-evidence.png')
        page.select_option('#facility','22');record('unknown has no invented transform','无坐标' in page.locator('#details').inner_text())
        page.locator('#grid-check').check();page.locator('#routes-check').check();page.locator('#footprints-check').check()
        page.wait_for_timeout(500);record('footprint mode',page.evaluate('window.__YALI_M10__.getState().planOnly'))
        page.screenshot(path=str(OUT/'footprints.png'));result['screenshots'].append('footprints.png')
        with page.expect_download() as dl:page.locator('#download-layout').click()
        dl.value.save_as(str(OUT/'exported-layout.json'))
        record('JSON export',len(json.loads((OUT/'exported-layout.json').read_text())['facilities'])==28)
        page.locator('#footprints-check').uncheck();page.locator('#close-inspector').click()
        page.locator('[data-view="overview"]').click()
        before=page.evaluate('window.__YALI_M10__.getState().camera')
        page.mouse.move(750,430);page.mouse.down();page.mouse.move(850,480,steps=12);page.mouse.up();page.wait_for_timeout(300)
        after=page.evaluate('window.__YALI_M10__.getState().camera');record('mouse orbit changes view',before!=after)
        page.locator('#fly-btn').click();page.keyboard.down('KeyW');page.wait_for_timeout(250);page.keyboard.up('KeyW')
        after_fly=page.evaluate('window.__YALI_M10__.getState()');record('free inspection moves',after_fly['fly'] and after_fly['camera']!=after)
        page.keyboard.press('Escape');record('escape exits inspection',not page.evaluate('window.__YALI_M10__.getState().fly'))
        page.locator('#tour-btn').click();page.wait_for_timeout(400);record('route preview starts',page.evaluate('window.__YALI_M10__.getState().tour'))
        page.keyboard.press('Escape')
        with page.expect_download() as dl:page.locator('#capture-btn').click()
        dl.value.save_as(str(OUT/'canvas-export.png'));record('canvas screenshot export',(OUT/'canvas-export.png').stat().st_size>1000)
        page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="top"]').click();page.wait_for_timeout(500)
        record('responsive resize',page.evaluate('window.__YALI_M10__.getState().canvas[0]')==390)
        page.screenshot(path=str(OUT/'mobile.png'));result['screenshots'].append('mobile.png')
        record('no JS or shader errors',not result['errors'],str(result['errors']))
        off=b.new_page(viewport={'width':1280,'height':900});off.on('pageerror',lambda e:result['errors'].append(str(e)))
        off.goto((ROOT/'artifacts/m10/Yali_M1_0_Viewer.html').as_uri(),wait_until='load');off.wait_for_function('window.__YALI_M10__?.ready');off.wait_for_timeout(300)
        record('standalone file boot',off.evaluate('window.__YALI_M10__.report.passed'))
        off.screenshot(path=str(OUT/'standalone.png'));result['screenshots'].append('standalone.png')
        result['browser']=b.version;result['renderer']=state
        b.close()
    result['success']=True
except Exception as exc:
    result['success']=False;result['failure']=str(exc)
    raise
finally:
    server.terminate()
    (OUT/'browser-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
