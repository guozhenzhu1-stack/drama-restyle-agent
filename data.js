/* ============================================================
   转绘工作室 · 数据 & 画面生成（纯 SVG 占位，可转绘风格）
   ============================================================ */

const REGIONS = ["中国", "美国", "日本", "韩国", "英国", "加拿大", "法国", "西班牙", "墨西哥", "阿根廷", "哥伦比亚", "泰国"];
const MODELS_VIDEO = ["Seedance2.0", "Minimax H3 MAX", "Kling 1.6", "可灵 2.0"];
const MODELS_IMAGE = ["image2.5", "image2.0", "SDXL"];
const STYLES = [
  { key: "real",    name: "仿真人风格" },
  { key: "cnanime", name: "3D动漫风格" },
];
const RATIOS = ["16:9", "9:16", "4:3", "3:4", "21:9", "1:1"];
const RESOS  = ["720P", "1080P", "2K", "4K"];

/* 每种风格对画面的调色/描边策略 */
const STYLE_FX = {
  idol:    { sat: 1.08, light: 1.06, hueMix: "#ffe0c8", wash: 0.08, outline: 0,   soft: 0.5 },
  cnanime: { sat: 1.22, light: 1.10, hueMix: "#d4e2ff", wash: 0.14, outline: 1.2, soft: 0.8 },
  real:    { sat: 1.0,  light: 1.02, hueMix: "#fff0e4", wash: 0.05, outline: 0,   soft: 0 },
  anime:   { sat: 1.35, light: 1.08, hueMix: "#8fd0ff", wash: 0.18, outline: 2.2, soft: 0 },
  western: { sat: 1.6,  light: 1.12, hueMix: "#ffd23f", wash: 0.12, outline: 3.2, soft: 0 },
  korean:  { sat: 1.1,  light: 1.15, hueMix: "#ffc4d6", wash: 0.26, outline: 0.6, soft: 2.4 },
  water:   { sat: 1.0,  light: 1.1,  hueMix: "#cfe3d8", wash: 0.3,  outline: 0.4, soft: 3.2 },
};

