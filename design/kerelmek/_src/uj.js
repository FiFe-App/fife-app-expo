const L=require('./lib'),R=require('./data');
const {ic,pair,gap,row,shell,frame,statusBar,appBar,fab,btn,chip,secLabel,reqCard,photo,mapSvg,cat}=L;

const TEXT='Valaki kölcsönadna egy fúrógépet szombatra? Csak két polcot kellene felfúrnom, a sajátom épp elromlott.';
const surf=(inner)=>`<div class="form-surf">${inner}</div>`;
const section=(label,body)=>`<div style="display:flex;flex-direction:column;gap:var(--sp-sm)">${label}${body}</div>`;
const helper=(l,r,err)=>`<div class="helper ${err?'err':''}"><span class="e">${err?ic('alert-circle-outline',14):''}<span>${l}</span></span><span style="white-space:nowrap;flex:none">${r||''}</span></div>`;
const field=(label,val,{state='',ph=false}={})=>`<div><div class="field ${state}"><span class="lab">${label}</span><div class="val ${ph?'ph-t':''}">${val}</div></div></div>`;
const intro=`<div style="display:flex;align-items:center;gap:var(--sp-sm);padding:0 var(--sp-xs)"><span style="flex:1;font:300 17px/24px 'RedHatText-Light';letter-spacing:.25px;color:var(--on-surface-variant)">Kérj segítséget a környékedtől.</span><span class="iconbtn" role="button" aria-label="Mi ez az oldal?">${ic('help-circle-outline',22)}</span></div>`;

const thumb=(id,{state,pct}={})=>`<div class="thumb">${photo(id)}${state==='up'?`<div class="ov"><div class="spin"></div>${pct}%</div>`:''}${state==='done'?`<div class="ov" style="background:rgba(15,100,60,.55)">${ic('check',24,'#fff')}</div>`:''}${state==='wait'?`<div class="ov">${ic('progress-clock',22,'#fff')}Vár</div>`:''}${state==='bad'?`<div class="ov bad">${ic('alert-circle-outline',22)}Túl nagy</div>`:''}${state?'':`<span class="del" role="button" aria-label="Kép törlése"><i>${ic('close',16)}</i></span>`}</div>`;
const addTile=(dis)=>`<div class="thumb add" style="${dis?'opacity:.5':''}" role="button" aria-label="Kép hozzáadása">${ic('image-plus',24)}<span>Kép</span></div>`;
const imagesSec=(imgs,{states=[],err}={})=>section(secLabel('Képek',{opt:true,cnt:`${imgs.length} / 4`}),surf(`<div class="thumbs">${imgs.map((i,k)=>thumb(i,states[k]||{})).join('')}${imgs.length<4?addTile():''}</div>${err?helper('A kép nagyobb 10 MB-nál, válassz kisebbet.','',true):helper('Legfeljebb 4 kép. Segít, ha látszik, miről van szó.','')}`));

const radiusRow=(sel)=>`<div><div style="font:500 12px/16px 'RedHatText-Medium';letter-spacing:.5px;color:var(--on-surface-variant);padding:0 0 8px">Körzet sugara</div><div class="radius-row">${[1,3,5,10,25].map(k=>chip(k+' km',{sel:k===sel})).join('')}</div></div>`;
const R_PX={1:24,3:48,5:68,10:92,25:104};
const locSec=(t,{mode='map',rad=5,pt=true,err}={})=>section(secLabel('Hol kéred?'),surf(
  `<div class="seg" role="tablist"><div class="${mode==='net'?'on':''}">${ic('wifi',18)}Bárhol</div><div class="${mode==='map'?'on':''}">${ic('map-marker',18)}Térképen</div></div>`+
  (mode==='net'?`<div style="font:300 17px/24px 'RedHatText-Light';letter-spacing:.25px;color:var(--on-surface-variant)">A kérésed bárhonnan látható, nincs földrajzi helyhez kötve. Olyan kérésnél jó, amit távolról is meg lehet oldani.</div>`
  :pt?`<div class="mapbox" style="height:200px">${mapSvg(t,{w:334,h:200,r:R_PX[rad],user:{x:250,y:150}})}</div>
     <div class="stat">${ic('map-marker-radius',16,'var(--primary)')}<span>Újpest, Árpád út környéke · ${rad} km-es körzet</span></div>${radiusRow(rad)}
     ${btn('Környék módosítása',{mode:'tonal',cls:'block'})}`
  :`<div class="mapbox" style="height:200px;background:var(--surface-variant);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px solid var(--error);color:var(--on-surface-variant)">${ic('map-marker-radius',32)}<span style="font:400 14px/20px RedHatText">Még nincs kijelölt hely</span>${btn('Hely kijelölése',{mode:'tonal'})}</div>
     ${helper('Jelölj ki egy pontot a térképen, vagy válaszd a „Bárhol” lehetőséget.','',true)}`)));

