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
  const full = state.screen==='project' || state.screen==='assets';
  document.querySelector('.app').classList.toggle('no-sidebar', full);
  if(state.screen==='landing') renderLanding();
  else if(state.screen==='assets') renderAssets();
  else renderProject();
}
/* ===================== 落地页（入口） ===================== */
function renderLanding(){
  const L = state.landing;
  const isFilm = L.toggle === 'film';
  const isRestyle = L.toggle === 'restyle';
  const uploads = Array.isArray(L.uploads) ? L.uploads : [];
  const isLocalRestyle = isRestyle && L.videoSource !== 'pan';
  const allUploaded = uploads.length > 0 && uploads.every(u=> u.status === 'done');
  const canSend = !isRestyle || (isLocalRestyle && allUploaded);
  const sendHint = canSend ? '创建项目'
    : L.videoSource==='pan' ? '请先从网盘导入视频'
    : uploads.length ? '请等待全部视频上传成功' : '请先上传本地视频';
  const upItem = u=>`<div class="upitem ${u.status}">
    <span class="upico">🎞</span>
    <span class="upmain">
      <span class="upname" title="${esc(u.name)}">${esc(u.name)}</span>
      <span class="upbar"><i style="width:${u.status==='done'?100:u.progress}%"></i></span>
      <span class="upmeta">${u.status==='uploading'?`上传中 ${u.progress}%` : u.status==='done' ? `上传成功 · ${u.sizeLabel}` : `上传失败${u.error?' · '+esc(u.error):''}`}</span>
    </span>
    <button class="updel" type="button" data-upload-remove="${u.id}" title="移除该视频">✕</button>
  </div>`;
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
          ${isRestyle?`<div class="upload-source">
            <button class="us-opt ${L.videoSource==='pan'?'':'on'}" data-src="local">本地上传</button>
            <button class="us-opt ${L.videoSource==='pan'?'on':''}" data-src="pan">百度网盘上传</button>
          </div>`:''}
          ${isRestyle && L.videoSource==='pan'?`
          <div class="pan-import">
            <div class="pan-row">
              <span class="pan-ico">☁</span>
              <input class="pan-link" id="panLink" value="${esc(L.panLink)}" placeholder="粘贴百度网盘文件夹链接（链接里带提取码会自动识别）">
              <input class="pan-code" id="panCode" maxlength="8" value="${esc(L.panCode)}" placeholder="提取码（选填）">
              <button class="pan-btn" id="panImport" ${L.panLoading?'disabled':''}>${L.panLoading?'正在拉取视频…':'从网盘导入视频'}</button>
            </div>
            <div class="pan-hint">提取码选填；Agent 会自动拉取该文件夹内的全部视频文件，并加入「原片管理」</div>
          </div>`:`
          <div class="dropzone ${isLocalRestyle && uploads.length?'has-files':''}" id="drop">
            <div class="dz-ico">${ICON.upload}</div>
            <div class="dz-title">${isRestyle?'上传视频':'上传剧本'}</div>
            <div class="dz-sub">${isRestyle
              ? '支持 mp4 / mov 格式，单个大小不超过 500M，单次最多 10 个视频，可继续多次上传'
              : '支持上传 txt / docx / pdf 文件'}</div>
          </div>
          ${isLocalRestyle && uploads.length?`
          <div class="uplist">
            ${uploads.map(upItem).join('')}
            <div class="up-summary ${allUploaded?'ok':''}">
              ${allUploaded
                ? `✓ ${uploads.length} 个视频已全部上传成功，可以点击发送`
                : `已选择 ${uploads.length} 个视频 · 全部上传成功后才可发送`}
            </div>
          </div>`:''}`}
          <textarea class="q-input" id="q" placeholder="输入你的改编想法…">${esc(L.query)}</textarea>
          ${isFilm?'':`<div class="entry-toolbar">
            <div class="tool" id="tStyle"><span class="ti">${ICON.wand}</span>${styleName(L.style)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRegion"><span class="ti">${ICON.wand}</span>${esc(L.region)}<span class="chev">⌄</span></div>
            <div class="tool" id="tRatio"><span class="ti">${ICON.monitor}</span><span class="sub" data-r="ratio" title="选择画幅比例">${L.ratio}<span class="chev">⌄</span></span><i class="tsep">|</i><span class="sub" data-r="reso" title="选择分辨率">${L.reso}<span class="chev">⌄</span></span></div>
            <button class="send-btn" id="go" ${canSend?'':'disabled'} title="${sendHint}">${ICON.send}</button>
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
  $$('.upload-source .us-opt').forEach(b=> b.onclick=()=>{
    L.videoSource = b.dataset.src;
    renderLanding();
  });
  $('#q').oninput = e=> L.query = e.target.value;
  const drop = $('#drop');
  if(drop){
    drop.onclick = ()=>{
      if(L.toggle==='restyle' && L.videoSource==='local') pickLandingVideos();
      else startProject();
    };
    if(L.toggle==='restyle' && L.videoSource==='local'){
      drop.ondragover = e=>{ e.preventDefault(); drop.classList.add('drag'); };
      drop.ondragleave = ()=> drop.classList.remove('drag');
      drop.ondrop = e=>{
        e.preventDefault(); drop.classList.remove('drag');
        addLandingVideos([...e.dataTransfer.files]);
      };
    }
  }
  $$('[data-upload-remove]').forEach(b=> b.onclick = e=>{
    e.stopPropagation();
    removeLandingUpload(b.dataset.uploadRemove);
  });
  const go = $('#go');
  if(go) go.onclick = ()=>{ if(!go.disabled) startProject(true); };
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

function pickLandingVideos(){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.mp4,.mov,video/mp4,video/quicktime';
  inp.multiple = true;
  inp.onchange = ()=>{
    const files = [...(inp.files || [])];
    inp.remove();
    if(files.length) addLandingVideos(files);
  };
  document.body.appendChild(inp);
  inp.click();
}
function uploadSizeLabel(bytes){
  if(bytes >= 1024*1024*1024) return (bytes/1024/1024/1024).toFixed(1)+'GB';
  if(bytes >= 1024*1024) return (bytes/1024/1024).toFixed(1)+'MB';
  return Math.max(1, Math.round(bytes/1024))+'KB';
}
function addLandingVideos(files){
  const L = state.landing;
  if(!Array.isArray(L.uploads)) L.uploads = [];
  const picked = files.slice(0, 10);
  if(files.length > 10) toast('单次最多上传 10 个视频，已选择前 10 个');
  picked.forEach((file, k)=>{
    const validType = /\.(mp4|mov)$/i.test(file.name) || /^video\/(mp4|quicktime)$/i.test(file.type);
    const oversize = file.size > 500*1024*1024;
    const rec = {
      id:'up'+Date.now()+'_'+k,
      name:file.name,
      sizeLabel:uploadSizeLabel(file.size),
      progress:0,
      status: !validType ? 'fail' : oversize ? 'fail' : 'uploading',
      error: !validType ? '仅支持 mp4 / mov' : oversize ? '超过 500M' : '',
      timer:null,
    };
    L.uploads.push(rec);
    if(rec.status==='uploading') simulateLandingUpload(rec);
  });
  if(picked.some(f=> !/\.(mp4|mov)$/i.test(f.name))) toast('仅支持 mp4 / mov 格式视频');
  else if(picked.some(f=> f.size > 500*1024*1024)) toast('单个视频不能超过 500M');
  renderLanding();
}
function simulateLandingUpload(rec){
  rec.status = 'uploading';
  rec.progress = 0;
  rec.timer = setInterval(()=>{
    rec.progress = Math.min(100, rec.progress + 12 + Math.round(Math.random()*16));
    if(rec.progress >= 100){
      rec.progress = 100;
      rec.status = 'done';
      clearInterval(rec.timer);
      rec.timer = null;
      const allDone = state.landing.uploads.every(u=> u.status === 'done');
      if(allDone) toast('全部视频上传成功，可以点击发送了');
    }
    if(state.screen==='landing' && state.landing.toggle==='restyle') renderLanding();
  }, 180);
}
function removeLandingUpload(id){
  const L = state.landing;
  const rec = (L.uploads || []).find(u=> u.id === id);
  if(rec && rec.timer) clearInterval(rec.timer);
  L.uploads = (L.uploads || []).filter(u=> u.id !== id);
  renderLanding();
}
function startProject(fromSend=false){
  const L = state.landing;
  if(L.panLoading) return;
  const localRestyle = L.toggle==='restyle' && L.videoSource==='local';
  if(fromSend && localRestyle){
    const uploads = Array.isArray(L.uploads) ? L.uploads : [];
    if(!uploads.length){ toast('请先上传本地视频'); return; }
    if(!uploads.every(u=> u.status==='done')){ toast('请等待全部视频上传成功后再发送'); return; }
    const scenes = [SC.bedroom, SC.hall, SC.city, SC.corridor, SC.snowHall];
    state.clips = uploads.map((u,i)=>({
      id:'c'+Date.now()+i,
      name:u.name,
      dur:'00:05',
      scene:scenes[i % scenes.length],
      from:'local',
    }));
    state.clipSource = 'local';
  }else{
    state.clips = CLIPS.map(x=>({...x}));
    state.clipSource = 'demo';
  }
  enterProject();
  toast('已创建项目：'+state.project.title);
}
/* 入口配置带入项目 */
function enterProject(){
  const L = state.landing;
  state.project.style = L.style; // 入口风格带入项目
  state.project.modelVideo = L.modelVideo; state.project.modelImage = L.modelImage;
  state.project.ratio = L.ratio; state.project.reso = L.reso; state.project.region = L.region;
  resetParseState();
  state.screen='project'; state.stage='clips'; state.maxStage=0;
  render();
}
function resetParseState(){
  if(state.parseTimer){ clearInterval(state.parseTimer); state.parseTimer = null; }
  state.parseStatus = 'idle';
  state.parseProgress = 0;
  state.parseEta = 0;
  state.clipParse = {};
  state.clips.forEach(c=> state.clipParse[c.id] = 'unparsed');
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
const FLOW = ['clips', 'asset', 'shot', 'film'];
const STAGE_LABEL = { clips:'原片管理', asset:'资产确认', shot:'分镜转绘', film:'合成成片' };
/* 切换右侧工作区：记录已推进到的最远环节，并保留对话框滚动位置 */
function selectStage(k){
  if(!STAGE_LABEL[k]) return;
  const sc = $('#cscroll'), top = sc ? sc.scrollTop : 0;
  state.stage = k;
  state.maxStage = Math.max(state.maxStage || 0, FLOW.indexOf(k));
  render();
  const sc2 = $('#cscroll'); if(sc2) sc2.scrollTop = top;
  const target = k==='clips' ? $('.mgr') : $('#pbodywrap');
  if(target){
    target.classList.add('stage-flash');
    setTimeout(()=> target.classList.remove('stage-flash'), 700);
  }
}
function renderProject(){
  const p = state.project;
  $('#main').innerHTML = `
  <div class="proj">
    <div class="topbar">
      <div class="tb-left">
        <button class="tb-back" id="back">‹</button>
        <input class="tb-title" id="title" value="${esc(p.title)}">
      </div>
      <div class="tb-right">
        <button class="tb-ghost">★ 我的订阅</button>
        <button class="tb-ghost" id="assetBtn">◱ 项目资产</button>
      </div>
    </div>
    <div class="proj-body ${state.stage==='clips'?'two':'three'}" id="pbody"></div>
  </div>`;
  bindTopbar();
  renderBody();
}
function bindTopbar(){
  const p = state.project;
  $('#back').onclick = ()=>{
    if(state.parseTimer){ clearInterval(state.parseTimer); state.parseTimer = null; }
    state.screen='landing'; render();
  };
  $('#title').onchange = e=> p.title = e.target.value || p.title;
  $('#assetBtn').onclick = ()=>{
    state.assetLibTab = 'character';
    state.assetLibDetail = null;
    state.screen = 'assets';
    render();
  };
}

/* ---- 项目资产库 ---- */
const ALIB_TABS = [
  {k:'character', l:'角色'},
  {k:'scene', l:'场景'},
  {k:'prop', l:'道具'},
  {k:'video', l:'视频'},
  {k:'other', l:'未分类'},
];
function charLib(a){
  const main = assetIsDone(a);
  const looks = (a.looks || []).filter(lk=> lookDoneOf(a, lk));
  const items = [];
  if(main) items.push({id:a.id, name:'角色主图', image:assetImage(a, 'character', 'new'), kind:'main'});
  looks.forEach(lk=> items.push({id:lk.id, name:lk.name, image:assetImage(lk, 'character', 'new'), kind:'look'}));
  return {
    a, main, looks, items,
    cover: looks.length ? assetImage(looks[0], 'character', 'new')
         : main ? assetImage(a, 'character', 'new') : null,
  };
}
function libCharacters(){
  return state.assets.character.map(charLib).filter(x=> x.items.length);
}
function libSimple(cat){
  return state.assets[cat].filter(assetIsDone).map(a=>({a, image:assetImage(a, cat, 'new')}));
}
function libVideos(){
  return state.shots.map((s,i)=>({s, i})).filter(x=> x.s.done);
}
function libEmptyHTML(k){
  const label = (ALIB_TABS.find(t=>t.k===k)||{}).l || '资产';
  return `<div class="alib-empty">还没有已生成的${label}资产<span>完成生成后会自动出现在项目资产中</span></div>`;
}
function libCardHTML(k, item){
  if(k==='character'){
    const badge = item.looks.length ? `${item.looks.length} 造型` : '主图';
    return `<button class="alib-card" data-lib-cat="character" data-lib-id="${item.a.id}" title="查看${esc(item.a.name)}">
      <span class="alib-cover"><img src="${esc(item.cover)}" alt="${esc(item.a.name)}"><span class="alib-badge">${badge}</span></span>
      <span class="alib-name">${esc(item.a.name)}</span>
    </button>`;
  }
  if(k==='video'){
    return `<button class="alib-card" data-lib-cat="video" data-lib-idx="${item.i}" title="查看分镜 ${item.i+1}">
      <span class="alib-cover"><img src="${shotStill(item.s)}" alt="分镜 ${item.i+1}"><span class="alib-badge">${esc(item.s.dur)}</span></span>
      <span class="alib-name">分镜 ${String(item.i+1).padStart(2,'0')}</span>
    </button>`;
  }
  return `<button class="alib-card" data-lib-cat="${k}" data-lib-id="${item.a.id}" title="查看${esc(item.a.name)}">
    <span class="alib-cover"><img src="${esc(item.image)}" alt="${esc(item.a.name)}"><span class="alib-badge">${ASSET_LABEL[k]}</span></span>
    <span class="alib-name">${esc(item.a.name)}</span>
  </button>`;
}
function renderAssets(){
  if(state.assetLibDetail){ renderAssetDetail(); return; }
  const tab = ALIB_TABS.some(t=>t.k===state.assetLibTab) ? state.assetLibTab : 'character';
  state.assetLibTab = tab;
  let cards = '';
  if(tab==='character') cards = libCharacters().map(x=>libCardHTML('character', x)).join('');
  else if(tab==='video') cards = libVideos().map(x=>libCardHTML('video', x)).join('');
  else if(tab!=='other') cards = libSimple(tab).map(x=>libCardHTML(tab, x)).join('');
  $('#main').innerHTML = `<div class="alib">
    <div class="alib-head">
      <button class="alib-back" id="alibBack" title="返回项目">‹</button>
      <h1>项目资产</h1>
    </div>
    <div class="alib-tabs">
      ${ALIB_TABS.map(t=>`<button data-lib-tab="${t.k}" class="${tab===t.k?'on':''}">${t.l}</button>`).join('')}
    </div>
    <div class="alib-body">
      ${cards ? `<div class="alib-grid ${tab!=='character'?'is-wide':''}">${cards}</div>` : libEmptyHTML(tab)}
    </div>
  </div>`;
  bindAssetLibrary();
}
function renderAssetDetail(){
  const d = state.assetLibDetail;
  if(!d){ renderAssets(); return; }
  if(d.cat==='character'){ renderCharacterAsset(d.id); return; }
  if(d.cat==='scene' || d.cat==='prop'){ renderSimpleAsset(d.cat, d.id); return; }
  state.assetLibDetail = null;
  renderAssets();
}
function renderCharacterAsset(id){
  const a = state.assets.character.find(x=>x.id===id);
  if(!a){ state.assetLibDetail = null; renderAssets(); return; }
  const lib = charLib(a);
  if(!lib.items.length){ state.assetLibDetail = null; renderAssets(); return; }
  const looks = lib.looks.map(lk=>`<figure class="alib-look">
    <div class="alib-look-img"><img src="${assetImage(lk, 'character', 'new')}" alt="${esc(lk.name)}"></div>
    <figcaption>${esc(a.name)}·${esc(lk.name)}</figcaption>
  </figure>`).join('');
  const main = lib.main ? `<figure class="alib-look">
    <div class="alib-look-img"><img src="${assetImage(a, 'character', 'new')}" alt="角色主图"></div>
    <figcaption>${esc(a.name)}·角色主图</figcaption>
  </figure>` : '';
  $('#main').innerHTML = `<div class="alib alib-detail">
    <div class="alib-head">
      <button class="alib-back" id="alibBack" title="返回项目资产">‹</button>
      <h1>${esc(a.name)}</h1>
    </div>
    <div class="alib-detail-body">
      ${looks ? `<h2 class="alib-sec-title">造型 (${lib.looks.length})</h2><div class="alib-look-grid">${looks}</div>` : ''}
      ${main ? `<h2 class="alib-sec-title">角色主图</h2><div class="alib-look-grid">${main}</div>` : ''}
      <h2 class="alib-sec-title">音色</h2>
      <div class="alib-voice">
        <span class="alib-voice-tag">当前使用</span>
        <p>${esc(a.voice || '自然音色')}，语速中等，情绪表达贴合角色，保留原片表演节奏。</p>
        <div class="alib-voice-foot">文本音色</div>
      </div>
      <div class="alib-voice-name">${esc(a.name)}·原声</div>
    </div>
  </div>`;
  bindAssetLibrary();
}
function renderSimpleAsset(cat, id){
  const a = state.assets[cat].find(x=>x.id===id);
  if(!a || !assetIsDone(a)){ state.assetLibDetail = null; renderAssets(); return; }
  $('#main').innerHTML = `<div class="alib alib-detail">
    <div class="alib-head">
      <button class="alib-back" id="alibBack" title="返回项目资产">‹</button>
      <h1>${esc(a.name)}</h1>
    </div>
    <div class="alib-detail-body">
      <h2 class="alib-sec-title">${ASSET_LABEL[cat]}图</h2>
      <div class="alib-simple-detail"><img src="${assetImage(a, cat, 'new')}" alt="${esc(a.name)}"></div>
      <h2 class="alib-sec-title">转绘提示词</h2>
      <div class="alib-prompt">${esc(a.prompt)}</div>
    </div>
  </div>`;
  bindAssetLibrary();
}
function bindAssetLibrary(){
  const back = $('#alibBack');
  if(back) back.onclick = ()=>{
    if(state.assetLibDetail){ state.assetLibDetail = null; renderAssets(); }
    else { state.screen = 'project'; render(); }
  };
  $$('[data-lib-tab]').forEach(b=> b.onclick = ()=>{
    state.assetLibTab = b.dataset.libTab;
    state.assetLibDetail = null;
    renderAssets();
  });
  $$('[data-lib-cat]').forEach(card=> card.onclick = ()=>{
    const cat = card.dataset.libCat;
    if(cat==='video'){
      const i = +card.dataset.libIdx;
      const s = state.shots[i];
      if(s) openImageZoom(shotStill(s), `分镜 ${String(i+1).padStart(2,'0')}`);
      return;
    }
    state.assetLibDetail = {cat, id:card.dataset.libId};
    renderAssets();
  });
}
/* ---- 工作台主体 ---- */
function renderBody(){
  const pb = $('#pbody');
  if(!pb) return;
  if(state.stage==='clips') pb.innerHTML = chatHTML() + clipsHTML();
  else                      pb.innerHTML = chatHTML() + eplistHTML() + panelHTML();
  bindChat();
  if(state.stage==='clips') bindClips();
  else { bindEplist(); bindPanel(); }
}

/* ---- Agent 对话：各环节结果卡片 ---- */
function resStack(thumbs, badge){
  return `<div class="res-media"><div class="cf-stack">
    ${thumbs.map((src,i)=>`<span class="cf-thumb" style="--i:${i}"><img src="${src}" alt=""></span>`).join('')}
    <span class="cf-count">${badge}</span>
  </div></div>`;
}
function stageResultCard(k){
  const active = state.stage === k;
  const clipN = state.clips.length;
  const charN = state.assets.character.length;
  const sceneN = state.assets.scene.length;
  const propN = state.assets.prop.length;
  const assetN = charN + sceneN + propN;
  const shotN = state.shots.length;
  const shotDone = state.shots.filter(s=>s.done).length;
  let media = '', title = '', sub = '', prog = '';

  if(k==='clips'){
    title = STAGE_LABEL.clips;
    media = resStack(state.clips.slice(0,3).map(c=>drawScene(c.scene,'orig')), clipN);
    const first = clipN ? state.clips[0].name : '';
    sub = clipN
      ? `${state.clipSource==='pan'?'网盘导入':'本地上传'} · ${esc(first)}${clipN>1?` 等 ${clipN} 个视频`:''}`
      : '暂未导入原片';
    if(clipN && state.parseStatus !== 'idle'){
      const pc = parseCounts();
      sub += state.parseStatus==='parsing'
        ? ` · 解析中 ${state.parseProgress}%`
        : ` · 解析成功 ${pc.ok}/${clipN}`;
    }
  }else if(k==='asset'){
    title = STAGE_LABEL.asset;
    media = `<div class="res-media res-total"><b>${assetN}</b><span>项资产</span></div>`;
    sub = `角色 ${charN} · 场景 ${sceneN} · 道具 ${propN}`;
  }else if(k==='shot'){
    title = STAGE_LABEL.shot;
    media = resStack(state.shots.slice(0,3).map(s=>s.done ? shotStill(s) : drawScene(s.scene,'orig')), `${shotDone}/${shotN}`);
    sub = `共 ${shotN} 个分镜 · 已转绘 ${shotDone} 个`;
    const pct = shotN ? Math.round(shotDone / shotN * 100) : 0;
    prog = `<div class="res-prog"><i style="width:${pct}%"></i></div>`;
  }else{
    title = STAGE_LABEL.film;
    const cover = state.shots.find(s=>s.done) || state.shots[0];
    media = `<div class="res-media res-poster"><img src="${shotStill(cover)}" alt=""><span class="res-play">▶</span><span class="cf-count">${shotDone}/${shotN}</span></div>`;
    sub = shotDone === shotN ? '全部分镜已完成，可导出成片' : `待完成 ${shotN-shotDone} 个分镜后合成`;
  }

  return `<div class="res-card ${active?'on':''}" data-stage="${k}" role="button" tabindex="0" title="在右侧查看${title}">
    ${media}
    <div class="res-body">
      <div class="res-title"><b>${title}</b>${active?'<em>当前查看</em>':''}</div>
      <span class="res-sub" title="${esc(sub)}">${sub}</span>
      ${prog}
    </div>
    <span class="res-go" aria-hidden="true">›</span>
  </div>`;
}
function parseCounts(){
  const list = state.clips.map(c=> state.clipParse[c.id] || 'unparsed');
  return {
    ok: list.filter(x=>x==='ok').length,
    fail: list.filter(x=>x==='fail').length,
    parsing: list.filter(x=>x==='parsing').length,
    unparsed: list.filter(x=>x==='unparsed').length,
  };
}
function fmtEta(sec){
  const s = Math.max(0, Math.round(sec || 0));
  return `00:${String(s).padStart(2,'0')}`;
}
function scrollChatBottom(){
  const sc = $('#cscroll');
  if(sc) sc.scrollTop = sc.scrollHeight;
}
const PARSE_SECONDS = 8;
function startParsing(){
  if(state.parseStatus !== 'idle') return;
  state.parseStatus = 'parsing';
  state.parseProgress = 0;
  state.parseEta = PARSE_SECONDS;
  state.clips.forEach(c=> state.clipParse[c.id] = 'unparsed');
  renderBody();
  scrollChatBottom();
  toast('已确认原片，开始解析视频');
  const started = Date.now();
  state.parseTimer = setInterval(()=>{
    const elapsed = Date.now() - started;
    const pct = Math.min(100, Math.round(elapsed / (PARSE_SECONDS*1000) * 100));
    state.parseProgress = pct;
    state.parseEta = Math.max(0, Math.ceil((PARSE_SECONDS*1000 - elapsed) / 1000));
    const n = state.clips.length || 1;
    state.clips.forEach((c,i)=>{
      const end = (i+1) / n * 100;
      state.clipParse[c.id] = pct >= 100 ? 'ok' : pct >= end ? 'ok' : pct >= i/n*100 ? 'parsing' : 'unparsed';
    });
    if(pct >= 100){
      clearInterval(state.parseTimer);
      state.parseTimer = null;
      state.parseStatus = 'done';
      state.parseProgress = 100;
      state.parseEta = 0;
      state.clips.forEach(c=> state.clipParse[c.id] = 'ok');
      renderBody();
      scrollChatBottom();
      toast(`视频解析完成：${state.clips.length} 个成功`);
    }else{
      renderBody();
      scrollChatBottom();
    }
  }, 300);
}
function chatMessages(){
  const msgs = [];
  const clipN = state.clips.length;
  const max = state.maxStage || 0;
  const pc = parseCounts();

  if(clipN){
    const clipIntro = state.clipSource==='pan'
      ? `已从百度网盘文件夹拉取 <b>${clipN} 个视频</b>，并加入原片管理。`
      : state.parseStatus === 'parsing'
        ? `已为你导入 <b>${clipN} 集</b>短剧原片，原片已确认，正在解析视频。`
        : state.parseStatus === 'done'
          ? `已为你导入 <b>${clipN} 集</b>短剧原片，原片已确认并锁定，视频解析已完成。`
          : max === 0
            ? `已为你导入 <b>${clipN} 集</b>短剧原片，可在右侧拖拽排序、预览或继续上传。`
            : `已为你导入 <b>${clipN} 集</b>短剧原片，原片已确认并锁定，仅支持预览查看。`;
    msgs.push({who:'a', html:clipIntro});
    msgs.push({who:'a', card:true, html:stageResultCard('clips')});
    if(max === 0){
      if(state.parseStatus === 'idle'){
        msgs.push({who:'a',
          html:'原片已就绪。确认无误后，我会先解析视频画面、台词与剧情结构；解析完成后可继续提取角色、场景与道具资产。',
          parse:'确认原片，进行视频解析'});
      }else if(state.parseStatus === 'parsing'){
        msgs.push({who:'a', html:`正在解析原片画面、台词与剧情结构…
          <div class="cparse">
            <div class="cparse-head"><span class="spin xs"></span><b>视频解析中</b><span>预计剩余 ${fmtEta(state.parseEta)}</span></div>
            <div class="cparse-bar"><i style="width:${state.parseProgress}%"></i></div>
            <div class="cparse-meta"><span>${state.parseProgress}%</span><span>已解析 ${pc.ok}/${clipN} 个视频${pc.parsing?` · 正在解析第 ${state.clips.findIndex(c=>state.clipParse[c.id]==='parsing')+1} 个`:''}</span></div>
          </div>`});
      }else{
        msgs.push({who:'a', html:`视频解析完成：<b>${pc.ok} 个成功</b> · ${pc.fail} 个失败 · ${pc.unparsed} 个未解析。
          <div class="cparse done">
            <div class="cparse-head"><span class="cparse-check">✓</span><b>原片解析完成</b><span>耗时 ${PARSE_SECONDS} 秒</span></div>
            <div class="cparse-bar"><i style="width:100%"></i></div>
            <div class="cparse-meta"><span>100%</span><span>已识别剧情结构与台词语义</span></div>
          </div>`,
          action:'提取资产', go:'asset'});
      }
    }else{
      msgs.push({who:'a', html:'原片已确认并锁定，后续仅支持预览查看。'});
    }
  }else{
    msgs.push({who:'a', html:'暂未导入原片，请上传视频或从百度网盘导入。'});
  }

  if(max >= 1){
    const c = state.assets.character.length;
    const s = state.assets.scene.length;
    const p = state.assets.prop.length;
    msgs.push({who:'a', html:`已从原片剧情中提炼出 <b>${c} 个角色、${s} 个场景、${p} 个道具</b>，并自动生成转绘 Prompt。`});
    msgs.push({who:'a', card:true, html:stageResultCard('asset')});
    msgs.push({who:'a',
      html: max === 1 ? '请在右侧确认资产，逐个或批量生成资产图；确认后开始分镜拆解。' : '资产确认已完成，可继续在右侧查看与调整资产。',
      ...(max === 1 ? { action:'开始分镜转绘', go:'shot' } : {})});
  }

  if(max >= 2){
    const total = state.shots.length;
    const done = state.shots.filter(s=>s.done).length;
    msgs.push({who:'a', html:`已基于原片与资产自动拆解出 <b>${total} 个分镜</b>，描述中 <span class="ref">@引用</span> 了对应资产。`});
    msgs.push({who:'a', card:true, html:stageResultCard('shot')});
    msgs.push({who:'a',
      html: max === 2
        ? `当前已转绘 <b>${done}/${total}</b> 个分镜，可逐个或批量转绘；全部完成后即可合成成片。`
        : `分镜转绘进行中，当前已完成 <b>${done}/${total}</b> 个分镜。`,
      ...(max === 2 ? { action:'合成成片', go:'film' } : {})});
  }

  if(max >= 3){
    const total = state.shots.length;
    const done = state.shots.filter(s=>s.done).length;
    msgs.push({who:'a', html: done===total
      ? '分镜已全部转绘完成 🎉，合成成片已就绪。'
      : `成片预览已就绪，还有 <b>${total-done} 个分镜</b>待完成转绘。`});
    msgs.push({who:'a', card:true, html:stageResultCard('film')});
    msgs.push({who:'a', html:'合成成片已保留原片 BGM，可在右侧预览最终视频。'});
  }

  return msgs;
}
function chatHTML(){
  const msgs = chatMessages();
  const body = msgs.map(m=>`
    <div class="cmsg ${m.who}${m.card?' cmsg-card':''}">
      <div class="cbubble">${m.html}
        ${m.action?`<button class="cbtn" data-go="${m.go}">${m.action}</button>`
          : m.parse?`<button class="cbtn cbtn-parse" data-parse="1">${m.parse}</button>`:''}
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
  $$('.cbtn').forEach(b=>{
    b.onclick = b.dataset.parse ? startParsing : ()=> selectStage(b.dataset.go);
  });
  $$('.res-card').forEach(card=>{
    const open = ()=> selectStage(card.dataset.stage);
    card.onclick = open;
    card.onkeydown = e=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); }
    };
  });
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

