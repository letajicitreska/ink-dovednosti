(function(){
'use strict';
var NAMES=['NEROZVINUTÁ','UVĚDOMĚLÁ','OVLÁDNUTÁ','INTEGROVANÁ'];
var KEY='dov_v1',MAXP=3,DAY=86400000;
var SPOTIFY='https://open.spotify.com/show/6c95sv7fHovUieEGBRQjex';
var UTM='utm_source=dovednosti.ink.cz&utm_medium=app&utm_campaign=';
var S={};DATA.sections.forEach(function(s){S[s.id]=s});
var CARD={};DATA.cards.forEach(function(c){CARD[c.id]=c});
var store={levels:{},history:[],snaps:[],prio:[],intro:0};
try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&p.levels)store=p}}catch(e){}
['history','snaps','prio'].forEach(function(k){if(!Array.isArray(store[k]))store[k]=[]});
store.prio=store.prio.filter(function(id){return CARD[id]});
function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
var filter='all',cur=0,visible=DATA.cards,navList=DATA.cards,view='cards',cmpKey=null,saving=false,PROMO=null,finder=null;
function $(id){return document.getElementById(id)}
function esc(t){return String(t).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]})}
function lvl(c){return store.levels[c.id]||0}
function each(sel,root,fn){Array.prototype.forEach.call((root||document).querySelectorAll(sel),fn)}
function dots(n,c){var h='<span class="dots" style="--c:'+c+'">';for(var i=0;i<n;i++)h+='<i></i>';return h+'</span>'}
function ring(l,col){var h='<span class="dd" style="--c:'+col+'">';for(var i=1;i<=4;i++)h+='<i class="'+(i<=l?'f':'')+'"></i>';return h+'</span>'}
function isPrio(id){return store.prio.indexOf(id)>=0}
function badge(c){var l=lvl(c),pr=isPrio(c.id);if(!l&&!pr)return'';var col=S[c.section].color,h='<div class="lv" style="--c:'+col+'">'+(pr?'<b class="star" aria-label="V prioritách">★</b>':'');if(l)for(var i=1;i<=4;i++)h+='<i class="'+(i<=l?'f':'')+'"></i>';return h+'</div>'}
function fmt(t){var d=new Date(t);return d.getDate()+'. '+(d.getMonth()+1)+'. '+d.getFullYear()}
function fmtISO(s){var a=s.split('-');return (+a[2])+'. '+(+a[1])+'. '+a[0]}
function toast(t){var el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);setTimeout(function(){el.remove()},2400)}
function utm(u,c){return u+(u.indexOf('?')<0?'?':'&')+UTM+c}

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
  h+='<p class="printnote">Kartičky dovedností máme i v tištěné podobě. <a href="mailto:info@ink.cz?subject=Objedn%C3%A1vka%20ti%C5%A1t%C4%9Bn%C3%BDch%20karti%C4%8Dek%20dovednost%C3%AD">Napište nám</a>, pokud o ně máte zájem.</p>';
  $('list').innerHTML=h;
  each('.card',$('list'),function(b){b.onclick=function(){openCard(+b.dataset.id,true,DATA.cards)}});
}

