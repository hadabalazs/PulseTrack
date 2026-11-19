import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PULSETRACK_PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://127.0.0.1:5174';
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function seed(context){
  const page=await context.newPage();await page.clock.setFixedTime(new Date('2026-11-19T12:00:00+04:00'));
  await page.addInitScript(()=>{
    if(!localStorage.getItem('workout_tracker_logs')){
      const logs=Array.from({length:18},(_,i)=>({id:`test-${i}`,exercise:'Running',date:`2026-11-${String(i+1).padStart(2,'0')}`,distance:1000}));
      localStorage.setItem('workout_tracker_logs',JSON.stringify(logs));localStorage.setItem('pulsetrack_tracker_sports',JSON.stringify([{id:'primary',sport:'Running'}]));
    }
  });
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);return page;
}
try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Dubai'}),page=await seed(context);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.getByRole('link',{name:'Stats',exact:true}).last().click();await page.getByRole('button',{name:'Browse collection'}).waitFor();
  assert.ok(!requests.some(url=>url.includes('/MedalStage-')),'3D must stay lazy before opening a viewer');
  await page.getByRole('button',{name:'Browse collection'}).click();await page.locator('[data-render-ready="true"]').waitFor();
  assert.ok(requests.some(url=>url.includes('/MedalStage-')));
  await page.locator('[data-render-ready="true"] canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.getByRole('button',{name:'Retry 3D'}).waitFor();await page.getByRole('button',{name:'Retry 3D'}).click();await page.locator('[data-render-ready="true"]').waitFor();
  await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.waitForTimeout(100);
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Browse collection'}).waitFor();
  await page.getByRole('button',{name:'Browse collection'}).click();await page.locator('[data-render-ready="true"]').waitFor();
  console.log('PASS: production lazy load, WebGL context-loss fallback and retry, cached offline collection and 3D.');await context.close();
  // A separate browser profile has never loaded the renderer chunk.
  const cold=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Dubai'}),coldPage=await seed(cold);
  await coldPage.getByRole('link',{name:'Stats',exact:true}).last().click();await coldPage.getByRole('button',{name:'Browse collection'}).waitFor();
  await cold.setOffline(true);await coldPage.getByRole('button',{name:'Browse collection'}).click();
  await coldPage.getByText(/Medal images are available while 3D loads/).waitFor();
  assert.ok(await coldPage.getByRole('dialog').locator('img').count()>0);
  console.log('PASS: uncached renderer while offline retains accessible medal images and metadata.');await cold.close();
}finally{await browser.close();}
