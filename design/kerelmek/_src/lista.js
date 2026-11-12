const L=require('./lib'),R=require('./data');
const {ic,pair,gap,row,shell,frame,statusBar,appBar,fakeSearch,slimey,nav,fab,menu,reqCard,chip,btn,stat,cat,avatar}=L;

const FILTERS=['Neked','Mind','Saját','Megoldott'];
const filterBand=(sel)=>`<div style="background:var(--surface);padding:var(--sp-sm) var(--sp-lg);display:flex;gap:var(--sp-sm);flex:none;overflow:hidden">${FILTERS.map(f=>chip(f,{sel:f===sel})).join('')}</div>`;
const subHead=(title,right)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:0 var(--sp-lg);min-height:44px;flex:none"><span class="t-label-l c-sec">${title}</span>${right===undefined?`<span class="btn text sm">${ic('filter',18)}Finomítás</span>`:right}</div>`;
const listWrap=(inner)=>`<div style="padding:0 var(--sp-md) var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-sm)">${inner}</div>`;
const divider=(t)=>`<div style="padding:var(--sp-sm) var(--sp-xs) 0"><div class="t-label-m c-bg">${t}</div><div style="height:1px;background:var(--outline-variant);margin:var(--sp-sm) 0 0"></div></div>`;
const clickAway=`<div style="position:absolute;inset:0;z-index:19"></div>`;

function listFrame(t,{sel='Neked',body,overlay='',fabShow=true,searchTxt='Keress kérésekre...',searchVal=false,head,navActive='home'}={}){
  return frame(t,`${statusBar()}${appBar({center:fakeSearch(searchTxt,searchVal)})}${filterBand(sel)}<div class="screen"><div class="scroll">${head}${body}</div>${fabShow?fab():''}${overlay}</div>${nav({active:navActive})}`);
}

const f1=t=>listFrame(t,{head:subHead('Kérések neked'),body:listWrap(reqCard(R.kert)+reqCard(R.furo)+divider('Egyéb kérések a környéken')+reqCard(R.kolt))});
const f2=t=>listFrame(t,{sel:'Mind',head:subHead('Összes kérés'),body:listWrap(reqCard(R.furo)+reqCard(R.ford)+reqCard(R.kolt)),
  overlay:`${clickAway}${menu([{icon:'account',t:'Nagy Péter profilja'},{icon:'alert-octagon',t:'Jelentés'},{icon:'account-cancel',t:'Felhasználó letiltása'}],'right:20px;top:84px')}`});
const f3=t=>listFrame(t,{sel:'Saját',head:subHead('Saját kéréseid'),body:listWrap(reqCard(R.bici)+reqCard(R.kanape)),
  overlay:`${clickAway}${menu([{icon:'check-circle-outline',t:'Megoldva'},{icon:'delete',t:'Törlés',err:true}],'right:20px;top:84px')}`});
const f4=t=>listFrame(t,{sel:'Megoldott',head:subHead('Megoldott kérések'),body:listWrap(reqCard(R.lekv)+reqCard(R.kanape))});

const skCard=`<div class="card" style="gap:var(--sp-md)"><div class="ph"><div class="sk" style="width:40px;height:40px"></div><div class="who" style="display:flex;flex-direction:column;gap:6px"><div class="sk" style="height:14px;width:45%"></div><div class="sk" style="height:12px;width:65%"></div></div></div>
 <div style="display:flex;flex-direction:column;gap:8px"><div class="sk" style="height:16px"></div><div class="sk" style="height:16px"></div><div class="sk" style="height:16px;width:70%"></div></div><div class="sk" style="height:150px"></div><div style="display:flex;gap:4px"><div class="sk" style="height:24px;width:70px"></div><div class="sk" style="height:24px;width:56px"></div></div></div>`;
const f5=t=>listFrame(t,{head:subHead('Kérések neked'),body:listWrap(skCard+skCard)});

