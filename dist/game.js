(() => {
  'use strict';
  const INGREDIENTS = {
    egg: ['鸡蛋','🥚'], tomato: ['番茄','🍅'], rice: ['米饭','🍚'], scallion: ['葱花','🌿'],
    dumpling: ['饺子','🥟'], beef: ['牛肉','🥩'], noodle: ['面条','🍜'], bokchoy: ['青菜','🥬']
  };
  const RECIPES = [
    {name:'番茄炒蛋',emoji:'🍳',items:['egg','tomato'],price:38,cook:3600},
    {name:'葱香蛋炒饭',emoji:'🍚',items:['rice','egg','scallion'],price:48,cook:4100},
    {name:'金黄煎饺',emoji:'🥟',items:['dumpling','scallion'],price:42,cook:3300},
    {name:'暖心牛肉面',emoji:'🍜',items:['noodle','beef','bokchoy'],price:58,cook:4600}
  ];
  const $ = id => document.getElementById(id);
  const state = {running:false,score:0,time:90,combo:0,maxCombo:0,served:0,attempts:0,selected:[],cooking:false,heat:0,recipe:null,patience:100,lastTick:0,cookStarted:0,sound:true,orderIndex:0,raf:0};
  const daySeed = Number(new Date().toISOString().slice(0,10).replaceAll('-',''));
  $('day-number').textContent = String(Math.floor((Date.now()-Date.UTC(2026,0,1))/86400000)+1);
  const bestKey = 'cozyKitchenBestV1';
  const getBest = () => Number(localStorage.getItem(bestKey)||0);
  $('best-start').textContent = `¥${getBest()}`;

  function seededIndex(n){let x=(daySeed+n*2654435761)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return Math.abs(x)%RECIPES.length}
  function show(screen){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(screen).classList.add('active')}
  function beep(freq=520,duration=.08){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;const c=beep.ctx||(beep.ctx=new C());const o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration)}catch(e){}}
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1300)}
  function renderIngredients(){
    $('ingredients').innerHTML=Object.entries(INGREDIENTS).map(([id,[name,emoji]])=>`<button class="ingredient" data-id="${id}" type="button"><b>${emoji}</b><span>${name}</span></button>`).join('');
    document.querySelectorAll('.ingredient').forEach(btn=>btn.addEventListener('click',()=>selectIngredient(btn.dataset.id)));
  }
  function newOrder(){
    state.recipe=RECIPES[seededIndex(state.orderIndex++)];state.patience=100;state.selected=[];state.cooking=false;state.heat=0;
    $('dish-name').textContent=state.recipe.name;$('dish-emoji').textContent=state.recipe.emoji;$('dish-hint').textContent=`需要 ${state.recipe.items.length} 种食材`;
    $('order-ingredients').innerHTML=state.recipe.items.map(id=>`<span>${INGREDIENTS[id][1]} ${INGREDIENTS[id][0]}</span>`).join('');
    $('customer').style.filter=`hue-rotate(${(state.orderIndex*47)%120}deg)`;resetPot();
  }
  function selectIngredient(id){
    if(!state.running||state.cooking)return;
    if(state.selected.includes(id)){state.selected=state.selected.filter(x=>x!==id)}else if(state.selected.length<4){state.selected.push(id);beep(600)}else{toast('锅里已经放不下啦')}
    updatePot();
  }
  function updatePot(){
    document.querySelectorAll('.ingredient').forEach(b=>b.classList.toggle('selected',state.selected.includes(b.dataset.id)));
    $('pot-items').innerHTML=state.selected.length?state.selected.map(id=>`<span>${INGREDIENTS[id][1]}</span>`).join(''):'<span class="empty-pot">等待食材…</span>';
    $('cook-btn').disabled=!state.selected.length;
  }
  function resetPot(){state.selected=[];state.cooking=false;state.heat=0;$('flame').classList.remove('on');$('serve-btn').classList.remove('ready');$('serve-btn').disabled=true;$('cook-btn').style.display='block';$('heat-progress').style.left='0%';$('heat-label').textContent='尚未开火';updatePot()}
  function startCooking(){if(!state.selected.length||state.cooking)return;state.cooking=true;state.cookStarted=performance.now();$('flame').classList.add('on');$('cook-btn').style.display='none';$('serve-btn').classList.add('ready');$('serve-btn').disabled=false;beep(360,.15)}
  function exactIngredients(){return state.selected.length===state.recipe.items.length&&state.selected.every(x=>state.recipe.items.includes(x))}
  function serve(){
    if(!state.cooking)return;state.attempts++;
    const heatGood=state.heat>=62&&state.heat<=84, correct=exactIngredients();
    if(correct&&heatGood){state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.served++;const gain=Math.round(state.recipe.price*(1+Math.min(state.combo-1,5)*.2)*(state.patience/100*.25+.75));state.score+=gain;toast(`完美出餐 +¥${gain}`);beep(880,.12);setTimeout(()=>beep(1120,.13),80)}
    else{state.combo=0;state.time=Math.max(0,state.time-5);toast(!correct?'食材不对，损失 5 秒':'火候不对，损失 5 秒');beep(170,.22)}
    updateHud();newOrder();
  }
  function updateHud(){$('score').textContent=`¥${state.score}`;$('combo').textContent=`×${Math.max(1,state.combo)}`;const t=Math.ceil(state.time);$('timer').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;$('timer-bar').style.width=`${state.time/90*100}%`;$('patience-bar').style.width=`${state.patience}%`}
  function startGame(){Object.assign(state,{running:true,score:0,time:90,combo:0,maxCombo:0,served:0,attempts:0,orderIndex:0,lastTick:performance.now()});show('game-screen');newOrder();updateHud();cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(loop)}
  function loop(now){
    if(!state.running)return;const dt=Math.min((now-state.lastTick)/1000,.1);state.lastTick=now;state.time-=dt;state.patience=Math.max(0,state.patience-dt*3.1);
    if(state.cooking){state.heat=Math.min(100,(now-state.cookStarted)/state.recipe.cook*100);$('heat-progress').style.left=`${Math.min(state.heat,99)}%`;$('heat-label').textContent=state.heat<62?'加热中…':state.heat<=84?'火候正好！':'快糊了！';if(state.heat>=100){state.attempts++;state.combo=0;state.time=Math.max(0,state.time-5);toast('糊锅啦，损失 5 秒');beep(150,.25);newOrder()}}
    if(state.patience<=0){state.combo=0;toast('客人等不及走啦');newOrder()}
    updateHud();if(state.time<=0)endGame();else state.raf=requestAnimationFrame(loop)
  }
  function endGame(){
    state.running=false;cancelAnimationFrame(state.raf);const old=getBest(),isNew=state.score>old;if(isNew)localStorage.setItem(bestKey,String(state.score));
    $('final-score').textContent=`¥${state.score}`;$('served-count').textContent=state.served;$('accuracy').textContent=`${state.attempts?Math.round(state.served/state.attempts*100):0}%`;$('max-combo').textContent=state.maxCombo;$('new-record').textContent=isNew?'新纪录！':'本机最佳 ¥'+old;$('result-title').textContent=state.score>=500?'今天生意太好啦！':state.score>=250?'辛苦啦，店长！':'明天一定会更好';$('result-badge').textContent=`今日菜单 · 第 ${$('day-number').textContent} 期`;show('end-screen');beep(720,.18)
  }
  async function share(){const text=`🍜 我在「暖暖小食堂」今日营业额 ¥${state.score}，成功出餐 ${state.served} 道，最高 ${state.maxCombo} 连击！你能超过我吗？`;try{if(navigator.share){await navigator.share({title:'暖暖小食堂',text,url:location.href})}else{await navigator.clipboard.writeText(`${text} ${location.href}`);toast('战绩已复制')} }catch(e){if(e.name!=='AbortError')toast('分享没有成功，再试一次吧')}}
  $('start-btn').addEventListener('click',startGame);$('again-btn').addEventListener('click',startGame);$('cook-btn').addEventListener('click',startCooking);$('serve-btn').addEventListener('click',serve);$('clear-btn').addEventListener('click',()=>{if(!state.cooking)resetPot()});$('share-btn').addEventListener('click',share);$('sound-btn').addEventListener('click',()=>{state.sound=!state.sound;$('sound-btn').textContent=state.sound?'🔊':'🔇'});
  renderIngredients();
})();
