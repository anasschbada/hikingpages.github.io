const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s);let settings=JSON.parse(localStorage.getItem('trail-brief-settings')||'{"mode":"comfort","tent":2}'),partySize=Math.min(15,+localStorage.getItem('trail-brief-party-size')||8),language='en',currentHike=null;
const t=(en,fr)=>language==='fr'?fr:en;

const experienceStyle=document.createElement('style');experienceStyle.textContent='.language{border:1px solid #9f998e;background:transparent;border-radius:99px;padding:7px 9px;font:700 11px Outfit;cursor:pointer}.photo-gallery{max-width:1180px;margin:0 auto 90px;padding:0 26px;display:grid;grid-template-columns:1fr 1fr;gap:18px}.photo-gallery figure{margin:0;border-radius:15px;overflow:hidden;position:relative;height:220px;background:linear-gradient(135deg,#1e5a50,#0d2b28);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}.photo-gallery .icon{font-size:64px;filter:drop-shadow(0 8px 14px #0007)}.photo-gallery figcaption{color:#fff;font:600 14px Outfit;padding:0 16px;text-align:center}.map-stages{max-width:1180px;margin:0 auto 70px;padding:0 26px;display:grid;grid-template-columns:1.2fr .8fr;gap:30px}.map-stages h2{font-size:42px;margin:0 0 20px}.map-stages h2 em{font-family:Georgia,serif;font-weight:400}#route-map{height:380px;border-radius:14px;overflow:hidden;background:#d5e6d1;display:grid;place-items:center;font:12px \'DM Mono\'}#route-stages{display:grid;gap:9px}.map-stages article{background:#fffaf0;border-radius:10px;padding:15px}.map-stages article span{color:#ff5b35;font:11px \'DM Mono\'}.map-stages article h3{margin:8px 0 4px;font-size:17px}.map-stages article p{margin:0;font-size:12px;color:#62716b}@media(max-width:760px){.photo-gallery,.map-stages{grid-template-columns:1fr}.photo-gallery{margin-bottom:55px}.photo-gallery figure{height:190px}.map-stages{padding:0 22px}#route-map{height:300px}}';document.head.append(experienceStyle);
const polish=document.createElement('style');polish.textContent='#profile-marker{stroke:#ff5b35;stroke-width:2;stroke-dasharray:4 4;pointer-events:none}.verified{font:10px \'DM Mono\';border:1px solid #be4029;border-radius:99px;padding:7px 9px}.outdooractive-link{background:#fffaf0;border:1px solid #d3c8b6;border-radius:99px;padding:12px 15px;color:#103b38;font:700 12px Outfit;text-decoration:none}';document.head.append(polish);

function applyLanguage(){all('[data-i18n-fr]').forEach(el=>{if(el.dataset.i18nEn===undefined)el.dataset.i18nEn=el.innerHTML;el.innerHTML=language==='fr'?el.dataset.i18nFr:el.dataset.i18nEn});document.documentElement.lang=language}

function injectExperience(){document.querySelector('nav').insertAdjacentHTML('beforeend','<button class="language" id="language">FR</button>');$('#language').onclick=()=>{language=language==='en'?'fr':'en';$('#language').textContent=language==='en'?'FR':'EN';applyLanguage();$('#about-en').hidden=language==='fr';$('#about-fr').hidden=language==='en';$('#wildlife-en').hidden=language==='fr';$('#wildlife-fr').hidden=language==='en';load(currentHike||DEFAULT_DATA)};document.querySelector('.wildlife').insertAdjacentHTML('afterend','<section class="photo-gallery"><figure><span class="icon">🐐</span><figcaption data-i18n-fr="Bouquetin des Alpes">Alpine ibex · Bouquetin des Alpes</figcaption></figure><figure><span class="icon">🦌</span><figcaption data-i18n-fr="Chamois en altitude">Chamois on the high slopes</figcaption></figure></section>');let panel=document.createElement('section');panel.className='map-stages';panel.innerHTML='<div><p class="eyebrow" data-i18n-fr="CARTE GPS">GPS ROUTE MAP</p><h2 data-i18n-fr="Suivre<br><em>le tracé réel.</em>">Follow the<br><em>real track.</em></h2><div id="route-map"><p>Loading GPX route…</p></div></div><div><p class="eyebrow" data-i18n-fr="ÉTAPES DE LA RANDO">HIKING STAGES</p><div id="route-stages"></div></div>';$('#route').after(panel);applyLanguage();let l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(l);let s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=loadTrack;document.head.append(s)}

