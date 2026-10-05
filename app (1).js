const f=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const PR={1:'Locked',2:'High',3:'Recommended',4:'Optional'};
const ICON={start:'🚗',food:'🍴',attr:'🏞',charge:'⚡',hotel:'🏨',cafe:'☕'};
const S0=()=>[
{id:1,t:'start',n:'Depart Delhi',p:1,pp:1,dur:0,min:0,leg:0,at:480,why:'Your chosen start time, 82% battery'},
{id:2,t:'food',n:'Highway Haveli (breakfast)',p:3,pp:3,dur:45,min:45,leg:120,open:[360,1380],km:112,cost:'₹650',fac:'Vegetarian · family restroom · parking',rs:'Not checked',why:'Pure veg, baby-changing, 112 km in – good first rest after 2 h'},
{id:3,t:'attr',n:'Amer Heritage Walk',p:2,pp:2,dur:90,min:45,leg:15,open:[540,1020],km:8,cost:'₹200',fac:'Parking · restroom · wheelchair ramp',rs:'Requires external booking',why:'Top-rated, matches your interest in forts; closes 17:00'},
{id:4,t:'food',n:'Rajputana Thali House (lunch)',p:2,pp:2,dur:60,min:45,leg:30,open:[690,1350],km:14,cost:'₹900',fac:'Vegetarian · Jain options · parking',rs:'Available',res:{at:780},why:'Jain-friendly, table held for 13:00'},
{id:5,t:'charge',n:'VoltHub Fast Charge (150 kW DC)',p:2,pp:2,dur:40,min:30,leg:0,open:[0,1440],km:0,cost:'₹480',fac:'CCS2 · café · restroom',rs:'Limited availability',why:'Next charger after this is 110 km away – needed to reach hotel'},
{id:6,t:'attr',n:'Sunset Ridge Viewpoint',p:4,pp:4,dur:90,min:30,leg:20,open:[0,1140],km:20,cost:'Free',fac:'Parking',rs:'Not checked',why:'Nice-to-have; first to go if time is short'},
{id:7,t:'hotel',n:'Pink City Business Hotel',p:1,pp:2,dur:0,min:0,leg:90,dead:1090,km:82,cost:'₹5,400',fac:'Parking · EV charging · Wi-Fi · restaurant',rs:'Available',res:{at:1080},why:'Locked: check-in window closes 18:10'}];
const POIS={
 cafe:{
  t:'cafe',n:'Roadside Café Stop',p:4,pp:4,dur:20,min:10,leg:15,km:6,cost:'₹250',fac:'Restroom · Wi-Fi',rs:'Not checked',why:'Quick coffee break'},attr:{t:'attr',n:'Step-well Photo Stop',p:4,pp:4,dur:30,min:15,leg:10,km:5,cost:'Free',fac:'Parking',rs:'Not checked',why:'Short scenic stop'},
 fuel:{
  t:'cafe',n:'Clean-Restroom Rest Plaza',p:3,pp:3,dur:15,min:10,leg:10,km:4,cost:'Free',fac:'Family restroom · pharmacy · ATM',rs:'Not checked',why:'Family restroom + pharmacy'}
};
const st={
 v:'home',base:S0(),removed:[],delay:0,mode:'full',pending:null,explain:'',old:null,notes:[{
  t:'Plan created. All stops fit; status: on schedule.',c:'g'},{t:'Heavy rain expected between Jaipur and Ajmer in ~45 min – Sunset Ridge Viewpoint (outdoor) may be affected.',c:'y'}],feas:null,nid:20,
 food:new Set(['Vegetarian','Jain']),fac:new Set(['Family restroom','EV charging']),np:{traffic:1,weather:1,res:1,batt:1}};
const RANGE=400,SOC0=82;
// ---------- engine ----------
function sched(L,delay){let c=0,soc=SOC0;return L.map((s,i)=>{const arr=i?c+s.leg+(i==1?delay:0):s.at;soc-=s.leg*.25;
                                                              const bat=Math.round(soc);if(s.t=='charge')soc=Math.max(soc,80);c=arr+s.dur;return{...s,arr,dep:c,bat}})}