const tagEdit=(t)=>`<span class="tag-edit">${t}<span class="x" role="button" aria-label="Eltávolítás">${ic('close',16)}</span></span>`;
const tagsSec=(tags,{err}={})=>section(secLabel('Kulcsszavak',{req:true}),surf(`<div class="tags" style="gap:var(--sp-xs);align-items:center">${tags.map(tagEdit).join('')}<span class="chip dashed icon">${ic('plus',18)}Új kulcsszó</span></div>${err?helper('Adj meg legalább egy kulcsszót, így találnak rád.','',true):helper('Pl. kertészet, szerszám, költöztetés. Ugyanaz a kulcsszó-lista, mint a bizniszeknél.','')}`));

const previewSec=()=>section(secLabel('Így látják majd mások a kérésed'),reqCard({name:'Varga Bence',ini:'VB',av:4,time:'most',place:'Újpest',radius:5,comments:0,text:TEXT,imgs:['ph-drill','ph-boxes','ph-sofa'],tags:[{t:'szerszám'},{t:'kölcsönzés'}]},{menuIcon:false,showFooter:false}));

const submit=(dis=false)=>`<div class="submitbar">${btn('Közzététel',{mode:'contained',icon:'send',cls:'h56 block '+(dis?'dis':'')})}</div>`;
const snack=(txt,bottom)=>`<div class="snack" style="bottom:${bottom}px">${txt}</div>`;

function formFrame(t,{scroll=0,body,overlay='',dis=false}={}){
  return frame(t,`${statusBar()}${appBar({title:'Új kérés'})}<div class="screen"><div class="scroll"><div style="transform:translateY(-${scroll}px);padding:var(--sp-lg) var(--sp-md) var(--sp-xxl);display:flex;flex-direction:column;gap:var(--sp-lg)">${body}</div></div></div>${submit(dis)}<div style="height:16px;background:var(--elev2);flex:none"></div>${overlay}`);
}
const textSec=(val,{state='',err,ph,count})=>section(secLabel('Mit kérsz?',{req:true}),surf(field('Kérésed *',val,{state,ph})+helper(err||'Írd le röviden, mire van szükséged.',count||'0 / 600',!!err)));

const A=t=>formFrame(t,{dis:false,body:intro+textSec('Pl. Kertészt keresek Újpesten, vagy: Valaki kölcsönadna egy fúrógépet?',{ph:true})+imagesSec([])+locSec(t,{mode:'map',rad:5})+tagsSec([])});
const A2=t=>formFrame(t,{scroll:330,body:intro+textSec('Pl. Kertészt keresek Újpesten, vagy: Valaki kölcsönadna egy fúrógépet?',{ph:true})+imagesSec([])+locSec(t,{mode:'map',rad:5})+tagsSec([])});
const B=t=>formFrame(t,{scroll:262,body:intro+textSec(TEXT,{count:'104 / 600'})+imagesSec(['ph-drill','ph-boxes','ph-sofa'])+locSec(t,{mode:'net'})+tagsSec(['szerszám','kölcsönzés'])+previewSec()});
const B2=t=>formFrame(t,{scroll:760,body:intro+textSec(TEXT,{count:'104 / 600'})+imagesSec(['ph-drill','ph-boxes','ph-sofa'])+locSec(t,{mode:'net'})+tagsSec(['szerszám','kölcsönzés'])+previewSec()});
const C1=t=>formFrame(t,{body:intro+textSec('Fúró',{state:'bad',err:'Legalább 10 karakter kell, hogy értsék, mire van szükséged.',count:'4 / 600'})+imagesSec(['ph-drill','ph-boxes'],{states:[{},{state:'bad'}],err:true})+locSec(t,{mode:'map',pt:false})+tagsSec([],{err:true}),
  overlay:snack('Javítsd a pirossal jelölt mezőket.',113)});