const empty=(title,sub,cta)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-sm);padding:var(--sp-xxxl) var(--sp-xl);text-align:center">
 <div style="width:72px;height:72px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--on-surface-variant)">${ic('hand-heart-outline',40)}</div>
 <div class="t-title-m c-bg" style="margin-top:var(--sp-sm)">${title}</div>
 <div class="c-var" style="font:400 12px/18px RedHatText;letter-spacing:.4px;max-width:28ch">${sub}</div>${cta?`<div style="margin-top:var(--sp-sm)">${cta}</div>`:''}</div>`;
const f6=t=>listFrame(t,{sel:'Megoldott',head:subHead('Megoldott kérések'),body:empty('Még nincs megoldott kérés','Amint valaki megoldottnak jelöli a kérését, itt találod meg.')});
const f6b=t=>listFrame(t,{sel:'Neked',head:subHead('Kérések neked'),body:empty('Nincs kérés a környékeden','Légy te az első, aki kér valamit a közösségtől.',btn('Kérj te valamit',{mode:'tonal'}))});

/* ---------- HOME ---------- */
const radarTile=(n,ini,i,rev)=>`<div style="width:92px;display:flex;flex-direction:${rev?'column-reverse':'column'};align-items:center;gap:4px">${avatar(ini,72,i)}<span style="font:700 11px/16px 'Piazzolla-Regular';letter-spacing:.5px;color:var(--on-background);max-width:88px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</span></div>`;
const radar=`<div><div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-sm) var(--sp-lg);min-height:44px"><div style="display:flex;align-items:flex-end;gap:4px"><span class="t-label-l c-sec">FiFe Radar</span>${ic('wifi',18,'var(--secondary)')}</div><div style="display:flex;gap:4px;align-items:center"><span class="t-label-m c-pri" style="font-family:RedHatText-Bold">Muti többet</span>${ic('chevron-right',18,'var(--primary)')}</div></div>
<div style="display:flex;gap:4px;padding:8px 4px;overflow:hidden">${[['Réka','RK',2],['Gábor','GB',3],['Ildikó','IL',0],['Dávid','DÁ',5],['Mari','MA',1]].map((x,i)=>radarTile(x[0],x[1],x[2],i%2)).join('')}</div></div>`;
const bizCard=`<div class="card"><div class="t-title-l c-bg" style="font-size:18px;line-height:24px">Fűnyírás és kertápolás</div>
<div class="tags">${cat('új','new')}${cat('kertészet')}${cat('fűnyírás')}${cat('metszés')}</div>
<div class="stats">${stat('account','Horváth Márta')}${stat('account-group','12 ember ajánlja')}${stat('map-marker','1,2 km távolságra')}</div>
<div class="t-body clamp3" style="-webkit-line-clamp:4">Magánkertek, társasházi zöldterületek gondozása Újpesten és környékén. Hétvégén is vállalok munkát, saját géppel dolgozom.</div></div>`;
const sectionHeader=`<div class="sec-head"><div class="l"><span class="t-label-l c-sec">Kérések neked</span>${ic('hand-heart-outline',18,'var(--secondary)')}</div><div class="r" role="link"><span class="t-label-m c-pri" style="font-family:RedHatText-Bold">Mind</span>${ic('chevron-right',18,'var(--primary)')}</div></div>`;
const endCard=`<div class="endcard"><div style="width:40px;height:40px;border-radius:50%;background:var(--secondary-container);color:var(--on-secondary-container);display:flex;align-items:center;justify-content:center">${ic('arrow-right',24)}</div><span class="t-label-m">Mind a 14 kérés</span></div>`;
const strip=(cards)=>`<div class="cards-strip">${cards}</div>`;
const homeShell=(t,section)=>frame(t,`${statusBar()}${appBar({back:false,center:fakeSearch('Mire van szükséged?')})}<div class="screen"><div class="scroll">${section}${radar}
 <div class="sticky-head"><span class="t-label-l c-sec">Közeli Bizniszek neked</span>${ic('map-marker',18,'var(--secondary)')}<span style="flex:1"></span><span class="t-label-m c-pri" style="font-family:RedHatText-Bold;display:flex;gap:4px;align-items:center">Keresés${ic('chevron-right',18,'var(--primary)')}</span></div>
 <div style="padding:var(--sp-sm) var(--sp-md)">${bizCard}</div></div></div>${nav({active:'home'})}`);
const h1=t=>homeShell(t,sectionHeader+strip(reqCard(R.kert,{compact:true})+reqCard(R.furo,{compact:true})+endCard));

