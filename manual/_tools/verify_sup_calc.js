// 상주감리 대가 금액 계산 전 구간 대조 — usage: node verify_sup_calc.js <repoDir>
// 앱의 mmPct·RATES·MM 을 index.html 에서 그대로 읽어, 정확 계산(BigInt)과 비교한다. 옛 식(부동소수)도 같이 세어 차이를 보인다.
const fs=require('fs'),path=require('path');const src=fs.readFileSync(path.join(process.argv[2]||'.','index.html'),'utf8');
const pick=re=>{const m=src.match(re);if(!m)throw new Error('not found '+re);return m[0];};
const ctx={};new Function('ctx',pick(/const RATES=\{[^}]*\};/)+pick(/const MM=\d+;/)+pick(/function toMD\(m\)\{[^}]*\}/)+pick(/function mmPct\(a,p\)\{[^}]*\}/)+'ctx.RATES=RATES;ctx.MM=MM;ctx.toMD=toMD;ctx.mmPct=mmPct;')(ctx);
const {RATES:R,toMD,mmPct}=ctx;const G=Object.keys(R).filter(k=>k!=='none');
const labors=new Set();
for(const a of G)for(const b of G)for(const c of G)for(let m=0.5;m<=36;m+=0.5){const base=(R[a]+R[b]+R[c])*toMD(m);labors.add(base);for(const g of G)for(const nm of [0.5,1,2,3,6,12])labors.add(base+R[g]*toMD(nm));}
let n=0;const bad={over:0,tech:0,vat:0,total:0},old={over:0,tech:0,vat:0,total:0};
for(const labor of labors)for(let oR=110;oR<=120;oR++)for(let tR=20;tR<=40;tR++){
 const over=mmPct(labor,oR),tech=mmPct(labor+over,tR),sub=labor+over+tech,vat=mmPct(sub,10),total=Math.floor((sub+vat)/1000)*1000;
 const L=BigInt(labor),eo=L*BigInt(oR)/100n,et=(L+eo)*BigInt(tR)/100n,es=L+eo+et,ev=es/10n,etot=(es+ev)/1000n*1000n;
 const o1=Math.floor(labor*(oR/100)),t1=Math.floor((labor+o1)*(tR/100)),s1=labor+o1+t1,v1=Math.floor(s1*.1),tt1=Math.floor((s1+v1)/1000)*1000;
 n++;if(BigInt(over)!==eo)bad.over++;if(BigInt(tech)!==et)bad.tech++;if(BigInt(vat)!==ev)bad.vat++;if(BigInt(total)!==etot)bad.total++;
 if(BigInt(o1)!==eo)old.over++;if(BigInt(t1)!==et)old.tech++;if(BigInt(v1)!==ev)old.vat++;if(BigInt(tt1)!==etot)old.total++;}
const ok=Object.values(bad).every(v=>v===0);
console.log(JSON.stringify({rates:R,labors:labors.size,cases:n,new_mismatch:bad,old_mismatch:old,pass:ok}));process.exit(ok?0:1);
