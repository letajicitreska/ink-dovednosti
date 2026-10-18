(function(){
'use strict';
var NAMES=['NEROZVINUTÁ','UVĚDOMĚLÁ','OVLÁDNUTÁ','INTEGROVANÁ'];
var KEY='dov_v1';
var DAY=86400000;
var S={};DATA.sections.forEach(function(s){S[s.id]=s});
var CARD={};DATA.cards.forEach(function(c){CARD[c.id]=c});
var store={levels:{},history:[],snaps:[]};
try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&p.levels)store=p}}catch(e){}
if(!store.history)store.history=[];
if(!store.snaps)store.snaps=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
var filter='all',cur=0,visible=DATA.cards,view='cards',cmpKey=null,saving=false;
function $(id){return document.getElementById(id)}
function esc(t){return String(t).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]})}
function lvl(c){return store.levels[c.id]||0}
function each(sel,root,fn){Array.prototype.forEach.call((root||document).querySelectorAll(sel),fn)}
function dots(n,c){var h='<span class="dots" style="--c:'+c+'">';for(var i=0;i<n;i++)h+='<i></i>';return h+'</span>'}
function ring(l,col){var h='<span class="dd" style="--c:'+col+'">';for(var i=1;i<=4;i++)h+='<i class="'+(i<=l?'f':'')+'"></i>';return h+'</span>'}
function badge(c){var l=lvl(c);if(!l)return'';var col=S[c.section].color,h='<div class="lv" style="--c:'+col+'" aria-label="Moje úroveň '+l+' ze 4">';for(var i=1;i<=4;i++)h+='<i class="'+(i<=l?'f':'')+'"></i>';return h+'</div>'}
function fmt(t){var d=new Date(t);return d.getDate()+'. '+(d.getMonth()+1)+'. '+d.getFullYear()}
function toast(t){var el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);setTimeout(function(){el.remove()},2200)}

/* ---------- Karty ---------- */
function renderTiles(){
  $('tiles').innerHTML=DATA.sections.map(function(s){
    var all=DATA.cards.filter(function(c){return c.section===s.id}),done=all.filter(function(c){return lvl(c)}).length;
    return '<button class="tile'+(filter!=='all'&&filter!==s.id?' off':'')+'" data-f="'+s.id+'" style="background:'+s.color+'"><div class="r"><b>'+s.name+'</b><img src="'+s.icon+'" alt=""></div><small>'+done+' z '+all.length+' označeno</small></button>'}).join('');
  each('button',$('tiles'),function(b){b.onclick=function(){filter=filter===b.dataset.f?'all':b.dataset.f;renderTiles();renderList();if(filter!=='all')$('fbar').scrollIntoView({behavior:'smooth',block:'start'})}});
}
function renderList(){
  var n=DATA.cards.filter(function(c){return lvl(c)}).length;
  $('fbar').innerHTML=filter==='all'
    ?'<span>Označeno '+n+' z '+DATA.cards.length+'. Klepněte na kartu a vyberte, kde jste.</span>'
    :'<span>'+S[filter].name+'</span><button class="link" id="clr">Zobrazit vše</button>';
  if($('clr'))$('clr').onclick=function(){filter='all';renderTiles();renderList()};
  visible=DATA.cards.filter(function(c){return filter==='all'||c.section===filter});
  var h='',last='';
  visible.forEach(function(c){
    var s=S[c.section];
    if(filter==='all'&&c.section!==last){h+='<div class="secttl">'+s.name+'</div>';last=c.section}
    h+='<button class="card" data-id="'+c.id+'"><div class="t"><span class="lab">'+s.name+'</span><img src="'+s.icon+'" alt=""><h2>'+c.name+'</h2></div><div class="b" style="background:'+s.color+'"><p>'+c.definition+'</p><img src="logo-white.png" alt="INK"></div>'+badge(c)+'</button>';
  });
  $('list').innerHTML=h;
  each('.card',$('list'),function(b){b.onclick=function(){openCard(+b.dataset.id,true,visible)}});
}

