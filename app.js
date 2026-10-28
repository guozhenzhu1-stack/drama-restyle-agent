/* ============================================================
   百度一镜 · 短剧转绘 Agent —— 交互逻辑
   ============================================================ */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const styleName = k => (STYLES.find(s=>s.key===k)||{}).name || k;
const regionLabel = r => (!r || r.indexOf('目标地区')===0) ? '英语区（通用稿）' : r;

/* ---- 内联图标 ---- */
const _sv = (w,p,sw=1.6) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  upload: _sv(30,'<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  cube:   _sv(17,'<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>',1.4),
  wand:   _sv(17,'<path d="M4 20L15 9"/><path d="M13 7l4 4"/><path d="M18 4v3M16.5 5.5h3"/>',1.4),
  monitor:_sv(17,'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',1.4),
  send:   _sv(22,'<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',1.9),
  film: `<svg viewBox="0 0 240 80" width="236" height="79"><rect x="0" y="12" width="240" height="56" rx="12" fill="#ffffff" fill-opacity=".5"/><rect x="0" y="12" width="240" height="11" rx="4" fill="#ffffff" fill-opacity=".75"/><rect x="0" y="57" width="240" height="11" rx="4" fill="#ffffff" fill-opacity=".75"/>${[...Array(10)].map((_,i)=>`<rect x="${9+i*24}" y="14" width="12" height="7" rx="2" fill="#8ea2ff" fill-opacity=".55"/><rect x="${9+i*24}" y="59" width="12" height="7" rx="2" fill="#8ea2ff" fill-opacity=".55"/>`).join('')}<rect x="20" y="27" width="56" height="26" rx="5" fill="#b9a7f0" fill-opacity=".45"/><rect x="92" y="27" width="56" height="26" rx="5" fill="#9ab4f5" fill-opacity=".45"/><rect x="164" y="27" width="56" height="26" rx="5" fill="#c3a9ee" fill-opacity=".45"/></svg>`,
  clap: `<svg viewBox="0 0 130 118" width="146" height="132"><g transform="rotate(8 65 60)"><rect x="16" y="44" width="98" height="60" rx="10" fill="#ffffff" fill-opacity=".52"/><path d="M16 44 L112 30 L114 46 L18 60 Z" fill="#8ea2ff" fill-opacity=".55"/>${[...Array(6)].map((_,i)=>`<path d="M${22+i*16} 46 l9 -1.4 l-5 10 l-9 1.4 Z" fill="#ffffff" fill-opacity=".85"/>`).join('')}</g></svg>`,
};

/* ---- 轻提示 ---- */
let _toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(_toastT); _toastT = setTimeout(()=> t.hidden = true, 1800);
}
/* ---- 弹窗 ---- */
function modal(html){
  $('#modal').innerHTML = html;
  $('#modalMask').hidden = false;
}
function closeModal(){ $('#modalMask').hidden = true; $('#modal').innerHTML=''; }
$('#modalMask').addEventListener('click', e => { if(e.target.id==='modalMask') closeModal(); });

/* ---- 下拉菜单 ---- */
function openMenu(anchor, items, cb){
  closeMenu();
  const m = document.createElement('div'); m.className='menu'; m.id='floatMenu';
  m.innerHTML = items.map((it,i)=>`<div class="mi" data-i="${i}">${esc(it)}</div>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  m.style.left = r.left+'px'; m.style.top = (r.bottom+6)+'px';
  m.addEventListener('click', e=>{ const d=e.target.closest('.mi'); if(!d)return; cb(items[+d.dataset.i], +d.dataset.i); closeMenu(); });
  setTimeout(()=>document.addEventListener('click', closeMenu, {once:true}), 0);
}
function closeMenu(){ const m=$('#floatMenu'); if(m) m.remove(); }

/* ---- 侧边导航（分组） ---- */
const NAV = [
  { items:[{ic:'⌂', l:'首页'}] },
  { grp:'直播', items:[{ic:'◉',l:'直播间'},{ic:'⧉',l:'互动配置'},{ic:'▤',l:'知识库'}] },
  { grp:'视频', items:[{ic:'▣',l:'视频工具'},{ic:'▷',l:'视频作品'},{ic:'✦',l:'智能视频创作',blue:1,chev:1}] },
  { grp:'短剧', items:[{ic:'▤',l:'商机市场'},{ic:'◪',l:'趋势洞察'},{ic:'◉',l:'短剧Agent',active:1},{ic:'✎',l:'剧本写作',blue:1,chev:1}] },
  { grp:'互动', items:[{ic:'☺',l:'互动数字人'}] },
  { grp:'资产', items:[{ic:'☺',l:'形象'},{ic:'🎙',l:'音色'}] },
];
function renderNav(){
  $('#nav').innerHTML = NAV.map(g=>`
    ${g.grp?`<div class="nav-grp">${g.grp}</div>`:''}
    ${g.items.map(it=>`<a class="nav-item ${it.active?'active':''} ${it.blue?'blue':''}">
      <span class="ni">${it.ic}</span><span class="nl">${it.l}</span>${it.chev?'<span class="chev">›</span>':''}
    </a>`).join('')}`).join('');
  $$('#nav .nav-item').forEach(a=> a.onclick = ()=>{ state.screen='landing'; render(); });
}

/* ---- 顶层渲染 ---- */
function render(){
  renderNav();
  document.querySelector('.app').classList.toggle('no-sidebar', state.screen==='project');
  state.screen==='landing' ? renderLanding() : renderProject();
}
/* ===================== 落地页（入口） ===================== */
function renderLanding(){
  const L = state.landing;
  const tab = k => L.tab===k?'on':'';
  $('#main').innerHTML = `
  <div class="landing">
    <div class="hero">
      <div class="hero-deco film">${ICON.film}</div>
      <div class="hero-deco clap">${ICON.clap}</div>
      <h1 class="hero-title">让 Agent 开启你
        <span class="seg hero-seg">
          <button data-t="film"   class="${L.toggle==='film'?'on':''}">成片</button>
          <button data-t="script" class="${L.toggle==='script'?'on':''}">剧本</button>
        </span>
        的创作之路</h1>
      <div class="entry-card">
        <div class="entry-tabs">
          <button class="etab ${tab('script')}" data-k="script"><b>上传剧本</b><em>轻松创造爆款短剧效果</em></button>
          <button class="etab ${tab('restyle')}" data-k="restyle"><b>视频转绘</b><em>还原视频剧情，一键出海</em><span class="etab-ill">${ICON.clap}</span></button>
        </div>
        <div class="entry-body">
          <div class="dropzone" id="drop">
            <div class="dz-ico">${ICON.upload}</div>
            <div class="dz-title">${L.tab==='restyle'?'上传视频':'上传剧本'}</div>
            <div class="dz-sub">${L.tab==='restyle'?'支持上传 mp4 格式，单个大小不超过 100M，最多上传 100 个视频':'支持上传 txt / docx / pdf 文件'}</div>
          </div>
          <textarea class="q-input" id="q" placeholder="输入你的改编想法…">${esc(L.query)}</textarea>
          <div class="entry-toolbar">
            <div class="tool" id="tStyle"><span class="ti">${ICON.wand}</span>${styleName(L.style)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRegion"><span class="ti">${ICON.wand}</span>${esc(L.region)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRatio"><span class="ti">${ICON.monitor}</span><span data-r="ratio">${L.ratio}</span><i class="tsep">|</i><span data-r="reso">${L.reso}</span><span class="chev">⌄</span></div>
            <button class="send-btn" id="go">${ICON.send}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="history">
      <div class="h-head">历史创作</div>
      <div class="hgrid" id="hgrid"></div>
    </div>
  </div>`;
  bindLanding();
}
function bindLanding(){
  const L = state.landing;
  $$('.hero-seg button').forEach(b=> b.onclick=e=>{ e.stopPropagation(); L.toggle=b.dataset.t; renderLanding(); });
  $$('.entry-tabs .etab').forEach(b=> b.onclick=()=>{ L.tab=b.dataset.k; renderLanding(); });
  $('#tStyle').onclick = e=> openMenu(e.currentTarget, STYLES.map(s=>s.name), (_,i)=>{ L.style=STYLES[i].key; renderLanding(); });
  $('#tRegion').onclick= e=> openMenu(e.currentTarget, REGIONS, v=>{ L.region=v; renderLanding(); });
  $('#tRatio').onclick = e=>{
    const t = e.target.closest('[data-r]');
    if(t && t.dataset.r==='reso') openMenu(e.currentTarget, RESOS, v=>{ L.reso=v; renderLanding(); });
    else openMenu(e.currentTarget, RATIOS, v=>{ L.ratio=v; renderLanding(); });
  };
  $('#q').oninput = e=> L.query = e.target.value;
  $('#drop').onclick = startProject;
  $('#go').onclick   = startProject;
  renderHistory();
}
function renderHistory(){
  const now = '2026.01.01 17:59:03', T = '双女主甜宠科幻日系';
  const cell = (c,i)=> `<img src="${coverSVG(c[1], i + (c[0].length%3))}" alt="">`;
  const demos = [
    {type:'video', n:1, cells:[['city','real']]},
    {type:'video', n:2, cells:[['bedroom','idol'],['snowHall','anime']]},
    {type:'video', n:3, cells:[['bedroom','korean'],['hall','cnanime'],['corridor','anime']]},
    {type:'video', n:4, cells:[['city','idol'],['bedroom','korean'],['corridor','real'],['hall','western']]},
    {type:'empty'},
    {type:'script', text:'创意描述生成一段外国女生为主角戴耳机的视频视频视频视频视频视频…'},
    {type:'script', text:'创意描述生成一段外国女生为主角戴耳机的视频'},
  ];
  $('#hgrid').innerHTML = demos.map(d=>{
    if(d.type==='script') return `<div class="hcard text"><div class="quote">"</div><p>${esc(d.text)}</p><span class="stag">剧本</span></div>`;
    if(d.type==='empty')  return `<div class="hcard"><div class="thumbs empty">✦</div><div class="cap"><b>${T}</b><small>${now}</small></div></div>`;
    const imgs = d.cells.map((c,i)=>cell(c,i)).join('');
    return `<div class="hcard"><div class="thumbs g${d.n}">${imgs}<span class="vtag">▶ 视频</span></div><div class="cap"><b>${T}</b><small>${now}</small></div></div>`;
  }).join('');
  $$('#hgrid .hcard').forEach(c=> c.onclick=()=> startProject());
}