function risks(sc){
 const r=[];sc.forEach(s=>{if(s.res&&s.arr>s.res.at+15)r.push(`Reservation at ${s.n} is at risk – ETA ${f(s.arr)} vs table ${f(s.res.at)}.`);
 if(s.dead&&s.arr>s.dead)r.push(`${s.n}: arrival ${f(s.arr)} is after the ${f(s.dead)} check-in window.`);
 if(s.open&&s.arr>s.open[1])r.push(`${s.n} closes at ${f(s.open[1])}; ETA ${f(s.arr)}.`);
 if(s.bat<10)r.push(`Battery may drop to ${s.bat}% before reaching ${s.n}.`)});
 return r
}
function drop(L,id){const i=L.findIndex(s=>s.id==id);if(i<L.length-1)L[i+1].leg=Math.round((L[i].leg+L[i+1].leg)*.9);L.splice(i,1)}
function replan(base,delay){
 let L=base.map(s=>({...s,res:s.res?{...s.res}:null})),rm=[],sc=sched(L,delay);
 for(let k=0;k<9;k++){
  const bad=sc.find(s=>s.res&&s.arr>s.res.at+15);
  if(!bad)break; 
  // protect reservations: shorten earlier flexible stops
  const c=sc.slice(0,sc.indexOf(bad)).filter(s=>s.p>1&&s.dur>s.min).sort((a,b)=>b.p-a.p)[0];if(!c)
   break;
  const x=L.find(s=>s.id==c.id);x.dur-=Math.min(x.dur-x.min,bad.arr-bad.res.at-15);sc=sched(L,delay)
 }
 for(let k=0;k<12;k++){
  const l=sc[sc.length-1];if(!(l.dead&&l.arr>l.dead))
   break; 
  // protect arrival window: optional first, then shorten
  const o=sc.filter(s=>s.p==4).pop();
  if(o){
   rm.push(o);drop(L,o.id)
  }else{
   const c=sc.filter(s=>s.p>1&&s.dur>s.min).sort((a,b)=>b.p-a.p)[0];if(!c)
    break;
   const x=L.find(s=>s.id==c.id);x.dur-=Math.min(x.dur-x.min,l.arr-l.dead)
  }
  sc=sched(L,delay)
 }
 sc.filter(s=>s.open&&s.p>=3&&s.arr>s.open[1]).forEach(s=>{rm.push(s);
 drop(L,s.id)});
 sc=sched(L,delay); 
 // closed + low priority -> drop. Locked (p1) never touched.
 return{L:sc,rm}}
function explain(base,r,delay){
 const o=sched(base,0),p=[];
 r.rm.forEach(s=>p.push(`${s.p==4?'the optional ':''}${s.n} has been removed`));
 r.L.forEach(s=>{const a=o.find(x=>x.id==s.id);if(!a||s.t=='start')return;if(s.dur<a.dur)p.push(`${s.n} shortened by ${a.dur-s.dur} min`);else if(s.t!='hotel'&&Math.abs(s.arr-a.arr)>=5)p.push(`${s.t=='charge'?'the charging stop':s.n} moved from ${f(a.arr)} to ${f(s.arr)}`)});
 return p.length?`Traffic has added ${delay} min. To keep your hotel arrival within the planned window, ${p.join('; ')}.`:`Traffic has added ${delay} min. All stops still fit – only times shifted.`}
const changed=(b,r)=>r.rm.length||r.L.some(s=>(b.find(x=>x.id==s.id)||{}).dur!==s.dur);
function note(t,c){
 st.notes.unshift({t,c:c||'y'});
 st.notes=st.notes.slice(0,8)}
function apply(r){
 st.old=sched(st.base,0);
 st.removed.push(...r.rm);
 st.base=r.L.map(({arr,dep,bat,...s})=>s);
 st.pending=null;
 note('Your itinerary has been automatically adjusted.','g')}
