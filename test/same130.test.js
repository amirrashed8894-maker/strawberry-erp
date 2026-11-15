// v1.3.0: الحسابات الموجودة (compute) زي 1.2.9 بالظبط على كل السيناريوهات — التقرير الجديد قراية بس
const fs=require('fs'),cp=require('child_process'),path=require('path');
const old=path.join(require('os').tmpdir(),'core129.js');fs.writeFileSync(old,cp.execSync('git show e916a88:core.js',{cwd:__dirname+'/..'}));
const A=require(old),B=require('../core.js');let k=0;
for(const f of fs.readdirSync(__dirname).filter(f=>/^scenario.*\.json$/.test(f))){const j=fs.readFileSync(__dirname+'/'+f,'utf8');
  const a=JSON.stringify(A.compute(JSON.parse(j).data)),b=JSON.stringify(B.compute(JSON.parse(j).data));if(a!==b){console.log('FAIL',f);process.exit(1)}k++}
console.log('compute identical to 1.2.9 on',k,'scenarios');
