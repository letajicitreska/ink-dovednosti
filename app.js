(function(){
'use strict';
var NAMES=['NEROZVINUTÁ','UVĚDOMĚLÁ','OVLÁDNUTÁ','INTEGROVANÁ'];
var KEY='dov_v1';
var S={};DATA.sections.forEach(function(s){S[s.id]=s});
var store={levels:{},history:[]};
try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&p.levels)store=p}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
var filter='all',cur=0,visible=DATA.cards;
function $(id){return document.getElementById(id)}
function lvl(c){return store.levels[c.id]||0}
function dots(n,c){var h='<span class="dots" style="--c:'+c+'">';for(var i=0;i<n;i++)h+='<i></i>';return h+'</span>'}
function badge(c){var l=lvl(c);if(!l)return'';var col=S[c.section].color,h='<div class="lv" style="--c:'+col+'" aria-label="Moje úroveň '+l+' ze 4">';for(var i=1;i<=4;i++)h+='<i class="'+(i<=l?'f':'')+'"></i>';return h+'</div>'}
function renderTiles(){
  $('tiles').innerHTML=DATA.sections.map(function(s){
    var all=DATA.cards.filter(function(c){return c.section===s.id}),done=all.filter(function(c){return lvl(c)}).length;
    return '<button class="tile'+(filter!=='all'&&filter!==s.id?' off':'')+'" data-f="'+s.id+'" style="background:'+s.color+'"><div class="r"><b>'+s.name+'</b><img src="'+s.icon+'" alt=""></div><small>'+done+' z '+all.length+' označeno</small></button>'}).join('');
  Array.prototype.forEach.call($('tiles').querySelectorAll('button'),function(b){b.onclick=function(){filter=filter===b.dataset.f?'all':b.dataset.f;renderTiles();renderList();if(filter!=='all')$('fbar').scrollIntoView({behavior:'smooth',block:'start'})}});
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
  Array.prototype.forEach.call($('list').querySelectorAll('.card'),function(b){b.onclick=function(){openCard(+b.dataset.id,true)}});
}
function openCard(id,push){
  cur=visible.findIndex(function(c){return c.id===id});
  if(cur<0){visible=DATA.cards;cur=visible.findIndex(function(c){return c.id===id})}
  drawDetail();$('detail').classList.add('open');$('detail').setAttribute('aria-hidden','false');$('detail').scrollTop=0;
  if(push)try{history.pushState({card:id},'','#karta-'+id)}catch(e){}
}
function closeDetail(){$('detail').classList.remove('open');$('detail').setAttribute('aria-hidden','true')}
function drawDetail(){
  var c=visible[cur],s=S[c.section],l=lvl(c);
  $('dpos').textContent=(cur+1)+' / '+visible.length;
  $('sheet').innerHTML='<div class="hd"><div class="row"><span class="lab">'+s.name+'</span><img src="'+s.icon+'" alt=""></div><h2>'+c.name+'</h2></div><p class="def" style="background:'+s.color+'">'+c.definition+'</p><div class="levels" style="--c:'+s.color+'">'+
    c.levels.map(function(t,i){return '<button class="level'+(l===i+1?' sel':'')+'" data-l="'+(i+1)+'"><div class="h">'+dots(i+1,s.color)+'<span class="nm">'+NAMES[i]+'</span><span class="chk">Jsem tady</span></div><p>'+t+'</p></button>'}).join('')+'</div>';
  Array.prototype.forEach.call($('sheet').querySelectorAll('.level'),function(b){b.onclick=function(){
    var v=+b.dataset.l,nv=store.levels[c.id]===v?0:v;
    if(nv)store.levels[c.id]=nv;else delete store.levels[c.id];
    store.history.push({t:Date.now(),id:c.id,l:nv});
    save();drawDetail();renderList();renderTiles();
  }});
}
function go(d){cur=(cur+d+visible.length)%visible.length;drawDetail();$('detail').scrollTop=0;try{history.replaceState({card:visible[cur].id},'','#karta-'+visible[cur].id)}catch(e){}}
$('back').onclick=function(){if(location.hash.indexOf('#karta-')===0)history.back();else closeDetail()};
$('prev').onclick=function(){go(-1)};
$('next').onclick=function(){go(1)};
$('lgBtn').onclick=function(){$('legend').classList.add('open')};
$('lgClose').onclick=function(){$('legend').classList.remove('open')};
$('legend').onclick=function(e){if(e.target===$('legend'))$('legend').classList.remove('open')};
window.addEventListener('popstate',function(){var m=location.hash.match(/^#karta-(\d+)/);if(m)openCard(+m[1],false);else closeDetail()});
renderTiles();renderList();
var m0=location.hash.match(/^#karta-(\d+)/);if(m0)openCard(+m0[1],false);
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
