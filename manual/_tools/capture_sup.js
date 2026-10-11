// 건축공사 상주감리 대가 산출기 매뉴얼 화면 캡처 — usage: node capture_sup.js <repoDir> <outDir>
// RTS·EPI·열관류율·업무대가 매뉴얼과 같은 규격: 1440×900 · DSF 1.25 · _marks.json(번호 배지 % 좌표) · _example.json(예제 검증값)
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=1440,VH=900,DSF=1.25,PORT=8893;
/* 예제 A = 앱 초기값: 건축·기계·토목 고급 6개월 + 비상주 특급 2개월 · 제경비 110% · 기술료 20% → 공급가액 351,634,741원 · 합계 386,798,000원
   예제 B = 변형: 건축 특급 12개월 · 기계 고급 6개월 · 토목 중급 4.5개월 · 비상주 기술사/건축사 3개월 · 115% · 30% · 직접경비 5,000,000 · 보험료 1,200,000 · NEGO 3,000,000 */
const FREEZE=`(()=>{const T=new Date(2026,9,11,10,0,0).getTime();const D=Date;class F extends D{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}window.Date=F;window.alert=()=>{};window.confirm=()=>true;try{localStorage.clear()}catch(e){}})()`;
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__set=(id,v)=>{const e=document.getElementById(id);e.value=String(v);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
window.__chk=(id,v)=>{const e=document.getElementById(id);if(e.checked!==v)e.click();};
window.__card=(t)=>{const h=[...document.querySelectorAll('.card-title')].find(e=>__vis(e)&&e.textContent.trim()===t);return h?h.closest('.card'):null;};
window.__ref=(i)=>[...document.querySelectorAll('#tab-reference .ref-block')][i]||null;
window.__find=(sel)=>{
 if(sel.startsWith('card:'))return __card(sel.slice(5));
 if(sel.startsWith('ref:'))return __ref(+sel.slice(4));
 if(sel.startsWith('slot:')){return document.querySelector('.worker-slot.'+sel.slice(5));}
 if(sel.startsWith('wrap:')){const e=document.getElementById(sel.slice(5));return e?e.parentElement:null;}
 if(sel.startsWith('a4tbl:')){return document.querySelectorAll('#a4Page table')[+sel.slice(6)]||null;}
 if(sel.startsWith('a4row:')){const [t,r]=sel.slice(6).split('|');const tb=document.querySelectorAll('#a4Page table')[+t];return tb?tb.querySelectorAll('tr')[+r]:null;}
 if(sel.startsWith('lrow:')){return document.querySelectorAll('.labor-summary .labor-row')[+sel.slice(5)]||null;}
 if(sel.startsWith('itab:')){return [...document.querySelectorAll('.fml-itab')][+sel.slice(5)]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__A=()=>{__set('arch_grade','high');__set('arch_months','6');__set('mech_grade','high');__set('mech_months','6');__set('civil_grade','high');__set('civil_months','6');__set('nr_grade','special');__set('nr_months','2');
 __set('overheadRate',110);__set('techFeeRate',20);__set('directExpenses','0');__set('insuranceFee','0');__set('negoAmount','0');__chk('includeVat',true);};
window.__B=()=>{__set('arch_grade','special');__set('arch_months','12');__set('mech_grade','high');__set('mech_months','6');__set('civil_grade','middle');__set('civil_months','4.5');__set('nr_grade','professional');__set('nr_months','3');
 __set('overheadRate',115);__set('techFeeRate',30);__set('directExpenses','5000000');__set('insuranceFee','1200000');__set('negoAmount','3000000');__chk('includeVat',true);};`;
const SHOTS=[
 {id:'s01_overview',tab:'input',clip:'viewport',m:[['.tab-bar-inner','작업 탭'],['.sum-bar-wrap','요약 스트립'],['.law-strip','상주감리 대상 안내'],['.total-banner','총 상주감리비'],['card:공사 정보','공사 정보'],['card:상주감리원 설정','상주감리원 설정'],['#fab-group','계산식 안내']]},
 {id:'s02_tabs',tab:'input',clip:'.app-header',union:'.tab-bar',m:[['.tb:nth-of-type(1)','입력·산출'],['.tb:nth-of-type(2)','산출서 미리보기'],['.tb:nth-of-type(3)','법적 근거·요율'],['.tb-manual','매뉴얼'],['.hdr-right','근거 법령·고시']]},
 {id:'s03_project',tab:'input',clip:'card:공사 정보',m:[['#projectName','공사명'],['#supervisorName','감리자'],['#reportDate','작성일'],['#ownerName','건축주']]},
 {id:'s04_resident',tab:'input',clip:'card:상주감리원 설정',m:[['.period-info','기간 입력 안내'],['#arch_grade','기술등급'],['wrap:arch_months','감리기간(개월)'],['#arch_mandays_display','인일수(자동)'],['#arch_mini','분야별 인건비'],['slot:mech','기계 분야'],['slot:civil','토목 분야']]},
 {id:'s05_nonres',tab:'input',clip:'card:비상주감리원 설정',m:[['#nr_grade','기술등급 · 미투입'],['wrap:nr_months','감리기간(개월)'],['#nr_mandays_display','인일수(자동)'],['#nr_mini','비상주 인건비']]},
 {id:'s06_rate',tab:'input',clip:'card:산출 요율 설정',m:[['#overheadRate','제경비율 슬라이더'],['#overheadCalc','제경비 계산'],['#techFeeRate','기술료율 슬라이더'],['#techFeeCalc','기술료 계산'],['wrap:includeVat','부가가치세 가산']]},
 {id:'s07_direct',tab:'input',clip:'card:직접 입력 항목',m:[['#directExpenses','직접경비'],['#insuranceFee','손해배상보험료'],['.nego-box','NEGO 차감액']]},
 {id:'s08_banner',tab:'input',clip:'.sum-bar-wrap',union:'.total-banner',m:[['.sum-bar-wrap','요약 스트립'],['.law-strip','상주감리 대상 안내'],['#banner-desc','상주기간 · 인원'],['#banner-total','최종 합계'],['#banner-sub','공급가액']]},
 {id:'s09_summary',tab:'input',clip:'card:직접인건비 실시간 요약',m:[['lrow:0','건축 상주감리원'],['lrow:1','기계 상주감리원'],['lrow:2','토목 상주감리원'],['lrow:3','비상주 감리원'],['.labor-total-row','직접인건비 합계']]},
 {id:'s10_a4',tab:'result',clip:'viewport',m:[['.mm-btn-print,.a4-export-bar button','인쇄 / PDF 저장'],['#btn-jpg','JPG 저장'],['#a4Page','A4 산출서']]},
 {id:'s11_a4page',tab:'result',clip:'#a4Page',m:[['a4tbl:0','공사 개요'],['a4row:1|1','① 직접인건비'],['a4row:1|6','② 제경비 · ③ 기술료'],['a4row:1|11','공급가액 소계'],['a4row:1|13','합계 금액'],['a4tbl:2','감리원별 내역'],['.a4-sign-legal','법적 근거'],['.a4-sign-supervisor','공사감리자 서명란']]},
 {id:'s12_reference',tab:'reference',clip:'#tab-reference',m:[['ref:0','2026년 노임단가'],['ref:1','법정 요율 범위'],['ref:2','상주감리 대상 건축물'],['ref:3','행정 절차 체크리스트']]},
 {id:'s13_var_input',tab:'input',pre:"__B()",clip:'viewport',m:[['.sum-bar-wrap','요약 스트립'],['.total-banner','총 상주감리비'],['card:직접 입력 항목','실비 · NEGO'],['card:상주감리원 설정','등급 · 기간 변경']]},
 {id:'s14_var_rate',tab:'input',clip:'card:직접 입력 항목',union:'card:산출 요율 설정',m:[['#directExpenses','직접경비'],['#insuranceFee','손해배상보험료'],['.nego-box','NEGO 차감액'],['#overheadCalc','제경비 115%'],['#techFeeCalc','기술료 30%']]},
 {id:'s15_var_a4page',tab:'result',clip:'#a4Page',m:[]},
 {id:'s16_nr_none',tab:'input',pre:"__A();__set('nr_grade','none')",post:"__A()",clip:'card:비상주감리원 설정',union:'card:직접인건비 실시간 요약',m:[['#nr_grade','미투입 선택'],['#nr_mini','미투입 표시'],['lrow:3','비상주 — 미투입']]},
 {id:'s17_help_howto',tab:'input',pre:"openFormula()",wait:1500,fixed:true,clip:'.fml-box',m:[['itab:0','이용방법'],['itab:1','① 직접인건비'],['itab:2','② 제경비·기술료'],['itab:3','③ 합계·VAT·총액'],['itab:4','노임단가 참고']]},
 {id:'s18_help_labor',tab:null,pre:"document.querySelectorAll('.fml-itab')[1].click();document.querySelector('.fml-bd').scrollTop=0",wait:1500,fixed:true,clip:'.fml-box',m:[]},
 {id:'s19_help_rate',tab:null,pre:"document.querySelectorAll('.fml-itab')[2].click();document.querySelector('.fml-bd').scrollTop=0",wait:1500,fixed:true,clip:'.fml-box',m:[]},
 {id:'s20_help_total',tab:null,pre:"document.querySelectorAll('.fml-itab')[3].click();document.querySelector('.fml-bd').scrollTop=0",wait:1500,fixed:true,clip:'.fml-box',m:[]},
 {id:'s21_help_wage',tab:null,pre:"document.querySelectorAll('.fml-itab')[4].click();document.querySelector('.fml-bd').scrollTop=0",wait:1500,fixed:true,post:"closeFormula()",clip:'.fml-box',m:[]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(FREEZE);
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(3000);
 await pg.evaluate(HELP);
 const readEx=()=>pg.evaluate(()=>{const q=id=>((document.getElementById(id)||{}).innerText||'').replace(/\s+/g,' ').trim();const s=window._s||{};
  return {banner:q('banner-total'),desc:q('banner-desc'),sub:q('banner-sub'),strip:['sup','months','labor','sub','vat','total'].map(k=>q('sb-'+k)),mini:['arch','mech','civil','nr'].map(k=>q(k+'_mini')),over:q('overheadCalc'),tech:q('techFeeCalc'),
   s:{labor:s.labor,over:s.over,tech:s.tech,de:s.de,ins:s.ins,neg:s.neg,sub:s.sub,vat:s.vatAmt,total:s.total,md:[s.amd,s.mmd,s.cmd,s.nrmd],oR:s.oR,tR:s.tR}};});
 const ex={A:await readEx()};const meta={};
 for(const S of SHOTS){
  if(S.tab){await pg.evaluate(t=>{switchTab(t);window.scrollTo(0,0);},S.tab);await pg.waitForTimeout(600);}
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||700);
  if(S.id==='s13_var_input')ex.B=await readEx(); if(S.id==='s16_nr_none')ex.none=await readEx();
  if(S.id==='s15_var_a4page')ex.B_a4=await pg.evaluate(()=>[...document.querySelectorAll('#a4Page table tr')].map(r=>r.innerText.replace(/\s+/g,' ').trim()));
  if(S.id==='s11_a4page')ex.A_a4=await pg.evaluate(()=>[...document.querySelectorAll('#a4Page table tr')].map(r=>r.innerText.replace(/\s+/g,' ').trim()));
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);clip={x:a.x,y:a.y,width:a.w,height:a.h};
     if(S.union){const e2=__find(S.union);if(e2){const a2=abs(e2);const x0=Math.min(clip.x,a2.x),y0=Math.min(clip.y,a2.y),x1=Math.max(clip.x+clip.width,a2.x+a2.w),y1=Math.max(clip.y+clip.height,a2.y+a2.h);clip={x:x0,y:y0,width:x1-x0,height:y1-y0};}}}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(a.w/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:c.x-(await pg.evaluate(()=>scrollX)),y:c.y-(await pg.evaluate(()=>scrollY)),width:c.width,height:c.height}});}
  else{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(cl.height),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(500);}
 }
 await pg.evaluate(()=>{switchTab('input');window.scrollTo(0,0)});await pg.waitForTimeout(500);ex.after=await readEx();
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true});await setup(mctx);
 const mp=await mctx.newPage();await mp.addInitScript(FREEZE);
 await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(3000);
 await mp.screenshot({path:path.join(out,'s22_mobile_main.png')});meta['s22_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{const h=[...document.querySelectorAll('.card-title')].find(e=>e.textContent.trim()==='상주감리원 설정').closest('.card');window.scrollTo(0,h.getBoundingClientRect().top+scrollY-120);});await mp.waitForTimeout(600);
 await mp.screenshot({path:path.join(out,'s23_mobile_input.png')});meta['s23_mobile_input']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{switchTab('result');window.scrollTo(0,0);});await mp.waitForTimeout(900);
 await mp.screenshot({path:path.join(out,'s24_mobile_a4.png')});meta['s24_mobile_a4']={w:390,h:844,marks:[]};
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(ex,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 console.log(JSON.stringify({A:ex.A,B:ex.B,none:ex.none&&ex.none.banner,same:JSON.stringify(ex.A)===JSON.stringify(ex.after),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