function recompute(){
 const r=replan(st.base,st.delay);
 st.pending=null;
 if(!st.delay||!changed(st.base,r))
  
  return;
 const text=explain(st.base,r,st.delay);
 const auto=st.mode=='full'||(st.mode=='smart'&&!r.rm.length);
 if(auto){
  st.explain=text;apply(r)
 }else if(st.mode!='manual')st.pending={r,text}}
function delayBy(m){
 st.delay+=m;note(`Traffic ahead has added ${m} minutes to your journey.`,'r');recompute();render()}
function feasibility(d){
 const km={'delhi-jaipur':280,'delhi-udaipur':660,'delhi-agra':230,'jaipur-udaipur':395,'delhi-manali':540,'mumbai-pune':150};
 const k=[d.from,d.to].map(x=>x.trim().toLowerCase()).join('-');let dist=km[k]||km[k.split('-').reverse().join('-')]||330+([...k].reduce((a,c)=>a+c.charCodeAt(0),0)%420);if(d.rt)dist*=2;
 const kids=+d.ch+ +d.inf,drive=dist/62,rest=Math.ceil(drive/2)*(kids?22:12)/60,ev=d.fuel=='EV';
 const usable=d.range*d.soc/100*.85,stops=Math.max(0,Math.ceil((dist-usable)/(d.range*.7))),stopMin=stops*(ev?35:10),total=drive+rest+stopMin/60;
 const win=(new Date(d.end)-new Date(d.start))/36e5,why=[],alt=[];let lvl=0;
 why.push(`${dist} km, about ${drive.toFixed(1)} h of driving at a traffic-adjusted 62 km/h, plus ${(rest*60).toFixed(0)} min of rest${kids?' (longer breaks for children)':''}.`);
 why.push(stops?`${ev?'Charging':'Fuel'}: you start with ~${Math.round(usable)} km usable, so ${stops} ${ev?'charging':'fuel'} stop(s) of ~${ev?35:10} min are required.`:`${ev?'Charge':'Fuel'} covers the whole distance with a 15% reserve.`);
 if(!(win>0)){
  lvl=2;why.push('End time must be after start time.')
 }
 else if(total>win){
  lvl=2;why.push(`Needed ${total.toFixed(1)} h but only ${win.toFixed(1)} h are available.`);
  alt.push(`Move the end time later by ${Math.ceil(total-win+1)} h`,'Split into two days with an overnight stay near the midpoint')
 }
 else if(total>win*.8||drive>9){
  lvl=Math.max(lvl,1);
  why.push(`Tight: ${total.toFixed(1)} h of ${win.toFixed(1)} h used.`);
 }
 if(drive>8){
  lvl=Math.max(lvl,1);
  why.push('Driver fatigue: more than 8 h at the wheel in a day – an overnight stop is advised.');alt.push('Add an overnight hotel stop')
 }
 why.push('Weather: heavy rain expected on one segment (demo data) – adds ~15 min.');if(d.start.slice(11,13)<'07')why.push('Early-morning departure: fewer restaurants open before 07:00.');
 return{lvl,why,alt,dist,drive,stops}}
