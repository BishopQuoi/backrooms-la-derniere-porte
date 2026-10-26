/* La dernière porte — Canvas raycasting, no external dependencies. */
'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false}),$=s=>document.querySelector(s),TAU=Math.PI*2;
let layout=['111111111111111111111','100000100000000000001','101110101111101110101','100010000010001000101','111010111010111011101','100000100000100000001','101110101110101110101','101000001000001000101','101011111011111011101','100010000010000010001','101010111010111010101','101000100000100000101','101110101110101110101','100000001000000010001','111111111111111111111'];
const boxes=[{x:9.5,y:3.5},{x:17.5,y:7.5},{x:3.5,y:11.5}],exit={x:19.5,y:13.5};
let player,enemy,keys={},state='menu',collected=0,elapsed=0,energy=100,time=0,last=0,pathTimer=0,path=[],notice='',noticeUntil=0,audioCtx,humGain,heartbeat=0,footstep=0,depth=[],wallTexture,boxTexture,exitTexture,monsterTexture,carTexture;
const golf={x:4.5,y:1.5};
const originalLayout=layout.slice();
const carKeys={x:5.5,y:7.5};
const lockers=[{x:3.5,y:3.5},{x:7.5,y:7.5},{x:15.5,y:11.5}];
let hasKeys=false,driving=false,hiddenAt=null,hideCompromised=false,lastKnown={x:1.5,y:1.5},garage=false,carSpeed=0,carHeading=0,lookYaw=0,mousePending=0,ignoreMouseUntil=0;
let keyTexture,lockerTexture,garageWall;
let sensitivity=.0009;
let mouseMode='locked',dragging=false,lastMouseX=null;
try{sensitivity=Number(localStorage.getItem('backrooms-sensitivity-v2'))||.0009}catch{}
sensitivity=Math.max(.0005,Math.min(.003,sensitivity));
function solid(x,y){return !layout[Math.floor(y)]||layout[Math.floor(y)][Math.floor(x)]!=='0'}
function move(obj,dx,dy,r=.19){if(!solid(obj.x+dx+r*Math.sign(dx),obj.y-r)&&!solid(obj.x+dx+r*Math.sign(dx),obj.y+r))obj.x+=dx;if(!solid(obj.x-r,obj.y+dy+r*Math.sign(dy))&&!solid(obj.x+r,obj.y+dy+r*Math.sign(dy)))obj.y+=dy}
function reset(){layout=originalLayout.slice();hasKeys=false;driving=false;hiddenAt=null;hideCompromised=false;garage=false;carSpeed=0;carHeading=0;lookYaw=0;mousePending=0;lastKnown={x:1.5,y:1.5};keys={};$('#hiding').hidden=true;$('#objectiveLabel').textContent='RÉTABLIR LE COURANT';player={x:1.5,y:1.5,a:.22};enemy={x:19.5,y:11.5};boxes.forEach(b=>b.on=false);collected=0;elapsed=0;energy=100;path=[];pathTimer=0;notice='';noticeUntil=0;$('#count').textContent='0 / 3';$('#hint').textContent='Trouvez les trois boîtiers électriques.'}
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));return c}
function textures(){wallTexture=texture(128,128,c=>{c.fillStyle='#a79c59';c.fillRect(0,0,128,128);let seed=42;for(let i=0;i<6000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;c.fillStyle=`rgba(49,43,18,${(seed%12)/100})`;c.fillRect(x,(seed>>>9)%128,1,2)}c.strokeStyle='#6a613c55';for(let x=8;x<128;x+=16){c.beginPath();for(let y=0;y<=128;y+=4)c.lineTo(x+Math.sin(y*.16)*2,y);c.stroke()}c.fillStyle='#5b5239';c.fillRect(0,116,128,12);c.fillStyle='#c2b878';c.fillRect(0,114,128,2);c.fillStyle='#62582f';c.fillRect(0,0,128,3)});
boxTexture=texture(96,128,c=>{c.fillStyle='#242923';c.fillRect(15,25,66,85);c.fillStyle='#777d6c';c.fillRect(18,28,60,78);c.fillStyle='#161d18';c.fillRect(24,37,48,36);c.fillStyle='#ffe6a0';c.fillRect(29,43,38,22);c.fillStyle='#e6c669';c.fillRect(38,82,20,13);c.fillStyle='#282a20';c.font='bold 10px monospace';c.fillText('POWER',30,58);c.strokeStyle='#b0a882';c.strokeRect(18,28,60,78)});
exitTexture=texture(128,160,c=>{c.fillStyle='#1b2720';c.fillRect(15,0,98,160);c.fillStyle='#566548';c.fillRect(23,29,82,131);c.strokeStyle='#a0ab79';c.strokeRect(28,34,72,121);c.fillStyle='#bbffd1';c.fillRect(25,5,78,19);c.fillStyle='#183927';c.font='bold 13px monospace';c.fillText('SORTIE',40,19);c.fillStyle='#d2c697';c.fillRect(83,96,12,4)});
monsterTexture=texture(128,256,c=>{c.strokeStyle='#080909';c.lineCap='round';c.lineWidth=14;c.beginPath();c.moveTo(49,125);c.lineTo(36,186);c.lineTo(29,248);c.moveTo(76,125);c.lineTo(91,181);c.lineTo(105,249);c.stroke();c.lineWidth=11;c.beginPath();c.moveTo(40,66);c.lineTo(19,115);c.lineTo(9,172);c.moveTo(84,66);c.lineTo(108,114);c.lineTo(120,173);c.stroke();c.fillStyle='#080909';c.beginPath();c.ellipse(63,91,29,54,0,0,TAU);c.fill();c.beginPath();c.ellipse(63,28,18,25,0,0,TAU);c.fill();c.fillStyle='#e9e5c6';c.fillRect(53,24,5,3);c.fillRect(69,24,5,3);c.strokeStyle='#bbb7a1';c.lineWidth=2;c.beginPath();c.arc(64,33,8,.1,3);c.stroke()})}

