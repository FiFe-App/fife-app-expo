// node design/kerelmek/_src/build.js  -> lista.html, uj-kereses.html, kerelem.html
const fs=require('fs'),L=require('./lib');
for(const [f,m] of [['lista.html','./lista'],['uj-kereses.html','./uj'],['kerelem.html','./detail']]){
  let fn;try{fn=require(m)}catch(e){if(e.code==='MODULE_NOT_FOUND'&&String(e.message).includes(m.slice(2))){continue}throw e}
  fs.writeFileSync(L.OUT+'/'+f,fn());console.log('wrote',f,(fs.statSync(L.OUT+'/'+f).size/1024|0)+'KB');
}
console.log('icons:',L.iconsUsed().join(', '));
