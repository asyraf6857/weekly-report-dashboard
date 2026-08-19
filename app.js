const SHEET_ID='1t9wtgfKNouncZ0QN5A2JhfAq0EPVMMofGQTDriVF8nY';
const RAW_SHEET='RECONCILIATION WEEKLY 2026';
const DISPUTE_SHEET='DISPUTE';
const RAW_URL=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(RAW_SHEET)}`;
const DISPUTE_URL=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(DISPUTE_SHEET)}`;

let DATA=[]; let DISPUTES=[]; let charts={};
const selections={
  'Visit Status':new Set(),
  'Sign Off By':new Set(),
  'IMO WEEK':new Set(),
  'DURATION CATEGORY':new Set(),
  'Visit Reason':new Set()
};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function parseCSV(t){let R=[],r=[],c='',q=false;for(let i=0;i<t.length;i++){let x=t[i],n=t[i+1];if(x==='"'){if(q&&n==='"'){c+='"';i++}else q=!q}else if(x===','&&!q){r.push(c);c=''}else if((x==='\n'||x==='\r')&&!q){if(x==='\r'&&n==='\n')i++;r.push(c);c='';if(r.some(v=>v!==''))R.push(r);r=[]}else c+=x}r.push(c);if(r.some(v=>v!==''))R.push(r);return R}
function rowsFromCSV(t){const m=parseCSV(t),h=m[0]||[];return m.slice(1).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]||''])))}
function unique(key){return [...new Set(DATA.map(r=>(r[key]||'').trim()).filter(Boolean))]}
function sorter(key){return (a,b)=> key==='IMO WEEK' ? Number(a)-Number(b) : String(a).localeCompare(String(b),undefined,{numeric:true});}
function countBy(rows,key){return rows.reduce((o,r)=>{let v=(r[key]||'(blank)').trim()||'(blank)';o[v]=(o[v]||0)+1;return o},{})}
function top(obj,n=20){return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function validDurationMinutes(v){if(!v||String(v).includes('-'))return null;const s=String(v).trim();const m=s.match(/^(\d+):(\d{1,2})$/);if(!m)return null;const mins=Number(m[1])*60+Number(m[2]);return Number.isFinite(mins)?mins:null}
function fmtMinutes(mins){if(!Number.isFinite(mins))return '—';const h=Math.floor(mins/60),m=Math.round(mins%60);return `${h}:${String(m).padStart(2,'0')}`}
function activeFilterLabel(key){const n=selections[key].size;return n?`${n} selected`:'All';}

function buildSlicer(key,id){const box=$(id);const values=unique(key).sort(sorter(key));box.innerHTML=values.map(v=>`<button class="slicer-btn" data-key="${esc(key)}" data-value="${esc(v)}">${esc(v)}</button>`).join('');box.querySelectorAll('.slicer-btn').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.key,v=btn.dataset.value;if(selections[k].has(v))selections[k].delete(v);else selections[k].add(v);updateSlicerStyles();render();}));}
function updateSlicerStyles(){document.querySelectorAll('.slicer-btn').forEach(btn=>btn.classList.toggle('active',selections[btn.dataset.key]?.has(btn.dataset.value)));}
function clearFilters(){Object.values(selections).forEach(s=>s.clear());updateSlicerStyles();render();}
function filteredRows(){return DATA.filter(r=>Object.entries(selections).every(([k,set])=>!set.size||set.has((r[k]||'').trim())))}

