'use strict';
// Keep the supplied screenshots unchanged; crop their visible regions at render time.
const newMoods = {
  daydream: ['friends-a.png',69,31,261,261,356,1230,'躺着也在想你'],
  strong: ['friends-a.png',104,334,226,264,356,1230,'逞强第一名'],
  silly: ['friends-a.png',66,638,264,264,356,1230,'开心到不顾形象'],
  selfie: ['friends-a.png',126,942,204,264,356,1230,'出门前先臭美'],
  pointing: ['friends-b.png',20,23,238,239,272,1166,'就是想约你'],
  doublePeace: ['friends-b.png',19,303,239,239,272,1166,'双倍开心'],
  thinking: ['friends-b.png',0,582,258,264,272,1166,'认真想见你'],
  sulky: ['friends-b.png',49,887,209,263,272,1166,'嘴硬三秒钟'],
  giggle: ['friends-c.png',71,15,245,263,332,298,'笑到肚子疼']
};
for (const [name,[file,x,y,w,h,W,H,label]] of Object.entries(newMoods)) {
  images[name]='assets/'+file; referenceCrops[name]={x,y,w,h,W,H}; moodLabels[name]=label;
}
activityList.splice(activityList.length-2,0,['🌇','看日落'],['📷','拍照'],['🧺','公园野餐'],['🧩','手作 DIY'],['📚','逛书店'],['🕵️','剧本杀'],['💆','按摩']);
const activityLines={
  '吃饭':['giggle','胃已经空出来了，对面的位置也给你留好了。'],
  '看电影':['doublePeace','电影两小时，偷偷开心一整天。旁边的位置归你。'],
  '散步':['pointing','步数可以随便，身边的人必须是你。'],
  '逛展':['thinking','艺术我慢慢看，你我想多看两眼。'],
  '逛街':['strong','拎包选手已就位。嘴上说不累，其实还真有点。'],
  '打游戏':['silly','可以输掉这局，但不能错过和你组队。'],
  '桌游':['thinking','规则慢慢学，先学会坐你旁边。'],
  '唱歌':['giggle','歌不一定在调上，但想见你这事绝对靠谱。'],
  '咖啡 / 下午茶':['bashful','三分糖就行，剩下七分见到你再补。'],
  '看日落':['daydream','太阳负责下班，我负责陪你发呆。'],
  '拍照':['selfie','出门前练了八百次表情，见你还是会傻笑。'],
  '公园野餐':['daydream','带上零食和你，今天的快乐就齐了。'],
  '手作 DIY':['strong','手不一定巧，但这次我真的很用心。'],
  '逛书店':['thinking','想翻的书很多，想一起逛的人就一个。'],
  '剧本杀':['thinking','身份可以是假的，想和你组队是真的。'],
  '按摩':['daydream','肩膀负责放松，嘴角负责偷偷上扬。'],
  '你来定':['thinking','选择题交给我。你负责出现，我负责期待。'],
  '自定义':['eager','你尽管写，奶娃已经在旁边认真记笔记了。']
};
function activityReaction(){
  const key=state.activities.includes(lastActivity)?lastActivity:state.activities.at(-1);
  const [mood,text]=activityLines[key]||['eager','可以组合选。先挑想做的事，我们把普通的一天过得可爱一点。'];
  return {mood,text};
}
const themes={
  cinema:{name:'双人电影票',tag:'两位主角，准时入场',title:'我们，正式开场',mood:'doublePeace',ink:'#81382f',accent:'#ca5146',paper:'#fff4df'},
  contract:{name:'见面小契约',tag:'奶娃盖章，说话算数',title:'见面这件事，批准了',mood:'strong',ink:'#493a30',accent:'#bc4c53',paper:'#faf2df'},
  polaroid:{name:'拍立得纪念卡',tag:'把期待，留在这一张',title:'下一张，想和你合照',mood:'selfie',ink:'#443847',accent:'#bd6485',paper:'#fffaf6'}
};
const sweetLine='我会装作不在意，然后提前到场。';
let cardRenderId=0,cardReady=Promise.resolve(),cardCanvas=null;
function cardView(){
  return `<section class="card-studio" aria-label="约定卡片样式"><p class="section-label">给期待挑件衣服<span>切换样式，安排不会丢</span></p><div class="theme-picker">${Object.entries(themes).map(([key,t])=>`<button class="theme-choice ${key}" data-theme="${key}" aria-pressed="${cardTheme===key}"><span class="theme-swatch" aria-hidden="true">${key==='cinema'?'02':key==='contract'?'约':'♡'}</span><strong>${t.name}</strong><small>${t.tag}</small></button>`).join('')}</div><p id="cardStatus" class="tiny" role="status">奶娃正在装订这份期待…</p><div class="card-preview" id="ticket" aria-busy="true"><canvas id="cardCanvas" role="img" aria-label="约定卡片预览"></canvas></div><details class="card-details"><summary>查看约定文字</summary><pre>${esc(plainText())}</pre></details><div class="actions"><button class="primary pink" id="save" disabled>保存这张约定 ↓</button><button class="secondary" id="copy">复制文字</button></div><p class="tiny card-help">预览就是保存的样子。微信里长按生成的图片，发给我就约好了。</p><button class="restart" id="restart">再发起一次新约会</button></section>`;
}
function bindExperience(){
  bindInvitation();
  const frame=$('.meme-frame')||$('.reaction');
  if(frame){
    const panel=document.createElement('div'); panel.className='pet-panel';
    panel.innerHTML='<div class="pet-actions"><button data-pet="head" aria-label="摸摸奶娃的头">摸摸头 ♡</button><button data-pet="face" aria-label="戳戳奶娃的脸">戳一下 ·ᴗ·</button></div><p class="pet-message" role="status">奶娃嘴硬，但允许你摸摸头。</p>';
    (step===0?$('.intro'):$('.step-head')).after(panel);
    frame.classList.add('pet-target');
    const spots=document.createElement('div');spots.className='pet-spots';spots.innerHTML='<button class="head-spot" data-pet="head" aria-label="摸奶娃的头"></button><button class="face-spot" data-pet="face" aria-label="戳奶娃的脸"></button>';frame.append(spots);
    document.querySelectorAll('[data-pet]').forEach(b=>b.onclick=()=>pet(b.dataset.pet));
  }
  if(step===2){
    const guide=document.createElement('div');guide.className='date-combos';guide.innerHTML='<span>懒人约会灵感 · 点一下组合</span><div>'+[
      ['饭后小散步','吃饭|散步'],['日落慢慢走','咖啡 / 下午茶|散步|看日落'],['一起留个纪念','手作 DIY|拍照']
    ].map(([label,values])=>`<button data-combo="${values}">${label} ↗</button>`).join('')+'</div>';
    $('.grid').before(guide);
    document.querySelectorAll('[data-combo]').forEach(b=>b.onclick=()=>{state.activities=b.dataset.combo.split('|');lastActivity=state.activities.at(-1);if(!state.activities.includes('吃饭')){state.meal='';state.customMeal='';}if(!state.activities.includes('咖啡 / 下午茶')){state.tea='';state.customTea='';}render();showToast('组合选好了，还可以继续加减。');});
  }
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{cardTheme=b.dataset.theme;render();document.querySelector(`[data-theme="${cardTheme}"]`).focus({preventScroll:true});});
  if(step===5){cardReady=renderCard();$('#save').onclick=saveCard;}
  else {cardRenderId++;cardCanvas=null;}
}
function pet(kind){
  touchCount++;
  const reactions=kind==='head'?[
    ['bashful','别摸了别摸了……好吧，再摸一下。'],['doublePeace','摸头到账。今天这份开心，算你送的。'],['giggle','说好只摸一下的，怎么嘴角收不回去了。']
  ]:[['sulky','谁准你戳我的？……你啊，那没事了。'],['silly','戳中快乐开关了，现在你得负责陪我出去玩。'],['giggle','不许戳肚子！笑场了还怎么装高冷。']];
  const [mood,text]=reactions[(touchCount-1)%reactions.length];
  const frame=$('.meme-frame')||$('.reaction'),art=frame.querySelector('.mood-art');
  art.outerHTML=moodArt(mood,step===0?'heroMeme':'');frame.dataset.mood=mood;
  frame.querySelector('.mood-art').classList.add(kind==='head'?'petted':'poked');
  const caption=frame.querySelector('figcaption');if(caption)caption.textContent=moodLabels[mood];
  $('.pet-message').textContent=text;
  frame.querySelector('.pet-heart')?.remove();const heart=document.createElement('span');heart.className='pet-heart';heart.textContent=kind==='head'?'♡':'✦';heart.setAttribute('aria-hidden','true');frame.append(heart);setTimeout(()=>heart.remove(),900);
}
const decodedImages=new Map();
async function decoded(src){if(!decodedImages.has(src)){const im=new Image();im.src=src;decodedImages.set(src,im.decode().then(()=>im).catch(e=>{decodedImages.delete(src);throw e;}));}return decodedImages.get(src);}
function textLines(c,text,width){const lines=[];let line='';for(const ch of String(text)){if(ch==='\n'){lines.push(line);line='';continue;}if(line&&c.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);return lines.length?lines:[''];}
async function renderCard(){
  const version=++cardRenderId,theme=cardTheme,t=themes[theme],d=summary(),canvas=$('#cardCanvas'),status=$('#cardStatus');
  cardCanvas=null;
  try{
    await document.fonts.ready;
    let im=null;try{im=await decoded(images[t.mood]);}catch{/* Keep a readable card if the image cannot load. */}
    if(version!==cardRenderId||!canvas.isConnected)return;
    const c=canvas.getContext('2d'),W=900,font='"PingFang SC","Microsoft YaHei",sans-serif';
    const fields=[['赴约主角',invitation.to+' & '+invitation.from],['见面日期',d.date],['见面时间',d.time],['一起去做',d.activities],...(d.food?[['吃点什么',d.food]]:[]),['见面坐标',d.place],...(d.preferences.length?[['小暗示 · 可以商量',d.preferences.join('、')]]:[]),['落款',invitation.sign]];
    c.font=`600 31px ${font}`;const max=theme==='contract'?660:700;
    const rows=fields.map(([label,value])=>({label,value,lines:textLines(c,value,max)}));
    const top=theme==='polaroid'?680:theme==='contract'?400:330;
    const body=rows.reduce((sum,row)=>sum+78+row.lines.length*43,0),foot=theme==='contract'?250:180;
    canvas.width=W;canvas.height=top+body+foot;
    const H=canvas.height;
    function box(x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
    function text(s,x,y,size=28,color=t.ink,weight=500){c.fillStyle=color;c.font=`${weight} ${size}px ${font}`;c.fillText(s,x,y);}
    function line(y,dash=false){c.setLineDash(dash?[10,9]:[]);c.strokeStyle=t.accent;c.lineWidth=1.5;c.beginPath();c.moveTo(66,y);c.lineTo(834,y);c.stroke();c.setLineDash([]);}
    function heart(x,y,size){c.save();c.translate(x,y);c.scale(size/40,size/40);c.beginPath();c.moveTo(20,35);c.bezierCurveTo(-12,13,2,-7,20,7);c.bezierCurveTo(38,-7,52,13,20,35);c.strokeStyle=t.accent;c.lineWidth=2;c.stroke();c.restore();}
    function art(x,y,w,h){if(!im){heart(x+w/3,y+h/3,60);return;}const crop=referenceCrops[t.mood];const scale=Math.min(w/crop.w,h/crop.h);c.drawImage(im,crop.x,crop.y,crop.w,crop.h,x+(w-crop.w*scale)/2,y+(h-crop.h*scale)/2,crop.w*scale,crop.h*scale);}
    c.fillStyle=theme==='polaroid'?'#f0dce4':'#e9e2d5';c.fillRect(0,0,W,H);
    box(24,28,852,H-52,theme==='polaroid'?4:24,t.paper);
    if(theme==='cinema'){
      box(24,28,852,260,24,t.accent);c.fillStyle=t.accent;c.fillRect(24,170,852,118);
      text('NAIWA CINEMA  /  双人专场',62,88,22,'#fff3de',700);text(t.title,62,167,55,'#fff3de',900);
      text('主演：你 & 我     ·     座位：彼此身旁',62,225,26,'#fff3de');
      box(663,56,174,190,10,'#fff5df');art(673,65,154,170);line(302,true);
      for(const x of [24,876]){c.beginPath();c.arc(x,302,19,0,Math.PI*2);c.fillStyle='#e9e2d5';c.fill();}
    }else if(theme==='contract'){
      box(42,46,816,H-88,5,null,t.accent);box(51,55,798,H-106,3,null,'#c8ad93');
      text('见 面 事 务 所  /  一式两份的心动',80,106,22,t.accent,700);
      text('见面小契约',80,195,62,t.ink,900);text('自愿赴约，允许害羞，禁止放鸽子。',80,253,25);
      art(655,100,155,190);line(308);text('经双方愉快协商，暂定如下：',80,348,24);
    }else{
      c.save();c.translate(450,59);c.rotate(-.035);box(-114,-15,228,48,1,'#dfcfa6cc');c.restore();
      box(67,107,766,445,2,'#fff0b2');art(310,118,280,350);
      heart(115,160,60);heart(715,440,30);
      text('先让奶娃占个位，下次我们一起入镜。',98,520,25);
      text(t.title,70,612,49,t.ink,900);text('OUR NEXT LITTLE MEMORY',73,650,19,t.accent,700);
    }
    let y=top;
    rows.forEach((row,i)=>{
      const x=theme==='contract'?106:74;
      if(theme==='contract')text(String(i+1).padStart(2,'0'),74,y+3,18,t.accent,800);
      text(row.label,x,y+3,22,t.accent,600);y+=45;
      for(const part of row.lines){text(part,x,y,31,t.ink,600);y+=43;}
      y+=33;c.strokeStyle='#d8cbbc';c.lineWidth=1;c.beginPath();c.moveTo(x,y-30);c.lineTo(822,y-30);c.stroke();
    });
    if(theme==='contract'){
      text('约定人：你  ×  我',83,H-185,27,t.ink,700);text('奶娃已见证，期待已生效。',83,H-136,23);
      c.save();c.translate(735,H-180);c.rotate(-.18);c.strokeStyle=t.accent;c.lineWidth=4;c.beginPath();c.arc(0,0,74,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,65,0,Math.PI*2);c.stroke();c.textAlign='center';text('赴约批准',0,5,27,t.accent,900);text('奶娃盖章',0,36,15,t.accent);c.restore();
    }else if(theme==='cinema'){
      line(H-151,true);text('ADMIT TWO  /  双人有效',74,H-107,20,t.accent,700);
      for(let i=0;i<64;i++){c.fillStyle=t.ink;c.fillRect(578+i*3.7,H-126,i%3===0?2.5:1,35);}
    }else{heart(75,H-140,27);text('待见面，待合照，待收藏。',120,H-115,28,t.accent,700);}
    c.textAlign='center';text(sweetLine,450,H-70,24);c.textAlign='left';
    canvas.setAttribute('aria-label',`${t.name}。${plainText()}`);cardCanvas=canvas;canvas.parentElement.setAttribute('aria-busy','false');status.textContent=t.tag+' · 可以保存了';$('#save').disabled=false;
  }catch(err){if(version!==cardRenderId)return;status.textContent='卡片暂时没画好，点这里重试。';status.onclick=()=>{cardReady=renderCard();};}
}
async function saveCard(){
  const button=$('#save'),theme=cardTheme;button.disabled=true;button.textContent='奶娃正在装进相册…';
  try{
    await cardReady;const canvas=cardCanvas;if(!canvas)throw Error('Card unavailable');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG unavailable');
    if(saveCard.url)URL.revokeObjectURL(saveCard.url);saveCard.url=URL.createObjectURL(blob);
    $('#exportImage').src=saveCard.url;$('#exportImage').alt=themes[theme].name+'：'+plainText();
    $('#downloadImage').href=saveCard.url;$('#downloadImage').download=`我们的约定-${themes[theme].name}.png`;$('#imageDialog').showModal();
  }catch{showToast('保存失败，可以重试或先复制约定文字。');}finally{button.disabled=!cardCanvas;button.textContent='保存这张约定 ↓';}
}
render();