/* ---- 分集列表（中栏目录） ---- */
function eplistHTML(){
  const active = state.activeEp;
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
    state.activeEp = +el.dataset.i;
    render();
  });
}
/* ===================== 原片管理器 ===================== */
function clipsLocked(){ return (state.maxStage || 0) >= 1 || state.parseStatus !== 'idle'; }
const PARSE_LABEL = { unparsed:'未解析', parsing:'解析中', ok:'解析成功', fail:'解析失败' };
function clipsHTML(){
  const locked = clipsLocked();
  const pc = parseCounts();
  const cards = state.clips.map((c,i)=>{
    const img = drawScene(c.scene, 'orig');
    const ps = state.clipParse[c.id] || 'unparsed';
    const psLabel = PARSE_LABEL[ps] || '未解析';
    return `<div class="clipc ${locked?'is-locked':''}" draggable="${locked?'false':'true'}" data-i="${i}">
      <div class="clip-thumb"><img src="${img}" alt="">${c.from==='pan'?'<span class="clip-src">☁ 网盘</span>':c.from==='local'?'<span class="clip-src">本地</span>':''}<span class="clip-play">▶</span><span class="clip-dur">${c.dur}</span></div>
      <div class="clip-meta">
        <div class="clip-label">
          <div class="clip-title-row"><b>第 ${i+1} 集</b><span class="clip-status ${ps}">${ps==='parsing'?'<i class="ps-dot"></i>':''}${psLabel}</span></div>
          <span class="clip-name" title="${esc(c.name)}">${esc(c.name)}</span>
        </div>
        ${locked?'':`<button class="clip-del" data-i="${i}">✕</button>`}
      </div>
    </div>`;
  }).join('');
  const parseSummary = state.parseStatus === 'idle'
    ? `<div class="parse-summary"><span class="ps-legend"><i class="dot ok"></i>解析成功 <b>${pc.ok}</b></span><span class="ps-legend"><i class="dot fail"></i>解析失败 <b>${pc.fail}</b></span><span class="ps-legend"><i class="dot idle"></i>未解析 <b>${pc.unparsed}</b></span><span class="ps-live">确认原片后开始解析</span></div>`
    : state.parseStatus === 'parsing'
      ? `<div class="parse-summary"><span class="ps-legend"><i class="dot ok"></i>解析成功 <b>${pc.ok}</b></span><span class="ps-legend"><i class="dot fail"></i>解析失败 <b>${pc.fail}</b></span><span class="ps-legend"><i class="dot idle"></i>未解析 <b>${pc.unparsed}</b></span><span class="ps-live"><span class="spin xs"></span>解析中 ${state.parseProgress}%</span></div>`
      : `<div class="parse-summary"><span class="ps-legend"><i class="dot ok"></i>解析成功 <b>${pc.ok}</b></span><span class="ps-legend"><i class="dot fail"></i>解析失败 <b>${pc.fail}</b></span><span class="ps-legend"><i class="dot idle"></i>未解析 <b>${pc.unparsed}</b></span><span class="ps-live done">✓ 解析完成</span></div>`;
  return `<div class="mgr ${locked?'is-locked':''}">
    <div class="mgr-head">
      <div>原片管理 <em>${state.clips.length} ${state.clipSource==='pan'?'个视频':'集'}</em>${locked?'<span class="mgr-lock">🔒 已确认 · 仅可查看</span>':''}</div>
      ${locked?'':'<button class="tb-primary" id="addClip">＋ 上传原片</button>'}
    </div>
    ${parseSummary}
    <div class="clip-grid" id="clipGrid">${cards}</div>
    <p class="mgr-tip">${locked
      ? state.parseStatus==='parsing'
        ? '原片已确认，正在解析视频，请稍候；解析结果会实时更新'
        : '原片已确认并锁定，仅支持预览查看；如需更换请返回入口重新创建项目'
      : '拖拽卡片可调整顺序 · 点击缩略图预览 · ✕ 删除'}</p>
  </div>`;
}
function bindClips(){
  const locked = clipsLocked();
  let dragI = null;
  $$('#clipGrid .clipc').forEach(el=>{
    el.querySelector('.clip-thumb').onclick = ()=> playClip(+el.dataset.i);
    if(locked) return;
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
  const add = $('#addClip');
  if(add) add.onclick = ()=>{
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
/* ===================== 右侧工作面板 ===================== */
function panelHTML(){
  const inner = state.stage==='asset' ? assetHTML()
              : state.stage==='shot'  ? shotHTML()
              : filmHTML();
  return `<div class="panel">
    <div class="pbodywrap" id="pbodywrap">${inner}</div>
  </div>`;
}
function bindPanel(){
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
  if(mode==='new' && a && state.assetCustom[a.id]) return state.assetCustom[a.id];
  const style = state.project.style;
  return cat==='character' ? portraitSVG(a.scene, mode, style)
       : cat==='prop'      ? propSVG(a.scene, mode, style)
       : drawScene(a.scene, mode, style);
}
function assetIsDone(a){
  return !!(a && (a.pre || state.assetDone[a.id] || state.assetCustom[a.id]));
}
function assetThumb(a, cat=state.assetTab, allowBatch=true){
  const g = state.generating.has(a.id);
  const done = assetIsDone(a);
  const chk = state.assetBatch && allowBatch
    ? `<label class="aimg-chk" title="勾选后可批量生成"><input type="checkbox" class="achk" data-sel="${a.id}" ${state.assetSel.has(a.id)?'checked':''}></label>`
    : '';
  if(g) return `<div class="aimg skeleton"><span class="spin"></span>${chk}</div>`;
  if(!done) return `<div class="aimg empty">待生成${chk}</div>`;
  return `<div class="aimg"><img src="${assetImage(a, cat, 'new')}" alt="">
    ${chk}<span class="aimg-cmp">对比</span>
  </div>`;
}
function assetOpsHTML(id){
  return `<span class="arow-ops">
    <button type="button" data-upload-asset="${id}" title="从本地上传资产图">⬆ 本地上传</button>
    <button type="button" data-pick-asset="${id}" title="从项目资产中选择资产图">▦ 项目资产</button>
  </span>`;
}
function assetPromptBoxHTML(a){
  const done = assetIsDone(a);
  return `<div class="look-box">
    <textarea class="aprompt" data-id="${a.id}">${esc(a.prompt)}</textarea>
    <div class="look-tools">
      <span class="look-refs" title="参考图">
        ${(a.refs || []).map(src=>`<img src="${esc(src)}" alt="参考图" title="点击放大查看">`).join('')}
      </span>
      <button class="look-link" data-ref="${a.id}">⬆ 上传参考图</button>
      <span class="look-flex"></span>
      <button class="look-gen" data-gen="${a.id}">${done?'重新生成':'生成图片'}</button>
    </div>
  </div>`;
}

/* 角色妆造：同一角色的多套造型，纵向排列并展示 Prompt */
function lookDoneOf(a, lk){ return !!(a.pre || state.lookDone[lk.id]); }
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
      const main = `<div class="arow" data-id="${a.id}">
        ${assetThumb(a, 'character', false)}
        <div class="acol">
          <div class="arow-top"><b>${esc(a.name)}</b>${roles(a)}
            <span class="aref-chip">角色主图</span>
            ${assetOpsHTML(a.id)}
          </div>
          ${assetPromptBoxHTML(a)}
        </div>
      </div>`;
      const looks = `<div class="arow arow-lookcard" data-id="${a.id}">
        <div class="acol">
          <div class="arow-top"><b>${esc(a.name)} · 角色妆造</b>
            <span class="arow-count">${a.looks.length} 套妆造</span>
          </div>
          ${lookStripHTML(a)}
        </div>
      </div>`;
      return main + looks;
    }
    return `<div class="arow" data-id="${a.id}">
      ${assetThumb(a, state.assetTab)}
      <div class="acol">
        <div class="arow-top"><b>${esc(a.name)}</b>${roles(a)}
          ${a.ref?`<span class="aref-chip">${esc(a.ref)}</span>`:''}
          ${assetOpsHTML(a.id)}
        </div>
        ${assetPromptBoxHTML(a)}
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
  delete state.assetCustom[id];
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
/* ---- 资产图本地上传 / 项目资产选择 ---- */
function projectAssetItems(cat){
  if(cat==='character'){
    const out = [];
    state.assets.character.forEach(a=>{
      out.push({id:a.id, name:a.name, kind:'角色主图', url:assetImage(a, 'character', 'new')});
      (a.looks || []).forEach(lk=> out.push({
        id:lk.id, name:`${a.name} · ${lk.name}`, kind:'角色妆造', url:assetImage(lk, 'character', 'new')
      }));
    });
    return out;
  }
  return state.assets[cat].map(a=>({id:a.id, name:a.name, kind:ASSET_LABEL[cat], url:assetImage(a, cat, 'new')}));
}
function applyAssetImage(id, url, source, fromName){
  const cat = assetCat(id); if(!cat) return;
  const a = state.assets[cat].find(x=>x.id===id); if(!a) return;
  state.assetCustom[id] = url;
  renderBody();
  toast(source==='pick' ? `已使用项目资产图：${fromName || a.name}` : `已上传「${a.name}」资产图`);
}
function pickAssetImage(cb){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.style.display = 'none';
  inp.onchange = ()=>{
    const file = inp.files && inp.files[0];
    inp.remove();
    if(!file || !file.type.startsWith('image/')){ if(file) toast('请选择图片文件'); return; }
    const r = new FileReader();
    r.onload = ()=> cb(r.result);
    r.onerror = ()=> toast('图片读取失败');
    r.readAsDataURL(file);
  };
  document.body.appendChild(inp);
  inp.click();
}
function openAssetPicker(targetId){
  const cat = assetCat(targetId); if(!cat) return;
  const target = state.assets[cat].find(x=>x.id===targetId); if(!target) return;
  const items = projectAssetItems(cat).filter(it=> it.id!==targetId);
  let picked = null;
  modal(`<div class="asset-picker">
    <div class="player-head">
      <div class="picker-title"><b>从项目资产选择</b><span class="picker-sub">${ASSET_LABEL[cat]} · ${esc(target.name)}</span></div>
      <button onclick="closeModal()">✕</button>
    </div>
    <div class="picker-body">
      ${items.length ? `<div class="pick-grid">${items.map(it=>`
        <div class="pick-card ${cat!=='character'?'wide':''}" role="button" tabindex="0" data-pick="${it.id}" title="${esc(it.name)}">
          <span class="pick-chk"><input type="checkbox" tabindex="-1" aria-hidden="true"></span>
          <img src="${esc(it.url)}" alt="${esc(it.name)}">
          <span class="pick-meta"><span class="pick-name">${esc(it.name)}</span><span class="pick-kind">${it.kind}</span></span>
        </div>`).join('')}</div>` : '<div class="picker-empty">当前分类暂无其他项目资产</div>'}
    </div>
    <div class="picker-foot">
      <span class="picker-hint">勾选 1 张图片作为「${esc(target.name)}」的资产图</span>
      <button class="aghost" onclick="closeModal()">取消</button>
      <button class="aprimary" id="pickConfirm" disabled>使用该资产图</button>
    </div>
  </div>`);
  const cards = $$('.pick-card');
  const confirm = $('#pickConfirm');
  const select = card=>{
    const same = card.classList.contains('on');
    cards.forEach(c=>{
      c.classList.remove('on');
      const inp = c.querySelector('input'); if(inp) inp.checked = false;
    });
    picked = null;
    if(!same){
      card.classList.add('on');
      const inp = card.querySelector('input'); if(inp) inp.checked = true;
      picked = card.dataset.pick;
    }
    confirm.disabled = !picked;
  };
  cards.forEach(card=>{
    card.onclick = ()=> select(card);
    card.onkeydown = e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); select(card); } };
  });
  confirm.onclick = ()=>{
    if(!picked) return;
    const item = items.find(it=> it.id===picked); if(!item) return;
    closeModal();
    applyAssetImage(targetId, item.url, 'pick', item.name);
  };
}
/* ---- 转绘前后对比 ---- */
function openCompare(id, lookId){
  const cat = assetCat(id); if(!cat) return;
  const a = state.assets[cat].find(x=>x.id===id);
  const look = lookId && a.looks ? a.looks.find(l=>l.id===lookId) : null;
  const item = look || a;
  const done = look ? lookDoneOf(a, look) : assetIsDone(a);
  if(!done){ toast('请先生成该资产的转绘图'); return; }
  const before = assetImage(item, cat, 'orig');
  const after  = assetImage(item, cat, 'new');
  const name = a.name;
  const kind = look ? '角色妆造' : cat==='character' ? '角色主图' : ASSET_LABEL[cat];
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
      const done = a.pre || (hasLooks ? state.lookDone[lk.id] : assetIsDone(a));
      charRows.push([locName(a), a.name, a.role || '', lk.name, lk.prompt, done ? '已生成' : '待生成']);
    });
  });
  const simpleRows = (list, label)=>[
    [label, '转绘提示词', '状态'],
    ...list.map(a=>{
      const done = assetIsDone(a);
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
  $$('button[data-upload-asset]').forEach(b=> b.onclick= e=>{
    e.stopPropagation();
    pickAssetImage(url=> applyAssetImage(b.dataset.uploadAsset, url, 'upload'));
  });
  $$('button[data-pick-asset]').forEach(b=> b.onclick= e=>{
    e.stopPropagation();
    openAssetPicker(b.dataset.pickAsset);
  });
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
const SEED_VERSION_COUNT = { sh1:3, sh2:2, sh3:2, sh4:1, sh5:1 };
function shotVersions(sh){
  return (sh && Array.isArray(sh.versions)) ? sh.versions : [];
}
function versionFrame(sh, v){
  return drawScene(sh.scene, 'new', state.project.style, v ? v.variant : 0);
}
function activeShotVersion(sh){
  const list = shotVersions(sh);
  if(!list.length) return null;
  return list.find(v=>v.id===sh.activeVersion) || list[list.length-1];
}
function shotStill(sh){
  if(!sh || !sh.done) return shotPlaceholderSVG();
  const v = activeShotVersion(sh);
  return v ? versionFrame(sh, v) : drawScene(sh.scene, 'new', state.project.style);
}
function nowStamp(){
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function makeShotVersion(sh, idx){
  const v = idx + 1;
  const mm = String(8 + Math.floor(idx/3)).padStart(2,'0');
  const ss = String((idx*17 + 9) % 60).padStart(2,'0');
  return {
    id:`${sh.id}_v${v}`, v, variant:idx,
    time:`11-03 20:${mm}:${ss}`,
    dur:sh.dur, model:state.project.modelVideo, reso:state.project.reso,
  };
}
function ensureShotVersions(){
  state.shots.forEach(sh=>{
    if(!Array.isArray(sh.versions)) sh.versions = [];
    if(sh.done && !sh.versions.length){
      const n = SEED_VERSION_COUNT[sh.id] || 1;
      for(let k=0;k<n;k++) sh.versions.push(makeShotVersion(sh, k));
    }
    if(sh.versions.length && !sh.versions.some(v=>v.id===sh.activeVersion)){
      sh.activeVersion = sh.versions[sh.versions.length-1].id;
    }
  });
}
function segHTML(seg){
  return seg.map(s=> s.t ? esc(s.t)
    : `<span class="ref ref-${s.ref[0]}">@${esc(s.ref[1])}</span>`).join('');
}
function shotHTML(){
  const sh = state.shots[state.activeShot] || state.shots[0];
  const gen  = state.generating.has(sh.id);
  const status = gen ? '生成中' : sh.done ? '已转绘' : '待转绘';
  const beforeFrame = drawScene(sh.scene,'orig');
  const activeVer = activeShotVersion(sh);
  const afterFrame = sh.done ? shotStill(sh) : shotPlaceholderSVG();
  const afterMain = gen
    ? `<div class="sb-view skeleton"><span class="spin"></span></div>`
    : sh.done
      ? `<div class="sb-view"><img src="${afterFrame}" alt="转绘后"></div>`
      : `<div class="sb-view"><img src="${afterFrame}" alt="待转绘占位图"></div>`;
  const verTag = sh.done && activeVer
    ? `<button type="button" class="sb-hist-link" data-shot-hist="${state.activeShot}" title="查看该分镜的生成历史">V${activeVer.v} · ${shotVersions(sh).length} 个版本</button>`
    : '';
  const main = `<div class="sb-pair">
    <div class="sb-side">
      <div class="sb-side-head"><b>转绘前</b><span>原片</span></div>
      <div class="sb-player"><div class="sb-view"><img src="${beforeFrame}" alt="转绘前"></div></div>
    </div>
    <div class="sb-side">
      <div class="sb-side-head"><b>转绘后</b>${verTag}</div>
      <div class="sb-player">${afterMain}</div>
    </div>
  </div>`;
  const ep = state.episodes[state.activeEp];
  const doneCount = state.shots.filter(s=>s.done).length;
  const strip = state.shots.map((s,i)=>{
    const d = s.done; const g=state.generating.has(s.id);
    const sel = state.shotSel.has(i);
    const img = d ? shotStill(s) : shotPlaceholderSVG();
    const chk = state.shotBatch
      ? `<label class="shotc-chk" title="勾选后可批量转绘"><input type="checkbox" class="shchk" data-sel="${i}" ${sel?'checked':''}></label>`
      : '';
    const ops = (d && !state.shotBatch)
      ? `<span class="shotc-ops">
           <button type="button" data-shot-down="${i}" title="下载该分镜视频">⬇</button>
           <button type="button" data-shot-hist="${i}" title="查看生成历史（${shotVersions(s).length} 个版本）">◷</button>
         </span>`
      : '';
    return `<div class="shotc ${i===state.activeShot?'on':''} ${d?'done':'ph'} ${sel?'sel':''}" data-i="${i}">
      <img src="${img}" alt="${d?'转绘后':'待转绘占位图'}">${g?'<span class="spin sm"></span>':''}${chk}${ops}
      <span class="shotc-no">${i+1}</span>${d?'':'<span class="shotc-wait">待转绘</span>'}<span class="shotc-dur">${s.dur}</span>
    </div>`;
  }).join('');
  const seqTools = `${state.shotBatch
    ? `<label class="selall"><input type="checkbox" id="shotSelAll">全选</label>
       <button class="aghost" id="shotBatchCancel">取消</button>
       <button class="aprimary" id="shotBatchGo">转绘所选 (${state.shotSel.size})</button>`
    : `<button class="aprimary" id="shotBatchStart">批量转绘</button>`}
    <button class="aghost" id="exportShots">⬇ 导出</button>`;
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
        ${main}
        <div class="sb-video-foot">
          <span>时长 ${sh.dur}</span>
          <span>${esc(styleName(state.project.style))}</span>
          <span>${esc(state.project.ratio)} · ${esc(state.project.reso)}</span>
          ${activeVer?`<span>当前版本 V${activeVer.v}</span>`:''}
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
  setTimeout(()=>{
    state.generating.delete(sh.id);
    const list = shotVersions(sh);
    const nv = makeShotVersion(sh, list.length);
    nv.time = nowStamp();
    list.push(nv);
    sh.activeVersion = nv.id;
    sh.done = true;
    renderBody();
    toast(`分镜已转绘 · 生成 V${nv.v}`);
  }, 900);
}
function renderShotHistory(){
  const i = state.historyShot;
  const sh = state.shots[i];
  if(!sh || !shotVersions(sh).length){ toast('该分镜暂无生成记录'); closeModal(); return; }
  const active = activeShotVersion(sh);
  const list = shotVersions(sh).slice().sort((a,b)=>b.v-a.v);
  const cards = list.map(v=>`
    <button type="button" class="hist-card ${v.id===state.historyPick?'on':''}" data-vid="${v.id}">
      <span class="hist-thumb">
        <img src="${versionFrame(sh, v)}" alt="版本 V${v.v}">
        <span class="hist-v">V${v.v}</span>
        ${v.id===active.id?'<span class="hist-using">使用中</span>':''}
      </span>
      <span class="hist-info">
        <b>版本 V${v.v}</b>
        <small>${esc(v.time)} · ${esc(v.dur)}</small>
        <small>${esc(v.model)} · ${esc(v.reso)}</small>
      </span>
    </button>`).join('');
  modal(`<div class="shot-hist">
    <div class="player-head">
      <div class="picker-title"><b>分镜 ${String(i+1).padStart(2,'0')} · 生成历史</b><span class="picker-sub">共 ${list.length} 个版本</span></div>
      <button type="button" onclick="closeShotHistory()">✕</button>
    </div>
    <div class="hist-body">
      <div class="hist-grid">${cards}</div>
    </div>
    <div class="hist-foot">
      <span class="hist-hint">选择历史版本后，分镜预览与合成成片会同步更新</span>
      <button class="aghost" type="button" onclick="closeShotHistory()">取消</button>
      <button class="aprimary" type="button" id="histApply">使用所选版本</button>
    </div>
  </div>`);
  bindShotHistory();
}
function bindShotHistory(){
  const sh = state.shots[state.historyShot];
  if(!sh) return;
  const versions = shotVersions(sh);
  $$('.hist-card').forEach(card=> card.onclick = ()=>{
    state.historyPick = card.dataset.vid;
    $$('.hist-card').forEach(c=> c.classList.toggle('on', c===card));
    const v = versions.find(x=>x.id===state.historyPick);
    const btn = $('#histApply');
    if(btn) btn.textContent = v ? `使用 V${v.v}` : '使用所选版本';
  });
  const apply = $('#histApply');
  if(apply) apply.onclick = ()=>{
    const v = versions.find(x=>x.id===state.historyPick);
    if(!v){ toast('请选择一个版本'); return; }
    sh.activeVersion = v.id;
    const idx = state.historyShot;
    state.historyShot = null; state.historyPick = null;
    closeModal(); renderBody();
    toast(`分镜 ${String(idx+1).padStart(2,'0')} 已切换为 V${v.v}`);
  };
}
function openShotHistory(i){
  const sh = state.shots[i];
  if(!sh || !shotVersions(sh).length){ toast('该分镜暂无生成记录'); return; }
  state.historyShot = i;
  state.historyPick = activeShotVersion(sh).id;
  renderShotHistory();
}
function closeShotHistory(){
  state.historyShot = null;
  state.historyPick = null;
  closeModal();
}
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}
function downloadPoster(src, base){
  try{
    const svg = decodeURIComponent(src.split(',')[1] || '');
    downloadBlob(new Blob([svg], {type:'image/svg+xml'}), base+'.svg');
    toast('已下载视频预览图（当前浏览器不支持视频录制）');
  }catch(e){ toast('下载失败，请重试'); }
}
function downloadClipVideo(src, base, label, seconds){
  toast('正在生成视频文件…');
  const img = new Image();
  img.onload = ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const MR = window.MediaRecorder;
    const mime = MR && MR.isTypeSupported
      ? ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=> MR.isTypeSupported(m))
      : null;
    if(!canvas.captureStream || !mime){ downloadPoster(src, base); return; }
    let rec;
    try{
      rec = new MR(canvas.captureStream(30), {mimeType:mime, videoBitsPerSecond:2500000});
    }catch(e){ downloadPoster(src, base); return; }
    const chunks = [];
    let finished = false;
    rec.ondataavailable = e=>{ if(e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = ()=>{
      if(finished) return; finished = true;
      const blob = new Blob(chunks, {type:mime.split(';')[0]});
      if(blob.size < 1024){ downloadPoster(src, base); return; }
      downloadBlob(blob, base+'.webm');
      toast('视频已下载（Demo）');
    };
    const drawCover = (scale)=>{
      const ir = img.width/img.height, cr = canvas.width/canvas.height;
      let dw, dh;
      if(ir > cr){ dh = canvas.height*scale; dw = dh*ir; }
      else { dw = canvas.width*scale; dh = dw/ir; }
      ctx.drawImage(img, (canvas.width-dw)/2, (canvas.height-dh)/2, dw, dh);
    };
    const start = performance.now();
    const draw = ()=>{
      const t = Math.min(1, (performance.now()-start)/(seconds*1000));
      ctx.fillStyle = '#080a12'; ctx.fillRect(0,0,canvas.width,canvas.height);
      drawCover(1 + t*0.035);
      ctx.fillStyle = 'rgba(10,13,24,.6)'; ctx.fillRect(0,636,canvas.width,84);
      ctx.fillStyle = '#fff'; ctx.font = '600 26px -apple-system,BlinkMacSystemFont,sans-serif';
      ctx.fillText(label, 34, 688);
      if(t < 1) requestAnimationFrame(draw);
      else if(rec.state !== 'inactive') rec.stop();
    };
    rec.start();
    draw();
    setTimeout(()=>{ if(rec.state !== 'inactive') rec.stop(); }, seconds*1000 + 800);
  };
  img.onerror = ()=> toast('视频生成失败，请重试');
  img.src = src;
}
function downloadShot(i){
  const sh = state.shots[i];
  if(!sh || !sh.done){ toast('该分镜尚未转绘'); return; }
  const v = activeShotVersion(sh);
  const no = String(i+1).padStart(2,'0');
  downloadClipVideo(shotStill(sh), `${state.project.title}_分镜${no}_V${v?v.v:1}`, `分镜 ${no} · ${sh.dur} · ${v?'V'+v.v:''}`, 1.4);
}
function startExport(fmt, r){
  const done = state.shots.filter(s=>s.done).length;
  if(fmt==='clip' && done===0){ toast('当前没有已完成转绘的分镜'); return false; }
  const label = fmt==='film' ? '分集成片' : '分镜视频片段';
  const count = fmt==='film' ? state.episodes.length : done;
  toast(`已开始导出 ${count} 个${label}（${r}）`);
  setTimeout(()=> toast(`导出完成：${count} 个${label} · ${r}`), 1100);
  return true;
}
function exportShotsDefault(){
  const r = state.project.reso === '1080P' ? '1080p' : '720p';
  startExport('film', r);
}
function bindShot(){
  const exportBtn = $('#exportShots');
  if(exportBtn) exportBtn.onclick = exportShotsDefault;
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
  $$('[data-shot-down]').forEach(b=> b.onclick = e=>{
    e.stopPropagation();
    downloadShot(+b.dataset.shotDown);
  });
  $$('[data-shot-hist]').forEach(b=> b.onclick = e=>{
    e.stopPropagation();
    openShotHistory(+b.dataset.shotHist);
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
  const cover = state.shots.find(s=>s.done) || state.shots[0];
  const beforeFrame = drawScene(cover.scene, 'orig');
  const afterFrame = cover.done ? shotStill(cover) : shotPlaceholderSVG();
  const activeVer = activeShotVersion(cover);
  const bgmFrom = state.clips[0] ? state.clips[0].name : '原片音轨';
  const player = (src, cls, bgm)=>`<div class="film-player ${cls}" data-film-play role="button" tabindex="0" aria-label="播放${cls==='before'?'转绘前原片':'合成成片'}" title="点击播放 / 暂停">
      <img src="${src}" alt="${cls==='before'?'转绘前原片':'合成成片'}">
      <span class="film-player-play">▶</span>
      ${bgm?`<span class="film-bgm" title="已迁移原片 BGM：${esc(bgmFrom)}">♪ 原片 BGM</span>`:''}
    </div>`;
  const main = state.filmCompare
    ? `<div class="film-cmp">
        <figure class="film-side">
          <figcaption><b>转绘前</b><span>原片</span></figcaption>
          ${player(beforeFrame, 'before', false)}
        </figure>
        <figure class="film-side">
          <figcaption><b>转绘后</b><span>${activeVer?'V'+activeVer.v+' · ':''}合成成片</span></figcaption>
          ${player(afterFrame, 'after', true)}
        </figure>
      </div>`
    : `<div class="film-single">${player(afterFrame, 'after', true)}</div>`;
  return `<div class="film-stage ${state.filmCompare?'is-cmp':''}">
    <div class="film-top">
      <div class="film-title">
        <b>合成成片</b>
        <span>${state.filmCompare?'转绘前 / 转绘后对比':'原片 BGM 已迁移'}</span>
      </div>
      <div class="film-tools">
        <button class="aghost ${state.filmCompare?'on':''}" id="filmCompare" type="button">⇆ ${state.filmCompare?'退出对比':'前后对比'}</button>
        <button class="aprimary" id="filmDownload" type="button">⬇ 下载成片</button>
      </div>
    </div>
    <div class="film-canvas">${main}</div>
  </div>`;
}
function downloadFilm(){
  const cover = state.shots.find(s=>s.done);
  if(!cover){ toast('请先完成分镜转绘'); return; }
  const v = activeShotVersion(cover);
  downloadClipVideo(shotStill(cover), `${state.project.title}_成片${v?'_V'+v.v:''}`, '合成成片 · 原片 BGM 已迁移', 2.4);
}
function bindFilm(){
  $$('[data-film-play]').forEach(player=>{
    const icon = $('.film-player-play', player);
    const toggle = ()=>{
      const playing = player.classList.toggle('playing');
      player.setAttribute('aria-pressed', playing ? 'true' : 'false');
      if(icon) icon.textContent = playing ? '❚❚' : '▶';
      toast(playing ? '正在播放合成成片 · 原片 BGM 已迁移' : '已暂停');
    };
    player.onclick = toggle;
    player.onkeydown = e=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }
    };
  });
  const cmp = $('#filmCompare');
  if(cmp) cmp.onclick = ()=>{ state.filmCompare = !state.filmCompare; renderBody(); };
  const dl = $('#filmDownload');
  if(dl) dl.onclick = downloadFilm;
}

/* ---- 启动 ---- */
ensureShotVersions();
render();
