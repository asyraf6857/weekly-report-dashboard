var DATA = [];
var DISPUTES = [];
var charts = {};
var selections = {
  'Visit Status': new Set(),
  'Sign Off By': new Set(),
  'IMO WEEK': new Set(),
  'DURATION CATEGORY': new Set(),
  'Visit Reason': new Set()
};

function el(id) { return document.getElementById(id); }
function safe(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
  });
}
function text(v) { return String(v == null ? '' : v).trim(); }
function unique(key) {
  var s = new Set();
  DATA.forEach(function (r) { var v = text(r[key]); if (v) s.add(v); });
  return Array.from(s);
}
function sorter(key) {
  return function (a, b) {
    if (key === 'IMO WEEK') return Number(a) - Number(b);
    return String(a).localeCompare(String(b), undefined, {numeric:true});
  };
}
function countBy(rows, key) {
  var out = {};
  rows.forEach(function (r) {
    var v = text(r[key]) || '(blank)';
    out[v] = (out[v] || 0) + 1;
  });
  return out;
}
function top(obj, n) {
  return Object.keys(obj).map(function (k) { return [k, obj[k]]; })
    .sort(function (a,b) { return b[1] - a[1]; }).slice(0, n || 20);
}
function validDurationMinutes(v) {
  if (v == null || v === '') return null;
  var s = String(v).trim();
  if (s.indexOf('-') !== -1) return null;
  var m = s.match(/^(\d+):(\d{1,2})(?::\d{1,2})?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  var n = Number(s);
  if (isFinite(n) && n >= 0 && n < 100) return n * 1440;
  return null;
}
function fmtMinutes(mins) {
  if (!isFinite(mins)) return '—';
  var h = Math.floor(mins / 60);
  var m = Math.round(mins % 60);
  return h + ':' + String(m).padStart(2, '0');
}
function buildSlicer(key, id) {
  var box = el(id);
  if (!box) return;
  var values = unique(key).sort(sorter(key));
  box.innerHTML = values.map(function (v) {
    return '<button class="slicer-btn" data-key="' + safe(key) + '" data-value="' + safe(v) + '">' + safe(v) + '</button>';
  }).join('');
  box.querySelectorAll('.slicer-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-key');
      var v = btn.getAttribute('data-value');
      if (selections[k].has(v)) selections[k].delete(v); else selections[k].add(v);
      updateSlicerStyles();
      render();
    });
  });
}
function updateSlicerStyles() {
  document.querySelectorAll('.slicer-btn').forEach(function (b) {
    var k = b.getAttribute('data-key');
    var v = b.getAttribute('data-value');
    b.classList.toggle('active', selections[k] && selections[k].has(v));
  });
}
function clearFilters() {
  Object.keys(selections).forEach(function (k) { selections[k].clear(); });
  updateSlicerStyles();
  render();
}
function filteredRows() {
  return DATA.filter(function (r) {
    return Object.keys(selections).every(function (k) {
      return selections[k].size === 0 || selections[k].has(text(r[k]));
    });
  });
}
function makeChart(id, type, labels, datasets, extra) {
  if (!window.Chart || !el(id)) return;
  if (charts[id]) charts[id].destroy();
  var base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {labels:{color:'#c9d8e6', boxWidth:10, font:{size:10}}, position:'right'},
      tooltip: {mode:'index', intersect:false}
    }
  };
  if (type !== 'doughnut') {
    base.scales = {
      x:{ticks:{color:'#9fb4c7',font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}},
      y:{beginAtZero:true,ticks:{color:'#9fb4c7',font:{size:10}},grid:{color:'rgba(255,255,255,.07)'}}
    };
  }
  extra = extra || {};
  Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
  charts[id] = new Chart(el(id), {type:type, data:{labels:labels,datasets:datasets}, options:base});
}
function render() {
  var rows = filteredRows();
  var billed = rows.filter(function (r) { return text(r['Visit Status']) === 'BILLED'; }).length;
  var signoff = rows.filter(function (r) { return text(r['Visit Status']) === 'SIGNOFF'; }).length;
  var pending = rows.filter(function (r) { return text(r['Visit Status']) === 'PENDING'; }).length;
  var durations = rows.map(function (r) { return validDurationMinutes(r['Duration']); }).filter(function (v) { return v !== null; });
  var avg = durations.length ? durations.reduce(function (a,b) { return a+b; },0) / durations.length : NaN;

  el('totalVisit').textContent = rows.length.toLocaleString();
  el('totalSignoff').textContent = (billed + signoff).toLocaleString();
  el('totalPending').textContent = pending.toLocaleString();
  el('avgSignoff').textContent = fmtMinutes(avg);

  var open = DISPUTES.filter(function (r) { return text(r['RESOLUTION']).toLowerCase() === 'open'; }).length;
  el('openDisputes').textContent = open.toLocaleString();
  el('closedDisputes').textContent = Math.max(0, DISPUTES.length - open).toLocaleString();

  var weeks = Array.from(new Set(rows.map(function (r) { return text(r['IMO WEEK']); }).filter(Boolean))).sort(function (a,b) { return Number(a)-Number(b); });
  var cats = ['<1H','<4H','<6H','<12H','<24H','>24H'];
  makeChart('durationWeekChart','line',weeks,cats.map(function (c) {
    return {label:c,data:weeks.map(function (w) { return rows.filter(function (r) { return text(r['IMO WEEK'])===w && text(r['DURATION CATEGORY'])===c; }).length; }),tension:.25,pointRadius:3,borderWidth:2,fill:false};
  }));

  var reasons = top(countBy(rows,'Visit Reason'),12);
  makeChart('reasonChart','bar',reasons.map(function (x) { return x[0]; }),[{label:'Visits',data:reasons.map(function (x) { return x[1]; })}],{plugins:{legend:{display:false}}});

  var execs = top(countBy(rows.filter(function (r) { return text(r['Sign Off By']); }),'Sign Off By'),8).map(function (x) { return x[0]; });
  makeChart('execWeekChart','bar',weeks,execs.map(function (e) {
    return {label:e,data:weeks.map(function (w) { return rows.filter(function (r) { return text(r['IMO WEEK'])===w && text(r['Sign Off By'])===e; }).length; })};
  }),{scales:{x:{stacked:true,ticks:{color:'#9fb4c7'},grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{color:'#9fb4c7'},grid:{color:'rgba(255,255,255,.07)'}}}});

  var avgs = execs.map(function (e) {
    var v = rows.filter(function (r) { return text(r['Sign Off By'])===e; }).map(function (r) { return validDurationMinutes(r['Duration']); }).filter(function (x) { return x !== null; });
    return v.length ? v.reduce(function (a,b) { return a+b; },0) / v.length / 60 : 0;
  });
  makeChart('execAvgChart','bar',execs,[{label:'Average hours',data:avgs}],{indexAxis:'y',plugins:{legend:{display:false}}});
  makeChart('execDonutChart','doughnut',execs,[{label:'Sign Off',data:execs.map(function (e) { return rows.filter(function (r) { return text(r['Sign Off By'])===e; }).length; })}],{cutout:'62%'});

  if (el('rowCount')) el('rowCount').textContent = rows.length.toLocaleString() + ' rows';
  if (el('detailBody')) {
    el('detailBody').innerHTML = rows.slice(-1000).reverse().map(function (r) {
      return '<tr><td>'+safe(r['IMO WEEK'])+'</td><td>'+safe(r['Visit No'])+'</td><td>'+safe(r['Visit Status'])+'</td><td>'+safe(r['Vessel Name'])+'</td><td>'+safe(r['Agent Company (Customer Name)'])+'</td><td>'+safe(r['Visit Reason'])+'</td><td>'+safe(r['VOR Category'])+'</td><td>'+safe(r['Estimated Time Departure'])+'</td><td>'+safe(r['Invoice No'])+'</td><td>'+safe(r['Sign Off Time'])+'</td><td>'+safe(r['Sign Off By'])+'</td><td>'+safe(r['Duration'])+'</td><td>'+safe(r['DURATION CATEGORY'])+'</td></tr>';
    }).join('');
  }
}