const secEmpty=sectionHeader+`<div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-sm);padding:var(--sp-sm) var(--sp-lg) var(--sp-xl)"><span class="c-bg" style="font:400 12px/22px RedHatText;letter-spacing:.5px;text-align:center">Nincs kérés a környékeden</span><span class="c-var" style="font:400 12px/16px RedHatText;letter-spacing:.4px;text-align:center">Ha segítség kell, kérdezd meg a közösséget.</span>${btn('Kérj te valamit',{mode:'tonal'})}</div>`;
const skCompact=`<div class="card compact"><div class="ph"><div class="sk" style="width:28px;height:28px"></div><div class="sk" style="height:14px;flex:1"></div></div><div style="display:flex;flex-direction:column;gap:8px"><div class="sk" style="height:14px"></div><div class="sk" style="height:14px"></div><div class="sk" style="height:14px;width:60%"></div></div><div style="display:flex;gap:4px"><div class="sk" style="height:24px;width:70px"></div><div class="sk" style="height:24px;width:56px"></div></div><div class="sk" style="height:16px;width:50%;margin-top:auto"></div></div>`;
const secLoad=sectionHeader+strip(skCompact+skCompact);
const secErr=sectionHeader+`<div style="display:flex;align-items:center;gap:var(--sp-md);margin:0 var(--sp-md) var(--sp-md);padding:var(--sp-md);border-radius:var(--r-lg);background:var(--error-container);color:var(--on-error-container)">${ic('alert-circle-outline',24)}<span style="flex:1;font:400 14px/20px RedHatText">Nem sikerült betölteni a kéréseket.</span><span class="btn text sm" style="color:var(--on-error-container)">Újra</span></div>`;

/* ---------- KERESÉS ---------- */
const MODES=[['Bizniszek','briefcase-outline'],['Fifék','account'],['Kérések','hand-heart-outline']];
const modeBand=(sel)=>`<div style="background:var(--surface);padding:var(--sp-sm) var(--sp-lg);display:flex;gap:var(--sp-sm);flex:none">${MODES.map(m=>chip(m[0],{sel:m[0]===sel,icon:m[1]})).join('')}</div>`;
const histRow=(txt,icon='history',x=true)=>`<div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md) var(--sp-lg);min-height:48px">${ic(icon,20,'var(--on-surface-variant)')}<span style="flex:1;font:400 12px/22px RedHatText;letter-spacing:.5px;color:var(--on-surface)">${txt}</span>${x?`<span style="width:44px;height:44px;margin:-12px -12px -12px 0;display:flex;align-items:center;justify-content:center">${ic('close',18,'var(--on-surface-variant)')}</span>`:''}</div>`;
const sLab=(t)=>`<div class="t-label-m c-var" style="padding:var(--sp-md) var(--sp-lg) var(--sp-sm)">${t}</div>`;
const sFrame=(t,center,mode,body)=>frame(t,`${statusBar()}${appBar({center})}${modeBand(mode)}<div class="screen"><div class="scroll">${body}</div></div>${nav({active:'home'})}`);
const sf1=t=>sFrame(t,fakeSearch('Keress kérésekre...'),'Kérések',sLab('Korábbi kereséseid')+histRow('fúrógép')+histRow('kertész')+histRow('költöztetés')+`<div class="t-label-m c-var" style="padding:var(--sp-xl) var(--sp-lg);text-align:center">Írd be, miről szól a kérés, vagy milyen kulcsszóhoz keresel: pl. <b style="font-family:RedHatText-Bold">kertész</b>, <b style="font-family:RedHatText-Bold">fúrógép</b>.</div>`);
const sf2=t=>sFrame(t,fakeSearch('Keress bizniszekre...'),'Bizniszek',sLab('Korábbi kereséseid')+histRow('kertész')+histRow('süti')+sLab('Gyakori keresések')+histRow('fűnyírás','magnify',false)+histRow('számítógép-szerelés','magnify',false));
const sf3=t=>sFrame(t,`${slimey}<div class="fake-search">${ic('magnify',22,'var(--on-surface)')}<span class="txt val">fúró</span>${ic('close',18,'var(--on-surface-variant)')}</div>`,'Kérések',sLab('Korábbi kereséseid')+histRow('fúrógép'));
const fres=t=>listFrame(t,{sel:'Mind',fabShow:false,searchTxt:'fúró',searchVal:true,head:subHead('Találatok: „fúró” – 1 kérés',''),
  body:listWrap(reqCard(R.furo)+`<div style="padding:var(--sp-lg) var(--sp-md);text-align:center" class="c-var"><span class="t-label-m">Csak a nyitott kéréseket mutatjuk.</span><div style="margin-top:8px">${btn('Megoldottak között is',{mode:'outlined'})}</div></div>`)});

