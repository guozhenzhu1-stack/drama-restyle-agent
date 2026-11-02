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
  const isFilm = L.toggle === 'film';
  const isRestyle = L.toggle === 'restyle';
  $('#main').innerHTML = `
  <div class="landing">
    <div class="hero">
      <div class="hero-deco film">${ICON.film}</div>
      <div class="hero-deco clap">${ICON.clap}</div>
      <h1 class="hero-title">让 Agent 开启你
        <span class="seg hero-seg">
          <button data-t="film" class="${L.toggle==='film'?'on':''}">成片</button>
          <button data-t="restyle" class="${L.toggle==='restyle'?'on':''}">转绘</button>
          <button data-t="script" class="${L.toggle==='script'?'on':''}">剧本</button>
        </span>
        的创作之路</h1>
      <div class="entry-card">
        <div class="entry-body">
          <div class="dropzone" id="drop">
            <div class="dz-ico">${ICON.upload}</div>
            <div class="dz-title">${isRestyle?'上传视频':'上传剧本'}</div>
            <div class="dz-sub">${isRestyle?'支持上传 mp4 格式，单个大小不超过 100M，最多上传 100 个视频':'支持上传 txt / docx / pdf 文件'}</div>
          </div>
          ${isRestyle?`
          <div class="pan-import">
            <div class="pan-row">
              <span class="pan-ico">☁</span>
              <input class="pan-link" id="panLink" value="${esc(L.panLink)}" placeholder="粘贴百度网盘文件夹链接（链接里带提取码也可）">
              <input class="pan-code" id="panCode" maxlength="8" value="${esc(L.panCode)}" placeholder="提取码">
              <button class="pan-btn" id="panImport" ${L.panLoading?'disabled':''}>${L.panLoading?'正在拉取视频…':'从网盘导入视频'}</button>
            </div>
            <div class="pan-hint">Agent 会自动拉取该文件夹内的全部视频文件，并加入「原片管理」</div>
          </div>`:''}
          <textarea class="q-input" id="q" placeholder="输入你的改编想法…">${esc(L.query)}</textarea>
          ${isFilm?'':`<div class="entry-toolbar">
            <div class="tool" id="tStyle"><span class="ti">${ICON.wand}</span>${styleName(L.style)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRegion"><span class="ti">${ICON.wand}</span>${esc(L.region)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRatio"><span class="ti">${ICON.monitor}</span><span class="sub" data-r="ratio" title="选择画幅比例">${L.ratio}<span class="chev">⌄</span></span><i class="tsep">|</i><span class="sub" data-r="reso" title="选择分辨率">${L.reso}<span class="chev">⌄</span></span></div>
            <button class="send-btn" id="go">${ICON.send}</button>
          </div>`}
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
  $$('.hero-seg button').forEach(b=> b.onclick=e=>{
    e.stopPropagation();
    L.toggle = b.dataset.t;
    L.tab = L.toggle==='script' ? 'script' : 'restyle';
    renderLanding();
  });
  const tStyle = $('#tStyle');
  if(tStyle){
    tStyle.onclick = e=> openMenu(e.currentTarget, STYLES.map(s=>s.name), (_,i)=>{ L.style=STYLES[i].key; renderLanding(); });
    $('#tRegion').onclick= e=> openMenu(e.currentTarget, REGIONS, v=>{ L.region=v; renderLanding(); });
    $('#tRatio').onclick = e=>{
      const t = e.target.closest('[data-r]');
      const anchor = t || e.currentTarget;
      if(t && t.dataset.r==='reso') openMenu(anchor, RESOS, v=>{ L.reso=v; renderLanding(); });
      else openMenu(anchor, RATIOS, v=>{ L.ratio=v; renderLanding(); });
    };
  }
  $('#q').oninput = e=> L.query = e.target.value;
  $('#drop').onclick = startProject;
  const go = $('#go');
  if(go) go.onclick = startProject;
  const panBtn = $('#panImport');
  if(panBtn){
    const panLink = $('#panLink'), panCode = $('#panCode');
    panLink.oninput = e=>{
      L.panLink = e.target.value;
      const code = panCodeFromText(L.panLink);
      if(code){ L.panCode = code; panCode.value = code; }
    };
    panCode.oninput = e=> L.panCode = e.target.value;
    panBtn.onclick = importFromPan;
  }
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
  if(state.landing.panLoading) return;
  state.clips = CLIPS.map(x=>({...x}));
  state.clipSource = 'demo';
  enterProject();
  toast('已创建项目：'+state.project.title);
}
/* 入口配置带入项目 */
function enterProject(){
  const L = state.landing;
  state.project.style = L.style; // 入口风格带入项目
  state.project.modelVideo = L.modelVideo; state.project.modelImage = L.modelImage;
  state.project.ratio = L.ratio; state.project.reso = L.reso; state.project.region = L.region;
  state.screen='project'; state.stage='clips';
  render();
}
/* ---- 百度网盘文件夹导入（Demo 模拟拉取） ---- */
const PAN_CLIPS = [
  { name:'EP01_她死在那个雨夜.mp4', dur:'02:18', scene:SC.bedroom },
  { name:'EP02_回到两年前.mp4',     dur:'02:24', scene:SC.hall },
  { name:'EP03_离婚不是开玩笑.mp4', dur:'02:09', scene:SC.city },
  { name:'EP04_闺蜜的眼泪.mp4',     dur:'02:31', scene:SC.corridor },
  { name:'EP05_收回属于我的股份.mp4', dur:'02:12', scene:SC.snowHall },
];
/* 从粘贴内容中识别提取码：支持 pwd=xxxx、提取码：xxxx */
function panCodeFromText(text){
  const s = String(text||'');
  const m = s.match(/[?&]pwd=([A-Za-z0-9]{4,8})/i)
         || s.match(/(?:提取码|pwd)\s*[:：=]?\s*([A-Za-z0-9]{4,8})/i);
  return m ? m[1] : '';
}
function importFromPan(){
  const L = state.landing;
  if(L.panLoading) return;
  const link = (L.panLink||'').trim();
  if(!link){ toast('请先粘贴百度网盘文件夹链接'); return; }
  if(!/(?:pan|yun)\.baidu\.com\//i.test(link)){ toast('请粘贴有效的百度网盘链接'); return; }
  if(!(L.panCode||'').trim()){ toast('请输入提取码'); return; }
  L.panLoading = true;
  renderLanding();
  /* Demo 环境为模拟拉取，不真实访问网盘 */
  setTimeout(()=>{
    L.panLoading = false;
    L.panLink = ''; L.panCode = '';
    state.clips = PAN_CLIPS.map((c,i)=>({ ...c, id:'pan'+Date.now()+i, from:'pan' }));
    state.clipSource = 'pan';
    enterProject();
    toast(`已从百度网盘拉取 ${state.clips.length} 个视频`);
  }, 1400);
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
  if(state.stage==='clips'){
    const n = state.clips.length;
    const fromPan = state.clipSource === 'pan';
    return [
      {who:'a', html: n
        ? (fromPan
            ? `已从百度网盘文件夹拉取 <b>${n} 个视频</b>，并加入原片管理。`
            : `已为你导入 <b>${n} 集</b>短剧原片，可在右侧拖拽排序、预览或继续上传。`)
        : '暂未导入原片，请上传视频或从百度网盘导入。'},
      {who:'a', html:'确认原片无误后，我会先解析剧情，并按目标地区完成剧本本土化。', action:'开始剧本本土化', go:'script'},
    ];
  }
  if(state.stage==='script'){
    const lang = regionLang(state.project.region), L = SCRIPT_LANGS[lang];
    const n = state.epScripts.length;
    const isZh = lang === 'zh';
    if(state.scriptSource && !state.scriptSource.demo){
      return [
        {who:'a', html:`已读取上传剧本 <b>${esc(state.scriptSource.name)}</b>，自动拆分为 <b>${n} 集</b>，并完成场次与对白结构识别。`},
        {who:'a', html:`右侧为上传稿原文，可逐集查看，也支持整本下载。请确认该稿为<b>修改完成后、与本剧视频逐集匹配</b>的版本；如需按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 继续改写，可在对话中调整。`, action:'确认剧本，提炼资产', go:'asset'},
      ];
    }
    return [
      {who:'a', html:isZh
        ? `已完成全剧 <b>${n} 集</b>的剧情解析，并按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 校对中文原生稿。`
        : `已完成全剧 <b>${n} 集</b>的剧情解析，并按目标地区 <b>${esc(regionLabel(state.project.region))}</b> 完成剧本本土化。`},
      {who:'a', html:isZh
        ? `人名、称谓与单集节奏均已校对，交付稿为 <b>中文原生剧本</b>。右侧可逐集查看，也支持整本下载。`
        : `人名、称谓、俚语与单集节奏均已适配；交付稿<b>非台词部分（场次、动作、人名等）统一使用中文，仅台词使用${esc(L.name)}</b>。右侧可逐集查看，也支持整本下载。`, action:'确认剧本，提炼资产', go:'asset'},
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
      <div class="clip-thumb"><img src="${img}" alt="">${c.from==='pan'?'<span class="clip-src">☁ 网盘</span>':''}<span class="clip-play">▶</span><span class="clip-dur">${c.dur}</span></div>
      <div class="clip-meta">
        <div class="clip-label"><b>第 ${i+1} 集</b><span class="clip-name" title="${esc(c.name)}">${esc(c.name)}</span></div>
        <button class="clip-del" data-i="${i}">✕</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="mgr">
    <div class="mgr-head">
      <div>原片管理 <em>${state.clips.length} ${state.clipSource==='pan'?'个视频':'集'}</em></div>
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
    el.ondragstart = ()=>{ dragI = +el.dataset.i; el.classList.add('dragging'); };
    el.ondragend   = ()=> el.classList.remove('dragging');
    el.ondragover  = e=> e.preventDefault();
    el.ondrop = e=>{ e.preventDefault(); const to=+el.dataset.i;
      if(dragI===null||dragI===to) return;
      const [m]=state.clips.splice(dragI,1); state.clips.splice(to,0,m); dragI=null; renderBody();
      toast(`已调整为第 ${to+1} 集`);
    };
  });
  $$('#clipGrid .clip-del').forEach(b=> b.onclick=e=>{ e.stopPropagation();
    state.clips.splice(+b.dataset.i,1); renderBody(); toast('已删除'); });
  $('#addClip').onclick = ()=>{
    const n = state.clips.length+1;
    state.clips.push({ id:'c'+Date.now(), name:`EP${String(n).padStart(2,'0')}_新上传原片.mp4`, dur:'00:05', scene:SC.bedroom });
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
  const items = eps.map((e,i)=>{
    return `<a class="toc-item ${i===state.scriptEp?'on':''}" data-i="${i}" title="${esc(e.title)}">
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
  const sec = ep.scenes.length * 24;
  const dur = `${Math.floor(sec/60)}'${String(sec%60).padStart(2,'0')}"`;
  /* 剧本语言规则：非台词（场次/动作/人名/标题）固定中文，仅台词使用目标语言 */
  const scenes = ep.scenes.map((sc,i)=>{
    const actionZh = (sc.actionZh && sc.actionZh[lang]) || sc.action.zh;
    return `
    <div class="sc-block">
      <div class="sc-head"><span class="sc-num">场 ${i+1}</span>
        <span class="sc-head-txt">${esc(sc.head.zh)}</span>
      </div>
      <p class="sc-action">${esc(actionZh)}</p>
      ${sc.lines.map(l=>{
        const c = SCRIPT_CAST[l.who];
        const zhName = (c.zhOf && c.zhOf[lang]) || c.zh;
        return `<div class="sc-line">
          <div class="sc-who">${esc(zhName)}<small>${esc(c.role)}</small></div>
          <p class="sc-text">${esc(l.t[lang])}</p>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
  return `<section class="script-ep" id="script-ep-${idx}" data-ep="${idx}">
    <div class="ep-kicker">第 ${String(ep.no).padStart(2,'0')} 集</div>
    <h2 class="ep-h">${esc(ep.title)}</h2>
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
    <div class="ep-kicker">第 ${String(ep.no).padStart(2,'0')} 集 · 上传稿原文</div>
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
        <span class="lang-chip">${demo?`台词 ${L.name} · 非台词中文`:'上传稿 · 原文'}</span>
        <span class="adapt-region">${esc(regionLabel(state.project.region))}</span>
      </div>
      <div class="script-head-r">
        <input type="file" id="scriptFile" accept=".txt,.md,.markdown" hidden>
        <button class="aghost" id="uploadScript" title="请上传修改完成、且与本剧原片逐集匹配的剧本">⬆ 上传本剧修改后剧本</button>
        <button class="tb-primary" id="dlBook">⬇ 下载整本剧本</button>
      </div>
    </div>
    <div class="script-src ${demo?'is-demo':'is-upload'}">
      <span class="src-file">📄 ${esc(src.name)}</span>
      <span class="src-meta">${eps.length} 集${src.at?' · '+esc(src.at)+' 上传':' · 内置示例'}</span>
      ${demo
        ? '<span class="src-hint">请上传<b>已修改</b>、且与本剧视频<b>逐集匹配</b>的剧本（.txt / .md），用于替换示例稿</span>'
        : '<button class="src-restore" id="restoreScript">恢复示例剧本</button>'}
    </div>
    <div class="script-scroll" id="scriptScroll">
      <div class="script-doc">
        <div class="doc-cover">
          <div class="doc-kicker">${demo?`剧本定稿 · 台词 ${esc(L.name)} · 非台词中文`:'上传稿 · 原文展示'}</div>
          <h1 class="doc-cover-title">${esc(state.project.title)}</h1>
          <div class="doc-sub">全 ${eps.length} 集 · ${demo
            ? `目标地区 ${esc(regionLabel(state.project.region))} · 台词使用${esc(L.name)}，场景、动作、人名等非台词内容保持中文`
            : '上传剧本 · 原文展示'}</div>
          <div class="adapt-chips">${(demo
            ? (isZh ? ADAPT_TIPS.zh : [`台词 ${L.name}`, '非台词中文', '人名中译', '单集节奏'])
            : ['原文保留','自动分集','整本导出']).map(t=>`<span>${t}</span>`).join('')}</div>
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

  $('#dlBook').onclick = e=>{
    const lang = regionLang(state.project.region);
    const src = state.scriptSource || { demo:true };
    if(!src.demo || lang==='zh'){ downloadScript(false,'target'); return; }
    const L = SCRIPT_LANGS[lang];
    openMenu(e.currentTarget, [`中文 + ${L.name}（非台词中文）`, `纯${L.name}剧本`], (_,i)=>
      downloadScript(false, i===0 ? 'mixed' : 'target'));
  };
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
function downloadScript(one, mode){
  const lang = regionLang(state.project.region);
  const L = SCRIPT_LANGS[lang];
  const isZh = lang === 'zh';
  const pure = mode === 'target' && !isZh;   // 纯目标语言：非台词也使用目标语言
  const src = state.scriptSource || { demo:true };
  const eps = one ? [state.epScripts[state.scriptEp]] : state.epScripts;
  const rule = '='.repeat(44);
  const body = eps.map(ep=>{
    if(ep.raw) return `第 ${ep.no} 集　${ep.title}\n${'-'.repeat(36)}\n\n${ep.raw}`;
    if(pure){
      const pad2 = n=> String(n).padStart(2,'0');
      const epTag = {
        en: `EP ${pad2(ep.no)}`, ja: `第 ${pad2(ep.no)} 話`,
        ko: `제 ${pad2(ep.no)} 화`, es: `EP ${pad2(ep.no)}`,
      }[lang];
      const scTag = i => ({
        en: `SC ${pad2(i+1)}`, ja: `第 ${pad2(i+1)} 場`,
        ko: `제 ${pad2(i+1)} 장`, es: `ESC ${pad2(i+1)}`,
      })[lang];
      const sep = lang === 'ja' ? '：' : ': ';
      const headLine = `${epTag}　${epTitleI18n(ep, lang)}`;
      const scenes = ep.scenes.map((sc,i)=>[
        `${scTag(i)}　${sc.head[lang]}`,
        '',
        sc.action[lang],
        '',
        sc.lines.map(l=>{
          const c = SCRIPT_CAST[l.who];
          return `${c[lang]}${sep}${l.t[lang]}`;
        }).join('\n\n'),
      ].join('\n')).join('\n\n');
      return `${headLine}\n${'-'.repeat(36)}\n\n${scenes}`;
    }
    const headLine = `第 ${ep.no} 集　${ep.title}`;
    /* 混合格式：非台词中文，台词使用目标语言 */
    const scenes = ep.scenes.map((sc,i)=>[
      `第 ${i+1} 场　${sc.head.zh}`,
      '',
      (sc.actionZh && sc.actionZh[lang]) || sc.action.zh,
      '',
      sc.lines.map(l=>{
        const c = SCRIPT_CAST[l.who];
        const zhName = (c.zhOf && c.zhOf[lang]) || c.zh;
        return `${zhName}：${l.t[lang]}`;
      }).join('\n\n'),
    ].join('\n')).join('\n\n');
    return `${headLine}\n${'-'.repeat(36)}\n\n${scenes}`;
  }).join('\n\n\n');
  const scriptLabel = src.demo
    ? (pure ? ({
        en: `SCREENPLAY · ${L.name}`,
        ja: `脚本 · ${L.name}`,
        ko: `시나리오 · ${L.name}`,
        es: `GUION · ${L.name}`,
      })[lang]
            : isZh ? '剧本（中文 · 原生稿）'
                   : `剧本（台词 ${L.name} · 非台词中文）`)
    : `剧本原文（上传稿：${src.name}）`;
  const dispTitle = pure ? projectTitleI18n(state.project.title, lang) : state.project.title;
  const dateLoc = pure ? ({ en:'en-US', ja:'ja-JP', ko:'ko-KR', es:'es-ES' }[lang] || 'zh-CN') : 'zh-CN';
  const dateStr = new Date().toLocaleDateString(dateLoc);
  let metaLine, footer;
  if(pure){
    const region = regionI18n(state.project.region, lang);
    const n = eps.length;
    metaLine = {
      en: `TARGET REGION: ${region}  |  ${n} EPISODES  |  ${dateStr}`,
      ja: `対象地域：${region}　|　全 ${n} 話　|　${dateStr}`,
      ko: `타깃 지역: ${region}  |  총 ${n}화  |  ${dateStr}`,
      es: `REGIÓN OBJETIVO: ${region}  |  ${n} EPISODIOS  |  ${dateStr}`,
    }[lang];
    footer = {
      en: 'Generated by Baidu Yijing · Short Drama Restyle Agent',
      ja: 'Baidu Yijing · ショートドラマ転写エージェント 生成',
      ko: 'Baidu Yijing · 숏드라마 리스타일 에이전트 생성',
      es: 'Generado por Baidu Yijing · Agente de Restilización de Series Cortas',
    }[lang];
  }else{
    metaLine = `目标地区：${regionLabel(state.project.region)}　|　共 ${eps.length} 集　|　${dateStr}`;
    footer = '百度一镜 · 短剧转绘 Agent 生成';
  }
  const meta = `${dispTitle}　${scriptLabel}\n${metaLine}\n${rule}\n\n`;
  const text = meta + body + `\n\n${rule}\n${footer}`;
  const blob = new Blob(['\ufeff' + text], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = src.demo
    ? (pure ? `${dispTitle}_${L.name}_剧本.txt`
            : isZh ? `${state.project.title}_中文剧本.txt`
                   : `${state.project.title}_${L.name}台词_中文调度_剧本.txt`)
    : `${state.project.title}_上传稿_剧本.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
  const kind = src.demo ? (pure ? `纯${L.name}` : isZh ? '中文' : `${L.name}台词·中文调度`) : '上传稿';
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
       <button class="aghost" id="exportAssets">⬇ 导出 Excel 资产表</button>
       <button class="aprimary" id="genAll">生成所选</button>`
    : `<button class="aghost" id="exportAssets">⬇ 导出 Excel 资产表</button>
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
/* ---- 资产表导出（Excel） ---- */
const XLSX_CRC_TABLE = (()=>{
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c = n;
    for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function xlsxCrc32(u8){
  let c = 0xFFFFFFFF;
  for(let i=0;i<u8.length;i++) c = XLSX_CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
/* 纯前端生成 .xlsx：ZIP(store) + OOXML，无需第三方库 */
function xlsxZip(files){
  const enc = new TextEncoder();
  const chunks = [], central = [];
  let offset = 0;
  const d = new Date();
  const dosTime = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(([name, content])=>{
    const nameU8 = enc.encode(name);
    const dataU8 = enc.encode(content);
    const crc = xlsxCrc32(dataU8);
    const lh = new Uint8Array(30 + nameU8.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);      // UTF-8 文件名
    lv.setUint16(8, 0, true);           // store
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataU8.length, true);
    lv.setUint32(22, dataU8.length, true);
    lv.setUint16(26, nameU8.length, true);
    lv.setUint16(28, 0, true);
    lh.set(nameU8, 30);
    chunks.push(lh, dataU8);

    const ch = new Uint8Array(46 + nameU8.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataU8.length, true);
    cv.setUint32(24, dataU8.length, true);
    cv.setUint16(28, nameU8.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    ch.set(nameU8, 46);
    central.push(ch);
    offset += lh.length + dataU8.length;
  });
  const cdSize = central.reduce((n,c)=> n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  return [...chunks, ...central, end];
}
function xlsxEsc(v){
  return String(v==null?'':v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function xlsxCol(n){
  let s = '';
  for(n++; n>0; n = Math.floor((n-1)/26)) s = String.fromCharCode(65 + ((n-1)%26)) + s;
  return s;
}
function xlsxSheet(rows, widths){
  const cols = widths && widths.length
    ? `<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const body = rows.map((row,ri)=>`<row r="${ri+1}">${row.map((cell,ci)=>{
    const ref = xlsxCol(ci) + (ri+1);
    const style = ri === 0 ? 1 : 2;
    if(cell === null || cell === undefined || cell === '') return `<c r="${ref}" s="${style}"/>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xlsxEsc(cell)}</t></is></c>`;
  }).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${body}</sheetData></worksheet>`;
}
function buildAssetXlsx(){
  const p = state.project;
  const lang = regionLang(p.region);
  const charList = state.assets.character;
  const sceneList = state.assets.scene;
  const propList = state.assets.prop;
  const count = charList.length + sceneList.length + propList.length;
  const lookCount = charList.reduce((n,a)=> n + ((a.looks && a.looks.length) || 0), 0);
  const today = new Date().toLocaleString('zh-CN', {hour12:false});
  const locName = a=>{
    for(const k in SCRIPT_CAST){
      if(SCRIPT_CAST[k].zh === a.name) return SCRIPT_CAST[k][lang] || a.name;
    }
    return a.name;
  };

  const infoRows = [
    ['项目信息', '内容'],
    ['项目名称', p.title],
    ['目标地区', regionLabel(p.region)],
    ['画风', styleName(p.style)],
    ['画幅', p.ratio],
    ['清晰度', p.reso],
    ['资产总数', `${count} 项`],
    ['角色妆造', `${lookCount} 套`],
    ['导出时间', today],
    ['导出方', '百度一镜 · 短剧转绘 Agent'],
    ['说明', '本表为资产清单；转绘前后对比图请在「资产确认」页查看。'],
  ];

  const charRows = [['转绘后角色名', '原始角色名', '角色身份', '妆造名', '转绘提示词', '状态']];
  charList.forEach(a=>{
    const looks = (a.looks && a.looks.length) ? a.looks : [{ id:a.id, name:'默认造型', prompt:a.prompt }];
    const hasLooks = !!(a.looks && a.looks.length);
    looks.forEach(lk=>{
      const done = a.pre || state.assetDone[a.id] || (hasLooks && state.lookDone[lk.id]);
      charRows.push([locName(a), a.name, a.role || '', lk.name, lk.prompt, done ? '已生成' : '待生成']);
    });
  });
  const simpleRows = (list, label)=>[
    [label, '转绘提示词', '状态'],
    ...list.map(a=>{
      const done = a.pre || state.assetDone[a.id];
      return [a.name, a.prompt, done ? '已生成' : '待生成'];
    }),
  ];
  const sceneRows = simpleRows(sceneList, '场景名');
  const propRows = simpleRows(propList, '道具名');

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="项目信息" sheetId="1" r:id="rId1"/><sheet name="角色资产" sheetId="2" r:id="rId2"/><sheet name="场景资产" sheetId="3" r:id="rId3"/><sheet name="道具资产" sheetId="4" r:id="rId4"/></sheets></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F4F8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDCE1EA"/></left><right style="thin"><color rgb="FFDCE1EA"/></right><top style="thin"><color rgb="FFDCE1EA"/></top><bottom style="thin"><color rgb="FFDCE1EA"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const files = [
    ['[Content_Types].xml', contentTypes],
    ['_rels/.rels', rootRels],
    ['xl/workbook.xml', workbook],
    ['xl/_rels/workbook.xml.rels', wbRels],
    ['xl/styles.xml', styles],
    ['xl/worksheets/sheet1.xml', xlsxSheet(infoRows, [18, 56])],
    ['xl/worksheets/sheet2.xml', xlsxSheet(charRows, [20, 16, 16, 18, 60, 10])],
    ['xl/worksheets/sheet3.xml', xlsxSheet(sceneRows, [22, 64, 10])],
    ['xl/worksheets/sheet4.xml', xlsxSheet(propRows, [22, 64, 10])],
  ];
  const blob = new Blob(xlsxZip(files), {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  return { blob, count, lookCount };
}
function exportAssetTable(){
  const p = state.project;
  const { blob, count, lookCount } = buildAssetXlsx();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.title}_转绘资产表.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
  toast(`已导出 Excel 资产表（${count} 项资产 · ${lookCount} 套妆造）`);
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