/* ---------- Detail karty ---------- */
var navList=DATA.cards;
function openCard(id,push,list){
  navList=list||DATA.cards;
  cur=navList.findIndex(function(c){return c.id===id});
  if(cur<0){navList=DATA.cards;cur=navList.findIndex(function(c){return c.id===id})}
  drawDetail();$('detail').classList.add('open');$('detail').setAttribute('aria-hidden','false');$('detail').scrollTop=0;
  if(push)try{history.pushState({card:id},'','#karta-'+id)}catch(e){}
}
function closeDetail(){$('detail').classList.remove('open');$('detail').setAttribute('aria-hidden','true')}
function drawDetail(){
  var c=navList[cur],s=S[c.section],l=lvl(c);
  $('dpos').textContent=(cur+1)+' / '+navList.length;
  $('sheet').innerHTML='<div class="hd"><div class="row"><span class="lab">'+s.name+'</span><img src="'+s.icon+'" alt=""></div><h2>'+c.name+'</h2></div><p class="def" style="background:'+s.color+'">'+c.definition+'</p><div class="levels" style="--c:'+s.color+'">'+
    c.levels.map(function(t,i){return '<button class="level'+(l===i+1?' sel':'')+'" data-l="'+(i+1)+'"><div class="h">'+dots(i+1,s.color)+'<span class="nm">'+NAMES[i]+'</span><span class="chk">✓ Moje úroveň</span></div><p>'+t+'</p></button>'}).join('')+(l?'<button class="link unset" id="unset">Zrušit označení</button>':'')+'</div>';
  if($('unset'))$('unset').onclick=function(){setLevel(c,0)};
  each('.level',$('sheet'),function(b){b.onclick=function(){var v=+b.dataset.l;if(store.levels[c.id]===v)return;setLevel(c,v)}});
}
function setLevel(c,nv){
  if(nv)store.levels[c.id]=nv;else delete store.levels[c.id];
  store.history.push({t:Date.now(),id:c.id,l:nv});
  save();drawDetail();renderList();renderTiles();if(view==='map')renderMap();
}
function go(d){cur=(cur+d+navList.length)%navList.length;drawDetail();$('detail').scrollTop=0;try{history.replaceState({card:navList[cur].id},'','#karta-'+navList[cur].id)}catch(e){}}