/* ---- 颜色工具 ---- */
function hex2rgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hex(r){return '#'+r.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function mix(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return rgb2hex(A.map((v,i)=>v+(B[i]-v)*t));}
function satAdjust(h,s,l){
  let [r,g,b]=hex2rgb(h); const avg=(r+g+b)/3;
  r=(r-avg)*s+avg; g=(g-avg)*s+avg; b=(b-avg)*s+avg;
  return rgb2hex([r*l,g*l,b*l]);
}
function restyle(c, styleKey){
  const fx = STYLE_FX[styleKey] || STYLE_FX.anime;
  const f = (col) => mix(satAdjust(col, fx.sat, fx.light), fx.hueMix, fx.wash);
  return { sky1:f(c.sky1), sky2:f(c.sky2), hill:f(c.hill), ground:f(c.ground),
           sun:f(c.sun), hair:f(c.hair), skin:satAdjust(c.skin,1.02,fx.light), cloth:f(c.cloth), kind:c.kind };
}

/* ---- 画面生成：返回 SVG data URI ---- */
function sceneBG(kind, c){
  switch(kind){
    case "city": return `
      <rect x="40" y="90" width="38" height="110" fill="${mix(c.hill,'#000',.25)}"/>
      <rect x="92" y="60" width="46" height="140" fill="${c.hill}"/>
      <rect x="150" y="100" width="34" height="100" fill="${mix(c.hill,'#000',.15)}"/>
      <rect x="250" y="70" width="52" height="130" fill="${c.hill}"/>
      <rect x="312" y="104" width="40" height="96" fill="${mix(c.hill,'#000',.25)}"/>
      ${[0,1,2,3,4,5].map(r=>[100,160,258,320].map(x=>`<rect x="${x+6}" y="${70+r*18}" width="7" height="9" fill="#ffe9a8" opacity=".7"/>`).join('')).join('')}`;
    case "room": return `
      <rect x="60" y="60" width="150" height="100" rx="6" fill="${mix(c.sky1,'#fff',.35)}" opacity=".9"/>
      <line x1="135" y1="60" x2="135" y2="160" stroke="${mix(c.hill,'#000',.2)}" stroke-width="4"/>
      <line x1="60" y1="110" x2="210" y2="110" stroke="${mix(c.hill,'#000',.2)}" stroke-width="4"/>
      <rect x="250" y="120" width="110" height="80" rx="8" fill="${mix(c.hill,'#000',.1)}"/>`;
    case "cafe": return `
      <rect x="40" y="70" width="320" height="70" rx="6" fill="${mix(c.hill,'#000',.1)}"/>
      ${[70,150,230,300].map(x=>`<rect x="${x}" y="80" width="46" height="50" rx="4" fill="${mix(c.sky1,'#fff',.4)}" opacity=".85"/>`).join('')}
      <rect x="150" y="150" width="120" height="50" rx="10" fill="${mix(c.hill,'#000',.22)}"/>`;
    case "street": return `
      <polygon points="0,200 160,120 240,120 400,200" fill="${mix(c.ground,'#000',.12)}"/>
      <rect x="30" y="80" width="80" height="120" fill="${c.hill}"/>
      <rect x="290" y="70" width="90" height="130" fill="${mix(c.hill,'#000',.15)}"/>
      <line x1="200" y1="128" x2="200" y2="200" stroke="#ffe9a8" stroke-width="3" stroke-dasharray="8 8" opacity=".6"/>`;
    default: return `
      <polygon points="0,150 120,90 230,150" fill="${c.hill}"/>
      <polygon points="170,150 280,80 400,150" fill="${mix(c.hill,'#000',.18)}"/>`;
  }
}
function character(c, outline){
  const o = outline>0?`stroke="${mix(c.cloth,'#000',.55)}" stroke-width="${outline}"`:'';
  return `
    <g ${o}>
      <rect x="168" y="150" width="64" height="70" rx="20" fill="${c.cloth}"/>
      <path d="M176 118 q24 -34 48 0 l6 36 q-30 14 -60 0 z" fill="${c.hair}"/>
      <circle cx="200" cy="128" r="22" fill="${c.skin}"/>
      <path d="M180 116 q20 -20 40 0 q-4 -18 -20 -18 q-16 0 -20 18z" fill="${c.hair}"/>
    </g>`;
}
function drawScene(c, mode, styleKey){
  const col = mode === 'new' ? restyle(c, styleKey) : c;
  const fx = STYLE_FX[styleKey] || STYLE_FX.anime;
  const blur = (mode==='new' && fx.soft) ? `<filter id="b"><feGaussianBlur stdDeviation="${fx.soft}"/></filter>` : '';
  const grp  = (mode==='new' && fx.soft) ? 'filter="url(#b)"' : '';
  const outline = mode==='new' ? fx.outline : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${col.sky1}"/><stop offset="1" stop-color="${col.sky2}"/>
    </linearGradient>${blur}</defs>
    <g ${grp}>
    <rect width="400" height="240" fill="url(#s)"/>
    <circle cx="320" cy="56" r="26" fill="${col.sun}" opacity=".85"/>
    ${sceneBG(col.kind, col)}
    <rect y="200" width="400" height="40" fill="${col.ground}"/>
    ${character(col, outline)}
    </g></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ---- 分镜视频占位图（待转绘）---- */
function shotPlaceholderSVG(){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#272c3f"/><stop offset="1" stop-color="#141824"/>
      </linearGradient>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" fill="none" stroke="#ffffff" stroke-opacity=".055"/>
      </pattern>
    </defs>
    <rect width="400" height="240" fill="url(#pg)"/>
    <rect width="400" height="240" fill="url(#grid)"/>
    <g transform="translate(200 102)">
      <rect x="-54" y="-39" width="108" height="78" rx="13" fill="#0f1220" stroke="#68718d" stroke-width="2" stroke-dasharray="7 6"/>
      <circle cx="0" cy="0" r="18" fill="#8f99b5" opacity=".16"/>
      <path d="M-5 -10 L11 0 L-5 10 Z" fill="#a5aec6"/>
    </g>
    <text x="200" y="166" text-anchor="middle" fill="#939bb3" font-size="14" font-family="sans-serif">分镜视频待转绘</text>
    <text x="200" y="188" text-anchor="middle" fill="#5e6680" font-size="11" font-family="sans-serif">转绘完成后可查看原片效果对比</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ---- 人物肖像（资产卡缩略图）---- */
function portraitSVG(c, mode, styleKey){
  const col = mode==='new' ? restyle(c, styleKey||'idol') : c;
  const bg1 = mix(col.sky1,'#ffffff',.3), bg2 = mix(col.cloth,'#ffffff',.45);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#pg)"/>
    <path d="M60 300 q0 -70 90 -70 q90 0 90 70z" fill="${col.cloth}"/>
    <rect x="128" y="170" width="44" height="52" rx="14" fill="${col.skin}"/>
    <path d="M96 150 q6 -70 54 -70 q48 0 54 70 l4 44 q-58 26 -116 0z" fill="${col.hair}"/>
    <circle cx="150" cy="150" r="46" fill="${col.skin}"/>
    <path d="M104 142 q46 -40 92 0 q-8 -42 -46 -42 q-38 0 -46 42z" fill="${col.hair}"/>
    <circle cx="133" cy="150" r="4.5" fill="#2a2320"/><circle cx="167" cy="150" r="4.5" fill="#2a2320"/>
    <path d="M140 172 q10 8 20 0" stroke="${mix(col.skin,'#000',.3)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
/* 道具小图 */
function propSVG(c, mode, styleKey){
  const col = mode==='new' ? restyle(c, styleKey||'idol') : c;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${mix(col.sky1,'#fff',.4)}"/>
    <ellipse cx="150" cy="210" rx="70" ry="14" fill="rgba(0,0,0,.08)"/>
    <rect x="112" y="120" width="76" height="80" rx="16" fill="${col.cloth}"/>
    <rect x="124" y="100" width="52" height="30" rx="10" fill="${mix(col.cloth,'#fff',.25)}"/>
    <circle cx="150" cy="150" r="20" fill="${mix(col.sun,'#fff',.3)}"/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
/* ---- 封面图：电影感渐变 + 逆光人像剪影（历史创作缩略图）---- */
const COVER_PAL = {
  real:    ['#22304f','#5572a3','#d8c3ad'],
  idol:    ['#3a2a4e','#8f6fb0','#f3cbda'],
  anime:   ['#123a63','#2f8fd0','#a9e4ff'],
  korean:  ['#5a2f4e','#c87ea0','#ffdbe6'],
  cnanime: ['#1d3150','#5d84bd','#d3e3ff'],
  western: ['#5a3a12','#d9922f','#ffdd7a'],
};
function coverSVG(styleKey, v){
  const p = COVER_PAL[styleKey] || COVER_PAL.real; v = v || 0;
  const hx = 200 + (v % 3 - 1) * 28;
  const b1 = (v % 2) ? 300 : 110, b2 = (v % 2) ? 100 : 320;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p[0]}"/><stop offset=".55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>
      <radialGradient id="gl" cx="50%" cy="24%" r="62%">
        <stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="si" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#140f28" stop-opacity=".52"/><stop offset="1" stop-color="#140f28" stop-opacity=".12"/></linearGradient>
      <radialGradient id="vg" cx="50%" cy="44%" r="75%">
        <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>
      <filter id="sb"><feGaussianBlur stdDeviation="18"/></filter></defs>
    <rect width="400" height="520" fill="url(#bg)"/>
    <circle cx="${b1}" cy="130" r="95" fill="#fff" opacity=".16" filter="url(#sb)"/>
    <circle cx="${b2}" cy="380" r="78" fill="${p[2]}" opacity=".3" filter="url(#sb)"/>
    <rect width="400" height="520" fill="url(#gl)"/>
    <g fill="url(#si)"><path d="M${hx-132} 520 C ${hx-132} 408 ${hx-72} 356 ${hx} 348 C ${hx+72} 356 ${hx+132} 408 ${hx+132} 520 Z"/>
      <ellipse cx="${hx}" cy="194" rx="56" ry="66"/></g>
    <path d="M${hx-56} 188 a56 66 0 0 1 112 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3"/>
    <rect width="400" height="520" fill="url(#vg)"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const SC = {
  snowHall:{sky1:"#4a5468",sky2:"#7b6f74",hill:"#39404f",ground:"#2b2f38",sun:"#e8d2b0",hair:"#241f1b",skin:"#eccdb2",cloth:"#3a3f52",kind:"city"},
  hall:    {sky1:"#caa96f",sky2:"#efdcae",hill:"#8a6a44",ground:"#6b4e30",sun:"#ffe6a8",hair:"#241f1b",skin:"#eccdb2",cloth:"#7d5a40",kind:"room"},
  bedroom: {sky1:"#c9b79c",sky2:"#efe3cf",hill:"#9a8468",ground:"#6b5848",sun:"#f6e3b0",hair:"#2a2320",skin:"#edcdb2",cloth:"#9a6f78",kind:"room"},
  corridor:{sky1:"#8fa4c4",sky2:"#d6dae6",hill:"#6a7488",ground:"#4a4e5a",sun:"#e8eef8",hair:"#241f1b",skin:"#eccdb2",cloth:"#d8d2c8",kind:"street"},
  city:    {sky1:"#5b6b8a",sky2:"#c98a6b",hill:"#39404f",ground:"#2b2f38",sun:"#f4b26a",hair:"#2a2622",skin:"#e8c3a6",cloth:"#7d4a52",kind:"city"},
};

/* ---- 原片素材 ---- */
const CLIPS = [
  { id:"c1", name:"第一集", dur:"00:05", scene:SC.bedroom },
  { id:"c2", name:"第二集", dur:"00:05", scene:SC.bedroom },
  { id:"c3", name:"第三集", dur:"00:05", scene:SC.bedroom },
  { id:"c4", name:"第四集", dur:"00:05", scene:SC.bedroom },
];

/* ---- 分集 ---- */
const EP_TITLES = ["她死在那个雨夜","回到两年前","离婚不是开玩笑","闺蜜的眼泪","收回属于我的股份","迟来的道歉","她不再回头","闺蜜的第二张面孔","被藏起来的真相","属于她的股份","董事会上的反击","谁才是真正的敌人","一段被删掉的记忆","温柔背后的刀","这一次，轮到我","雨夜里的陌生人","那场事故不简单","消失的行车记录","唯一的目击者","有人比她更恨他","母亲留下的信","被篡改的遗嘱","她亲手设下的局","证人突然改口","幕后还有一人","一夜之间的翻盘"];
const EPISODES = EP_TITLES.map((t,i)=>({ id:"ep"+(i+1), no:i+1, title:t }));

/* ---- 剧本本土化（Demo 多语种剧本） ---- */
const SCRIPT_LANGS = {
  zh: { tag:"ZH", name:"中文" },
  en: { tag:"EN", name:"English" },
  ja: { tag:"JA", name:"日本語" },
  ko: { tag:"KO", name:"한국어" },
  es: { tag:"ES", name:"Español" },
};
/* 目标地区 → 剧本语种；法国、泰国等暂以英文通用稿兜底 */
function regionLang(region){
  region = region || "";
  if(/中国/.test(region)) return "zh";
  if(/日本/.test(region)) return "ja";
  if(/韩国/.test(region)) return "ko";
  if(/西班牙|墨西哥|阿根廷|哥伦比亚/.test(region)) return "es";
  return "en";
}
/* 人名本地化：同一个人物在不同市场使用对应称呼；zhOf 为本土化名字的中文回译 */
const SCRIPT_CAST = {
  szy: { zh:"沈知意", role:"女主", en:"Vivian Shen", ja:"神崎 澪",  ko:"서지안", es:"Vivian Shen",
         zhOf:{ en:"薇薇安·沈", ja:"神崎澪", ko:"徐智安", es:"薇薇安·沈" } },
  ljq: { zh:"林嘉琪", role:"男主", en:"Jason Lin",   ja:"柏木 玲二", ko:"임재현", es:"Jason Lin",
         zhOf:{ en:"杰森·林", ja:"柏木玲二", ko:"林载贤", es:"杰森·林" } },
};
/* 剧名/分集标题本土化（页面上与中文原名对照展示） */
const PROJECT_TITLE_I18N = {
  "重生之不再爱了": {
    en:"Reborn, I No Longer Love You",
    ja:"生まれ変わったら、もう愛さない",
    ko:"다시 태어나도, 더는 사랑하지 않아",
    es:"Renacida, Ya No Te Amo",
  },
};
const EP_TITLE_I18N = {
  "她死在那个雨夜": { en:"She Died on That Rainy Night", ja:"彼女はあの雨の夜に死んだ", ko:"그녀는 그 비 오는 밤에 죽었다", es:"Ella murió esa noche de lluvia" },
  "回到两年前": { en:"Back to Two Years Ago", ja:"二年前へ", ko:"2년 전으로", es:"De vuelta a dos años atrás" },
  "离婚不是开玩笑": { en:"Divorce Is No Joke", ja:"離婚は冗談じゃない", ko:"이혼은 농담이 아니다", es:"El divorcio no es un juego" },
  "闺蜜的眼泪": { en:"A Best Friend's Tears", ja:"親友の涙", ko:"절친의 눈물", es:"Las lágrimas de una amiga" },
  "收回属于我的股份": { en:"Taking Back My Shares", ja:"私の株を取り戻す", ko:"내 지분을 되찾다", es:"Recuperar mis acciones" },
  "迟来的道歉": { en:"A Late Apology", ja:"遅すぎた謝罪", ko:"뒤늦은 사과", es:"Una disculpa tardía" },
  "她不再回头": { en:"She Won't Look Back", ja:"彼女はもう振り返らない", ko:"그녀는 돌아보지 않는다", es:"Ella no volverá a mirar atrás" },
  "闺蜜的第二张面孔": { en:"The Best Friend's Second Face", ja:"親友のもう一つの顔", ko:"절친의 두 번째 얼굴", es:"La segunda cara de la amiga" },
  "被藏起来的真相": { en:"The Hidden Truth", ja:"隠された真実", ko:"감춰진 진실", es:"La verdad oculta" },
  "属于她的股份": { en:"The Shares That Belong to Her", ja:"彼女に属する株", ko:"그녀의 몫인 지분", es:"Las acciones que le pertenecen" },
  "董事会上的反击": { en:"Counterattack at the Board Meeting", ja:"取締役会での反撃", ko:"이사회에서의 반격", es:"Contraataque en la junta" },
  "谁才是真正的敌人": { en:"Who Is the Real Enemy", ja:"本当の敵は誰か", ko:"진짜 적은 누구인가", es:"¿Quién es el verdadero enemigo?" },
  "一段被删掉的记忆": { en:"A Deleted Memory", ja:"消された記憶", ko:"지워진 기억", es:"Un recuerdo borrado" },
  "温柔背后的刀": { en:"The Knife Behind the Tenderness", ja:"優しさの裏の刃", ko:"다정함 뒤의 칼", es:"El cuchillo tras la ternura" },
  "这一次，轮到我": { en:"This Time, It's My Turn", ja:"今度は、私の番", ko:"이번엔 내 차례", es:"Esta vez, me toca a mí" },
  "雨夜里的陌生人": { en:"The Stranger in the Rain", ja:"雨の夜の見知らぬ人", ko:"비 오는 밤의 낯선 사람", es:"El extraño en la noche de lluvia" },
  "那场事故不简单": { en:"That Accident Was No Accident", ja:"あの事故は単純じゃない", ko:"그 사고는 단순하지 않다", es:"Ese accidente no fue casualidad" },
  "消失的行车记录": { en:"The Missing Dashcam Footage", ja:"消えたドライブレコーダー", ko:"사라진 블랙박스", es:"La grabación que desapareció" },
  "唯一的目击者": { en:"The Only Witness", ja:"唯一の目撃者", ko:"유일한 목격자", es:"El único testigo" },
  "有人比她更恨他": { en:"Someone Hates Him More Than She Does", ja:"彼女以上に彼を恨む人", ko:"그녀보다 그를 더 미워하는 사람", es:"Alguien lo odia más que ella" },
  "母亲留下的信": { en:"The Letter from Her Mother", ja:"母が残した手紙", ko:"어머니가 남긴 편지", es:"La carta de su madre" },
  "被篡改的遗嘱": { en:"The Tampered Will", ja:"改ざんされた遺言状", ko:"조작된 유언장", es:"El testamento manipulado" },
  "她亲手设下的局": { en:"The Trap She Set Herself", ja:"彼女が自ら仕掛けた罠", ko:"그녀가 직접 꾸민 함정", es:"La trampa que ella misma tendió" },
  "证人突然改口": { en:"The Witness Changes Her Story", ja:"証人が突然の証言変更", ko:"증인의 돌연한 진술 번복", es:"El testigo cambia su declaración" },
  "幕后还有一人": { en:"Someone Else Behind the Scenes", ja:"黒幕はもう一人いる", ko:"배후에 또 한 사람", es:"Hay alguien más detrás" },
  "一夜之间的翻盘": { en:"A Reversal Overnight", ja:"一夜にしての逆転", ko:"하룻밤 사이의 역전", es:"Un vuelco de la noche a la mañana" },
};
function epTitleI18n(ep, lang){
  const m = EP_TITLE_I18N[ep.title];
  return (m && m[lang]) || ep.title;
}
function projectTitleI18n(title, lang){
  const m = PROJECT_TITLE_I18N[title];
  return (m && m[lang]) || title;
}
/* 场次素材池：按目标语种提供成套本土化文本 */
const SCRIPT_SCENES = [
  {
    head:{ zh:"主卧 · 夜 · 内", en:"MASTER BEDROOM · NIGHT · INT.", ja:"主寝室・夜・室内", ko:"안방 · 밤 · 실내", es:"DORMITORIO PRINCIPAL · NOCHE · INTERIOR" },
    action:{
      zh:"窗外暴雨如注。沈知意独自站在落地窗前，手机屏幕亮起又暗下。",
      en:"Rain hammers the windows. Vivian stands alone at the glass wall; her phone lights up, then goes dark.",
      ja:"窓の外は激しい雨。神崎澪は一人、床一面の窓辺に立っている。スマホの画面が光っては消える。",
      ko:"창밖엔 폭우가 쏟아진다. 서지안은 홀로 통창 앞에 서 있고, 휴대폰 화면이 켜졌다 꺼진다.",
      es:"La lluvia golpea las ventanas. Vivian está sola frente al ventanal; su teléfono se ilumina y se apaga.",
    },
    actionZh:{
      en:"窗外暴雨如注。薇薇安独自站在落地窗前，手机屏幕亮起又暗下。",
      ja:"窗外暴雨如注。神崎澪独自站在整面落地窗前，手机屏幕亮起又暗下。",
      ko:"窗外暴雨如注。徐智安独自站在落地窗前，手机屏幕亮起又暗下。",
      es:"窗外暴雨如注。薇薇安独自站在落地窗前，手机屏幕亮起又暗下。",
    },
    lines:[
      { who:"szy", t:{
        zh:"“两年前的今天，我签下了那份离婚协议。”",
        en:"\"Two years ago today, I signed those divorce papers.\"",
        ja:"「二年前の今日、私はあの離婚届にサインした。」",
        ko:"\"2년 전 오늘, 나는 그 이혼 서류에 서명했어.\"",
        es:"\"Hoy hace dos años firmé aquellos papeles del divorcio.\"",
      }, tZh:{
        en:"“两年前的今天，我签下了那份离婚协议。”",
        ja:"“两年前的今天，我在那份离婚协议上签了字。”",
        ko:"“两年前的今天，我在那份离婚文件上签了字。”",
        es:"“两年前的今天，我签下了那些离婚文件。”",
      }},
      { who:"ljq", t:{
        zh:"“知意，你都知道了。”",
        en:"\"Vivian… so you know everything now.\"",
        ja:"「澪……全部、知ったのか。」",
        ko:"\"지안아… 이제 다 알았구나.\"",
        es:"\"Vivian… así que ya lo sabes todo.\"",
      }, tZh:{
        en:"“薇薇安……原来你全都知道了。”",
        ja:"“澪……你全都知道了啊。”",
        ko:"“智安……现在你全知道了啊。”",
        es:"“薇薇安……原来你全都知道了。”",
      }},
    ],
  },
  {
    head:{ zh:"客厅 · 日 · 内", en:"LIVING ROOM · DAY · INT.", ja:"リビング・昼・室内", ko:"거실 · 낮 · 실내", es:"SALÓN · DÍA · INTERIOR" },
    action:{
      zh:"礼服和文件散落一地，林嘉琪整理着西装袖口，语气平静得可怕。",
      en:"A torn dress and scattered papers cover the floor. Jason straightens his cuff, his voice unnervingly calm.",
      ja:"ドレスと書類が床に散らばる。玲二は袖口を整え、不気味なほど静かな声で言う。",
      ko:"드레스와 서류가 바닥에 흩어져 있다. 임재현은 소매를 정리하며 무섭도록 차분하게 말한다.",
      es:"Un vestido roto y papeles cubren el suelo. Jason se ajusta el puño, con una calma inquietante.",
    },
    actionZh:{
      en:"礼服与文件散落一地。杰森整理着西装袖口，语气平静得令人发慌。",
      ja:"礼服与文件散落一地。玲二整理着袖口，用令人发慌的平静语气开口。",
      ko:"礼服与文件散落一地。载贤整理着袖口，语气平静得令人发毛。",
      es:"礼服与文件散落一地。杰森整理着袖口，平静得令人不安。",
    },
    lines:[
      { who:"ljq", t:{
        zh:"“离婚不是开玩笑，协议已经生效了。”",
        en:"\"The divorce isn't a joke. The papers are already in effect.\"",
        ja:"「離婚は冗談じゃない。もう効力は発生している。」",
        ko:"\"이혼은 농담이 아니야. 이미 효력이 발생했어.\"",
        es:"\"El divorcio no es una broma. Los papeles ya están en vigor.\"",
      }, tZh:{
        en:"“离婚不是玩笑，协议已经生效了。”",
        ja:"“离婚不是玩笑。手续已经生效了。”",
        ko:"“离婚不是玩笑。已经生效了。”",
        es:"“离婚不是玩笑。文件已经生效。”",
      }},
      { who:"szy", t:{
        zh:"“那我也告诉你，游戏才刚开始。”",
        en:"\"Then let me tell you—the game has just begun.\"",
        ja:"「なら教えてあげる。ゲームは始まったばかりよ。」",
        ko:"\"그럼 알려줄게. 게임은 이제 시작이야.\"",
        es:"\"Entonces te digo algo: el juego acaba de empezar.\"",
      }, tZh:{
        en:"“那我就告诉你——游戏才刚刚开始。”",
        ja:"“那我就告诉你。游戏才刚开始。”",
        ko:"“那我也告诉你。游戏才刚开始。”",
        es:"“那我也告诉你：游戏才刚开始。”",
      }},
    ],
  },
  {
    head:{ zh:"宴会厅 · 夜 · 内", en:"BANQUET HALL · NIGHT · INT.", ja:"宴会場・夜・室内", ko:"연회장 · 밤 · 실내", es:"SALÓN DE BANQUETES · NOCHE · INTERIOR" },
    action:{
      zh:"水晶灯下宾客云集，耳语在沈知意经过时戛然而止。",
      en:"Under the chandeliers the guests murmur; the whispers die the moment Vivian passes.",
      ja:"シャンデリアの下、客たちの囁きが澪の前でぴたりと止む。",
      ko:"샹들리에 아래, 손님들의 속삭임이 지안이 지나가자 뚝 그친다.",
      es:"Bajo las lámparas de cristal los invitados murmuran; los susurros callan al pasar Vivian.",
    },
    actionZh:{
      en:"水晶灯下宾客云集，低声议论在薇薇安经过时戛然而止。",
      ja:"水晶灯下宾客云集，窃窃私语在澪经过时戛然而止。",
      ko:"水晶灯下宾客云集，窃窃私语在智安经过时戛然而止。",
      es:"水晶灯下宾客云集，低声议论在薇薇安经过时戛然而止。",
    },
    lines:[
      { who:"ljq", t:{
        zh:"“今晚之后，沈家的一切都跟你没关系了。”",
        en:"\"After tonight, nothing of the Shen family will be yours.\"",
        ja:"「今夜を境に、沈家のものは何ひとつ君のものじゃない。」",
        ko:"\"오늘 밤을 기점으로 선가의 그 무엇도 네 것이 아니야.\"",
        es:"\"A partir de esta noche, nada de la familia Shen será tuyo.\"",
      }, tZh:{
        en:"“今晚之后，沈家的一切都与你无关了。”",
        ja:"“从今晚起，沈家的任何东西都不再属于你。”",
        ko:"“过了今晚，沈家的任何东西都不再是你的。”",
        es:"“从今晚起，沈家的一切都不再属于你。”",
      }},
      { who:"szy", t:{
        zh:"“属于我的东西，我会一件一件拿回来。”",
        en:"\"Everything that's mine, I'll take back—one piece at a time.\"",
        ja:"「私のものは、一つずつ取り戻すわ。」",
        ko:"\"내 것은 하나씩 되찾을 거야.\"",
        es:"\"Todo lo que es mío lo recuperaré, pieza por pieza.\"",
      }, tZh:{
        en:"“属于我的东西，我会一件一件拿回来。”",
        ja:"“属于我的东西，我会一件一件拿回来。”",
        ko:"“属于我的东西，我会一件一件拿回来。”",
        es:"“属于我的一切，我会一件一件拿回来。”",
      }},
    ],
  },
  {
    head:{ zh:"咖啡厅 · 日 · 内", en:"CAFÉ · DAY · INT.", ja:"カフェ・昼・室内", ko:"카페 · 낮 · 실내", es:"CAFETERÍA · DÍA · INTERIOR" },
    action:{
      zh:"林嘉琪把一份文件推过桌面，咖啡上的热气缓缓散开。",
      en:"Jason slides a folder across the table; steam curls off the coffee and fades.",
      ja:"玲二が書類をテーブルの向こうへ押し出す。コーヒーの湯気がゆっくりと消えていく。",
      ko:"임재현이 서류를 탁자 너머로 밀어낸다. 커피의 김이 천천히 흩어진다.",
      es:"Jason desliza una carpeta sobre la mesa; el vapor del café se desvanece despacio.",
    },
    actionZh:{
      en:"杰森把一份文件推过桌面，咖啡的热气缓缓散开。",
      ja:"玲二把文件推到桌子对面，咖啡的热气缓缓消散。",
      ko:"载贤把文件推过桌面，咖啡的热气缓缓散开。",
      es:"杰森把一份文件夹推过桌面；咖啡的热气缓缓消散。",
    },
    lines:[
      { who:"ljq", t:{
        zh:"“签字吧，对你我都好。”",
        en:"\"Just sign it. It's better for both of us.\"",
        ja:"「サインしてくれ。お互いのためだ。」",
        ko:"\"서명해. 우리 둘 다를 위해서야.\"",
        es:"\"Firma. Es mejor para los dos.\"",
      }, tZh:{
        en:"“签了吧，对我们两个都好。”",
        ja:"“签了吧。这对我们都好。”",
        ko:"“签字吧。对我们俩都好。”",
        es:"“签吧。对我们两个都好。”",
      }},
      { who:"szy", t:{
        zh:"“你确定，这是你想要的结局？”",
        en:"\"Are you sure this is the ending you want?\"",
        ja:"「これが本当に、望んだ結末なの？」",
        ko:"\"이게 네가 원한 결말이 확실해?\"",
        es:"\"¿Seguro que es el final que quieres?\"",
      }, tZh:{
        en:"“你确定，这就是你想要的结局？”",
        ja:"“这真的是你想要的结局吗？”",
        ko:"“你确定这就是你想要的结局？”",
        es:"“你确定这就是你想要的结局？”",
      }},
    ],
  },
  {
    head:{ zh:"董事会 · 日 · 内", en:"BOARDROOM · DAY · INT.", ja:"取締役会・昼・室内", ko:"이사회 · 낮 · 실내", es:"SALA DEL CONSEJO · DÍA · INTERIOR" },
    action:{
      zh:"长桌尽头，沈知意将股权文件推到董事们面前。",
      en:"At the head of the long table, Vivian slides the share certificates toward the board.",
      ja:"長テーブルの端で、澪が株券の書類を取締役たちの前へ押し出す。",
      ko:"긴 탁자 끝에서 지안이 주식 문서를 이사들 앞으로 밀어낸다.",
      es:"Al frente de la larga mesa, Vivian desliza los títulos accionarios hacia el consejo.",
    },
    actionZh:{
      en:"长桌尽头，薇薇安将股权文件推到董事们面前。",
      ja:"长桌尽头，澪将股权文件推到董事们面前。",
      ko:"长桌尽头，智安将股权文件推到董事们面前。",
      es:"长桌尽头，薇薇安将股权凭证推到董事们面前。",
    },
    lines:[
      { who:"szy", t:{
        zh:"“从今天起，我持有公司百分之五十一的股份。”",
        en:"\"As of today, I hold fifty-one percent of this company.\"",
        ja:"「今日から、私がこの会社の51パーセントを保有する。」",
        ko:"\"오늘부터 내가 이 회사의 51퍼센트를 보유해.\"",
        es:"\"A partir de hoy poseo el cincuenta y uno por ciento de esta empresa.\"",
      }, tZh:{
        en:"“从今天起，我持有这家公司百分之五十一的股份。”",
        ja:"“从今天起，我将持有这家公司百分之五十一的股份。”",
        ko:"“从今天起，我持有这家公司百分之五十一的股份。”",
        es:"“从今天起，我拥有这家公司百分之五十一的股份。”",
      }},
      { who:"ljq", t:{
        zh:"“你疯了……这些股份从哪来的？”",
        en:"\"You're insane… where did those shares come from?\"",
        ja:"「正気か……その株はどこから？」",
        ko:"\"미쳤어… 그 주식은 어디서 난 거야?\"",
        es:"\"¿Estás loca… de dónde salieron esas acciones?\"",
      }, tZh:{
        en:"“你疯了……这些股份是从哪来的？”",
        ja:"“你疯了吗……这些股份是从哪里来的？”",
        ko:"“你疯了吧……这些股份是哪儿来的？”",
        es:"“你疯了……这些股份是从哪来的？”",
      }},
    ],
  },
  {
    head:{ zh:"雨夜街头 · 夜 · 外", en:"RAIN-SOAKED STREET · NIGHT · EXT.", ja:"雨の街路・夜・屋外", ko:"비 내리는 거리 · 밤 · 실외", es:"CALLE BAJO LA LLUVIA · NOCHE · EXTERIOR" },
    action:{
      zh:"车灯刺破雨幕，尖锐的刹车声后，一切安静下来。",
      en:"Headlights tear through the rain. A screech of brakes—then silence.",
      ja:"ヘッドライトが雨を裂く。鋭いブレーキ音のあと、静寂が訪れる。",
      ko:"헤드라이트가 빗줄기를 가른다. 날카로운 제동음 뒤, 모든 것이 조용해진다.",
      es:"Los faros rasgan la lluvia. Un chillido de frenos; luego, silencio.",
    },
    actionZh:{
      en:"车灯刺破雨幕。尖锐的刹车声后，一切归于寂静。",
      ja:"车灯划破雨幕。尖锐的刹车声之后，一片寂静。",
      ko:"车灯划破雨幕。尖锐的刹车声后，一切归于寂静。",
      es:"车灯划破雨幕。一阵刺耳的刹车声后，只剩寂静。",
    },
    lines:[
      { who:"szy", t:{
        zh:"“那场事故，从来都不是意外。”",
        en:"\"That accident was never an accident.\"",
        ja:"「あの事故は、決して偶然なんかじゃなかった。」",
        ko:"\"그 사고는 결코 우연이 아니었어.\"",
        es:"\"Ese accidente nunca fue un accidente.\"",
      }, tZh:{
        en:"“那场事故，从来都不是意外。”",
        ja:"“那场事故，绝不是偶然。”",
        ko:"“那场事故，绝不是偶然。”",
        es:"“那场事故从来都不是意外。”",
      }},
      { who:"ljq", t:{
        zh:"“如果她知道真相，一切都会毁掉。”",
        en:"\"If she ever learns the truth, everything falls apart.\"",
        ja:"「彼女が真実を知れば、すべてが崩れる。」",
        ko:"\"그녀가 진실을 알게 되면, 모든 게 무너져.\"",
        es:"\"Si ella llega a saber la verdad, todo se derrumba.\"",
      }, tZh:{
        en:"“如果她知道了真相，一切都会崩塌。”",
        ja:"“她若知道真相，一切都会崩塌。”",
        ko:"“她要是知道真相，一切都会垮掉。”",
        es:"“如果她得知真相，一切都会崩塌。”",
      }},
    ],
  },
  {
    head:{ zh:"病房 · 日 · 内", en:"HOSPITAL ROOM · DAY · INT.", ja:"病室・昼・室内", ko:"병실 · 낮 · 실내", es:"HABITACIÓN DE HOSPITAL · DÍA · INTERIOR" },
    action:{
      zh:"阳光落在病床边的旧信封上，信封上是母亲的字迹。",
      en:"Sunlight falls on an old envelope beside the bed, addressed in her mother's hand.",
      ja:"病床脇の古い封筒に日差しが落ちる。差出人は母の筆跡。",
      ko:"병상 옆 낡은 봉투 위로 햇살이 내린다. 봉투에는 어머니의 필체가 있다.",
      es:"La luz cae sobre un viejo sobre junto a la cama, escrito por su madre.",
    },
    actionZh:{
      en:"阳光落在病床边的旧信封上，信封上是母亲的字迹。",
      ja:"阳光落在病床旁的旧信封上。寄信人是母亲的字迹。",
      ko:"阳光落在病床旁旧信封上，上面是母亲的笔迹。",
      es:"阳光落在床边一只旧信封上，上面是母亲的字迹。",
    },
    lines:[
      { who:"szy", t:{
        zh:"“妈，你留下的信，我终于看懂了。”",
        en:"\"Mom… I finally understand the letter you left me.\"",
        ja:"「お母さん、あなたが残した手紙、やっと分かった。」",
        ko:"\"엄마, 네가 남긴 편지를 이제야 이해했어.\"",
        es:"\"Mamá… por fin entiendo la carta que me dejaste.\"",
      }, tZh:{
        en:"“妈妈……你留下的信，我终于看懂了。”",
        ja:"“妈妈，你留下的信，我终于明白了。”",
        ko:"“妈妈，你留下的信，我现在终于懂了。”",
        es:"“妈妈……你留下的信，我终于看懂了。”",
      }},
      { who:"ljq", t:{
        zh:"“那封信……你不该看的。”",
        en:"\"That letter… you shouldn't have read it.\"",
        ja:"「その手紙は……読むべきじゃなかった。」",
        ko:"\"그 편지는… 읽지 말았어야 했어.\"",
        es:"\"Esa carta… no debiste leerla.\"",
      }, tZh:{
        en:"“那封信……你不该读的。”",
        ja:"“那封信……你不该读的。”",
        ko:"“那封信……你不该看的。”",
        es:"“那封信……你不该读的。”",
      }},
    ],
  },
  {
    head:{ zh:"天台 · 黄昏 · 外", en:"ROOFTOP · DUSK · EXT.", ja:"屋上・夕暮れ・屋外", ko:"옥상 · 황혼 · 실외", es:"AZOTEA · ATARDECER · EXTERIOR" },
    action:{
      zh:"城市在脚下亮起灯，风吹起沈知意的长发。",
      en:"The city lights up below; the wind lifts Vivian's hair.",
      ja:"足元に街の灯がともり、風が澪の髪を揺らす。",
      ko:"발아래 도시의 불빛이 켜지고, 바람이 지안의 머리카락을 흩날린다.",
      es:"La ciudad se enciende abajo; el viento agita el cabello de Vivian.",
    },
    actionZh:{
      en:"城市在脚下亮起灯火，风吹起薇薇安的长发。",
      ja:"脚下城市灯火亮起，风拂动澪的长发。",
      ko:"脚下城市灯火亮起，风吹起智安的长发。",
      es:"城市在脚下亮起灯来；风拂动薇薇安的长发。",
    },
    lines:[
      { who:"szy", t:{
        zh:"“这次，我要自己做选择。”",
        en:"\"This time, I make my own choice.\"",
        ja:"「今度は、私自身が選ぶ。」",
        ko:"\"이번엔 내가 직접 선택할 거야.\"",
        es:"\"Esta vez, elijo yo.\"",
      }, tZh:{
        en:"“这一次，我要自己做选择。”",
        ja:"“这一次，我要亲自选择。”",
        ko:"“这一次，我要自己选择。”",
        es:"“这一次，由我来选。”",
      }},
      { who:"ljq", t:{
        zh:"“知意，别让仇恨毁了你。”",
        en:"\"Vivian, don't let revenge destroy you.\"",
        ja:"「澪、憎しみに自分を壊させるな。」",
        ko:"\"지안아, 증오가 너를 망치게 두지 마.\"",
        es:"\"Vivian, no dejes que el odio te destruya.\"",
      }, tZh:{
        en:"“薇薇安，别让仇恨毁了你。”",
        ja:"“澪，别让憎恨毁了你。”",
        ko:"“智安，别让仇恨毁了你。”",
        es:"“薇薇安，别让仇恨毁了你。”",
      }},
    ],
  },
];
/* 每集从素材池连续取 4 场，按集数轮转，保证相邻集内容不同 */
const SCRIPT_SCENES_PER_EP = 4;
const EP_SCRIPTS = EPISODES.map((ep,i)=>{
  const start = (i * 3) % SCRIPT_SCENES.length;
  return {
    ...ep,
    scenes: [...Array(SCRIPT_SCENES_PER_EP)].map((_,k)=> SCRIPT_SCENES[(start + k) % SCRIPT_SCENES.length]),
  };
});

/* ---- 资产：角色 / 场景 / 道具 ---- */
const DESC_F = "28岁东方女性，黑色柔顺长发，精致V脸，肤白貌美，灰棕色眼眸，气质清冷高贵。身穿白色修身西装，佩戴银色项链，眼神坚定，优雅自信，3D动漫风格。";
const DESC_M = "28岁东方男性，黑色短发，棱角分明，剑眉星目，气质沉稳内敛。身穿深色西装，眼神锐利，冷峻克制，3D动漫风格。";
const ASSETS = {
  character:[
    { id:"ch1", name:"沈知意", role:"女主", voice:"清冷女声", scene:{...SC.bedroom,hair:"#241f1b",cloth:"#e8e6ea"}, prompt:DESC_F,
      looks:[
        { id:"ch1-l1", name:"婚礼白纱", scene:{...SC.snowHall, hair:"#241f1b", cloth:"#f2f0f5"}, prompt:"白色拖尾婚纱造型，珍珠头饰，柔和逆光，3D动漫风格人物定妆照。" },
        { id:"ch1-l2", name:"晚宴礼服", scene:{...SC.hall, hair:"#2a1f1b", cloth:"#8a3b52"}, prompt:"酒红色丝绒晚宴礼服，盘发红唇，暖金烛光，3D动漫风格人物定妆照。" },
        { id:"ch1-l3", name:"居家素颜", scene:{...SC.bedroom, hair:"#241f1b", cloth:"#d9c7b8"}, prompt:"米色针织家居服，素颜长发，晨光窗边，3D动漫风格人物定妆照。" },
      ] },
    { id:"ch2", name:"林嘉琪", role:"男主", voice:"沉稳男声", scene:{...SC.corridor,hair:"#1c1a18",cloth:"#2f3b52"}, prompt:DESC_M, pre:true,
      looks:[
        { id:"ch2-l1", name:"婚礼正装", scene:{...SC.snowHall, hair:"#1c1a18", cloth:"#2f3b52"}, prompt:"深蓝色婚礼正装，金色袖扣，冷调自然光，3D动漫风格人物定妆照。" },
        { id:"ch2-l2", name:"商务西装", scene:{...SC.corridor, hair:"#1c1a18", cloth:"#243247"}, prompt:"炭灰色商务西装，白色衬衫，办公室顶光，3D动漫风格人物定妆照。" },
        { id:"ch2-l3", name:"雨夜风衣", scene:{...SC.city, hair:"#1c1a18", cloth:"#4a4f5c"}, prompt:"黑色长风衣，雨夜街灯，潮湿发丝，3D动漫风格人物定妆照。" },
      ] },
  ],
  scene:[
    { id:"sc1", name:"厅堂", scene:SC.hall, prompt:"中式厅堂，暖金色烛光，大全景，宾客云集长廊两侧，35mm 广角，3D动漫风格。" },
    { id:"sc2", name:"主卧", scene:SC.bedroom, prompt:"欧式主卧，暖色落地灯，柔和晨光，浅景深，3D动漫风格。", pre:true },
    { id:"sc3", name:"长廊", scene:SC.corridor, prompt:"教堂长廊，冷调自然光，纵深透视，35mm，3D动漫风格。" },
  ],
  prop:[
    { id:"pr1", name:"酒壶", scene:{...SC.hall,cloth:"#8a6a44"}, prompt:"复古铜质酒壶，暖金高光，3D动漫风格道具。" },
    { id:"pr2", name:"银色项链", scene:{...SC.bedroom,cloth:"#cfd3dc"}, prompt:"精致银色项链，细腻反光，3D动漫风格道具。" },
  ],
};

/* ---- 分镜：description 含 @资产引用 ---- */
function seg(scene,char,prop,tail){
  return [
    {t:"本片段场景设定在："},{ref:["scene",scene]},
    {t:" 大全景，镜头缓缓推进，"},{ref:["char",char]},
    {t:" 一袭白纱立于长廊尽头，神情决绝。暖金色调的烛光，宾客云集于两侧，焦段 35mm 广角镜头，手里拿着 "},
    {ref:["prop",prop]},{t:"，"+tail}
  ];
}
const SHOTS = [
  { id:"sh1", dur:"00:00:02", scene:SC.snowHall, done:true,  seg:seg("厅堂","沈知意","酒壶","眼神坚定望向远方。") },
  { id:"sh2", dur:"00:00:03", scene:SC.corridor, done:true,  seg:seg("长廊","沈知意","银色项链","缓步走向宾客。") },
  { id:"sh3", dur:"00:00:02", scene:SC.hall,     done:true,  seg:seg("厅堂","林嘉琪","酒壶","举杯，面色阴沉。") },
  { id:"sh4", dur:"00:00:03", scene:SC.bedroom,  done:true,  seg:seg("主卧","沈知意","银色项链","独自凭窗，泪光闪烁。") },
  { id:"sh5", dur:"00:00:02", scene:SC.corridor, done:true,  seg:seg("长廊","林嘉琪","酒壶","快步追出，神情焦急。") },
  { id:"sh6", dur:"00:00:03", scene:SC.hall,     done:false, seg:seg("厅堂","沈知意","酒壶","转身离去，决绝冷静。") },
  { id:"sh7", dur:"00:00:02", scene:SC.bedroom,  done:false, seg:seg("主卧","林嘉琪","银色项链","沉默伫立，若有所思。") },
];

/* ---- 可编辑运行态 ---- */
const state = {
  screen:"landing",                       // landing | project
  landing:{ tab:"restyle", toggle:"film", style:"real", modelVideo:"Minimax H3 MAX", modelImage:"image2.5", region:REGIONS[1], ratio:"16:9", reso:"720P", query:"" },
  project:{ title:"重生之不再爱了", style:"real", modelVideo:MODELS_VIDEO[0], modelImage:MODELS_IMAGE[0], ratio:"16:9", reso:"720P", region:REGIONS[1] },
  stage:"clips",                          // clips | script | asset | shot | film
  assetTab:"character",                   // character | scene | prop
  clips: CLIPS.map(x=>({...x})),
  episodes: EPISODES,
  epScripts: EP_SCRIPTS,                  // 当前剧本（可被上传替换）
  scriptSource: { name:"示例剧本（Demo）", demo:true, at:null },
  activeEp: 0,
  scriptEp: 0,                            // 剧本本土化当前集
  showOrig: true,                         // 剧本是否对照中文原文
  assets: JSON.parse(JSON.stringify(ASSETS)),
  assetDone: {},                          // id -> true 已生成（整项资产/角色全部妆造）
  lookDone: {},                           // lookId -> true 已生成（单套妆造）
  lookGenerating: new Set(),               // lookId -> 生成中
  assetBatch: false,                      // 批量生成选择模式
  assetSel: new Set(),                    // 批量生成勾选
  shots: SHOTS.map(x=>({...x})),
  activeShot: 0,
  shotBatch: false,                       // 批量转绘选择模式
  shotSel: new Set(),                     // 批量转绘勾选的分镜下标
  selShots: new Set(),
  generating: new Set(),                  // id -> 生成中
};
