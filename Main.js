// Función para actualizar el termómetro
function updateTemperature(temp) {
    const fill = document.getElementById('thermo-fill');
    const bulb = document.getElementById('thermo-bulb');
    // Calcular altura del mercurio (156px es la altura total del tubo)
    const height = Math.min(Math.max((temp + 20) * (156/70), 0), 156);
    fill.setAttribute('height', height);
    fill.setAttribute('y', 178 - height);
}

// Función para actualizar la humedad
function updateHumidity(hum) {
    const fill = document.getElementById('hum-fill');
    // 190px es la altura total de la gota
    const height = (hum/100) * 190;
    fill.setAttribute('y', 190 - height);
    fill.setAttribute('height', height);
}

// Función para actualizar UV
function updateUV(uv) {
    const uvDisplay = document.getElementById('uv-value');
    const uvLevel = document.getElementById('uv-level');
    const uvAdvice = document.getElementById('uv-advice');
    
    uvDisplay.textContent = uv.toFixed(1);
    
    // Determinar nivel UV
    if (uv <= 2) {
        uvLevel.textContent = 'Bajo';
        uvAdvice.textContent = 'No se requiere protección';
    } else if (uv <= 5) {
        uvLevel.textContent = 'Moderado';
        uvAdvice.textContent = 'Use protector solar';
    } else if (uv <= 7) {
        uvLevel.textContent = 'Alto';
        uvAdvice.textContent = 'Protección necesaria';
    } else {
        uvLevel.textContent = 'Muy Alto';
        uvAdvice.textContent = '¡Evite exposición!';
    }
}

// Función para actualizar datos en tiempo real
function initRealTimeUpdates() {
    const climaRef = ref(db, 'monitoreo_clima');
    
    onValue(climaRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        const lastKey = Object.keys(data).pop();
        const lastData = data[lastKey];
        
        console.log('Datos recibidos:', lastData);
        
        // Actualizar visualizaciones
        updateTemperature(lastData.temperatura);
        updateHumidity(lastData.humedad);
        updateUV(lastData.uv);
        
        // Actualizar lecturas
        document.getElementById('temp-readout').textContent = `${lastData.temperatura.toFixed(1)}°C`;
        document.getElementById('condition-label').textContent = lastData.estado_actual || '—';
        document.getElementById('hum-readout').textContent = `${lastData.humedad}%`;
    });
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando monitoreo...');
    initRealTimeUpdates();
});

