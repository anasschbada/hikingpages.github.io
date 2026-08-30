const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);let settings=JSON.parse(localStorage.getItem('trail-brief-settings')||'{"mode":"comfort","tent":2}'),partySize=Math.min(15,+localStorage.getItem('trail-brief-party-size')||8),currentHike=null;

const experienceStyle=document.createElement('style');experienceStyle.textContent='.map-stages{max-width:1180px;margin:0 auto 70px;padding:0 26px;display:grid;grid-template-columns:1.2fr .8fr;gap:30px}.map-stages h2{font-size:42px;margin:0 0 20px}.map-stages h2 em{font-family:Georgia,serif;font-weight:400}#route-map{height:420px;border-radius:14px;overflow:hidden;background:#eef4ea;border:1px solid var(--line);display:grid;place-items:center}#route-map svg{width:100%;height:100%;display:block}#route-stages{display:grid;gap:9px}.map-stages article{background:#fffaf0;border-radius:10px;padding:15px}.map-stages article span{color:#ff5b35;font:11px \'DM Mono\'}.map-stages article h3{margin:8px 0 4px;font-size:17px}.map-stages article p{margin:0;font-size:12px;color:#62716b}.map-note{font:10px \'DM Mono\';color:#6d7c75;margin:10px 0 0}@media(max-width:760px){.map-stages{grid-template-columns:1fr;padding:0 22px}#route-map{height:340px}}';document.head.append(experienceStyle);
const polish=document.createElement('style');polish.textContent='#profile-marker{stroke:#ff5b35;stroke-width:2;stroke-dasharray:4 4;pointer-events:none}.verified{font:10px \'DM Mono\';border:1px solid #be4029;border-radius:99px;padding:7px 9px}.outdooractive-link{background:#fffaf0;border:1px solid #d3c8b6;border-radius:99px;padding:12px 15px;color:#103b38;font:700 12px Outfit;text-decoration:none}';document.head.append(polish);

function injectExperience(){
  let panel=document.createElement('section');panel.className='map-stages';
  panel.innerHTML='<div><p class="eyebrow">GPS ROUTE MAP</p><h2>Follow the<br><em>real track.</em></h2><div id="route-map"><p>Loading GPX route…</p></div><p class="map-note">Drawn directly from mercantour-route.gpx · 2,275 track points</p></div><div><p class="eyebrow">HIKING STAGES</p><div id="route-stages"></div></div>';
  $('#route').after(panel);
}