// ---------- views ----------
const V={};
V.home=()=>`<section class="card" style="padding:28px"><h1>Your road trip. Planned. Checked. Replanned.</h1><p style="font-size:19px;max-width:620px">Plan every stop, monitor the road, and let your itinerary adapt when real life changes the journey.</p>
<div class="row">
<button class="btn" data-go="plan">Plan my trip</button>
<button class="btn alt" data-go="app">Get the app</button>
<button class="btn alt" data-go="trip">See live replanning</button>
</div>
</section>
<div class="grid g2"><div class="card">
<h2>Live preview – Delhi → Jaipur</h2>
${mini()}
<button class="btn warn sm" data-delay="40">Simulate +40 min traffic</button> <button class="btn alt sm" data-a="reset">Reset</button>
<p class="mut">${st.explain||'Click the button: Waypoint removes the optional stop, shortens one, and moves the charger – locked stops never change.'}</p>
</div>
<div class="grid">${[['🌦','Weather by segment','Rain, wind and heat checked along the whole route, not just the destination.'],['🚦','Traffic-aware','Delays over 15 min recalculate the route; over 30 min re-score every stop.'],['⚡','Fuel & EV safe','Never plans a leg that leaves you without charge or fuel.'],['🍽','Honest reservations','Available, limited, unavailable or external – never faked.'],['🛟','Roadside help','One-tap SOS, towing, flat tyre, fuel delivery.']].map(x=>`<div class="card" style="margin:0"><h3>${x[0]} ${x[1]}</h3><span class="mut">${x[2]}</span></div>`).join('')}</div></div>${appCard()}`;
const mini=()=>sched(st.base,st.delay).map(s=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0"><span>${ICON[s.t]} ${s.n}</span><b>${f(s.arr)}</b></div>`).join('')+(st.removed.length?`<p class="mut">Removed: ${st.removed.map(s=>s.n).join(', ')}</p>`:'');
const appCard=()=>`<div class="card" id="app-dl">
<h2>Continue on your phone</h2>
<p class="mut">Same account, same trip. Plan on the web, drive with the app – trips, preferences, reservations, saved places, vehicles and live status sync.</p>
<div class="row">
<a class="btn" href="https://apps.apple.com/app/waypoint/idPLACEHOLDER" target="_blank" rel="noopener">Download for iOS</a>
<button class="btn" data-a="install">Install on Android</button>
<a class="btn alt" href="https://play.google.com/store/apps/details?id=com.waypoint.app" target="_blank" rel="noopener">Google Play (placeholder)</a>
</div>
<p class="mut">Store links and deep links (waypoint://trip/DEMO-1) are placeholders until the apps are published.</p>
</div>`;
const chips=(set,arr,k)=>arr.map(x=>`<button class="pill ${set.has(x)?'on':''}" data-chip="${k}|${x}" aria-pressed="${set.has(x)}">${x}</button>`).join('');
V.plan=()=>{
 const o=st.feas;return `<h1 style="font-size:36px">Plan a trip</h1><div class="grid g2"><div class="card"><datalist id="cities">${['Delhi','Jaipur','Udaipur','Agra','Ajmer','Manali','Mumbai','Pune'].map(c=>`<option>${c}`).join('')}</datalist>
<div class="grid g3">
<div>
<label>From</label>
<input id="from" list="cities" value="Delhi">
</div>
<div>
<label>To</label><input id="to" list="cities" value="Jaipur">
</div>
<div>
<label>Trip type</label>
<select id="rt"><option value="">One-way</option><option value="1">Round trip</option></select>
</div>
<div>
<label>Start</label>
<input id="start" type="datetime-local" value="2026-10-12T08:00">
</div>
<div>
<label>End</label>
<input id="end" type="datetime-local" value="2026-10-12T20:00">
</div>
<div>
<label>Fuel type</label>
<select id="fuel"><option>EV</option><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>CNG</option></select>
</div>
<div>
<label>Range / efficiency (km on full tank/charge)</label><input id="range" type="number" value="400"></div><div><label>Current charge / fuel %</label><input id="soc" type="number" value="82"></div><div><label>Vehicle model</label><input id="veh" value="Tata Nexon EV">
</div>
<div>
<label>Adults</label><input id="ad" type="number" value="2" min="1">
</div>
<div>
<label>Children</label><input id="ch" type="number" value="1" min="0">
</div>
<div>
<label>Infants</label><input id="inf" type="number" value="0" min="0">
</div>
<div>
<label>Trip purpose</label><select id="purp"><option>Family</option><option>Friends</option><option>Business</option><option>Solo</option></select>
</div>
</div>
<h3 style="margin:14px 0 6px">Food</h3>${chips(st.food,['Vegetarian','Vegan','Jain','Halal','Non-vegetarian','Gluten-free'],'food')}
<h3 style="margin:8px 0 6px">Facilities</h3>${chips(st.fac,['Clean restroom','Family restroom','Baby changing','Parking','Wi-Fi','Café','Pharmacy','ATM','Pet friendly','Wheelchair access','EV charging','Fuel station','Repair/garage'],'fac')}
<br><button class="btn" data-a="feas">Check feasibility</button>
</div>
<div>${o?`<div class="card"><h2>${['🟢 Feasible','🟡 Feasible with adjustments','🔴 Not feasible under current constraints'][o.lvl]}</h2><ul>${o.why.map(w=>`<li>${w}</li>`).join('')}</ul>${o.alt.length?`<b>Alternatives</b><ul>${o.alt.map(w=>`<li>${w}</li>`).join('')}</ul>`:''}<button class="btn" data-go="trip">Build itinerary (demo)</button></div>`:'<div class="card mut">Fill in the details and run the feasibility check. Your food and facility choices personalise the stops.</div>'}</div></div>`};
function weatherCard(){
 return `<div class="card"><h3>Weather by segment</h3>${[['Delhi → Jaipur','☀️ 28°C, clear','g'],['Jaipur → Ajmer','🌧 Heavy rain in ~45 min','y'],['Ajmer → Udaipur','☀️ 25°C, light wind','g']].map(x=>`<div class="row" style="justify-content:space-between;padding:4px 0"><span>${x[0]}</span><span class="chip ${x[2]=='y'?'y':''}">${x[1]}</span></div>`).join('')}</div>`}
function mapSvg(sc){
 return `<svg viewBox="0 0 400 220" width="100%" role="img" aria-label="Route map"><rect width="400" height="220" rx="12" fill="var(--gt)"/><path id="rt" d="M30 190 C100 180 110 110 190 105 S310 60 370 30" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>${st.delay?'<path d="M30 190 C100 180 110 110 190 105" fill="none" stroke="var(--r)" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>':''}<g id="pins" data-n="${sc.length}">${sc.map(s=>`<g class="pin"><circle r="9" fill="var(--g)"/><text y="4" text-anchor="middle" style="fill:#fff">${ICON[s.t]}</text></g>`).join('')}</g></svg>`}
V.trip=()=>{
 const sc=sched(st.base,st.delay),rk=risks(sc),last=sc[sc.length-1],nx=sc[1],P=st.pending,drive=sc.reduce((a,s)=>a+s.leg,0);
 const stat=rk.length?['r','🔴 At risk']:st.delay?['y','🟡 Replanned']:['g','🟢 On schedule'];
 return `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">📍 Delhi → Jaipur → Udaipur · 12 Oct</h2><span class="chip ${stat[0]=='g'?'':stat[0]}">${stat[1]}</span></div>
<div class="stats" style="margin-top:10px">
<div><b>650 km</b>Distance</div>
<div><b>${Math.floor(drive/60)}h ${drive%60}m</b>Driving</div>
<div><b>${sc.length-2}</b>Stops</div>
<div><b>${sc.filter(s=>s.t=='charge').length}</b>Charging</div>
<div><b>${f(last.arr)}</b>Hotel ETA${st.delay?` (+${st.delay}m)`:''}</div>
<div><b>${last.bat}%</b>Battery at hotel</div></div></div>
<div class="card"><div class="row"><span><label>Auto planning level</label><select data-a="mode">${[['manual','Manual'],['suggest','Suggestions only'],['smart','Smart planning'],['full','Fully dynamic']].map(m=>`<option value="${m[0]}" ${st.mode==m[0]?'selected':''}>${m[1]}</option>`).join('')}</select></span>
<button class="btn warn" data-delay="30">Simulate traffic delay (+30 min)</button>
<button class="btn warn" data-delay="40">Demo scenario +40 min</button>
<button class="btn alt" data-a="reset">Reset</button>
</div>
</div>
${st.explain?`<div class="ban g"><b>Itinerary adjusted.</b> ${st.explain}</div>`:''}
${P?`<div class="ban y"><b>Suggested changes</b> – ${P.text}<br>
<button class="btn sm" data-a="apply">Apply changes</button> 
<button class="btn alt sm" data-a="dismiss">Dismiss</button></div>`:''}
${st.mode=='manual'&&st.delay?'<div class="ban y">Manual mode: times shifted, nothing else changed.</div>':''}
${rk.map(x=>`<div class="ban r">⚠️ ${x}</div>`).join('')}
<div class="grid g2"><div><div class="row" style="margin-bottom:10px"><select id="addsel" style="width:auto"><option value="cafe">Café stop</option><option value="attr">Photo stop</option><option value="fuel">Rest plaza</option></select><button class="btn alt sm" data-a="add">Add stop</button></div>
<div class="tl">${sc.map((s,i)=>{const o=st.old&&st.old.find(x=>x.id==s.id),mv=(o&&o.arr!=s.arr)||(!o&&st.delay&&i>0&&s.arr!=sched(st.base,0)[i].arr);const rs=s.res&&s.arr>s.res.at+15?['r','At risk – rebook']:{'Available':['','Available'],'Limited availability':['y','Limited availability'],'Requires external booking':['n','Requires external booking'],'Not checked':['n','Not checked'],'Unavailable':['r','Unavailable']}[s.rs]||['n',''];
 return `<div class="st p${s.p} ${mv?'ch':''}"><div class="row" style="justify-content:space-between"><span class="t">${f(s.arr)}${s.dur?'–'+f(s.dep):''}${mv&&o&&o.arr!=s.arr?`<span class="old">${f(o.arr)}</span>`:''}</span><span class="chip ${s.p==1?'':s.p==4?'n':'y'}">${s.p==1?'🔒 ':''}${PR[s.p]}</span></div>
<h3>${ICON[s.t]} ${s.n}</h3>
<div class="mut">${s.why}</div>
<div class="mut">${s.km?s.km+' km from previous · ':''}${s.dur?s.dur+' min · ':''}${s.cost||''} · 🔋 ${s.bat}% on arrival${s.open?` · open ${f(s.open[0])}–${f(s.open[1])}`:''}</div>
<div class="mut">${s.fac||''}</div>
<div class="row" style="margin-top:6px">${rs[1]?`<span class="chip ${rs[0]}">${rs[1]}</span>`:''}${i&&i<sc.length-1?`<button class="pill" data-a="lock" data-id="${s.id}">${s.p==1?'Unlock':'Lock'}</button>
<button class="pill" data-a="up" data-id="${s.id}" aria-label="Move up">↑</button>
<button class="pill" data-a="dn" data-id="${s.id}" aria-label="Move down">↓</button>
<button class="pill" data-a="m15" data-id="${s.id}">−15m</button><button class="pill" data-a="p15" data-id="${s.id}">+15m</button>
<select data-a="prio" data-id="${s.id}" style="width:auto;padding:3px">${[2,3,4].map(p=>`<option value="${p}" ${s.p==p?'selected':''}>${PR[p]}</option>`).join('')}</select>
<button class="pill" data-a="rm" data-id="${s.id}">Remove</button>`:''}</div></div>`}).join('')}
</div>
${st.removed.length?`<div class="card"><b>Removed by planner</b>${st.removed.map(s=>`<div class="row" style="justify-content:space-between"><span class="mut">${s.n}</span>
<button class="pill" data-a="restore" data-id="${s.id}">Restore</button>
</div>`).join('')}</div>`:''}
</div>
<div>${`<div class="card">${mapSvg(sc)}</div>`}<div class="card">
<h3>Live journey – next stop</h3>
<div class="t">${nx.n}</div><div class="mut">📍 ${nx.km} km away · ⏱ ETA ${f(nx.arr)} · 🚦 ${st.delay?`Heavy, +${st.delay} min`:'Light'} · 🌦 Clear · 🔋 ${nx.bat}%</div><div class="mut">${nx.fac}</div>
</div>
${weatherCard()}<div class="card"><h3>Notifications</h3>${st.notes.map(n=>`<div class="ban ${n.c}" style="margin:6px 0;padding:8px 10px;font-size:14px">${n.t}</div>`).join('')}</div></div></div>`};
V.res=()=>{const sc=sched(st.base,st.delay);
           return 
`<h1 style="font-size:36px">Reservations</h1>
<p class="mut">Demo data. Status comes from partner APIs when connected; otherwise it says "Not checked" – never guessed.</p>
<div class="grid g3">${sc.filter(s=>s.rs).map(s=>{const late=s.res&&s.arr>s.res.at+15;
                                                  return
`<div class="card"><h3>${ICON[s.t]} ${s.n}</h3><p>${s.res?'Booked for '+f(s.res.at)+', ETA '+f(s.arr):'ETA '+f(s.arr)}</p>
<span class="chip ${late?'r':s.rs=='Available'?'':s.rs=='Limited availability'?'y':'n'}">${late?'At risk – rebook':s.rs}</span>${s.rs=='Requires external                  <p><a href="#" data-a="ext">Open external booking</a></p>':''}${s.rs=='Unavailable'?'
<p class="mut">Reservation unavailable through this platform</p>':''}</div>`}).join('')}</div>`};
V.saved=()=>`<h1 style="font-size:36px">Saved places</h1><div class="grid g3">${['Highway Haveli (breakfast) – Murthal','VoltHub Fast Charge – Kherki Daula','Pink City Business Hotel – Jaipur'].map(x=>`<div class="card">⭐ ${x}</div>`).join('')}</div><p class="mut">Synced with the mobile app.</p>`;
V.road=()=>`<h1 style="font-size:36px">Roadside assistance</h1><button class="sos-big" data-a="sos">SOS / Roadside assistance</button><div class="grid g3" style="margin-top:14px">${['Breakdown','Towing','Flat tyre','Battery jump','Fuel delivery','EV emergency charge','Accident','Nearby mechanic','Emergency 112'].map(x=>`<button class="card btn alt" data-a="svc" data-n="${x}" style="text-align:left">${x}</button>`).join('')}</div><div class="card"><button class="btn" data-a="loc">Share my location</button> <span id="locout" class="mut"></span></div>`;
V.profile=()=>`<h1 style="font-size:36px">Profile</h1><div class="grid g2"><div class="card"><h2>Vehicle</h2><p>Tata Nexon EV · 400 km range · CCS2</p><h2>Notifications</h2>${[['traffic','Traffic delays'],['weather','Weather alerts'],['res','Reservation risks'],['batt','Battery & fuel']].map(x=>`<label style="color:var(--ink)"><input type="checkbox" style="width:auto" data-np="${x[0]}" ${st.np[x[0]]?'checked':''}> ${x[1]}</label>`).join('')}<br><button class="btn alt sm" data-a="theme">Toggle dark mode</button></div>${appCard()}</div>`;
V.app=()=>`<h1 style="font-size:36px">Get the app</h1>${appCard()}`;
// ---------- shell ----------
const NAV=[
 ['home','Home'],
 ['plan','Plan Trip'],
 ['trip','My Trips / Live'],
 ['res','Reservations'],
 ['saved','Saved Places'],
 ['road','Roadside'],
 ['profile','Profile']];
function render(){
 document.getElementById('nav').innerHTML='<b>Waypoint</b>'+NAV.map(n=>`<button data-go="${n[0]}" class="${st.v==n[0]?'on':''}">${n[1]}</button>`).join('')+'<button class="sos" data-go="road">SOS</button>';
 document.getElementById('app').innerHTML=V[st.v]();const p=document.getElementById('rt'),g=document.getElementById('pins');
 if(p&&g){
  const n=+g.dataset.n,L=p.getTotalLength();g.querySelectorAll('.pin').forEach((e,i)=>{const q=p.getPointAtLength(L*i/(n-1));e.setAttribute('transform',`translate(${q.x},${q.y})`)})}}
function toast(t){
 const e=document.getElementById('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>e.hidden=true,2600)}
const get=id=>st.base.find(s=>s.id==id);
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-go],[data-delay],[data-a],[data-chip]');if(!b)return;const d=b.dataset;
 if(d.go){
  if(d.go=='app'){
   st.v='app'
  }else st.v=d.go;render();scrollTo(0,0);
  return
 }
 if(d.delay){
  delayBy(+d.delay);
  return
 }
 if(d.chip){
  const[k,v]=d.chip.split('|'),S=st[k];S.has(v)?S.delete(v):S.add(v);const keep=snap();render();restore(keep);
  return
 }
 const a=d.a,s=d.id&&get(+d.id),i=s&&st.base.indexOf(s);
 if(a=='reset'){
  st.base=S0();st.removed=[];st.delay=0;st.pending=null;st.explain='';st.old=null;note('Trip reset to the original plan.','g')
 }
 else if(a=='apply'){
  st.explain=st.pending.text;apply(st.pending.r)}else if(a=='dismiss')st.pending=null;
 else if(a=='lock'){
  if(s.p==1)s.p=s.pp>1?s.pp:3;else{s.pp=s.p;s.p=1}}
 else if(a=='up'||a=='dn'){const j=i+(a=='up'?-1:1);if(j<1||j>st.base.length-2)return toast('Start and hotel stay in place');const B=st.base;[B[i].leg,B[j].leg]=[B[j].leg,B[i].leg];[B[i],B[j]]=[B[j],B[i]]}
 else if(a=='m15')s.dur=Math.max(s.min,s.dur-15);else if(a=='p15')s.dur+=15;
 else if(a=='rm'){if(s.p==1)return toast('Unlock this stop first');drop(st.base,s.id)}
 else if(a=='restore'){const k=st.removed.findIndex(x=>x.id==+d.id),r=st.removed.splice(k,1)[0];const{arr,dep,bat,...x}=r;st.base.splice(st.base.length-1,0,x);st.base[st.base.length-1].leg=Math.max(30,st.base[st.base.length-1].leg-x.leg)}
 else if(a=='add'){const k=document.getElementById('addsel').value,x={...POIS[k],id:++st.nid};st.base.splice(st.base.length-1,0,x);st.base[st.base.length-1].leg+=5}
 else if(a=='feas'){const q=id=>document.getElementById(id).value;st.feas=feasibility({from:q('from'),to:q('to'),start:q('start'),end:q('end'),rt:q('rt'),fuel:q('fuel'),range:+q('range'),soc:+q('soc'),ch:+q('ch'),inf:+q('inf')})}
 else if(a=='sos'){toast('Demo: calling 112 and sharing your location with roadside partner');}
 else if(a=='svc')toast(d.n+' requested (demo – connect a roadside partner API)');
 else if(a=='ext'){e.preventDefault();toast('External booking link placeholder')}
 else if(a=='theme'){const r=document.documentElement;r.dataset.theme=(r.dataset.theme=='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches))?'light':'dark'}
 else if(a=='install'){if(window.__ip){__ip.prompt();__ip.userChoice.then(()=>window.__ip=null)}else toast(matchMedia('(display-mode:standalone)').matches?'Waypoint is already installed':'Open in Chrome on Android, then menu ⋮ → Install app');return}
 else if(a=='loc'){navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>locout.textContent=p.coords.latitude.toFixed(4)+', '+p.coords.longitude.toFixed(4),()=>locout.textContent='Location permission denied'):locout.textContent='Not supported';return}
 else return;
 if(['lock','up','dn','m15','p15','rm','restore','add','reset'].includes(a)){st.explain=a=='reset'?'':st.explain;recompute()}render()});
document.addEventListener('change',e=>{const d=e.target.dataset;if(d.a=='mode'){st.mode=e.target.value;recompute();render()}
 if(d.a=='prio'){
  const s=get(+d.id);s.p=s.pp=+e.target.value;recompute();render()
 }if(d.np)st.np[d.np]=e.target.checked});
function snap(){
 return[...document.querySelectorAll('input,select')].map(x=>x.value)
}
function restore(v){
 document.querySelectorAll('input,select').forEach((x,i)=>{if(v[i]!=null)x.value=v[i]})
}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__ip=e});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
if(location.hash){const h=location.hash.slice(1);if(V[h])st.v=h}
render();