const C2=t=>formFrame(t,{scroll:560,body:intro+textSec('Fúró',{state:'bad',err:'Legalább 10 karakter kell, hogy értsék, mire van szükséged.',count:'4 / 600'})+imagesSec(['ph-drill','ph-boxes'],{states:[{},{state:'bad'}],err:true})+locSec(t,{mode:'map',pt:false})+tagsSec([],{err:true}),
  overlay:snack('Javítsd a pirossal jelölt mezőket.',113)});
const D=t=>formFrame(t,{scroll:200,dis:true,body:intro+textSec(TEXT,{count:'104 / 600'})+imagesSec(['ph-drill','ph-boxes','ph-sofa'],{states:[{state:'done'},{state:'up',pct:64},{state:'wait'}]})+locSec(t,{mode:'net'})+tagsSec(['szerszám','kölcsönzés']),
  overlay:`<div class="scrim"></div><div class="dialog" style="padding:24px"><div style="display:flex;flex-direction:column;align-items:center;gap:16px"><div class="spin l"></div><div style="text-align:center;font:300 17px/24px 'RedHatText-Light';letter-spacing:.25px;color:var(--on-surface)">Kérlek várj, amíg a kérésed feltöltődik</div>
  <div style="width:100%"><div style="height:6px;border-radius:3px;background:var(--surface-variant);overflow:hidden"><div style="width:45%;height:100%;background:var(--primary)"></div></div><div class="c-var" style="font:400 12px/16px RedHatText;letter-spacing:.4px;text-align:center;padding-top:6px">Képek feltöltése: 1 / 3</div></div></div></div>`});

// helyválasztó modal (MapSelector, markerOnly)
const E=t=>frame(t,`${statusBar()}${appBar({title:'Új kérés'})}<div class="screen"><div class="scroll" style="padding:var(--sp-lg) var(--sp-md)">${intro}</div></div>
 <div class="scrim"></div>
 <div style="position:absolute;z-index:31;left:19px;right:19px;top:42px;bottom:42px;border-radius:16px;background:var(--background);overflow:hidden;display:flex;flex-direction:column">
  <div style="flex:1;position:relative;min-height:0;overflow:hidden"><div class="mapbox" style="position:absolute;inset:0;border-radius:0">${mapSvg(t,{w:352,h:640,r:0,cx:150,cy:300,user:{x:230,y:360}})}</div>
   <div style="position:absolute;z-index:10;top:0;left:0;right:0;padding:6px"><div style="height:56px;border-radius:999px;border:1px solid var(--outline);background:var(--background);display:flex;align-items:center;padding:0 16px;gap:8px;color:var(--on-surface-variant);font:300 17px/24px 'RedHatText-Light'">${ic('magnify',22)}Keress címre...</div></div>
   <div style="position:absolute;top:80px;width:100%;display:flex;justify-content:center"><span class="chip icon" style="background:var(--surface-variant);border-color:transparent;color:var(--on-surface-variant);font:500 11px/16px 'RedHatText-Medium';height:32px">${ic('map-marker',18)}Kattints a térképre hogy kiválassz egy pontot!</span></div>
   <div style="position:absolute;right:10px;top:130px;width:56px;height:56px;border-radius:16px;background:var(--primary-container);color:var(--on-primary-container);display:flex;align-items:center;justify-content:center">${ic('crosshairs-gps',24)}</div>
   <div style="position:absolute;right:10px;bottom:20px;display:flex;flex-direction:column"><div class="iconbtn" style="background:var(--secondary-container);color:var(--on-secondary-container);border-radius:20px 20px 0 0;width:40px;height:40px">${ic('plus',24)}</div><div class="iconbtn" style="background:var(--secondary-container);color:var(--on-secondary-container);border-radius:0 0 20px 20px;width:40px;height:40px">${ic('minus',24)}</div></div></div>
  <div style="padding:8px;display:flex;justify-content:flex-end;gap:8px;flex:none;background:var(--background)">${btn('Mégsem',{mode:'tonal'})}${btn('Kiválasztás',{mode:'contained'})}</div></div>`);

