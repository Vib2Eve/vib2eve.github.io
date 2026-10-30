(() => {
'use strict';
const {validateSegments, analyzeLocally}=globalThis.PaintingUEngine;
const $=id=>document.getElementById(id);
const zh=document.documentElement.lang.startsWith('zh'), lang=zh?'zh':'en';
const text=(en,cn)=>zh?cn:en;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
let segments=[],assembled=[],editId=null,nextId=1,revision=0,result=null,controller=null,backend=false;
const sorted=()=>segments.slice().sort((a,b)=>a.start-b.start||a.end-b.end);
function say(message,error=false){$('entryStatus').textContent=message;$('entryStatus').classList.toggle('error',error)}
function setStep(n){for(let i=1;i<=4;i++){const el=$('step'+i);el.classList.toggle('on',i<=n);el.setAttribute('aria-current',i===n?'step':'false')}}
function resetResult(){result=null;$('meaning').textContent=text('Awaiting analysis','等待分析');$('chain').textContent=text('Assemble the evidence, then connect the clues.','整理时间线，再连接其中的线索。');$('profileGrid').innerHTML=`<div class="empty result-empty">${text('Your evidence-based profile will appear here.','有依据的推理结果将在这里呈现。')}</div>`;$('rawResult').textContent=text('Not run','尚未运行');$('analysisMode').textContent=text('Not run','尚未运行');$('exportResult').disabled=true;setStep(1)}
function invalidate(){revision++;assembled=[];if(controller){controller.abort();controller=null;$('analysisStatus').textContent=text('Evidence changed. Run analysis again.','证据已更新，请重新分析。')}else $('analysisStatus').textContent=text('Choose the rule demo, or configure an API for model analysis.','可运行规则演示，或配置 API 后进行模型分析。');resetResult()}
function tokenList(value){return value.split(/[\s,;，；、]+/).map(s=>s.trim()).filter(Boolean)}
function nextIdentity(source){let id;do{id=(source==='wearer'?'W':'L')+String(nextId++).padStart(2,'0')}while(segments.some(x=>x.id===id));return id}
function errorMessage(e){let message=e.message||String(e);if(!zh)return message;
 const fixed={'Failed to fetch':'无法连接服务','Load failed':'无法连接服务','JSON must contain a segments array':'JSON 中需要包含 segments 数组','File exceeds 6 MB':'文件不能超过 6 MB'};
 if(fixed[message])return fixed[message];if(/JSON|Unexpected token|Unexpected end/i.test(message))return 'JSON 格式不正确，请检查文件内容。';
 if(/duplicate|unique/i.test(message))return '每条证据的 ID 必须唯一，不能重复。';
 if(/1[–-]200|1 to 200|200 segments/i.test(message))return '证据数量必须在 1 到 200 条之间。';
 if(/time|start|end|range|86400|finite/i.test(message))return '时间应为 0–86400 秒内的有效数字，结束时间须晚于开始时间。';
 if(/keyword/i.test(message))return '关键词须为最多 80 项的字符串数组，每项非空且不超过 80 字符。';
 if(/speaker/i.test(message))return '说话人名称须为不超过 80 字符的文本。';
 if(/quality/i.test(message))return '片段质量应为 clean、distorted 或 inaudible。';
 if(/text|fragment/i.test(message))return '远端片段文本应为 1–4000 字符。';
 if(/id\b/i.test(message))return '每条证据须有 1–40 字符的非空 ID。';
 if(/source/i.test(message))return '来源须为 wearer 或 loudspeaker。';
 return message;
}
function cancelEdit(){editId=null;$('wearerForm').reset();$('remoteForm').reset();$('wearerTokens').disabled=false;$('wearerSave').textContent=text('Add wearer segment','添加佩戴者片段');$('remoteSave').textContent=text('Add loudspeaker segment','添加扬声器片段');$('wearerCancel').hidden=true;$('remoteCancel').hidden=true}
function saveSegment(record){const id=editId||nextIdentity(record.source);const candidate=segments.filter(x=>x.id!==id).concat({...record,id});try{segments=validateSegments(candidate)}catch(e){say(errorMessage(e),true);return false}invalidate();cancelEdit();renderAll();say(text('Evidence saved.','证据已保存。'));return true}
$('wearerForm').addEventListener('submit',e=>{e.preventDefault();const empty=$('wearerEmpty').checked,keywords=empty?[]:tokenList($('wearerTokens').value);if(!empty&&!keywords.length)return say(text('Enter keywords or select “No recognized keyword”.','请输入关键词，或勾选“未识别出关键词”。'),true);saveSegment({source:'wearer',start:Number($('wearerStart').value),end:Number($('wearerEnd').value),keywords})});
$('remoteForm').addEventListener('submit',e=>{e.preventDefault();saveSegment({source:'loudspeaker',start:Number($('remoteStart').value),end:Number($('remoteEnd').value),speaker:$('remoteSpeaker').value.trim()||'Remote',quality:$('remoteQuality').value,text:$('remoteText').value.trim()})});
$('wearerEmpty').addEventListener('change',()=>{$('wearerTokens').disabled=$('wearerEmpty').checked});
$('wearerCancel').addEventListener('click',cancelEdit);$('remoteCancel').addEventListener('click',cancelEdit);
function editSegment(id){const s=segments.find(x=>x.id===id);if(!s)return;cancelEdit();editId=id;let form;
 if(s.source==='wearer'){$('wearerTokens').value=s.keywords.join(', ');$('wearerStart').value=s.start;$('wearerEnd').value=s.end;$('wearerEmpty').checked=!s.keywords.length;$('wearerTokens').disabled=!s.keywords.length;$('wearerSave').textContent=text('Save changes','保存修改');$('wearerCancel').hidden=false;form=$('wearerForm')}
 else{$('remoteText').value=s.text;$('remoteStart').value=s.start;$('remoteEnd').value=s.end;$('remoteSpeaker').value=s.speaker;$('remoteQuality').value=s.quality;$('remoteSave').textContent=text('Save changes','保存修改');$('remoteCancel').hidden=false;form=$('remoteForm')}
 form.scrollIntoView({behavior:'smooth',block:'center'});form.querySelector('input:not([disabled]),textarea').focus({preventScroll:true});
}
function removeSegment(id){segments=segments.filter(s=>s.id!==id);invalidate();cancelEdit();renderAll();say(text('Evidence removed.','证据已移除。'))}
function excerpt(s){return s.source==='wearer'?(s.keywords.length?s.keywords.join(' · '):text('No keyword output','未识别出关键词')):s.text}
function renderTimeline(){if(!segments.length){$('timelineLanes').innerHTML=`<div class="empty">${text('Add or import evidence to build the timeline.','添加或导入证据，建立时间线。')}</div>`;$('axis').replaceChildren();return}const max=Math.max(10,...segments.map(s=>s.end+1));const speakers=[...new Set(segments.filter(s=>s.source==='loudspeaker').map(s=>s.speaker))];if(!speakers.length)speakers.push(text('Remote','远端'));const groups=speakers.map(speaker=>({name:speaker,source:'loudspeaker',items:sorted().filter(s=>s.source==='loudspeaker'&&s.speaker===speaker)}));groups.push({name:text('Wearer','佩戴者端'),source:'wearer',items:sorted().filter(s=>s.source==='wearer')});$('timelineLanes').replaceChildren();
 $('axis').innerHTML=[0,.25,.5,.75,1].map(f=>`<span>${+(max*f).toFixed(1)}${f===1?' s':''}</span>`).join('');
 for(const group of groups){const lane=document.createElement('div');lane.className='timeline-lane '+(group.source==='wearer'?'w':'l');const sourceLabel=group.source==='wearer'?text('Wearer','佩戴者端'):text('Loudspeaker','扬声器端');const speakerLabel=group.name.replace(/^Remote speaker\s+(\d+)$/i,(_,number)=>text('Speaker '+number,'说话人 '+number));lane.innerHTML=`<div class="lane-name">${esc(sourceLabel)}${group.source==='loudspeaker'&&speakers.length>1?`<small>${esc(speakerLabel)}</small>`:''}</div><div class="lane-track"><div class="lane-grid"></div></div>`;const track=lane.querySelector('.lane-track');$('timelineLanes').appendChild(lane);const ends=[];
 for(const s of group.items){let row=ends.findIndex(end=>end<=s.start);if(row<0)row=ends.length;ends[row]=s.end;const chip=document.createElement('button');chip.type='button';chip.className='chip '+(s.source==='wearer'?'w':'l');chip.textContent=excerpt(s);chip.style.top=(9+row*48)+'px';chip.style.left=(s.start/max*100)+'%';chip.style.width=((s.end-s.start)/max*100)+'%';chip.title=`${s.id} · ${s.start.toFixed(1)}–${s.end.toFixed(1)} s · ${excerpt(s)}`;chip.setAttribute('aria-label',chip.title+' · '+text('Click to edit. Drag or use left/right arrows to move.','点击编辑；拖动或按左右方向键调整时间。'));track.appendChild(chip);
 let pointer=null,x0=0,start=0,end=0,moved=false;
 const moveTo=dx=>Math.round(Math.max(0,Math.min(Math.min(max,86400)-(end-start),start+dx))*10)/10;
 const commit=a=>{s.start=a;s.end=Math.round((a+end-start)*10)/10;invalidate();renderAll();say(text('Segment time updated.','片段时间已更新。'))};
 chip.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;x0=e.clientX;start=s.start;end=s.end;moved=false;chip.setPointerCapture(e.pointerId)});
 chip.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const pixels=e.clientX-x0;if(Math.abs(pixels)>4)moved=true;if(moved)chip.style.left=(moveTo(pixels/track.clientWidth*max)/max*100)+'%'});
 chip.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;chip.releasePointerCapture(e.pointerId);if(moved){e.preventDefault();commit(moveTo((e.clientX-x0)/track.clientWidth*max))}else editSegment(s.id)});
 chip.addEventListener('pointercancel',()=>{pointer=null;renderTimeline()});
 chip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();editSegment(s.id)}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();start=s.start;end=s.end;commit(moveTo((e.key==='ArrowLeft'?-1:1)*(e.shiftKey?1:.1)))}});
 }
 track.style.height=(Math.max(1,ends.length)*48+10)+'px';
 }
}
function renderLog(){$('countBadge').textContent=text(`${segments.length} segments`,`${segments.length} 条证据`);$('evidenceLog').innerHTML=segments.length?sorted().map(s=>`<article class="ev ${s.source==='wearer'?'w':'l'}" data-evidence="${esc(s.id)}"><div><div class="meta">${esc(s.id)} &nbsp;·&nbsp; ${s.source==='wearer'?text('WEARER KEYWORDS','佩戴者关键词'):esc(s.speaker)} &nbsp;·&nbsp; ${s.start.toFixed(1)}–${s.end.toFixed(1)} s</div><div class="quote">${esc(excerpt(s))}</div></div><div class="buttons"><button class="btn small" data-edit="${esc(s.id)}">${text('Edit','编辑')}</button><button class="btn small danger" data-delete="${esc(s.id)}">${text('Remove','移除')}</button></div></article>`).join(''):`<div class="empty">${text('Add a fragment to begin.','添加片段，开始整理证据。')}</div>`;$('evidenceLog').querySelectorAll('[data-edit]').forEach(el=>el.onclick=()=>editSegment(el.dataset.edit));$('evidenceLog').querySelectorAll('[data-delete]').forEach(el=>el.onclick=()=>removeSegment(el.dataset.delete))}
function renderAll(){renderTimeline();renderLog();$('jsonView').textContent=assembled.length?JSON.stringify({segments:assembled},null,2):text('Choose “Assemble by time” to create structured evidence.','点击“按时间整理”，生成结构化证据。')}
function assemble(){if(!segments.length){say(text('Add evidence first.','请先添加证据。'),true);return false}assembled=clone(sorted());$('jsonView').textContent=JSON.stringify({segments:assembled},null,2);setStep(2);say(text(`${assembled.length} segments assembled in time order.`,`${assembled.length} 条证据已按时间排序。`));return true}
$('assembleBtn').onclick=assemble;
function confirmReplace(){return !segments.length||confirm(text('Replace the current evidence? Export JSON first if you want to keep it.','替换当前证据？如需保留，请先导出 JSON。'))}
$('clearBtn').onclick=()=>{if(segments.length&&!confirm(text('Clear the evidence and results?','清空当前证据与结果？')))return;invalidate();segments=[];cancelEdit();renderAll();say(text('Ready for new evidence.','可以添加新的证据。'))};
function showResult(output,mode){result={...output,mode,language:lang};$('meaning').textContent=output.dialogue||text('No conversation link established','尚未建立对话关联');$('chain').innerHTML=(Array.isArray(output.links)?output.links:[]).map(link=>`<div>${esc(link)}</div>`).join('');const fields=[['remote_role',text('Remote role','远端角色')],['identity',text('Wearer identity','佩戴者身份')],['scene',text('Conversation context','对话情境')],['age_group',text('Age group','年龄段')],['financial_sensitivity',text('Financial sensitivity','金融敏感度')]];$('profileGrid').innerHTML=fields.map(([name,label])=>{const field=output.profile?.[name]||{},refs=Array.isArray(field.evidence)?field.evidence.filter(id=>segments.some(s=>s.id===id)):[];return `<div class="attr"><label>${label}</label><strong>${esc(field.label||text('Undetermined','未确定'))}</strong>${refs.length?`<div class="why">${refs.map(id=>`<button class="ref" data-ref="${esc(id)}" title="${text('View evidence','查看证据')}">${esc(id)}</button>`).join('')}</div>`:''}</div>`}).join('');$('profileGrid').querySelectorAll('[data-ref]').forEach(button=>button.onclick=()=>{const ev=[...$('evidenceLog').children].find(el=>el.dataset.evidence===button.dataset.ref);if(ev){ev.scrollIntoView({behavior:'smooth',block:'center'});ev.classList.add('highlight');setTimeout(()=>ev.classList.remove('highlight'),2000)}});$('rawResult').textContent=JSON.stringify(result,null,2);$('analysisMode').textContent=mode==='model'?text('Model analysis','模型分析'):text('Rule demo result','规则演示结果');$('exportResult').disabled=false;setStep(4)}
$('localRun').onclick=()=>{if(!assembled.length&&!assemble())return;if(controller){controller.abort();controller=null}showResult(analyzeLocally(assembled,lang),'local');$('analysisStatus').textContent=text('Rule demo complete. Preset rules were used; no language model was called. Inspect each result’s evidence.','规则演示已完成：采用预设规则，未调用大模型。可点击引用查看证据。')};
function modelConnection() {
  $('serverStatus').textContent = backend ? text('Local proxy ready', '本地代理已就绪') : text('Browser connection', '浏览器直连');
  let destination = '';
  try { destination = new URL(globalThis.PaintingUModel.completionURL($('apiBase').value, lang)).origin; } catch (_) {}
  $('apiDestination').textContent = destination
    ? text('Model analysis sends this evidence and your API key to ', '模型分析将把当前证据和 API 密钥发送至 ') + destination + (backend ? text(' through your local proxy.', '，经本地代理转发。') : text(' directly from your browser.', '，由浏览器直接请求。'))
    : text('Enter your provider endpoint. Model analysis sends the evidence and key only to that endpoint.', '填写您使用的服务商接口；模型分析时，证据和密钥只发送至该接口。');
}
$('toggleApiKey').onclick=()=>{const visible=$('apiKey').type==='password';$('apiKey').type=visible?'text':'password';$('toggleApiKey').setAttribute('aria-pressed',String(visible));$('toggleApiKey').textContent=visible?text('Hide key','隐藏密钥'):text('Show key','显示密钥')};
$('clearApiKey').onclick=()=>{$('apiKey').value='';$('apiKey').type='password';$('toggleApiKey').setAttribute('aria-pressed','false');$('toggleApiKey').textContent=text('Show key','显示密钥');$('apiKey').dispatchEvent(new Event('input'));$('analysisStatus').textContent=text('API key cleared from this page.','本页 API 密钥已清除。')};
for(const id of ['apiBase','apiModel','apiKey']) $(id).addEventListener('input',()=>{
  if(controller){revision++;controller.abort();controller=null;$('analysisStatus').textContent=text('API configuration changed. Run model analysis again.','API 配置已更改，请重新运行模型分析。')}
  modelConnection();
});
window.addEventListener('pagehide',()=>{$('apiKey').value='';if(controller){controller.abort();controller=null}});
$('modelRun').onclick=async()=>{
  $('modelSettings').open=true;
  const endpoint=$('apiBase').value.trim(),model=$('apiModel').value.trim(),key=$('apiKey').value.trim();
  for(const [id,value] of [['apiBase',endpoint],['apiModel',model],['apiKey',key]]) {
    if(!value){$('analysisStatus').textContent=text('Enter the API URL, model name, and key.','请填写 API 地址、模型名称和密钥。');$(id).focus();return}
  }
  try { globalThis.PaintingUModel.completionURL(endpoint,lang); } catch(error) {$('analysisStatus').textContent=error.message;$('apiBase').focus();return}
  if(!assembled.length&&!assemble())return;
  modelConnection();
  const version=revision,requestController=new AbortController();controller=requestController;
  const button=$('modelRun');button.disabled=true;button.classList.add('busy');setStep(3);
  $('analysisStatus').textContent=text('Your model is analyzing the evidence…','模型正在分析证据…');
  const timer=setTimeout(()=>requestController.abort('timeout'),70000);
  try {
    let output;
    if(backend){
      const response=await fetch('/api/infer',{method:'POST',headers:{'Content-Type':'application/json'},redirect:'error',cache:'no-store',signal:requestController.signal,body:JSON.stringify({endpoint,model,key,language:lang,segments:clone(assembled)})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||text('Model request failed','模型请求失败'));
      output=globalThis.PaintingUModel.normalizeResult(data.result,assembled,lang);
    } else {
      output=await globalThis.PaintingUModel.requestModel({endpoint,model,key,language:lang,segments:clone(assembled),signal:requestController.signal});
    }
    if(version!==revision||controller!==requestController)return;
    showResult(output,'model');$('analysisStatus').textContent=text('Model analysis complete. Review the linked evidence for each inference.','模型分析完成，请结合引用证据核对各项推断。');
  } catch(error) {
    if(version!==revision||controller!==requestController)return;
    setStep(result?4:2);
    $('analysisStatus').textContent=requestController.signal.aborted?text('Request timed out. Check the model service and try again.','请求超时，请检查模型服务后重试。'):text('Model request failed: ','模型请求失败：')+error.message;
  } finally {
    clearTimeout(timer);if(controller===requestController)controller=null;button.disabled=false;button.classList.remove('busy');
  }
};
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportBtn').onclick=()=>{if(!assembled.length&&!assemble())return;download({segments:assembled},'painting-u-evidence.json');say(text('Evidence exported.','证据已导出。'))};
$('exportResult').onclick=()=>{if(result)download(result,`painting-u-result-${lang}.json`)};
$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>6000000)throw Error('File exceeds 6 MB');const parsed=JSON.parse(await file.text()),rows=Array.isArray(parsed)?parsed:parsed.segments;if(!Array.isArray(rows))throw Error('JSON must contain a segments array');const safe=validateSegments(rows);if(!confirmReplace())return;invalidate();segments=safe;cancelEdit();renderAll();say(text(`Imported ${segments.length} segments.`,`已导入 ${segments.length} 条证据。`))}catch(error){say(errorMessage(error),true)}finally{e.target.value=''}};
// Pass only evidence between language pages, never model credentials.
const handoffKey='painting-u-language-handoff';document.querySelectorAll('.language-switch a').forEach(a=>a.addEventListener('click',()=>{try{sessionStorage.setItem(handoffKey,JSON.stringify({segments}))}catch(_){}}));
try{const handoff=sessionStorage.getItem(handoffKey);sessionStorage.removeItem(handoffKey);if(handoff){const data=JSON.parse(handoff);if(data.example!==true)segments=data.segments.length?validateSegments(data.segments):[]}}catch(_){}
resetResult();renderAll();
modelConnection();
if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
  const check=new AbortController(),timer=setTimeout(()=>check.abort(),3000);
  fetch('/api/status',{signal:check.signal,cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{
    backend=data?.service==='painting-u';modelConnection();
  }).catch(()=>{}).finally(()=>clearTimeout(timer));
}

