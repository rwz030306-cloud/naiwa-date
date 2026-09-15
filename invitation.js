'use strict';
const invitationDefaults=()=>({v:1,to:'文文',from:'我',opening:'没有什么大事，就是想把想你，改成见你。',sign:'你的专属拎包员',letter:'活动是随便选的，想见你是认真决定的。',city:null});
let invitation=invitationDefaults(),draft=invitationDefaults(),composerMode=new URLSearchParams(location.search).has('compose'),previewMode=false,letterOpened=false,invalidInvite=false;
const inviteLimits={to:12,from:12,opening:100,sign:24,letter:280};
function cleanInvitation(value){
  if(!value||value.v!==1)throw Error('不支持的邀请格式');
  const result={v:1};
  for(const [key,max] of Object.entries(inviteLimits)){if(typeof value[key]!=='string'||value[key].length>max||!value[key].trim())throw Error('邀请内容不完整');result[key]=value[key].trim();}
  result.city=null;
  if(value.city){const c=value.city;if(typeof c.name!=='string'||c.name.length>100||typeof c.latitude!=='number'||!Number.isFinite(c.latitude)||Math.abs(c.latitude)>90||typeof c.longitude!=='number'||!Number.isFinite(c.longitude)||Math.abs(c.longitude)>180||typeof c.timezone!=='string'||c.timezone.length>80)throw Error('城市信息无效');new Intl.DateTimeFormat('en-US',{timeZone:c.timezone});result.city={name:c.name,latitude:c.latitude,longitude:c.longitude,timezone:c.timezone};}
  return result;
}
function encodeInvitation(value){return btoa(unescape(encodeURIComponent(JSON.stringify(cleanInvitation(value))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decodeInvitation(encoded){if(!encoded||encoded.length>12000||!/^[\w-]+$/.test(encoded))throw Error('邀请链接不完整');return cleanInvitation(JSON.parse(decodeURIComponent(escape(atob(encoded.replace(/-/g,'+').replace(/_/g,'/'))))));}
const encodedInvite=new URLSearchParams(location.hash.slice(1)).get('invite');
if(encodedInvite){try{invitation=decodeInvitation(encodedInvite);draft={...invitation};}catch{invalidInvite=true;}}
function invitationURL(value){const u=new URL(location.href);u.search='?v=6';u.hash='invite='+encodeInvitation(value);return u.href;}
let cityRequest=0,cityController=null,weatherRequest=0,weatherController=null;
const weatherCache=new Map();
const letterIdeas={
  '嘴硬版':['本周的想念额度超标了，申请见面处理。','活动是随便选的，想见你是认真决定的。'],
  '甜一点':['想把今天的好天气，和身边的位置一起留给你。','奶娃替我闹了半天，其实我只想认真说一句：和你待在一起，普通的一天也会变得很特别。'],
  '认真一点':['有一些话，想见到你再慢慢说。','谢谢你愿意把时间留给我。不需要多特别的安排，能一起吃饭、走走、聊聊，我就已经很期待了。']
};
function renderComposer(){
  weatherRequest++;weatherController?.abort();cardRenderId++;cityRequest++;cityController?.abort();
  $('#progress').innerHTML='';$('#counter').textContent='FOR YOUR PERSON';
  $('#app').innerHTML=`<section class="compose"><p class="eyebrow">A LITTLE SOMETHING FOR YOU</p><h1 tabindex="-1">先把偏心，写给 TA。</h1><p class="compose-lead">你写好开场，奶娃负责递话。对方选完安排，才会拆到你藏的小信。</p><form id="inviteForm"><div class="fields"><label class="field">对方的称呼<input name="to" maxlength="12" required value="${esc(draft.to)}"></label><label class="field">你的称呼<input name="from" maxlength="12" required value="${esc(draft.from)}"></label></div><p class="section-label">先借奶娃一句话<span>点选后可继续修改</span></p><div class="chips">${Object.keys(letterIdeas).map(k=>`<button type="button" class="chip" data-tone="${k}">${k}</button>`).join('')}</div><label class="field">见面之前，先说一句<textarea name="opening" maxlength="100" required>${esc(draft.opening)}</textarea></label><label class="field">卡片上的落款<input name="sign" maxlength="24" required value="${esc(draft.sign)}"></label><label class="field">奶娃替你藏的小信<textarea name="letter" maxlength="280" required>${esc(draft.letter)}</textarea></label><p class="tiny">完成约定后点击拆信才显示；不会自动印在约定卡片上。</p><label class="field">约会城市 · 用来查天气<input id="citySearch" maxlength="60" placeholder="输入城市，例如：杭州 / Hangzhou" autocomplete="off"></label><div class="city-controls"><button type="button" class="secondary" id="searchCity">查找城市</button><button type="button" class="chip" id="clearCity">暂不设置</button></div><p id="chosenCity" class="tiny">${draft.city?'已选：'+esc(draft.city.name):'未设置城市，仍可正常发出邀请。'}</p><div id="cityResults" aria-live="polite"></div><p id="composeError" class="error" role="alert"></p><div class="compose-actions"><button type="button" class="secondary" id="previewInvite">以对方视角预览</button><button class="primary pink" type="submit">生成专属邀请链接 ↗</button></div></form><section id="shareResult" hidden><h2>偏心已经装进链接里。</h2><label class="field">复制后发给对方<textarea id="shareURL" readonly></textarea></label><div class="actions"><button class="primary" id="copyInvite">复制邀请链接</button><a class="secondary" id="openInvite" target="_blank" rel="noopener">打开邀请</a></div></section><p class="tiny compose-note">这是链接专属内容，不是加密私信。拿到链接的人都能看到；请不要填写敏感信息。每次修改后重新生成链接，旧链接保持原样。</p></section>`;
  const form=$('#inviteForm');form.oninput=()=>{for(const k of Object.keys(inviteLimits))draft[k]=form.elements.namedItem(k).value;$('#shareResult').hidden=true;};
  const sync=()=>{for(const k of Object.keys(inviteLimits))draft[k]=form.elements.namedItem(k).value;if(!form.reportValidity())return false;try{draft=cleanInvitation(draft);return true;}catch(e){$('#composeError').textContent=e.message;return false;}};
  document.querySelectorAll('[data-tone]').forEach(b=>b.onclick=()=>{const [opening,letter]=letterIdeas[b.dataset.tone];form.elements.opening.value=draft.opening=opening;form.elements.letter.value=draft.letter=letter;$('#shareResult').hidden=true;showToast('句子借给你了，还可以改成自己的语气。');});
  $('#previewInvite').onclick=()=>{if(!sync())return;invitation=cleanInvitation(draft);previewMode=true;composerMode=false;letterOpened=false;state=initial();noCount=0;go(0);};
  form.onsubmit=e=>{e.preventDefault();if(!sync())return;$('#composeError').textContent='';const url=invitationURL(draft);$('#shareURL').value=url;$('#openInvite').href=url;$('#shareResult').hidden=false;$('#shareURL').focus();};
  $('#copyInvite').onclick=()=>copyValue($('#shareURL').value,'邀请链接已复制，去发给 TA 吧。');
  $('#searchCity').onclick=searchCities;$('#citySearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();searchCities();}};
  $('#citySearch').oninput=()=>{cityRequest++;cityController?.abort();draft.city=null;$('#chosenCity').textContent='请选择搜索结果中的城市。';$('#cityResults').textContent='';$('#shareResult').hidden=true;};
  $('#clearCity').onclick=()=>{cityRequest++;cityController?.abort();draft.city=null;$('#citySearch').value='';$('#cityResults').textContent='';$('#chosenCity').textContent='未设置城市，仍可正常发出邀请。';$('#shareResult').hidden=true;};
}
async function copyValue(value,message){try{await navigator.clipboard.writeText(value);showToast(message);}catch{const el=document.createElement('textarea');el.value=value;document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();showToast(ok?message:'请长按链接文字，选择复制。');}}
async function getJSON(url,signal){const r=await fetch(url,{signal,referrerPolicy:'no-referrer'});if(!r.ok)throw Error('请求失败');return r.json();}
async function searchCities(){
  const query=$('#citySearch').value.trim(),area=$('#cityResults');if(query.length<2){area.textContent='请输入至少两个字，也可以使用城市拼音。';return;}
  const id=++cityRequest;cityController?.abort();const controller=cityController=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);area.textContent='奶娃正在确认城市…';
  try{const data=await getJSON('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query,count:'8',language:'zh',format:'json'}),controller.signal);if(id!==cityRequest||!area.isConnected)return;area.innerHTML='';
    const cities=(data.results||[]).filter(c=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)&&c.timezone);
    if(!cities.length){area.textContent='没有找到，试试城市全名或拼音。';return;}
    for(const c of cities){const city={name:[c.name,c.admin1,c.country].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' · '),latitude:c.latitude,longitude:c.longitude,timezone:c.timezone};const b=document.createElement('button');b.type='button';b.className='city-result';b.textContent=city.name;b.onclick=()=>{draft.city=city;$('#chosenCity').textContent='已选：'+city.name;area.innerHTML='';$('#shareResult').hidden=true;};area.append(b);}
    const source=document.createElement('small');source.textContent='城市数据：GeoNames / Open-Meteo';area.append(source);
  }catch{if(id===cityRequest&&area.isConnected)area.textContent='城市查询暂时连不上。可以重试，或暂不设置城市继续制作。';}finally{clearTimeout(timer);}
}
function bindInvitation(){
  if(invalidInvite){$('#app').innerHTML='<h1>这封邀请好像没带完整。</h1><p>请让发起人重新复制完整链接，再打开一次。</p>';return;}
  const logo=$('.masthead a');logo.href=location.pathname+location.hash;
  $('.edition').textContent='给 '+invitation.to+' 的一点偏心';
  if(step===0){$('.intro h1').textContent=invitation.to+'，出来一下。';$('.intro .sub').textContent=invitation.opening;}
  if(previewMode){const b=document.createElement('button');b.className='preview-return';b.textContent='正在预览 · 返回修改邀请';b.onclick=()=>{composerMode=true;previewMode=false;render();};$('#app').prepend(b);}
  else if(step===0&&!encodedInvite){const a=document.createElement('a');a.className='prepare-link';a.href=location.pathname+'?compose=1';a.textContent='我也要制作一份专属邀请 ↗';$('#app').append(a);}
  if([1,2,5].includes(step)){const slot=document.createElement('section');slot.id='weather';slot.className='weather-panel';slot.setAttribute('aria-live','polite');(step===1?$('.fields'):$('.step-head')).after(slot);refreshWeather();}
  else{weatherRequest++;weatherController?.abort();}
  if(step===5){const letter=document.createElement('section');letter.className='secret-letter';letter.innerHTML=`<span class="eyebrow">ONLY A LITTLE BRAVE</span><h2>奶娃还藏了一句话。</h2><button class="envelope" id="openLetter" aria-expanded="${letterOpened}">♡ ${letterOpened?'小信已拆开':'给 '+esc(invitation.to)+' · 点我拆信'}</button><div id="letterBody" ${letterOpened?'':'hidden'}><p class="letter-address">${esc(invitation.to)}：</p><p class="letter-text">${esc(invitation.letter)}</p><p class="letter-sign">—— ${esc(invitation.from)}</p></div>`;$('.card-studio').before(letter);$('#openLetter').onclick=()=>{letterOpened=true;$('#letterBody').hidden=false;$('#openLetter').setAttribute('aria-expanded','true');$('#openLetter').textContent='♡ 小信已拆开';};}
}
function cityToday(city){const p=new Intl.DateTimeFormat('en-CA',{timeZone:city.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');}
function weatherDescription(code){if(code===0)return '晴';if([1,2].includes(code))return '晴间多云';if(code===3)return '阴';if([45,48].includes(code))return '有雾';if(code>=95)return '雷雨';if([71,73,75,77,85,86].includes(code))return '有雪';if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return '有雨';return '天气情况待确认';}
function weatherAdvice(row){const tips=[];if(row.code>=95)tips.push('可能有雷雨，优先选室内活动。');else if(row.wet)tips.push('带把伞吧，散步和野餐可以备一个室内方案。');if(row.high>=32)tips.push('午后可能偏热，记得防晒补水。');if(row.low<=12)tips.push('早晚偏凉，带件外套。');if(row.wind>=40)tips.push('风可能较大，户外安排注意调整。');return tips.join(' ')||'按当天体感穿衣，出门前再看一眼预报。';}
function parseForecast(data,date){const d=data.daily,i=d?.time?.indexOf(date);if(i===undefined||i<0)return null;const number=k=>typeof d[k]?.[i]==='number'&&Number.isFinite(d[k][i])?d[k][i]:null;const code=number('weather_code'),low=number('temperature_2m_min'),high=number('temperature_2m_max'),rain=number('precipitation_probability_max'),wind=number('wind_speed_10m_max');if(code===null||low===null||high===null)return null;return {code,low,high,rain,wind,wet:(rain!==null&&rain>=50)||[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code)};}
async function refreshWeather(){
  const slot=$('#weather');const id=++weatherRequest;weatherController?.abort();if(!slot)return;
  const city=invitation.city,date=state.date;
  const message=text=>{slot.textContent=text;};
  if(!city){message('天气小助手：这封邀请还没设置城市，先放心选安排。');return;}
  if(state.dateFree||!date){message(city.name+'：等日期确定，再替你看看天气。');return;}
  const offset=(Date.parse(date+'T00:00:00Z')-Date.parse(cityToday(city)+'T00:00:00Z'))/86400000;
  if(!Number.isFinite(offset)||offset<0){message('这个日期在约会城市已经过去啦，换个日期再查天气。');return;}
  if(offset>15){message('这次见面还没进入天气预报范围（最长约 16 天）。临近日期再打开查看。');return;}
  const key=JSON.stringify([city.latitude,city.longitude,city.timezone,date]);message('奶娃正在看 '+city.name+' 的天气…');
  const controller=weatherController=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{let cached=weatherCache.get(key);if(!cached||Date.now()-cached.at>900000){const params=new URLSearchParams({latitude:String(city.latitude),longitude:String(city.longitude),timezone:city.timezone,forecast_days:'16',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',wind_speed_unit:'kmh'});const data=await getJSON('https://api.open-meteo.com/v1/forecast?'+params,controller.signal);cached={row:parseForecast(data,date),at:Date.now()};weatherCache.set(key,cached);}
    if(id!==weatherRequest||!slot.isConnected)return;const r=cached.row;if(!r){message('这一天的预报暂时不完整，稍后再来看。');return;}
    slot.innerHTML=`<p class="weather-heading">${esc(city.name)} · ${esc(date)}</p><strong>${weatherDescription(r.code)} · ${Math.round(r.low)}～${Math.round(r.high)}℃</strong><p>${r.rain===null?'降水概率暂缺':'全天最高降水概率 '+Math.round(r.rain)+'%'}${r.wind===null?'':' · 最大风速 '+Math.round(r.wind)+' km/h'}</p><p>${weatherAdvice(r)}</p>${offset>=7?'<p class="tiny">日期较远，预报还会变化。</p>':''}<small>查询于 ${new Date(cached.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · 预报仅供安排参考</small>`;
    if(r.wet&&step===2){const b=document.createElement('button');b.className='chip';b.textContent='加一个室内备选：看电影';b.onclick=()=>{state.activities=state.activities.filter(x=>x!=='你来定');if(!state.activities.includes('看电影'))state.activities.push('看电影');lastActivity='看电影';render();};slot.append(b);}
  }catch{if(id===weatherRequest&&slot.isConnected){message('天气暂时没查到，不影响这次约会。');const retry=document.createElement('button');retry.className='chip';retry.textContent='重试天气';retry.onclick=refreshWeather;slot.append(retry);}}finally{clearTimeout(timer);}
}