/* ---------- Detail karty ---------- */
function openCard(id,push,list){
  navList=list||DATA.cards;
  cur=navList.findIndex(function(c){return c.id===id});
  if(cur<0){navList=DATA.cards;cur=navList.findIndex(function(c){return c.id===id})}
  if(cur<0)return;
  drawDetail();$('detail').classList.add('open');$('detail').setAttribute('aria-hidden','false');$('detail').scrollTop=0;
  if(push)try{history.pushState({card:id},'','#karta-'+id)}catch(e){}
}
function closeDetail(){$('detail').classList.remove('open');$('detail').setAttribute('aria-hidden','true')}
function coursesFor(id){if(!PROMO)return[];return PROMO.courses.filter(function(k){return (k.skills||[]).indexOf(id)>=0})}
function drawDetail(){
  var c=navList[cur],s=S[c.section],l=lvl(c),pr=isPrio(c.id);
  $('dpos').textContent=(cur+1)+' / '+navList.length;
  var ks=coursesFor(c.id).slice(0,2);
  $('sheet').innerHTML='<div class="hd"><div class="row"><span class="lab">'+s.name+'</span><img src="'+s.icon+'" alt=""></div><h2>'+c.name+'</h2></div><p class="def" style="background:'+s.color+'">'+c.definition+'</p><div class="levels" style="--c:'+s.color+'">'+
    c.levels.map(function(t,i){return '<button class="level'+(l===i+1?' sel':'')+'" data-l="'+(i+1)+'"><div class="h">'+dots(i+1,s.color)+'<span class="nm">'+NAMES[i]+'</span><span class="chk">✓ Moje úroveň</span></div><p>'+t+'</p></button>'}).join('')+
    (l?'<button class="link unset" id="unset">Zrušit označení</button>':'')+
    '<button class="pill prioBtn'+(pr?' on':'')+'" id="prioBtn" style="--c:'+s.color+'">'+(pr?'★ V prioritách · odebrat':'☆ Přidat do priorit')+'</button>'+
    (ks.length?'<div class="ktip"><b>Trénuje se na kurzu</b>'+ks.map(function(k){return '<a href="'+esc(utm(k.url,'karta'))+'" target="_blank" rel="noopener">'+esc(k.title)+' <span>'+fmtISO(k.date)+(k.sub?' · '+esc(k.sub):'')+'</span></a>'}).join('')+'</div>':'')+
    '</div>';
  if($('unset'))$('unset').onclick=function(){setLevel(c,0)};
  $('prioBtn').onclick=function(){togglePrio(c.id);drawDetail()};
  each('.level',$('sheet'),function(b){b.onclick=function(){var v=+b.dataset.l;if(store.levels[c.id]===v)return;setLevel(c,v)}});
}
function setLevel(c,nv){
  if(nv)store.levels[c.id]=nv;else delete store.levels[c.id];
  store.history.push({t:Date.now(),id:c.id,l:nv});
  save();drawDetail();renderList();renderTiles();rerenderView();
}
function togglePrio(id){
  var i=store.prio.indexOf(id);
  if(i>=0)store.prio.splice(i,1);
  else{if(store.prio.length>=MAXP){toast('Priority jsou nejvýš '+MAXP+'. Nejdřív jednu odeberte.');return}store.prio.push(id);toast('Přidáno do priorit')}
  save();renderList();rerenderView();
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
function radarSvg(nowSt,oldSt,mono){
  var cx=215,cy=152,R=110,secs=DATA.sections,ink=mono?'#000':'#25444F',grid=mono?'#bbb':'#E3E1DD';
  function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/6;return [cx+Math.cos(a)*R*v/4,cy+Math.sin(a)*R*v/4]}
  function poly(st){return secs.map(function(x,i){return pt(i,avg(st,x.id)).map(function(n){return n.toFixed(1)}).join(',')}).join(' ')}
  var s='<svg viewBox="0 2 412 300" role="img" aria-label="Průměrná úroveň v jednotlivých sekcích">';
  for(var r=1;r<=4;r++)s+='<polygon points="'+secs.map(function(_,i){return pt(i,r).join(',')}).join(' ')+'" fill="none" stroke="'+grid+'" stroke-width="1.5"/>';
  secs.forEach(function(x,i){var p=pt(i,4);s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="'+grid+'" stroke-width="1.5"/>'});
  if(oldSt)s+='<polygon points="'+poly(oldSt)+'" fill="none" stroke="'+ink+'" stroke-width="2" stroke-dasharray="5 4" opacity=".55"/>';
  s+='<polygon points="'+poly(nowSt)+'" fill="'+(mono?'none':'rgba(208,181,239,.45)')+'" stroke="'+ink+'" stroke-width="2.5" stroke-linejoin="round"/>';
  secs.forEach(function(x,i){var a=avg(nowSt,x.id),p=pt(i,a);s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(mono?4:6)+'" fill="'+(mono?'#000':x.color)+'" stroke="#fff" stroke-width="2"/>';
    var q=pt(i,4.75),anc=Math.abs(q[0]-cx)<5?'middle':(q[0]>cx?'start':'end');
    var nm=x.name.replace('Navigování v konverzaci','Navigování').replace('Práce s konfliktem','Konflikt');
    s+='<text x="'+q[0]+'" y="'+(q[1]+4)+'" text-anchor="'+anc+'" font-size="12.5" font-weight="700" fill="'+(mono?'#000':x.color)+'" font-family="Haffer,Arial,sans-serif">'+nm+'</text>'});
  return s+'</svg>';
}
function radar(nowSt,oldSt,oldLabel){
  return '<div class="rbox">'+radarSvg(nowSt,oldSt)+'<div class="rleg"><span><i></i>Teď</span>'+(oldSt?'<span><i class="d"></i>'+esc(oldLabel)+'</span>':'')+'</div></div>';
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
      h+='<button class="mrow" data-id="'+c.id+'"><span>'+(isPrio(c.id)?'<b class="star">★</b> ':'')+c.name+'</span><span class="r">'+ring(l,s.color)+d+'</span></button>';
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
      store={levels:st.levels||{},history:st.history||[],snaps:st.snaps||[],prio:(st.prio||[]).filter(function(id){return CARD[id]}),intro:1};save();cmpKey=null;renderAll();toast('Záloha nahrána');
    }catch(e){toast('Soubor se nepodařilo načíst')}
  };
  r.readAsText(f);
};