const exampleRows = [
 {id:'L01',source:'loudspeaker',start:0.7,end:3.0,speaker:'Remote speaker 1',quality:'distorted',text:text("I'm customer support. Please read the verification code.","我是客服，请读出验证码。")},
 {id:'W02',source:'wearer',start:3.5,end:7.6,keywords:[text('verification','验证码'),'6','0','6','9','8','2']},
 {id:'L03',source:'loudspeaker',start:8.2,end:11.7,speaker:'Remote speaker 1',quality:'distorted',text:text("Thank you. I'll handle [unclear].","谢谢，我来处理[模糊]。")},
 {id:'W04',source:'wearer',start:12.4,end:16.7,keywords:[]}
];
function loadExample(){
 if(!confirmReplace())return;
 invalidate();segments=validateSegments(clone(exampleRows));cancelEdit();renderAll();assemble();
 say(text('Illustrative example loaded. Run the rule demo to inspect the supporting evidence.','说明性示例已加载。运行规则演示，查看各项结果的支持证据。'));
}
$('loadExample').addEventListener('click',loadExample);
const entryParams=new URLSearchParams(location.search),caseId=entryParams.get('case');
function loadDialogueCase(id){
 if(!confirmReplace())return;
 try{
  const rows=globalThis.PaintingUCaseLibrary.evidence(id,lang),safe=validateSegments(rows);
  invalidate();segments=safe;cancelEdit();renderAll();assemble();
  say(text('Dialogue case loaded. Wearer evidence contains only the marked fragments; times illustrate turn order.','对话案例已载入。佩戴者端仅含原高亮片段；时间仅用于演示发言顺序。'));
 }catch(error){say(text('Could not load this dialogue case. Open the case library and try again.','该对话案例无法加载，请从案例页重新打开。'),true)}
}
if(caseId&&!segments.length)loadDialogueCase(caseId);
else if(entryParams.get('example')==='verification'&&!segments.length)loadExample();

})();
