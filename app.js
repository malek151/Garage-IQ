'use strict';
var VERCEL='https://www.garageiq.org.uk';
var SUPA_URL='https://hbfntnxawwavttzvxdde.supabase.co';
var SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm50bnhhd3dhdnR0enZ4ZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA3NTYsImV4cCI6MjA5NDQ5Njc1Nn0.PtGE3zS40b8VBozDcl93-sNVx1wN29-sKvZzje--s10';
var sb,currentUser,currentProfile,vehicleData={},motTests=[],selectedMods=new Set(),currentReg='';
var _specCache={};
var SEARCH_MODE='reg';

function el(id){return document.getElementById(id);}
function qsa(s){return document.querySelectorAll(s);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
function fmt(s){return s?String(s).toUpperCase():'-'}
function showErr(id,msg){var e=el(id);if(!e)return;e.textContent=msg;e.style.display='block';}
function showOk(id,msg){var e=el(id);if(!e)return;e.textContent=msg;e.style.display='block';}
function hideMsg(id){var e=el(id);if(!e)return;e.textContent='';e.style.display='none';}
function hideFeatGrid(){var fg=el('featGrid');if(fg)fg.style.display='none';}

var BRAND_LOGOS={'FORD':'🔵','VOLKSWAGEN':'⚫','BMW':'⚪','MERCEDES-BENZ':'⭐','AUDI':'⚪','TOYOTA':'🔴','HONDA':'🔴','NISSAN':'🔴','HYUNDAI':'🔵','KIA':'🔴','VAUXHALL':'⚡','PEUGEOT':'🦁','RENAULT':'🔷','CITROEN':'🔷','FIAT':'🔵','MAZDA':'🔴','SUBARU':'⭐','MITSUBISHI':'🔷','VOLVO':'⚫','MINI':'⚪','JAGUAR':'🐆','LAND ROVER':'🟢','RANGE ROVER':'🟢','TESLA':'🔴','PORSCHE':'⭐','ALFA ROMEO':'🔴','SKODA':'🟢','SEAT':'🔵','LEXUS':'⬛','SUZUKI':'🔵','DACIA':'🔵','MG':'🔴','JEEP':'⬛','DODGE':'🔴','CHEVROLET':'⭐'};
var BRAND_COLORS={'BMW':'#1c69d4','MERCEDES-BENZ':'#333','AUDI':'#bb0a14','VOLKSWAGEN':'#001e50','FORD':'#003478','TOYOTA':'#eb0a1e','HONDA':'#cc0000','TESLA':'#e82127','PORSCHE':'#d5001c','JAGUAR':'#003399','LAND ROVER':'#005a2b'};
function getBrandLogo(make){return BRAND_LOGOS[(make||'').toUpperCase().trim()]||'🚗';}
function getBrandColor(make){return BRAND_COLORS[(make||'').toUpperCase().trim()]||null;}

function fetchVehiclePhoto(make,model,year){
  var wrap=el('vehPhotoWrap');
  if(!wrap||!make)return;
  var bc=getBrandColor(make)||'#3B7BF6';
  var logo=getBrandLogo(make);
  var mk=(make||'').trim();
  var mo=(model||'').trim().split(' ')[0].toUpperCase();
  var label=esc([mk.toUpperCase(),mo,(year||'')].filter(Boolean).join(' '));
  wrap.style.position='relative';
  wrap.innerHTML='<div class="veh-photo-bg" style="width:100%;height:170px;background:linear-gradient(135deg,'+bc+'55 0%,'+bc+'18 55%,rgba(6,10,18,.9) 100%);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;overflow:hidden">'
    +'<div style="font-size:64px;filter:drop-shadow(0 0 28px '+bc+'cc);line-height:1">'+logo+'</div>'
    +'<div style="font-family:Syne,sans-serif;font-size:9px;font-weight:800;letter-spacing:3px;color:rgba(255,255,255,.2)">'+label+'</div>'
    +'</div>'
    +'<img id="vehPhotoReal" style="display:none;width:100%;height:170px;object-fit:cover;object-position:center 25%;filter:brightness(.85);transition:opacity .4s ease;opacity:0" alt="'+label+'">';
  wrap.classList.add('loaded');

  fetch(VERCEL+'/api/photo?make='+encodeURIComponent(mk)+'&model='+encodeURIComponent(mo))
    .then(function(r){return r.json();})
    .then(function(d){
      if(!d||!d.url)return;
      var real=el('vehPhotoReal');
      if(!real)return;
      real.onload=function(){
        var bg=wrap.querySelector('.veh-photo-bg');
        if(bg)bg.style.display='none';
        real.style.display='block';
        requestAnimationFrame(function(){real.style.opacity='1';});
      };
      real.src=d.url;
    }).catch(function(){});
}


(function(){
  var canvas=document.getElementById('heroCanvas');if(!canvas)return;
  var ctx=canvas.getContext('2d'),particles=[];
  function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;}
  resize();window.addEventListener('resize',resize);
  for(var i=0;i<70;i++)particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5+0.3,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,a:Math.random()*.5+.1});
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(59,123,246,'+p.a+')';ctx.fill();p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0;if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0;});
    for(var i=0;i<particles.length;i++)for(var j=i+1;j<particles.length;j++){var dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<100){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle='rgba(59,123,246,'+(0.06*(1-d/100))+')';ctx.lineWidth=0.5;ctx.stroke();}}
    requestAnimationFrame(draw);
  }
  draw();
})();

(function(){
  var saved=localStorage.getItem('giq_theme')||'dark';
  document.documentElement.setAttribute('data-theme',saved);
  var icon=document.getElementById('dmIcon');
  if(icon)icon.className=saved==='dark'?'ti ti-sun':'ti ti-moon';
})();
function toggleDark(){
  var html=document.documentElement,isDark=html.getAttribute('data-theme')==='dark',next=isDark?'light':'dark';
  html.setAttribute('data-theme',next);localStorage.setItem('giq_theme',next);
  var icon=el('dmIcon');if(icon)icon.className=next==='dark'?'ti ti-sun':'ti ti-moon';
}
/* light mode handled in CSS */

function setSearchMode(m){
  SEARCH_MODE=m;
  el('modeReg').classList.toggle('active',m==='reg');
  el('modeVin').classList.toggle('active',m==='vin');
  var inp=el('regInput'),note=el('searchNote'),badge=el('regBadgeTxt');
  if(m==='vin'){inp.placeholder='e.g. WBAFR7C55BC123456';inp.style.letterSpacing='1px';inp.style.fontSize='15px';inp.maxLength=17;if(note)note.textContent='17-character VIN · Any country worldwide';if(badge)badge.textContent='VIN';}
  else{inp.placeholder='AB12 CDE';inp.style.letterSpacing='5px';inp.style.fontSize='22px';inp.maxLength=8;if(note)note.textContent='UK reg plate · DVLA data · Instant · Secure';if(badge)badge.textContent='UK';}
  inp.value='';inp.focus();
}
function detectInputType(v){return /^[A-HJ-NPR-Z0-9]{17}$/i.test(v.replace(/\s/g,''))?'vin':'reg';}

var WMI_MAP={'SA':'United Kingdom','SB':'United Kingdom','SC':'United Kingdom','SD':'United Kingdom','WA':'Germany','WB':'Germany','WC':'Germany','WD':'Germany','WF':'Germany','WP':'Germany','VF':'France','VG':'France','VR':'France','ZA':'Italy','ZB':'Italy','ZF':'Italy','VS':'Spain','VT':'Spain','JA':'Japan','JF':'Japan','JH':'Japan','JN':'Japan','JT':'Japan','KL':'South Korea','KM':'South Korea','KN':'South Korea','1A':'United States','1C':'United States','1F':'United States','1G':'United States','1N':'United States','2A':'Canada','2F':'Canada','3A':'Mexico','3F':'Mexico','3N':'Mexico','9A':'Brazil','9B':'Brazil','6F':'Australia','6G':'Australia','LA':'China','LB':'China','LC':'China','LD':'China','LE':'China','LV':'China','MA':'India','MB':'India','MC':'India','JS':'Japan','KP':'South Korea','YS':'Sweden','YT':'Sweden','YV':'Sweden','TA':'Switzerland','TJ':'Czech Republic','TK':'Czech Republic','TM':'Hungary','TP':'Portugal','XW':'Russia','XY':'Russia'};
var COUNTRY_FLAGS={'United Kingdom':'🇬🇧','Germany':'🇩🇪','France':'🇫🇷','Italy':'🇮🇹','Spain':'🇪🇸','Japan':'🇯🇵','South Korea':'🇰🇷','United States':'🇺🇸','Canada':'🇨🇦','Mexico':'🇲🇽','China':'🇨🇳','India':'🇮🇳','Sweden':'🇸🇪','Brazil':'🇧🇷','Australia':'🇦🇺','Switzerland':'🇨🇭','Czech Republic':'🇨🇿','Hungary':'🇭🇺','Portugal':'🇵🇹','Russia':'🇷🇺'};
var VIN_YEARS={'A':1980,'B':1981,'C':1982,'D':1983,'E':1984,'F':1985,'G':1986,'H':1987,'J':1988,'K':1989,'L':1990,'M':1991,'N':1992,'P':1993,'R':1994,'S':1995,'T':1996,'V':1997,'W':1998,'X':1999,'Y':2000,'1':2001,'2':2002,'3':2003,'4':2004,'5':2005,'6':2006,'7':2007,'8':2008,'9':2009};

function vinCheckDigit(vin){
  var VALS={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9};
  var WEIGHTS=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2],sum=0;
  for(var i=0;i<17;i++)sum+=(VALS[vin[i].toUpperCase()]||0)*WEIGHTS[i];
  var rem=sum%11,check=rem===10?'X':String(rem);
  return{valid:check===vin[8].toUpperCase()};
}
function decodeVin(vin){
  vin=vin.replace(/\s/g,'').toUpperCase();if(vin.length!==17)return null;
  var wmi=vin.slice(0,3),wmi2=vin.slice(0,2),country=WMI_MAP[wmi]||WMI_MAP[wmi2]||'Unknown';
  var flag=COUNTRY_FLAGS[country]||'🌍',yc=vin[9],year=VIN_YEARS[yc]||null;
  if(year&&year>=2000){var y2=year+10;if(y2<=2026)year=y2;}
  var chk=vinCheckDigit(vin);
  return{vin:vin,wmi:wmi,vds:vin.slice(3,8),country:country,flag:flag,year:year,plant:vin[10],serial:vin.slice(11),checkValid:chk.valid};
}

function showLoadingOverlay(reg){
  var ov=el('loadingOverlay');if(!ov)return;
  ov.classList.remove('hidden');
  var lr=el('loadingReg');if(lr)lr.textContent=reg.toUpperCase();
  ['lstep1','lstep2','lstep3'].forEach(function(id){var s=el(id);if(s){s.classList.remove('active','done');}});
  function activate(id,delay,prev){setTimeout(function(){if(prev){var p=el(prev);if(p){p.classList.remove('active');p.classList.add('done');}}var s=el(id);if(s)s.classList.add('active');},delay);}
  activate('lstep1',0);activate('lstep2',900,'lstep1');activate('lstep3',1800,'lstep2');
}
function hideLoadingOverlay(){
  var ov=el('loadingOverlay');if(!ov)return;
  setTimeout(function(){['lstep1','lstep2','lstep3'].forEach(function(id){var s=el(id);if(s){s.classList.remove('active');s.classList.add('done');}});setTimeout(function(){ov.classList.add('hidden');},400);},200);
}

function estVal(d){
  var y=parseInt(d.yearOfManufacture)||2015,age=Math.max(0,2026-y),cc=parseInt(d.engineCapacity)||1600,fuel=(d.fuelType||'').toUpperCase(),make=(d.make||'').toUpperCase();
  var PREMIUM=['BMW','MERCEDES-BENZ','MERCEDES','AUDI','JAGUAR','LAND ROVER','RANGE ROVER','PORSCHE','LEXUS','VOLVO','MINI','TESLA','ALFA ROMEO'];
  var BUDGET=['DACIA','MG','CHEVROLET','SSANGYONG'];
  var mult=PREMIUM.indexOf(make)>=0?1.6:BUDGET.indexOf(make)>=0?0.82:1.0;
  var base=cc<=1000?14000:cc<=1400?18000:cc<=1600?22000:cc<=2000?28000:cc<=3000?42000:65000;
  if(fuel.indexOf('ELECTRIC')>=0)base=Math.max(base,32000);
  base=Math.round(base*mult);
  var retain=[1,.76,.64,.55,.48,.42,.37,.33,.29,.26,.23,.20,.18];
  return Math.max(600,Math.round(base*retain[Math.min(age,retain.length-1)]));
}
function estHp(d){
  var c=parseInt(d.engineCapacity)||1600,f=(d.fuelType||'').toUpperCase();
  if(f.indexOf('ELECTRIC')>=0)return 150;if(f.indexOf('HYBRID')>=0)return c<=1500?116:180;
  return c<=999?95:c<=1199?110:c<=1399?128:c<=1599?138:c<=1999?163:c<=2499?228:c<=2999?298:375;
}
function estTq(d){return Math.round(estHp(d)*1.55);}