/* ---------- Priority a kurzy ---------- */
function isGeneral(k){return !(k.skills&&k.skills.length)||/Úvod do|Akademie|4 kroky/i.test(k.title)}
function scoreCourse(k,ids){
  var sk=k.skills||[],exact=0,sec=0,secs={};
  ids.forEach(function(id){secs[CARD[id].section]=1;if(sk.indexOf(id)>=0)exact++});
  sk.forEach(function(id){if(ids.indexOf(id)<0&&CARD[id]&&secs[CARD[id].section])sec++});
  var base=exact*3+Math.min(sec,2)*1;
  if(!base&&isGeneral(k))base=0.5;
  if(!base)return 0;
  var days=(new Date(k.date)-new Date(new Date().toISOString().slice(0,10)))/DAY;
  if(days<0)return 0;
  return base/(1+days/60);
}
function courseHtml(k,ids,camp){
  var hit=(k.skills||[]).filter(function(id){return ids.indexOf(id)>=0});
  var other=(k.skills||[]).filter(function(id){return ids.indexOf(id)<0});
  return '<a class="course" href="'+esc(utm(k.url,camp))+'" target="_blank" rel="noopener"><span class="cd">'+fmtISO(k.date)+(k.time?' · '+esc(k.time):'')+(k.level?' · '+esc(k.level):'')+'</span><b>'+esc(k.title)+'</b>'+(k.sub?'<span class="cs">'+esc(k.sub)+'</span>':'')+
    ((hit.length||other.length)?'<span class="sk">'+hit.map(function(id){return '<em style="--c:'+S[CARD[id].section].color+'">'+CARD[id].name+'</em>'}).join('')+other.map(function(id){return '<i>'+CARD[id].name+'</i>'}).join('')+'</span>':'')+'<span class="go">Detail kurzu →</span></a>';
}
function renderPrio(){
  var h='<p class="small" style="margin-top:0">Vyberte si nejvýš '+MAXP+' dovednosti, na kterých chcete teď pracovat. Přidáte je tlačítkem „Přidat do priorit“ v detailu karty.</p>';
  if(!store.prio.length){
    h+='<div class="empty"><b>Zatím nemáte žádné priority.</b><br>Otevřete kartu dovednosti, kterou chcete rozvíjet, a klepněte na „☆ Přidat do priorit“.<br><button class="pill" id="goCards2">Přejít na karty</button></div>';
  }else{
    h+='<div class="plist">'+store.prio.map(function(id,i){var c=CARD[id],s=S[c.section],l=lvl(c);
      return '<div class="prow" style="--c:'+s.color+'"><span class="pn">'+(i+1)+'</span><button class="pmain" data-id="'+id+'"><span class="lab" style="color:'+s.color+'">'+s.name+'</span><b>'+c.name+'</b><span class="pl">'+(l?ring(l,s.color)+' '+NAMES[l-1].toLowerCase():'Úroveň zatím neoznačena')+'</span></button><span class="pbtn"><button data-up="'+i+'" aria-label="Posunout výš"'+(i?'':' disabled')+'>↑</button><button data-dn="'+i+'" aria-label="Posunout níž"'+(i<store.prio.length-1?'':' disabled')+'>↓</button><button data-rm="'+id+'" aria-label="Odebrat z priorit">✕</button></span></div>'}).join('')+'</div>';
    h+='<div class="row2" style="margin-top:12px"><button class="pill" id="shareBtn">Sdílet</button><button class="pill" id="printBtn">Tisk / PDF</button></div>';
  }
  // tipy na kurzy
  if(PROMO&&PROMO.courses.length){
    var ids=store.prio.slice(),list=[];
    if(ids.length){list=PROMO.courses.map(function(k){return {k:k,s:scoreCourse(k,ids)}}).filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s}).slice(0,3).map(function(x){return x.k})}
    if(list.length){h+='<div class="mst">Kurzy pro vaše priority</div>'+list.map(function(k){return courseHtml(k,ids,'priority')}).join('')}
    h+='<button class="pill wide" id="finderBtn">Najít kurz podle dovedností</button>';
  }
  if(PROMO&&PROMO.podcast&&PROMO.podcast.length){
    var ep=PROMO.podcast[0];
    if((Date.now()-new Date(ep.date))/DAY<=45)h+='<a class="course pod" href="'+esc(SPOTIFY)+'" target="_blank" rel="noopener"><span class="cd">Nenásilný podcast · '+fmtISO(ep.date)+(ep.minutes?' · '+ep.minutes+' min':'')+'</span><b>'+(ep.num?ep.num+': ':'')+esc(ep.title)+'</b><span class="go">Poslechnout →</span></a>';
  }
  $('prio').innerHTML=h;
  if($('goCards2'))$('goCards2').onclick=function(){setView('cards',true)};
  each('.pmain',$('prio'),function(b){b.onclick=function(){openCard(+b.dataset.id,true,store.prio.map(function(id){return CARD[id]}))}});
  each('[data-up]',$('prio'),function(b){b.onclick=function(){var i=+b.dataset.up;var t=store.prio[i-1];store.prio[i-1]=store.prio[i];store.prio[i]=t;save();renderPrio()}});
  each('[data-dn]',$('prio'),function(b){b.onclick=function(){var i=+b.dataset.dn;var t=store.prio[i+1];store.prio[i+1]=store.prio[i];store.prio[i]=t;save();renderPrio()}});
  each('[data-rm]',$('prio'),function(b){b.onclick=function(){togglePrio(+b.dataset.rm)}});
  if($('shareBtn'))$('shareBtn').onclick=function(){$('shareDlg').classList.add('open')};
  if($('printBtn'))$('printBtn').onclick=doPrint;
  if($('finderBtn'))$('finderBtn').onclick=function(){openFinder(true)};
}
/* Najít kurz */
function openFinder(push){
  if(!finder)finder=store.prio.slice();
  drawFinder();$('finder').classList.add('open');$('finder').scrollTop=0;
  if(push)try{history.pushState({finder:1},'','#kurzy')}catch(e){}
}
function closeFinder(){$('finder').classList.remove('open')}
function drawFinder(){
  var avail={};(PROMO?PROMO.courses:[]).forEach(function(k){(k.skills||[]).forEach(function(id){avail[id]=(avail[id]||0)+1})});
  var h='<h2 class="fh">Najít kurz podle dovedností</h2><p class="small">Vyberte dovednosti, které chcete trénovat. Ukážeme vypsané kurzy INK, které je rozvíjejí. U dovednosti je počet kurzů, které ji teď trénují.</p>';
  DATA.sections.forEach(function(s){
    h+='<div class="mst" style="color:'+s.color+'">'+s.name+'</div><div class="chips">'+DATA.cards.filter(function(c){return c.section===s.id}).map(function(c){
      var on=finder.indexOf(c.id)>=0,n=avail[c.id]||0;
      return '<button class="chip'+(on?' on':'')+(n?'':' none')+'" data-c="'+c.id+'" style="--c:'+s.color+'">'+c.name+(n?' <small>'+n+'</small>':'')+'</button>'}).join('')+'</div>';
  });
  h+='<div id="fres"></div>';
  $('fbody').innerHTML=h;
  each('.chip',$('fbody'),function(b){b.onclick=function(){var id=+b.dataset.c,i=finder.indexOf(id);if(i>=0)finder.splice(i,1);else finder.push(id);b.classList.toggle('on');drawResults()}});
  drawResults();
}
function drawResults(){
  var ids=finder,h='';
  if(!ids.length){$('fres').innerHTML='';$('fTop').textContent='Vyberte dovednosti';return}
  var list=(PROMO?PROMO.courses:[]).map(function(k){var n=(k.skills||[]).filter(function(id){return ids.indexOf(id)>=0}).length;return {k:k,n:n}}).filter(function(x){return x.n>0}).sort(function(a,b){return b.n-a.n||(a.k.date<b.k.date?-1:1)});
  $('fTop').textContent=list.length?('Kurzů: '+list.length):'Žádný kurz';
  h+='<div class="mst" id="fresTop">Kurzy ('+list.length+')</div>';
  if(!list.length){var g=(PROMO?PROMO.courses:[]).filter(isGeneral).slice(0,1);h+='<p class="small">Pro vybrané dovednosti teď není vypsaný žádný kurz. Základ všech dovedností trénujeme na úvodních kurzech:</p>'+g.map(function(k){return courseHtml(k,ids,'hledani')}).join('')}
  else h+=list.map(function(x){return courseHtml(x.k,ids,'hledani')}).join('');
  $('fres').innerHTML=h;
}
/* Sdílení */
function shareUrl(withLevels){
  var u=location.origin+location.pathname+'?p='+store.prio.join('.');
  if(withLevels)u+='&u='+DATA.cards.map(function(c){return lvl(c)}).join('');
  return u+'#sdileno';
}
function doShare(withLevels){
  $('shareDlg').classList.remove('open');
  var url=shareUrl(withLevels),txt='Moje priority v dovednostech nenásilné komunikace: '+store.prio.map(function(id){return CARD[id].name}).join(', ');
  if(navigator.share){navigator.share({title:'Moje dovednosti · INK',text:txt,url:url}).catch(function(){});return}
  copy(url);
}
function copy(t){
  function ok(){toast('Odkaz zkopírován')}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){fallback()});else fallback();
  function fallback(){var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){prompt('Zkopírujte odkaz:',t)}ta.remove()}
}
function showShared(){
  var q=new URLSearchParams(location.search),p=(q.get('p')||'').split('.').map(Number).filter(function(id){return CARD[id]}).slice(0,MAXP),u=q.get('u')||'';
  if(!p.length&&!u)return false;
  var lv={};if(u.length===DATA.cards.length)DATA.cards.forEach(function(c,i){var n=+u[i];if(n>=1&&n<=4)lv[c.id]=n});
  var h='<h2 class="fh">Sdílený výběr</h2><p class="small">Někdo vám poslal své priority'+(Object.keys(lv).length?' a úrovně':'')+'. Vaše vlastní data v appce se tím nemění.</p>';
  if(p.length)h+='<div class="mst">Priority</div><div class="plist">'+p.map(function(id,i){var c=CARD[id],s=S[c.section],l=lv[id]||0;return '<div class="prow" style="--c:'+s.color+'"><span class="pn">'+(i+1)+'</span><div class="pmain"><span class="lab" style="color:'+s.color+'">'+s.name+'</span><b>'+c.name+'</b><span class="pl">'+(l?ring(l,s.color)+' '+NAMES[l-1].toLowerCase():c.definition)+'</span></div></div>'}).join('')+'</div>';
  if(Object.keys(lv).length){h+='<div class="mst">Mapa</div><div class="rbox">'+radarSvg(lv,null)+'</div>';
    DATA.sections.forEach(function(s){h+='<div class="mst" style="color:'+s.color+'">'+s.name+'</div>';DATA.cards.filter(function(c){return c.section===s.id}).forEach(function(c){h+='<div class="mrow"><span>'+c.name+'</span>'+ring(lv[c.id]||0,s.color)+'</div>'})})}
  if(PROMO&&p.length){var list=PROMO.courses.map(function(k){return {k:k,s:scoreCourse(k,p)}}).filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s}).slice(0,2);if(list.length)h+='<div class="mst">Kurzy k těmto prioritám</div>'+list.map(function(x){return courseHtml(x.k,p,'sdileni')}).join('')}
  $('sbody').innerHTML=h;$('shared').classList.add('open');
  return true;
}
function closeShared(){$('shared').classList.remove('open');try{history.replaceState(null,'',location.pathname)}catch(e){}}
/* Tisk */
function doPrint(){
  var h='<header class="ph"><img src="logo-emerald.png" alt="INK"><div><h1>Moje dovednosti nenásilné komunikace</h1><p>'+fmt(Date.now())+'</p></div></header>';
  if(store.prio.length){h+='<h2>Moje priority</h2>'+store.prio.map(function(id,i){var c=CARD[id],l=lvl(c);return '<div class="pp"><b>'+(i+1)+'. '+c.name+'</b> <span class="sec">'+S[c.section].name+'</span><p>'+c.definition+'</p>'+(l?'<p><b>Moje úroveň: '+NAMES[l-1].toLowerCase()+'.</b> '+c.levels[l-1]+'</p>':'')+(l<4?'<p><b>Další krok:</b> '+c.levels[l]+'</p>':'')+'</div>'}).join('')}
  if(Object.keys(store.levels).length){
    h+='<h2>Moje mapa</h2><div class="pr">'+radarSvg(store.levels,null,true)+'</div><div class="pt">';
    DATA.sections.forEach(function(s){h+='<div class="ps"><h3>'+s.name+'</h3>'+DATA.cards.filter(function(c){return c.section===s.id}).map(function(c){var l=lvl(c),d='';for(var i=1;i<=4;i++)d+=i<=l?'●':'○';return '<div class="pi"><span>'+c.name+'</span><span>'+d+'</span></div>'}).join('')+'</div>'});
    h+='</div>';
  }
  h+='<p class="pfoot">dovednosti.ink.cz · Institut nenásilné komunikace</p>';
  $('print').innerHTML=h;
  setTimeout(function(){window.print()},60);
}

