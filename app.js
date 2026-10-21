/* markov-text-studio — Markov chain text generator */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const S={corpus:'',order:2,temp:1.0,model:null};
function tok(t){return t.toLowerCase().replace(/[“”]/g,'"').split(/\s+/).filter(Boolean)}
function build(){
  S.model={};
  const words=tok(S.corpus);
  const o=S.order;
  if(words.length<o+2){S.model=null;return false}
  for(let i=0;i<words.length-o;i++){
    const key=words.slice(i,i+o).join(' ');
    (S.model[key]=S.model[key]||[]).push(words[i+o]);
  }
  $('st-words').textContent=words.length.toLocaleString();
  $('st-vocab').textContent=new Set(words).size.toLocaleString();
  $('st-trans').textContent=Object.keys(S.model).length.toLocaleString();
  return true;
}
function pick(arr,temp){
  if(temp===1)return arr[Math.floor(Math.random()*arr.length)];
  // temperature: sharpen (<1) or flatten (>1) by re-weighting duplicates
  const counts={};arr.forEach(w=>counts[w]=(counts[w]||0)+1);
  const ws=Object.keys(counts).map(w=>({w,p:Math.pow(counts[w],1/temp)}));
  const sum=ws.reduce((a,x)=>a+x.p,0);let r=Math.random()*sum;
  for(const x of ws){r-=x.p;if(r<=0)return x.w}
  return ws[0].w;
}
function generate(maxWords,seed){
  const keys=Object.keys(S.model);
  let cur;
  if(seed){
    const ws=tok(seed);
    for(let k=Math.min(ws.length,S.order);k>0&&!cur;k--){
      const c=keys.filter(key=>key.startsWith(ws.slice(-k).join(' ')));
      if(c.length)cur=c[Math.floor(Math.random()*c.length)];
    }
  }
  if(!cur)cur=keys[Math.floor(Math.random()*keys.length)];
  const out=cur.split(' ');
  for(let i=0;i<maxWords;i++){
    const nexts=S.model[cur];if(!nexts)break;
    const nxt=pick(nexts,S.temp);
    out.push(nxt);
    cur=(cur.split(' ').slice(1).concat(nxt)).join(' ');
  }
  let s=out.join(' ');
  s=s.replace(/\s+([,.!?;:])/g,'$1');
  return s.charAt(0).toUpperCase()+s.slice(1)+(/[.!?]$/.test(s)?'':'.');
}
function render(list){
  const host=$('out');host.innerHTML='';
  list.forEach((t,i)=>{
    const d=document.createElement('div');d.className='gen-line result-anim';d.style.animationDelay=(i*0.07)+'s';
    d.innerHTML=`<p>${t}</p><div class="gen-acts">
      <button class="icon-btn" title="Copy" onclick="pkCopy(this.parentElement.previousElementSibling.textContent)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      <button class="icon-btn" title="Speak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg></button></div>`;
    d.querySelector('[title=Speak]').onclick=()=>{const u=new SpeechSynthesisUtterance(t);u.lang=/[\u0900-\u097F]|shayari/i.test($('corpus-sel').value)?'hi-IN':'en-US';speechSynthesis.cancel();speechSynthesis.speak(u)};
    host.appendChild(d);
  });
}
function go(){
  if(!S.model&&!build()){pkToast('Corpus too small — add more text first');return}
  const n=+$('count').value,mw=+$('len').value,seed=$('seed').value.trim();
  render(Array.from({length:n},()=>generate(mw,seed)));
}
function setCorpus(name){
  const txt=(CORPORA[name]||[]).join('. ')+'.';
  $('corpus').value=txt;S.corpus=txt;build();
  localStorage.setItem('mts-corpus',txt);
  $('corpus-sel').value=name;
}
document.addEventListener('DOMContentLoaded',()=>{
  Object.keys(CORPORA).forEach(k=>{const o=document.createElement('option');o.value=o.textContent=k;$('corpus-sel').appendChild(o)});
  $('corpus-sel').onchange=e=>setCorpus(e.target.value);
  $('corpus').addEventListener('input',e=>{S.corpus=e.target.value;localStorage.setItem('mts-corpus',S.corpus);build()});
  $('go').onclick=go;
  $('temp').oninput=e=>{S.temp=+e.target.value;$('temp-val').textContent=S.temp.toFixed(1)};
  $('order').onchange=e=>{S.order=+e.target.value;build()};
  const saved=localStorage.getItem('mts-corpus');
  if(saved){$('corpus').value=saved;S.corpus=saved;$('corpus-sel').value='';build()}
  else setCorpus('Shayari (Romanized Hindi)');
  go();
});
})();
