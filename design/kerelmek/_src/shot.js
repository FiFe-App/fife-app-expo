// Playwright screenshotok. Használat: node shot.js [lista|uj-kereses|kerelem ...]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const OUT=path.resolve(__dirname,'..');const TMP=process.env.SHOTS||'/tmp/kerelmek-shots';
fs.mkdirSync(TMP,{recursive:true});fs.mkdirSync(OUT+'/screens',{recursive:true});
(async()=>{
  const b=await chromium.launch();
  const names=process.argv.slice(2).length?process.argv.slice(2):['lista','uj-kereses','kerelem'];
  for(const n of names){
    if(!fs.existsSync(`${OUT}/${n}.html`))continue;
    const errs=[];
    for(const [w,suffix] of [[390,'390'],[860,'overview']]){
      const p=await b.newPage({viewport:{width:w,height:844},deviceScaleFactor:1});
      p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(String(e)));
      await p.goto('file://'+`${OUT}/${n}.html`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
      await p.screenshot({path:`${OUT}/screens/${n}-${suffix}.png`,fullPage:true});
      if(w===390){
        const o=await p.evaluate(()=>{const bad=[];const sw=document.documentElement.scrollWidth;
          document.querySelectorAll('.frame,.crop').forEach((f,fi)=>{const fr=f.getBoundingClientRect();
            f.querySelectorAll('*').forEach(e=>{
              if(e.closest('svg')&&e.tagName!=='svg')return; if(e.closest('.cards-strip,.scroll,.scrim'))return;
              const cs=getComputedStyle(e);if(cs.position==='absolute')return;
              const r=e.getBoundingClientRect();
              if(r.width&&(r.right>fr.right+1||r.left<fr.left-1))bad.push('out '+fi+':'+(e.className.baseVal??e.className)+':'+Math.round(r.left-fr.left)+'..'+Math.round(r.right-fr.left));
              if(e.children.length===0&&!e.classList.contains('chip')&&e.scrollWidth>e.clientWidth+1&&cs.overflow==='visible'&&e.clientWidth>0&&e.tagName!=='path')bad.push('txt '+fi+':'+(e.className.baseVal??e.className)+':'+e.textContent.slice(0,30));
            });
            // tartalom a .scroll-ban: függőleges kilógás nem hiba (görgethető), de a nem-scroll részek ne lógjanak a keretből
            const sc=f.scrollHeight>f.clientHeight+1&&f.classList.contains('frame');if(sc)bad.push('frame '+fi+' scrollHeight '+f.scrollHeight);
          });
          return {sw,bad:bad.slice(0,30)}});
        console.log(n,'scrollWidth',o.sw,o.bad.length?JSON.stringify(o.bad):'ok, nincs túlcsordulás');
        const frames=await p.$$('.frame,.crop');let i=0;
        for(const f of frames){await f.screenshot({path:`${TMP}/${n}-f${String(i++).padStart(2,'0')}.png`});}
        console.log(n,'frames',i,'->',TMP);
      }
      await p.close();
    }
    if(errs.length)console.log('ERR',n,errs.slice(0,5));
  }
  await b.close();
})();
