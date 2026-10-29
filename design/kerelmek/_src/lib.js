const fs=require('fs'),path=require('path');
const ICONS=require('./icons.json');
const CSS=require('./css');
const OUT=path.resolve(__dirname,'..');

/* ---------- ikonok: valódi Material Design Icons útvonalak (@mdi/js 7.4.47); a név = a RN Paper `source` ---------- */
const used=new Set();
function ic(name,size=24,color,style=''){
  const d=ICONS[name]; if(!d) throw new Error('Nincs MDI ikon az icons.json-ban: '+name);
  used.add(name);
  return `<svg class="mdi" data-mdi="${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color||'currentColor'}" style="${style}" aria-hidden="true"><path d="${d}"/></svg>`;
}
const iconsUsed=()=>[...used].sort();

function fontCss(){
  const f=(fam,file,w)=>`@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname,'fonts',file+'.woff2')).toString('base64')}) format("woff2");font-weight:${w};font-display:block}`;
  return [f('RedHatText','RedHatText-Regular',400),f('RedHatText-Light','RedHatText-Light',300),f('RedHatText-Medium','RedHatText-Medium',500),
    f('RedHatText-Bold','RedHatText-Bold',700),f('Piazzolla-ExtraBold','Piazzolla-ExtraBold',800),f('Piazzolla-Regular','Piazzolla-Regular',400)].join('\n');
}
const SLIMEY='data:image/png;base64,'+fs.readFileSync(path.resolve(__dirname,'../../../assets/images/Slimey.png')).toString('base64');