async function loadTrack(){try{let xml=await(await fetch('./mercantour-route.gpx')).text(),d=new DOMParser().parseFromString(xml,'application/xml'),p=[...d.querySelectorAll('trkpt')].map(x=>({lat:+x.getAttribute('lat'),lng:+x.getAttribute('lon'),ele:+x.querySelector('ele').textContent,name:x.querySelector('name')?.textContent||null}));draw(p.map(x=>x.ele));const svg=$('#profile'),marker=$('#profile-marker');svg.onpointermove=e=>{let r=svg.getBoundingClientRect(),x=Math.max(0,Math.min(760,(e.clientX-r.left)/r.width*760));marker.setAttribute('x1',x);marker.setAttribute('x2',x);let pt=p[Math.round(x/760*(p.length-1))];$('#profile-range').textContent=`${Math.round(pt.ele)} m · ${t('move along the real GPX track','déplacez-vous sur le tracé GPX réel')}`};svg.onpointerleave=()=>{marker.setAttribute('x1',-5);marker.setAttribute('x2',-5)};
  let map=L.map('route-map');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:17}).addTo(map);
  let poly=L.polyline(p.map(x=>[x.lat,x.lng]),{color:'#ff5b35',weight:4}).addTo(map);
  map.fitBounds(poly.getBounds());
  // The map can be created before its container has its final layout size (web fonts, images or
  // the leaflet stylesheet finishing late); re-measure shortly after so tiles actually appear.
  requestAnimationFrame(()=>{map.invalidateSize();map.fitBounds(poly.getBounds())});
  setTimeout(()=>{map.invalidateSize();map.fitBounds(poly.getBounds())},500);
  let cum=[0];for(let i=1;i<p.length;i++){let a=p[i-1],b=p[i],dx=111320*Math.cos(a.lat*Math.PI/180)*(b.lng-a.lng),dy=110540*(b.lat-a.lat);cum.push(cum[i-1]+Math.hypot(dx,dy)/1000)}
  let total=cum[cum.length-1];
  // Prefer the named waypoints the track itself carries (e.g. refuges, parking) as real stage
  // boundaries; fall back to an even day-by-day split for a GPX file with no named points.
  let marks=p.map((pt,i)=>[i,pt.name]).filter(m=>m[1]);
  let bounds,names;
  if(marks.length>=2){
    bounds=marks.map(m=>m[0]);
    names=marks.map(m=>m[1]);
  }else{
    let hike=(currentHike||DEFAULT_DATA).hike||{},start=hike.start_date,end=hike.end_date,nDays=3;
    if(start&&end){let diff=Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/864e5)+1;if(diff>0)nDays=diff}
    let distBounds=Array.from({length:nDays+1},(_,i)=>i/nDays*total);
    bounds=distBounds.map(b=>{let lo=0,hi=cum.length-1;while(lo<hi){let m=(lo+hi)>>1;if(cum[m]<b)lo=m+1;else hi=m}return lo});
    names=bounds.map((_,i)=>i<nDays?`${t('Day','Jour')} ${i+1}`:null);
  }
  let cards=[];
  for(let k=0;k<bounds.length-1;k++){
    let i0=bounds[k],i1=bounds[k+1],up=0,down=0;
    for(let j=i0+1;j<=i1;j++){let de=p[j].ele-p[j-1].ele;if(de>0)up+=de;else down-=de}
    let label=marks.length>=2?`${names[k]} → ${names[k+1]}`:names[k];
    cards.push(`<article><span>0${k+1}</span><h3>${label}</h3><p>${(cum[i1]-cum[i0]).toFixed(1)} km · +${Math.round(up)} m / −${Math.round(down)} m · ${Math.round(p[i0].ele)}→${Math.round(p[i1].ele)} m</p></article>`);
  }
  $('#route-stages').innerHTML=cards.join('')
}catch(e){$('#route-map').innerHTML=`<p>${t('Publish on GitHub Pages to load the interactive local GPX map.','Publiez sur GitHub Pages pour charger la carte GPX interactive.')}</p>`}}
injectExperience();