const rows=[
 row('1. Új kérés — üres űrlap (az oldal teteje)',
  'Útvonal: <code>/kerelmek/new</code> (a bottom nav itt is elrejtendő, mint a /biznisz/new-n: <code>showBottomNav</code> kivétel). Felépítés a <code>BuzinessEditScreen</code>-é: <code>SectionLabel</code> + <code>Surface elevation=1</code> blokkok, gap <code>Spacing.lg</code>, alul rögzített beküldő sáv (<code>Surface elevation=2</code>, 56 px magas gomb). Kötelező: szöveg (min. 10, max. 600 karakter) és legalább 1 kulcsszó. Alapértelmezés: „Térképen”, a profil helyével és 5 km-es sugárral kitöltve; ha nincs mentett hely, „Bárhol” az alapérték.',
  pair(A,{capL:'Felül (világos)',capD:'Felül (sötét)'})+gap()+pair(A2,{capL:'Lejjebb: hely, sugár (világos)',capD:'Lejjebb: hely, sugár (sötét)'})),
 row('2. Kitöltve — „Bárhol” állapot, 3 kép, kulcsszavak, előnézet (lejjebb görgetve)',
  'Képválasztó: négyzetes bélyegképek, 77 px-es csempék (4 oszlop), a törlés ikon 24 px-es, de 44×44 px-es érintési felülettel a csempe sarkában; a „Kép” csempe a 4. kép után eltűnik. A „Bárhol” (SegmentedButtons, mint a BuzinessEditScreen-ben) elrejti a térképet és a sugarat. Alul az „Így látják majd mások” előnézet a kérés-kártya <code>preview</code> módjával.',
  pair(B,{capL:'Képek, hely (világos)',capD:'Képek, hely (sötét)'})+gap()+pair(B2,{capL:'Előnézet (világos)',capD:'Előnézet (sötét)'})),
 row('3. Validációs hibák — a beküldő gomb aktív marad, a hibák a mezőknél jelennek meg',
  'Indok: letiltott gomb nem mondja meg, mi hiányzik; ezért kattintásra jelöljük a hibás mezőket (<code>error</code> keret + ikonos HelperText, 12 px-es betűvel, mert a téma bodySmall-ja mobilon 10 px), a nézet az első hibához görget és Snackbar jelez. Hibák: túl rövid szöveg, 10 MB feletti kép, nincs kijelölt hely, nincs kulcsszó.',
  pair(C1,{capL:'Felül (világos)',capD:'Felül (sötét)'})+gap()+pair(C2,{capL:'Lejjebb (világos)',capD:'Lejjebb (sötét)'})),
 row('4. Feltöltés közben',
  'Mint a biznisznél: <code>showLoading({ dismissable: false })</code> blokkoló dialógus, benne ActivityIndicator, szöveg és a képek haladása (1 / 3). A kérés sora előbb jön létre, a képek utána töltődnek (mint a komment-képeknél); ha egy kép hibázik, a kérés létrejön és Snackbar jelzi: „A kép feltöltése nem sikerült”. A gomb ilyenkor letiltott, így nincs dupla beküldés.',
  pair(D)),
 row('5. Helyválasztó modal — a meglévő <code>MapSelector</code> (markerOnly), változtatás nélkül',
  'A „Környék módosítása” / „Térképen” ugyanazt a 90%×90%-os Paper Modalt nyitja, mint a biznisznél: címkereső (LocationIQ), „Kattints a térképre…” súgó, zoom és „saját hely” gombok, Mégsem / Kiválasztás. A sugarat nem a modal, hanem az űrlap választó-chipjei állítják (1 / 3 / 5 / 10 / 25 km), mert a MapSelector-nak nincs sugár-vezérlője, és a chipek egy érintéssel, csúszka nélkül használhatók.',
  pair(E)),
];
module.exports=()=>shell({title:'FiFe Kérések – új kérés',h1:'Új kérés — űrlap',lead:'Mobil (390×844) tervek világos és sötét témában: üres, kitöltött, hibás és feltöltés közbeni állapot, valamint a helyválasztó.',rows});