// A chrome dumbbell held by the pursuer's right hand.
function addDumbbell(){
 const c=monsterTexture.getContext('2d');
 c.save();c.translate(104,172);c.rotate(-.22);
 c.fillStyle='#bfc3c7';c.fillRect(-15,-3,29,6);
 c.fillStyle='#747c85';c.fillRect(-15,-2,29,2);
 for(const x of [-16,10]){c.fillStyle='#15191e';c.fillRect(x,-15,7,30);c.fillStyle='#626b76';c.fillRect(x,-15,2,30);c.fillStyle='#353e48';c.fillRect(x+2,-12,4,24)}
 c.fillStyle='#b6bdc4';c.fillRect(-19,-4,3,8);c.fillRect(17,-4,3,8);
 c.restore();c.fillStyle='#171717';c.beginPath();c.ellipse(113,172,4,5,0,0,TAU);c.fill();
}
// Front view of a silver-grey Volkswagen Golf, built in the game's retro style.
function createGolf(){
 carTexture=texture(256,160,c=>{
 const poly=(points,fill)=>{c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
 c.fillStyle='#0007';c.beginPath();c.ellipse(128,149,113,10,0,0,TAU);c.fill();
 c.fillStyle='#111316';c.fillRect(25,116,30,39);c.fillRect(201,116,30,39);
 poly([[36,79],[58,20],[75,12],[181,12],[198,20],[220,79]],'#91999e');
 poly([[52,70],[68,25],[188,25],[204,70]],'#182329');
 poly([[69,27],[184,27],[144,67],[53,67]],'#34454c');
 c.strokeStyle='#b4bdc0';c.lineWidth=3;c.beginPath();c.moveTo(70,18);c.lineTo(185,18);c.stroke();
 c.fillStyle='#737d83';c.fillRect(18,64,25,13);c.fillRect(213,64,25,13);
 poly([[35,72],[221,72],[238,100],[235,140],[21,140],[18,100]],'#a0a7ac');
 poly([[43,76],[213,76],[223,96],[33,96]],'#bec4c7');
 c.strokeStyle='#747d83';c.lineWidth=2;c.beginPath();c.moveTo(55,78);c.lineTo(68,94);c.moveTo(201,78);c.lineTo(188,94);c.stroke();
 c.fillStyle='#171b20';c.fillRect(77,98,102,18);c.fillRect(55,123,146,12);
 c.strokeStyle='#818b91';c.lineWidth=2;for(let y=102;y<=111;y+=4){c.beginPath();c.moveTo(81,y);c.lineTo(175,y);c.stroke()}
 poly([[28,97],[72,100],[70,115],[27,112]],'#dae4e9');poly([[184,100],[228,97],[229,112],[186,115]],'#dae4e9');
 c.fillStyle='#f3f2d8';c.fillRect(32,102,29,5);c.fillRect(195,102,29,5);
 c.fillStyle='#505a61';c.fillRect(22,137,212,7);c.fillStyle='#dfe2df';c.fillRect(94,122,68,14);c.fillStyle='#1b252b';c.font='bold 10px monospace';c.textAlign='center';c.fillText('GOLF',128,133);
 c.fillStyle='#222a31';c.beginPath();c.arc(128,106,11,0,TAU);c.fill();c.strokeStyle='#d6dddf';c.lineWidth=2;c.stroke();c.font='bold 10px Arial';c.fillStyle='#edf2f2';c.fillText('VW',128,110);
 });
}

// Apply the supplied portrait to the pursuer's head; keep the silhouette while loading.
function loadPursuerPortrait(){
  const portrait=new Image();
  portrait.onload=()=>{
    const c=monsterTexture.getContext('2d');
    c.save();
    c.beginPath();
    c.ellipse(63,32,24,32,0,0,TAU);
    c.clip();
    c.clearRect(39,0,48,64);
    c.imageSmoothingEnabled=true;
    // Crop out the shirt, retaining the hair, face and beard.
    c.drawImage(portrait,5,12,330,540,39,0,48,64);
    c.restore();
  };
  portrait.onerror=()=>console.warn('Portrait du poursuivant introuvable.');
  portrait.src='assets/pursuer-face.png';
}
function resize(){canvas.width=Math.min(800,Math.max(480,Math.floor(innerWidth*.6)));canvas.height=Math.floor(canvas.width*innerHeight/innerWidth);depth=new Float32Array(canvas.width)}
function cast(a){const dx=Math.cos(a),dy=Math.sin(a);let mx=Math.floor(player.x),my=Math.floor(player.y);const ddx=Math.abs(1/dx),ddy=Math.abs(1/dy),sx=dx<0?-1:1,sy=dy<0?-1:1;let tx=(dx<0?player.x-mx:mx+1-player.x)*ddx,ty=(dy<0?player.y-my:my+1-player.y)*ddy,side=0;for(let i=0;i<80;i++){if(tx<ty){tx+=ddx;mx+=sx;side=0}else{ty+=ddy;my+=sy;side=1}if(!layout[my]||layout[my][mx]!=='0')break}const d=side?ty-ddy:tx-ddx;let u=side?player.x+d*dx:player.y+d*dy;return{d:Math.max(.01,d),u:u-Math.floor(u),side}}
function render(){const w=canvas.width,h=canvas.height,proj=w/(2*Math.tan(.56)),bob=state==='playing'&&(keys.KeyW||keys.KeyZ||keys.KeyS||keys.ArrowUp)?Math.sin(time*9)*h*.006:0,horizon=h*.49+bob;
ctx.fillStyle='#77745a';ctx.fillRect(0,0,w,horizon);ctx.fillStyle='#665b36';ctx.fillRect(0,horizon,w,h);
for(let y=0;y<h;y+=4){const floor=y>horizon,delta=Math.abs(y-horizon);if(delta<1)continue;const distance=proj*.5/delta,shade=Math.max(.08,1/(1+distance*.22));for(let x=0;x<w;x+=6){const lateral=(x-w/2)/proj,wx=player.x+distance*(Math.cos(player.a)-lateral*Math.sin(player.a)),wy=player.y+distance*(Math.sin(player.a)+lateral*Math.cos(player.a)),fx=wx-Math.floor(wx),fy=wy-Math.floor(wy);let r=garage?105:112,g=garage?110:101,b=garage?109:60;if(!floor){const lamp=Math.floor(wx)%3===1&&Math.floor(wy)%2===1&&fx>.18&&fx<.82&&fy>.36&&fy<.62,grid=fx<.025||fy<.025;r=lamp?244:grid?87:150;g=lamp?239:grid?85:147;b=lamp?190:grid?65:112;if(lamp){ctx.fillStyle='#dcd7ab';ctx.fillRect(x,y,6,4);continue}}else{const n=(Math.sin(wx*53+wy*79)+Math.sin(wx*97-wy*41))*4;r+=n;g+=n;b+=n}ctx.fillStyle=`rgb(${r*shade|0},${g*shade|0},${b*shade|0})`;ctx.fillRect(x,y,6,4)}}
for(let x=0;x<w;x++){const angle=player.a+Math.atan((x-w/2)/proj),hit=cast(angle),d=hit.d*Math.cos(angle-player.a),height=proj/d;depth[x]=d;const top=horizon-height*.5;ctx.drawImage(garage?garageWall:wallTexture,Math.floor(hit.u*128),0,1,128,x,top,1,height);ctx.fillStyle=`rgba(5,6,2,${Math.min(.93,.15+d*.085+(hit.side?.13:0))})`;ctx.fillRect(x,top,1,height+1)}
const sprites=[...boxes.filter(b=>!b.on&&!garage).map(b=>({...b,img:boxTexture,size:.65})),{...exit,img:exitTexture,size:1},...(!driving&&!garage?[{...golf,img:carTexture,size:.53}]:[]),...(!garage&&!hasKeys?[{...carKeys,img:keyTexture,size:.22}]:[]),...(!garage?lockers.map(l=>({...l,img:lockerTexture,size:.85})):[]),{...enemy,img:monsterTexture,size:1.05,monster:true}].sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
for(const s of sprites){const dx=s.x-player.x,dy=s.y-player.y,forward=dx*Math.cos(player.a)+dy*Math.sin(player.a),side=-dx*Math.sin(player.a)+dy*Math.cos(player.a);if(forward<.12)continue;const sh=proj*s.size/forward,sw=sh*s.img.width/s.img.height,cx=w/2+side/forward*proj,top=horizon+proj*.5/forward-sh+(s.monster?Math.sin(time*8)*sh*.02:0);for(let x=Math.max(0,Math.floor(cx-sw/2));x<Math.min(w,cx+sw/2);x++)if(forward<depth[x])ctx.drawImage(s.img,Math.floor((x-(cx-sw/2))/sw*s.img.width),0,1,s.img.height,x,top,1,sh)}
if(driving)drawCockpit(w,h);
if(state==='playing'){const danger=Math.max(0,1-Math.hypot(enemy.x-player.x,enemy.y-player.y)/5);ctx.fillStyle=`rgba(95,0,0,${danger*(.07+.04*Math.sin(time*10))})`;ctx.fillRect(0,0,w,h);ctx.fillStyle=`rgba(0,0,0,${.025+Math.max(0,Math.sin(time*23))*.025})`;ctx.fillRect(0,0,w,h)}}
function route(target=player){const start=[Math.floor(enemy.x),Math.floor(enemy.y)],goal=[Math.floor(target.x),Math.floor(target.y)],q=[start],prev=new Map([[start.join(','),null]]);for(let i=0;i<q.length;i++){const[x,y]=q[i];if(x===goal[0]&&y===goal[1])break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!solid(nx+.5,ny+.5)&&!prev.has(k)){prev.set(k,[x,y]);q.push([nx,ny])}}}let cell=goal,steps=[];if(!prev.has(cell.join(',')))return[];while(cell&&cell.join(',')!==start.join(',')){steps.unshift({x:cell[0]+.5,y:cell[1]+.5});cell=prev.get(cell.join(','))}return steps}
function tone(freq,duration,volume=.05,type='sine'){if(!audioCtx)return;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(volume,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration)}
function audio(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();const osc=audioCtx.createOscillator();humGain=audioCtx.createGain();osc.type='sawtooth';osc.frequency.value=60;humGain.gain.value=.012;osc.connect(humGain);humGain.connect(audioCtx.destination);osc.start()}audioCtx.resume().catch(()=>{});if(humGain)humGain.gain.value=.012}
function message(t){notice=t;noticeUntil=time+3}
function finish(win){state=win?'won':'lost';document.exitPointerLock?.();$('#overlay').hidden=false;$('#overline').textContent=win?'ENREGISTREMENT TERMINÉ':'SIGNAL PERDU';$('#title').textContent=win?'VOUS ÊTES SORTI.':'IL VOUS A TROUVÉ.';$('#description').textContent=win?`Vous avez survécu en ${Math.floor(elapsed/60)} min ${Math.floor(elapsed%60)} s. Mais était-ce vraiment la dernière porte ?`:'Les pas se sont arrêtés. Les néons, eux, continuent.';$('#resume').hidden=true;$('#restart').textContent='REJOUER';if(humGain)humGain.gain.value=0;tone(win?440:70,1,.08,win?'sine':'sawtooth')}
function pause(){if(state!=='playing')return;state='paused';keys={};$('#overlay').hidden=false;$('#overline').textContent='ENREGISTREMENT SUSPENDU';$('#title').textContent='UN INSTANT DE RÉPIT.';$('#description').textContent='Cliquez sur reprendre pour retourner dans le niveau.';$('#resume').hidden=false;$('#restart').textContent='RECOMMENCER';if(humGain)humGain.gain.value=0}
function frame(t){const dt=Math.min(.04,(t-last)/1000||.016);last=t;time+=dt;if(state==='playing')update(dt);render();requestAnimationFrame(frame)}
function createGameplayTextures(){
 garageWall=texture(128,128,c=>{c.fillStyle='#727b79';c.fillRect(0,0,128,128);c.fillStyle='#b9a44e';c.fillRect(0,67,128,22);c.fillStyle='#282d2d';c.fillRect(0,89,128,9);c.strokeStyle='#474f4f';c.strokeRect(0,0,127,127);c.beginPath();c.moveTo(64,0);c.lineTo(64,67);c.stroke()});
 keyTexture=texture(96,96,c=>{c.shadowColor='#ffe598';c.shadowBlur=12;c.strokeStyle='#f1d175';c.lineWidth=9;c.beginPath();c.arc(35,30,17,0,TAU);c.stroke();c.shadowBlur=0;c.beginPath();c.moveTo(46,43);c.lineTo(77,74);c.moveTo(65,62);c.lineTo(56,71);c.moveTo(74,71);c.lineTo(65,80);c.stroke();c.fillStyle='#252c34';c.fillRect(12,8,29,16);c.fillStyle='#e0e7ea';c.font='bold 10px Arial';c.fillText('VW',17,20)});
 lockerTexture=texture(96,160,c=>{c.fillStyle='#242b29';c.fillRect(9,2,78,158);c.fillStyle='#58615a';c.fillRect(14,6,68,148);c.strokeStyle='#949b7c';c.strokeRect(17,9,62,142);c.fillStyle='#192320';for(let y=22;y<58;y+=7)c.fillRect(27,y,42,3);c.fillStyle='#c8bd88';c.fillRect(65,83,5,17);c.font='bold 9px monospace';c.fillText('CACHE',28,123)});
}
function visible(from,to){const d=Math.hypot(to.x-from.x,to.y-from.y);for(let t=.1;t<d;t+=.1)if(solid(from.x+(to.x-from.x)*t/d,from.y+(to.y-from.y)*t/d))return false;return true}
function nearby(a,b,r=1){return Math.hypot(a.x-b.x,a.y-b.y)<r&&visible(a,b)}
function objective(){
 $('#count').textContent=garage?'GOLF':collected+' / 3';
 $('#objectiveLabel').textContent=garage?'REJOINDRE LA RAMPE':collected<3?'RÉTABLIR LE COURANT':!hasKeys?'TROUVER LES CLÉS':'REJOINDRE LA GOLF';
 $('#hint').textContent=garage?'Z / W : accélérer · S : reculer · Q / A et D : braquer':collected<3?'Activez les boîtiers. Les placards permettent de se cacher.':!hasKeys?'Cherchez les clés dorées dans les couloirs.':'La Golf vous attend dans le couloir du départ.';
}
function enterGarage(){
 garage=true;driving=true;hiddenAt=null;carSpeed=0;lookYaw=0;carHeading=0;mousePending=0;
 layout=['111111111111111111111',...Array.from({length:13},()=> '100000000000000000001'),'111111111111111111111'];
 // Concrete dividers leave broad aisles at alternating ends.
 for(let y=4;y<=10;y+=3){let r=layout[y].split('');for(let x=4;x<=16;x++)r[x]='1';layout[y]=r.join('')}
 player={x:2.5,y:2.5,a:0};enemy={x:1.5,y:12.5};exit.x=18.5;exit.y=12.5;path=[];pathTimer=0;lastKnown={x:player.x,y:player.y};
 objective();message('MOTEUR ALLUMÉ — REJOIGNEZ LA SORTIE AU FOND DU PARKING.');tone(90,.8,.08,'sawtooth');
}
function interact(){
 if(driving)return;
 if(hiddenAt){hiddenAt=null;hideCompromised=false;$('#hiding').hidden=true;message('VOUS SORTEZ DE LA CACHETTE.');return}
 for(const l of lockers)if(!garage&&nearby(player,l,.9)){
  hiddenAt=l;hideCompromised=nearby(enemy,player,6);lastKnown={x:player.x,y:player.y};keys={};mousePending=0;$('#hiding').hidden=false;
  message(hideCompromised?'IL VOUS A VU ENTRER !':'VOUS ÊTES CACHÉ — E POUR SORTIR.');return;
 }
 if(!hasKeys&&nearby(player,carKeys,.9)){hasKeys=true;tone(880,.25);objective();message('CLÉS DE LA GOLF RÉCUPÉRÉES.');return}
 if(nearby(player,golf,1.1)){
  if(!hasKeys){message('IL VOUS FAUT LES CLÉS DE LA GOLF.');return}
  if(collected<3){message('ACTIVEZ LES 3 BOÎTIERS POUR OUVRIR LE GARAGE.');return}
  enterGarage();return;
 }
 for(const b of boxes)if(!b.on&&nearby(player,b,1.15)){b.on=true;collected++;tone(660,.15);tone(880,.3,.03);objective();message(collected===3?'GARAGE OUVERT. RETROUVEZ LA GOLF.':'BOÎTIER ACTIVÉ — IL VOUS A ENTENDU.');return}
 if(nearby(player,exit,1.3))message('LA SORTIE EST DANS LE PARKING. RETROUVEZ LA GOLF.');
}
function drawCockpit(w,h){
 ctx.fillStyle='#191d20';ctx.beginPath();ctx.moveTo(0,h*.84);ctx.quadraticCurveTo(w*.5,h*.7,w,h*.84);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
 ctx.fillStyle='#656e72';ctx.fillRect(w*.36,h*.84,w*.28,h*.07);ctx.fillStyle='#10191b';ctx.fillRect(w*.37,h*.848,w*.26,h*.052);
 ctx.font=`bold ${Math.max(12,w*.025)}px monospace`;ctx.textAlign='center';ctx.fillStyle='#e6d69d';ctx.fillText(Math.round(Math.abs(carSpeed)*18)+' km/h',w*.5,h*.89);
 ctx.save();ctx.translate(w*.27,h*.97);ctx.rotate((keys.KeyD?1:0)-(keys.KeyQ||keys.KeyA?1:0));ctx.strokeStyle='#080b0c';ctx.lineWidth=w*.022;ctx.beginPath();ctx.arc(0,0,w*.11,0,TAU);ctx.moveTo(-w*.1,0);ctx.lineTo(w*.1,0);ctx.moveTo(0,0);ctx.lineTo(0,w*.1);ctx.stroke();ctx.restore();ctx.textAlign='start';
}
function update(dt){
 elapsed+=dt;
 // Mouse rotation is applied directly in handleMouse, independently of frame rate.
 const fw=(keys.KeyW||keys.KeyZ||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),steer=(keys.KeyD?1:0)-(keys.KeyA||keys.KeyQ?1:0);
 const moving=!hiddenAt&&(fw||steer);
 if(driving){
  carSpeed+=fw*3.8*dt;carSpeed*=Math.exp(-(fw?.35:1.8)*dt);carSpeed=Math.max(-1.8,Math.min(5.8,carSpeed));
  carHeading+=(steer+(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*1.65*dt*Math.min(1,Math.abs(carSpeed)/1.2)*Math.sign(carSpeed);
  const before={x:player.x,y:player.y};move(player,Math.cos(carHeading)*carSpeed*dt,Math.sin(carHeading)*carSpeed*dt,.24);
  if(Math.hypot(player.x-before.x,player.y-before.y)<Math.abs(carSpeed)*dt*.25)carSpeed*=.2;
  player.a=carHeading+lookYaw;if(keys.KeyC)lookYaw=0;
  if(nearby(player,exit,1.1)){finish(true);return}
 }else if(!hiddenAt){
  const running=(keys.ShiftLeft||keys.ShiftRight)&&energy>1&&moving,speed=running?3:1.65,norm=Math.hypot(fw,steer)||1;
  energy=Math.max(0,Math.min(100,energy+(running?-29:18)*dt));move(player,(Math.cos(player.a)*fw-Math.sin(player.a)*steer)/norm*speed*dt,(Math.sin(player.a)*fw+Math.cos(player.a)*steer)/norm*speed*dt);
  if(keys.ArrowLeft)player.a-=dt*1.8;if(keys.ArrowRight)player.a+=dt*1.8;
  if(moving){footstep-=dt;if(footstep<=0){tone(75+Math.random()*20,.09,.026,'triangle');footstep=running?.26:.45}}
 }else energy=Math.min(100,energy+18*dt);
 if(!hiddenAt||hideCompromised)lastKnown={x:player.x,y:player.y};
 if(elapsed>7){pathTimer-=dt;if(pathTimer<=0){path=route(lastKnown);pathTimer=.45}
  const target=path[0]||lastKnown,dist=Math.hypot(target.x-enemy.x,target.y-enemy.y),v=(garage?1.7:1.08+collected*.12)*dt;
  if(dist>0.02){if(dist<v){enemy.x=target.x;enemy.y=target.y;path.shift()}else move(enemy,(target.x-enemy.x)/dist*v,(target.y-enemy.y)/dist*v,.16)}
 }
 const proximity=Math.hypot(enemy.x-player.x,enemy.y-player.y);
 if(proximity<.48&&(!hiddenAt||hideCompromised)){finish(false);return}
 heartbeat-=dt;if(proximity<6&&heartbeat<=0){tone(48,.14,.09);heartbeat=.35+proximity*.1}
 let prompt='';
 if(hiddenAt)prompt=hideCompromised?'IL SAIT OÙ VOUS ÊTES — E POUR SORTIR':'À COUVERT — E POUR SORTIR';
 else if(driving)prompt='Z / W : ACCÉLÉRER · Q / A / D : BRAQUER · C : RECENTRER LA VUE';
 else{for(const b of boxes)if(!b.on&&nearby(player,b,1.15))prompt='[ E ] RÉACTIVER LE BOÎTIER';
  if(!hasKeys&&nearby(player,carKeys,.9))prompt='[ E ] RAMASSER LES CLÉS DE LA GOLF';
  if(nearby(player,golf,1.1))prompt=hasKeys&&collected===3?'[ E ] MONTER DANS LA GOLF':!hasKeys?'GOLF VERROUILLÉE — CLÉS REQUISES':'GARAGE FERMÉ — 3 BOÎTIERS REQUIS';
  for(const l of lockers)if(nearby(player,l,.9))prompt='[ E ] SE CACHER DANS LE PLACARD';
 }
 $('#message').textContent=time<noticeUntil?notice:prompt;$('#energy').style.width=energy+'%';$('#status').textContent=driving?'FUYEZ PAR LE PARKING.':hiddenAt?(hideCompromised?'IL VOUS A VU.':'RESTEZ DISCRET.'):proximity<4?'IL SE RAPPROCHE.':'VOUS N’ÊTES PAS SEUL.';$('#status').style.color=proximity<4?'#e7a195':'';
 $('#timer').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
}
function rotateView(dx){
 if(!Number.isFinite(dx)||Math.abs(dx)>160)return;
 const turn=dx*sensitivity;
 if(driving)lookYaw=Math.max(-.8,Math.min(.8,lookYaw+turn));
 else player.a+=turn;
}
function handleMouse(e){
 if(state!=='playing')return;
 if(mouseMode==='drag'){
  if(!dragging)return;
  if(lastMouseX!==null)rotateView(e.clientX-lastMouseX);
  lastMouseX=e.clientX;return;
 }
 if(document.pointerLockElement!==canvas)return;
 // Ignore only the first event after capture, where browsers may recenter the cursor.
 if(lastMouseX===null){lastMouseX=e.clientX;return}
 rotateView(e.movementX);
}
async function lockMouse(){
 mousePending=0;lastMouseX=null;dragging=false;
 if(mouseMode==='drag'){message('MAINTENEZ LE CLIC GAUCHE POUR REGARDER.');return}
 try{await canvas.requestPointerLock()}catch{
  mouseMode='drag';$('#mouseMode').value='drag';message('MAINTENEZ LE CLIC GAUCHE POUR REGARDER.');
 }
}
canvas.addEventListener('mousedown',e=>{if(e.button===0&&state==='playing'&&mouseMode==='drag'){dragging=true;lastMouseX=e.clientX;e.preventDefault()}});
window.addEventListener('mouseup',()=>{dragging=false;lastMouseX=null});
$('#mouseMode').onchange=e=>{mouseMode=e.target.value;dragging=false;lastMouseX=null;if(document.pointerLockElement===canvas)document.exitPointerLock()};
// Reassign begin to start simulation only after the pointer-lock request settles.
async function begin(fresh){if(fresh){exit.x=19.5;exit.y=13.5;reset()}keys={};mousePending=0;state='playing';$('#menu').hidden=true;$('#footer').hidden=true;$('#overlay').hidden=true;$('#hud').hidden=false;objective();audio();await lockMouse()};
const originalPause=pause;
pause=function(){mousePending=0;dragging=false;lastMouseX=null;originalPause();if(document.pointerLockElement===canvas)document.exitPointerLock?.()};
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyE'&&state==='playing'&&!e.repeat)interact();if(e.code==='Escape'&&state==='playing')pause()});
document.addEventListener('keyup',e=>keys[e.code]=false);
document.addEventListener('mousemove',handleMouse);
document.addEventListener('pointerlockchange',()=>{mousePending=0;lastMouseX=null;if(!document.pointerLockElement&&mouseMode==='locked')pause()});
window.addEventListener('blur',()=>{keys={};pause()});
canvas.addEventListener('click',()=>{if(state==='playing'&&document.pointerLockElement!==canvas)lockMouse()});
$('#start').onclick=()=>begin(true);$('#resume').onclick=()=>begin(false);$('#restart').onclick=()=>begin(true);
$('#sensitivity').value=String(Math.round(sensitivity*100000));$('#sensitivityValue').textContent=String(Math.round(sensitivity*100000));
$('#sensitivity').oninput=e=>{sensitivity=Number(e.target.value)/100000;$('#sensitivityValue').textContent=e.target.value;try{localStorage.setItem('backrooms-sensitivity-v2',String(sensitivity))}catch{}};
window.addEventListener('resize',resize);textures();addDumbbell();createGolf();createGameplayTextures();loadPursuerPortrait();resize();reset();requestAnimationFrame(frame);