function renderUlezVed(d){
  var grid=el('ulezGrid');if(!grid)return;
  var year=parseInt(d.yearOfManufacture)||0,fuel=(d.fuelType||'').toUpperCase();
  var isEV=fuel.indexOf('ELECTRIC')>=0,isHybrid=fuel.indexOf('HYBRID')>=0,isPetrol=fuel.indexOf('PETROL')>=0,isDiesel=fuel.indexOf('DIESEL')>=0;
  var ulezOk,ulezText,ulezColor;
  if(isEV){ulezOk=true;ulezText='Zero emission — exempt from all clean air charges';ulezColor='var(--green)';}
  else if(isHybrid&&year>=2005){ulezOk=true;ulezText='Hybrid '+year+' — meets ULEZ Euro 4+';ulezColor='var(--green)';}
  else if(isPetrol&&year>=2006){ulezOk=true;ulezText='Petrol '+year+' — meets ULEZ Euro 4';ulezColor='var(--green)';}
  else if(isDiesel&&year>=2015){ulezOk=true;ulezText='Diesel '+year+' — meets ULEZ Euro 6';ulezColor='var(--green)';}
  else{ulezOk=year>=2015;ulezText=(year?'Registered '+year+' — ':'')+(isPetrol?'Pre-Euro 4':isDiesel?'Pre-Euro 6':'Check your vehicle');ulezColor=ulezOk?'var(--amber)':'var(--red)';}
  var uv=el('ulezVal'),us=el('ulezSub');
  if(uv){uv.textContent=ulezOk?'Compliant':'Non-Compliant';uv.style.color=ulezColor;}
  if(us)us.textContent=ulezText;
  var regDate=d.monthOfFirstRegistration||'',regYear=parseInt(regDate.slice(0,4))||year,regMonth=parseInt(regDate.slice(5,7))||1;
  var co2=d.co2Emissions!=null?parseInt(d.co2Emissions):(isEV?0:isPetrol?(year>=2020?120:135):isDiesel?(year>=2020?130:145):140);
  var ved,vedBand,vedColor;
  if(regYear<2001){var cc2=parseInt(d.engineCapacity)||1600;ved='£'+(cc2<=1549?210:345);vedBand='Pre-2001 · '+(cc2<=1549?'≤1549cc':'>1549cc')+' rate';vedColor='var(--amber)';}
  else if(regYear<2017||(regYear===2017&&regMonth<4)){
    var bands=[{max:100,v:0,b:'A'},{max:110,v:20,b:'B'},{max:120,v:35,b:'C'},{max:130,v:160,b:'D'},{max:140,v:190,b:'E'},{max:150,v:210,b:'F'},{max:165,v:255,b:'G'},{max:175,v:305,b:'H'},{max:185,v:335,b:'I'},{max:200,v:385,b:'J'},{max:225,v:415,b:'K'},{max:255,v:710,b:'L'},{max:Infinity,v:735,b:'M'}];
    var bnd=bands.filter(function(x){return co2<=x.max;})[0]||bands[bands.length-1];
    ved='£'+bnd.v;vedBand='Band '+bnd.b+' ('+co2+' g/km)';vedColor=bnd.v===0?'var(--green)':bnd.v<=255?'var(--amber)':'var(--red)';
  }else{
    var std=isEV?(regYear<2025?0:190):190;ved='£'+std;vedBand=isEV?'Electric — free until 2025':'Standard rate (post-Apr 2017)';vedColor=std===0?'var(--green)':'var(--amber)';
    if((vehicleData.value||0)>40000&&(2026-regYear)>=1&&(2026-regYear)<=6){ved='£'+(std+410);vedBand+=' + expensive car supplement';vedColor='var(--red)';}
  }
  var vv=el('vedVal'),vs=el('vedSub');
  if(vv){vv.textContent=ved+' / yr';vv.style.color=vedColor;}
  if(vs)vs.textContent=vedBand+(co2?' · '+co2+' g/km CO₂':'');
  grid.classList.remove('hidden');
}

window.addEventListener('load',function(){
  /* PATCH: Supabase init can no longer take the whole page down with it.
     If the CDN is slow/blocked, every button below still gets wired up —
     auth just won't work until supabase loads (and we retry once). */
  function initSupabase(){
    if(!window.supabase){return false;}
    try{
      sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);
      sb.auth.onAuthStateChange(function(ev,session){
        currentUser=session?session.user:null;
        if(currentUser){var pu=localStorage.getItem('giq_pu_'+currentUser.id);if(pu)tryCreateProfile(currentUser.id,pu);else loadProfile();if(motTests.length)setTimeout(showIntelReport,120);}
        else{currentProfile=null;renderNav();if(motTests.length)showIntelReport();}
      });
      return true;
    }catch(e){console.error('Supabase init failed:',e);return false;}
  }
  if(!initSupabase()){
    var tries=0;
    var retry=setInterval(function(){
      tries++;
      if(initSupabase()||tries>20)clearInterval(retry); /* stop after ~10s */
    },500);
  }
  el('btnLogin').onclick=function(){openAuth('login');};
  el('btnSignup').onclick=function(){openAuth('signup');};
  el('btnAvatar').onclick=openProfileModal;
  el('authClose').onclick=closeAuth;
  el('authModal').onclick=function(e){if(e.target===this)closeAuth();};
  el('tabLogin').onclick=function(){switchAuthTab('login');};
  el('tabSignup').onclick=function(){switchAuthTab('signup');};
  el('btnDoLogin').onclick=doLogin;
  el('btnDoSignup').onclick=doSignup;
  el('profileClose').onclick=closeProfileModal;
  el('profileModal').onclick=function(e){if(e.target===this)closeProfileModal();};
  el('btnSaveUser').onclick=saveUsername;
  el('btnLogout').onclick=doLogout;
  if(el('btnLogoutNav'))el('btnLogoutNav').onclick=doLogout;
  el('runBtn').onclick=lookupVehicle;
  if(el('dmToggle'))el('dmToggle').onclick=toggleDark;
  el('regInput').onkeydown=function(e){if(e.key==='Enter')lookupVehicle();};
  el('regInput').oninput=function(){var v=this.value.trim();if(v.length===17&&/^[A-HJ-NPR-Z0-9]{17}$/i.test(v.replace(/\s/g,'')))setSearchMode('vin');};
  el('analyzeBtn').onclick=analyseMod;
  el('btnPwSignup').onclick=function(){openAuth('login');};
  el('btnPay').onclick=startPayment;
  el('btnPwLogin').onclick=function(){openAuth('login');};
  document.addEventListener('click',function(e){var mb=e.target.closest('.mod-btn');if(mb)selectMod(mb);});
  qsa('.pill-tab').forEach(function(b){b.onclick=function(){switchMainTab(b.dataset.tab);};});
  qsa('.dmg-zone').forEach(function(z){z.onclick=function(){var l=z.getAttribute('data-label');if(l)toast(l,'',2500);};});
  ['finPrice','finDeposit','finTerm','finApr'].forEach(function(id){if(el(id))el(id).oninput=calcFinance;});
  var p=new URLSearchParams(window.location.search),rReg=p.get('reg'),sid=p.get('session_id'),paid=p.get('paid');
  if(rReg&&paid==='1'&&sid){el('regInput').value=rReg;window.history.replaceState({},'','/');verifyThenLookup(rReg,sid);}
  else if(rReg){el('regInput').value=rReg;window.history.replaceState({},'','/');}
  if(el('modeReg'))el('modeReg').onclick=function(){setSearchMode('reg');};
  if(el('modeVin'))el('modeVin').onclick=function(){setSearchMode('vin');};
});