/* ---------- illusztrált "fotók" ---------- */
const PHOTOS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="ph-garden" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#bfe3f2"/><circle cx="158" cy="30" r="15" fill="#ffe08a"/><path d="M0 92Q50 62 100 86T200 76V150H0Z" fill="#9bcf7f"/><path d="M0 112Q60 92 120 110T200 100V150H0Z" fill="#6aae56"/><rect y="124" width="200" height="26" fill="#4c8f3f"/><rect x="20" y="62" width="46" height="34" fill="#f3e3c6"/><path d="M14 64L43 42L72 64Z" fill="#c4553c"/><rect x="36" y="76" width="12" height="20" fill="#7a5a3a"/><rect x="132" y="84" width="6" height="30" fill="#6b4a2c"/><circle cx="135" cy="76" r="20" fill="#3f8a3a"/><circle cx="122" cy="88" r="13" fill="#4d9a45"/><circle cx="150" cy="90" r="12" fill="#357a33"/><g fill="#2f6f2d"><circle cx="20" cy="126" r="9"/><circle cx="36" cy="130" r="11"/><circle cx="56" cy="127" r="9"/><circle cx="78" cy="131" r="12"/></g><g fill="#f2a6b8"><circle cx="100" cy="136" r="3"/><circle cx="112" cy="140" r="3"/><circle cx="94" cy="144" r="3"/></g></symbol>
<symbol id="ph-hedge" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#d7ecf5"/><rect y="96" width="200" height="54" fill="#7fb865"/><g fill="#2f6f2d"><circle cx="18" cy="82" r="26"/><circle cx="52" cy="76" r="30"/><circle cx="92" cy="80" r="28"/><circle cx="130" cy="74" r="30"/><circle cx="168" cy="82" r="28"/></g><g fill="#3f8a3a"><circle cx="30" cy="72" r="16"/><circle cx="76" cy="66" r="16"/><circle cx="116" cy="68" r="16"/><circle cx="154" cy="68" r="16"/></g><rect x="70" y="112" width="60" height="6" rx="3" fill="#d94b2f"/><rect x="128" y="104" width="30" height="16" rx="3" fill="#e8c24a"/></symbol>
<symbol id="ph-drill" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#c99a63"/><g stroke="#b8864f" stroke-width="2"><path d="M0 30H200M0 70H200M0 110H200"/></g><rect x="38" y="52" width="94" height="34" rx="12" fill="#e0a21b"/><rect x="118" y="58" width="36" height="22" rx="6" fill="#3a3a3a"/><rect x="152" y="64" width="34" height="10" rx="3" fill="#9a9a9a"/><path d="M60 84h30l-8 44a8 8 0 0 1-8 7H66a8 8 0 0 1-8-8z" fill="#2f2f2f"/><rect x="48" y="60" width="14" height="10" rx="3" fill="#fff4cf"/></symbol>
<symbol id="ph-boxes" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#e9dfd0"/><rect y="118" width="200" height="32" fill="#c8b79d"/><rect x="18" y="74" width="70" height="52" fill="#c98f52"/><rect x="18" y="74" width="70" height="10" fill="#b57a3e"/><rect x="48" y="74" width="10" height="52" fill="#e0c9a2"/><rect x="96" y="90" width="54" height="40" fill="#d19a5c"/><rect x="96" y="90" width="54" height="8" fill="#b57a3e"/><rect x="118" y="90" width="9" height="40" fill="#e0c9a2"/><rect x="62" y="40" width="52" height="38" fill="#d9a56a"/><rect x="62" y="40" width="52" height="8" fill="#b57a3e"/><rect x="82" y="40" width="9" height="38" fill="#e0c9a2"/><rect x="150" y="60" width="30" height="70" fill="#8b6f9b"/></symbol>
<symbol id="ph-bike" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#dfe8ea"/><rect y="112" width="200" height="38" fill="#a9b3b5"/><g fill="none" stroke="#2f3b3f" stroke-width="5"><circle cx="54" cy="100" r="30"/><circle cx="148" cy="100" r="30"/><path d="M54 100L88 60L124 60L148 100M88 60L102 100H54M102 100L124 60" stroke="#d94b2f"/></g><path d="M80 52h16M118 52h20" stroke="#2f3b3f" stroke-width="6" stroke-linecap="round"/></symbol>
<symbol id="ph-sofa" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#efe6d8"/><rect y="118" width="200" height="32" fill="#cdbfa6"/><rect x="26" y="60" width="148" height="52" rx="14" fill="#6e8f86"/><rect x="40" y="46" width="120" height="40" rx="14" fill="#7da196"/><rect x="18" y="72" width="26" height="48" rx="12" fill="#5d7d74"/><rect x="156" y="72" width="26" height="48" rx="12" fill="#5d7d74"/><rect x="34" y="118" width="8" height="10" fill="#6b4a2c"/><rect x="158" y="118" width="8" height="10" fill="#6b4a2c"/></symbol>
</defs></svg>`;
const photo=(id)=>`<svg class="ph-img" aria-hidden="true"><use href="#${id}" width="100%" height="100%"/></svg>`;

/* ---------- térkép (a MapSelector/mapStyles.ts palettájával) ---------- */
function mapSvg(theme,{w=366,h=240,r=0,marker=true,place='Újpest',user=null,cx,cy}={}){
  const L=theme==='light';
  const c=L?{bg:'#FFF5E0',block:'#F3E6C8',road:'#FFFCF5',art:'#ffdab5',hw:'#DF442E',park:'#c8e6c9',water:'#90caf9',lbl:'#4d4639',stk:'#FFFCF5'}
           :{bg:'#1e1b16',block:'#262219',road:'#3d3a33',art:'#56442A',hw:'#FF5C42',park:'#1a2e1a',water:'#15283a',lbl:'#cdc5b4',stk:'#1e1b16'};
  let blocks='';let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
  for(let x=-10;x<w+20;x+=42)for(let y=-10;y<h+20;y+=34){blocks+=`<rect x="${x+4}" y="${y+4}" width="${34+rnd()*4}" height="${26+rnd()*3}" rx="3" fill="${c.block}"/>`}
  let roads='';for(let x=-10;x<w+20;x+=42)roads+=`<path d="M${x} -10V${h+10}" stroke="${c.road}" stroke-width="4"/>`;
  for(let y=-10;y<h+20;y+=34)roads+=`<path d="M-10 ${y}H${w+10}" stroke="${c.road}" stroke-width="4"/>`;
  cx=cx??w/2;cy=cy??h/2;
  const lbl=(x,y,t)=>`<text x="${x}" y="${y}" font-family="RedHatText" font-size="11" fill="${c.lbl}" stroke="${c.stk}" stroke-width="3" paint-order="stroke">${t}</text>`;
  return `<svg class="map" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Térkép: ${place}"><rect width="${w}" height="${h}" fill="${c.bg}"/>${blocks}${roads}
  <path d="M-10 ${h*0.86}C60 ${h*0.74} 120 ${h*0.98} ${w*0.55} ${h*0.9}S${w} ${h*0.8} ${w+10} ${h*0.9}V${h+10}H-10Z" fill="${c.water}"/>
  <path d="M${w*0.62} -10L${w*0.66} ${h*0.4}L${w*0.9} ${h*0.55}L${w+10} ${h*0.5}V-10Z" fill="${c.park}"/>
  <path d="M-10 ${h*0.36}L${w+10} ${h*0.22}" stroke="${c.art}" stroke-width="9"/><path d="M${w*0.28} -10L${w*0.4} ${h+10}" stroke="${c.art}" stroke-width="9"/>
  <path d="M-10 ${h*0.62}Q${w*0.4} ${h*0.5} ${w+10} ${h*0.7}" stroke="${c.hw}" stroke-width="5" fill="none"/>
  ${lbl(w*0.04,h*0.3,'Árpád út')}${lbl(w*0.72,h*0.34,'Megyeri híd')}${lbl(w*0.04,h*0.96,'Duna')}
  ${r?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${L?'#00000028':'#ffffff44'}" stroke="${L?'#00000044':'#ffffffaa'}" stroke-width="2"/>`:''}
  ${marker?`<g transform="translate(${cx-12} ${cy-12})"><circle cx="12" cy="12" r="12" fill="${L?'#FADEBC':'#56442A'}" stroke="${L?'#56442A':'#FADEBC'}" stroke-width="1"/><circle cx="12" cy="12" r="3.6" fill="${L?'#56442A':'#FADEBC'}"/></g>`:''}
  ${user?`<g transform="translate(${user.x-10} ${user.y-10})"><circle cx="10" cy="10" r="10" fill="#4285F4" opacity=".25"/><circle cx="10" cy="10" r="5" fill="#4285F4" stroke="#fff" stroke-width="2"/></g>`:''}
  </svg>`;
}

/* ---------- alap építőelemek ---------- */
const AV=['#F2C6A0','#BFD8C8','#C9C0E8','#F0D98A','#E7B7B0','#B9D3E8'];
const avatar=(ini,size=40,i=0)=>`<div class="avatar" style="width:${size}px;height:${size}px;background:${AV[i%AV.length]};color:#2b2118;font-size:${Math.round(size*.38)}px" aria-hidden="true">${ini}</div>`;
const stat=(icon,txt)=>`<div class="stat">${ic(icon,16,'var(--primary)')}<span>${txt}</span></div>`;
const cat=(t,cls='')=>`<span class="cat ${cls}">${t}</span>`;
const btn=(label,{mode='contained',icon,cls=''}={})=>`<span class="btn ${mode} ${icon?'icon':''} ${cls}" role="button">${icon?ic(icon,18):''}${label}</span>`;
const chip=(label,{sel=false,icon,cls=''}={})=>`<span class="chip ${sel?'sel':''} ${icon?'icon':''} ${cls}" role="button" ${sel?'aria-pressed="true"':''}>${icon?ic(icon,18):''}${label}</span>`;
const secLabel=(t,{req,opt,cnt}={})=>`<div class="seclabel"><span class="t">${t}${req?' <em>*</em>':''}</span>${opt?'<span class="o">(nem kötelező)</span>':''}${cnt?`<span class="cnt">${cnt}</span>`:''}</div>`;

const statusBar=()=>`<div class="sbar"><span>9:41</span><span class="ico"><i></i><i style="width:16px"></i></span></div>`;
function appBar({title,back=true,center,actions=''}={}){
  return `<div class="appbar"><div class="slot">${back?ic('arrow-left',24):''}</div>${center?`<div class="center">${center}</div>`:`<div class="ttl">${title}</div>`}${actions||'<div class="slot"></div>'}</div>`;
}
const slimey=`<span class="smiley slimey" role="img" aria-label="FiFe"></span>`;
const fakeSearch=(txt,val=false)=>`${slimey}<div class="fake-search">${ic('magnify',22,'var(--on-surface)')}<span class="txt ${val?'val':''}">${txt}</span></div>`;

function nav({active='home',messaging=true,sep=true}={}){
  const b=(key,label,off,on,colorOn,colorAlways)=>{
    const a=active===key;
    return `<div class="b ${a?'on':''}"><div class="ic" style="position:relative">${ic(a?on:off,key==='chats'?24:28,a?colorOn:colorAlways)}${key==='chats'?'<span class="badge-n">3</span>':''}</div><span class="lbl">${label}</span></div>`;
  };
  return `<nav class="bnav" aria-label="Fő navigáció">${messaging?b('chats','Üzenetek','message-outline','message','var(--primary)'):''}
  ${b('home','Közösség','account-group-outline','account-group','var(--tertiary)','var(--tertiary)')}
  ${sep?'<div class="sep" aria-hidden="true"><i></i></div>':''}
  ${b('me','Otthon','home-variant-outline','home-variant','var(--secondary)')}
  <div class="b ${active==='profile'?'on':''}"><div class="ic" style="height:32px"><div class="ring ${active==='profile'?'on':''}"><span class="slimey" style="display:block;width:24px;height:24px;border-radius:2px"></span></div></div><span class="lbl">Profilod</span></div></nav>`;
}

const fab=(label='Új kérés',icon='plus')=>`<div class="fab" role="button">${ic(icon,24)}<span>${label}</span></div>`;
const menu=(items,pos)=>`<div class="menu" role="menu" style="${pos}">${items.map(i=>`<div class="it ${i.err?'err':''}" role="menuitem">${ic(i.icon,24)}<span>${i.t}</span></div>`).join('')}</div>`;
const imgGrid=(imgs)=>!imgs||!imgs.length?'':`<div class="grid g${imgs.length}">${imgs.map(i=>`<div>${photo(i)}</div>`).join('')}</div>`;

/* ---------- Kérés kártya ---------- */
function reqCard(r,{compact=false,menuIcon=true,showFooter=true}={}){
  const place = r.anywhere ? `${ic('wifi',14)}Bárhol` : `${ic('map-marker-radius',14)}${r.place}, ${r.radius} km`;
  const solved = r.solved ? `<div class="badge-solved">${ic('check-circle',16,'var(--nature)')}Megoldva · ${r.solved}</div>` : '';
  const match = r.match && !r.solved ? `<div class="badge-match">${ic('briefcase-check-outline',16)}Illik a bizniszedhez: ${r.match}</div>` : '';
  const tagsHtml = (n)=>`<div class="tags">${r.tags.slice(0,n).map(t=>cat(t.t||t,t.m?'match':'')).join('')}${r.tags.length>n?cat('+'+(r.tags.length-n)):''}</div>`;
  if(compact){
    return `<article class="card compact"><div class="ph">${avatar(r.ini,28,r.av)}<div class="who"><div class="name t-title-s">${r.name}</div></div><span class="t-label-m c-var" style="white-space:nowrap">${r.time}</span></div>
      <p class="ptext clamp3">${r.text}</p>${tagsHtml(2)}
      <div class="stats" style="margin-top:auto">${r.anywhere?stat('wifi','Bárhol'):stat('map-marker',r.place+' · '+r.dist)}${stat('comment-outline',r.comments)}</div></article>`;
  }
  const foot = showFooter ? `<footer class="cfoot"><div class="stat">${ic('comment-outline',16,'var(--primary)')}<span>${r.comments} hozzászólás</span></div>${
      r.own && !r.solved ? `<span class="btn text sm">${ic('check-circle-outline',18)}Megoldva</span>`
      : r.solved ? `<span class="btn text sm">${ic('comment-search-outline',18)}Megnézem</span>`
      : `<span class="btn text sm">${ic('comment-plus-outline',18)}Hozzászólok</span>`}</footer>` : '';
  return `<article class="card"><header class="ph">${avatar(r.ini,40,r.av)}<div class="who"><div class="name t-title-s">${r.name}${r.own?' <span class="t-label-m c-var" style="font-family:RedHatText-Medium">(te)</span>':''}</div><div class="sub"><span>${r.time}</span><span>·</span>${place}</div></div>${menuIcon?`<div class="iconbtn" role="button" aria-label="További műveletek">${ic('dots-vertical',22)}</div>`:''}</header>
    ${solved}${match}<p class="t-body clamp5">${r.text}</p>${imgGrid(r.imgs)}${tagsHtml(9)}
    ${r.dist&&!r.anywhere?`<div class="stats">${stat('map-marker',r.dist+' távolságra')}</div>`:''}${foot}</article>`;
}

/* ---------- oldal-váz ---------- */
const frame=(theme,inner,{cls=''}={})=>`<div class="frame theme-${theme} ${cls}">${inner}</div>`;
function pair(fn,{capL='Világos téma',capD='Sötét téma',crop=false}={}){
  const mk=(t,cap)=>`<figure>${crop?`<div class="crop theme-${t}">${fn(t)}</div>`:fn(t)}<figcaption>${cap}</figcaption></figure>`;
  return `<div class="pair">${mk('light',capL)}${mk('dark',capD)}</div>`;
}
const gap=(n=24)=>`<div style="height:${n}px"></div>`;
const row=(h,note,body)=>`<section class="row"><h2>${h}</h2><p class="note">${note}</p>${body}</section>`;
function shell({title,h1,lead,rows}){
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${CSS}\n.slimey{background:url(${SLIMEY}) center/cover no-repeat}</style></head><body>${PHOTOS}<main class="page"><header><h1>${h1}</h1><p class="lead">${lead}</p></header>${rows.join('\n')}</main>
<style>/* beágyazott betűtípusok (részhalmaz: latin + latin-ext, a repo assets/fonts fájljaiból) */\n${fontCss()}</style></body></html>`;
}
module.exports={ic,iconsUsed,photo,mapSvg,avatar,stat,cat,btn,chip,secLabel,statusBar,appBar,slimey,fakeSearch,nav,fab,menu,imgGrid,reqCard,frame,pair,gap,row,shell,OUT,SLIMEY};