async function load() {
  try {
    el('sourceStatus').textContent = 'Loading synced data…';
    el('dot').className = 'dot';
    el('errorBox').classList.add('hidden');
    var res = await fetch('data.json?_=' + Date.now(), {cache:'no-store'});
    if (!res.ok) throw new Error('data.json HTTP ' + res.status + '. GitHub sync may still be running.');
    var payload = await res.json();
    DATA = Array.isArray(payload.rows) ? payload.rows : [];
    DISPUTES = Array.isArray(payload.disputes) ? payload.disputes : [];
    if (!DATA.length) throw new Error('Synced data file contains no reconciliation rows.');

    buildSlicer('Visit Status','sl-status');
    buildSlicer('Sign Off By','sl-signoff');
    buildSlicer('IMO WEEK','sl-week');
    buildSlicer('DURATION CATEGORY','sl-duration');
    buildSlicer('Visit Reason','sl-reason');
    updateSlicerStyles();

    el('sourceStatus').textContent = 'Live • ' + DATA.length.toLocaleString() + ' raw rows';
    el('dot').className = 'dot ok';
    if (el('updated')) {
      var stamp = payload.generated_at ? new Date(payload.generated_at) : new Date();
      el('updated').textContent = 'Synced ' + stamp.toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'});
    }
    render();
  } catch (e) {
    console.error(e);
    el('sourceStatus').textContent = 'Data sync not ready';
    el('dot').className = 'dot bad';
    el('errorBox').classList.remove('hidden');
    el('errorBox').innerHTML = '<b>Unable to load synced dashboard data.</b><br>' + safe(e.message) + '<br><small>Use Refresh Data after the GitHub sync workflow completes.</small>';
  }
}

el('reset').addEventListener('click', clearFilters);
el('clearAll').addEventListener('click', clearFilters);
el('refresh').addEventListener('click', load);
load();