/* ---------- NAV ---------- */
const navCrop=(opts)=>t=>nav(opts);

const rows=[
 row('1. Kérések listája — „Neked” (alapértelmezett)',
  'Útvonal: <code>/kerelmek</code>. Felül a megszokott <code>MyAppbar</code> + <code>FakeSearchInput</code> (mint a /biznisz-en), alatta a szűrő-chipek sávja (a search.tsx típusválasztó chip-stílusa). „Neked” sorrend: a bizniszeid kulcsszavaira illeszkedők előre (kiemelt kulcsszó-chip + „Illik a bizniszedhez” jelvény), utánuk a környékbeliek, a váltásnál ugyanaz az „Egyéb … a környéken” elválasztó, mint a home Bizniszek-listájában. FAB: Paper <code>FAB</code> tertiary, extended, 56 px magas.',
  pair(f1)),
 row('2. „Mind” szűrő + idegen kérés ⋮ menüje',
  '⋮ gomb: 44×44 px érintési felület (a Comments 36 px-es ikonjánál nagyobb). Menü (Paper <code>Menu</code>, mint a Comments-ben): profil, Jelentés (<code>ReportContentModal</code>), Felhasználó letiltása (<code>BlockUserModal</code>).',
  pair(f2)),
 row('3. „Saját” szűrő + saját kérés ⋮ menüje',
  'A saját nyitott kérésen a lábléc jobb oldalán gyors „Megoldva” gomb (megerősítő dialógussal), a megoldott saját kérés a listában marad „Megoldva” jelvénnyel. Saját menü: Megoldva, Törlés (megerősítéssel, mint a BuzinessItem showDelete).',
  pair(f3)),
 row('4. „Megoldott” szűrő',
  'Az archivált kérések csak itt (és a Saját alatt a létrehozónak) látszanak; a feedekből („Neked”, „Mind”, home szekció) kikerülnek. Kártya-tartalom változatlan, a „Megoldva · 3 napja” jelvény kerül a szöveg fölé, a lábléc CTA-ja „Megnézem”.',
  pair(f4)),
 row('5. Betöltő állapot (első betöltés)',
  'Vázlat-kártyák (skeleton) a végleges kártya arányaival, hogy ne ugorjon a tartalom. Lapozásnál (görgetés alján) marad a megszokott <code>ActivityIndicator</code>. Skeleton helyett elfogadható a sima ActivityIndicator is (mint a BuzinessList); ez csak finomítás.',
  pair(f5)),
 row('6. Üres állapotok',
  'A „Neked” üres szövege a briefben szereplő „Nincs kérés a környékeden” + „Kérj te valamit” (a home-on lévő „Hirdesd meg te az elsőt!” testvére). A „Megoldott” üres állapota csak tájékoztat, CTA nélkül.',
  pair(f6b,{capL:'Neked – üres (világos)',capD:'Neked – üres (sötét)'})+gap()+pair(f6,{capL:'Megoldott – üres (világos)',capD:'Megoldott – üres (sötét)'})),
 row('7. Közösség (home.tsx) — új „Kérések neked” szekció a FiFe Radar fölött',
  'Döntés: <b>vízszintesen görgethető kompakt kártyasor</b> (max. 6 kártya + záró „Mind a N kérés” kártya), nem rövid függőleges lista. Indok: a home már most hosszú függőleges feed (Radar + a végtelen görgetésű, sticky fejlécű Bizniszek-lista); egy függőleges lista kitolná a Bizniszeket a képernyő aljára. A kártya 264 px széles, így a másodikból ~100 px kilóg (görgethetőség jele); a sor magassága fix ~200 px. Fejléc: a FiFeRadar sorával azonos felépítés, jobbra „Mind ›” (44 px magas érintési sáv).',
  pair(h1)),
 row('7b. Home szekció — üres / betöltő / hiba állapot (kivágatok)',
  'Üres: <i>Nincs kérés a környékeden</i> + <i>Kérj te valamit</i> (<code>Button mode="contained-tonal"</code> → <code>/kerelmek/new</code>). Betöltő: két vázlat-kártya. Hiba: <code>errorContainer</code> sáv újrapróbálás gombbal.',
  pair(t=>`<div style="padding-bottom:8px">${secEmpty}</div>`,{crop:true,capL:'Üres (világos)',capD:'Üres (sötét)'})+gap(16)+
  pair(t=>`<div style="padding-bottom:8px">${secLoad}</div>`,{crop:true,capL:'Betöltés (világos)',capD:'Betöltés (sötét)'})+gap(16)+
  pair(t=>`<div style="padding-bottom:8px">${secErr}</div>`,{crop:true,capL:'Hiba (világos)',capD:'Hiba (sötét)'})),
 row('8. Keresés — a típusválasztó 3. chipje: „Kérések”',
  'A <code>MODES</code> tömb kap egy harmadik elemet (<code>{ key: "kerelem", label: "Kérések", icon: "hand-heart-outline" }</code>, a <code>SearchMode</code> típus is bővül). A három chip 390 px-en kényelmesen elfér (~330 px); 360 px alatt a sáv vízszintesen görgethető. A Kérések módnak nincs „Gyakori keresések” blokkja (mint a Fifék módnak), saját keresési előzménye van.',
  pair(sf1,{capL:'Kérések mód – előzmények (világos)',capD:'Kérések mód – előzmények (sötét)'})),
 row('8b. Keresés — Bizniszek mód (összehasonlítás) és gépelés közben',
  'A Bizniszek módban minden marad, ahogy volt; csak a chip-sor kapott egy elemet.',
  pair(sf2,{capL:'Bizniszek mód (világos)',capD:'Bizniszek mód (sötét)'})+gap()+pair(sf3,{capL:'Kérések mód – gépelés (világos)',capD:'Kérések mód – gépelés (sötét)'})),
 row('9. Keresés — találatok',
  'Enter után <code>router.replace("/kerelmek")</code> a keresőszóval (mint a Bizniszeknél a /biznisz). A találati lista ugyanaz a komponens, mint a „Mind”; keresésnél a szűrő „Mind”-ra áll, mert a személyre szabott sorrendnek nincs értelme szöveges keresésnél. A megoldottak alapból rejtve, egy gombbal bevonhatók.',
  pair(fres)),
 row('10. Bottom navigáció — függőleges elválasztó a Közösség és az Otthon között',
  'Elválasztó: 24 px (<code>Spacing.xxl</code>) széles hely, benne 1 px × 36 px <code>outlineVariant</code> vonal; a flex:1 gombok közül így a Közösség és az Otthon között ~17 px-szel nagyobb a hézag. Dekoratív: <code>importantForAccessibility="no"</code>. Indok: balra a „társas” (Üzenetek, Közösség), jobbra a „személyes” (Otthon, Profilod) terület. Üzenetek nélkül (messagingEnabled=false) is a Közösség és az Otthon közé kerül.',
  pair(navCrop({active:'home',sep:false}),{crop:true,capL:'Eddig (világos)',capD:'Eddig (sötét)'})+gap(16)+pair(navCrop({active:'home'}),{crop:true,capL:'Új – Közösség aktív (világos)',capD:'Új – Közösség aktív (sötét)'})+gap(16)+pair(navCrop({active:'me'}),{crop:true,capL:'Új – Otthon aktív (világos)',capD:'Új – Otthon aktív (sötét)'})+gap(16)+pair(navCrop({active:'home',messaging:false}),{crop:true,capL:'Új – üzenetek nélkül (világos)',capD:'Új – üzenetek nélkül (sötét)'})),
];
module.exports=()=>shell({title:'FiFe Kérések – lista, home, keresés, nav',h1:'Kérések — lista, home szekció, keresés, bottom nav',
 lead:'Mobil (390×844) tervek világos és sötét témában, a valódi téma-tokenekkel (assets/theme.ts), Spacing/BorderRadius értékekkel és Material Design Icons ikonokkal. Minden keret élő HTML+CSS, külső függőség nélkül.',rows});