/* ---------- Moje mapa ---------- */
function levelsAt(T){var o={};store.history.forEach(function(h){if(h.t<=T){if(h.l)o[h.id]=h.l;else delete o[h.id]}});return o}
function firstT(){return store.history.length?store.history[0].t:null}
function cmpOptions(){
  var opts=[],f=firstT(),now=Date.now();
  store.snaps.slice().reverse().forEach(function(s){opts.push({k:'s'+s.t,t:s.t,label:s.name+' · '+fmt(s.t)})});
  [[7,'Před týdnem'],[30,'Před měsícem'],[91,'Před 3 měsíci'],[182,'Před půl rokem'],[365,'Před rokem']].forEach(function(a){
    var T=now-a[0]*DAY;if(f&&f<=T)opts.push({k:'d'+a[0],t:T,label:a[1]+' · '+fmt(T)})});
  if(f&&now-f>DAY)opts.push({k:'first',t:f+1000,label:'Na začátku · '+fmt(f)});
  return opts;
}
function avg(st,sid){var a=DATA.cards.filter(function(c){return c.section===sid&&st[c.id]}).map(function(c){return st[c.id]});return a.length?a.reduce(function(x,y){return x+y},0)/a.length:0}
function radar(nowSt,oldSt,oldLabel){
  var cx=215,cy=152,R=110,secs=DATA.sections;
  function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/6;return [cx+Math.cos(a)*R*v/4,cy+Math.sin(a)*R*v/4]}
  function poly(st){return secs.map(function(x,i){return pt(i,avg(st,x.id)).map(function(n){return n.toFixed(1)}).join(',')}).join(' ')}
  var s='<svg viewBox="0 2 412 300" role="img" aria-label="Průměrná úroveň v jednotlivých sekcích">';
  for(var r=1;r<=4;r++)s+='<polygon points="'+secs.map(function(_,i){return pt(i,r).join(',')}).join(' ')+'" fill="none" stroke="#E3E1DD" stroke-width="1.5"/>';
  secs.forEach(function(x,i){var p=pt(i,4);s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="#E3E1DD" stroke-width="1.5"/>'});
  if(oldSt)s+='<polygon points="'+poly(oldSt)+'" fill="none" stroke="#25444F" stroke-width="2" stroke-dasharray="5 4" opacity=".55"/>';
  s+='<polygon points="'+poly(nowSt)+'" fill="rgba(208,181,239,.45)" stroke="#25444F" stroke-width="2.5" stroke-linejoin="round"/>';
  secs.forEach(function(x,i){var a=avg(nowSt,x.id),p=pt(i,a);s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="'+x.color+'" stroke="#fff" stroke-width="2"/>';
    var q=pt(i,4.75),anc=Math.abs(q[0]-cx)<5?'middle':(q[0]>cx?'start':'end');
    var nm=x.name.replace('Navigování v konverzaci','Navigování').replace('Práce s konfliktem','Konflikt');
    s+='<text x="'+q[0]+'" y="'+(q[1]+4)+'" text-anchor="'+anc+'" font-size="12.5" font-weight="700" fill="'+x.color+'" font-family="Haffer,Arial,sans-serif">'+nm+'</text>'});
  s+='</svg>';
  return '<div class="rbox">'+s+'<div class="rleg"><span><i></i>Teď</span>'+(oldSt?'<span><i class="d"></i>'+esc(oldLabel)+'</span>':'')+'</div></div>';
}
function renderMap(){
  var n=Object.keys(store.levels).length,h='';
  if(!n&&!store.history.length){
    $('map').innerHTML='<div class="empty"><b>Zatím nemáte nic označeno.</b><br>Projděte si karty a u každé dovednosti vyberte úroveň, která vás nejlépe vystihuje. Tady pak uvidíte svou mapu a jak se v čase mění.<br><button class="pill" id="goCards">Přejít na karty</button></div>'+tools();
    $('goCards').onclick=function(){setView('cards',true)};bindTools();return;
  }
  var opts=cmpOptions();
  if(cmpKey!=='none'&&!opts.some(function(o){return o.k===cmpKey}))cmpKey=opts.length?opts[0].k:'none';
  var sel=opts.filter(function(o){return o.k===cmpKey})[0];
  var oldSt=sel?levelsAt(sel.t):null;
  h+='<div class="cmp"><label for="cmpSel">Srovnat s:</label><select id="cmpSel"><option value="none">Bez srovnání</option>'+opts.map(function(o){return '<option value="'+o.k+'"'+(o.k===cmpKey?' selected':'')+'>'+esc(o.label)+'</option>'}).join('')+'</select></div>';
  h+=radar(store.levels,oldSt,sel?sel.label:'');
  h+='<p class="small">Graf ukazuje průměr označených dovedností v každé sekci (1–4). Klepnutím na dovednost ji otevřete.</p>';
  DATA.sections.forEach(function(s){
    h+='<div class="mst" style="color:'+s.color+'">'+s.name+'</div>';
    DATA.cards.filter(function(c){return c.section===s.id}).forEach(function(c){
      var l=lvl(c),d='';
      if(oldSt){var o=oldSt[c.id]||0;if(l&&o&&l!==o)d='<span class="delta" style="color:'+(l>o?'#07824b':'#ac2347')+'">'+(l>o?'+':'−')+Math.abs(l-o)+'</span>';else if(l&&!o)d='<span class="delta" style="color:#25444F">nové</span>'}
      h+='<button class="mrow" data-id="'+c.id+'"><span>'+c.name+'</span><span class="r">'+ring(l,s.color)+d+'</span></button>';
    });
  });
  h+=tools();
  $('map').innerHTML=h;
  $('cmpSel').onchange=function(){cmpKey=this.value;renderMap()};
  each('.mrow',$('map'),function(b){b.onclick=function(){openCard(+b.dataset.id,true,DATA.cards)}});
  bindTools();
}
function tools(){
  var h='<div class="tools"><div class="mst" style="margin-top:4px">Uložené stavy</div>';
  if(saving)h+='<div class="saveform"><input id="snapName" maxlength="40" placeholder="Např. Po kurzu Základy" aria-label="Název uloženého stavu"><button class="pill" id="snapOk">Uložit</button></div>';
  else h+='<button class="pill" id="snapBtn">Uložit současný stav</button>';
  if(store.snaps.length)h+='<div class="snaps">'+store.snaps.slice().reverse().map(function(s){return '<div><span>'+esc(s.name)+' · '+fmt(s.t)+'</span><button class="link" data-del="'+s.t+'">Smazat</button></div>'}).join('')+'</div>';
  h+='<p class="small">Uložený stav je pojmenovaný bod v čase, třeba po kurzu, se kterým se můžete později srovnat. Změny se navíc zaznamenávají automaticky.</p>';
  h+='<div class="mst">Záloha</div><div class="row2"><button class="pill" id="expBtn">Uložit zálohu</button><button class="pill" id="impBtn">Nahrát zálohu</button></div>';
  h+='<p class="small">Data jsou jen v tomto zařízení. Zálohou si je přenesete do jiného telefonu nebo prohlížeče.</p></div>';
  return h;
}
function bindTools(){
  if($('snapBtn'))$('snapBtn').onclick=function(){saving=true;renderMap();var i=$('snapName');if(i)i.focus()};
  if($('snapOk'))$('snapOk').onclick=function(){
    var nm=($('snapName').value||'').trim()||('Stav '+fmt(Date.now()));
    var t=Date.now();store.snaps.push({t:t,name:nm});save();saving=false;cmpKey='s'+t;renderMap();toast('Stav uložen')};
  if($('snapName'))$('snapName').onkeydown=function(e){if(e.key==='Enter')$('snapOk').click()};
  each('[data-del]',$('map'),function(b){b.onclick=function(){var t=+b.dataset.del;if(!confirm('Smazat tento uložený stav?'))return;store.snaps=store.snaps.filter(function(s){return s.t!==t});save();renderMap()}});
  $('expBtn').onclick=exportData;
  $('impBtn').onclick=function(){$('impFile').value='';$('impFile').click()};
}
function exportData(){
  var data=JSON.stringify({app:'dovednosti.ink.cz',v:1,exported:Date.now(),store:store});
  var name='dovednosti-zaloha-'+new Date().toISOString().slice(0,10)+'.json';
  try{
    var file=new File([data],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Android/i.test(navigator.userAgent)){navigator.share({files:[file],title:'Záloha dovedností'}).catch(function(){});return}
  }catch(e){}
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);toast('Záloha uložena');
}
$('impFile').onchange=function(){
  var f=this.files&&this.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    try{var d=JSON.parse(r.result),st=d.store||d;if(!st||typeof st.levels!=='object')throw 0;
      if(!confirm('Nahrát zálohu? Současná data v tomto zařízení se nahradí daty ze zálohy.'))return;
      store={levels:st.levels||{},history:st.history||[],snaps:st.snaps||[]};save();cmpKey=null;renderAll();toast('Záloha nahrána');
    }catch(e){toast('Soubor se nepodařilo načíst')}
  };
  r.readAsText(f);
};