function startProject(){
  const L = state.landing;
  state.project.style = L.style; // 入口风格带入项目
  state.project.modelVideo = L.modelVideo; state.project.modelImage = L.modelImage;
  state.project.ratio = L.ratio; state.project.reso = L.reso; state.project.region = L.region;
  state.screen='project'; state.stage='clips';
  render();
  toast('已创建项目：'+state.project.title);
}
/* ===================== 项目工作台 ===================== */
const STAGES = [
  {k:'clips', label:'原片管理'}, {k:'script', label:'剧本本土化'},
  {k:'asset', label:'资产确认'}, {k:'shot',  label:'分镜转绘'},
  {k:'film',  label:'合成成片'},
];
function renderProject(){
  const p = state.project;
  const chip = (id,txt)=>`<div class="tb-ctrl" id="${id}">${txt}</div>`;
  $('#main').innerHTML = `
  <div class="proj">
    <div class="topbar">
      <div class="tb-left">
        <button class="tb-back" id="back">‹</button>
        <input class="tb-title" id="title" value="${esc(p.title)}">
      </div>
      <div class="tb-mid">
        ${chip('cStyle','🎨 '+styleName(p.style))}
        ${chip('cRegion','🌍 '+regionLabel(p.region))}
        ${chip('cRatio','▭ '+p.ratio)}
        ${chip('cReso','✦ '+p.reso)}
      </div>
      <div class="tb-right">
        <button class="tb-ghost">★ 我的订阅</button>
        <button class="tb-ghost" id="assetBtn">◱ 项目资产</button>
        <button class="tb-primary" id="exportAll">导出成片</button>
      </div>
    </div>
    <div class="proj-tabs">
      ${STAGES.map(s=>`<button data-k="${s.k}" class="${state.stage===s.k?'on':''}">${s.label}</button>`).join('')}
      ${state.stage==='shot'?'<button class="ptab-export" id="exportShots">⬇ 导出</button>':''}
    </div>
    <div class="proj-body ${state.stage==='clips'?'two':'three'}" id="pbody"></div>
  </div>`;
  bindTopbar();
  renderBody();
}
function bindTopbar(){
  const p = state.project;
  $('#back').onclick = ()=>{ state.screen='landing'; render(); };
  $('#title').onchange = e=> p.title = e.target.value || p.title;
  $('#cStyle').onclick = e=> openMenu(e.currentTarget, STYLES.map(s=>s.name), (_,i)=>{ p.style=STYLES[i].key; render(); });
  $('#cRegion').onclick= e=> openMenu(e.currentTarget, REGIONS, v=>{ p.region=v; render(); });
  $('#cRatio').onclick = e=> openMenu(e.currentTarget, RATIOS, v=>{ p.ratio=v; render(); });
  $('#cReso').onclick  = e=> openMenu(e.currentTarget, RESOS,  v=>{ p.reso=v; render(); });
  $('#assetBtn').onclick = ()=>{ state.stage='asset'; render(); };
  const expShots = $('#exportShots'); if(expShots) expShots.onclick = openExportDialog;
  $('#exportAll').onclick= ()=>{ state.stage='film'; render(); };
  $$('.proj-tabs button[data-k]').forEach(b=> b.onclick=()=>{ state.stage=b.dataset.k; render(); });
}
/* ---- 工作台主体 ---- */
function renderBody(){
  const pb = $('#pbody');
  if(state.stage==='clips')      pb.innerHTML = chatHTML() + clipsHTML();
  else if(state.stage==='script') pb.innerHTML = chatHTML() + tocHTML() + scriptHTML();
  else                            pb.innerHTML = chatHTML() + eplistHTML() + panelHTML();
  bindChat();
  if(state.stage==='clips')       bindClips();
  else if(state.stage==='script') bindScript();
  else { bindEplist(); bindPanel(); }
}

/* ---- Agent 对话 ---- */
const CHAT = {
  clips:[
    {who:'a', html:'已为你导入 <b>4 集</b>短剧原片，可在右侧拖拽排序、预览或继续上传。'},
    {who:'a', html:'确认原片无误后，我会先解析剧情，并按目标地区完成剧本本土化。', action:'开始剧本本土化', go:'script'},
  ],
  asset:[
    {who:'a', html:'已结合本土化剧本，从原片中提炼出 <b>2 个角色、3 个场景、2 个道具</b>，并自动生成了转绘 Prompt。'},
    {who:'a', html:'请在右侧确认并逐个 / 批量生成资产图；确认后进入分镜转绘。', action:'前往分镜转绘', go:'shot'},
  ],
  shot:[
    {who:'a', html:'已基于原片与资产自动拆解出 <b>7 个分镜</b>，描述中 <span class="ref">@引用</span> 了对应资产。'},
    {who:'a', html:'可逐个或批量转绘；全部完成后即可合成成片。', action:'合成成片', go:'film'},
  ],
  film:[
    {who:'a', html:'分镜已全部转绘完成 🎉，可预览并导出合成成片。'},
    {who:'a', html:'点击「导出合成成片」生成最终视频。', action:'导出合成成片', go:'film'},
  ],
};
function chatMessages(){
  if(state.stage==='script'){
    const lang = regionLang(state.project.region), L = SCRIPT_LANGS[lang];
    const n = state.epScripts.length;
    const isZh = lang === 'zh';
    if(state.scriptSource && !state.scriptSource.demo){
      return [
        {who:'a', html:`已读取上传剧本 <b>${esc(state.scriptSource.name)}</b>，自动拆分为 <b>${n} 集</b>，并完成场次与对白结构识别。`},
        {who:'a', html:`右侧为上传稿原文，可逐集查看，也支持整本下载。如需按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 改写，可在对话中继续调整。`, action:'确认剧本，提炼资产', go:'asset'},
      ];
    }
    return [
      {who:'a', html:isZh
        ? `已完成全剧 <b>${n} 集</b>的剧情解析，并按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 校对中文原生稿。`
        : `已完成全剧 <b>${n} 集</b>的剧情解析，并按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 完成剧本本土化。`},
      {who:'a', html:isZh
        ? `人名、称谓与单集节奏均已校对，交付稿为 <b>中文原生剧本</b>。右侧可逐集查看，也支持整本下载。`
        : `人名、称谓、俚语与单集节奏均已适配，交付稿为 <b>${L.name}</b> 剧本。右侧可逐集查看，也支持整本下载。`, action:'确认剧本，提炼资产', go:'asset'},
    ];
  }
  return CHAT[state.stage] || [];
}
function chatHTML(){
  const msgs = chatMessages();
  const body = msgs.map(m=>`
    <div class="cmsg ${m.who}">
      <div class="cbubble">${m.html}
        ${m.action?`<button class="cbtn" data-go="${m.go}">${m.action}</button>`:''}
      </div>
    </div>`).join('');
  return `
  <div class="chat">
    <div class="chat-top"><span class="ava">🤖</span> 一镜 Agent</div>
    <div class="cscroll" id="cscroll">
      <div class="cmsg u"><div class="cbubble">帮我把这部短剧转成${styleName(state.project.style)}</div></div>
      ${body}
    </div>
    <div class="composer">
      <input id="cin" placeholder="继续和一镜对话，描述你的转绘需求…">
      <button id="csend">➜</button>
    </div>
  </div>`;
}
function bindChat(){
  $$('.cbtn').forEach(b=> b.onclick=()=>{ state.stage=b.dataset.go; render(); });
  const send = ()=>{
    const v = $('#cin').value.trim(); if(!v) return;
    $('#cscroll').insertAdjacentHTML('beforeend', `<div class="cmsg u"><div class="cbubble">${esc(v)}</div></div>`);
    $('#cin').value='';
    const sc=$('#cscroll'); sc.scrollTop=sc.scrollHeight;
    setTimeout(()=>{
      sc.insertAdjacentHTML('beforeend', `<div class="cmsg a"><div class="cbubble">好的，已按你的描述更新，最新结果可在右侧查看。</div></div>`);
      sc.scrollTop=sc.scrollHeight;
    }, 500);
  };
  $('#csend').onclick = send;
  $('#cin').onkeydown = e=>{ if(e.key==='Enter') send(); };
}