/* ---------- Návod ---------- */
var INTRO=[
  ['Karty dovedností','44 dovedností nenásilné komunikace v šesti sekcích. Klepněte na kartu, přečtěte si čtyři úrovně a označte tu, která vás teď nejlépe vystihuje.'],
  ['Moje mapa','Z označených úrovní se skládá vaše mapa. Můžete si uložit stav, třeba po kurzu, a později vidět, kam jste se posunuli.'],
  ['Priority a kurzy','Vyberte si až tři dovednosti, na kterých chcete pracovat. Appka k nim najde vhodné kurzy INK. Priority můžete sdílet nebo vytisknout.']
];
var introI=0;
function showIntro(){introI=0;drawIntro();$('intro').classList.add('open')}
function drawIntro(){
  var it=INTRO[introI];
  $('ibody').innerHTML='<div class="idots">'+INTRO.map(function(_,i){return '<i class="'+(i===introI?'on':'')+'"></i>'}).join('')+'</div><h3>'+it[0]+'</h3><p>'+it[1]+'</p>'+(introI===2?'<p class="small">Vše, co označíte, zůstává jen ve vašem zařízení. Nic se nikam neodesílá.</p>':'');
  $('iNext').textContent=introI<INTRO.length-1?'Další':'Začít';
}
$('iNext').onclick=function(){if(introI<INTRO.length-1){introI++;drawIntro()}else closeIntro()};
$('iSkip').onclick=closeIntro;
function closeIntro(){$('intro').classList.remove('open');store.intro=1;save()}
$('helpBtn').onclick=function(){$('help').classList.add('open');$('help').scrollTop=0;try{history.pushState({help:1},'','#jak-na-to')}catch(e){}};
$('helpClose').onclick=function(){if(location.hash==='#jak-na-to')history.back();else $('help').classList.remove('open')};
$('helpIntro').onclick=function(){$('help').classList.remove('open');if(location.hash==='#jak-na-to')try{history.replaceState(null,'',location.pathname)}catch(e){};showIntro()};