/* ---------- Přepínání ---------- */
function setView(v,push){
  view=v;$('vCards').hidden=v!=='cards';$('vMap').hidden=v!=='map';
  $('tCards').classList.toggle('on',v==='cards');$('tMap').classList.toggle('on',v==='map');
  if(v==='map'){saving=false;renderMap()}
  window.scrollTo(0,0);
  if(push)try{history.pushState({view:v},'',v==='map'?'#mapa':location.pathname+location.search)}catch(e){}
}
function renderAll(){renderTiles();renderList();if(view==='map')renderMap()}
function route(){
  var m=location.hash.match(/^#karta-(\d+)/);
  if(m){openCard(+m[1],false,navList);return}
  closeDetail();
  var v=location.hash==='#mapa'?'map':'cards';
  if(v!==view)setView(v,false);
}
$('tCards').onclick=function(){if(view!=='cards')setView('cards',true)};
$('tMap').onclick=function(){if(view!=='map')setView('map',true)};
$('back').onclick=function(){if(location.hash.indexOf('#karta-')===0&&history.state&&history.state.card)history.back();else{closeDetail();try{history.replaceState(null,'',view==='map'?'#mapa':location.pathname+location.search)}catch(e){}}};
$('prev').onclick=function(){go(-1)};
$('next').onclick=function(){go(1)};
$('lgBtn').onclick=function(){$('legend').classList.add('open')};
$('lgClose').onclick=function(){$('legend').classList.remove('open')};
$('legend').onclick=function(e){if(e.target===$('legend'))$('legend').classList.remove('open')};
window.addEventListener('popstate',route);
renderTiles();renderList();
if(location.hash==='#mapa')setView('map',false);
var m0=location.hash.match(/^#karta-(\d+)/);if(m0)openCard(+m0[1],false);
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