function switchMainTab(tab){
  qsa('.pill-tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
  qsa('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+tab);});
  if(tab==='report')showIntelReport();
  if(tab==='history'&&motTests.length){buildMileageChart(motTests);buildMotTimeline(motTests);}
  if(tab==='valuation'&&vehicleData.value)renderValuation();
}

function renderNav(){
  var li=!!(currentUser&&currentProfile);
  el('navGuest').classList.toggle('hidden',li);
  el('navLoggedIn').classList.toggle('hidden',!li);
  if(li){var uname=(currentProfile.username||currentUser.email||'').toUpperCase();if(el('navUsername'))el('navUsername').textContent=uname;}
}
function loadProfile(){
  sb.from('profiles').select('id,username').eq('id',currentUser.id).maybeSingle()
    .then(function(r){
      if(r.data&&r.data.username)currentProfile=r.data;
      else{var fb=currentUser.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20)||'USER';currentProfile={id:currentUser.id,username:fb};sb.from('profiles').upsert([{id:currentUser.id,username:fb}],{onConflict:'id'});}
      renderNav();if(motTests.length)showIntelReport();
    }).catch(function(){currentProfile={id:currentUser.id,username:'USER'};renderNav();});
}
function tryCreateProfile(uid,username){
  sb.from('profiles').upsert([{id:uid,username:username}],{onConflict:'id'})
    .then(function(){localStorage.removeItem('giq_pu_'+uid);currentProfile={id:uid,username:username};renderNav();})
    .catch(function(){loadProfile();});
}

function openAuth(tab){
  ['authErr','authOk'].forEach(hideMsg);
  ['loginEmail','loginPass','signupUser','signupEmail','signupPass'].forEach(function(id){if(el(id))el(id).value='';});
  el('authModal').classList.remove('hidden');switchAuthTab(tab||'login');
}
function closeAuth(){el('authModal').classList.add('hidden');}
function switchAuthTab(t){
  el('tabLogin').classList.toggle('active',t==='login');el('tabSignup').classList.toggle('active',t==='signup');
  el('loginForm').style.display=t==='login'?'block':'none';el('signupForm').style.display=t==='signup'?'block':'none';
  ['authErr','authOk'].forEach(hideMsg);
}
function doLogin(){
  var email=el('loginEmail').value.trim(),pass=el('loginPass').value;
  if(!email||!pass){showErr('authErr','Enter email and password.');return;}
  var btn=el('btnDoLogin');btn.disabled=true;btn.textContent='...';
  sb.auth.signInWithPassword({email:email,password:pass}).then(function(r){btn.disabled=false;btn.textContent='Log In';if(r.error)showErr('authErr',r.error.message);else closeAuth();});
}
function doSignup(){
  var username=el('signupUser').value.trim().toUpperCase().replace(/[^A-Z0-9_]/g,''),email=el('signupEmail').value.trim(),pass=el('signupPass').value;
  if(!username){showErr('authErr','Enter a username.');return;}
  if(!email){showErr('authErr','Enter your email.');return;}
  if(pass.length<6){showErr('authErr','Password needs 6+ chars.');return;}
  var btn=el('btnDoSignup');btn.disabled=true;btn.textContent='...';
  sb.from('profiles').select('id',{count:'exact',head:true}).eq('username',username).then(function(ck){
    if((ck.count||0)>0){btn.disabled=false;btn.textContent='Create Free Account';showErr('authErr','Username taken.');return;}
    sb.auth.signUp({email:email,password:pass}).then(function(r){
      btn.disabled=false;btn.textContent='Create Free Account';
      if(r.error){showErr('authErr',r.error.message);return;}
      var uid=r.data&&r.data.user?r.data.user.id:null;
      if(uid){localStorage.setItem('giq_pu_'+uid,username);sb.from('profiles').upsert([{id:uid,username:username}],{onConflict:'id'}).then(function(){localStorage.removeItem('giq_pu_'+uid);currentUser=r.data.user;currentProfile={id:uid,username:username};renderNav();closeAuth();}).catch(function(){showOk('authOk','Account created! Log in to continue.');});}
      else showOk('authOk','Check your email to confirm, then log in!');
    });
  });
}
function doLogout(){sb.auth.signOut().then(function(){currentUser=null;currentProfile=null;renderNav();closeProfileModal();el('intelPaywall').style.display='block';el('intelContent').style.display='none';});}

function openProfileModal(){
  ['profErr','profOk'].forEach(hideMsg);el('newUsername').value='';
  var name=(currentProfile&&currentProfile.username)?currentProfile.username.toUpperCase():'?';
  el('profAvatar').textContent=name.charAt(0);el('profName').textContent=name;el('profEmail').textContent=currentUser?currentUser.email:'';
  el('profLookups').textContent='—';el('profUnique').textContent='—';el('profHistory').innerHTML='<div class="ph-empty">Loading...</div>';
  el('profileModal').classList.remove('hidden');loadProfileHistory();
}
function closeProfileModal(){el('profileModal').classList.add('hidden');}
function saveUsername(){
  var val=el('newUsername').value.trim().toUpperCase().replace(/[^A-Z0-9_]/g,'');
  if(!val){showErr('profErr','Enter a username.');return;}
  var btn=el('btnSaveUser');btn.disabled=true;btn.textContent='...';
  sb.from('profiles').select('id',{count:'exact',head:true}).eq('username',val).then(function(ck){
    if((ck.count||0)>0&&val!==(currentProfile&&currentProfile.username||'').toUpperCase()){btn.disabled=false;btn.textContent='Save';showErr('profErr','Username taken.');return;}
    sb.from('profiles').update({username:val}).eq('id',currentUser.id).then(function(r){
      btn.disabled=false;btn.textContent='Save';
      if(r.error){showErr('profErr',r.error.message||'Failed');return;}
      currentProfile.username=val;renderNav();el('profAvatar').textContent=val.charAt(0);el('profName').textContent=val;el('newUsername').value='';showOk('profOk','Saved!');toast('Username saved!','ok',2000);
    }).catch(function(e){btn.disabled=false;btn.textContent='Save';showErr('profErr',e.message||'Failed');});
  });
}
function loadProfileHistory(){
  sb.from('car_history').select('reg,make,model,year,colour,fuel,looked_up_at').eq('user_id',currentUser.id).order('looked_up_at',{ascending:false}).limit(200).then(function(r){
    if(r.error){el('profHistory').innerHTML='<div class="ph-empty">Error loading.</div>';return;}
    var rows=r.data||[];el('profLookups').textContent=rows.length;
    var seen={},unique=[];rows.forEach(function(x){if(!seen[x.reg]){seen[x.reg]=true;unique.push(x);}});
    el('profUnique').textContent=unique.length;
    if(!rows.length){el('profHistory').innerHTML='<div class="ph-empty">No cars yet.</div>';return;}
    el('profHistory').innerHTML=unique.map(function(row){
      var date=row.looked_up_at?new Date(row.looked_up_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
      var car=[(row.make||''),(row.model||''),(row.year||'')].filter(Boolean).join(' ')||'Unknown';
      return'<div class="ph-item" data-reg="'+esc(row.reg)+'">'
        +'<div class="ph-reg">'+esc(row.reg)+'</div>'
        +'<div style="flex:1;min-width:0"><div class="ph-car">'+esc(car)+'</div><div class="ph-meta">'+esc([row.colour,row.fuel,date].filter(Boolean).join(' · '))+'</div></div>'
        +'<i class="ti ti-chevron-right" style="color:var(--t4);font-size:12px"></i></div>';
    }).join('');
    qsa('#profHistory .ph-item').forEach(function(item){item.onclick=function(){el('regInput').value=item.getAttribute('data-reg');closeProfileModal();lookupVehicle();};});
  }).catch(function(){el('profHistory').innerHTML='<div class="ph-empty">Could not load.</div>';});
}

function lookupVehicle(){
  var raw=el('regInput').value.trim().toUpperCase(),clean=raw.replace(/\s/g,'');
  if(!clean||clean.length<2)return;
  if(SEARCH_MODE==='vin'||detectInputType(clean)==='vin'){lookupVin(clean);return;}
  currentReg=clean;
  showLoadingOverlay(clean);
  el('errbox').classList.add('hidden');el('mainApp').classList.remove('hidden');el('loadbox').classList.add('hidden');
  var hs=el('heroSection');if(hs)hs.classList.add('searched');
  el('tabsWrap').classList.remove('hidden');el('vinStrip').style.display='none';
  selectedMods=new Set();motTests=[];
  el('analyzeBtn').disabled=true;el('analyzeBtn').innerHTML='<i class="ti ti-sparkles"></i> Select a mod to analyse';
  qsa('.mod-btn').forEach(function(b){b.classList.remove('selected');});
  el('intelPaywall').style.display='block';el('intelContent').style.display='none';
  el('mileChartWrap').innerHTML='<div class="loading-box" style="padding:1.75rem"><div class="spin"></div></div>';
  el('motTimeline').innerHTML='<div class="loading-box"><div class="spin"></div></div>';
  switchMainTab('overview');
  fetch(VERCEL+'/api/vehicle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registrationNumber:clean})})
    .then(function(r){if(!r.ok)throw new Error('DVLA error '+r.status);return r.json();})
    .then(function(d){
      var model=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||'';
      if(model&&model.length<=2)model='';
      vehicleData=Object.assign({},d,{reg:clean,model:model,hp:estHp(d),torque:estTq(d),value:estVal(d)});
      renderVehicle(vehicleData);renderUlezVed(vehicleData);saveToHistory();loadSpecs();loadMot(clean);renderValuation();hideFeatGrid();hideLoadingOverlay();
      el('loadbox').classList.add('hidden');
      var tr=el('tabsWrap');if(tr)tr.scrollIntoView({behavior:'smooth',block:'start'});
      showIntelReport();
    })
    .catch(function(e){
      el('loadbox').classList.add('hidden');hideLoadingOverlay();
      el('errbox').textContent='Could not fetch vehicle — check the reg and try again.';
      el('errbox').classList.remove('hidden');
    });
}
function verifyThenLookup(reg,sid){
  el('loadbox').classList.remove('hidden');el('mainApp').classList.remove('hidden');
  fetch(VERCEL+'/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:sid})})
    .then(function(r){return r.json();}).then(function(d){if(d.paid)sessionStorage.setItem('giq_paid_'+reg,'1');lookupVehicle();}).catch(function(){lookupVehicle();});
}

function renderVehicle(d){
  var reg=(d.reg||currentReg||'').toUpperCase().replace(/\s/g,'');
  var regFmt=reg.length===7?reg.slice(0,4)+' '+reg.slice(4):reg;
  if(el('vehReg'))el('vehReg').textContent=regFmt;
  if(el('vehHeader'))el('vehHeader').classList.add('visible');
  var logo=el('vehLogo');
  if(logo){logo.textContent=getBrandLogo(d.make);var bc=getBrandColor(d.make);if(bc)logo.style.background='linear-gradient(135deg,'+bc+'22,'+bc+'11)';}
  fetchVehiclePhoto(d.make,d.model||d.modelSeries||'',d.yearOfManufacture);
  var taxOk=(d.taxStatus||'').toLowerCase().indexOf('taxed')>=0,taxSorn=(d.taxStatus||'').toLowerCase().indexOf('sorn')>=0;
  if(el('vehTaxBadge')){el('vehTaxBadge').textContent=taxOk?'Taxed':taxSorn?'SORN':'Untaxed';el('vehTaxBadge').className='veh-status-badge '+(taxOk?'vsb-taxed':taxSorn?'vsb-sorn':'vsb-not-taxed');}
  var chips=[{ic:'ti-calendar',v:d.yearOfManufacture||'—'},{ic:'ti-gas-station',v:fmt(d.fuelType)},{ic:'ti-palette',v:fmt(d.colour||d.primaryColour)},{ic:'ti-engine',v:(d.engineCapacity||d.engineSize)?((d.engineCapacity||d.engineSize)+'cc'):'—'}];
  if(el('vehChips'))el('vehChips').innerHTML=chips.map(function(ch,i){return(i>0?'<span class="veh-chip-div">·</span>':'')+'<span class="veh-chip"><i class="ti '+ch.ic+'"></i>'+esc(String(ch.v))+'</span>';}).join('');
  var mk=fmt(d.make),mo=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||'';
  if(mo&&mo.length<=2)mo='';
  if(el('vehName'))el('vehName').textContent=(mk+(mo?' '+fmt(mo):'')).trim()||'Unknown Vehicle';
  var motOk=(d.motStatus||'').toLowerCase().indexOf('valid')>=0;
  if(el('vehMotStatus')){el('vehMotStatus').textContent=motOk?'Valid':fmt(d.motStatus)||'Unknown';el('vehMotStatus').className='veh-stat-val '+(motOk?'ok':'bad');}
  if(el('vehMotExpiry'))el('vehMotExpiry').textContent=d.motExpiryDate?fmt(d.motExpiryDate):'—';
  if(el('vehTaxDue'))el('vehTaxDue').textContent=d.taxDueDate?fmt(d.taxDueDate):(taxOk?'Current':'—');
  var yr2=parseInt(d.yearOfManufacture)||0;
  var euro=yr2>=2015?'Euro 6':yr2>=2011?'Euro 5':yr2>=2006?'Euro 4':yr2>=2001?'Euro 3':'Pre-Euro 3';
  if(el('vehEuro'))el('vehEuro').textContent=euro;
  el('statMake').textContent=fmt(d.make);
  var m2=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||'';if(m2&&m2.length<=2)m2='';
  el('statModel').textContent=m2?fmt(m2):'-';
  el('statYear').textContent=d.yearOfManufacture||d.monthOfFirstRegistration||'-';
  el('statEngine').textContent=(d.engineCapacity||d.engineSize)?((d.engineCapacity||d.engineSize)+'cc'):'-';
  el('statColour').textContent=fmt(d.colour||d.primaryColour);el('statFuel').textContent=fmt(d.fuelType);
  el('statTax').innerHTML='<span class="sdot '+(taxOk?'sdot-gr':'sdot-r')+'"></span>'+(taxOk?'TAXED':fmt(d.taxStatus));
  el('statTax').className='sval '+(taxOk?'green':'red');
  var mok=(d.motStatus||'').toLowerCase().indexOf('valid')>=0;
  el('statMot').innerHTML='<span class="sdot '+(mok?'sdot-gr':'sdot-r')+'"></span>'+(mok?'VALID':fmt(d.motStatus||'Unknown'));
  el('statMot').className='sval '+(mok?'green':'red');
  var vin=d.vin||d.vinLastFive||'';
  if(vin&&el('vinVal')){el('vinVal').textContent=vin;if(el('vinNote'))el('vinNote').textContent=d.vin?'Full VIN':'Partial (last 5)';if(el('vinStrip'))el('vinStrip').style.display='flex';}
  var ft=d.monthOfFirstRegistration||d.yearOfManufacture||'Unknown';
  if(el('firstRegText'))el('firstRegText').textContent=ft;
  if(el('firstRegText2'))el('firstRegText2').textContent=ft;
  if(el('taxStatusText'))el('taxStatusText').textContent=(d.taxStatus||'Unknown')+(taxOk?' — Legal to drive on UK roads.':" — Do not drive without valid tax.");
  if(el('taxChip')){el('taxChip').textContent=taxOk?'Taxed':'Not Taxed';el('taxChip').className='chip '+(taxOk?'chip-gr':'chip-r');}
  if(el('rhdChip')){var rf=(vehicleData.reg||'').replace(/\s/g,'').toUpperCase(),isUK=/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(rf)||/^[A-Z]{1,3}[0-9]{1,4}[A-Z]{0,3}$/.test(rf);el('rhdChip').textContent=isUK?'UK Spec':'Verify';el('rhdChip').className='chip '+(isUK?'chip-gr':'chip-g');}
}
function saveToHistory(){
  if(!currentUser)return;
  sb.from('car_history').insert({user_id:currentUser.id,reg:vehicleData.reg,make:vehicleData.make||null,model:vehicleData.model||null,year:vehicleData.yearOfManufacture?String(vehicleData.yearOfManufacture):null,colour:vehicleData.colour||vehicleData.primaryColour||null,fuel:vehicleData.fuelType||null,hp:vehicleData.hp||null,value:vehicleData.value||null}).then(function(){}).catch(function(){});
}

function applySpecs(s){
  setTimeout(function(){
    if(s.bhp&&el('scBhp'))el('scBhp').textContent=parseInt(s.bhp);
    if(s.torqueNm&&el('scTq'))el('scTq').textContent=parseInt(s.torqueNm);
    if(s.zeroToSixty&&el('scZero'))el('scZero').textContent=parseFloat(s.zeroToSixty);
    if(s.topSpeedMph&&el('scTop'))el('scTop').textContent=parseInt(s.topSpeedMph);
    if(s.gearbox&&el('scGearbox'))el('scGearbox').textContent=s.gearbox.replace(/-speed/i,' spd').replace('Automatic','Auto');
    if(s.consumptionCombined!==undefined&&el('scMpg'))el('scMpg').textContent=s.consumptionCombined===0?'EV':s.consumptionCombined;
  },250);
  if(el('specGearbox'))el('specGearbox').textContent=s.gearbox||'—';
  if(el('specCyl'))el('specCyl').textContent=s.cylinders!=null?String(s.cylinders):'—';
  if(el('specDrive'))el('specDrive').textContent=s.driveType||'—';
  if(el('specMpg'))el('specMpg').textContent=s.consumptionCombined?s.consumptionCombined+' mpg':s.consumptionCombined===0?'EV':'—';
  if(s.co2gkm===0){if(el('specCo2'))el('specCo2').innerHTML='0 g/km <span style="background:var(--green);color:#fff;font-size:8px;font-weight:800;padding:1px 6px;border-radius:4px;margin-left:3px">A</span>';}
  else if(s.co2gkm){if(el('specCo2'))el('specCo2').textContent=s.co2gkm+' g/km'+(s.co2Label?' ('+s.co2Label+')':'');}
  else{if(el('specCo2'))el('specCo2').textContent='—';}
  if(s.bhp)vehicleData.hp=parseInt(s.bhp);
  if(s.torqueNm)vehicleData.torque=parseInt(s.torqueNm);
  if(el('specsStatus')){el('specsStatus').textContent='Loaded';el('specsStatus').className='chip chip-gr';}
}
function loadSpecs(){
  if(el('specsStatus')){el('specsStatus').textContent='Loading...';el('specsStatus').className='chip chip-b';}
  var payload={make:vehicleData.make,model:vehicleData.model||vehicleData.modelSeries||vehicleData.typeApproval||'',year:vehicleData.yearOfManufacture,cc:vehicleData.engineCapacity||vehicleData.engineSize,fuel:vehicleData.fuelType};
  var key=[payload.make,payload.model,payload.year,payload.cc].join('_');
  if(_specCache[key]){applySpecs(_specCache[key]);return;}
  fetch(VERCEL+'/api/specs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){if(!r.ok)throw new Error('specs');return r.json();})
    .then(function(s){if(!s||(!s.bhp&&!s.torqueNm))throw new Error('empty');_specCache[key]=s;applySpecs(s);})
    .catch(function(){if(el('specsStatus')){el('specsStatus').textContent='Estimated';el('specsStatus').className='chip chip-g';}});
}

function loadMot(reg){
  fetch(VERCEL+'/api/mot?reg='+reg).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(raw){renderMot(raw);}).catch(function(){renderDemoMot();});
}
function renderMot(raw){
  var tests=[];
  if(raw&&raw.motTests)tests=raw.motTests;
  else if(Array.isArray(raw)&&raw[0]&&raw[0].motTests)tests=raw[0].motTests;
  else if(Array.isArray(raw)&&raw[0]&&raw[0].completedDate)tests=raw;
  if(!tests.length){renderDemoMot();return;}
  motTests=tests;
  /* Fix: raw[0].model not raw.model — DVSA returns an array */
  if(!vehicleData.model||vehicleData.model.length<=2){
    var mm=Array.isArray(raw)&&raw[0]?raw[0].model||'':(raw&&raw.model?raw.model:'');
    if(mm&&mm.length>2){
      vehicleData.model=mm.toUpperCase();
      if(el('statModel'))el('statModel').textContent=vehicleData.model;
      fetchVehiclePhoto(vehicleData.make,vehicleData.model,vehicleData.yearOfManufacture);
      loadSpecs();
    }
  }
  buildMotSummary(tests);buildMotRows(tests);buildMileageChart(tests);buildMotTimeline(tests);renderValuation();showIntelReport();
}
function renderDemoMot(){
  motTests=[
    {completedDate:'2024-11-14',testResult:'PASSED',odometerValue:62440,defects:[{type:'ADVISORY',text:'Nearside rear tyre worn close to legal limit'},{type:'ADVISORY',text:'Rear brake pads showing wear'}]},
    {completedDate:'2023-11-12',testResult:'PASSED',odometerValue:49210,defects:[]},
    {completedDate:'2022-11-08',testResult:'PASSED',odometerValue:37880,defects:[{type:'ADVISORY',text:'Front suspension arm bush deteriorating'}]},
    {completedDate:'2021-12-03',testResult:'FAILED',odometerValue:28550,defects:[{type:'MAJOR',text:'Nearside front headlamp aim too low (1.3.1a)'},{type:'ADVISORY',text:'Oil seeping from engine rocker cover gasket'}]}
  ];
  buildMotSummary(motTests);buildMotRows(motTests);buildMileageChart(motTests);buildMotTimeline(motTests);renderValuation();showIntelReport();
}
function buildMotSummary(tests){
  var tot=tests.length,pass=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  var advs=tests.reduce(function(s,t){return s+(t.defects||[]).filter(function(d){return d.type==='ADVISORY';}).length;},0);
  var rate=Math.round(pass/tot*100);
  el('sumPass').textContent=pass;el('sumFail').textContent=tot-pass;el('sumAdv').textContent=advs;el('sumTotal').textContent=tot;
  el('passRatePct').textContent=rate+'%';
  el('passBarFill').style.width=rate+'%';
  el('passBarFill').style.background=rate>=80?'linear-gradient(90deg,var(--green),var(--green3))':rate>=60?'linear-gradient(90deg,var(--amber),#FCD34D)':'linear-gradient(90deg,var(--red),var(--red3))';
  el('motSumWrap').classList.remove('hidden');
  el('motSumChip').textContent=rate+'% pass';el('motSumChip').style.display='inline-block';
  el('motSumChip').className='chip '+(rate>=80?'chip-gr':rate>=60?'chip-g':'chip-r');
  var allDef=[];tests.forEach(function(t){(t.defects||[]).forEach(function(d){allDef.push(d);});});
  var majors=allDef.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}).length;
  var advisories=allDef.filter(function(d){return d.type==='ADVISORY';}).length;
  var rel=Math.max(0,Math.min(100,Math.round(rate-(majors*4)-(advisories*.8)+(tot>=4?5:0))));
  var relLabel=rel>=80?'Excellent':rel>=65?'Good':rel>=50?'Average':'Below Average';
  if(el('reliabilityChip')){el('reliabilityChip').textContent=relLabel+' ('+rel+'/100)';el('reliabilityChip').className='chip '+(rel>=80?'chip-gr':rel>=65?'chip-b':rel>=50?'chip-g':'chip-r');}
  if(el('reliabilityContent')){
    el('reliabilityContent').innerHTML='<div style="padding:.25rem 0"><div style="display:flex;justify-content:space-between;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t4);margin-bottom:5px"><span>Reliability Score</span><span>'+rel+'/100</span></div>'
      +'<div style="height:8px;background:rgba(255,255,255,.06);border-radius:6px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:'+rel+'%;border-radius:6px;background:linear-gradient(90deg,'+(rel>=80?'var(--green),var(--green3)':rel>=65?'var(--blue),var(--blue2)':'var(--amber),#FCD34D')+');transition:width 1.2s ease"></div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--red3)">'+majors+'</div><div class="mot-sl">Major Fails</div></div>'
      +'<div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--amber)">'+advisories+'</div><div class="mot-sl">Advisories</div></div>'
      +'<div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--green3)">'+rate+'%</div><div class="mot-sl">Pass Rate</div></div></div></div>';
  }
}
function buildMotRows(tests){
  el('motHistory').innerHTML=tests.map(function(t){
    var passed=(t.testResult||'').toUpperCase()==='PASSED',def=t.defects||[];
    var dang=def.filter(function(d){return d.type==='DANGEROUS';}),maj=def.filter(function(d){return d.type==='MAJOR';}),min=def.filter(function(d){return d.type==='MINOR';}),adv=def.filter(function(d){return d.type==='ADVISORY';});
    var ds=t.completedDate||'—';try{if(ds.indexOf('T')>=0)ds=new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){}
    var mi=t.odometerValue?Number(t.odometerValue).toLocaleString()+' mi':'—';
    var dets=def.length
      ?dang.map(function(d){return'<div class="mot-di"><div class="def-dot d-dang"></div><div><span style="color:var(--red3);font-weight:700;font-size:9px;text-transform:uppercase">Dangerous — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +maj.map(function(d){return'<div class="mot-di"><div class="def-dot d-maj"></div><div><span style="color:#F97316;font-weight:700;font-size:9px;text-transform:uppercase">Major — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +min.map(function(d){return'<div class="mot-di"><div class="def-dot d-min"></div><div><span style="color:var(--green3);font-weight:700;font-size:9px;text-transform:uppercase">Minor — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +adv.map(function(d){return'<div class="mot-di"><div class="def-dot d-adv"></div><div><span style="color:var(--amber);font-weight:700;font-size:9px;text-transform:uppercase">Advisory — </span>'+esc(d.text||'')+'</div></div>';}).join('')
      :'<div style="font-size:11px;color:var(--t4);padding:5px 0">No failures or advisories.</div>';
    return'<div class="mot-row"><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 8px;flex-wrap:wrap;gap:5px"><span style="color:var(--t3);font-size:10px;font-weight:600">'+ds+'</span><span style="font-size:12px;font-weight:700;color:var(--t1)">'+mi+'</span><div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">'+((dang.length+maj.length)?'<span class="badge b-fail">'+(dang.length+maj.length)+' fail</span>':'')+(adv.length?'<span class="badge b-adv">'+adv.length+' adv</span>':'')+'<span class="badge '+(passed?'b-pass':'b-fail')+'">'+(passed?'PASS':'FAIL')+'</span><i class="ti ti-chevron-down" style="color:var(--t4);font-size:11px;transition:transform .2s"></i></div></div><div class="mot-det" style="padding:3px 8px 10px">'+dets+'</div></div>';
  }).join('');
  qsa('.mot-row').forEach(function(row){row.onclick=function(){var open=row.classList.contains('open');row.classList.toggle('open');var chev=row.querySelector('.ti-chevron-down');if(chev)chev.style.transform=open?'':'rotate(180deg)';};});
}

function buildMileageChart(tests){
  var carYear=parseInt(vehicleData.yearOfManufacture)||2010;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var pts=[{yr:carYear,mi:0,reg:true,passed:true}];
  sorted.forEach(function(t){var mi=parseInt(t.odometerValue)||0;if(!mi)return;var yr=0;try{yr=new Date(t.completedDate||'').getFullYear();}catch(e){}if(yr>0&&yr<carYear)return;pts.push({yr:yr||carYear,mi:mi,passed:(t.testResult||'').toUpperCase()==='PASSED',date:t.completedDate||'a'});});
  if(pts.length<2){el('mileChartWrap').innerHTML='<div style="text-align:center;padding:1.5rem;font-size:12px;color:var(--t4)">Insufficient data for chart</div>';return;}
  var maxMi=Math.max.apply(null,pts.map(function(p){return p.mi;}))||1,minYr=carYear,maxYr=Math.max(2026,pts[pts.length-1].yr||2026),yrSpan=Math.max(1,maxYr-minYr);
  var W=680,H=190,PL=50,PR=10,PT=10,PB=28,CW=W-PL-PR,CH=H-PT-PB;
  function px(yr){return PL+(yr-minYr)/yrSpan*CW;}function py(mi){return PT+CH-(mi/maxMi)*CH;}
  var yGrid='';[0,.25,.5,.75,1].forEach(function(f){var mi=Math.round(maxMi*f),y=PT+CH-f*CH,lbl=mi>=1000?Math.round(mi/1000)+'k':String(mi);yGrid+='<line x1="'+PL+'" y1="'+y+'" x2="'+(W-PR)+'" y2="'+y+'" stroke="rgba(255,255,255,.06)" stroke-width="1"'+(f>0?' stroke-dasharray="3,4"':'')+'/><text x="'+(PL-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="rgba(255,255,255,.25)" font-family="Inter,sans-serif">'+lbl+'</text>';});
  var xGrid='',step=Math.max(1,Math.ceil(yrSpan/7));for(var y=minYr;y<=maxYr;y+=step)xGrid+='<text x="'+px(y)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.25)" font-family="Inter,sans-serif">'+y+'</text>';
  var areaD='M'+px(pts[0].yr)+','+py(0)+' ';pts.forEach(function(p){areaD+='L'+px(p.yr)+','+py(p.mi)+' ';});areaD+='L'+px(pts[pts.length-1].yr)+','+py(0)+'Z';
  var lineD='M';pts.forEach(function(p,i){lineD+=(i>0?' L':'')+px(p.yr)+','+py(p.mi);});
  var dotsHtml=pts.map(function(p,idx){var fraud=!p.reg&&idx>0&&p.mi<pts[idx-1].mi,col=p.reg?'#10B981':fraud?'#EF4444':p.passed===false?'#F97316':'#3B7BF6',cx=px(p.yr),cy=py(p.mi),lbl=p.reg?'REG: 0 miles':(p.mi.toLocaleString()+' mi');return'<circle cx="'+cx+'" cy="'+cy+'" r="'+(p.reg?6:4.5)+'" fill="'+col+'" stroke="rgba(6,10,18,1)" stroke-width="2"><title>'+esc(lbl)+'</title></circle>'+(p.reg?'<text x="'+cx+'" y="'+(cy-11)+'" text-anchor="middle" font-size="8.5" font-weight="800" fill="#10B981" font-family="Syne,sans-serif">REG</text>':'')+(fraud?'<circle cx="'+cx+'" cy="'+cy+'" r="9" fill="none" stroke="#EF4444" stroke-width="1.5" opacity=".5"/>':'');}).join('');
  el('mileChartWrap').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;overflow:visible;display:block" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3B7BF6" stop-opacity="0.15"/><stop offset="100%" stop-color="#3B7BF6" stop-opacity="0.01"/></linearGradient></defs><line x1="'+PL+'" y1="'+PT+'" x2="'+PL+'" y2="'+(H-PB)+'" stroke="rgba(255,255,255,.08)" stroke-width="1"/><line x1="'+PL+'" y1="'+(H-PB)+'" x2="'+(W-PR)+'" y2="'+(H-PB)+'" stroke="rgba(255,255,255,.08)" stroke-width="1"/>'+yGrid+xGrid+'<path d="'+areaD+'" fill="url(#gfill)"/><path d="'+lineD+'" fill="none" stroke="#3B7BF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+dotsHtml+'</svg>';
}

function buildMotTimeline(tests){
  var sorted=tests.slice().sort(function(a,b){return new Date(b.completedDate||0)-new Date(a.completedDate||0);});
  el('motTimeline').innerHTML='<div class="mot-tl">'+sorted.map(function(t,idx){
    var passed=(t.testResult||'').toUpperCase()==='PASSED',def=t.defects||[];
    var maj=def.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}),adv=def.filter(function(d){return d.type==='ADVISORY';});
    var ds=t.completedDate||'—';try{if(ds.indexOf('T')>=0)ds=new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){}
    var mi=t.odometerValue?Number(t.odometerValue).toLocaleString()+' miles':'—';
    var defHTML=def.length?def.map(function(d){var cls=d.type==='DANGEROUS'?'d-dang':d.type==='MAJOR'?'d-maj':d.type==='ADVISORY'?'d-adv':'d-min';return'<div class="tl-def"><div class="def-dot '+cls+'"></div><div><span style="font-weight:700;font-size:9px;text-transform:uppercase;margin-right:3px">'+esc(d.type)+'</span>'+esc(d.text||'')+'</div></div>';}).join(''):'<div style="font-size:10px;color:var(--t4);padding:3px 0">No defects recorded.</div>';
    return'<div class="tl-item" style="animation-delay:'+(idx*.04)+'s"><div class="tl-dot '+(passed?'pass':'fail')+'">'+(passed?'<i class="ti ti-check" style="font-size:8px"></i>':'<i class="ti ti-x" style="font-size:8px"></i>')+'</div><div class="tl-body" onclick="this.closest(\'.tl-item\').classList.toggle(\'open\')"><div class="tl-row"><span class="tl-date">'+ds+'</span><span class="tl-mi">'+mi+'</span><div style="display:flex;gap:4px;align-items:center">'+(maj.length?'<span class="badge b-fail">'+maj.length+' fail</span>':'')+(adv.length?'<span class="badge b-adv">'+adv.length+' adv</span>':'')+'<span class="badge '+(passed?'b-pass':'b-fail')+'">'+(passed?'PASS':'FAIL')+'</span><i class="ti ti-chevron-down" style="color:var(--t4);font-size:10px"></i></div></div><div class="tl-defs">'+defHTML+'</div></div></div>';
  }).join('')+'</div>';
}

var ZK={front:['headlamp','headlight','bumper','bonnet','front','number plate','fog lamp','horn','grille'],rear:['rear','tail','boot','reversing','back bumper','rear lamp'],left:['nearside','left'],right:['offside','right'],roof:['roof','windscreen','screen','mirror','wiper blade'],under:['brake','suspension','steering','tyre','wheel bearing','oil','engine','gearbox','clutch','exhaust','fuel']};
function buildDamageMap(tests){
  var allDef=[];tests.forEach(function(t){(t.defects||[]).forEach(function(d){allDef.push(d);});});
  qsa('.dmg-zone').forEach(function(z){z.classList.remove('hit','minor-hit');});
  var hitZ={};
  allDef.forEach(function(d){var txt=(d.text||'').toLowerCase(),isMaj=d.type==='MAJOR'||d.type==='DANGEROUS';Object.keys(ZK).forEach(function(zone){if(ZK[zone].some(function(kw){return txt.indexOf(kw)>=0;})){if(!hitZ[zone]||isMaj)hitZ[zone]=isMaj?'hit':'minor-hit';}});});
  Object.keys(hitZ).forEach(function(zone){var z=el('zone-'+zone);if(z)z.classList.add(hitZ[zone]);});
  var listEl=el('dmgList'),serious=allDef.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}),adv=allDef.filter(function(d){return d.type==='ADVISORY';});
  if(!allDef.length){listEl.innerHTML='<div style="font-size:11px;color:var(--t4);text-align:center;padding:.85rem"><i class="ti ti-check" style="color:var(--green3);font-size:18px;display:block;margin-bottom:6px"></i>Clean — no defects in MOT history</div>';el('dmgChip').textContent='Clean';el('dmgChip').className='chip chip-gr';return;}
  var html='';
  if(serious.length){html+='<div style="font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--red3);margin-bottom:5px">Failures</div>';serious.forEach(function(d){html+='<div class="dmg-item damage"><i class="ti ti-alert-triangle"></i><div><div class="dmg-it">'+esc(d.type)+'</div><div class="dmg-id">'+esc(d.text)+'</div></div></div>';});}
  if(adv.length){html+='<div style="font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--amber);margin:8px 0 5px">Advisories</div>';adv.slice(0,5).forEach(function(d){html+='<div class="dmg-item advisory"><i class="ti ti-alert-circle"></i><div><div class="dmg-it">Advisory</div><div class="dmg-id">'+esc(d.text)+'</div></div></div>';});}
  el('dmgChip').textContent=allDef.length+' items';el('dmgChip').className='chip '+(serious.length?'chip-r':'chip-g');
  listEl.innerHTML=html;
}

function calcAnnualMi(){
  if(motTests.length<2)return 0;
  var sr=motTests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var fr=sr.filter(function(t){return parseInt(t.odometerValue)>0;});
  if(fr.length<2)return 0;
  var yrs=(new Date(fr[fr.length-1].completedDate)-new Date(fr[0].completedDate))/(1000*60*60*24*365.25);
  return yrs>0.1?Math.round((parseInt(fr[fr.length-1].odometerValue)-parseInt(fr[0].odometerValue))/yrs):0;
}

function renderValuation(){
  var d=vehicleData,yr=parseInt(d.yearOfManufacture)||0,age=yr?2026-yr:0,base=d.value||null;
  if(!base){var est=estVal(d);if(el('valPrice'))el('valPrice').textContent='Unavailable';if(el('finPrice'))el('finPrice').value=est;if(el('finDeposit'))el('finDeposit').value=Math.round(est*.15);calcFinance();return;}
  if(el('valPrice'))el('valPrice').textContent='£'+base.toLocaleString();
  if(el('valPrivate'))el('valPrivate').textContent='£'+Math.round(base*.88).toLocaleString()+'–£'+Math.round(base*1.12).toLocaleString();
  if(el('valTrade'))el('valTrade').textContent='£'+Math.round(base*.82).toLocaleString();
  if(el('valPx'))el('valPx').textContent='£'+Math.round(base*.73).toLocaleString();
  if(el('vfAge'))el('vfAge').textContent=age;
  var annMi=calcAnnualMi();if(el('vfMileage'))el('vfMileage').textContent=annMi>0?annMi.toLocaleString():'N/A';
  var tot=motTests.length,pass=motTests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  if(el('vfPass'))el('vfPass').textContent=tot>0?Math.round(pass/tot*100)+'%':'N/A';
  var depHTML='';for(var y=0;y<=5;y++){var dp=Math.round(base*Math.pow(.85,y));depHTML+='<div class="dep-row"><div class="dep-yr">'+(y===0?'Now':'+'+(y)+'yr')+'</div><div class="dep-bg"><div class="dep-fill" id="depF'+y+'"></div></div><div class="dep-val">£'+dp.toLocaleString()+'</div></div>';}
  if(el('depRows')){el('depRows').innerHTML=depHTML;setTimeout(function(){for(var y=0;y<=5;y++){var dp2=Math.round(base*Math.pow(.85,y)),f=el('depF'+y);if(f)f.style.width=Math.round((dp2/base)*100)+'%';}},300);}
  if(el('finPrice'))el('finPrice').value=base;if(el('finDeposit'))el('finDeposit').value=Math.round(base*.15);calcFinance();
  var fuel2=(d.fuelType||'').toUpperCase(),isEV=fuel2.indexOf('ELECTRIC')>=0,isHyb=fuel2.indexOf('HYBRID')>=0;
  if(el('demandFuel'))el('demandFuel').textContent=isEV?'Very High ↑':isHyb?'High ↑':'Medium →';
  if(el('demandAge'))el('demandAge').textContent=age<=2?'Strong ↑':age<=5?'Good →':age<=10?'Moderate →':'Lower ↓';
  if(el('demandTrend'))el('demandTrend').textContent=isEV?'Rising':'Stable →';
  if(el('demandTime'))el('demandTime').textContent=age<=3?'2–3 weeks':age<=7?'3–5 weeks':'4–8 weeks';
}
function calcFinance(){
  var price=parseFloat(el('finPrice')?el('finPrice').value:8000)||8000,dep=parseFloat(el('finDeposit')?el('finDeposit').value:0)||0,term=parseInt(el('finTerm')?el('finTerm').value:36)||36,apr=parseFloat(el('finApr')?el('finApr').value:9.9)||9.9;
  var loan=Math.max(0,price-dep),mr=apr/100/12;
  var monthly=mr>0?Math.round(loan*(mr*Math.pow(1+mr,term))/(Math.pow(1+mr,term)-1)*100)/100:Math.round(loan/term*100)/100;
  if(el('finMonthly'))el('finMonthly').textContent='£'+monthly.toFixed(2);
  if(el('finTotal'))el('finTotal').textContent='£'+Math.round(monthly*term+dep).toLocaleString();
  if(el('finInterest'))el('finInterest').textContent='£'+Math.max(0,Math.round(monthly*term-loan)).toLocaleString();
  if(el('finLoan'))el('finLoan').textContent='£'+loan.toLocaleString();
}

var VIP=['bravemalek2020@gmail.com','waelmoh1983@gmail.com'];
function isVip(){if(!currentUser)return false;return VIP.some(function(v){return v.toLowerCase()===(currentUser.email||'').toLowerCase().trim();});}
function hasPaid(r){return sessionStorage.getItem('giq_paid_'+(r||currentReg))==='1';}

function buildGauge(score){
  var col=score<=25?'var(--green)':score<=55?'var(--amber)':'var(--red)';
  var angDeg=-180+(score/100)*180,angRad=angDeg*(Math.PI/180),cx=100,cy=100,r=72,nx=cx+r*.65*Math.cos(angRad),ny=cy+r*.65*Math.sin(angRad);
  function arcPath(fd,td,c){var r1=fd*(Math.PI/180),r2=td*(Math.PI/180),x1=cx+r*Math.cos(r1),y1=cy+r*Math.sin(r1),x2=cx+r*Math.cos(r2),y2=cy+r*Math.sin(r2),lg=(td-fd)>180?1:0;return'<path d="M'+x1+' '+y1+' A'+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+'" stroke="'+c+'" stroke-width="10" fill="none" stroke-linecap="round"/>';}
  return'<svg viewBox="0 0 200 115" style="width:100%;max-width:150px;display:block;margin:0 auto">'
    +arcPath(-180,-120,'rgba(16,185,129,.15)')+arcPath(-120,-60,'rgba(245,158,11,.15)')+arcPath(-60,0,'rgba(239,68,68,.15)')
    +(score>0?arcPath(-180,Math.min(-0.5,angDeg),col):'')
    +'<line x1="'+cx+'" y1="'+cy+'" x2="'+nx+'" y2="'+ny+'" stroke="rgba(255,255,255,.9)" stroke-width="2" stroke-linecap="round"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="rgba(255,255,255,.9)"/>'
    +'<text x="'+cx+'" y="'+(cy+16)+'" text-anchor="middle" font-family="Syne,sans-serif" font-size="22" font-weight="800" fill="'+col+'">'+score+'</text>'
    +'<text x="'+cx+'" y="'+(cy+28)+'" text-anchor="middle" font-size="7.5" fill="rgba(255,255,255,.35)" font-weight="700" letter-spacing="1">RISK SCORE</text></svg>';
}

function showIntelReport(){
  if(!motTests.length)return;
  if(!currentUser){el('pwLoggedOut').style.display='block';el('pwLoggedIn').style.display='none';el('intelPaywall').style.display='block';el('intelContent').style.display='none';return;}
  var vip=isVip(),paid=hasPaid(currentReg);
  if(vip||paid){
    el('intelPaywall').style.display='none';el('intelContent').style.display='block';
    el('intelBadge').textContent=vip?'VIP Access':'UNLOCKED';el('intelBadge').className=vip?'chip chip-g':'chip chip-gr';
    try{buildIntelReport(motTests);}catch(e){el("intelChecks").innerHTML='<div class="info-box"><i class="ti ti-alert-circle"></i> Report generation error: '+esc(e.message)+'</div>';}buildDamageMap(motTests);buildOwnership();runAiRisk(motTests);
  }else{
    el('pwLoggedOut').style.display='none';el('pwLoggedIn').style.display='block';
    el('intelPaywall').style.display='block';el('intelContent').style.display='none';
    el('intelBadge').textContent='£1.99 to unlock';el('intelBadge').className='chip chip-g';
  }
}

function buildOwnership(){
  var d=vehicleData,annMi=calcAnnualMi(),comm=annMi>18000;
  el('commUseTitle').textContent=comm?'Possible Commercial/Fleet Use':'No Commercial Use Indicators';
  el('commUseText').textContent=comm?'~'+annMi.toLocaleString()+' mi/yr — consistent with commercial use.':'~'+(annMi>0?annMi.toLocaleString():'unknown')+' mi/yr — consistent with private use.';
  el('commUseChip').textContent=comm?'Flag':'Low Risk';el('commUseChip').className='chip '+(comm?'chip-g':'chip-gr');
  var cc=parseInt(vehicleData.engineCapacity)||1600,bhp=vehicleData.hp||130,value=vehicleData.value||estVal(d),age=Math.max(0,2026-(parseInt(d.yearOfManufacture)||2018));
  var abiGroup=Math.max(1,Math.min(50,Math.round((Math.min(50,(bhp/10)+(cc/100)))*.5+(Math.min(50,value/1000))*.3+(age*.2))+(age>10?-4:age>5?-2:0)));
  var pb=[{max:10,low:350,high:550},{max:20,low:550,high:800},{max:30,low:800,high:1200},{max:40,low:1200,high:1900},{max:50,low:1900,high:3200}].filter(function(x){return abiGroup<=x.max;})[0]||{low:1900,high:3200};
  el('insuranceGroupText').textContent='ABI Group '+abiGroup+'/50 — based on '+bhp+' BHP, '+cc+'cc, £'+value.toLocaleString()+' value, '+age+' yr'+(age===1?'':'s')+' old.';
  el('insuranceGroupChip').textContent='Group '+abiGroup;
  el('insuranceCostText').textContent='£'+pb.low.toLocaleString()+'–£'+pb.high.toLocaleString()+'/yr for an average UK driver (30+, no claims, ABI group '+abiGroup+').';
  el('insuranceCostChip').textContent='£'+pb.low.toLocaleString()+'–£'+pb.high.toLocaleString();
}

function buildIntelReport(tests){
  var allDef=[];
  tests.forEach(function(t){(t.defects||[]).forEach(function(d){if(d)allDef.push({txt:(d.text||'').toLowerCase(),text:d.text||'',type:d.type||'',date:t.completedDate||'',mi:parseInt(t.odometerValue)||0});});});

  var hit=function(kws){return allDef.filter(function(d){return kws.some(function(k){return d.txt.indexOf(k)>=0;});});};
  var majHit=function(kws){return hit(kws).filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';});};

  var structItems=majHit(['chassis','subframe','structural','floor','crossmember','sill section','repair plate','body structure','welded section','inadequate repair','bent','deformed','distorted','buckled']);
  var airbagItems=hit(['airbag','air bag','srs','restraint','pretensioner','deployed','warning light illuminated','warning light on','dashboard warning','mil illuminated','malfunction indicator']);
  var bodyItems=hit(['damaged','inadequate repair','filler','panel','closure not','bonnet not','door not','boot not','ripple','dent','crease','overspray']).filter(function(d){return!/(tyre|lamp|light|lens|glass|windscreen|wiper)\s*(damaged|cracked)/i.test(d.text);});
  var corrItems=hit(['rust','corrosi','perforate','structurally weak','arch corrosi','sill corrosi','floor corrosi']);
  var corrMajor=majHit(['rust','corrosi','perforate','structurally weak']).length;
  var brakeFails=majHit(['brake','calliper','disc','drum','pad','servo','master cyl']).length;
  var steerFails=majHit(['steering','rack','column','track rod','power steer']).length;
  var emissFails=majHit(['emission','exhaust','catalyst','smoke','lambda','dpf','particulate']).length;
  var suspenFails=majHit(['suspension','spring','shock','absorber','damper','wishbone','ball joint']).length;

  var fmap={};
  allDef.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}).forEach(function(d){var k=(d.text||'').toLowerCase().slice(0,35);fmap[k]=(fmap[k]||0)+1;});
  var recurring=Object.keys(fmap).filter(function(k){return fmap[k]>=2;});

  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var advSet=new Set(),escalated=0;
  sorted.forEach(function(t){
    (t.defects||[]).filter(function(d){return d&&(d.type==='MAJOR'||d.type==='DANGEROUS');}).forEach(function(d){var k=(d.text||'').toLowerCase().slice(0,35);if(advSet.has(k))escalated++;});
    (t.defects||[]).filter(function(d){return d&&d.type==='ADVISORY';}).forEach(function(d){advSet.add((d.text||'').toLowerCase().slice(0,35));});
  });

  var gaps=[];
  for(var g=1;g<sorted.length;g++){var gd=(new Date(sorted[g].completedDate||0)-new Date(sorted[g-1].completedDate||0))/(1000*60*60*24*365.25);if(gd>1.65)gaps.push({months:Math.round(gd*12),from:(sorted[g-1].completedDate||'').slice(0,7),to:(sorted[g].completedDate||'').slice(0,7)});}

  var passCount=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  var passRate=Math.round(passCount/tests.length*100);
  var reg=(currentReg||'').replace(/\s/g,'').toUpperCase();
  var carYear=parseInt(vehicleData.yearOfManufacture)||0;
  var markedExport=vehicleData.markedForExport===true||vehicleData.markedForExport==='true';
  var v5cDate=vehicleData.dateOfLastV5CIssued||'';
  var v5cAge=v5cDate?Math.round((Date.now()-new Date(v5cDate).getTime())/(1000*60*60*24*30)):null;
  var isModernUK=/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(reg);
  var regYearCode=isModernUK?parseInt(reg.slice(2,4)):0;
  var regYear2=regYearCode>=51?2000+regYearCode-51+1:regYearCode>0?2000+regYearCode:0;
  var plateMismatch=regYear2>0&&carYear>0&&Math.abs(regYear2-carYear)>2;

  var accScore=Math.min(100,(structItems.length*28)+(airbagItems.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}).length*35)+(airbagItems.filter(function(d){return d.type==='ADVISORY';}).length*15)+(bodyItems.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}).length*20)+(bodyItems.filter(function(d){return d.type==='ADVISORY';}).length*8)+(corrMajor*10));
  var score=Math.min(100,Math.round((accScore*.5)+(recurring.length*10)+(escalated*8)+(gaps.length*5)+(passRate<60?20:passRate<75?8:0)+(plateMismatch?12:0)+(markedExport?25:0)));
  var lv=score>=55?'high':score>=20?'med':'low';

  var fa=el('fraudAlert'),fat=el('fraudAlertText');
  if(fa&&(markedExport||accScore>=20||recurring.length>1)){fa.classList.remove('hidden');fat.textContent=markedExport?'DVLA: Marked for export — verify before purchase.':accScore>=45?'Crash indicators in MOT history — inspection essential.':'Concerns detected — arrange inspection before purchase.';}else if(fa)fa.classList.add('hidden');

  el('riskGaugeSvg').innerHTML=buildGauge(score);
  el('riskLbl').textContent=lv==='low'?'LOW RISK':lv==='med'?'MODERATE RISK':'HIGH RISK';
  el('riskSub').textContent=lv==='low'?'No major red flags in DVLA/DVSA data.':lv==='med'?'Some concerns detected. Run checks below.':'Multiple serious concerns. Do not buy without all checks.';

  /* ── CARD BUILDER ── */
  function badge(cls,icon,txt){return'<div class="cv-badge cv-'+cls+'"><i class="ti ti-'+icon+'"></i>'+txt+'</div>';}
  function card(title,badgeHtml,desc,detail,link,linkTxt){
    return'<div class="cv-card">'
      +'<div class="cv-card-title">'+title+'</div>'
      +badgeHtml
      +'<div class="cv-card-desc">'+desc+'</div>'
      +(detail?'<div class="cv-card-detail">'+detail+'</div>':'')
      +(link?'<a href="'+link+'" target="_blank" rel="noopener" class="cv-ext-link"><i class="ti ti-external-link" style="font-size:11px"></i>'+linkTxt+'</a>':'')
      +'</div>';
  }
  function sep(t){return'<div class="cv-section-sep">'+t+'</div>';}

  var make=esc((vehicleData.make||'').toUpperCase());
  var model=esc((vehicleData.model||vehicleData.modelSeries||'').toUpperCase());
  var yr=vehicleData.yearOfManufacture||'';
  var fuel=esc((vehicleData.fuelType||'').toUpperCase());
  var colour=esc((vehicleData.colour||vehicleData.primaryColour||'').toUpperCase());
  var regEnc=encodeURIComponent(reg);
  var now=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  var scoreCol=score<=30?'#10B981':score<=60?'#F59E0B':'#EF4444';
  var circ=(2*Math.PI*28).toFixed(1);
  var dash=(2*Math.PI*28*(1-score/100)).toFixed(1);

  var html='<div class="cv-report">';

  /* HEADER — matches CarVertical layout */
  html+='<div class="cv-header">'
    +'<div class="cv-header-top">'
    +'<div class="cv-car-thumb">'+getBrandLogo(vehicleData.make||'')+'</div>'
    +'<div class="cv-header-info">'
    +'<div class="cv-generated">Generated '+now+'</div>'
    +'<div class="cv-chips">'
    +(reg?'<span class="cv-chip">Plate: '+esc(reg)+'</span>':'')
    +(fuel?'<span class="cv-chip">'+fuel+'</span>':'')
    +(yr?'<span class="cv-chip">'+yr+'</span>':'')
    +(colour?'<span class="cv-chip">'+colour+'</span>':'')
    +'</div></div></div>'
    /* Score */
    +'<div class="cv-score-row">'
    +'<div class="cv-score-ring"><svg viewBox="0 0 64 64" width="72" height="72">'
    +'<circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>'
    +'<circle cx="32" cy="32" r="28" fill="none" stroke="'+scoreCol+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+dash+'" style="transition:stroke-dashoffset 1.2s ease"/>'
    +'</svg><div class="cv-score-num"><div class="cv-score-big" style="color:'+scoreCol+'">'+score+'</div><div class="cv-score-denom">/100</div></div></div>'
    +'<div class="cv-score-text">'
    +'<div class="cv-score-title">GarageIQ Risk Score</div>'
    +'<div class="cv-score-desc">'+(lv==='low'?'This vehicle shows no major risk indicators from '+tests.length+' MOT records and DVLA data.':lv==='med'?'This vehicle shows some concerns. Review each check carefully before purchasing.':'Multiple risk factors detected. Do not purchase without completing all checks below.')+'</div>'
    +'</div></div>'
    +'</div>'; /* end cv-header */

  /* SECTION: LEGAL & FINANCE */
  html+=sep('Legal &amp; Financial Status');

  /* Stolen — loading, updated by API */
  html+='<div class="cv-card" id="cc-stolen">'
    +'<div class="cv-card-title">Theft check</div>'
    +'<div id="cc-stolen-badge"><div class="cv-badge cv-pend"><div class="spin" style="width:10px;height:10px;flex-shrink:0"></div>Checking...</div></div>'
    +'<div class="cv-card-desc" id="cc-stolen-d">Querying UK police and database records via carcheck.co.uk</div>'
    +'<a href="https://www.carcheck.co.uk/'+regEnc+'" target="_blank" rel="noopener" class="cv-ext-link"><i class="ti ti-external-link" style="font-size:11px"></i>Open on carcheck.co.uk</a>'
    +'</div>';

  /* Finance — loading */
  html+='<div class="cv-card" id="cc-finance">'
    +'<div class="cv-card-title">Financial and legal status check</div>'
    +'<div id="cc-finance-badge"><div class="cv-badge cv-pend"><div class="spin" style="width:10px;height:10px;flex-shrink:0"></div>Checking...</div></div>'
    +'<div class="cv-card-desc" id="cc-finance-d">Checking finance, HPI and legal status records</div>'
    +'<a href="https://www.carcheck.co.uk/'+regEnc+'" target="_blank" rel="noopener" class="cv-ext-link"><i class="ti ti-external-link" style="font-size:11px"></i>Open on carcheck.co.uk</a>'
    +'</div>';

  /* Write-off — loading */
  html+='<div class="cv-card" id="cc-writeoff">'
    +'<div class="cv-card-title">Insurance write-off status</div>'
    +'<div id="cc-writeoff-badge"><div class="cv-badge cv-pend"><div class="spin" style="width:10px;height:10px;flex-shrink:0"></div>Checking...</div></div>'
    +'<div class="cv-card-desc" id="cc-writeoff-d">Checking Cat A, B, S and N insurance records</div>'
    +'<a href="https://www.carcheck.co.uk/'+regEnc+'" target="_blank" rel="noopener" class="cv-ext-link"><i class="ti ti-external-link" style="font-size:11px"></i>Open on carcheck.co.uk</a>'
    +'</div>';

  /* DVLA export flag */
  html+=card('Export / DVLA status',
    badge(markedExport?'bad':'ok',markedExport?'alert-triangle':'circle-check',markedExport?'Marked for export':'No issues found'),
    markedExport?'This vehicle is marked for export in the DVLA database. It cannot legally be re-used on UK roads without DVLA notification.':'No DVLA flags. Vehicle is not marked for export.',
    null,null,null);

  /* V5C */
  if(v5cDate){html+=card('V5C logbook date',
    badge(v5cAge!==null&&v5cAge<4?'warn':'ok',v5cAge!==null&&v5cAge<4?'alert-circle':'circle-check',v5cAge!==null&&v5cAge<4?'Recently issued — verify':'No issues found'),
    'V5C last issued '+v5cDate.slice(0,10)+(v5cAge!==null?' ('+v5cAge+' months ago).':'.')+(v5cAge!==null&&v5cAge<4?' A recently reissued V5C may indicate a recent keeper change — ask the seller why they are selling so soon.':' Always verify the physical V5C matches the seller\'s name and address.'),
    null,null,null);}

  /* SECTION: DAMAGE */
  html+=sep('Damage');

  html+=card('Damage',
    badge(accScore>=45?'bad':accScore>=15?'warn':'ok',accScore>=45?'alert-triangle':accScore>=15?'alert-circle':'circle-check',accScore>=45?'Issues found':accScore>=15?'Attention':'No issues found'),
    accScore>=45?'Crash damage indicators detected in MOT records. Structural failures, airbag/SRS items or body repair language found. Do not purchase without an independent inspection on a vehicle ramp.':accScore>=15?'Some MOT items suggest possible prior repair work. Have a mechanic check panel gaps, sill seams and the boot floor.':'No damage or assessment records found. No structural failures, airbag warnings or body repair language in the complete MOT defect history.',
    structItems.length>0?'Structural items: '+structItems.slice(0,2).map(function(d){return'"'+d.text.slice(0,55)+'"';}).join(', '):(airbagItems.length>0?'SRS items: '+airbagItems.slice(0,1).map(function(d){return'"'+d.text.slice(0,55)+'"';}).join(', '):null),
    null,null);

  html+=card('Corrosion and rust',
    badge(corrMajor>1?'bad':corrItems.length>0?'warn':'ok',corrMajor>1?'alert-triangle':corrItems.length>0?'alert-circle':'circle-check',corrMajor>1?'Issues found':corrItems.length>0?'Attention':'No issues found'),
    corrMajor>1?'Significant structural corrosion failures recorded. Proper repair is expensive. Price should reflect this or walk away.':corrItems.length>0?'Corrosion noted in MOT records. Inspect sills, wheel arches and floor pan physically before purchase.':'No corrosion or rust records found.',
    null,null,null);

  /* SECTION: THEFT */
  html+=sep('Theft');

  html+=card('Theft records',
    badge('pend','clock','Checking...'),
    'Theft and police records are checked via isitnicked.com and carcheck.co.uk. Results will appear in the Financial status card above once loaded.',
    'If the automated check cannot confirm status, use the carcheck.co.uk link to verify manually — this is a free check.',
    'https://www.carcheck.co.uk/'+regEnc,'Verify on carcheck.co.uk');

  /* SECTION: NATURAL DISASTER / FLOOD */
  html+=sep('Environmental Exposure');

  var age=carYear?2026-carYear:0;
  var floodRisk=corrMajor>0&&age<8?'warn':'ok';
  html+=card('Flood and water damage exposure',
    badge(floodRisk==='warn'?'warn':'ok',floodRisk==='warn'?'alert-circle':'circle-check',floodRisk==='warn'?'Attention — possible water exposure':'No records found'),
    floodRisk==='warn'?'Corrosion in a relatively new vehicle may indicate flood or water damage exposure. Check under carpets and in the boot for waterline marks and unusual rust.':'No records of flood, water or environmental damage found. Check under carpets and seat mounts for hidden waterline marks on older vehicles regardless.',
    null,null,null);

  /* SECTION: MECHANICAL */
  html+=sep('Mechanical Condition');

  html+=card('Recurring failures',
    badge(recurring.length>0?'warn':'ok',recurring.length>0?'alert-circle':'circle-check',recurring.length>0?'Attention':'No issues found'),
    recurring.length>0?'The same component failed the MOT more than once: "'+recurring.slice(0,2).map(function(k){return k.trim().slice(0,45);}).join('", "')+'". This indicates the repair was not carried out or failed. Negotiate on price.':'No recurring failures. Every repaired component has stayed fixed.',
    null,null,null);

  html+=card('Deferred maintenance',
    badge(escalated>0?'warn':'ok',escalated>0?'alert-circle':'circle-check',escalated>0?'Attention':'No issues found'),
    escalated>0?escalated+' advisory item(s) were left unrepaired until they became major or dangerous failures. The previous owner defers maintenance. Ask what advisories are currently outstanding.':'No advisories were left to escalate. Issues have been addressed proactively.',
    null,null,null);

  html+=card('Brake system',
    badge(brakeFails>=2?'bad':brakeFails>=1?'warn':'ok',brakeFails>=2?'alert-triangle':brakeFails>=1?'alert-circle':'circle-check',brakeFails>=2?'Issues found':brakeFails>=1?'Attention':'No issues found'),
    brakeFails>=2?'Repeated brake failures indicate ongoing neglect. Full brake inspection essential before purchase.':brakeFails>=1?'Brake failure recorded. Verify the repair was carried out and check current brake condition.':'No brake system failures recorded.',
    null,null,null);

  html+=card('Engine and emissions',
    badge(emissFails>=2?'bad':emissFails>=1?'warn':'ok',emissFails>=2?'alert-triangle':emissFails>=1?'alert-circle':'circle-check',emissFails>=2?'Issues found':emissFails>=1?'Attention':'No issues found'),
    emissFails>=2?'Repeated emissions failures suggest a DPF, catalytic converter or engine issue. Can cost £500–£2,500 to properly fix.':emissFails>=1?'Emissions failure recorded. Check if DPF or catalytic converter work has been completed since.':'No emission or engine failures recorded.',
    null,null,null);

  html+=card('MOT pass rate',
    badge(passRate>=80?'ok':passRate>=60?'warn':'bad',passRate>=80?'circle-check':passRate>=60?'alert-circle':'alert-triangle',passRate>=80?'No issues found':passRate>=60?'Attention':'Issues found'),
    passRate>=80?passCount+' of '+tests.length+' MOT tests passed ('+passRate+'%). Consistent and well-maintained.':passRate>=60?passCount+' of '+tests.length+' tests passed ('+passRate+'%). Below average. Check what failed and confirm it was repaired properly.':'Only '+passCount+' of '+tests.length+' tests passed ('+passRate+'%). The vehicle regularly fails its MOT. This indicates systematic neglect.',
    null,null,null);

  /* SECTION: IDENTITY */
  html+=sep('Vehicle Identity');

  html+=card('SORN and off-road periods',
    badge(gaps.length>0?'warn':'ok',gaps.length>0?'alert-circle':'circle-check',gaps.length>0?'Attention':'No issues found'),
    gaps.length>0?gaps.length+' unexplained gap(s) in MOT history: '+gaps.map(function(g){return g.months+' months ('+g.from+' to '+g.to+')';}).join(', ')+'. The vehicle may have been SORN, in storage or used off-road. Ask the seller to account for these periods.':'No SORN or off-road gaps. The vehicle has been in continuous annual use.',
    null,null,null);

  html+=card('Registration plate check',
    badge(plateMismatch?'warn':'ok',plateMismatch?'alert-circle':'circle-check',plateMismatch?'Attention':'No issues found'),
    plateMismatch?'The plate year code suggests '+regYear2+' but the DVLA manufacture year is '+carYear+'. This is often a legal cherished plate transfer but always verify via the physical V5C document.':'No plate anomaly. The registration year code is consistent with the DVLA manufacture year.',
    null,null,null);

  /* CHECKLIST */
  html+=sep('Pre-Purchase Checklist');
  var actions=['Run the carcheck.co.uk free check for stolen, finance and write-off confirmation'];
  if(accScore>=15)actions.push('Book a pre-purchase inspection — RAC/AA inspector or independent mechanic (~£100–150)');
  if(structItems.length>0||airbagItems.length>0)actions.push('Ask for the car to go on a ramp — check sills, floor pan and subframe');
  actions.push('Verify the physical V5C is in the seller\'s name — never accept a photocopy');
  actions.push('Check DVSA safety recalls free at gov.uk/check-vehicle-recall');
  if(recurring.length>0)actions.push('Get repair quotes for recurring faults and negotiate price down');
  actions.push('Test drive cold — knocks, warning lights and engine issues hide when warm');

  html+='<div class="cv-card"><div class="cv-card-title">Before you buy</div>'
    +'<ul style="margin:0;padding:0;list-style:none">'+actions.map(function(a){return'<li style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;color:var(--t3)"><i class="ti ti-arrow-right" style="color:var(--blue2);flex-shrink:0;margin-top:2px;font-size:12px"></i>'+esc(a)+'</li>';}).join('')+'</ul></div>';

  html+='</div>'; /* end cv-report */
  el('intelChecks').innerHTML=html;

  /* ── Fire carcheck API ── */
  fetch(VERCEL+'/api/carcheck',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reg:reg})})
    .then(function(r){return r.json();})
    .then(function(d){
      function upd(id,badgeId,descId,isOk,isBad,title,okDesc,unknownDesc,badDesc){
        var crd=el(id);if(!crd)return;
        var b=crd.querySelector('[id$="-badge"]')||document.getElementById(badgeId);
        var desc=crd.querySelector('[id$="-d"]')||document.getElementById(descId);
        if(isOk){
          if(b)b.innerHTML='<div class="cv-badge cv-ok"><i class="ti ti-circle-check"></i>No issues found</div>';
          if(desc)desc.textContent=okDesc;
        }else if(isBad){
          if(b)b.innerHTML='<div class="cv-badge cv-bad"><i class="ti ti-alert-triangle"></i>'+title+'</div>';
          if(desc)desc.textContent=badDesc;
        }else{
          if(b)b.innerHTML='<div class="cv-badge cv-info"><i class="ti ti-info-circle"></i>Verify manually — free check</div>';
          if(desc)desc.textContent=unknownDesc;
        }
      }
      upd('cc-stolen','cc-stolen-badge','cc-stolen-d',
        d.stolen===false,d.stolen===true,'Theft recorded',
        'No theft records found. No stolen marker found in database records.',
        'Automated check inconclusive. Click the link below to verify on carcheck.co.uk — free check.',
        'STOLEN MARKER FOUND — Do not purchase. Contact the police immediately.');
      upd('cc-finance','cc-finance-badge','cc-finance-d',
        d.finance===false,d.finance===true,'Finance outstanding',
        'No financial or legal risk records found. No outstanding finance detected.',
        'Automated check inconclusive. Verify on carcheck.co.uk to confirm no finance is outstanding.',
        'OUTSTANDING FINANCE DETECTED — The finance company legally owns this car. Do not purchase.');
      upd('cc-writeoff','cc-writeoff-badge','cc-writeoff-d',
        d.writeOff==='NONE',d.writeOff&&d.writeOff!=='NONE',d.writeOff||'Write-off recorded',
        'No write-off records found. No insurance loss record for this vehicle.',
        'Automated check inconclusive. Verify write-off status on carcheck.co.uk.',
        'WRITE-OFF RECORDED: '+(d.writeOff||'')+(d.writeOff&&(d.writeOff.indexOf('A')>=0||d.writeOff.indexOf('B')>=0)?' — Cat A/B must be scrapped. This car cannot legally drive.':(d.writeOff?' — Cat S/N can be re-sold but has structural or cosmetic damage history. Get full repair records.':'')));
    })
    .catch(function(){
      ['cc-stolen','cc-finance','cc-writeoff'].forEach(function(id){
        var b=el(id+'_badge')||el(id)&&el(id).querySelector('[id$="-badge"]');
        var crd=el(id);
        if(crd){var badge2=crd.querySelector('[id$="-badge"]');if(badge2)badge2.innerHTML='<div class="cv-badge cv-info"><i class="ti ti-info-circle"></i>Verify manually</div>';var desc2=crd.querySelector('[id$="-d"]');if(desc2)desc2.textContent='Automated check unavailable. Use the carcheck.co.uk link below to check manually.';}
      });
    });
}

