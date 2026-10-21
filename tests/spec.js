module.exports=async(page)=>{
  await page.waitForSelector('#out .gen-line',{timeout:8000});
  const n=await page.$$eval('#out .gen-line',x=>x.length);
  if(n<1)throw new Error('no lines generated');
  const stats=await page.$eval('#st-trans',e=>e.textContent);
  if(stats==='0')throw new Error('model not built');
  await page.click('#go');
  await new Promise(r=>setTimeout(r,400));
  const t=await page.$eval('#out .gen-line p',e=>e.textContent);
  if(!t||t.length<5)throw new Error('empty generation');
  return `generated ${n} lines, transitions=${stats}`;
};
