const L=require('./lib'),R=require('./data');
const {ic,pair,gap,row,shell,frame,statusBar,appBar,nav,btn,secLabel,photo,mapSvg,avatar,stat,cat}=L;

const section=(label,body)=>`<div style="display:flex;flex-direction:column;gap:var(--sp-sm)">${label}${body}</div>`;
const appActions=(own)=>own?`<div class="slot" role="button" aria-label="Kérés törlése">${ic('delete',24)}</div>`:`<div class="slot" role="button" aria-label="További műveletek">${ic('dots-vertical',24)}</div>`;
const appMenu=(items)=>`<div style="position:absolute;z-index:30;top:52px;right:8px;background:var(--elev2);border-radius:var(--r-md);padding:var(--sp-xs) 0;box-shadow:0 2px 10px rgba(0,0,0,.28)">${items.map(i=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;font:300 17px/24px 'RedHatText-Light';letter-spacing:.25px;color:var(--on-surface)">${ic(i.icon,20,'var(--on-surface)')}<span>${i.t}</span></div>`).join('')}</div>`;

const solvedBanner=(when,own)=>`<div class="banner">${ic('check-circle',24,'var(--nature)')}<div style="flex:1"><div class="t-label-l c-bg" style="font-size:14px">Megoldva · ${when}</div><div style="font:400 12px/16px RedHatText;letter-spacing:.4px;color:var(--on-surface-variant)">${own?'Ez a kérés archiválva van: a feedekből kikerült, csak te és a Megoldott szűrő mutatja.':'A kérő megoldottnak jelölte, ezért archiválva van.'}</div></div></div>`;

const gallery=(imgs)=>!imgs.length?'':`<div><div class="gallery">${photo(imgs[0])}${imgs.length>1?`<span class="peek"></span><span class="pill">1 / ${imgs.length}</span>`:''}</div>${imgs.length>1?`<div class="dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>`;

function head(r){
  const place = r.anywhere ? `${ic('wifi',14)}Bárhol` : `${ic('map-marker-radius',14)}${r.place}, ${r.radius} km`;
  return `<div class="person">${avatar(r.ini,48,r.av)}<div style="flex:1;min-width:0"><div class="t-title-m c-bg">${r.name}${r.own?' <span class="t-label-m c-var" style="font-family:RedHatText-Medium">(te)</span>':''}</div><div class="ph"><div class="sub" style="display:flex;gap:4px;align-items:center;font:400 12px/16px RedHatText;letter-spacing:.4px;color:var(--on-surface-variant)"><span>${r.time}</span><span>·</span>${place}</div></div></div></div>`;
}

const cta=(r)=>r.own?(r.solved
 ? `<div style="display:flex;flex-direction:column;gap:var(--sp-sm)">${btn('Újranyitás',{mode:'outlined',icon:'restore',cls:'big'})}<div class="c-var" style="font:400 12px/16px RedHatText;letter-spacing:.4px;text-align:center">Újranyitáskor a kérés visszakerül a feedekbe, és újra lehet hozzászólni.</div></div>`
 : `<div style="display:flex;flex-direction:column;gap:var(--sp-sm)">${btn('Megoldódott',{mode:'contained',icon:'check-circle-outline',cls:'big'})}<div class="c-var" style="font:400 12px/16px RedHatText;letter-spacing:.4px;text-align:center">Ha már nincs szükséged segítségre, jelöld megoldottnak.</div></div>`)
 : (r.solved?'':btn('Hozzászólok',{mode:'contained',icon:'comment-plus-outline',cls:'big'}));

const mapSec=(t,r)=>section(secLabel('Hol kérik?'),r.anywhere
 ?`<div class="form-surf" style="flex-direction:row;align-items:center;gap:var(--sp-md)">${ic('wifi',24,'var(--primary)')}<div><div class="t-body c-bg" style="font-size:17px">Bárhol</div><div class="c-var" style="font:400 12px/16px RedHatText;letter-spacing:.4px">Nincs földrajzi helyhez kötve, távolról is megoldható.</div></div></div>`
 :`<div class="form-surf" style="padding:0;overflow:hidden;gap:0"><div class="mapbox" style="height:190px;border-radius:0">${mapSvg(t,{w:366,h:190,r:62,user:{x:270,y:140},place:r.place})}</div>
   <div style="padding:var(--sp-md);display:flex;flex-direction:column;gap:2px"><div class="stats">${stat('map-marker-radius',r.place+' · '+r.radius+' km-es körzet')}${r.dist?stat('map-marker',r.dist+' távolságra tőled'):''}</div></div></div>`);

const COMMENTS=[
 {n:'Varga Bence',tm:'12 perce',tx:'Szívesen megnézném a kertet, hétvégén ráérek. Küldök egy üzenetet.',me:true},
 {n:'Molnár Kata',tm:'40 perce',tx:'Az unokatestvérem csinált nálunk hasonlót, nagyon korrekt áron dolgozik.',img:'ph-hedge'},
 {n:'Szabó Gergő',tm:'1 órája',tx:'Szia! Én is kertészkedem a XIII. kerületben, de Újpestre is kijövök. Hány négyzetméter lenne?'},
];
const comments=(list,{closed,count})=>section(secLabel(`Hozzászólások${count?` (${count})`:''}`),
  `<div>${list.map(c=>`<div class="cm"><div class="b"><div class="h"><span class="n">${c.n}</span><span class="tm">${c.tm}</span></div><div class="tx">${c.tx}</div></div>${c.img?`<div class="im">${photo(c.img)}</div>`:''}<div class="iconbtn" role="button" aria-label="További műveletek">${ic('dots-vertical',18)}</div></div>`).join('')||`<div class="c-bg" style="padding:var(--sp-xl);text-align:center;font:300 17px/24px 'RedHatText-Light'">Még nem érkezett vélemény</div>`}</div>`+
  (closed?`<div class="closed-note">${ic('lock-outline',20)}<span>A kérés megoldódott, ezért új hozzászólás nem írható. A meglévők megmaradnak.${closed==='own'?' Újranyitással újra lehet írni.':''}</span></div>
   <div class="cinput dis"><span class="pt">Hozzászólás lezárva</span><div class="acts"><div class="iconbtn">${ic('image-outline',24)}</div><div class="iconbtn">${ic('send',24)}</div></div></div>`
  :`<div class="cinput"><span>Kommented</span><div class="acts"><div class="iconbtn">${ic('image-outline',24)}</div><div class="iconbtn" style="opacity:.5">${ic('send',24)}</div></div></div>`));

function body(t,r,{list=COMMENTS,closed,scroll=0,count}={}){
  return `<div style="transform:translateY(-${scroll}px)">${r.solved?solvedBanner(r.solved,r.own):''}<div style="padding:var(--sp-xl) var(--sp-md) var(--sp-xxl);display:flex;flex-direction:column;gap:var(--sp-lg)">
   ${head(r)}<p class="t-body c-bg">${r.fullText||r.text}</p>${gallery(r.imgs)}<div class="tags">${r.tags.map(x=>cat(x.t,x.m?'match':'')).join('')}</div>${cta(r)}
   ${mapSec(t,r)}${comments(list,{closed,count})}</div></div>`;
}
function dFrame(t,r,{scroll=0,overlay='',list,closed,count,own}={}){
  return frame(t,`${statusBar()}${appBar({title:'Kérés',actions:appActions(r.own)})}<div class="screen"><div class="scroll">${body(t,r,{scroll,list,closed,count})}</div></div>${nav({active:'home'})}${overlay}`);
}
const KERT={...R.kert,fullText:R.kert.text+' Ha van valakinek ajánlása, szívesen veszem, és megnézem a referenciákat is.'};
const BICI={...R.bici,fullText:R.bici.text};
const KAN={...R.kanape,fullText:R.kanape.text+' Köszönöm mindenkinek, már elvitték!'};
const LEKV={...R.lekv,own:false};

const f1=t=>dFrame(t,KERT,{count:3});
const f2=t=>dFrame(t,KERT,{scroll:690,count:3,overlay:appMenu([{icon:'alert-octagon',t:'Jelentés'},{icon:'account-cancel',t:'Felhasználó letiltása'}])});
const f3=t=>dFrame(t,BICI,{list:[],count:0});
const f4=t=>dFrame(t,BICI,{list:[],overlay:`<div class="scrim"></div><div class="dialog"><h3>Megoldódott?</h3><div class="dc">Archiváljuk. A kérés kikerül a feedekből, de a Saját és a Megoldott listában megtalálod, és bármikor újranyithatod. Új hozzászólás már nem érkezhet.</div><div class="da">${btn('Mégsem',{mode:'text'})}${btn('Megoldva',{mode:'contained'})}</div></div>`});
const f5=t=>dFrame(t,KAN,{closed:'own',list:COMMENTS.slice(1).map((c,i)=>({...c,me:false})),count:5});
const f6=t=>dFrame(t,KAN,{scroll:520,closed:'own',list:[{n:'Molnár Kata',tm:'4 napja',tx:'Elvihetném szombaton, jó lesz?'},{n:'Varga Bence',tm:'4 napja',tx:'Igen, délelőtt bármikor.'},{n:'Szabó Gergő',tm:'3 napja',tx:'Köszi, hogy szóltál!'}],count:5});
const f7=t=>dFrame(t,LEKV,{scroll:200,closed:'other',list:[{n:'Kiss Ildikó',tm:'1 hete',tx:'Nekem van 12 üvegem, átadom a hétvégén.'},{n:'Horváth Márta',tm:'1 hete',tx:'Köszönöm, elég lett!'}],count:6});

const reasons=['Sértő, bántó vagy zaklató tartalom','Megszegte a feltételeket','Spam vagy átverés','Nem megbízható','Illegális tevékenység','Gyermekbántalmazás / Kiskorú védelme','Egyéb'];
const f8=t=>dFrame(t,KERT,{count:3,overlay:`<div class="scrim"></div><div class="modalcard"><div class="t-title-m c-bg" style="color:var(--on-surface)">Jelented ezt a kérést?</div>
 <div style="font:400 10px/18px RedHatText;letter-spacing:.4px;color:var(--on-surface-variant)">Kovács Anna</div>
 <div class="excerpt"><div class="t-body" style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;color:var(--on-surface)">${KERT.text}</div></div>
 <div style="margin-top:var(--sp-sm)">${reasons.map((x,i)=>`<div class="radio ${i===2?'on':''}"><div class="rb"><i></i></div><span class="t-body" style="flex:1;color:var(--on-surface)">${x}</span></div>`).join('')}</div>
 <div class="field" style="margin-top:var(--sp-sm);padding:14px 12px 8px"><span class="lab" style="background:var(--background)">Részletek (nem kötelező)</span><div class="val" style="min-height:48px;font-size:17px;line-height:24px"></div></div>
 <div style="display:flex;justify-content:flex-end;gap:var(--sp-sm);margin-top:var(--sp-md)">${btn('Mégse',{mode:'text'})}${btn('Küldés',{mode:'contained'})}</div></div>`});

const loadFrame=t=>frame(t,`${statusBar()}${appBar({title:'Kérés'})}<div class="screen"><div style="padding-top:var(--sp-xxxl);display:flex;justify-content:center"><div class="spin l"></div></div></div>${nav({active:'home'})}`);
const notFound=t=>frame(t,`${statusBar()}${appBar({title:'Kérés'})}<div class="screen" style="align-items:center;justify-content:center;gap:var(--sp-xxxl);padding:0 var(--sp-lg)">${ic('alert',100)}<div class="t-head-l" style="font:800 32px/32px 'Piazzolla-ExtraBold';text-align:center;color:var(--on-background)">Ez a kérés nem található</div><div class="t-body c-bg" style="text-align:center">Lehet, hogy a kérő törölte.</div>${btn('Vissza a kérésekhez',{mode:'contained'})}</div>${nav({active:'home'})}`);

const rows=[
 row('1. Idegen kérés (nyitott) — az oldal teteje',
  'Útvonal: <code>/kerelmek/[id]</code>, fejléc: <code>MyAppbar title="Kérés"</code>. A hero a biznisz oldaláé: szerző (avatar + név, koppintásra profil), idő · hely, teljes szöveg (<code>CollapsibleText</code>/<code>UrlText</code>), képgaléria, kulcsszó-chipek, egy elsődleges pill-gomb (50 px magas, <code>BorderRadius.pill</code>): idegennek „Hozzászólok” (a komment mezőre görget). Az illeszkedő kulcsszavak itt is kiemeltek.',
  pair(f1)),
 row('2. Idegen kérés — lejjebb: hely-térkép, kommentek, ⋮ menü',
  'A hely egy térkép-előnézet a kör (sugár) és a pont jelölésével (<code>FiFeMap</code> + <code>Circle</code>), alatta a körzet és a távolság tőled; „Bárhol” kérésnél ikonos szöveg-kártya. A kommentek a <code>Comments</code> komponens (path: <code>"kerelem/" + id</code>), a ⋮ gombok itt is 44 px-esek. A fejléc menü (<code>setOptions</code> két elemmel → ⋮): Jelentés, Felhasználó letiltása.',
  pair(f2)),
 row('3. Saját kérés (nyitott) — a létrehozó nézete',
  'Különbségek az idegenhez képest: az elsődleges gomb „Megoldódott” (a komment-gomb helyett, mert a saját kéréshez is lehet kommentelni, de a fő teendő az archiválás), a fejlécben egyetlen „Törlés” ikon (<code>delete</code>) Jelentés/Letiltás helyett, a név mellett „(te)”. A kérés szerkesztése nincs a tervben (nyitott kérdés).',
  pair(f3)),
 row('4. „Megoldódott? Archiváljuk.” — megerősítő dialógus',
  'A meglévő <code>showDialog</code> / <code>InfoLayer</code> Dialog (Piazzolla-ExtraBold cím, „Mégsem” + contained gomb). A szöveg elmondja a következményt: kikerül a feedekből, a Saját/Megoldott alatt marad, újranyitható. A gomb felirata „Megoldva”, a végén Snackbar: „A kérés archiválva.”',
  pair(f4)),
 row('5. Megoldott / archivált — saját nézet',
  'Zöld (<code>nature</code>) sáv a tetején: „Megoldva · 3 napja”. A „Megoldódott” gomb „Újranyitás” (outlined) lesz. A kommentek <b>olvashatók maradnak, de a mező zárva van</b> (lásd README: indok).',
  pair(f5)),
 row('5b. Megoldott — lejjebb: lezárt komment-mező (saját) és idegen nézet',
  'A lezárt mező halványított (<code>disabled</code>), fölötte magyarázó sor lakat-ikonnal, hogy ne tűnjön hibának. A komment-menü (jelentés, törlés a saját kommentre) továbbra is működik: az archivált tartalom moderálható marad. Idegen nézetben nincs CTA, a szalag szövege más.',
  pair(f6,{capL:'Saját – lezárt mező (világos)',capD:'Saját – lezárt mező (sötét)'})+gap()+pair(f7,{capL:'Idegen, megoldott (világos)',capD:'Idegen, megoldott (sötét)'})),
 row('6. Jelentés modal',
  'A meglévő <code>ReportContentModal</code> változtatás nélkül, csak egy új <code>targetType</code>: <code>"kerelem"</code> (<code>targetNouns.kerelem = "ezt a kérést"</code>, és a <code>reports.target_type</code> megszorítás bővítése). Az idézet a kérés szövege.',
  pair(f8)),
 row('7. Betöltés és „nem található”',
  'Betöltés: ugyanaz az <code>ActivityIndicator</code>, mint a biznisz oldalon. Törölt/nem létező kérés: <code>ErrorScreen</code> (a biznisz oldal mintájára), a gomb a listára visz.',
  pair(loadFrame,{capL:'Betöltés (világos)',capD:'Betöltés (sötét)'})+gap()+pair(notFound,{capL:'Nem található (világos)',capD:'Nem található (sötét)'})),
];
module.exports=()=>shell({title:'FiFe Kérések – kérés oldal',h1:'Meglévő kérés — részletek, megoldva, jelentés',lead:'Mobil (390×844) tervek világos és sötét témában: idegen és saját nézet, megoldott/archivált állapot, megerősítő dialógus és jelentés.',rows});
