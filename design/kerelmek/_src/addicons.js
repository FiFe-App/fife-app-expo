// node addicons.js <mdi.js útvonal> név1 név2 ... — kiegészíti az icons.json-t az @mdi/js 7.4.47 útvonalaival
const fs=require('fs');const mdi=require(process.argv[2]);const f=__dirname+'/icons.json';const o=JSON.parse(fs.readFileSync(f));
for(const n of process.argv.slice(3)){const k='mdi'+n.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('');if(mdi[k])o[n]=mdi[k];else console.log('HIÁNYZIK',n)}
fs.writeFileSync(f,JSON.stringify(o));console.log(Object.keys(o).length,'ikon');