// Renders the GPX track itself as inline SVG rather than as an overlay on a tile map: the track is
// the thing worth seeing here, and this way it always draws, with no tile server to reach.
function drawMap(p,marks){
  const lat0=p.reduce((s,x)=>s+x.lat,0)/p.length,k=Math.cos(lat0*Math.PI/180);
  const xs=p.map(x=>x.lng*k),ys=p.map(x=>-x.lat);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const W=760,H=520,pad=54,sx=(maxX-minX)||1e-6,sy=(maxY-minY)||1e-6;
  const scale=Math.min((W-2*pad)/sx,(H-2*pad)/sy);
  const ox=(W-sx*scale)/2-minX*scale,oy=(H-sy*scale)/2-minY*scale;
  const px=i=>(xs[i]*scale+ox).toFixed(1),py=i=>(ys[i]*scale+oy).toFixed(1);
  const d='M '+p.map((_,i)=>`${px(i)},${py(i)}`).join(' L ');
  // The loop starts and finishes at the same waypoint, so drop the repeat to avoid stacking two
  // identical pins and labels on one spot.
  const seen=new Set();
  const pins=marks.filter(([,name])=>!seen.has(name)&&seen.add(name)).map(([i,name],n)=>{
    const x=+px(i),y=+py(i),right=x<W/2,tx=right?x+13:x-13;
    return `<g class="pin" style="--n:${n}"><circle cx="${x}" cy="${y}" r="7.5" class="pin-halo"/><circle cx="${x}" cy="${y}" r="4" class="pin-dot"/><text x="${tx}" y="${y+4}" text-anchor="${right?'start':'end'}">${name}</text></g>`;
  }).join('');
  $('#route-map').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of the Mercantour GPX route">
    <defs><linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff5b35"/><stop offset="100%" stop-color="#c25a1f"/></linearGradient></defs>
    <path d="${d}" class="track-shadow"/><path d="${d}" class="track"/>${pins}</svg>`;
}

async function loadTrack(){
 try{
  let xml=await(await fetch('./mercantour-route.gpx')).text(),d=new DOMParser().parseFromString(xml,'application/xml');
  let p=[...d.querySelectorAll('trkpt')].map(x=>({lat:+x.getAttribute('lat'),lng:+x.getAttribute('lon'),ele:+x.querySelector('ele').textContent,name:x.querySelector('name')?.textContent||null}));
  if(!p.length)throw new Error('no track points in GPX');
  draw(p.map(x=>x.ele));
  const svg=$('#profile'),marker=$('#profile-marker');
  svg.onpointermove=e=>{let r=svg.getBoundingClientRect(),x=Math.max(0,Math.min(760,(e.clientX-r.left)/r.width*760));marker.setAttribute('x1',x);marker.setAttribute('x2',x);let pt=p[Math.round(x/760*(p.length-1))];$('#profile-range').textContent=`${Math.round(pt.ele)} m · move along the real GPX track`};
  svg.onpointerleave=()=>{marker.setAttribute('x1',-5);marker.setAttribute('x2',-5)};
  let marks=p.map((pt,i)=>[i,pt.name]).filter(m=>m[1]);
  drawMap(p,marks);
  let cum=[0];for(let i=1;i<p.length;i++){let a=p[i-1],b=p[i],dx=111320*Math.cos(a.lat*Math.PI/180)*(b.lng-a.lng),dy=110540*(b.lat-a.lat);cum.push(cum[i-1]+Math.hypot(dx,dy)/1000)}
  let total=cum[cum.length-1],bounds,names;
  // Prefer the named waypoints the track itself carries (refuges, parking) as real stage
  // boundaries; fall back to an even day-by-day split for a GPX with no named points.
  if(marks.length>=2){
    bounds=marks.map(m=>m[0]);names=marks.map(m=>m[1]);
  }else{
    let hike=(currentHike||DEFAULT_DATA).hike||{},start=hike.start_date,end=hike.end_date,nDays=3;
    if(start&&end){let diff=Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/864e5)+1;if(diff>0)nDays=diff}
    bounds=Array.from({length:nDays+1},(_,i)=>i/nDays*total).map(b=>{let lo=0,hi=cum.length-1;while(lo<hi){let m=(lo+hi)>>1;if(cum[m]<b)lo=m+1;else hi=m}return lo});
    names=bounds.map((_,i)=>i<nDays?`Day ${i+1}`:null);
  }
  let cards=[];
  for(let k=0;k<bounds.length-1;k++){
    let i0=bounds[k],i1=bounds[k+1],up=0,down=0;
    for(let j=i0+1;j<=i1;j++){let de=p[j].ele-p[j-1].ele;if(de>0)up+=de;else down-=de}
    let label=marks.length>=2?`${names[k]} → ${names[k+1]}`:names[k];
    cards.push(`<article><span>0${k+1}</span><h3>${label}</h3><p>${(cum[i1]-cum[i0]).toFixed(1)} km · +${Math.round(up)} m / −${Math.round(down)} m · ${Math.round(p[i0].ele)}→${Math.round(p[i1].ele)} m</p></article>`);
  }
  $('#route-stages').innerHTML=cards.join('');
 }catch(e){
  console.warn('Could not read the GPX file',e);
  $('#route-map').innerHTML='<p>Could not load mercantour-route.gpx.</p>';
 }
}
injectExperience();
loadTrack();

const val=(id,x)=>{if(x!==undefined&&x!==null)$(id).textContent=x}, cap=()=>settings.mode==='comfort'?4:5, cars=()=>Math.ceil(partySize/cap()),tents=()=>Math.ceil(partySize/settings.tent);
function draw(v){if(!v?.length)return;let mi=Math.min(...v),ma=Math.max(...v),r=ma-mi||1,w=760,h=210,p=10,c=v.map((x,i)=>`${p+i*(w-2*p)/(v.length-1)},${h-p-(x-mi)/r*(h-2*p)}`);$('#profile-line').setAttribute('d','M '+c.join(' L '));$('#profile-fill').setAttribute('d',`M ${p},${h} L ${c.join(' L ')} L ${w-p},${h} Z`);val('#profile-range',`${Math.round(mi)}–${Math.round(ma)} m elevation`)}

// Spreads N people as evenly as possible across `count` containers, so the last car isn't left
// with a single passenger while the others run full.
function spread(n,count){const base=Math.floor(n/count),extra=n%count;return Array.from({length:count},(_,i)=>base+(i<extra?1:0))}

function scene(){
  const seatCap=cap(),tentCap=settings.tent,nCars=cars(),nTents=tents();
  val('#cars-needed',nCars);val('#tents-needed',nTents);val('#free-seats',nCars*seatCap-partySize);
  $('#car-list').innerHTML=spread(partySize,nCars).map((taken,i)=>{
    const seats=Array.from({length:seatCap},(_,s)=>`<i class="${s<taken?'taken':'free'}" style="--s:${s}"></i>`).join('');
    return `<figure class="car" style="--i:${i}"><svg viewBox="0 0 120 60" aria-hidden="true"><path class="body" d="M8 42c0-9 3-15 8-19 4-3 12-5 26-5s22 2 26 5c5 4 8 10 8 19 0 5-2 8-6 8H14c-4 0-6-3-6-8Z"/><path class="glass" d="M24 22c3-3 9-4 18-4s15 1 18 4l5 8H19Z"/><circle class="wheel" cx="30" cy="50" r="7"/><circle class="wheel" cx="72" cy="50" r="7"/></svg><figcaption><b>Car ${i+1}</b><span class="seats">${seats}</span><small>${taken}/${seatCap}</small></figcaption></figure>`;
  }).join('');
  $('#tent-list').innerHTML=spread(partySize,nTents).map((taken,i)=>{
    const spots=Array.from({length:tentCap},(_,s)=>`<i class="${s<taken?'taken':'free'}" style="--s:${s}"></i>`).join('');
    return `<figure class="tent-card" style="--i:${i}"><svg viewBox="0 0 120 70" aria-hidden="true"><path class="fly" d="M60 8 108 60H12Z"/><path class="door" d="M60 22 84 60H36Z"/><path class="ground" d="M6 60h108"/></svg><figcaption><b>Tent ${i+1}</b><span class="seats">${spots}</span><small>${taken}/${tentCap}</small></figcaption></figure>`;
  }).join('');
}

function weatherDays(days=[]){$('#forecast-days').innerHTML=days.map(d=>`<div><b>${d.day}</b><span>${d.icon||'☀'} ${d.high} / ${d.low}</span><small>${d.rain} · ${d.wind}</small></div>`).join('')}
function load(data){currentHike=data;let h=data.hike||{},w=data.weather||{},r=data.route||{},z=data.wildlife||{};val('#hike-dates',h.dates);val('#hike-title',h.title);val('#hike-description',h.description);val('#travel',h.travel);val('#fact-meet',h.meet_time);val('#weather-location',w.location);val('#weather-date',w.updated);$('#temperature').innerHTML=`${w.temperature??'—'}<sup>°C</sup>`;val('#condition',w.condition);val('#feels',`Night lows ${w.feels_like??'—'}°`);val('#weather-icon',w.icon);val('#rain',w.rain);val('#wind',w.wind);val('#humidity',w.humidity);val('#uv',w.uv);weatherDays(w.days);val('#fact-distance',r.distance);val('#fact-gain',r.ascent);val('#fact-duration',r.duration);val('#hero-highest',r.highest_point);val('#difficulty',r.difficulty);val('#route-summary',r.description);$('#stats').innerHTML=`<div><b>${r.distance||'—'}</b><span>Distance</span></div><div><b>${r.ascent||'—'}</b><span>Ascent</span></div><div><b>${r.highest_point||'—'}</b><span>High point</span></div><div><b>${r.duration||'—'}</b><span>Moving time</span></div>`;draw(r.elevation_profile);val('#about-text',h.description);val('#wildlife-title',z.title);val('#wildlife-text',z.description);$('#species').innerHTML=(z.species||[]).map(x=>`<span>◌ ${x}</span>`).join('')}

const WMO_ICONS={0:['☀️','Clear sky'],1:['🌤️','Mainly clear'],2:['⛅','Partly cloudy'],3:['☁️','Overcast'],45:['🌫️','Fog'],48:['🌫️','Fog'],51:['🌦️','Light drizzle'],53:['🌦️','Drizzle'],55:['🌧️','Dense drizzle'],61:['🌦️','Light rain'],63:['🌧️','Rain'],65:['🌧️','Heavy rain'],71:['🌨️','Light snow'],73:['🌨️','Snow'],75:['❄️','Heavy snow'],80:['🌦️','Rain showers'],81:['🌧️','Rain showers'],82:['⛈️','Violent showers'],95:['⛈️','Thunderstorm'],96:['⛈️','Thunderstorm, hail'],99:['⛈️','Severe thunderstorm']};
async function fetchLiveWeather(hike){
  const lat=hike?.weather?.lat,lon=hike?.weather?.lon,start=hike?.hike?.start_date,end=hike?.hike?.end_date;
  if(!lat||!lon||!start||!end)return;
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&start_date=${start}&end_date=${end}`;
    const res=await fetch(url);
    if(!res.ok)throw new Error('Open-Meteo request failed');
    const d=(await res.json()).daily;
    if(!d?.time?.length)throw new Error('Open-Meteo returned no data for these dates');
    const days=d.time.map((date,i)=>{const w=WMO_ICONS[d.weathercode[i]]||['⛅','Mixed conditions'];return{day:new Date(`${date}T00:00:00`).toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short'}),high:`${Math.round(d.temperature_2m_max[i])}°C`,low:`${Math.round(d.temperature_2m_min[i])}°C`,rain:`${d.precipitation_sum[i].toFixed(1)} mm`,wind:`${Math.round(d.windspeed_10m_max[i])} km/h`,icon:w[0],label:w[1]}});
    val('#weather-date',`Live forecast · ${hike.hike?.dates||''}`);
    $('#temperature').innerHTML=`${Math.round(Math.min(...d.temperature_2m_min))}–${Math.round(Math.max(...d.temperature_2m_max))}<sup>°C</sup>`;
    val('#condition',days[0].label);
    val('#feels',`Night lows ${Math.round(Math.min(...d.temperature_2m_min))}°`);
    val('#weather-icon',days[0].icon);
    val('#rain',`${Math.max(...d.precipitation_sum).toFixed(1)} mm`);
    val('#wind',`${Math.round(Math.max(...d.windspeed_10m_max))} km/h`);
    val('#uv',Math.max(...d.uv_index_max)>=6?'High':'Moderate');
    weatherDays(days);
    val('#weather-badge','Live · Open-Meteo');
  }catch(e){console.warn('Live weather unavailable, showing the organiser briefing instead',e)}
}

async function loadHikeData(defaults){
  try{
    const text=await(await fetch('./hike.yaml')).text();
    const parsed=jsyaml.load(text);
    if(!parsed)throw new Error('hike.yaml is empty');
    load(parsed);
    fetchLiveWeather(parsed);
  }catch(e){
    console.warn('hike.yaml not found next to this page, using the built-in defaults',e);
    fetchLiveWeather(defaults);
  }
}

$('#party-size').oninput=e=>{partySize=+e.target.value;$('#party-size-value').textContent=partySize;localStorage.setItem('trail-brief-party-size',partySize);scene()};
$('#comfort-mode').onchange=e=>{settings.mode=e.target.value;localStorage.setItem('trail-brief-settings',JSON.stringify(settings));scene()};
$('#tent-capacity').oninput=e=>{settings.tent=Math.min(6,Math.max(1,+e.target.value||1));localStorage.setItem('trail-brief-settings',JSON.stringify(settings));scene()};
$('#download-gpx').onclick=()=>{const a=document.createElement('a');a.href='./mercantour-route.gpx';a.download='mercantour-route.gpx';a.click()};
$('#add-calendar').onclick=()=>{
  const h=(currentHike||DEFAULT_DATA).hike||{};
  if(!h.start_date||!h.end_date){alert('No dates set for this hike yet.');return}
  const dt=s=>s.replace(/-/g,''),endExclusive=new Date(`${h.end_date}T00:00:00`);endExclusive.setDate(endExclusive.getDate()+1);
  const stamp=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trail Brief//EN','BEGIN:VEVENT',`UID:${Date.now()}@trailbrief`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${dt(h.start_date)}`,`DTEND;VALUE=DATE:${dt(endExclusive.toISOString().slice(0,10))}`,`SUMMARY:${h.title||'Hike'}`,`DESCRIPTION:${(h.description||'').replace(/\n/g,'\\n')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hike.ics';a.click();URL.revokeObjectURL(a.href);
};
$('#share-hike').onclick=async()=>{
  const shareData={title:document.title,text:'Join us for this hike!',url:location.href};
  if(navigator.share){try{await navigator.share(shareData);return}catch(e){return}}
  try{await navigator.clipboard.writeText(location.href);alert('Link copied to clipboard!')}catch(e){prompt('Copy this link:',location.href)}
};
all('[data-scroll]').forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));

