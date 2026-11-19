import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PULSETRACK_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:5173';
const output = process.env.PULSETRACK_SCREENSHOTS || '/tmp/pulsetrack-session-medals';await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let debugPage;
try {
  const context = await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Dubai',serviceWorkers:'block',hasTouch:true});
  const page = await context.newPage();debugPage=page;await page.clock.setFixedTime(new Date('2026-11-19T12:00:00+04:00'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const logs=[];
  for(let i=1;i<=19;i++)logs.push({id:`run-${i}`,exercise:'Running',date:`2026-11-${String(i).padStart(2,'0')}`,distance:1000,created_date:'2026-11-19T08:00:00Z'});
  for(let i=16;i<=18;i++)logs.push({id:`swim-${i}`,exercise:'Swimming',date:`2026-11-${i}`,distance:i===16?null:500});
  for(let i=0;i<12;i++)logs.push({id:`past-${i}`,exercise:'Running',date:`2025-${String(i+1).padStart(2,'0')}-01`,distance:5000});
  await page.addInitScript(({logs})=>{
    if(!sessionStorage.getItem('fixture-seeded')){
      localStorage.setItem('workout_tracker_logs',JSON.stringify(logs));
      localStorage.setItem('pulsetrack_tracker_sports',JSON.stringify([{id:'primary',sport:'Running'},{id:'second',sport:'Swimming'}]));
      localStorage.setItem('pulsetrack_app_settings',JSON.stringify({trackDistance:true}));sessionStorage.setItem('fixture-seeded','yes');
    }
  },{logs});
  await page.goto(base);await page.getByText('Medals this week',{exact:true}).first().waitFor();
  const session=date=>page.locator(`button[aria-label^="${date}"]`).first();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('workout_tracker_logs')));
  const dialog=()=>page.getByRole('dialog');
  assert.equal(await page.locator('summary').filter({hasText:'Session options'}).count(),0);
  await session('2026-11-16').click();await page.getByRole('heading',{name:'Do you want to uncheck the session?'}).waitFor();
  assert.equal((await stored()).find(l=>l.id==='run-16').distance,1000);
  assert.equal(await page.getByRole('button',{name:'Cancel',exact:true}).evaluate(el=>el===document.activeElement),true);
  await page.screenshot({path:`${output}/session-confirmation.png`});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await dialog().waitFor({state:'hidden'});
  assert.equal((await stored()).length,logs.length);
  await session('2026-11-16').click();await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.getByRole('checkbox',{name:/Highlight Session/}).check();await page.getByRole('checkbox',{name:/Exclude Payment/}).check();
  await page.screenshot({path:`${output}/session-options.png`});
  await page.getByRole('button',{name:'Done',exact:true}).click();await dialog().waitFor({state:'hidden'});
  assert.equal((await stored()).find(l=>l.id==='run-16').highlighted,true);assert.equal((await stored()).find(l=>l.id==='run-16').excludePayment,true);
  const box=await session('2026-11-16').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();
  await page.getByRole('heading',{name:'Session options',exact:true}).waitFor();assert.ok((await stored()).find(l=>l.id==='run-16'));
  await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});
  // A just-typed distance is protected immediately, without a debounce window.
  const swimDistance=page.getByRole('textbox',{name:'Distance in metres for 2026-11-16'}).nth(1);
  await swimDistance.fill('725');await page.locator('button[aria-label^="2026-11-16"]').nth(1).click();
  await page.getByRole('heading',{name:'Do you want to uncheck the session?'}).waitFor();
  assert.equal((await stored()).find(l=>l.id==='swim-16').distance,725);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await session('2026-11-16').click();await page.getByRole('button',{name:'Yes',exact:true}).click();await page.waitForTimeout(350);
  assert.ok(!(await stored()).find(l=>l.id==='run-16'));
  await session('2026-11-16').click();assert.equal((await stored()).filter(l=>l.exercise==='Running'&&l.date==='2026-11-16').length,1);
  // Pressing an empty day for a long time must not create it on release.
  const empty=await session('2026-11-20').boundingBox();await page.mouse.move(empty.x+empty.width/2,empty.y+empty.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
  assert.equal((await stored()).filter(l=>l.exercise==='Running'&&l.date==='2026-11-20').length,0);
  // Zero still counts as entered distance; an ordinary no-distance session stays quick.
  await swimDistance.fill('0');await page.locator('button[aria-label^="2026-11-16"]').nth(1).click();await page.getByRole('heading',{name:'Do you want to uncheck the session?'}).waitFor();
  await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});assert.equal((await stored()).find(l=>l.id==='swim-16').distance,0);await swimDistance.fill('725');
  await session('2026-11-16').click();assert.equal(await dialog().count(),0);assert.equal((await stored()).filter(l=>l.exercise==='Running'&&l.date==='2026-11-16').length,0);await session('2026-11-16').click();
  await session('2026-11-17').focus();await page.keyboard.press('Shift+F10');await page.getByRole('heading',{name:'Session options',exact:true}).waitFor();await page.getByRole('button',{name:'Done',exact:true}).click();
  const cdp=await context.newCDPSession(page);
  await session('2026-11-20').scrollIntoViewIfNeeded();
  const swipeBox=await session('2026-11-20').boundingBox();const sx=swipeBox.x+swipeBox.width/2,sy=swipeBox.y+swipeBox.height/2;
  const countBefore=(await stored()).length;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx-20,y:sy}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx-100,y:sy}]});
  await page.waitForTimeout(600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
  assert.equal(await dialog().count(),0);assert.equal((await stored()).length,countBefore);
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await page.setViewportSize({width:320,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${output}/tracker-mobile.png`,fullPage:true});
  // Weekly strips contain only the sport in their own card.
  const strip=page.getByRole('region',{name:'Running medals this week'});assert.ok(await strip.getByRole('button').count()>1);
  await strip.getByRole('button',{name:'See all medals'}).click();await dialog().waitFor();
  await page.locator('[data-render-ready="true"]').waitFor();
  assert.equal(await page.getByLabel('Medal sport',{exact:true}).inputValue(),'sport:Running');
  await page.getByLabel('Medal period',{exact:true}).selectOption('all');await page.locator('[data-render-ready="true"]').waitFor();
  assert.ok(await page.locator('[data-medal-stage]').count()>6);
  assert.equal(await page.getByRole('button',{name:'Next medal page'}).count(),0);
  await page.screenshot({path:`${output}/medal-browser-mobile.png`});
  const medalBox=await page.locator('[data-medal-stage]').first().boundingBox();await page.mouse.move(medalBox.x+medalBox.width/2,medalBox.y+medalBox.height/2);await page.mouse.down();await page.mouse.move(medalBox.x+medalBox.width/2+40,medalBox.y+medalBox.height/2,{steps:5});await page.mouse.up();
  assert.equal(await page.getByText('Achievement history',{exact:true}).count(),0);
  await page.getByRole('button',{name:/^Inspect /}).filter({has:page.locator('svg')}).first().click();await page.getByText('Achievement history',{exact:true}).waitFor();await page.locator('[data-render-ready="true"]').waitFor();
  assert.equal(await page.locator('[data-medal-stage]').count(),1);
  assert.equal(await page.getByRole('button',{name:'Reset view',exact:true}).count(),0);
  assert.equal(await page.getByText(/arrow keys also work/).count(),0);
  await page.locator('[data-medal-stage]').focus();await page.keyboard.press('ArrowRight');await page.screenshot({path:`${output}/medal-inspector-mobile.png`});
  await page.goBack();await page.getByLabel('Medal period',{exact:true}).waitFor();assert.equal(await page.getByLabel('Medal period',{exact:true}).inputValue(),'all');
  await page.locator('[data-medal-stage]').last().scrollIntoViewIfNeeded();await page.waitForTimeout(200);
  const scrollBefore = await page.locator('[data-modal-scroll]').evaluate(el=>el.scrollTop);
  assert.ok(scrollBefore>0);
  const canvasHeight = await page.locator('[data-render-ready="true"] canvas').evaluate(el=>el.height);
  assert.ok(canvasHeight<=844*2);
  await page.getByRole('button',{name:/^Inspect /}).filter({has:page.locator('svg')}).last().click();
  await page.getByText('Achievement history',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-modal-scroll]').evaluate(el=>el.scrollTop),0);
  await page.getByRole('button',{name:'Back to collection',exact:true}).click();
  await page.getByLabel('Medal period',{exact:true}).waitFor();await page.waitForTimeout(200);
  assert.ok(Math.abs(await page.locator('[data-modal-scroll]').evaluate(el=>el.scrollTop)-scrollBefore)<3);
  await page.getByRole('button',{name:'Close dialog'}).click();await dialog().waitFor({state:'hidden'});await page.waitForTimeout(100);
  await page.getByRole('link',{name:'Stats',exact:true}).last().click();await page.getByRole('region',{name:'Lifetime medal collection'}).waitFor();
  const collection = page.getByRole('region',{name:'Lifetime medal collection'});
  assert.equal(await collection.locator('select').count(),0);
  assert.equal(await collection.getByText(/Each sport and threshold|Every achievement/).count(),0);
  assert.ok(await collection.getByText('7-Day Streak',{exact:true}).count()>0);
  await collection.scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/stats-medals-mobile.png`});
  assert.ok(await page.getByText(/Achieved \d+ times?/).count()>0);
  await page.reload();assert.equal((await stored()).find(l=>l.id==='swim-16').distance,725);assert.equal((await stored()).find(l=>l.id==='run-16'),undefined);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:1280,height:960});await page.getByRole('button',{name:'Browse collection'}).click();await page.locator('[data-render-ready="true"]').waitFor();await page.getByLabel('Medal category',{exact:true}).selectOption('streaks');await page.locator('[data-render-ready="true"]').waitFor();await page.screenshot({path:`${output}/medal-browser-desktop.png`});
  await page.getByRole('button',{name:/^Inspect /}).filter({has:page.locator('svg')}).first().click();await page.locator('[data-render-ready="true"]').waitFor();await page.screenshot({path:`${output}/medal-inspector-desktop.png`});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.screenshot({path:`${output}/medal-inspector-dark.png`});
  assert.deepEqual(errors,[]);console.log('PASS: protected taps, options, long press, drafts, removal, sport strips, continuous collection, bounded canvas, scroll restoration, drag vs tap, inspector, browser back, repeat counts, reload, desktop/dark mode.');
  console.log(`Screenshots: ${output}`);
} catch(error) {
  if(debugPage){await debugPage.screenshot({path:`${output}/failure.png`,fullPage:true});console.log(await debugPage.evaluate(()=>({dialogs:[...document.querySelectorAll('[role="dialog"]')].map(e=>e.textContent),inputs:[...document.querySelectorAll('input')].map(e=>({label:e.getAttribute('aria-label'),value:e.value})),logs:JSON.parse(localStorage.getItem('workout_tracker_logs')).filter(l=>l.date==='2026-11-16')})));}
  throw error;
} finally {await browser.close();}