const val=(id,x)=>{if(x!==undefined&&x!==null)$(id).textContent=x}, cap=()=>settings.mode==='comfort'?4:5, cars=()=>Math.ceil(partySize/cap()),tents=()=>Math.ceil(partySize/settings.tent);
function draw(v){if(!v?.length)return;let mi=Math.min(...v),ma=Math.max(...v),r=ma-mi||1,w=760,h=210,p=10,c=v.map((x,i)=>`${p+i*(w-2*p)/(v.length-1)},${h-p-(x-mi)/r*(h-2*p)}`);$('#profile-line').setAttribute('d','M '+c.join(' L '));$('#profile-fill').setAttribute('d',`M ${p},${h} L ${c.join(' L ')} L ${w-p},${h} Z`);val('#profile-range',`${Math.round(mi)}–${Math.round(ma)} m elevation`)}
function scene(){val('#cars-needed',cars());val('#tents-needed',tents());$('#arrival-cars').innerHTML=Array.from({length:cars()},(_,i)=>`<span class="tesla" style="--i:${i}">▰</span>`).join('');$('#hikers-climb').innerHTML=Array.from({length:partySize},(_,i)=>`<span class="hiker" style="--i:${i}">🚶</span>`).join('');$('#camp-tents').innerHTML=Array.from({length:tents()},(_,i)=>`<span class="tent" style="--i:${i}">▲</span>`).join('')}
function weatherDays(days=[]){$('#forecast-days').innerHTML=days.map(d=>`<div><b>${d.day}</b><span>${d.icon||'☀'} ${d.high} / ${d.low}</span><small>${d.rain} · ${d.wind}</small></div>`).join('')}
function load(data){currentHike=data;let h=data.hike||{},w=data.weather||{},r=data.route||{},z=data.wildlife||{};val('#hike-dates',h.dates);val('#hike-title',t(h.title_en,h.title_fr)||h.title_en);val('#hike-description',t(h.description_en,h.description_fr)||h.description_en);val('#travel',t(h.travel_en,h.travel_fr)||h.travel_en);val('#fact-meet',t(h.meet_time_en,h.meet_time_fr)||h.meet_time_en);val('#weather-location',w.location);val('#weather-date',w.updated);$('#temperature').innerHTML=`${w.temperature??'—'}<sup>°C</sup>`;val('#condition',t(w.condition_en,w.condition_fr)||w.condition_en);val('#feels',`${t('Night lows','Minimales nocturnes')} ${w.feels_like??'—'}°`);val('#weather-icon',w.icon);val('#rain',w.rain);val('#wind',w.wind);val('#humidity',w.humidity);val('#uv',w.uv);weatherDays(w.days);val('#fact-distance',r.distance);val('#fact-gain',r.ascent);val('#fact-duration',r.duration);val('#hero-highest',r.highest_point);val('#difficulty',t(r.difficulty_en,r.difficulty_fr)||r.difficulty_en);val('#route-summary',t(r.description_en,r.description_fr)||r.description_en);$('#stats').innerHTML=`<div><b>${r.distance||'—'}</b><span>${t('Distance','Distance')}</span></div><div><b>${r.ascent||'—'}</b><span>${t('Ascent','Dénivelé +')}</span></div><div><b>${r.highest_point||'—'}</b><span>${t('High point','Point haut')}</span></div><div><b>${r.duration||'—'}</b><span>${t('Moving time','Temps de marche')}</span></div>`;draw(r.elevation_profile);val('#about-en',h.description_en);val('#about-fr',h.description_fr);val('#wildlife-title',z.title);val('#wildlife-en',z.description_en);val('#wildlife-fr',z.description_fr);$('#species').innerHTML=(z.species||[]).map(x=>`<span>◌ ${x}</span>`).join('')}