/* Utilidad: clase temporal para “nudge” */
function nudge(el, cls, ms = 280) {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/* =========================
   TEMPERATURA (termómetro)
   ========================= */
(function () {
  const fill = document.getElementById('thermo-fill');
  const bulb = document.getElementById('thermo-bulb');
  const iconRoot = document.getElementById('weather-icon');
  const tempRead = document.getElementById('temp-readout');
  const condLbl = document.getElementById('condition-label');
  const cardT = document.getElementById('card-temp');

  if (!fill || !bulb || !iconRoot || !tempRead || !condLbl || !cardT) return;

  const MIN_C = -5, MAX_C = 45;

  // Íconos del clima con clases animadas
  const WX_ICONS = {
    soleado:
      `<svg viewBox="0 0 128 128" class="wx-sun" aria-hidden="true">
         <g class="rays" stroke="#FFD54F" stroke-width="10" stroke-linecap="round">
           <line x1="64" y1="6"  x2="64" y2="26"/>
           <line x1="64" y1="102" x2="64" y2="122"/>
           <line x1="6"  y1="64" x2="26" y2="64"/>
           <line x1="102" y1="64" x2="122" y2="64"/>
           <line x1="23" y1="23" x2="37" y2="37"/>
           <line x1="91" y1="91" x2="105" y2="105"/>
           <line x1="23" y1="105" x2="37" y2="91"/>
           <line x1="91" y1="37" x2="105" y2="23"/>
         </g>
         <circle cx="64" cy="64" r="26" fill="#FFD54F"/>
       </svg>`,
    parcial:
      `<svg viewBox="0 0 128 128" aria-hidden="true">
         <circle cx="44" cy="44" r="22" fill="#FFD54F"/>
         <g class="wx-cloud"><path d="M30 90h64a20 20 0 0 0 0-40c-2 0-4 0-6 1a30 30 0 0 0-58 8A22 22 0 0 0 30 90Z" fill="#B0BEC5"/></g>
       </svg>`,
    nublado:
      `<svg viewBox="0 0 128 128" aria-hidden="true">
         <g class="wx-cloud"><path d="M28 96h72a22 22 0 0 0 0-44c-3 0-5 0-8 1a32 32 0 0 0-62 9A24 24 0 0 0 28 96Z" fill="#B0BEC5"/></g>
       </svg>`,
    lluvia:
      `<svg viewBox="0 0 128 128" class="wx-rain" aria-hidden="true">
         <g class="wx-cloud"><path d="M28 80h72a22 22 0 0 0 0-44c-3 0-5 0-8 1a32 32 0 0 0-62 9A24 24 0 0 0 28 80Z" fill="#B0BEC5"/></g>
         <g fill="#64B5F6">
           <path class="drop d1" d="M42 92l-7 18h7l7-18h-7z"/>
           <path class="drop d2" d="M64 92l-7 18h7l7-18h-7z"/>
           <path class="drop d3" d="M86 92l-7 18h7l7-18h-7z"/>
         </g>
       </svg>`,
    tormenta:
      `<svg viewBox="0 0 128 128" class="wx-storm" aria-hidden="true">
         <g class="wx-cloud"><path d="M28 80h72a22 22 0 0 0 0-44c-3 0-5 0-8 1a32 32 0 0 0-62 9A24 24 0 0 0 28 80Z" fill="#B0BEC5"/></g>
         <polygon class="bolt" points="54,80 82,80 68,100 84,100 52,124 62,104 48,104" fill="#FFD54F"/>
       </svg>`,
    niebla:
      `<svg viewBox="0 0 128 128" aria-hidden="true">
         <g class="wx-cloud"><path d="M28 80h72a22 22 0 0 0 0-44c-3 0-5 0-8 1a32 32 0 0 0-62 9A24 24 0 0 0 28 80Z" fill="#B0BEC5"/></g>
         <g stroke="#CFD8DC" stroke-width="10" stroke-linecap="round">
           <line x1="18" y1="96" x2="110" y2="96"/>
           <line x1="10" y1="114" x2="118" y2="114"/>
         </g>
       </svg>`,
    nieve:
      `<svg viewBox="0 0 128 128" class="wx-snow" aria-hidden="true">
         <g class="wx-cloud"><path d="M28 80h72a22 22 0 0 0 0-44c-3 0-5 0-8 1a32 32 0 0 0-62 9A24 24 0 0 0 28 80Z" fill="#B0BEC5"/>
         </g>
            <g fill="#E3F2FD">
              <circle class="flake f1" cx="48" cy="96" r="7"/>
              <circle class="flake f2" cx="70" cy="104" r="7"/>
           <circle class="flake f3" cx="92" cy="96" r="7"/>
         </g>
       </svg>`, 
  };

  function colorForTemp(t) {
    // sin verde: azul -> celeste -> amarillo -> naranja -> rojo
    if (t <= 0) return '#4fc3f7';
    if (t <= 10) return '#29b6f6';
    if (t <= 20) return '#FFD54F';
    if (t <= 30) return '#FFA726';
    return '#EF5350';
  }

  function setCondition(condition) {
    const key = (condition || '').toLowerCase();
    iconRoot.innerHTML = WX_ICONS[key] || WX_ICONS['nublado'];
    condLbl.textContent = key ? key.charAt(0).toUpperCase() + key.slice(1) : '—';
  }

  function renderThermometer(tempC) {
    const t = Math.max(MIN_C, Math.min(MAX_C, Number(tempC)));
    const tubeTop = 22, tubeHeight = 156;
    const pct = (t - MIN_C) / (MAX_C - MIN_C);
    const fillH = Math.max(0, Math.min(tubeHeight, tubeHeight * pct));
    const fillY = tubeTop + (tubeHeight - fillH);

    fill.setAttribute('y', fillY.toFixed(1));
    fill.setAttribute('height', fillH.toFixed(1));
    cardT.style.setProperty('--thermo-color', colorForTemp(t));

    tempRead.textContent = `${t.toFixed(1)} °C`;

    nudge(cardT, 'thermo-nudge', 280);
  }

  // API pública
  window.updateTemperature = function (tempC, condition) {
    renderThermometer(tempC);
    setCondition(condition);
  };
})();

updateTemperature(10, 'nieve'); // °C y condición

/* =====================
  HUMEDAD (gota)
   ===================== */
(function () {
  const fill = document.getElementById('hum-fill');
  const wave = document.getElementById('hum-wave');
  const readout = document.getElementById('hum-readout');
  const status = document.getElementById('hum-status');
  const cardHum = document.getElementById('card-hum');
  if (!fill || !wave || !readout || !status || !cardHum) return;

  const SVG_HEIGHT = 190; // viewBox 0..190

  function labelForHum(p) {
    if (p < 30) return 'Seco';
    if (p < 60) return 'Confort';
    if (p < 80) return 'Húmedo';
    return 'Muy húmedo';
  }

  function gradientForHum(p) {
    const sat = Math.round(60 + 30 * (p / 100));
    const col1 = `hsl(210 ${sat}% 70%)`, col2 = `hsl(210 ${sat}% 55%)`;
    const svg = cardHum.querySelector('.drop-svg');
    const stops = svg.querySelectorAll('#hum-gradient stop');
    if (stops.length === 2) { stops[0].setAttribute('stop-color', col1); stops[1].setAttribute('stop-color', col2); }
  }

  function renderHumidity(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    readout.textContent = `${p.toFixed(0)}%`;
    status.textContent = labelForHum(p);

    const fillHeight = (SVG_HEIGHT * p) / 100;
    const fillY = SVG_HEIGHT - fillHeight;

    // sobre-dimensionar para evitar cortes
    fill.setAttribute('y', (fillY - 1).toFixed(1));
    fill.setAttribute('height', (fillHeight + 2).toFixed(1));

    const amp = Math.max(0, 8 * (1 - p / 100));
    const waveY = Math.min(SVG_HEIGHT - 34, Math.max(44, fillY + 6));
    const d = `M-20 ${waveY} C20 ${waveY - amp}, 110 ${waveY + amp}, 150 ${waveY} V${SVG_HEIGHT} H-20 Z`;
    wave.setAttribute('d', d);
    wave.style.opacity = p >= 98 ? 0 : 0.12;

    gradientForHum(p);
  }

  window.updateHumidity = renderHumidity;
})();

updateHumidity(100);

/* ====== RADIACIÓN UV: lógica (Sol pulsante + lista de tips) ====== */
(function () {
  const root = document.getElementById('card-uv');
  const value = document.getElementById('uv-value');
  const level = document.getElementById('uv-level');
  const advice = document.getElementById('uv-advice');

  if (!root || !value || !level || !advice) {
    console.warn('[uv] Elementos UV no encontrados. Verifica IDs en el HTML.');
    return;
  }

  // Catálogo por nivel UV
  function uvCategory(uv) {
    if (uv < 3) return {
      key: 'bajo', name: 'Bajo', color: '#FFF59D',
      tips: [
        'Protección mínima necesaria.',
        'Gafas de sol opcionales.',
      ]
    };
    if (uv < 6) return {
      key: 'mod', name: 'Moderado', color: '#FFB74D',
      tips: [
        'Usa gafas de sol.',
        'Considera bloqueador SPF 30+.',
      ]
    };
    if (uv < 8) return {
      key: 'alto', name: 'Alto', color: '#EF5350',
      tips: [
        'SPF 50+ y reaplicar cada 2h.',
        'Gorra o sombrero recomendable.',
        'Evita el sol del mediodía.',
      ]
    };
    if (uv < 10) return {
      key: 'muy', name: 'Muy alto', color: '#AB47BC',
      tips: [
        'Reduce exposición directa.',
        'Busca sombra y usa manga larga.',
        'SPF 50+ obligatorio.',
      ]
    };
    return {
      key: 'ext', name: 'Extremo', color: '#6A1B9A',
      tips: [
        'Evita exposición directa.',
        'Protección completa: sombrero, gafas, ropa UV.',
        'SPF 50+ y reaplicar con frecuencia.',
      ]
    };
  }

  // Render UI
  function renderUV(uv) {
    const u = Math.max(0, Number(uv) || 0);
    const cat = uvCategory(u);

    // Color del sol/rayos
    root.style.setProperty('--uv-color', cat.color);

    // Valor visible
    value.textContent = `${u.toFixed(1)} UV`;

    // Etiquetas
    level.textContent = cat.name;

    // Recomendaciones como lista
    advice.innerHTML = `<ul>${cat.tips.map(t => `<li>${t}</li>`).join('')}</ul>`;

    // data-uv para CSS (alarga rayos según nivel)
    root.setAttribute('data-uv', cat.key);
  }

  // API pública
  window.updateUV = renderUV;

  // Ejemplo inicial (ajusta o elimina)
  renderUV(6);
})();

/* ================================
   Calendario semanal (week.js)
   ================================ */

const weekData = [
  { date: '2025-10-20', state: 'Soleado', tmax: 28, tmin: 19, hum: 62, uv: 6 },
  { date: '2025-10-21', state: 'Parcialmente nublado', tmax: 27, tmin: 18, hum: 65, uv: 5 },
  { date: '2025-10-22', state: 'Lluvia', tmax: 24, tmin: 17, hum: 82, uv: 3 },
  { date: '2025-10-23', state: 'Tormenta', tmax: 23, tmin: 16, hum: 85, uv: 2 },
  { date: '2025-10-24', state: 'Nublado', tmax: 25, tmin: 18, hum: 70, uv: 4 },
  { date: '2025-10-25', state: 'Soleado', tmax: 29, tmin: 20, hum: 58, uv: 7 },
  { date: '2025-10-26', state: 'Nieve', tmax: 5, tmin: -1, hum: 60, uv: 1 },
];

/* ---- Config y utilidades de formato ---- */
const dtfDay = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const dtfDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

function toLocalDate(iso) {
  // ISO "YYYY-MM-DD" -> Date local a medianoche (sin problemas de TZ)
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayNameEs(d) {
  const name = dtfDay.format(d); // ej. "miércoles"
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function fmtFecha(iso) {
  const d = toLocalDate(iso);
  // ej. "20 oct." -> quitar punto y capitalizar primera letra
  let out = dtfDate.format(d).replace(/\.$/, '');
  return out.replace(/\b\p{L}/u, m => m.toUpperCase());
}

function esHoyISO(iso) {
  const t = new Date();
  const d = toLocalDate(iso);
  return d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate();
}

/* ---- Icono por estado (emojis para cero dependencias) ---- */
function iconoPorEstado(state) {
  const s = (state || '').toLowerCase();
  if (s.includes('tormenta')) return '⛈️';
  if (s.includes('lluv')) return '🌧️';
  if (s.includes('nieve')) return '❄️';
  if (s.includes('nublado') && s.includes('parcial')) return '⛅';
  if (s.includes('nublado')) return '☁️';
  if (s.includes('niebla') || s.includes('bruma')) return '🌫️';
  if (s.includes('sole')) return '☀️';
  return '🌤️';
}

/* ---- Resaltado de UV (opcional) ---- */
function uvSeverity(uv) {
  const u = Number(uv) || 0;
  if (u < 3) return 'uv-low';
  if (u < 6) return 'uv-mod';
  if (u < 8) return 'uv-high';
  if (u < 10) return 'uv-very';
  return 'uv-ext';
}

/* ---- Render principal ----
   data: [{ date:'YYYY-MM-DD', state:'Soleado', tmax:28, tmin:19, hum:62, uv:6 }, ...]
   opts.containerId: id del grid (por defecto 'week-grid')
   opts.autoscrollToday: boolean (móvil con scroll horizontal)
---------------------------------------- */
function renderWeek(data, opts = {}) {
  const { containerId = 'week-grid', autoscrollToday = true } = opts;
  const grid = document.getElementById(containerId);
  if (!grid) return;

  grid.innerHTML = '';

  (data || []).forEach(item => {
    const d = toLocalDate(item.date);
    const isToday = esHoyISO(item.date);

    const dayName = isToday ? 'Hoy' : dayNameEs(d);
    const dayDate = fmtFecha(item.date);
    const icon = iconoPorEstado(item.state);
    const uvClass = uvSeverity(item.uv);

    const el = document.createElement('article');
    el.className = 'day' + (isToday ? ' is-today' : '');

    el.innerHTML = `
      <header class="day-header">
        <span class="day-name">${dayName}</span>
        <span class="day-date">${dayDate}</span>
      </header>
      <div class="day-divider"></div>
      <div class="day-body">
        <div class="day-state">
          <span class="state-icon" aria-hidden="true">${icon}</span>
          <span class="state-label">${item.state || '—'}</span>
        </div>
        <div class="metrics">
          <div class="metric"><span>Máx</span><strong>${Math.round(item.tmax)}°C</strong></div>
          <div class="metric"><span>Mín</span><strong>${Math.round(item.tmin)}°C</strong></div>
          <div class="metric"><span>Humedad</span><strong>${Math.round(item.hum)}%</strong></div>
          <div class="metric ${uvClass}"><span>UV</span><strong>${Number(item.uv).toString()}</strong></div>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });

  // Auto-scroll a “Hoy” si hay carrusel horizontal (en móvil)
  if (autoscrollToday) {
    const todayCard = grid.querySelector('.day.is-today');
    const canScroll = grid.scrollWidth > grid.clientWidth;
    if (todayCard && canScroll) {
      todayCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }
}

/* ---- API mínima para integrar con tu app ---- */
function setWeekData(data, opts) {
  renderWeek(data, opts);
}

/* ---- Demo opcional ---- */
const demoWeekData = [
  { date: '2025-10-20', state: 'Soleado', tmax: 28, tmin: 19, hum: 62, uv: 6 },
  { date: '2025-10-21', state: 'Parcialmente nublado', tmax: 27, tmin: 18, hum: 65, uv: 5 },
  { date: '2025-10-22', state: 'Lluvia', tmax: 24, tmin: 17, hum: 82, uv: 3 },
  { date: '2025-10-23', state: 'Tormenta', tmax: 23, tmin: 16, hum: 85, uv: 2 },
  { date: '2025-10-24', state: 'Nublado', tmax: 25, tmin: 18, hum: 70, uv: 4 },
  { date: '2025-10-25', state: 'Soleado', tmax: 29, tmin: 20, hum: 58, uv: 7 },
  { date: '2025-10-26', state: 'Nieve', tmax: 5, tmin: -1, hum: 60, uv: 1 },
];

// Descomenta para ver demo inmediata:
// renderWeek(demoWeekData);

/* ---- Expone en window ---- */
window.renderWeek = renderWeek;
window.setWeekData = setWeekData;

renderWeek(weekData);

/* =========================
   Calendario mensual (month)
   ========================= */

/* ==== Utilidades de fecha ==== */
const DTF_MONTH = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const DTF_DOW   = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }); // lun., mar., ...
const DTF_DAY   = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
function toISO(d){ return d.toISOString().slice(0,10); }
function esHoy(d){ const t=new Date(); return d.getFullYear()==t.getFullYear()&&d.getMonth()==t.getMonth()&&d.getDate()==t.getDate(); }

function dowShort(d){
  // Intl da "lun.", quitamos punto y capitalizamos
  return DTF_DOW.format(d).replace(/\.$/,'').replace(/^\p{L}/u, m=>m.toUpperCase());
}
function dateLabel(d){
  return DTF_DAY.format(d).replace(/\.$/,'').replace(/^\p{L}/u, m=>m.toUpperCase());
}

/* ==== Icono por estado ==== */
function iconoPorEstado(state) {
  const s = (state || '').toLowerCase();
  if (s.includes('tormenta')) return '⛈️';
  if (s.includes('lluv'))     return '🌧️';
  if (s.includes('nieve'))    return '❄️';
  if (s.includes('nublado') && s.includes('parcial')) return '⛅';
  if (s.includes('nublado'))  return '☁️';
  if (s.includes('niebla') || s.includes('bruma')) return '🌫️';
  if (s.includes('sole'))     return '☀️';
  return '🌤️';
}

/* ==== Render mensual ====
   monthDate: Date dentro del mes a dibujar
   data: [{ date:'YYYY-MM-DD', t: 24, state:'Soleado' }, ...]
*/
function renderMonthCalendar(monthDate, data=[]) {
  const grid  = document.getElementById('month-grid');
  const title = document.getElementById('month-title');
  if (!grid || !title) return;

  const month = startOfMonth(monthDate);
  const days  = daysInMonth(month);
  title.textContent = `Pronóstico del mes · ${DTF_MONTH.format(month).replace(/^\p{L}/u,m=>m.toUpperCase())}`;

  // Índice rápido por fecha ISO
  const map = new Map((data||[]).map(d => [d.date, d]));

  grid.innerHTML = '';

  // Offset para que el mes empiece en Lunes (1..7)
  let offset = month.getDay(); // 0=Dom ... 6=Sab
  offset = (offset === 0) ? 6 : offset - 1;

  // Relleno antes del día 1
  for (let i=0;i<offset;i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'mday empty';
    placeholder.setAttribute('aria-hidden','true');
    grid.appendChild(placeholder);
  }

  // Celdas de los días
  for (let d=1; d<=days; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    const iso  = toISO(date);
    const rec  = map.get(iso);

    const el = document.createElement('article');
    el.className = 'mday' + (esHoy(date) ? ' today':'') + (!rec ? ' empty':'');

    const dow  = dowShort(date);
    const lab  = dateLabel(date);
    const icon = iconoPorEstado(rec?.state);
    const temp = (rec?.t != null) ? `${Math.round(rec.t)}°C` : '—';
    const state= rec?.state || 'Sin datos';

    el.innerHTML = `
      <header class="mday-head">
        <span class="mday-dow">${dow}</span>
        <span class="mday-date">${lab}</span>
      </header>
      <div class="mday-body">
        <div class="mday-state"><span class="mday-icon">${icon}</span><span>${state}</span></div>
        <div class="mday-temp"><span>Temp</span><strong>${temp}</strong></div>
      </div>
    `;
    grid.appendChild(el);
  }
}

/* ==== Navegación ==== */
let currentMonth = new Date(); // mes actual mostrado
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

btnPrev?.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1);
  renderMonthCalendar(currentMonth, monthData);
});
btnNext?.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1);
  renderMonthCalendar(currentMonth, monthData);
});

/* ==== API pública para que tu app pase datos reales ==== */
function setMonthData(data){
  // data: [{date:'YYYY-MM-DD', t:Number, state:String}, ...]
  renderMonthCalendar(currentMonth, data);
}
window.setMonthData = setMonthData;

/* ==== Demo local (puedes borrar o reemplazar) ==== */
const monthData = (() => {
  const base = startOfMonth(new Date());
  const mk = (d, t, s) => ({
    date: new Date(base.getFullYear(), base.getMonth(), d).toISOString().slice(0,10),
    t, state: s
  });
  return [
    mk(1,  26, 'Soleado'),
    mk(2,  24, 'Parcialmente nublado'),
    mk(3,  22, 'Lluvia'),
    mk(5,  23, 'Nublado'),
    mk(7,  21, 'Lluvia'),
    mk(9,  25, 'Soleado'),
    mk(12, 27, 'Soleado'),
    mk(14, 19, 'Niebla'),
    mk(16, 18, 'Lluvia'),
    mk(18, 17, 'Tormenta'),
    mk(20, 22, 'Parcialmente nublado'),
    mk(22, 23, 'Nublado'),
    mk(24, 28, 'Soleado'),
    mk(26,  5, 'Nieve'),
    mk(28, 29, 'Soleado'),
  ];
})();

/* Render inicial */
renderMonthCalendar(currentMonth, monthData);