function runAiRisk(tests){
  var d=vehicleData,carYear=parseInt(d.yearOfManufacture)||0;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var readings=sorted.map(function(t){return{date:t.completedDate||'',mi:parseInt(t.odometerValue)||0};}).filter(function(r){if(!r.mi)return false;if(carYear){var yr=new Date(r.date).getFullYear();if(yr>0&&yr<carYear)return false;}return true;});
  var drops=[];for(var i=1;i<readings.length;i++){if(readings[i].mi<readings[i-1].mi)drops.push(readings[i-1].mi-readings[i].mi);}
  var lastMi=readings.length?readings[readings.length-1].mi:0,annMi=calcAnnualMi();
  var pass=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  var allDef=[];tests.forEach(function(t){(t.defects||[]).forEach(function(x){allDef.push(x);});});
  var majors=allDef.filter(function(x){return x.type==='MAJOR'||x.type==='DANGEROUS';}).map(function(x){return x.text||'';});
  fetch(VERCEL+'/api/ai-risk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({make:d.make,model:d.model||'',year:d.yearOfManufacture,cc:d.engineCapacity,fuel:d.fuelType,colour:d.colour||d.primaryColour,taxStatus:d.taxStatus,motStatus:d.motStatus,passRate:tests.length?Math.round(pass/tests.length*100):100,totalTests:tests.length,lastMileage:lastMi,annualMileage:annMi,fraudDrops:drops,majorFailures:majors.slice(0,5)})})
    .then(function(r){return r.json();}).then(function(resp){if(resp.error)renderAiRiskFallback(drops,tests.length?Math.round(pass/tests.length*100):100,annMi,majors);else renderAiRisk(resp);}).catch(function(){renderAiRiskFallback(drops,100,0,[]);});
}
function renderAiRisk(r){
  var vc=r.overallVerdict||'UNKNOWN';
  el('aiRiskChip').textContent=vc;el('aiRiskChip').className='chip '+(vc==='CLEAN'?'chip-gr':vc==='HIGH RISK'?'chip-r':'chip-g');
  var html=(r.keyFindings||[]).map(function(f){return'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11px;color:var(--t2)"><i class="ti ti-point-filled" style="color:var(--blue);font-size:8px;flex-shrink:0"></i>'+esc(f)+'</div>';}).join('');
  [{l:'Stolen Risk',v:r.stolenRisk||'—',n:r.stolenNote||'',c:r.stolenRisk==='Low'?'gr':'g'},{l:'Finance / Write-Off',v:'Cannot verify',n:'HPI check required',c:'g'},{l:'Clone / Plate',v:r.cloneRisk||'—',n:r.cloneNote||'',c:r.cloneRisk==='Low'?'gr':'g'},{l:'Mileage',v:r.mileageVerdict||'—',n:'',c:r.mileageVerdict==='Consistent'?'gr':r.mileageVerdict==='Fraudulent'?'r':'g'}].forEach(function(row){html+='<div class="hrow"><div class="hic hi-'+row.c+'"><i class="ti ti-'+(row.c==='gr'?'check':'alert-circle')+'"></i></div><div style="flex:1"><div class="hrow-t">'+esc(row.l)+'</div>'+(row.n?'<div class="hrow-d">'+esc(row.n)+'</div>':'')+'</div><div><div class="chip chip-'+row.c+'">'+esc(row.v)+'</div></div></div>';});
  if(r.buyerAdvice)html+='<div class="verdict"><strong>Advice:</strong> '+esc(r.buyerAdvice)+'</div>';
  html+='<div class="info-box" style="margin-top:7px"><i class="ti ti-info-circle"></i> <strong>Always run an HPI check</strong> before purchasing.</div>';
  el('aiRiskContent').innerHTML=html;
}
function renderAiRiskFallback(drops,passRate,annMi,majors){
  var vc=drops.length||passRate<60?'SUSPICIOUS':'CLEAN';
  el('aiRiskChip').textContent=vc;el('aiRiskChip').className='chip '+(vc==='CLEAN'?'chip-gr':'chip-g');
  var findings=[];
  if(drops.length)findings.push('Mileage rollback detected — '+drops.length+' drop(s)');
  if(passRate<60)findings.push('Below-average MOT pass rate ('+passRate+'%)');
  if(annMi>20000)findings.push('High annual mileage — possible commercial use');
  if(majors.length)findings.push(majors.length+' major/dangerous failure(s) on record');
  if(!findings.length)findings.push('No major red flags from DVLA/DVSA data');
  var html=findings.map(function(f){return'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11px;color:var(--t2)"><i class="ti ti-point-filled" style="color:var(--blue);font-size:8px;flex-shrink:0"></i>'+esc(f)+'</div>';}).join('');
  html+='<div class="hrow" style="margin-top:9px"><div class="hic hi-g"><i class="ti ti-coins"></i></div><div style="flex:1"><div class="hrow-t">Finance & Theft</div><div class="hrow-d">Cannot verify from DVLA/DVSA. HPI check required.</div></div><div><a href="https://www.hpicheck.com" target="_blank"><div class="chip chip-g">HPI →</div></a></div></div>';
  html+='<div class="info-box" style="margin-top:7px"><i class="ti ti-info-circle"></i> <strong>Always run an HPI check</strong> before purchasing.</div>';
  el('aiRiskContent').innerHTML=html;
}

function lookupVin(vin){
  var decoded=decodeVin(vin);
  if(!decoded){toast('Invalid VIN — must be 17 characters','err');return;}
  SEARCH_MODE='vin';currentReg=vin;
  el('mainApp').classList.remove('hidden');el('errbox').classList.add('hidden');
  var hs=el('heroSection');if(hs)hs.classList.add('searched');
  if(el('tabsWrap'))el('tabsWrap').classList.remove('hidden');
  switchMainTab('overview');
  if(el('vehReg'))el('vehReg').textContent=vin.slice(0,3)+' ··· '+vin.slice(14);
  if(el('vehHeader'))el('vehHeader').classList.add('visible');
  if(el('vehTaxBadge')){el('vehTaxBadge').textContent='VIN';el('vehTaxBadge').className='veh-status-badge vsb-taxed';}
  if(el('vehChips'))el('vehChips').innerHTML='<span class="veh-chip">'+decoded.flag+' '+esc(decoded.country)+'</span>'+(decoded.year?'<span class="veh-chip-div">·</span><span class="veh-chip"><i class="ti ti-calendar"></i>'+decoded.year+'</span>':'');
  if(el('vehName'))el('vehName').textContent='VIN Decoded — '+decoded.country;
  if(el('vehLogo'))el('vehLogo').textContent=decoded.flag;
  if(el('motHistory'))el('motHistory').innerHTML='<div class="info-box" style="margin:0"><i class="ti ti-info-circle"></i> <strong>No UK MOT records</strong> — MOT history is only available for UK-registered vehicles.</div>';
  if(el('motSumWrap'))el('motSumWrap').classList.add('hidden');
  var ov=el('tab-overview');
  var vinCard='<div class="vin-card"><div class="vin-header"><div class="vin-flag">'+decoded.flag+'</div><div><div class="vin-title">'+esc(decoded.country)+'</div><div class="vin-country">WMI: '+esc(decoded.wmi)+'</div></div></div>'
    +'<div class="vin-num">'+vin+'</div>'
    +'<div class="vin-grid"><div class="vin-box"><div class="vin-box-lbl">Country</div><div class="vin-box-val">'+decoded.flag+' '+esc(decoded.country)+'</div></div><div class="vin-box"><div class="vin-box-lbl">Model Year</div><div class="vin-box-val">'+(decoded.year||'—')+'</div></div><div class="vin-box"><div class="vin-box-lbl">Check Digit</div><div class="vin-box-val"><span class="'+(decoded.checkValid?'vin-check-ok':'vin-check-fail')+'">'+(decoded.checkValid?'✓ Valid':'✗ Invalid')+'</span></div></div></div>'
    +'<div class="vin-detail-row"><span class="vin-detail-lbl">WMI</span><span class="vin-detail-val">'+esc(decoded.wmi)+'</span></div><div class="vin-detail-row"><span class="vin-detail-lbl">VDS</span><span class="vin-detail-val">'+esc(decoded.vds)+'</span></div><div class="vin-detail-row"><span class="vin-detail-lbl">Plant</span><span class="vin-detail-val">'+esc(decoded.plant)+'</span></div><div class="vin-detail-row"><span class="vin-detail-lbl">Serial</span><span class="vin-detail-val">'+esc(decoded.serial)+'</span></div></div>';
  if(ov){var existing=ov.querySelector('.vin-card');if(existing)existing.remove();ov.insertAdjacentHTML('afterbegin',vinCard);}
  fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/'+vin+'?format=json').then(function(r){return r.json();}).then(function(data){
    var vals={};(data.Results||[]).forEach(function(item){if(item.Value&&item.Value!=='Not Applicable')vals[item.Variable]=item.Value;});
    var make2=vals['Make']||'',model2=vals['Model']||'',trim=vals['Trim']||'',body=vals['Body Class']||'',cyls=vals['Engine Number of Cylinders']||'',dispL=vals['Displacement (L)']||'',dispCC=vals['Displacement (CC)']||'',fuel2=vals['Fuel Type - Primary']||'',doors=vals['Number of Doors']||'',drive=vals['Drive Type']||'',trans=vals['Transmission Style']||'',transSp=vals['Transmission Speeds']||'',country2=vals['Plant Country']||'';
    if(make2&&el('vehName'))el('vehName').textContent=make2+(model2?' '+model2:'')+(trim?' '+trim:'');
    if(make2&&el('vehLogo'))el('vehLogo').textContent=getBrandLogo(make2);
    var cc=dispCC?parseInt(dispCC):dispL?Math.round(parseFloat(dispL)*1000):1600;
    var f2=(fuel2||'').toUpperCase(),isEL=f2.indexOf('ELECTRIC')>=0;
    var bhp=isEL?204:cc<=999?95:cc<=1399?128:cc<=1599?138:cc<=1999?163:cc<=2999?298:375;
    var tq=Math.round(bhp*1.55),z62=isEL?7.5:cc<=1399?10:cc<=1999?8.5:cc<=2999?6.5:5.2,top=isEL?120:cc<=1399?120:cc<=1999?136:150;
    var gearbox=trans&&transSp?transSp+'-speed '+(trans.toLowerCase().indexOf('auto')>=0?'Auto':'Manual'):isEL?'Single-speed Auto':'6-speed Manual';
    if(el('scBhp'))el('scBhp').textContent=bhp;if(el('scTq'))el('scTq').textContent=tq;
    if(el('scZero'))el('scZero').textContent=z62;if(el('scTop'))el('scTop').textContent=top;
    if(el('scGearbox'))el('scGearbox').textContent=gearbox;if(el('scMpg'))el('scMpg').textContent=isEL?'EV':(Math.max(22,65-Math.round(cc/80)));
    if(el('specCyl'))el('specCyl').textContent=(cyls?parseInt(cyls):Math.round(cc/400))+' cylinders';
    if(el('specDrive'))el('specDrive').textContent=drive||'—';
    if(el('specsStatus')){el('specsStatus').textContent='From VIN';el('specsStatus').className='chip chip-gr';}
    var extra='';
    if(make2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Make</span><span class="vin-detail-val">'+esc(make2)+'</span></div>';
    if(model2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Model</span><span class="vin-detail-val">'+esc(model2)+(trim?' · '+esc(trim):'')+'</span></div>';
    if(body)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Body</span><span class="vin-detail-val">'+esc(body)+'</span></div>';
    if(cc)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Engine</span><span class="vin-detail-val">'+cc+'cc'+(cyls?' · '+cyls+' cyl':'')+'</span></div>';
    if(fuel2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Fuel</span><span class="vin-detail-val">'+esc(fuel2)+'</span></div>';
    if(doors)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Doors</span><span class="vin-detail-val">'+esc(doors)+'</span></div>';
    if(country2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Assembly</span><span class="vin-detail-val">'+esc(country2)+'</span></div>';
    extra+='<div class="info-box" style="margin-top:10px"><i class="ti ti-info-circle"></i> Specs estimated from displacement.</div>';
    var card=ov&&ov.querySelector('.vin-card');if(card&&extra)card.insertAdjacentHTML('beforeend',extra);
  }).catch(function(){if(el('specsStatus')){el('specsStatus').textContent='Estimated';el('specsStatus').className='chip chip-g';}});
}

function selectMod(btn){
  var mod=btn.dataset.mod;
  if(selectedMods.has(mod)){selectedMods.delete(mod);btn.classList.remove('selected');}else{selectedMods.add(mod);btn.classList.add('selected');}
  var n=selectedMods.size,ab=el('analyzeBtn');
  if(n===0){ab.disabled=true;ab.innerHTML='<i class="ti ti-sparkles"></i> Select a mod to analyse';}
  else if(n===1){ab.disabled=false;ab.innerHTML='<i class="ti ti-sparkles"></i> Analyse: '+Array.from(selectedMods)[0];}
  else{ab.disabled=false;ab.innerHTML='<i class="ti ti-sparkles"></i> Analyse '+n+' mods';}
}
function analyseMod(){
  if(!selectedMods.size)return;
  var btn=el('analyzeBtn'),mods=Array.from(selectedMods),n=mods.length;
  btn.disabled=true;btn.innerHTML='<div class="spin" style="margin-right:7px"></div> Analysing...';
  var make=vehicleData.make||'Unknown',model=vehicleData.model||'',year=vehicleData.yearOfManufacture||2018,cc=parseInt(vehicleData.engineCapacity)||1600,hp=vehicleData.hp||130,torque=vehicleData.torque||200,value=vehicleData.value||8000,fuel=(vehicleData.fuelType||'PETROL').toUpperCase();
  function resetBtn(){btn.disabled=false;btn.innerHTML='<i class="ti ti-sparkles"></i> Analyse '+n+' mod'+(n>1?'s':'');}
  function safeResult(d,modName){return{mod:modName,hpGain:parseInt(d.hpGain)||0,torqueGain:parseInt(d.torqueGain)||0,newHp:parseInt(d.newHp)||hp,newTorque:parseInt(d.newTorque)||torque,newValue:parseInt(d.newValue)||value,soundRating:Math.max(1,Math.min(10,parseInt(d.soundRating)||5)),soundDesc:d.soundDesc||'—',valueChange:d.valueChange||'—',valueChangeDirection:d.valueChangeDirection||'neutral',installCost:d.installCost||'—',insuranceImpact:d.insuranceImpact||'Declare to insurer',motRisk:d.motRisk||'Medium',motNote:d.motNote||'—',failureRisk:d.failureRisk||'Medium',verdict:d.verdict||'Consult a specialist.'};}
  Promise.all(mods.map(function(mod){return fetch(VERCEL+'/api/mod',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mod:mod,make:make,model:model,year:year,cc:cc,hp:hp,torque:torque,value:value,fuel:fuel})}).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(d){return safeResult(d.error?{hpGain:15,torqueGain:20,newHp:hp+15,newTorque:torque+20,newValue:value+200,soundRating:5,soundDesc:'Varies',valueChange:'Varies',installCost:'Contact specialist',insuranceImpact:'Declare to insurer',motRisk:'Low',motNote:'Depends on mod',failureRisk:'Low',verdict:'Contact a specialist for this mod on your vehicle.'}:d,mod);}).catch(function(){return safeResult({hpGain:0,torqueGain:0,newHp:hp,newTorque:torque,newValue:value,soundRating:1,soundDesc:'No change',valueChange:'—',installCost:'—',insuranceImpact:'Declare to insurer',motRisk:'Low',motNote:'—',failureRisk:'Low',verdict:'Consult a specialist.'},mod);});})).then(function(results){n>1?renderMultiResult(results,hp,torque,value):renderResult(results[0]);resetBtn();});
}
function renderResult(r){
  var rating=parseInt(r.soundRating)||5,bars='';
  for(var i=0;i<8;i++)bars+='<div class="sb" style="height:'+(i<rating?Math.round(10+Math.random()*14):3)+'px;opacity:'+(i<rating?1:.1)+'"></div>';
  var mc=r.motRisk==='Low'?'var(--green3)':r.motRisk==='Medium'?'var(--amber)':'var(--red3)';
  var hn=parseInt(r.hpGain)||0,tn=parseInt(r.torqueGain)||0,dir=r.valueChangeDirection||(String(r.valueChange||'').indexOf('-')===0?'down':'neutral');
  el('resultSection').innerHTML='<div class="res-card"><div class="res-title"><span>'+esc((r.mod||'').toUpperCase())+'</span><div class="sbar">'+bars+'</div></div>'
    +'<div class="drow"><span class="dlbl">Power</span><span class="dval">'+(hn?r.newHp+' BHP':'No change')+' <span class="chg '+(hn>0?'cup':'cnt')+'">'+(hn?(hn>0?'+':'')+hn+' BHP':'—')+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Torque</span><span class="dval">'+(tn?r.newTorque+' Nm':'No change')+' <span class="chg '+(tn>0?'cup':'cnt')+'">'+(tn?(tn>0?'+':'')+tn+' Nm':'—')+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Sound</span><span class="dval">'+rating+'/10 — '+esc(r.soundDesc)+'</span></div>'
    +'<div class="drow"><span class="dlbl">Retail Value</span><span class="dval">£'+esc(String(r.newValue))+' <span class="chg '+(dir==='up'?'cup':'cnt')+'">'+esc(r.valueChange)+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Install Cost</span><span class="dval">'+esc(r.installCost)+'</span></div>'
    +'<div class="drow"><span class="dlbl">Insurance</span><span class="dval" style="font-size:11px;max-width:55%;text-align:right">'+esc(r.insuranceImpact)+'</span></div>'
    +'<div class="drow"><span class="dlbl">MOT Risk</span><span class="dval"><span style="color:'+mc+';font-weight:700">'+esc(r.motRisk)+'</span></span></div>'
    +'<div class="verdict"><strong>Verdict:</strong> '+esc(r.verdict)+'</div>'
    +'<button class="share-btn" onclick="shareResult()"><i class="ti ti-share" style="margin-right:5px"></i>Share</button></div>';
  el('resultSection').classList.remove('hidden');el('resultSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderMultiResult(results,baseHp,baseTq,baseVal){
  var totalHp=results.reduce(function(s,r){return s+(parseInt(r.hpGain)||0);},0),totalTq=results.reduce(function(s,r){return s+(parseInt(r.torqueGain)||0);},0);
  var highestRisk=results.some(function(r){return r.motRisk==='High';})?'High':results.some(function(r){return r.motRisk==='Medium';})?'Medium':'Low';
  var modCards=results.map(function(r){var hg=parseInt(r.hpGain)||0;return'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:10px 12px;margin-bottom:7px"><div style="font-family:Syne,sans-serif;font-size:12px;font-weight:800;color:var(--t1);margin-bottom:7px">'+esc(r.mod)+'</div><div class="drow"><span class="dlbl">HP gain</span><span class="dval">'+(hg?'+'+hg+' BHP':'None')+'</span></div><div class="drow"><span class="dlbl">Cost</span><span class="dval">'+esc(r.installCost||'—')+'</span></div><div style="font-size:10px;color:var(--t3);line-height:1.5;margin-top:7px;padding-top:7px;border-top:1px solid var(--border)">'+esc(r.verdict)+'</div></div>';}).join('');
  el('resultSection').innerHTML='<div class="res-card"><div class="res-title"><span>'+results.length+' MODS COMBINED</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:14px"><div class="mot-sb"><div class="mot-sn" style="color:var(--green3);font-size:22px">+'+(totalHp||0)+'</div><div class="mot-sl">Total BHP</div></div><div class="mot-sb"><div class="mot-sn" style="color:var(--blue2);font-size:22px">+'+(totalTq||0)+'</div><div class="mot-sl">Total Nm</div></div><div class="mot-sb"><div class="mot-sn" style="color:var(--amber);font-size:14px">'+highestRisk+' Risk</div><div class="mot-sl">MOT</div></div></div>'
    +modCards+'<button class="share-btn" onclick="shareResult()"><i class="ti ti-share" style="margin-right:5px"></i>Share Build</button></div>';
  el('resultSection').classList.remove('hidden');el('resultSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function shareResult(){
  var text='GarageIQ — '+(vehicleData.make||'')+' '+(vehicleData.model||'')+'\nMods: '+Array.from(selectedMods).join(', ')+'\nwww.garageiq.org.uk';
  if(navigator.share)navigator.share({title:'GarageIQ Build',text:text,url:'https://www.garageiq.org.uk'});
  else navigator.clipboard.writeText(text).then(function(){toast('Copied!','ok',2000);});
}

function startPayment(){
  if(!currentUser){openAuth('login');return;}
  var btn=el('btnPay');btn.disabled=true;btn.innerHTML='<div class="spin" style="margin-right:7px"></div> Loading...';
  fetch(VERCEL+'/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reg:currentReg,userId:currentUser.id})})
    .then(function(r){return r.json();}).then(function(d){if(d.url)window.location.href=d.url;else{btn.disabled=false;btn.innerHTML='<i class="ti ti-lock-open"></i> Unlock for £1.99';toast('Payment error: '+(d.error||'Unknown'),'err');}})
    .catch(function(e){btn.disabled=false;btn.innerHTML='<i class="ti ti-lock-open"></i> Unlock for £1.99';toast('Payment error','err');});
}

function toast(msg,type,dur){
  var wrap=el('toastWrap');if(!wrap)return;
  var t=document.createElement('div');t.className='toast'+(type?' '+type:'');
  var icon=type==='ok'?'ti-check':type==='err'?'ti-alert-circle':'ti-info-circle';
  t.innerHTML='<i class="ti '+icon+'" style="font-size:14px;flex-shrink:0"></i>'+esc(msg);
  wrap.appendChild(t);
  setTimeout(function(){t.style.animation='toastOut .3s ease forwards';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},300);},(dur||3000));
}

(function(){
  if(!window.IntersectionObserver)return;
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});},{threshold:.1});
  function observe(){qsa('.reveal').forEach(function(el){obs.observe(el);});}
  observe();
  document.addEventListener('click',function(e){if(e.target.closest('.pill-tab'))setTimeout(observe,100);});
})();

document.addEventListener('keydown',function(e){
  if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();var r=el('regInput');if(r){r.focus();r.select();}}
});