function chart(id,type,labels,datasets,options={}){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#e9f1f8',boxWidth:12,font:{size:10}},position:'right'},tooltip:{mode:'index',intersect:false}},scales:type==='doughnut'?{}:{x:{stacked:!!options.stacked,ticks:{color:'#dfe8f0',font:{size:10}},grid:{color:'rgba(255,255,255,.08)'}},y:{stacked:!!options.stacked,beginAtZero:true,ticks:{color:'#dfe8f0',font:{size:10}},grid:{color:'rgba(255,255,255,.10)'}}},...options}})}

function render(){
  const rows=filteredRows();
  const total=rows.length;
  const billed=rows.filter(r=>r['Visit Status']==='BILLED').length;
  const signoffOnly=rows.filter(r=>r['Visit Status']==='SIGNOFF').length;
  const totalSignoff=billed+signoffOnly;
  const pending=rows.filter(r=>r['Visit Status']==='PENDING').length;
  const signedDurations=rows.map(r=>validDurationMinutes(r['Duration'])).filter(v=>v!==null);
  const avg=signedDurations.length?signedDurations.reduce((a,b)=>a+b,0)/signedDurations.length:null;
  $('totalVisit').textContent=total.toLocaleString();
  $('totalSignoff').textContent=totalSignoff.toLocaleString();
  $('totalPending').textContent=pending.toLocaleString();
  $('avgSignoff').textContent=fmtMinutes(avg);
  const open=DISPUTES.filter(r=>(r['RESOLUTION']||'').trim().toLowerCase()==='open').length;
  const closed=DISPUTES.length-open;
  $('openDisputes').textContent=open.toLocaleString(); $('closedDisputes').textContent=closed.toLocaleString();

  const weeks=[...new Set(rows.map(r=>r['IMO WEEK']).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const cats=['<1H','<4H','<6H','<12H','<24H','>24H'];
  chart('durationWeekChart','line',weeks,cats.map(c=>({label:c,data:weeks.map(w=>rows.filter(r=>r['IMO WEEK']===w&&r['DURATION CATEGORY']===c).length),tension:.15,pointRadius:3,borderWidth:2,fill:false})),{plugins:{legend:{labels:{color:'#e9f1f8',boxWidth:12,font:{size:10}},position:'right'}},scales:{x:{ticks:{color:'#dfe8f0'},grid:{color:'rgba(255,255,255,.08)'}},y:{beginAtZero:true,ticks:{color:'#dfe8f0',precision:0},grid:{color:'rgba(255,255,255,.10)'}}}});

  const reasons=top(countBy(rows,'Visit Reason'),12);
  chart('reasonChart','bar',reasons.map(x=>x[0]),[{label:'Visits',data:reasons.map(x=>x[1])}],{plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#dfe8f0',maxRotation:45,minRotation:45},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#dfe8f0',precision:0},grid:{color:'rgba(255,255,255,.10)'}}}});

  const execs=top(countBy(rows.filter(r=>(r['Sign Off By']||'').trim()),'Sign Off By'),8).map(x=>x[0]);
  chart('execWeekChart','bar',weeks,execs.map(e=>({label:e,data:weeks.map(w=>rows.filter(r=>r['IMO WEEK']===w&&r['Sign Off By']===e).length)})),{stacked:true,plugins:{legend:{labels:{color:'#e9f1f8',boxWidth:12,font:{size:10}},position:'right'}},scales:{x:{stacked:true,ticks:{color:'#dfe8f0'},grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{color:'#dfe8f0',precision:0},grid:{color:'rgba(255,255,255,.10)'}}}});

  const avgExecData=execs.map(e=>{const vals=rows.filter(r=>r['Sign Off By']===e).map(r=>validDurationMinutes(r['Duration'])).filter(v=>v!==null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length/60:0});
  chart('execAvgChart','bar',execs,[{label:'Average hours',data:avgExecData}],{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{color:'#dfe8f0',callback:v=>`${v.toFixed? v.toFixed(1):v}h`},grid:{color:'rgba(255,255,255,.10)'}},y:{ticks:{color:'#dfe8f0'},grid:{display:false}}}});

  const execCounts=execs.map(e=>rows.filter(r=>r['Sign Off By']===e).length);
  chart('execDonutChart','doughnut',execs,[{label:'Sign Off',data:execCounts}],{cutout:'58%',plugins:{legend:{labels:{color:'#e9f1f8',boxWidth:12,font:{size:10}},position:'right'}}});

  $('rowCount').textContent=`${rows.length.toLocaleString()} rows`;
  $('detailBody').innerHTML=rows.slice(-1000).reverse().map(r=>`<tr><td>${esc(r['IMO WEEK'])}</td><td>${esc(r['Visit No'])}</td><td>${esc(r['Visit Status'])}</td><td>${esc(r['Vessel Name'])}</td><td>${esc(r['Agent Company (Customer Name)'])}</td><td>${esc(r['Visit Reason'])}</td><td>${esc(r['VOR Category'])}</td><td>${esc(r['Estimated Time Departure'])}</td><td>${esc(r['Invoice No'])}</td><td>${esc(r['Sign Off Time'])}</td><td>${esc(r['Sign Off By'])}</td><td>${esc(r['Duration'])}</td><td>${esc(r['DURATION CATEGORY'])}</td></tr>`).join('');
}

async function fetchCSV(url){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(`Google Sheet HTTP ${res.status}`);const text=await res.text();if(text.includes('accounts.google.com')||text.trim().startsWith('<!DOCTYPE'))throw new Error('Google Sheet must be shared as Anyone with the link – Viewer.');return text;}
async function load(){
  try{
    $('sourceStatus').textContent='Loading live data…'; $('dot').className='dot'; $('errorBox').classList.add('hidden');
    const [rawText,disputeText]=await Promise.all([fetchCSV(RAW_URL),fetchCSV(DISPUTE_URL)]);
    DATA=rowsFromCSV(rawText); DISPUTES=rowsFromCSV(disputeText);
    buildSlicer('Visit Status','sl-status'); buildSlicer('Sign Off By','sl-signoff'); buildSlicer('IMO WEEK','sl-week'); buildSlicer('DURATION CATEGORY','sl-duration'); buildSlicer('Visit Reason','sl-reason');
    updateSlicerStyles();
    $('sourceStatus').textContent=`Live • ${DATA.length.toLocaleString()} raw rows`; $('dot').className='dot ok';
    $('updated').textContent=`Updated ${new Date().toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})}`;
    render();
  }catch(e){$('dot').className='dot bad';$('sourceStatus').textContent='Connection needs attention';$('errorBox').classList.remove('hidden');$('errorBox').innerHTML=`<b>Unable to load dashboard.</b><br>${esc(e.message)}`;}
}

$('reset').addEventListener('click',clearFilters); $('clearAll').addEventListener('click',clearFilters); $('refresh').addEventListener('click',load);
load();