const WMO_ICONS={0:['☀️','Clear sky','Ciel clair'],1:['🌤️','Mainly clear','Plutôt clair'],2:['⛅','Partly cloudy','Partiellement nuageux'],3:['☁️','Overcast','Couvert'],45:['🌫️','Fog','Brouillard'],48:['🌫️','Fog','Brouillard givrant'],51:['🌦️','Light drizzle','Bruine légère'],53:['🌦️','Drizzle','Bruine'],55:['🌧️','Dense drizzle','Bruine dense'],61:['🌦️','Light rain','Pluie légère'],63:['🌧️','Rain','Pluie'],65:['🌧️','Heavy rain','Forte pluie'],71:['🌨️','Light snow','Neige légère'],73:['🌨️','Snow','Neige'],75:['❄️','Heavy snow','Forte neige'],80:['🌦️','Rain showers','Averses'],81:['🌧️','Rain showers','Averses'],82:['⛈️','Violent showers','Averses violentes'],95:['⛈️','Thunderstorm','Orage'],96:['⛈️','Thunderstorm, hail','Orage de grêle'],99:['⛈️','Severe thunderstorm','Orage violent']};
async function fetchLiveWeather(hike){
  const lat=hike?.weather?.lat,lon=hike?.weather?.lon,start=hike?.hike?.start_date,end=hike?.hike?.end_date;
  if(!lat||!lon||!start||!end)return;
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&start_date=${start}&end_date=${end}`;
    const res=await fetch(url);
    if(!res.ok)throw new Error('Open-Meteo request failed');
    const d=(await res.json()).daily;
    if(!d?.time?.length)throw new Error('Open-Meteo returned no data for these dates');
    const days=d.time.map((date,i)=>{const w=WMO_ICONS[d.weathercode[i]]||['⛅','Mixed conditions','Conditions variables'];return{day:new Date(`${date}T00:00:00`).toLocaleDateString(language==='fr'?'fr-FR':'en-GB',{weekday:'short',day:'2-digit',month:'short'}),high:`${Math.round(d.temperature_2m_max[i])}°C`,low:`${Math.round(d.temperature_2m_min[i])}°C`,rain:`${d.precipitation_sum[i].toFixed(1)} mm`,wind:`${Math.round(d.windspeed_10m_max[i])} km/h`,icon:w[0],label:t(w[1],w[2])}});
    val('#weather-date',`${t('Live forecast','Prévisions en direct')} · ${hike.hike?.dates||''}`);
    $('#temperature').innerHTML=`${Math.round(Math.min(...d.temperature_2m_min))}–${Math.round(Math.max(...d.temperature_2m_max))}<sup>°C</sup>`;
    val('#condition',days[0].label);
    val('#feels',`${t('Night lows','Minimales nocturnes')} ${Math.round(Math.min(...d.temperature_2m_min))}°`);
    val('#weather-icon',days[0].icon);
    val('#rain',`${Math.max(...d.precipitation_sum).toFixed(1)} mm`);
    val('#wind',`${Math.round(Math.max(...d.windspeed_10m_max))} km/h`);
    val('#uv',Math.max(...d.uv_index_max)>=6?t('High','Élevé'):t('Moderate','Modéré'));
    weatherDays(days);
    val('#weather-badge',t('Live · Open-Meteo','En direct · Open-Meteo'));
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
$('#tent-capacity').oninput=e=>{settings.tent=+e.target.value||1;localStorage.setItem('trail-brief-settings',JSON.stringify(settings));scene()};
$('#add-calendar').onclick=()=>{
  const h=(currentHike||DEFAULT_DATA).hike||{};
  if(!h.start_date||!h.end_date){alert(t('No dates set for this hike yet.','Aucune date définie pour cette randonnée.'));return}
  const dt=s=>s.replace(/-/g,''),endExclusive=new Date(`${h.end_date}T00:00:00`);endExclusive.setDate(endExclusive.getDate()+1);
  const stamp=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const title=t(h.title_en,h.title_fr)||h.title_en||'Hike';
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trail Brief//EN','BEGIN:VEVENT',`UID:${Date.now()}@trailbrief`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${dt(h.start_date)}`,`DTEND;VALUE=DATE:${dt(endExclusive.toISOString().slice(0,10))}`,`SUMMARY:${title}`,`DESCRIPTION:${(h.description_en||'').replace(/\n/g,'\\n')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hike.ics';a.click();URL.revokeObjectURL(a.href);
};
$('#share-hike').onclick=async()=>{
  const shareData={title:document.title,text:t('Join us for this hike!','Rejoins-nous pour cette randonnée !'),url:location.href};
  if(navigator.share){try{await navigator.share(shareData);return}catch(e){return}}
  try{await navigator.clipboard.writeText(location.href);alert(t('Link copied to clipboard!','Lien copié dans le presse-papiers !'))}catch(e){prompt(t('Copy this link:','Copiez ce lien :'),location.href)}
};
all('[data-scroll]').forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));

// Modernisation touches: a nav that gains a shadow once the page scrolls, and sections that
// gently fade/slide into view the first time they cross the viewport.
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

const DEFAULT_DATA={hike:{title_en:'Mercantour: mountain weekend',title_fr:'Mercantour : week-end en montagne',dates:'Friday 04 September — Sunday 06 September 2026',start_date:'2026-09-04',end_date:'2026-09-06',meet_time_en:'Friday · 12:00–13:00 from Antibes / Nice',meet_time_fr:'Vendredi · 12h00–13h00 depuis Antibes / Nice',travel_en:'Antibes / Nice → Pont du Countet: leave by 12:00–13:00 at the latest, park the cars there, then the hike begins.',travel_fr:'Antibes / Nice → Pont du Countet : départ 12h00–13h00 au plus tard, on gare les voitures sur place, puis la randonnée commence.',description_en:'A three-day escape into the wild alpine–Mediterranean landscapes of Mercantour National Park: high valleys, mineral ridges and starry camp evenings.',description_fr:'Une parenthèse de trois jours dans des paysages alpins et méditerranéens sauvages : hautes vallées, crêtes minérales et soirées sous les étoiles.'},weather:{location:'Mercantour National Park',lat:44.074149,lon:7.401073,updated:'Forecast · 04–06 September 2026',temperature:'22–23',feels_like:'16–17',condition_en:'Sunny, dry and light wind',condition_fr:'Ensoleillé, sec et vent léger',icon:'☀️',rain:'0.0 mm',wind:'5–7 km/h',humidity:'Low',uv:'High',days:[{day:'Fri 04 Sep',high:'22°C',low:'16°C',rain:'0.0 mm',wind:'6 km/h'},{day:'Sat 05 Sep',high:'23°C',low:'17°C',rain:'0.0 mm · 5%',wind:'7 km/h'},{day:'Sun 06 Sep',high:'22°C',low:'17°C',rain:'0.0 mm · 17%',wind:'5 km/h'}]},route:{distance:'28.3 km',ascent:'2,325 m',duration:'3 days',highest_point:'2,688 m',difficulty_en:'Challenging multi-day hike',difficulty_fr:'Randonnée exigeante sur plusieurs jours',description_en:'A 28.3 km loop from Pont du Countet (1,684 m): Day 1 climbs to Refuge de Nice (2,223 m) for the first bivouac. Day 2 is the hard part — on to Refuge de Valmasque (2,225 m, a possible fallback overnight if the group is tired) and then Refuge des Merveilles (2,121 m) for the second bivouac. Day 3 descends back down to the cars at Pont du Countet.',description_fr:'Une boucle de 28,3 km depuis le Pont du Countet (1 684 m) : le jour 1 monte jusqu’au Refuge de Nice (2 223 m) pour le premier bivouac. Le jour 2 est la partie difficile — direction le Refuge de Valmasque (2 225 m, un possible bivouac de repli si le groupe est fatigué) puis le Refuge des Merveilles (2 121 m) pour la deuxième nuit. Le jour 3 redescend jusqu’aux voitures au Pont du Countet.',elevation_profile:[1684,1740,1840,2010,2190,2380,2560,2688,2500,2320,2100,1880,1684]},wildlife:{title:'Wildlife to watch for · Faune à observer',description_en:'Walk quietly and give wildlife space. You may spot ibex, chamois and marmots; scan the sky for golden eagles.',description_fr:'Marchez discrètement et gardez vos distances. Vous pourrez apercevoir bouquetins, chamois et marmottes.',species:['Alpine ibex · Bouquetin','Chamois','Alpine marmot · Marmotte','Golden eagle · Aigle royal','Bearded vulture · Gypaète barbu']}};

$('#party-size').value=partySize;$('#party-size-value').textContent=partySize;$('#comfort-mode').value=settings.mode;$('#tent-capacity').value=settings.tent;scene();
load(DEFAULT_DATA);
loadHikeData(DEFAULT_DATA);