const nav=document.querySelector('nav');
window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>10),{passive:true});
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}})},{threshold:.12});
  all('main > section').forEach(s=>{s.classList.add('reveal');io.observe(s)});
  // Safety net: this is a hiking brief people rely on for real logistics, so a flourish must never
  // be the reason a section stays invisible (a fast programmatic scroll, a deep link straight to an
  // anchor, or any other edge case the observer doesn't catch cleanly).
  setTimeout(()=>all('.reveal:not(.in-view)').forEach(s=>s.classList.add('in-view')),1500);
}else{
  all('main > section').forEach(s=>s.classList.add('in-view'));
}

const DEFAULT_DATA={hike:{title:'Mercantour: mountain weekend',dates:'Friday 04 September — Sunday 06 September 2026',start_date:'2026-09-04',end_date:'2026-09-06',meet_time:'Friday · 12:00–13:00 from Antibes / Nice',travel:'Antibes / Nice → Pont du Countet: leave by 12:00–13:00 at the latest, park the cars there, then the hike begins.',description:'A three-day escape into the wild alpine–Mediterranean landscapes of Mercantour National Park: high valleys, mineral ridges and starry camp evenings.'},weather:{location:'Mercantour National Park',lat:44.074149,lon:7.401073,updated:'Forecast · 04–06 September 2026',temperature:'22–23',feels_like:'16–17',condition:'Sunny, dry and light wind',icon:'☀️',rain:'0.0 mm',wind:'5–7 km/h',humidity:'Low',uv:'High',days:[{day:'Fri 04 Sep',high:'22°C',low:'16°C',rain:'0.0 mm',wind:'6 km/h'},{day:'Sat 05 Sep',high:'23°C',low:'17°C',rain:'0.0 mm · 5%',wind:'7 km/h'},{day:'Sun 06 Sep',high:'22°C',low:'17°C',rain:'0.0 mm · 17%',wind:'5 km/h'}]},route:{distance:'28.3 km',ascent:'2,325 m',duration:'3 days',highest_point:'2,688 m',difficulty:'Challenging multi-day hike',description:'A 28.3 km loop from Pont du Countet (1,684 m): Day 1 climbs to Refuge de Nice (2,223 m) for the first bivouac. Day 2 is the hard part — on to Refuge de Valmasque (2,225 m, a possible fallback overnight if the group is tired) and then Refuge des Merveilles (2,121 m) for the second bivouac. Day 3 descends back down to the cars at Pont du Countet.',elevation_profile:[1684,1740,1840,2010,2190,2380,2560,2688,2500,2320,2100,1880,1684]},wildlife:{title:'Wildlife to watch for',description:'Walk quietly and give wildlife space. You may spot ibex, chamois and marmots; scan the sky for golden eagles.',species:['Alpine ibex','Chamois','Alpine marmot','Golden eagle','Bearded vulture']}};

$('#party-size').value=partySize;$('#party-size-value').textContent=partySize;$('#comfort-mode').value=settings.mode;$('#tent-capacity').value=settings.tent;scene();
load(DEFAULT_DATA);
loadHikeData(DEFAULT_DATA);