/* ---------- Přepínání ---------- */
function setView(v,push){
  view=v;$('vCards').hidden=v!=='cards';$('vMap').hidden=v!=='map';$('vPrio').hidden=v!=='prio';
  $('tCards').classList.toggle('on',v==='cards');$('tMap').classList.toggle('on',v==='map');$('tPrio').classList.toggle('on',v==='prio');
  if(v==='map'){saving=false;renderMap()}
  if(v==='prio')renderPrio();
  window.scrollTo(0,0);
  if(push)try{history.pushState({view:v},'',v==='map'?'#mapa':v==='prio'?'#priority':location.pathname)}catch(e){}
}
function rerenderView(){if(view==='map')renderMap();if(view==='prio')renderPrio()}
function renderAll(){renderTiles();renderList();rerenderView()}
function route(){
  var h=location.hash,m=h.match(/^#karta-(\d+)/);
  if(h!=='#jak-na-to')$('help').classList.remove('open');
  if(h!=='#kurzy')closeFinder();
  if(m){openCard(+m[1],false,navList);return}
  closeDetail();
  if(h==='#kurzy'){openFinder(false);return}
  if(h==='#jak-na-to'){$('help').classList.add('open');return}
  var v=h==='#mapa'?'map':h==='#priority'?'prio':'cards';
  if(v!==view)setView(v,false);
}
$('tCards').onclick=function(){if(view!=='cards')setView('cards',true)};
$('tMap').onclick=function(){if(view!=='map')setView('map',true)};
$('tPrio').onclick=function(){if(view!=='prio')setView('prio',true)};
function backTo(){return view==='map'?'#mapa':view==='prio'?'#priority':location.pathname}
$('back').onclick=function(){if(location.hash.indexOf('#karta-')===0&&history.state&&history.state.card)history.back();else{closeDetail();try{history.replaceState(null,'',backTo())}catch(e){}}};
$('fBack').onclick=function(){if(location.hash==='#kurzy'&&history.state&&history.state.finder)history.back();else{closeFinder();try{history.replaceState(null,'',backTo())}catch(e){}}};
$('fTop').onclick=function(){var t=$('fresTop');if(t)t.scrollIntoView({behavior:'smooth'})};
$('prev').onclick=function(){go(-1)};
$('next').onclick=function(){go(1)};
$('lgBtn').onclick=function(){$('legend').classList.add('open')};
$('lgClose').onclick=function(){$('legend').classList.remove('open')};
$('legend').onclick=function(e){if(e.target===$('legend'))$('legend').classList.remove('open')};
$('shareDlg').onclick=function(e){if(e.target===$('shareDlg'))$('shareDlg').classList.remove('open')};
$('shP').onclick=function(){doShare(false)};
$('shU').onclick=function(){doShare(true)};
$('shX').onclick=function(){$('shareDlg').classList.remove('open')};
$('sClose').onclick=closeShared;
window.addEventListener('popstate',route);

renderTiles();renderList();
var shared=showShared();
var h0=location.hash;
if(h0==='#mapa')setView('map',false);else if(h0==='#priority')setView('prio',false);
var m0=h0.match(/^#karta-(\d+)/);if(m0)openCard(+m0[1],false);
if(h0==='#jak-na-to')$('help').classList.add('open');
if(!store.intro&&!shared&&!m0)showIntro();
fetch('promo.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(d){
  if(!d||!Array.isArray(d.courses))return;
  var today=new Date().toISOString().slice(0,10);
  d.courses=d.courses.filter(function(k){return k.date>=today});
  PROMO=d;rerenderView();if($('detail').classList.contains('open'))drawDetail();if(h0==='#kurzy')openFinder(false);
  if(shared)showShared();
}).catch(function(){});
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