/* ---- 分集列表（中栏，样式与剧本本土化目录一致） ---- */
function eplistHTML(){
  const active = state.stage==='script' ? state.scriptEp : state.activeEp;
  const items = state.episodes.map((e,i)=>`
    <div class="toc-item ${i===active?'on':''}" data-i="${i}" title="${esc(e.title)}">
      <span class="toc-title">第 ${e.no} 集</span>
      <span class="toc-zh">${esc(e.title)}</span>
    </div>`).join('');
  return `<nav class="toc eplist-toc">
    <div class="toc-head">目录 <em>${state.episodes.length} 集</em></div>
    <div class="toc-body">${items}</div>
  </nav>`;
}
function bindEplist(){
  $$('.eplist-toc .toc-item').forEach(el=> el.onclick=()=>{
    if(state.stage==='script') state.scriptEp = +el.dataset.i;
    else                       state.activeEp = +el.dataset.i;
    render();
  });
}
/* ===================== 原片管理器 ===================== */
function clipsHTML(){
  const cards = state.clips.map((c,i)=>{
    const img = drawScene(c.scene, 'orig');
    return `<div class="clipc" draggable="true" data-i="${i}">
      <div class="clip-thumb"><img src="${img}" alt=""><span class="clip-play">▶</span><span class="clip-dur">${c.dur}</span></div>
      <div class="clip-meta"><span>${esc(c.name)}</span><button class="clip-del" data-i="${i}">✕</button></div>
    </div>`;
  }).join('');
  return `<div class="mgr">
    <div class="mgr-head">
      <div>原片管理 <em>${state.clips.length} 集</em></div>
      <button class="tb-primary" id="addClip">＋ 上传原片</button>
    </div>
    <div class="clip-grid" id="clipGrid">${cards}</div>
    <p class="mgr-tip">拖拽卡片可调整顺序 · 点击缩略图预览 · ✕ 删除</p>
  </div>`;
}
function bindClips(){
  let dragI = null;
  $$('#clipGrid .clipc').forEach(el=>{
    el.querySelector('.clip-thumb').onclick = ()=> playClip(+el.dataset.i);
    el.ondragstart = ()=> dragI = +el.dataset.i;
    el.ondragover  = e=> e.preventDefault();
    el.ondrop = e=>{ e.preventDefault(); const to=+el.dataset.i;
      if(dragI===null||dragI===to) return;
      const [m]=state.clips.splice(dragI,1); state.clips.splice(to,0,m); dragI=null; renderBody();
    };
  });
  $$('#clipGrid .clip-del').forEach(b=> b.onclick=e=>{ e.stopPropagation();
    state.clips.splice(+b.dataset.i,1); renderBody(); toast('已删除'); });
  $('#addClip').onclick = ()=>{
    const n = state.clips.length+1;
    state.clips.push({ id:'c'+Date.now(), name:'第'+['一','二','三','四','五','六','七','八','九','十'][n-1]+'集', dur:'00:05', scene:SC.bedroom });
    renderBody(); toast('已上传第'+n+'集');
  };
}
function playClip(i){
  const c = state.clips[i];
  modal(`<div class="player">
    <div class="player-head"><b>${esc(c.name)}</b><button onclick="closeModal()">✕</button></div>
    <div class="frame"><img src="${drawScene(c.scene,'orig')}" alt=""><span class="frame-play">▶</span></div>
    <div class="player-foot">原片预览 · ${c.dur} · 占位画面（Demo）</div>
  </div>`);
}
/* ===================== 剧本本土化 ===================== */
const ADAPT_TIPS = {
  zh:["中文原生稿","称谓校对","口语化对白","单集节奏"],
  en:["人名西化","称谓适配","俚语替换","对白节奏"],
  ja:["人名本地化","敬语分级","文化梗替换","对白节奏"],
  ko:["人名本地化","敬语分级","文化梗替换","对白节奏"],
  es:["人名本地化","称谓适配","俚语替换","对白节奏"],
};
/* 目录导航（左栏） */
function tocHTML(){
  const eps = state.epScripts;
  const lang = regionLang(state.project.region);
  const items = eps.map((e,i)=>{
    const loc = epTitleI18n(e, lang);
    return `<a class="toc-item ${i===state.scriptEp?'on':''}" data-i="${i}" title="${esc(loc)}">
      <span class="toc-title">第 ${e.no} 集</span>
      <span class="toc-zh">${esc(e.title)}</span>
    </a>`;
  }).join('');
  return `<nav class="toc">
    <div class="toc-head">目录 <em>${eps.length} 集</em></div>
    <div class="toc-body" id="tocBody">${items}</div>
  </nav>`;
}
/* 单集剧本（连续长文档中的一节） */
function episodeHTML(ep, idx, lang){
  if(ep.raw) return rawEpisodeHTML(ep, idx);
  const isZh = lang === 'zh';
  const sec = ep.scenes.length * 24;
  const dur = `${Math.floor(sec/60)}'${String(sec%60).padStart(2,'0')}"`;
  const locTitle = epTitleI18n(ep, lang);
  const scenes = ep.scenes.map((sc,i)=>`
    <div class="sc-block">
      <div class="sc-head"><span class="sc-num">场 ${i+1}</span>
        <span class="sc-head-txt">${esc(sc.head[lang])}${isZh?'':`<small class="sc-head-zh">${esc(sc.head.zh)}</small>`}</span>
      </div>
      <p class="sc-action">${esc(sc.action[lang])}</p>
      ${isZh?'':`<p class="sc-orig">${esc((sc.actionZh && sc.actionZh[lang]) || sc.action.zh)}</p>`}
      ${sc.lines.map(l=>{
        const c = SCRIPT_CAST[l.who];
        const zhName = (c.zhOf && c.zhOf[lang]) || c.zh;
        return `<div class="sc-line">
          <div class="sc-who">${esc(c[lang])}${isZh?'':`<small>${esc(zhName)} · ${esc(c.role)}</small>`}</div>
          <p class="sc-text">${esc(l.t[lang])}</p>
          ${isZh?'':`<p class="sc-orig">${esc((l.tZh && l.tZh[lang]) || l.t.zh)}</p>`}
        </div>`;
      }).join('')}
    </div>`).join('');
  return `<section class="script-ep" id="script-ep-${idx}" data-ep="${idx}">
    <div class="ep-kicker">EPISODE ${String(ep.no).padStart(2,'0')} · ${SCRIPT_LANGS[lang].tag}</div>
    <h2 class="ep-h">${esc(locTitle)}</h2>
    ${locTitle!==ep.title?`<div class="ep-h-zh sc-orig">${esc(ep.title)}</div>`:''}
    <div class="ep-meta">第 ${ep.no} 集 · ${ep.scenes.length} 场 · 约 ${dur}</div>
    ${scenes}
  </section>`;
}
/* 上传剧本：原文分集渲染 */
const RAW_SCENE_RE = /^\s*(?:内景|外景|日景|夜景|INT\.?|EXT\.?|场\s*\d+|第\s*\d+\s*场)/i;
const RAW_LINE_RE  = /^([^：:]{1,12}?)\s*(?:[（(][^）)]*[）)])?\s*[：:]\s*(.+)$/;
function rawEpisodeHTML(ep, idx){
  const lines = ep.raw.split('\n');
  let scenes = 0, body = '';
  lines.forEach(line=>{
    const t = line.trim();
    if(!t) return;
    const m = t.match(RAW_LINE_RE);
    if(RAW_SCENE_RE.test(t)){
      scenes++;
      body += `<div class="sc-head"><span class="sc-num">场 ${scenes}</span><span>${esc(t)}</span></div>`;
    } else if(m && !/[。！？；]/.test(m[1])){
      body += `<div class="sc-line">
        <div class="sc-who">${esc(m[1].trim())}</div>
        <p class="sc-text">${esc(m[2])}</p>
      </div>`;
    } else {
      body += `<p class="sc-action">${esc(t)}</p>`;
    }
  });
  return `<section class="script-ep raw-ep" id="script-ep-${idx}" data-ep="${idx}">
    <div class="ep-kicker">EPISODE ${String(ep.no).padStart(2,'0')} · SOURCE</div>
    <h2 class="ep-h">${esc(ep.title)}</h2>
    <div class="ep-meta">第 ${ep.no} 集 · ${ep.raw.length} 字 · 上传稿原文</div>
    ${body || '<p class="sc-action">（本集暂无正文）</p>'}
  </section>`;
}
/* 解析上传的纯文本剧本：按「第 X 集 / EP N」分集 */
const EP_HEAD_RE = /^\s*(?:#+\s*)?(?:第\s*[0-9零一二三四五六七八九十百两]+\s*集|(?:EP|EPISODE|E)\s*\.?\s*\d{1,3})/i;
const EP_HEAD_STRIP = /^\s*(?:#+\s*)?(?:第\s*[0-9零一二三四五六七八九十百两]+\s*集|(?:EP|EPISODE|E)\s*\.?\s*\d{1,3})\s*[：:·.\-—、]?\s*/i;
function parseScriptText(text, fileName){
  const lines = text.replace(/\r\n?/g,'\n').split('\n');
  const groups = [];
  let cur = null;
  lines.forEach(line=>{
    if(EP_HEAD_RE.test(line)){
      const title = line.replace(EP_HEAD_STRIP,'').trim();
      cur = { title, lines:[] };
      groups.push(cur);
    } else if(cur){
      cur.lines.push(line);
    }
  });
  if(!groups.length){
    const body = text.trim();
    if(!body) return [];
    const base = (fileName||'上传剧本').replace(/\.[^.]+$/,'');
    return [{ no:1, title:base, raw:body }];
  }
  return groups.map((g,i)=>({
    no:i+1,
    title:g.title || `第 ${i+1} 集`,
    raw:g.lines.join('\n').trim() || '（本集暂无正文）',
  }));
}
function applyUploadedScript(text, file){
  const eps = parseScriptText(text, file.name);
  if(!eps.length){ toast('未解析到剧本内容，请检查文件'); return; }
  state.epScripts = eps;
  state.scriptSource = { name:file.name, demo:false, at:new Date().toLocaleString('zh-CN',{hour12:false}) };
  state.scriptEp = 0;
  renderBody();
  toast(`已上传《${file.name}》，解析 ${eps.length} 集`);
}
function handleScriptUpload(file){
  if(/\.(txt|md|markdown)$/i.test(file.name)){
    const r = new FileReader();
    r.onload  = ()=> applyUploadedScript(String(r.result||''), file);
    r.onerror = ()=> toast('文件读取失败，请重试');
    r.readAsText(file, 'utf-8');
  } else {
    toast('Demo 环境暂仅解析 .txt / .md，请将文档另存为 txt 后上传');
  }
}
function scriptHTML(){
  const lang = regionLang(state.project.region);
  const L = SCRIPT_LANGS[lang];
  const isZh = lang === 'zh';
  const src = state.scriptSource || { name:'示例剧本（Demo）', demo:true };
  const demo = !!src.demo;
  const eps = state.epScripts;
  return `<div class="panel script-panel">
    <div class="script-head">
      <div class="script-head-l">
        <b>剧本本土化</b>
        <span class="lang-chip">${demo?`${L.tag} · ${L.name}`:'SOURCE · 原文'}</span>
        <span class="adapt-region">${esc(regionLabel(state.project.region))}</span>
      </div>
      <div class="script-head-r">
        <input type="file" id="scriptFile" accept=".txt,.md,.markdown,.doc,.docx,.pdf" hidden>
        <button class="aghost" id="uploadScript">⬆ 上传剧本</button>
        ${demo&&!isZh?`<button class="aghost" id="toggleOrig">${state.showOrig?'隐藏中文':'显示中文'}</button>`:''}
        <button class="tb-primary" id="dlBook">⬇ 下载整本剧本</button>
      </div>
    </div>
    <div class="script-src ${demo?'is-demo':'is-upload'}">
      <span class="src-file">${demo?'📄':'📄'} ${esc(src.name)}</span>
      <span class="src-meta">${eps.length} 集${src.at?' · '+esc(src.at)+' 上传':' · 内置示例'}</span>
      ${demo
        ? '<span class="src-hint">支持上传 .txt / .md 剧本替换</span>'
        : '<button class="src-restore" id="restoreScript">恢复示例剧本</button>'}
    </div>
    <div class="script-scroll" id="scriptScroll">
      <div class="script-doc ${state.showOrig||isZh?'':'hide-orig'}">
        <div class="doc-cover">
          <div class="doc-kicker">SCREENPLAY · ${demo?L.tag+' · '+(isZh?'中文原生稿':'中文翻译'):'SOURCE'}</div>
          <h1 class="doc-cover-title">${esc(demo?projectTitleI18n(state.project.title, lang):state.project.title)}</h1>
          ${demo&&projectTitleI18n(state.project.title, lang)!==state.project.title?`<div class="doc-cover-zh sc-orig">${esc(state.project.title)}</div>`:''}
          <div class="doc-sub">全 ${eps.length} 集 · ${demo
            ? `目标地区 ${esc(regionLabel(state.project.region))} · ${isZh?'中文原生稿':`已适配 ${L.name}`}`
            : '上传剧本 · 原文展示'}</div>
          <div class="adapt-chips">${(demo?[...ADAPT_TIPS[lang], ...(isZh?[]:['中文翻译'])]:['原文保留','自动分集','整本导出']).map(t=>`<span>${t}</span>`).join('')}</div>
        </div>
        ${eps.map((ep,i)=> episodeHTML(ep,i,lang)).join('')}
        <div class="doc-end">— 全剧终 —</div>
      </div>
    </div>
  </div>`;
}
function bindScript(){
  const sc = $('#scriptScroll');
  const tocBody = $('#tocBody');
  const items = $$('.toc .toc-item');
  const secs  = $$('.script-ep');
  let lock = false, lockTimer;

  const setActive = i =>{
    if(i===state.scriptEp && items[i] && items[i].classList.contains('on')) return;
    state.scriptEp = i;
    items.forEach((el,k)=> el.classList.toggle('on', k===i));
    const el = items[i]; if(!el) return;
    const r = el.getBoundingClientRect(), br = tocBody.getBoundingClientRect();
    if(r.top < br.top + 6)            tocBody.scrollTop -= (br.top + 6 - r.top);
    else if(r.bottom > br.bottom - 6) tocBody.scrollTop += (r.bottom - br.bottom + 6);
  };
  const spy = ()=>{
    if(lock) return;
    const line = sc.getBoundingClientRect().top + 96;
    let active = 0;
    secs.forEach((s,i)=>{ if(s.getBoundingClientRect().top <= line) active = i; });
    setActive(active);
  };
  sc.addEventListener('scroll', spy, {passive:true});

  items.forEach((el,i)=> el.onclick = ()=>{
    const top = sc.scrollTop + secs[i].getBoundingClientRect().top - sc.getBoundingClientRect().top - 14;
    sc.scrollTo({top: Math.max(0, top), behavior:'smooth'});
    setActive(i);
    lock = true; clearTimeout(lockTimer);
    lockTimer = setTimeout(()=> lock = false, 700);
  });
  const unlock = ()=>{ lock = false; clearTimeout(lockTimer); };
  sc.addEventListener('wheel', unlock, {passive:true});
  sc.addEventListener('touchstart', unlock, {passive:true});

  const toggle = $('#toggleOrig');
  if(toggle) toggle.onclick = e=>{
    state.showOrig = !state.showOrig;
    $('.script-doc').classList.toggle('hide-orig', !state.showOrig);
    e.currentTarget.textContent = state.showOrig ? '隐藏中文' : '显示中文';
  };
  $('#dlBook').onclick = ()=> downloadScript(false);
  $('#uploadScript').onclick = ()=> $('#scriptFile').click();
  $('#scriptFile').onchange = e=>{
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if(f) handleScriptUpload(f);
  };
  const restore = $('#restoreScript');
  if(restore) restore.onclick = ()=>{
    state.epScripts = EP_SCRIPTS;
    state.scriptSource = { name:'示例剧本（Demo）', demo:true, at:null };
    state.scriptEp = 0;
    renderBody();
    toast('已恢复示例剧本');
  };
  spy();
}
function downloadScript(one){
  const lang = regionLang(state.project.region);
  const L = SCRIPT_LANGS[lang];
  const isZh = lang === 'zh';
  const src = state.scriptSource || { demo:true };
  const eps = one ? [state.epScripts[state.scriptEp]] : state.epScripts;
  const rule = '='.repeat(44);
  const body = eps.map(ep=>{
    if(ep.raw) return `第 ${ep.no} 集　${ep.title}\n${'-'.repeat(36)}\n\n${ep.raw}`;
    const locTitle = epTitleI18n(ep, lang);
    const headLine = `第 ${ep.no} 集　${locTitle}${locTitle!==ep.title?`（${ep.title}）`:''}`;
    const scenes = ep.scenes.map((sc,i)=>[
      `第 ${i+1} 场　${sc.head[lang]}${!isZh && sc.head.zh?`｜${sc.head.zh}`:''}`,
      '',
      sc.action[lang],
      ...(isZh ? [] : [`中译：${(sc.actionZh && sc.actionZh[lang]) || sc.action.zh}`]),
      '',
      sc.lines.map(l=>{
        const c = SCRIPT_CAST[l.who];
        if(isZh) return `${c[lang]}：${l.t[lang]}`;
        const cZh = (c.zhOf && c.zhOf[lang]) || c.zh;
        const zh = (l.tZh && l.tZh[lang]) || l.t.zh;
        return `${c[lang]}：${l.t[lang]}\n${cZh}：${zh}`;
      }).join('\n\n'),
    ].join('\n')).join('\n\n');
    return `${headLine}\n${'-'.repeat(36)}\n\n${scenes}`;
  }).join('\n\n\n');
  const scriptLabel = src.demo
    ? (isZh ? '剧本（中文 · 原生稿）' : `剧本（${L.name} · 中文翻译 · 双语对照）`)
    : `剧本原文（上传稿：${src.name}）`;
  const dispTitle = src.demo ? projectTitleI18n(state.project.title, lang) : state.project.title;
  const titleZh = dispTitle !== state.project.title ? `（${state.project.title}）` : '';
  const meta = `${dispTitle}${titleZh}　${scriptLabel}\n目标地区：${regionLabel(state.project.region)}　|　共 ${eps.length} 集　|　${new Date().toLocaleDateString('zh-CN')}\n${rule}\n\n`;
  const text = meta + body + `\n\n${rule}\n百度一镜 · 短剧转绘 Agent 生成`;
  const blob = new Blob(['\ufeff' + text], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = src.demo
    ? (isZh ? `${state.project.title}_中文剧本.txt` : `${state.project.title}_${L.name}_双语剧本.txt`)
    : `${state.project.title}_上传稿_剧本.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
  const kind = isZh ? '中文' : '双语';
  toast(one ? `已下载第 ${eps[0].no} 集${kind}剧本` : `已下载整本${kind}剧本（${eps.length} 集）`);
}
/* ===================== 右侧工作面板 ===================== */
const PTABS = [{k:'asset',l:'资产'},{k:'shot',l:'分镜'},{k:'film',l:'成片'}];
function panelHTML(){
  const inner = state.stage==='asset' ? assetHTML()
              : state.stage==='shot'  ? shotHTML()
              : filmHTML();
  return `<div class="panel">
    <div class="ptabs">${PTABS.map(t=>`<button data-k="${t.k}" class="${state.stage===t.k?'on':''}">${t.l}</button>`).join('')}</div>
    <div class="pbodywrap" id="pbodywrap">${inner}</div>
  </div>`;
}
function bindPanel(){
  $$('.ptabs button').forEach(b=> b.onclick=()=>{ state.stage=b.dataset.k; render(); });
  if(state.stage==='asset') bindAsset();
  else if(state.stage==='shot') bindShot();
  else bindFilm();
}

/* ---- 资产确认 ---- */
const ASSET_SUBS = [{k:'character',l:'角色'},{k:'scene',l:'场景'},{k:'prop',l:'道具'}];
const ASSET_LABEL = { character:'角色', scene:'场景', prop:'道具' };
function assetCat(id){
  return ['character','scene','prop'].find(k=> state.assets[k].some(a=>a.id===id));
}
function assetImage(a, cat, mode){
  const style = state.project.style;
  return cat==='character' ? portraitSVG(a.scene, mode, style)
       : cat==='prop'      ? propSVG(a.scene, mode, style)
       : drawScene(a.scene, mode, style);
}
function assetThumb(a){
  const g = state.generating.has(a.id);
  const done = a.pre || state.assetDone[a.id];
  const chk = state.assetBatch
    ? `<label class="aimg-chk" title="勾选后可批量生成"><input type="checkbox" class="achk" data-sel="${a.id}" ${state.assetSel.has(a.id)?'checked':''}></label>`
    : '';
  if(g) return `<div class="aimg skeleton"><span class="spin"></span>${chk}</div>`;
  if(!done) return `<div class="aimg empty">待生成${chk}</div>`;
  return `<div class="aimg"><img src="${assetImage(a, state.assetTab, 'new')}" alt="">
    ${chk}<span class="aimg-cmp">对比</span>
  </div>`;
}
/* 角色妆造：同一角色的多套造型，纵向排列并展示 Prompt */
function lookDoneOf(a, lk){ return !!(a.pre || state.assetDone[a.id] || state.lookDone[lk.id]); }
function looksAllDone(a){
  return !!(a.looks && a.looks.length && a.looks.every(lk=> lookDoneOf(a, lk)));
}
function lookStripHTML(a){
  if(!a.looks || !a.looks.length) return '';
  const rows = a.looks.map(lk=>{
    const gen = state.generating.has(a.id) || state.lookGenerating.has(lk.id);
    const done = !gen && lookDoneOf(a, lk);
    const chk = state.assetBatch
      ? `<label class="look-chk" title="勾选后可批量生成"><input type="checkbox" class="achk" data-sel="${lk.id}" ${state.assetSel.has(lk.id)?'checked':''}></label>`
      : '';
    const img = gen
      ? `<span class="spin sm"></span>`
      : done ? `<img src="${assetImage(lk, 'character', 'new')}" alt=""><span class="look-cmp">对比</span>`
      : `<span class="look-ph">👤</span><span class="look-wait">待生成</span>`;
    const refs = (lk.refs && lk.refs.length)
      ? lk.refs
      : [assetImage(a, 'character', 'orig'), assetImage(lk, 'character', 'orig')];
    return `<div class="look ${done?'is-done':gen?'is-gen':'is-wait'}">
      <div class="look-side">
        <div class="look-media">
          ${chk}
          <button class="look-img" data-cmp-look="${lk.id}" data-owner="${a.id}" ${done?'':'disabled'} title="${done?'查看转绘前后':'生成后可查看转绘前后'}">${img}</button>
        </div>
      </div>
      <div class="look-body">
        <div class="look-box">
          <textarea class="look-prompt" data-owner="${a.id}" data-look="${lk.id}" title="可编辑妆造提示词">${esc(lk.prompt)}</textarea>
          <div class="look-tools">
            <span class="look-refs" title="参考图">
              ${refs.map(src=>`<img src="${esc(src)}" alt="参考图" title="点击放大查看">`).join('')}
            </span>
            <button class="look-link" data-ref="${a.id}" data-look-ref="${lk.id}">⬆ 上传参考图</button>
            <span class="look-flex"></span>
            <button class="look-gen" data-gen-look="${lk.id}" data-owner="${a.id}" ${gen?'disabled':''}>${gen?'生成中…':done?'重新生成':'生成图片'}</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  return `<div class="looks"><div class="look-list">${rows}</div></div>`;
}
function assetHTML(){
  const list = state.assets[state.assetTab];
  const roles = a=>{
    if(!a.role) return '';
    const female = /女/.test(a.role);
    return `<span class="atag role-${female?'f':'m'}">${female?'♀':'♂'} ${esc(a.role)}</span>`;
  };
  const rows = list.map(a=>{
    const lookCard = state.assetTab==='character' && a.looks && a.looks.length;
    if(lookCard){
      return `<div class="arow arow-lookcard" data-id="${a.id}">
        <div class="acol">
          <div class="arow-top"><b>${esc(a.name)}</b>${roles(a)}
            <span class="arow-count">${a.looks.length} 套妆造</span>
          </div>
          ${lookStripHTML(a)}
        </div>
      </div>`;
    }
    const done = a.pre || state.assetDone[a.id];
    return `<div class="arow" data-id="${a.id}">
      ${assetThumb(a)}
      <div class="acol">
        <div class="arow-top"><b>${esc(a.name)}</b>${roles(a)}
          ${a.ref?`<span class="aref-chip">${esc(a.ref)}</span>`:''}</div>
        <div class="look-box">
          <textarea class="aprompt" data-id="${a.id}">${esc(a.prompt)}</textarea>
          <div class="look-tools">
            <span class="look-refs" title="参考图">
              ${(a.refs || []).map(src=>`<img src="${esc(src)}" alt="参考图" title="点击放大查看">`).join('')}
            </span>
            <button class="look-link" data-ref="${a.id}">⬆ 上传参考图</button>
            <span class="look-flex"></span>
            <button class="look-gen" data-gen="${a.id}">${done?'重新生成':'生成图片'}</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  const tools = state.assetBatch
    ? `<label class="selall"><input type="checkbox" id="selAll">全选</label>
       <button class="aghost" id="cancelBatch">取消</button>
       <button class="aghost" id="exportAssets">⬇ 导出资产表</button>
       <button class="aprimary" id="genAll">生成所选</button>`
    : `<button class="aghost" id="exportAssets">⬇ 导出资产表</button>
       <button class="aprimary" id="batchStart">批量生成</button>`;
  return `
    <div class="subtabs">
      ${ASSET_SUBS.map(s=>`<button data-k="${s.k}" class="${state.assetTab===s.k?'on':''}">${s.l} <em>${state.assets[s.k].length}</em></button>`).join('')}
      <div class="subtools">${tools}</div>
    </div>
    ${state.assetBatch?'<div class="batch-hint">已进入批量选择：勾选要生成的妆造图/资产后点击「生成所选」</div>':''}
    <div class="arows">${rows}</div>`;
}
function genAsset(id){
  if(state.generating.has(id)) return;
  state.generating.add(id); renderBody();
  setTimeout(()=>{ state.generating.delete(id); state.assetDone[id]=true; renderBody(); toast('资产已生成'); }, 900);
}
function genLook(ownerId, lookId){
  if(state.lookGenerating.has(lookId) || state.generating.has(ownerId)) return;
  state.lookGenerating.add(lookId); renderBody();
  setTimeout(()=>{ state.lookGenerating.delete(lookId); state.lookDone[lookId]=true; renderBody(); toast('妆造图已生成'); }, 900);
}
function findLookById(lookId){
  for(const a of state.assets.character){
    if(!a.looks) continue;
    const lk = a.looks.find(x=>x.id===lookId);
    if(lk) return {a, lk};
  }
  return null;
}
/* 批量生成的最小选择单元：角色为单套妆造，场景/道具为单个资产 */
function batchUnitIds(){
  const cat = state.assetTab;
  const list = state.assets[cat];
  if(cat==='character')
    return list.flatMap(a=> a.looks && a.looks.length ? a.looks.map(l=>l.id) : [a.id]);
  return list.map(a=>a.id);
}
function updateBatchBtn(){
  if(!state.assetBatch) return;
  const btn = $('#genAll'); if(!btn) return;
  const units = batchUnitIds();
  const selIds = units.filter(id=> state.assetSel.has(id));
  btn.textContent = selIds.length ? `生成所选 (${selIds.length})` : '生成所选';
  btn.disabled = selIds.length===0;
  const all = $('#selAll');
  if(all){
    all.checked = units.length>0 && selIds.length===units.length;
    all.indeterminate = selIds.length>0 && selIds.length<units.length;
  }
}
function batchGenerate(){
  const units = batchUnitIds();
  const ids = [...state.assetSel].filter(id=> units.includes(id));
  if(!ids.length){ toast('请先勾选要生成的资产'); return; }
  const jobs = ids.map(id=>{
    const hit = findLookById(id);
    return hit ? {owner:hit.a.id, look:id} : {asset:id};
  });
  state.assetSel.clear();
  state.assetBatch = false;
  renderBody();
  jobs.forEach((job,i)=> setTimeout(()=>{
    job.look ? genLook(job.owner, job.look) : genAsset(job.asset);
  }, i*180));
  toast(`已开始批量生成 ${jobs.length} ${state.assetTab==='character'?'套妆造':'个资产'}`);
}
/* ---- 转绘前后对比 ---- */
function openCompare(id, lookId){
  const cat = assetCat(id); if(!cat) return;
  const a = state.assets[cat].find(x=>x.id===id);
  const look = lookId && a.looks ? a.looks.find(l=>l.id===lookId) : null;
  const item = look || a;
  const done = !!(a.pre || state.assetDone[id] || (look ? state.lookDone[look.id] : looksAllDone(a)));
  if(!done){ toast('请先生成该资产的转绘图'); return; }
  const before = assetImage(item, cat, 'orig');
  const after  = assetImage(item, cat, 'new');
  const name = a.name;
  const kind = look ? '角色妆造' : ASSET_LABEL[cat];
  modal(`<div class="compare">
    <div class="player-head"><b>${esc(name)} · 转绘前后对比</b><button onclick="closeModal()">✕</button></div>
    <div class="cmp-pair ${cat==='scene'?'wide':''}">
      <figure><img src="${before}" alt="转绘前"><figcaption>转绘前</figcaption></figure>
      <figure><img src="${after}" alt="转绘后"><figcaption>转绘后</figcaption></figure>
    </div>
    <div class="player-foot">${kind} · ${styleName(state.project.style)} · 左右为转绘前后完整对比</div>
  </div>`);
}
/* ---- 资产表导出 ---- */
function assetTableHTML(){
  const p = state.project;
  const lang = regionLang(p.region);
  const charList = state.assets.character;
  const sceneList = state.assets.scene;
  const propList = state.assets.prop;
  const count = charList.length + sceneList.length + propList.length;
  const lookCount = charList.reduce((n,a)=> n + ((a.looks && a.looks.length) || 0), 0);
  const pairOf = (item, cat, done)=> done
    ? `<div class="pair">
         <figure><img src="${assetImage(item,cat,'orig')}" alt=""><figcaption>转绘前</figcaption></figure>
         <figure><img src="${assetImage(item,cat,'new')}" alt=""><figcaption>转绘后</figcaption></figure>
       </div>`
    : '<span class="pending">待生成</span>';
  const locName = a=>{
    for(const k in SCRIPT_CAST){
      if(SCRIPT_CAST[k].zh === a.name) return SCRIPT_CAST[k][lang] || a.name;
    }
    return a.name;
  };
  const charRows = charList.map(a=>{
    const looks = (a.looks && a.looks.length) ? a.looks : [{ id:a.id, name:'默认造型', prompt:a.prompt, scene:a.scene }];
    const hasLooks = !!(a.looks && a.looks.length);
    const loc = locName(a);
    const sub = loc !== a.name
      ? `${esc(a.name)}${a.role ? ' · ' + esc(a.role) : ''}`
      : (a.role ? esc(a.role) : '');
    const nameCell = `<td rowspan="${looks.length}" class="role-cell"><b>${esc(loc)}</b>${sub?`<div class="cell-sub">${sub}</div>`:''}</td>`;
    return looks.map((lk,i)=>{
      const done = a.pre || state.assetDone[a.id] || (hasLooks && state.lookDone[lk.id]);
      return `<tr>${i===0 ? nameCell : ''}
        <td><b>${esc(lk.name)}</b><div class="cell-sub">妆造 ${i+1}</div></td>
        <td class="prompt">${esc(lk.prompt)}</td>
        <td>${pairOf(lk,'character',done)}</td>
        <td>${done?'已生成':'待生成'}</td>
      </tr>`;
    }).join('');
  }).join('');
  const simpleRows = (list, cat)=> list.map(a=>{
    const done = a.pre || state.assetDone[a.id];
    return `<tr>
      <td><b>${esc(a.name)}</b></td>
      <td class="prompt">${esc(a.prompt)}</td>
      <td>${pairOf(a,cat,done)}</td>
      <td>${done?'已生成':'待生成'}</td>
    </tr>`;
  }).join('');
  const sceneRows = simpleRows(sceneList, 'scene');
  const propRows = simpleRows(propList, 'prop');
  const today = new Date().toLocaleString('zh-CN', {hour12:false});
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(p.title)} · 转绘资产表</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:32px;background:#f5f6fa;color:#1b1d24;font:14px/1.6 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.wrap{max-width:1200px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 36px;box-shadow:0 6px 24px rgba(30,34,70,.08)}
h1{margin:0 0 6px;font-size:22px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 22px}
.meta span{font-size:12px;color:#5a5f6c;background:#f5f6fa;padding:4px 10px;border-radius:7px}
h2{margin:28px 0 10px;font-size:16px;display:flex;align-items:baseline;gap:8px}
h2:first-of-type{margin-top:4px}
h2 .cnt{font-size:12px;color:#9aa0ae;font-weight:400}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th,td{border:1px solid #e9ebf1;padding:10px 12px;text-align:left;vertical-align:top;font-size:13px}
th{background:#f5f6fa;color:#5a5f6c;font-weight:600}
.t-char th:nth-child(1){width:172px}
.t-char th:nth-child(2){width:116px}
.t-char th:nth-child(3){width:30%}
.t-char th:nth-child(4){width:300px}
.t-char th:nth-child(5){width:78px}
.t-scene th:nth-child(1),.t-prop th:nth-child(1){width:130px}
.t-scene th:nth-child(2),.t-prop th:nth-child(2){width:34%}
.t-scene th:nth-child(3),.t-prop th:nth-child(3){width:300px}
.t-scene th:nth-child(4),.t-prop th:nth-child(4){width:78px}
.role-cell b{font-size:14px}
.prompt{color:#5a5f6c;line-height:1.7}
.pair{display:flex;gap:8px}
figure{margin:0;flex:1;min-width:0;text-align:center}
figure img{width:100%;border-radius:8px;display:block;background:#f0f2f7}
figcaption{font-size:11px;color:#9aa0ae;margin-top:4px}
.pending{color:#b9bdc9}
.cell-sub{font-size:11px;color:#9aa0ae;margin-top:2px}
.foot{margin-top:24px;color:#b9bdc9;font-size:12px;text-align:right}
@media print{body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0;padding:0}}
</style></head>
<body><div class="wrap">
  <h1>${esc(p.title)} · 转绘资产表</h1>
  <div class="meta">
    <span>目标地区：${esc(regionLabel(p.region))}</span>
    <span>画风：${esc(styleName(p.style))}</span>
    <span>画幅：${esc(p.ratio)}</span>
    <span>清晰度：${esc(p.reso)}</span>
    <span>资产数：${count}</span>
    <span>角色妆造：${lookCount} 套</span>
    <span>导出时间：${today}</span>
  </div>
  <h2>角色资产 <span class="cnt">${charList.length} 个角色 · ${lookCount} 套妆造</span></h2>
  <table class="t-char">
    <thead><tr><th>转绘后角色名</th><th>妆造名</th><th>转绘提示词</th><th>转绘前后对比</th><th>状态</th></tr></thead>
    <tbody>${charRows}</tbody>
  </table>
  <h2>场景资产 <span class="cnt">${sceneList.length} 个场景</span></h2>
  <table class="t-scene">
    <thead><tr><th>场景名</th><th>转绘提示词</th><th>转绘前后对比</th><th>状态</th></tr></thead>
    <tbody>${sceneRows}</tbody>
  </table>
  <h2>道具资产 <span class="cnt">${propList.length} 个道具</span></h2>
  <table class="t-prop">
    <thead><tr><th>道具名</th><th>转绘提示词</th><th>转绘前后对比</th><th>状态</th></tr></thead>
    <tbody>${propRows}</tbody>
  </table>
  <div class="foot">由百度一镜 · 短剧转绘 Agent 导出</div>
</div></body></html>`;
  return {html, count, lookCount};
}
function exportAssetTable(){
  const {html, count, lookCount} = assetTableHTML();
  const p = state.project;
  const blob = new Blob(['\ufeff' + html], {type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.title}_转绘资产表.html`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
  toast(`已导出资产表（${count} 项资产 · ${lookCount} 套妆造）`);
}
/* ---- 参考图上传 / 放大查看 ---- */
function pickRefImages(cb){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
  inp.onchange = ()=>{
    const files = [...inp.files].filter(f=> f.type.startsWith('image/'));
    inp.remove();
    if(files.length) cb(files);
  };
  document.body.appendChild(inp);
  inp.click();
}
function addRefImages(target, files){
  const room = 6 - (target.refs ? target.refs.length : 0);
  if(room <= 0){ toast('参考图最多 6 张'); return; }
  Promise.all(files.slice(0, room).map(f=> new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=> res(r.result);
    r.onerror = ()=> res(null);
    r.readAsDataURL(f);
  }))).then(list=>{
    const added = list.filter(Boolean);
    target.refs = (target.refs || []).concat(added);
    renderBody();
    toast(`已添加 ${added.length} 张参考图`);
  });
}
function openImageZoom(src, caption){
  modal(`<div class="imgzoom">
    <div class="player-head"><b>${esc(caption || '参考图')}</b><button onclick="closeModal()">✕</button></div>
    <div class="imgzoom-body"><img src="${esc(src)}" alt="${esc(caption || '参考图')}"></div>
    <div class="player-foot">点击遮罩或右上角关闭</div>
  </div>`);
}
function bindAsset(){
  $$('.subtabs button[data-k]').forEach(b=> b.onclick=()=>{ state.assetTab=b.dataset.k; renderBody(); });
  $$('.aprompt').forEach(t=> t.onchange=()=>{
    const a = state.assets[state.assetTab].find(x=>x.id===t.dataset.id); if(a) a.prompt=t.value;
  });
  $$('button[data-gen]').forEach(b=> b.onclick=()=> genAsset(b.dataset.gen));
  $$('button[data-ref]').forEach(b=> b.onclick=()=>{
    const cat = assetCat(b.dataset.ref); if(!cat) return;
    const a = state.assets[cat].find(x=>x.id===b.dataset.ref); if(!a) return;
    const lk = b.dataset.lookRef && a.looks ? a.looks.find(l=>l.id===b.dataset.lookRef) : null;
    pickRefImages(files=> addRefImages(lk || a, files));
  });
  $$('[data-cmp-look]').forEach(b=> b.onclick=()=> openCompare(b.dataset.owner, b.dataset.cmpLook));
  $$('[data-gen-look]').forEach(b=> b.onclick=()=> genLook(b.dataset.owner, b.dataset.genLook));
  $$('.look-prompt').forEach(t=> t.onchange=()=>{
    const owner = state.assets.character.find(x=>x.id===t.dataset.owner);
    const lk = owner && owner.looks && owner.looks.find(l=>l.id===t.dataset.look);
    if(lk) lk.prompt = t.value;
  });
  $$('.look-refs img').forEach(img=>{
    img.onclick = e=>{ e.stopPropagation(); openImageZoom(img.src, '参考图'); };
  });
  $$('.aimg-chk').forEach(l=> l.onclick = e=> e.stopPropagation());
  $$('.achk').forEach(c=> c.onchange = ()=>{
    c.checked ? state.assetSel.add(c.dataset.sel) : state.assetSel.delete(c.dataset.sel);
    updateBatchBtn();
  });
  $$('.arow .aimg img').forEach(img=>{
    img.parentElement.onclick = ()=> openCompare(img.closest('.arow').dataset.id);
  });
  const selAll = $('#selAll');
  if(selAll) selAll.onchange = e=>{
    const units = batchUnitIds();
    if(e.target.checked) units.forEach(id=> state.assetSel.add(id));
    else                 units.forEach(id=> state.assetSel.delete(id));
    renderBody();
  };
  const start = $('#batchStart');
  if(start) start.onclick = ()=>{
    state.assetBatch = true;
    state.assetSel.clear();
    renderBody();
    toast('勾选要批量生成的资产');
  };
  const cancel = $('#cancelBatch');
  if(cancel) cancel.onclick = ()=>{
    state.assetBatch = false;
    state.assetSel.clear();
    renderBody();
  };
  $('#exportAssets').onclick = exportAssetTable;
  const genAll = $('#genAll');
  if(genAll) genAll.onclick = batchGenerate;
  updateBatchBtn();
}

/* ---- 分镜转绘 ---- */
function segHTML(seg){
  return seg.map(s=> s.t ? esc(s.t)
    : `<span class="ref ref-${s.ref[0]}">@${esc(s.ref[1])}</span>`).join('');
}
function shotHTML(){
  const sh = state.shots[state.activeShot] || state.shots[0];
  const gen  = state.generating.has(sh.id);
  const frame = gen ? '' : sh.done
    ? drawScene(sh.scene,'new',state.project.style)
    : shotPlaceholderSVG();
  const main = gen
    ? `<div class="sb-view skeleton"><span class="spin"></span></div>`
    : sh.done
      ? `<img class="sb-bg" src="${frame}" alt="">
         <div class="sb-view"><img src="${frame}" alt=""><span class="sb-tag new">转绘后</span>
           <button class="sb-cmp" data-cmp-shot="${state.activeShot}" title="查看原片与转绘效果对比">对比</button>
         </div>`
      : `<div class="sb-view"><img src="${frame}" alt="待转绘占位图"></div>`;
  const ep = state.episodes[state.activeEp];
  const doneCount = state.shots.filter(s=>s.done).length;
  const strip = state.shots.map((s,i)=>{
    const d = s.done; const g=state.generating.has(s.id);
    const sel = state.shotSel.has(i);
    const img = d ? drawScene(s.scene,'new',state.project.style) : shotPlaceholderSVG();
    const chk = state.shotBatch
      ? `<label class="shotc-chk" title="勾选后可批量转绘"><input type="checkbox" class="shchk" data-sel="${i}" ${sel?'checked':''}></label>`
      : '';
    return `<div class="shotc ${i===state.activeShot?'on':''} ${d?'done':'ph'} ${sel?'sel':''}" data-i="${i}">
      <img src="${img}" alt="${d?'转绘后':'待转绘占位图'}">${g?'<span class="spin sm"></span>':''}${chk}
      <span class="shotc-no">${i+1}</span>${d?'':'<span class="shotc-wait">待转绘</span>'}<span class="shotc-dur">${s.dur}</span>
    </div>`;
  }).join('');
  const status = gen ? '生成中' : sh.done ? '已转绘' : '待转绘';
  const seqTools = state.shotBatch
    ? `<label class="selall"><input type="checkbox" id="shotSelAll">全选</label>
       <button class="aghost" id="shotBatchCancel">取消</button>
       <button class="aprimary" id="shotBatchGo">转绘所选 (${state.shotSel.size})</button>`
    : `<button class="aprimary" id="shotBatchStart">批量转绘</button>`;
  return `
    <div class="sb-seq">
      <div class="sb-seq-head">
        <div class="sb-seq-title">
          <b>分镜序列</b>
          <span class="sb-seq-sub">第 ${ep.no} 集 · ${esc(ep.title)}　|　共 ${state.shots.length} 个分镜 · 已转绘 ${doneCount}/${state.shots.length}</span>
        </div>
        <div class="sb-seq-tools">${seqTools}</div>
      </div>
      ${state.shotBatch?'<div class="batch-hint">已进入批量选择：点击分镜缩略图勾选多个片段，再点「转绘所选」</div>':''}
      <div class="filmstrip" id="strip">${strip}</div>
    </div>
    <div class="sb-split">
      <section class="sb-pane sb-prompt">
        <div class="sb-pane-head">
          <b>分镜提示词</b>
          <span class="sb-pane-sub">分镜 ${state.activeShot+1}/${state.shots.length}</span>
        </div>
        <div class="sb-prompt-box">
          <div class="sb-desc">${segHTML(sh.seg)}</div>
          <div class="sb-prompt-foot">
            <button class="aprimary" id="genShot">开始转绘</button>
          </div>
        </div>
      </section>
      <section class="sb-pane sb-video">
        <div class="sb-pane-head">
          <b>分镜视频</b>
          <span class="sb-state ${sh.done?'ok':''}">${status}</span>
        </div>
        <div class="sb-player">${main}</div>
        <div class="sb-video-foot">
          <span>时长 ${sh.dur}</span>
          <span>${esc(styleName(state.project.style))}</span>
          <span>${esc(state.project.ratio)} · ${esc(state.project.reso)}</span>
        </div>
      </section>
    </div>`;
}
function genShot(i){
  const sh = state.shots[i]; if(!sh || state.generating.has(sh.id)) return;
  state.generating.add(sh.id); renderBody();
  setTimeout(()=>{ state.generating.delete(sh.id); sh.done=true; renderBody(); toast('分镜已转绘'); }, 900);
}
function openShotCompare(i){
  const sh = state.shots[i];
  if(!sh || !sh.done){ toast('请先完成该分镜的转绘'); return; }
  const before = drawScene(sh.scene,'orig');
  const after  = drawScene(sh.scene,'new',state.project.style);
  modal(`<div class="compare">
    <div class="player-head"><b>分镜 ${i+1} · 视频效果对比</b><button onclick="closeModal()">✕</button></div>
    <div class="cmp-pair wide">
      <figure><div class="cmp-video"><img src="${before}" alt="原片"><span class="cmp-play">▶</span></div><figcaption>原片</figcaption></figure>
      <figure><div class="cmp-video"><img src="${after}" alt="转绘后"><span class="cmp-play">▶</span></div><figcaption>转绘后</figcaption></figure>
    </div>
    <div class="player-foot">分镜 ${i+1} · ${esc(sh.dur)} · ${esc(styleName(state.project.style))} · 左右为原片与转绘后视频效果对比</div>
  </div>`);
}
function openExportDialog(){
  const ep = state.episodes[state.activeEp];
  const done = state.shots.filter(s=>s.done).length;
  const total = state.shots.length;
  const pend = total - done;
  const reso = state.project.reso === '1080P' ? '1080p' : '720p';
  modal(`<div class="export-dlg">
    <div class="player-head"><b>导出视频</b><button onclick="closeModal()">✕</button></div>
    <div class="exp-body">
      <div class="exp-group">
        <div class="exp-label">分辨率</div>
        <div class="exp-seg">
          <label><input type="radio" name="expReso" value="720p" ${reso==='720p'?'checked':''}>720p</label>
          <label><input type="radio" name="expReso" value="1080p" ${reso==='1080p'?'checked':''}>1080p</label>
        </div>
      </div>
      <div class="exp-group">
        <div class="exp-label">导出视频格式</div>
        <label class="exp-card">
          <input type="radio" name="expFmt" value="film" checked>
          <span class="exp-main"><b>成片（分集视频文件）</b><small>按集导出完整视频，共 ${state.episodes.length} 个视频文件</small></span>
        </label>
        <label class="exp-card">
          <input type="radio" name="expFmt" value="clip">
          <span class="exp-main"><b>分镜视频片段（多个分镜视频文件）</b><small>当前第 ${ep.no} 集 · ${done} 个已完成分镜，每个分镜导出为独立视频${pend?`；${pend} 个未完成分镜不导出`:''}</small></span>
        </label>
      </div>
      <div class="exp-note">${pend?`当前第 ${ep.no} 集仍有 ${pend} 个分镜未完成转绘。`:'当前集分镜已全部转绘完成。'}</div>
    </div>
    <div class="exp-foot">
      <button class="aghost" onclick="closeModal()">取消</button>
      <button class="aprimary" id="expStart">开始导出</button>
    </div>
  </div>`);
  $('#expStart').onclick = ()=>{
    const r = document.querySelector('input[name="expReso"]:checked')?.value || '720p';
    const fmt = document.querySelector('input[name="expFmt"]:checked')?.value || 'film';
    if(fmt==='clip' && done===0){ toast('当前没有已完成转绘的分镜'); return; }
    const label = fmt==='film' ? '分集成片' : '分镜视频片段';
    const count = fmt==='film' ? state.episodes.length : done;
    closeModal();
    toast(`已开始导出 ${count} 个${label}（${r}）`);
    setTimeout(()=> toast(`导出完成：${count} 个${label} · ${r}`), 1100);
  };
}
function bindShot(){
  $$('#strip .shotc').forEach(el=> el.onclick=()=>{
    const i = +el.dataset.i;
    if(state.shotBatch){
      state.shotSel.has(i) ? state.shotSel.delete(i) : state.shotSel.add(i);
      renderBody();
      return;
    }
    state.activeShot=i; renderBody();
  });
  $$('.shotc-chk').forEach(l=> l.onclick = e=> e.stopPropagation());
  $$('.shchk').forEach(c=> c.onchange = ()=>{
    const i = +c.dataset.sel;
    c.checked ? state.shotSel.add(i) : state.shotSel.delete(i);
    renderBody();
  });
  $$('.sb-cmp').forEach(btn=> btn.onclick = e=>{
    e.stopPropagation();
    openShotCompare(+btn.dataset.cmpShot);
  });
  $('#genShot').onclick = ()=> genShot(state.activeShot);
  const batchStart = $('#shotBatchStart');
  if(batchStart) batchStart.onclick = ()=>{ state.shotBatch=true; state.shotSel.clear(); renderBody(); };
  const batchCancel = $('#shotBatchCancel');
  if(batchCancel) batchCancel.onclick = ()=>{ state.shotBatch=false; state.shotSel.clear(); renderBody(); };
  const selAll = $('#shotSelAll');
  if(selAll){
    selAll.checked = state.shotSel.size === state.shots.length;
    selAll.indeterminate = state.shotSel.size > 0 && !selAll.checked;
    selAll.onchange = ()=>{
      if(selAll.checked) state.shots.forEach((_,i)=> state.shotSel.add(i));
      else state.shotSel.clear();
      renderBody();
    };
  }
  const batchGo = $('#shotBatchGo');
  if(batchGo) batchGo.onclick = ()=>{
    const ids = [...state.shotSel].sort((a,b)=>a-b);
    if(!ids.length){ toast('请先勾选要转绘的分镜'); return; }
    state.shotBatch = false; state.shotSel.clear();
    renderBody();
    ids.forEach((i,k)=> setTimeout(()=> genShot(i), k*220));
    toast(`已开始批量转绘 ${ids.length} 个分镜`);
  };
}

/* ---- 合成成片 ---- */
function filmHTML(){
  const done = state.shots.filter(s=>s.done).length;
  const all  = state.shots.length;
  const ready = done===all;
  const strip = state.shots.map((s,i)=>{
    const img = s.done ? drawScene(s.scene,'new',state.project.style) : drawScene(s.scene,'orig');
    return `<div class="shotc ${s.done?'done':''}"><img src="${img}" alt=""><span class="shotc-no">${i+1}</span></div>`;
  }).join('');
  const cover = state.shots.find(s=>s.done) || state.shots[0];
  return `
    <div class="film-main">
      <div class="frame big"><img src="${drawScene(cover.scene,'new',state.project.style)}" alt=""><span class="frame-play">▶</span></div>
      <div class="film-info">
        <h3>${esc(state.project.title)}</h3>
        <p>${styleName(state.project.style)} · ${state.project.ratio} · ${state.project.reso} · ${state.project.modelVideo}</p>
        <div class="film-prog"><div class="bar"><i style="width:${Math.round(done/all*100)}%"></i></div><span>${done}/${all} 分镜已转绘</span></div>
        <button class="tb-primary ${ready?'':'off'}" id="doExport">${ready?'导出合成成片':'请先完成全部分镜转绘'}</button>
      </div>
    </div>
    <div class="filmstrip-head">成片分镜</div>
    <div class="filmstrip">${strip}</div>`;
}
function bindFilm(){
  const b = $('#doExport'); if(!b) return;
  b.onclick = ()=>{
    if(b.classList.contains('off')){ toast('还有分镜未转绘'); return; }
    toast('正在合成成片…');
    setTimeout(()=> modal(`<div class="player">
      <div class="player-head"><b>${esc(state.project.title)} · 成片</b><button onclick="closeModal()">✕</button></div>
      <div class="frame"><img src="${drawScene(state.shots[0].scene,'new',state.project.style)}" alt=""><span class="frame-play">▶</span></div>
      <div class="player-foot">合成完成 · ${state.project.ratio} · ${state.project.reso}（Demo 占位）</div>
    </div>`), 900);
  };
}

/* ---- 启动 ---- */
render();
