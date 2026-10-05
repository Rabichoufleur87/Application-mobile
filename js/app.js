/* Tilt — le pense-bête du foyer (prototype PWA, sans framework) */
(() => {
  'use strict';
  const D = window.TILT_DATA;
  const STORE_KEY = 'tilt.v1';
  const app = document.getElementById('app');

  /* ================= Utilitaires ================= */
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = () => startOfDay(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const plural = (n, w, p) => `${n} ${n > 1 ? (p || w + 's') : w}`;
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const DAY_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const WEEK = [1, 2, 3, 4, 5, 6, 0];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const fmtDate = d => `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtShort = d => `${DAY_SHORT[d.getDay()].toLowerCase()}. ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}${MONTHS[d.getMonth()].length > 4 ? '.' : ''}`;
  const relDay = d => { const n = diffDays(today(), d); return n === 0 ? 'Aujourd’hui' : n === 1 ? 'Demain' : n === -1 ? 'Hier' : cap(fmtDate(d)); };
  const fh = x => { const h = Math.floor(x), m = Math.round((x - h) * 60); return m ? `${h}h${pad(m)}` : `${h}h`; };

  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  const holCache = {};
  function holidays(y) {
    if (holCache[y]) return holCache[y];
    const e = easter(y), m = {};
    [[new Date(y, 0, 1), 'Jour de l’An'], [addDays(e, 1), 'Lundi de Pâques'], [new Date(y, 4, 1), 'Fête du Travail'],
     [new Date(y, 4, 8), 'Victoire 1945'], [addDays(e, 39), 'Ascension'], [addDays(e, 50), 'Lundi de Pentecôte'],
     [new Date(y, 6, 14), 'Fête nationale'], [new Date(y, 7, 15), 'Assomption'], [new Date(y, 10, 1), 'Toussaint'],
     [new Date(y, 10, 11), 'Armistice'], [new Date(y, 11, 25), 'Noël']].forEach(([d, n]) => { m[key(d)] = n; });
    return (holCache[y] = m);
  }
  const holidayName = d => holidays(d.getFullYear())[key(d)];
  function nextHoliday(from) {
    for (let i = 0; i < 400; i++) { const d = addDays(from, i); const n = holidayName(d); if (n) return { date: d, name: n, in: i }; }
  }
  function lastSunday(y, m) { const d = new Date(y, m + 1, 0); d.setDate(d.getDate() - d.getDay()); return d; }
  function nextDST(from) {
    const y = from.getFullYear();
    const d = [lastSunday(y, 2), lastSunday(y, 9), lastSunday(y + 1, 2)].find(x => diffDays(from, x) >= 0);
    return { date: d, back: d.getMonth() === 9 };
  }
  function sunTimes(date, lat, lon) {
    const rad = Math.PI / 180;
    const jd = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) / 864e5 + 2440587.5;
    const n = Math.round(jd - 2451545 + 0.0008);
    const J = n - lon / 360;
    const M = (357.5291 + 0.98560028 * J) % 360;
    const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const Jt = 2451545 + J + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
    const cw = (Math.sin(-0.83 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cw))) / rad;
    const toDate = j => new Date((j - 2440587.5) * 864e5);
    return { rise: toDate(Jt - w / 360), set: toDate(Jt + w / 360) };
  }
  function haversine(a, b) {
    const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } };

  /* ================= Icônes ================= */
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="m6 7 1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M10 11v6M14 11v6"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.4 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
    cloudSun: '<path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5M18.4 5.6l-1 1"/><path d="M8.2 10.2a4 4 0 0 1 7.3-2.4"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.5-1A4 4 0 0 0 9 20z"/>',
    rain: '<path d="M7 15.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.4 6.6 4.5 4.5 0 0 0 7 15.5z"/><path d="m8 18.5-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
    storm: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.4 5.6 4.5 4.5 0 0 0 7 14.5z"/><path d="m12.5 14-2 3.5h3l-2 3.5"/>',
    fog: '<path d="M4 9h16M3 13h18M6 17h12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevL: '<path d="m15 5-7 7 7 7"/>',
    chevR: '<path d="m9 5 7 7-7 7"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z"/>',
    pill: '<rect x="2.8" y="8.3" width="18.4" height="7.4" rx="3.7" transform="rotate(-45 12 12)"/><path d="m8.5 8.5 7 7"/>',
    paw: '<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 11c-3 0-5.5 4-5.5 6.2C6.5 19 8 20 9.5 20c1.2 0 1.6-.6 2.5-.6s1.3.6 2.5.6c1.5 0 3-1 3-2.8C17.5 15 15 11 12 11z"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-6.5 9.5-8"/>',
    car: '<path d="M4 15.5v-3.2l1.9-4.8A2.2 2.2 0 0 1 8 6h8a2.2 2.2 0 0 1 2.1 1.5l1.9 4.8v3.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4.5 12h15M6.5 16.5v2M17.5 16.5v2"/>',
    bag: '<path d="M5 8h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14.5 8.5l2 2"/>',
    umbrella: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/>',
    phone: '<path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 5.2 5.2l1.4-2.1 4.2 1.6V17a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2"/><circle cx="16" cy="13.5" r="1.2"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8h13v-8M10 20v-4.5h4V20"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2.5"/><path d="M16 8V5.5A2 2 0 0 0 14 3.5H5.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8"/>',
    alarm: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M4 4.5 6.5 2.5M20 4.5l-2.5-2"/>',
    nav: '<path d="m3.5 11 17-7.5-7.5 17-2-7.5z"/>',
    bed: '<path d="M3 19V7M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="2"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7"/>',
    heat: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M8 6v12M12 6v12M16 6v12M6 18v2M18 18v2"/>',
    flame: '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6.5-4.5-11-2.5 2-3.5 4.5-3.5 7-1-.5-1.8-1.5-2-3-1.5 1.5-3 4-3 7A6.5 6.5 0 0 0 12 21z"/>',
    drop: '<path d="M12 3.5s6.5 7 6.5 11.3A6.5 6.5 0 0 1 5.5 14.8C5.5 10.5 12 3.5 12 3.5z"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    bread: '<path d="M6 20h12a1 1 0 0 0 1-1v-7.3A3.5 3.5 0 0 0 17.5 5h-11A3.5 3.5 0 0 0 5 11.7V19a1 1 0 0 0 1 1z"/>',
    fish: '<path d="M4 12c3-4.5 7-6 10-6s5.5 2.5 7 6c-1.5 3.5-4 6-7 6s-7-1.5-10-6z"/><path d="M4 12 2 9.5M4 12l-2 2.5"/><circle cx="16.5" cy="11" r=".8"/>',
    jar: '<path d="M7 4h10v3H7z"/><path d="M6.5 7h11A1.5 1.5 0 0 1 19 8.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8.5A1.5 1.5 0 0 1 6.5 7zM5 12h14"/>',
    cup: '<path d="M6 4h12l-1.5 15.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5zM6.5 9h11"/>',
    spray: '<path d="M9 9h6v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M10 9V6h4l3-2M19 7h1.5M19 10h1.5"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4.5" rx="1"/><path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5M12 8v13"/><path d="M12 8C10.5 4 7 4 7 6s3 2 5 2c2 0 5 0 5-2s-3.5-2-5 2z"/>',
    badge: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.7-1.7 2.2-2.5 4-2.5s3.3.8 4 2.5"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    swim: '<path d="M2 18c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1"/><path d="M2 14.5c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1"/><circle cx="16" cy="6" r="2"/><path d="m6 12 4-5 3 3"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7.5 4 3-1.5 4.5h-5L8 10.5z"/>',
    note: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    shield: '<path d="M12 3 19.5 6v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/><circle cx="12" cy="17" r="1.2"/>',
    cross: '<path d="M9 3.5h6v5.5h5.5v6H15v5.5H9V15H3.5V9H9z"/>',
    sunset: '<path d="M3 18h18M2.5 15h2M19.5 15h2M5.6 11.6l1 1M17.4 12.6l1-1"/><path d="M7.5 15a4.5 4.5 0 0 1 9 0"/><path d="M12 3v6M9.5 6.5 12 9l2.5-2.5"/>',
    school: '<path d="m2.5 9 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11v5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2v-5M21.5 9v6"/>',
    heart: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
    shirt: '<path d="M8.5 3.5 4 6l1.5 4H8v10.5h8V10h2.5L20 6l-4.5-2.5a3.5 3.5 0 0 1-7 0z"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.2"/>',
    thermo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
    glass: '<path d="M8 3h8l-.5 5a3.5 3.5 0 0 1-7 0zM12 11.5V20M8.5 20.5h7"/>',
    recycle: '<path d="M7 19H4.8a1.6 1.6 0 0 1-1.4-2.4L6.6 11"/><path d="m4 12 2.6-1 1 2.6"/><path d="M10.6 4.8a1.6 1.6 0 0 1 2.8 0L16.8 11"/><path d="m14.4 10.4 2.4.6.6-2.6"/><path d="M14 19h5.2a1.6 1.6 0 0 0 1.4-2.4l-.9-1.5"/><path d="m16 21-2-2 2-2"/>',
  };
  const ic = (n, style = '') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${style ? ` style="${style}"` : ''}>${I[n] || I.bell}</svg>`;
  const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* ================= État ================= */
  function load() { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
  let S = load();
  const U = { open: new Set(), closed: new Set(), tab: 'today', seg: 'week', enter: true, wx: null, stores: null, storesLive: false, ob: null, pendingRender: false };

  const ACTIVITIES = {
    Piscine: { icon: 'swim', bag: 'Sac de piscine', kit: 'maillot, serviette, bonnet' },
    Foot: { icon: 'ball', bag: 'Sac de foot', kit: 'crampons, protège-tibias, gourde' },
    Danse: { icon: 'sparkle', bag: 'Sac de danse', kit: 'chaussons, tenue, élastique' },
    Musique: { icon: 'note', bag: 'Partitions', kit: 'instrument et cahier' },
    Judo: { icon: 'shield', bag: 'Kimono', kit: 'kimono, ceinture, claquettes' },
    Tennis: { icon: 'ball', bag: 'Sac de tennis', kit: 'raquette, balles, gourde' },
  };

  const coords = () => {
    const p = S.profile;
    if (p.coords) return p.coords;
    const c = D.CITIES.find(x => x.id === p.cityId) || D.CITIES[0];
    return { lat: c.lat, lon: c.lon };
  };
  const city = () => D.CITIES.find(c => c.id === S.profile.cityId) || D.CITIES[0];
  const member = id => (S.members || []).find(m => m.id === id);

  /* ================= Collectes ================= */
  function binsFromCity(c) {
    return ['om', 'emb', 'bio'].filter(id => c.bins[id]).map(id => ({
      id, days: [...c.bins[id].days], freq: c.bins[id].freq || 'weekly', parity: c.bins[id].parity || 'even', enabled: true,
    }));
  }
  function binsOn(d) {
    return (S.profile.bins || []).filter(b => b.enabled !== false && b.days.includes(d.getDay()) &&
      (b.freq !== 'biweekly' || ((isoWeek(d) % 2 === 0) === (b.parity === 'even'))));
  }
  function nextCollections(from, n = 21) {
    const out = [];
    for (let i = 0; i < n; i++) { const d = addDays(from, i); binsOn(d).forEach(b => out.push({ date: d, bin: b, in: i })); }
    return out;
  }
  const binFg = id => id === 'emb' ? '#3A2A00' : '#fff';
  function binSvg(id, size = 64) {
    const c = D.BIN_TYPES[id].color;
    return `<svg class="bin-svg" viewBox="0 0 64 76" style="width:${size}px;height:${size * 1.19}px" aria-hidden="true">
      <g class="lid"><rect x="6" y="10" width="52" height="8" rx="3" fill="${c}"/><rect x="24" y="5" width="16" height="6" rx="2" fill="${c}"/></g>
      <path d="M10 20h44l-4 47a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="${c}"/>
      <path d="M22 31v30M32 31v30M42 31v30" stroke="rgba(0,0,0,.2)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="19" cy="72" r="4" fill="var(--ink)"/><circle cx="45" cy="72" r="4" fill="var(--ink)"/></svg>`;
  }

  /* ================= Rappels ================= */
  function occursOn(r, d) {
    const rec = r.rec;
    switch (rec.type) {
      case 'daily': return true;
      case 'weekly': return rec.days.includes(d.getDay());
      case 'every': { const x = diffDays(parseKey(rec.start), d); return x >= 0 && x % rec.n === 0; }
      case 'monthly': return d.getDate() === rec.day;
      case 'yearly': return d.getMonth() + 1 === rec.m && d.getDate() === rec.d;
      case 'once': return key(d) === rec.date;
      default: return false;
    }
  }
  function nextOcc(r, from = today()) {
    for (let i = 0; i < 400; i++) { const d = addDays(from, i); if (occursOn(r, d)) return d; }
    return null;
  }
  function recLabel(rec) {
    switch (rec.type) {
      case 'daily': return 'Tous les jours';
      case 'weekly': return rec.days.length === 7 ? 'Tous les jours' : 'Chaque ' + WEEK.filter(d => rec.days.includes(d)).map(d => DAY_NAMES[d]).join(', ');
      case 'every': return rec.n % 7 === 0 ? (rec.n === 7 ? 'Chaque semaine' : `Toutes les ${rec.n / 7} semaines`) : rec.n >= 28 && rec.n % 30 === 0 ? `Tous les ${rec.n / 30} mois` : `Tous les ${rec.n} jours`;
      case 'monthly': return `Chaque mois, le ${rec.day === 1 ? '1er' : rec.day}`;
      case 'yearly': return `Chaque année, le ${rec.d} ${MONTHS[rec.m - 1]}`;
      case 'once': return cap(fmtDate(parseKey(rec.date)));
      default: return '';
    }
  }
  function guessIcon(t) {
    const s = norm(t);
    const map = [['medic|traitement|pilule|cachet|vitamine', 'pill'], ['appel|telephon', 'phone'], ['poubelle|dechet|bac', 'trash'],
      ['course|acheter|supermarche|drive', 'cart'], ['chien|chat|veto|croquette|litiere', 'paw'], ['anniv|cadeau|fete', 'gift'],
      ['rdv|rendez|dentiste|medecin|docteur|kine', 'calendar'], ['plante|arros|jardin', 'leaf'], ['voiture|pneu|garage|essence|controle', 'car'],
      ['linge|lessive|machine', 'shirt'], ['sport|salle|muscu|courir|footing', 'dumbbell'], ['piscine|nager', 'swim'], ['ecole|devoir|cantine', 'school'],
      ['facture|payer|impot|banque|loyer', 'card'], ['four|cuisine|repas|diner', 'flame']];
    const f = map.find(([re]) => new RegExp(re).test(s));
    return f ? f[1] : 'bell';
  }

  /* Saisie en langage naturel : « appeler maman dimanche 18h », « tous les lundis sortir le chien à 7h30 » */
  function parseQuick(text) {
    const src = text.trim();
    if (!src) return null;
    let t = ' ' + src + ' ';
    const now = new Date();
    let time = null, date = null, rec = null, m;
    const cut = re => { t = t.replace(re, ' '); };
    const dayIdx = w => DAY_NAMES.indexOf(norm(w).replace(/s$/, ''));
    const dayRe = '(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)s?';

    cut(/^\s*(rappelle[- ]?moi|rappel|penser? à|n['’]oublie pas|noublie pas)\s+(de\s+|d['’]|que\s+|qu['’]|à\s+)?/i);
    if ((m = t.match(/\s(?:à|a|vers)?\s*(\d{1,2})\s?(?:h|:)\s?(\d{2})?(?=[\s,.!]|$)/i)) && +m[1] < 24) { time = `${pad(+m[1])}:${pad(m[2] ? +m[2] : 0)}`; cut(m[0]); }
    else if (/\s(à\s+)?midi(?=\s)/i.test(t)) { time = '12:00'; cut(/\s(à\s+)?midi(?=\s)/i); }

    if ((m = t.match(/\sdans\s+(\d+)\s*(min(?:utes?)?|h(?:eures?)?|jours?|semaines?)(?=\s)/i))) {
      const n = +m[1], u = m[2][0].toLowerCase();
      if (u === 'm' && /^min/i.test(m[2])) { const d2 = new Date(now.getTime() + n * 60000); date = startOfDay(d2); time = hhmm(d2); }
      else if (u === 'h') { const d2 = new Date(now.getTime() + n * 3600000); date = startOfDay(d2); time = hhmm(d2); }
      else if (u === 'j') date = addDays(today(), n);
      else if (u === 's') date = addDays(today(), n * 7);
      cut(m[0]);
    }
    if ((m = t.match(/\s(tous les jours|chaque jour|quotidiennement)(?=\s)/i))) { rec = { type: 'daily' }; cut(m[0]); }
    else if ((m = t.match(new RegExp(`\\s(?:tous les|toutes les|chaque)\\s+${dayRe}(?:\\s+et\\s+${dayRe})?(?=\\s)`, 'i')))) {
      rec = { type: 'weekly', days: [dayIdx(m[1])].concat(m[2] ? [dayIdx(m[2])] : []) }; cut(m[0]);
    }
    else if ((m = t.match(/\s(?:tous les|toutes les)\s+(\d+)\s+(jours|semaines|mois)(?=\s)/i))) {
      const n = +m[1], u = norm(m[2]);
      rec = { type: 'every', n: u.startsWith('jour') ? n : u.startsWith('sem') ? n * 7 : n * 30, start: key(today()) }; cut(m[0]);
    }
    else if ((m = t.match(/\s(toutes les semaines|chaque semaine)(?=\s)/i))) { rec = { type: 'weekly', days: [now.getDay()] }; cut(m[0]); }
    else if ((m = t.match(/\s(tous les mois|chaque mois)(?=\s)/i))) { rec = { type: 'monthly', day: now.getDate() }; cut(m[0]); }
    else if ((m = t.match(/\s(tous les ans|chaque année|chaque annee)(?=\s)/i))) { rec = { type: 'yearly', m: now.getMonth() + 1, d: now.getDate() }; cut(m[0]); }

    if ((m = t.match(/\s(après[- ]demain|apres[- ]demain)(?=\s)/i))) { date = addDays(today(), 2); cut(m[0]); }
    else if ((m = t.match(/\sdemain(?=\s)/i))) { date = addDays(today(), 1); cut(m[0]); }
    else if ((m = t.match(/\s(aujourd['’]hui|ce soir|ce matin|cet après-midi|cet aprem)(?=\s)/i))) {
      date = today(); const w = norm(m[1]);
      if (!time) time = w.includes('soir') ? '19:00' : w.includes('matin') ? '08:00' : w.includes('apr') ? '14:00' : null;
      cut(m[0]);
    }
    if ((m = t.match(/\s(?:le\s+)?(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?(?=\s)/i))) {
      let y = m[3] ? +m[3] : now.getFullYear(); if (y < 100) y += 2000;
      date = new Date(y, +m[2] - 1, +m[1]); if (!m[3] && date < today()) date.setFullYear(y + 1); cut(m[0]);
    } else if ((m = t.match(new RegExp(`\\s(?:le\\s+)?(\\d{1,2})(?:er)?\\s+(${MONTHS.join('|')}|fevrier|aout|decembre)(?=\\s)`, 'i')))) {
      const mi = MONTHS.findIndex(x => norm(x) === norm(m[2]));
      let y = now.getFullYear(); date = new Date(y, mi, +m[1]); if (date < today()) date.setFullYear(y + 1); cut(m[0]);
    }
    if (rec && rec.type === 'monthly' && (m = t.match(/\sle\s+(\d{1,2})(?:er)?(?=\s)/i))) { rec.day = Math.min(28, +m[1]); cut(m[0]); }
    else if (!date && (m = t.match(/\sle\s+(\d{1,2})(?:er)?(?=\s)/i)) && +m[1] >= 1 && +m[1] <= 31) {
      let d2 = new Date(now.getFullYear(), now.getMonth(), +m[1]); if (d2 < today()) d2 = new Date(now.getFullYear(), now.getMonth() + 1, +m[1]);
      date = d2; cut(m[0]);
    }
    if (!rec && (m = t.match(new RegExp(`\\s(?:ce\\s+|le\\s+)?${dayRe}(?:\\s+prochain)?(?=\\s)`, 'i')))) {
      const wd = dayIdx(m[1]); let n = (wd - now.getDay() + 7) % 7; if (n === 0) n = 7;
      date = addDays(today(), n); cut(m[0]);
    }
    if ((m = t.match(/\s(le\s+)?(matin|soir|après-midi|aprem)(?=\s)/i))) {
      const w = norm(m[2]); if (!time) time = w === 'matin' ? '08:00' : w === 'soir' ? '19:00' : '14:00'; cut(m[0]);
    }
    let title = t.replace(/\s+/g, ' ').trim().replace(/^(de|d['’]|à|le|la)\s+/i, '').replace(/\s+(le|à|a|et|de)$/i, '').trim();
    title = cap(title) || 'Rappel';
    if (rec && rec.type === 'weekly' && !rec.days.length) rec.days = [now.getDay()];
    if (rec && date) { if (rec.type === 'every') rec.start = key(date); if (rec.type === 'monthly') rec.day = date.getDate(); if (rec.type === 'yearly') { rec.m = date.getMonth() + 1; rec.d = date.getDate(); } }
    if (!rec) {
      if (!date) date = time && toMin(time) <= nowMin() ? addDays(today(), 1) : today();
      if (!time) time = date.getTime() === today().getTime() ? fromMin(Math.min(23 * 60, (Math.floor(nowMin() / 60) + 1) * 60)) : '09:00';
      rec = { type: 'once', date: key(date) };
    }
    if (!time) time = '09:00';
    return { title, time, rec, icon: guessIcon(title) };
  }

  /* ================= Météo ================= */
  const WX = c => c === 0 ? ['sun', 'Grand soleil'] : c <= 2 ? ['cloudSun', 'Éclaircies'] : c === 3 ? ['cloud', 'Ciel couvert'] :
    c <= 48 ? ['fog', 'Brouillard'] : c <= 67 ? ['rain', 'Pluie'] : c <= 77 ? ['snow', 'Neige'] : c <= 82 ? ['rain', 'Averses'] : ['storm', 'Orages'];

  async function loadWeather() {
    const c = coords();
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 5000);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&timezone=auto&forecast_days=2`;
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('météo');
      const j = await r.json();
      const hours = j.hourly.time.map((ts, i) => ({ date: ts.slice(0, 10), h: +ts.slice(11, 13), t: Math.round(j.hourly.temperature_2m[i]), p: j.hourly.precipitation_probability[i] || 0, code: j.hourly.weather_code[i] }));
      const dayObj = i => ({ max: Math.round(j.daily.temperature_2m_max[i]), min: Math.round(j.daily.temperature_2m_min[i]), p: j.daily.precipitation_probability_max[i] || 0, code: j.daily.weather_code[i], sunset: j.daily.sunset[i].slice(11, 16) });
      U.wx = { live: true, now: { t: Math.round(j.current.temperature_2m), code: j.current.weather_code }, today: dayObj(0), tomorrow: dayObj(1), hours };
    } catch (e) {
      U.wx = sampleWeather();
    }
    U.wx.rainToday = rainAt(key(today()), new Date().getHours());
    U.wx.rainTomorrow = rainAt(key(addDays(today(), 1)), 7);
    softRender();
  }
  function sampleWeather() {
    const c = coords(), d = today(), t = addDays(d, 1), hours = [];
    [d, t].forEach((day, di) => {
      for (let h = 0; h < 24; h++) {
        const temp = Math.round((di ? 10 : 12) + 5 * Math.sin((h - 9) / 24 * Math.PI * 2 - Math.PI / 2 + Math.PI));
        const p = di ? (h >= 8 && h <= 10 ? 55 : 10) : (h >= 16 && h <= 19 ? 70 : h >= 13 ? 30 : 10);
        hours.push({ date: key(day), h, t: temp, p, code: p >= 50 ? 61 : p >= 30 ? 3 : 2 });
      }
    });
    const ss = d2 => hhmm(sunTimes(d2, c.lat, c.lon).set);
    const nh = new Date().getHours();
    return { live: false, now: { t: hours[nh].t, code: hours[nh].code }, today: { max: 17, min: 7, p: 70, code: 61, sunset: ss(d) }, tomorrow: { max: 14, min: 4, p: 55, code: 3, sunset: ss(t) }, hours };
  }
  function rainAt(dateKey, fromH) {
    const h = (U.wx.hours || []).find(x => x.date === dateKey && x.h >= Math.max(fromH, 7) && x.h <= 21 && x.p >= 50);
    return h ? h.h : null;
  }
  function wxTips(which) {
    const w = U.wx; if (!w) return [];
    const d = which === 'tomorrow' ? w.tomorrow : w.today;
    const rain = which === 'tomorrow' ? w.rainTomorrow : w.rainToday;
    const p = S.profile, tips = [];
    if (rain != null) tips.push({ icon: 'umbrella', text: `Pluie prévue vers ${rain}h : prends un parapluie${p.household.plants ? ', pas besoin d’arroser dehors' : ''}.` });
    if (d.min <= 1) tips.push({ icon: 'snow', text: `Gel possible (${d.min}°)${p.household.car ? ' : prévois 5 min pour dégivrer le pare-brise' : ''}${p.household.plants ? ', rentre les plantes fragiles' : ''}.` });
    if (d.max >= 28) tips.push({ icon: 'thermo', text: `Forte chaleur (${d.max}°) : ferme les volets avant 11h et bois régulièrement.` });
    if (rain == null && d.p < 30 && d.max >= 14) tips.push({ icon: 'shirt', text: 'Temps sec : c’est le bon jour pour étendre le linge dehors.' });
    if (which === 'today' && w.today.sunset) tips.push({ icon: 'sunset', text: `Coucher du soleil à ${w.today.sunset.replace(':', 'h')}.` , minor: true });
    return tips;
  }

  /* ================= Magasins ================= */
  function parseOH(s) {
    if (!s) return null;
    s = s.trim();
    if (s === '24/7') { const h = {}; for (let i = 0; i < 7; i++) h[i] = [[0, 24]]; return h; }
    const map = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 }, order = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], h = {};
    let ok = false;
    for (const part of s.split(';')) {
      const mm = part.trim().match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/);
      if (!mm) continue;
      const days = [];
      mm[1].split(',').forEach(seg => {
        const [a, b] = seg.split('-').map(x => x.trim());
        if (b) { let i = order.indexOf(a); const j = order.indexOf(b); for (let k = 0; k < 8; k++) { days.push(map[order[i]]); if (i === j) break; i = (i + 1) % 7; } }
        else if (a in map) days.push(map[a]);
      });
      if (/off|closed/.test(mm[2])) { days.forEach(d => delete h[d]); ok = true; continue; }
      const ranges = [];
      mm[2].split(',').forEach(r => { const t = r.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/); if (t) ranges.push([+t[1] + +t[2] / 60, +t[3] + +t[4] / 60]); });
      if (ranges.length) { days.forEach(d => { h[d] = ranges; }); ok = true; }
    }
    return ok ? h : null;
  }
  function openStatus(hours, now = new Date()) {
    if (!hours) return { open: null, label: 'Horaires non renseignés' };
    const dd = now.getDay(), t = now.getHours() + now.getMinutes() / 60, td = hours[dd] || [];
    for (const [a, b] of td) if (t >= a && t < b) { const left = (b - t) * 60; return { open: true, soon: left <= 45, label: left <= 45 ? `Ferme dans ${Math.round(left)} min` : `Ouvert · ferme à ${fh(b)}`, closes: b }; }
    for (const [a] of td) if (a > t) return { open: false, label: `Fermé · ouvre à ${fh(a)}` };
    for (let i = 1; i <= 7; i++) { const d = (dd + i) % 7; if (hours[d] && hours[d].length) return { open: false, label: `Fermé · ouvre ${i === 1 ? 'demain' : DAY_NAMES[d]} à ${fh(hours[d][0][0])}` }; }
    return { open: false, label: 'Fermé' };
  }
  const KIND_ICON = { Supermarché: 'cart', Discount: 'cart', Bio: 'leaf', Boulangerie: 'bread', Marché: 'store', Pharmacie: 'cross', Épicerie: 'store', Primeur: 'leaf', Boucherie: 'fish' };
  async function loadStores() {
    const c = coords();
    try {
      const q = `[out:json][timeout:8];(nwr["shop"~"^(supermarket|convenience|bakery|greengrocer|butcher|organic)$"](around:2000,${c.lat},${c.lon});nwr["amenity"~"^(pharmacy|marketplace)$"](around:2000,${c.lat},${c.lon}););out center 60;`;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl.signal });
      if (!r.ok) throw new Error('osm');
      const j = await r.json();
      const kinds = { supermarket: 'Supermarché', convenience: 'Épicerie', bakery: 'Boulangerie', greengrocer: 'Primeur', butcher: 'Boucherie', organic: 'Bio', pharmacy: 'Pharmacie', marketplace: 'Marché' };
      const list = j.elements.filter(e => e.tags && e.tags.name).map(e => {
        const pos = { lat: e.lat || (e.center && e.center.lat), lon: e.lon || (e.center && e.center.lon) };
        return { id: String(e.id), name: e.tags.name, kind: kinds[e.tags.shop || e.tags.amenity] || 'Commerce', dist: haversine(c, pos), hours: parseOH(e.tags.opening_hours), raw: e.tags.opening_hours || '' };
      }).sort((a, b) => a.dist - b.dist).slice(0, 10);
      if (list.length < 2) throw new Error('vide');
      U.stores = list; U.storesLive = true;
    } catch (e) {
      U.stores = D.SAMPLE_STORES.map((s, i) => ({ id: 'ex' + i, name: s.name, kind: s.kind, dist: haversine(c, { lat: c.lat + s.dy, lon: c.lon + s.dx }), hours: s.hours, calm: s.calm })).sort((a, b) => a.dist - b.dist);
      U.storesLive = false;
    }
    softRender();
  }

  /* ================= Génération du foyer depuis le questionnaire ================= */
  function buildState(p, prev) {
    const t = today(), k = key(t);
    const members = [{ id: 'me', name: p.name, role: 'Toi', color: D.AVATAR_COLORS[0] }];
    if (p.household.couple) members.push({ id: 'partner', name: p.household.partner || 'Partenaire', role: 'Partenaire', color: D.AVATAR_COLORS[1] });
    p.household.kids.forEach((kd, i) => members.push({ id: 'kid' + i, name: kd.name || `Enfant ${i + 1}`, role: 'Enfant', color: D.AVATAR_COLORS[2 + (i % 4)] }));

    const R = [];
    const add = (o) => R.push(Object.assign({ id: uid(), active: true, who: 'me', cat: 'Maison', icon: 'bell' }, o));
    if (p.meds) add({ title: 'Prendre mon traitement', icon: 'pill', cat: 'Santé', time: p.medsTime, rec: { type: 'daily' }, sub: 'Coche quand c’est fait, Tilt garde la trace' });
    if (p.household.plants) add({ title: 'Arroser les plantes', icon: 'leaf', time: '19:00', rec: { type: 'every', n: 3, start: k }, weather: true });
    if (p.household.dog) {
      add({ title: 'Promenade du chien', icon: 'paw', cat: 'Animaux', time: fromMin(toMin(p.wake) + 15), rec: { type: 'daily' } });
      add({ title: 'Vermifuge du chien', icon: 'paw', cat: 'Animaux', time: '19:00', rec: { type: 'every', n: 90, start: key(addDays(t, 12)) }, sub: 'Tous les 3 mois' });
      add({ title: 'Antipuces du chien', icon: 'paw', cat: 'Animaux', time: '19:00', rec: { type: 'monthly', day: 5 } });
    }
    if (p.household.cat) {
      add({ title: 'Changer la litière', icon: 'paw', cat: 'Animaux', time: '19:30', rec: { type: 'every', n: 3, start: key(addDays(t, 1)) } });
      add({ title: 'Vermifuge du chat', icon: 'paw', cat: 'Animaux', time: '19:00', rec: { type: 'every', n: 90, start: key(addDays(t, 30)) } });
    }
    p.household.kids.forEach((kd, i) => {
      if (!kd.activity) return;
      const a = ACTIVITIES[kd.activity] || { icon: 'star', bag: 'Affaires', kit: 'ses affaires' };
      const wd = +kd.day;
      add({ title: `${kd.activity} · ${kd.name || 'Enfant'}`, icon: a.icon, cat: 'Enfants', who: p.household.couple && i % 2 ? 'partner' : 'me', time: '17:00', rec: { type: 'weekly', days: [wd] }, sub: `${a.bag} : ${a.kit}` });
      add({ title: `Préparer : ${a.bag.toLowerCase()} de ${kd.name || 'l’enfant'}`, icon: 'bag', cat: 'Enfants', time: p.briefs.evening, rec: { type: 'weekly', days: [(wd + 6) % 7] }, sub: `Pour demain : ${a.kit}` });
    });
    if (p.household.car) add({ title: 'Vérifier la pression des pneus', icon: 'car', cat: 'Voiture', time: '09:00', rec: { type: 'monthly', day: 1 } });
    if (p.shopDays.length) add({ title: 'Courses de la semaine', icon: 'cart', cat: 'Courses', time: p.shopDays.includes(6) || p.shopDays.includes(0) ? '10:00' : '18:30', rec: { type: 'weekly', days: [...p.shopDays] }, sub: 'Ta liste est prête dans l’onglet Courses' });
    if (p.sportDays.length) add({ title: 'Séance de sport', icon: 'dumbbell', cat: 'Santé', time: '18:30', rec: { type: 'weekly', days: [...p.sportDays] } });
    add({ title: 'Changer les draps', icon: 'bed', time: '10:00', rec: { type: 'every', n: 14, start: key(addDays(t, 2)) } });
    add({ title: 'Tester le détecteur de fumée', icon: 'alarm', cat: 'Sécurité', time: '18:30', rec: { type: 'monthly', day: 1 } });
    add({ title: 'Purger les radiateurs', icon: 'heat', time: '10:00', rec: { type: 'yearly', m: 10, d: 10 }, sub: 'Avant de rallumer le chauffage' });

    const deadlines = [];
    if (p.household.car) deadlines.push({ id: uid(), title: 'Contrôle technique', icon: 'gauge', date: key(addDays(t, 38)), action: 'Prends rendez-vous, les centres sont pleins 2 semaines à l’avance', example: true });
    deadlines.push({ id: uid(), title: 'Échéance assurance habitation', icon: 'shield', date: key(addDays(t, 56)), action: 'Compare les offres : tu peux résilier à tout moment après un an', example: true });
    if (p.household.kids.length) deadlines.push({ id: uid(), title: 'Photos de classe à payer', icon: 'school', date: key(addDays(t, 6)), action: 'Le bon de commande est dans le cartable', example: true });

    const prevList = prev && prev.list;
    const list = prevList || [
      ['Lait', 'me'], ['Baguette', 'me'], ['Tomates', 'partner'], ['Lessive', 'me'], ['Pâtes', 'me'],
    ].concat(p.household.dog ? [['Croquettes', 'me']] : []).concat(p.household.kids.length ? [['Compotes', 'partner']] : [])
      .map(([n, w]) => ({ id: uid(), name: n, rayon: rayonOf(n), got: false, by: p.household.couple ? w : 'me' }));
    const ago = n => key(addDays(t, -n));
    const purchases = (prev && prev.purchases) || { lait: [ago(6), ago(11), ago(17)], 'papier toilette': [ago(13), ago(27)], 'œufs': [ago(8), ago(15)], café: [ago(9), ago(21)], beurre: [ago(12), ago(26)] };

    const keepRem = prev ? prev.reminders.filter(r => r.custom) : [];
    const keepDl = prev ? prev.deadlines.filter(d => !d.example) : [];
    return {
      v: 1, profile: p, members, reminders: R.concat(keepRem), deadlines: deadlines.concat(keepDl), list, purchases,
      done: prev ? prev.done : {}, leave: prev ? prev.leave : {}, snoozed: prev ? prev.snoozed : {}, favStores: prev ? prev.favStores : [],
      theme: prev ? prev.theme : 'auto', notified: {}, invite: 'TILT-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    };
  }
  function rayonOf(name) {
    const s = norm(name);
    const r = D.RAYONS.find(([, , words]) => words.some(w => s.includes(norm(w))));
    return r ? r[0] : 'Divers';
  }

  /* ================= Moteur du jour ================= */
  function agendaFor(d) {
    const k = key(d), items = [], p = S.profile;
    const snz = (S.snoozed[k] || {});
    S.reminders.filter(r => r.active !== false && occursOn(r, d)).forEach(r => {
      const id = 'r:' + r.id;
      let sub = r.sub || recLabel(r.rec);
      if (r.weather && U.wx && diffDays(today(), d) <= 1) {
        const rain = diffDays(today(), d) === 0 ? U.wx.rainToday : U.wx.rainTomorrow;
        if (rain != null) sub = 'Pluie prévue : inutile d’arroser les plantes d’extérieur';
        else if ((diffDays(today(), d) === 0 ? U.wx.today.max : U.wx.tomorrow.max) >= 26) sub = 'Il fait chaud : arrose plutôt après 19h';
      }
      items.push({ id, time: snz[id] || r.time, snoozed: !!snz[id], title: r.title, sub, icon: r.icon, who: r.who, kind: 'rem' });
    });
    const tmr = addDays(d, 1);
    binsOn(tmr).forEach(b => {
      const id = 'b:' + b.id, T = D.BIN_TYPES[b.id];
      const hol = holidayName(tmr);
      items.push({ id, time: snz[id] || p.briefs.evening, title: `Sortir la poubelle ${T.short.toLowerCase()}`, sub: hol ? `Demain c’est ${hol} : vérifie si la collecte est décalée` : `${T.label} · collecte demain matin`, icon: 'trash', bg: T.color, fg: binFg(b.id), kind: 'bin', bin: b.id });
    });
    S.deadlines.forEach(dl => {
      const left = diffDays(d, parseKey(dl.date));
      if ([30, 14, 7, 3, 1, 0].includes(left)) {
        const id = 'd:' + dl.id + ':' + left;
        items.push({ id, time: snz[id] || '09:00', title: left === 0 ? `${dl.title} : c’est aujourd’hui` : `${dl.title} dans ${plural(left, 'jour')}`, sub: dl.action || 'Pense à t’en occuper', icon: dl.icon || 'calendar', kind: 'deadline', signal: true });
      }
    });
    return items.sort((a, b) => toMin(a.time) - toMin(b.time));
  }
  const doneSet = d => new Set(S.done[key(d)] || []);
  function leaveFor(d) {
    const p = S.profile, wd = d.getDay(), out = [];
    const base = [['Clés', 'key'], ['Téléphone', 'phone'], ['Portefeuille', 'wallet']];
    base.forEach(([l, i]) => out.push({ l, i }));
    if (wd >= 1 && wd <= 5 && p.work && !p.remote.includes(wd)) out.push({ l: 'Badge du travail', i: 'badge', ctx: true });
    const isToday = diffDays(today(), d) === 0;
    if (U.wx) {
      const rain = isToday ? U.wx.rainToday : U.wx.rainTomorrow, day = isToday ? U.wx.today : U.wx.tomorrow;
      if (rain != null) out.push({ l: 'Parapluie', i: 'umbrella', ctx: true });
      if (day.max >= 25) out.push({ l: 'Gourde d’eau', i: 'drop', ctx: true });
      if (day.min <= 4) out.push({ l: 'Gants & bonnet', i: 'snow', ctx: true });
    }
    p.household.kids.forEach(kd => { if (kd.activity && +kd.day === wd) { const a = ACTIVITIES[kd.activity]; out.push({ l: `${a ? a.bag : 'Affaires'} (${kd.name || 'enfant'})`, i: a ? a.icon : 'bag', ctx: true }); } });
    if (p.sportDays.includes(wd)) out.push({ l: 'Sac de sport', i: 'dumbbell', ctx: true });
    if (p.shopDays.includes(wd)) out.push({ l: 'Sacs de courses', i: 'bag', ctx: true });
    return out;
  }
  function countdowns() {
    const t = today(), out = [];
    S.deadlines.forEach(dl => out.push({ id: dl.id, title: dl.title, icon: dl.icon || 'calendar', in: diffDays(t, parseKey(dl.date)), date: parseKey(dl.date), example: dl.example }));
    const dst = nextDST(t);
    out.push({ title: dst.back ? 'Passage à l’heure d’hiver' : 'Passage à l’heure d’été', icon: 'clock', in: diffDays(t, dst.date), date: dst.date, note: dst.back ? 'On recule d’une heure' : 'On avance d’une heure' });
    const h = nextHoliday(t); out.push({ title: h.name, icon: 'calendar', in: h.in, date: h.date, note: 'Jour férié' });
    if (S.profile.household.kids.length) {
      const v = D.SCHOOL_HOLIDAYS.find(x => diffDays(t, parseKey(x.end)) >= 0);
      if (v) { const n = diffDays(t, parseKey(v.start)); out.push({ title: v.name, icon: 'school', in: Math.max(0, n), date: parseKey(v.start), note: n <= 0 ? 'En cours' : 'Zone A' }); }
    }
    return out.filter(x => x.in >= 0).sort((a, b) => a.in - b.in);
  }
  function suggestions() {
    const t = today(), inList = new Set(S.list.filter(i => !i.got).map(i => norm(i.name)));
    return Object.entries(S.purchases).map(([name, dates]) => {
      const ds = dates.map(parseKey).sort((a, b) => a - b);
      if (ds.length < 2) return null;
      const avg = Math.round(diffDays(ds[0], ds[ds.length - 1]) / (ds.length - 1));
      const since = diffDays(ds[ds.length - 1], t);
      return { name: cap(name), avg, since, due: since >= avg - 1 };
    }).filter(x => x && x.due && !inList.has(norm(x.name))).sort((a, b) => (b.since - b.avg) - (a.since - a.avg));
  }

  function buildBrief(evening) {
    const t = today(), lines = [], p = S.profile;
    if (!evening) {
      const done = doneSet(t);
      binsOn(t).forEach(b => lines.push({ icon: 'trash', html: `Collecte <strong>${D.BIN_TYPES[b.id].short.toLowerCase()}</strong> ce matin : pense à rentrer le bac ce soir.` }));
      wxTips('today').filter(x => !x.minor).slice(0, 2).forEach(x => lines.push({ icon: x.icon, html: x.text }));
      agendaFor(t).filter(i => !done.has(i.id) && toMin(i.time) >= nowMin() - 30).slice(0, 3).forEach(i => lines.push({ icon: i.icon, html: `<strong>${i.time}</strong> · ${esc(i.title)}` }));
      const dl = countdowns().find(c => c.id && c.in <= 7);
      if (dl) lines.push({ icon: dl.icon, html: `<strong>${esc(dl.title)}</strong> dans ${plural(dl.in, 'jour')}.` });
    } else {
      const tm = addDays(t, 1);
      const doneT = doneSet(t);
      binsOn(tm).forEach(b => { if (!doneT.has('b:' + b.id)) lines.push({ icon: 'trash', html: `<strong>Ce soir</strong> : sors la poubelle ${D.BIN_TYPES[b.id].short.toLowerCase()}, collecte demain matin.` }); });
      leaveFor(tm).filter(x => x.ctx && x.i !== 'badge').slice(0, 2).forEach(x => lines.push({ icon: x.i, html: `Pour demain : prépare <strong>${esc(x.l.toLowerCase())}</strong>.` }));
      agendaFor(tm).filter(i => i.kind !== 'bin').slice(0, 2).forEach(i => lines.push({ icon: i.icon, html: `Demain <strong>${i.time}</strong> · ${esc(i.title)}` }));
      if (U.wx) {
        const w = U.wx.tomorrow, [, lab] = WX(w.code);
        lines.push({ icon: WX(w.code)[0], html: `Demain : ${lab.toLowerCase()}, ${w.min}° à ${w.max}°${U.wx.rainTomorrow != null ? `, pluie vers ${U.wx.rainTomorrow}h` : ''}.` });
      }
    }
    if (!lines.length) lines.push({ icon: 'sparkle', html: 'Rien d’urgent. Profite de ta journée.' });
    const n = lines.length;
    const title = evening ? 'Ce soir, avant de dormir' : `${n > 1 ? n + ' choses' : 'Une chose'} à retenir aujourd’hui`;
    const plain = lines.map(l => l.html.replace(/<[^>]+>/g, ''));
    return { title, lines: lines.slice(0, 5), plain, evening, time: evening ? p.briefs.evening : p.briefs.morning };
  }

  /* ================= Rendu : coque ================= */
  const TABS = [['today', 'Aujourd’hui', 'home'], ['collectes', 'Collectes', 'trash'], ['courses', 'Courses', 'cart'], ['rappels', 'Rappels', 'bell'], ['foyer', 'Foyer', 'users']];
  function logo(sm) { return `<span class="logo${sm ? ' sm' : ''}" aria-label="Tilt">t<span class="i-wrap">ı<span class="spark"></span></span>lt</span>`; }
  function renderShell() {
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar">${logo(true)}
          <button class="side-search" data-act="openSearch">${ic('search')}<span>Rechercher</span><kbd>/</kbd></button>
          <nav class="side-nav" aria-label="Navigation">${TABS.map(([id, l, i]) => `<button class="side-tab" data-act="tab" data-tab="${id}">${ic(i)}<span>${l}</span><span class="badge" data-badge="${id}" hidden></span></button>`).join('')}</nav>
          <div class="side-foot">
            <button class="btn sm" data-act="previewBrief" data-type="morning">${ic('sun')} Brief du matin</button>
            <button class="btn sm" data-act="previewBrief" data-type="evening">${ic('moon')} Brief du soir</button>
          </div>
        </aside>
        <main class="main"><header class="topbar" id="topbar"></header><div id="view" class="view"></div></main>
      </div>
      <nav class="tabbar" aria-label="Navigation"><div class="tab-indicator" id="tab-ind"></div>
        ${TABS.map(([id, l, i]) => `<button class="tab" data-act="tab" data-tab="${id}">${ic(i)}<span>${l}</span><span class="badge" data-badge="${id}" hidden></span></button>`).join('')}
      </nav>
      <button class="fab" data-act="openQuick" aria-label="Nouveau rappel">${ic('plus')}</button>
      <div class="scrim" id="scrim" data-act="closeSheet"></div>
      <div class="sheet" id="sheet" role="dialog" aria-modal="true"></div>
      <div class="notif-layer" id="notifs"></div>`;
  }

  function render() {
    if (!S) return;
    const view = document.getElementById('view');
    if (!view) { renderShell(); return render(); }
    applyTheme();
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === U.tab ? 'page' : 'false'));
    const idx = TABS.findIndex(t => t[0] === U.tab);
    const ind = document.getElementById('tab-ind'); if (ind) ind.style.transform = `translateX(${idx * 100}%)`;
    document.getElementById('topbar').innerHTML = topbar();
    view.innerHTML = ({ today: viewToday, collectes: viewCollectes, courses: viewCourses, rappels: viewRappels, foyer: viewFoyer })[U.tab]();
    view.classList.toggle('enter', U.enter);
    view.querySelectorAll('.stack > *, .view > *:not(.grid-2)').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 10)));
    if (U.enter) { U.enter = false; animateCounts(view); }
    updateBadges();
    requestAnimationFrame(() => setRing());
  }
  function softRender() {
    const a = document.activeElement;
    if ((a && a.closest && a.closest('#view') && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) || document.querySelector('.sheet.open')) { U.pendingRender = true; return; }
    render();
  }
  function updateBadges() {
    const t = today(), dn = doneSet(t);
    const left = agendaFor(t).filter(i => !dn.has(i.id)).length;
    const buy = S.list.filter(i => !i.got).length;
    document.querySelectorAll('[data-badge]').forEach(b => {
      const n = b.dataset.badge === 'today' ? left : b.dataset.badge === 'courses' ? buy : 0;
      b.hidden = !n; b.textContent = n;
    });
  }
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; }
  function topbar() {
    const me = member('me');
    const avatar = `<button class="avatar" style="background:${me.color}" data-act="tab" data-tab="foyer" aria-label="Mon foyer">${esc(me.name[0] || '?').toUpperCase()}</button>`;
    const wx = U.wx ? `<span class="pill-btn">${ic(WX(U.wx.now.code)[0])}<span class="mono">${U.wx.now.t}°</span></span>` : '';
    const t = {
      today: [`${cap(fmtDate(new Date()))} · ${esc(city().name)}`, `${greeting()}, ${esc(S.profile.name)}`],
      collectes: [`${esc(city().name)} · ${city().cp}`, 'Collectes'],
      courses: [`${plural(S.list.filter(i => !i.got).length, 'article')} · liste partagée`, 'Courses'],
      rappels: [`${plural(S.reminders.filter(r => r.active !== false).length, 'rappel actif', 'rappels actifs')}`, 'Rappels'],
      foyer: [`${plural(S.members.length, 'membre')}`, 'Mon foyer'],
    }[U.tab];
    const search = `<button class="pill-btn icon-only" data-act="openSearch" aria-label="Rechercher">${ic('search')}</button>`;
    return `<div style="min-width:0"><div class="eyebrow date">${t[0]}</div><h1>${t[1]}</h1></div><div class="topbar-actions">${search}${wx}${avatar}</div>`;
  }
  function animateCounts(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count; if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const t0 = performance.now(), dur = 900;
      const step = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }

  /* ================= Vue : Aujourd'hui ================= */
  function rowHtml(it, d, done, opts = {}) {
    const isDone = done.has(it.id);
    const past = opts.today && toMin(it.time) < nowMin();
    const w = it.who && it.who !== 'me' ? member(it.who) : null;
    return `<div class="row ${isDone ? 'is-done' : ''} ${past ? 'is-past' : ''}" data-id="${esc(it.id)}" data-day="${key(d)}">
      <div class="row-bg"><span class="l">${ic('check')} Fait</span><span class="r">+1 h ${ic('alarm')}</span></div>
      <div class="row-inner">
        <span class="row-time">${it.time}</span>
        <span class="row-icon" style="${it.bg ? `background:${it.bg};color:${it.fg}` : it.signal ? 'background:var(--signal-soft);color:var(--warn)' : ''}">${ic(it.icon)}</span>
        <span class="row-text"><strong>${esc(it.title)}</strong><span>${it.snoozed ? '<span class="tag signal">décalé</span> ' : ''}${esc(it.sub || '')}</span></span>
        ${w ? `<span class="avatar sm row-who" style="background:${w.color}" title="${esc(w.name)}">${esc(w.name[0]).toUpperCase()}</span>` : ''}
        ${opts.today ? `<button class="snooze" data-act="snooze" aria-label="Décaler d’une heure">${ic('alarm')}</button>` : ''}
        <button class="check" data-act="toggleDone" aria-label="Marquer comme fait">${CHECK_SVG}</button>
      </div></div>`;
  }
  function ringSvg(done, total) {
    const C = 2 * Math.PI * 27;
    return `<div class="ring" id="ring" data-done="${done}" data-total="${total}"><svg viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="27"/><circle class="bar" cx="32" cy="32" r="27" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><span>${done}/${total}</span></div>`;
  }
  function setRing() {
    const r = document.getElementById('ring'); if (!r) return;
    const C = 2 * Math.PI * 27, d = +r.dataset.done, t = +r.dataset.total;
    r.querySelector('.bar').style.strokeDashoffset = t ? C * (1 - d / t) : C;
  }
  const fmtDur = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + pad(m % 60) : ''}`;
  function nextShopDay() { const p = S.profile; for (let i = 0; i < 8; i++) { const d = addDays(today(), i); if (p.shopDays.includes(d.getDay())) return d; } return null; }
  function glanceTiles() {
    const t = today(), done = doneSet(t), tiles = [];
    const tonight = binsOn(addDays(t, 1)), todayB = binsOn(t);
    if (tonight.length) {
      const b = tonight[0], T = D.BIN_TYPES[b.id], ok = done.has('b:' + b.id);
      tiles.push({ act: 'tab', data: 'data-tab="collectes"', icon: ok ? 'check' : 'trash', bg: T.color, fg: binFg(b.id), label: 'Poubelle ce soir', value: ok ? 'Bac sorti' : `Bac ${T.short.toLowerCase()}`, sub: ok ? 'Collecte demain matin' : 'À sortir avant de dormir', alert: !ok });
    } else if (todayB.length) {
      const T = D.BIN_TYPES[todayB[0].id];
      tiles.push({ act: 'tab', data: 'data-tab="collectes"', icon: 'trash', bg: T.color, fg: binFg(todayB[0].id), label: 'Poubelle', value: `Collecte ${T.short.toLowerCase()}`, sub: 'Pense à rentrer le bac ce soir' });
    } else {
      const nx = nextCollections(t)[0];
      tiles.push({ act: 'tab', data: 'data-tab="collectes"', icon: 'trash', bg: nx ? D.BIN_TYPES[nx.bin.id].color : '', fg: nx ? binFg(nx.bin.id) : '', label: 'Prochaine collecte', value: nx ? relDay(nx.date) : 'Aucune', sub: nx ? `Bac ${D.BIN_TYPES[nx.bin.id].short.toLowerCase()}` : 'Règle tes jours' });
    }
    if (U.wx) {
      const [icn, lab] = WX(U.wx.now.code);
      tiles.push({ act: 'scrollTo', data: 'data-target="wx-card"', icon: icn, label: 'Météo', value: `${U.wx.now.t}° · ${lab}`, sub: U.wx.rainToday != null ? `Pluie vers ${U.wx.rainToday}h, prends un parapluie` : `Entre ${U.wx.today.min}° et ${U.wx.today.max}°`, alert: U.wx.rainToday != null });
    } else tiles.push({ act: 'scrollTo', data: 'data-target="wx-card"', icon: 'cloud', label: 'Météo', value: 'Chargement…', sub: '' });
    const n = S.list.filter(i => !i.got).length, sd = nextShopDay();
    tiles.push({ act: 'tab', data: 'data-tab="courses"', icon: 'cart', label: 'Courses', value: n ? plural(n, 'article') : 'Liste vide', sub: sd ? `Prochaines courses : ${relDay(sd).toLowerCase()}` : 'Liste partagée' });
    const c = countdowns()[0];
    tiles.push({ act: 'goSeg', data: 'data-seg="deadlines"', icon: c ? c.icon : 'calendar', label: 'Prochaine échéance', value: c ? (c.in === 0 ? 'Aujourd’hui' : `Dans ${plural(c.in, 'jour')}`) : 'Aucune', sub: c ? c.title : '', alert: c && c.in <= 7 });
    return `<section class="glance" aria-label="En un coup d’œil">${tiles.map(x => `<button class="g-tile ${x.alert ? 'alert' : ''}" data-act="${x.act}" ${x.data}><span class="g-icon" style="${x.bg ? `background:${x.bg};color:${x.fg}` : ''}">${ic(x.icon)}</span><span class="eyebrow">${x.label}</span><strong>${esc(x.value)}</strong><span class="g-sub">${esc(x.sub)}</span></button>`).join('')}</section>`;
  }
  function nowCard(items, done) {
    const nm = nowMin(), pending = items.filter(i => !done.has(i.id));
    const late = pending.filter(i => toMin(i.time) < nm - 15), next = pending.find(i => toMin(i.time) >= nm - 15);
    if (!pending.length) {
      const tm = agendaFor(addDays(today(), 1))[0];
      return `<section class="card now-card calm"><div class="now-main"><span class="row-icon now-icon" style="background:var(--ok-soft);color:var(--ok)">${ic('check')}</span><div><span class="now-when" style="color:var(--ok)">C’est tout pour aujourd’hui</span><h2>${items.length ? 'Tout est fait, bravo' : 'Journée libre'}</h2><p class="small muted">${tm ? `Demain ${tm.time} · ${esc(tm.title)}` : 'Rien de prévu demain non plus.'}</p></div></div></section>`;
    }
    const it = next || late[late.length - 1], diff = toMin(it.time) - nm;
    const when = diff < -15 ? `En retard de ${fmtDur(-diff)}` : diff <= 0 ? 'Maintenant' : `Dans ${fmtDur(diff)}`;
    const st = it.bg ? `background:${it.bg};color:${it.fg}` : it.signal ? 'background:var(--signal-soft);color:var(--warn)' : 'background:var(--accent-soft);color:var(--accent)';
    return `<section class="card now-card ${diff < -15 ? 'late' : ''}" data-id="${esc(it.id)}" data-day="${key(today())}">
      <div class="now-top"><span class="eyebrow">Prochaine étape · ${it.time}</span>${late.length && next ? `<button class="tag signal" data-act="scrollTo" data-target="day-card">${late.length} en retard</button>` : ''}</div>
      <div class="now-main"><span class="row-icon now-icon" style="${st}">${ic(it.icon)}</span><div style="min-width:0"><span class="now-when">${when}</span><h2>${esc(it.title)}</h2>${it.sub ? `<p class="small muted" style="margin-top:4px">${esc(it.sub)}</p>` : ''}</div></div>
      <div class="now-actions"><button class="btn primary" data-act="nowDone">${ic('check')} C’est fait</button><button class="btn" data-act="nowSnooze" aria-label="Décaler d’une heure">${ic('alarm')} Dans 1 h</button></div></section>`;
  }
  function dayTimeline(items, d, done, opts = {}) {
    const groups = [['Matin', 0, 720, 'sun'], ['Après-midi', 720, 1080, 'cloudSun'], ['Soir', 1080, 1440, 'moon']];
    const pend = items.filter(i => !done.has(i.id)), fin = items.filter(i => done.has(i.id));
    let html = groups.map(([l, a, b, icn]) => {
      const g = pend.filter(i => toMin(i.time) >= a && toMin(i.time) < b);
      return g.length ? `<div class="tl-group"><div class="tl-head">${ic(icn)}<span>${l}</span><span class="tl-n">${g.length}</span></div><div class="timeline">${g.map(i => rowHtml(i, d, done, opts)).join('')}</div></div>` : '';
    }).join('');
    if (!pend.length && fin.length) html += `<p class="small muted" style="padding:4px 6px">Tout est fait pour ${opts.today ? 'aujourd’hui' : 'ce jour-là'}.</p>`;
    if (fin.length) { const k = 'done-' + key(d); html += `<details class="tl-done" data-k="${k}" ${U.open.has(k) ? 'open' : ''}><summary>${ic('check')}<span>Fait</span><span class="tl-n">${fin.length}</span></summary><div class="timeline">${fin.map(i => rowHtml(i, d, done, opts)).join('')}</div></details>`; }
    return html;
  }
  function viewToday() {
    const t = today(), now = new Date(), items = agendaFor(t), done = doneSet(t);
    const evening = now.getHours() >= 15;
    const b = buildBrief(evening);
    const nDone = items.filter(i => done.has(i.id)).length, left = items.length - nDone;

    const brief = `<section class="brief ${U.briefOpen ? 'expanded' : ''}">
      <div class="eyebrow"><span class="ding"></span>${evening ? 'Brief du soir' : 'Brief du matin'} · ${b.time}</div>
      <h2>${b.title}</h2>
      <ul class="brief-list">${b.lines.map((l, i) => `<li class="${i > 2 ? 'more' : ''}"><span class="bi">${ic(l.icon)}</span><span>${l.html}</span></li>`).join('')}</ul>
      <div class="brief-actions">
        ${b.lines.length > 3 ? `<button data-act="briefMore">${U.briefOpen ? 'Réduire' : `Voir ${b.lines.length - 3 > 1 ? `les ${b.lines.length - 3} autres` : 'le reste'}`}</button>` : ''}
        <button class="primary" data-act="speak">${ic('volume')} Écouter</button>
        <button data-act="previewBrief" data-type="${evening ? 'evening' : 'morning'}">${ic('bell')} Notification</button>
      </div></section>`;

    const timeline = `<section class="card" id="day-card">
      <div class="card-head"><div><span class="eyebrow">Ta journée</span><h2 id="left-title">${left ? `Encore ${plural(left, 'chose')} à faire` : 'Tout est fait, bravo'}</h2></div>${ringSvg(nDone, items.length)}</div>
      ${items.length ? dayTimeline(items, t, done, { today: true }) : `<div class="empty">${ic('sparkle')}<br>Journée libre. Ajoute un rappel avec le bouton +.</div>`}
      <p class="small muted" style="margin-top:12px">Glisse un rappel vers la droite pour le valider, vers la gauche pour le décaler d’une heure.</p>
    </section>`;

    const lv = leaveFor(t), lvDone = new Set(S.leave[key(t)] || []);
    const leave = `<section class="card">
      <div class="card-head"><div><span class="eyebrow">Avant de sortir</span><h2>Tu n’oublies rien ?</h2></div><span class="tag" id="leave-count">${lv.filter(x => lvDone.has(x.l)).length}/${lv.length}</span></div>
      <div class="leave">${lv.map(x => `<button class="chip ${lvDone.has(x.l) ? 'on' : ''} ${x.ctx ? 'ctx' : ''}" data-act="leave" data-k="${esc(x.l)}"><span class="box">${CHECK_SVG}</span>${esc(x.l)}</button>`).join('')}</div>
      ${lv.some(x => x.ctx) ? '<p class="small muted" style="margin-top:12px">Entourés en ambre : ajoutés automatiquement selon la météo et ton planning du jour.</p>' : ''}
    </section>`;

    return `${glanceTiles()}<div class="grid-2"><div class="stack">${nowCard(items, done)}${timeline}${leave}</div><div class="stack">${brief}${weatherCard()}${countdownCard()}${infosCard()}${tipCard()}</div></div>`;
  }
  function weatherCard() {
    const w = U.wx;
    if (!w) return `<section class="card" id="wx-card"><span class="eyebrow">Météo</span><p class="muted" style="margin-top:8px">Chargement de la météo…</p></section>`;
    const [icn, lab] = WX(w.now.code), nh = new Date().getHours(), tk = key(today());
    const hours = w.hours.filter(h => (h.date === tk && h.h >= nh) || h.date > tk).filter((_, i) => i % 2 === 0).slice(0, 6);
    const tips = wxTips('today').filter(x => !x.minor);
    return `<section class="card" id="wx-card">
      <div class="card-head"><div><span class="eyebrow">Météo · ${esc(city().name)}</span><h2>${lab}</h2></div>${w.live ? '<span class="tag ok">en direct</span>' : '<span class="tag example">exemple</span>'}</div>
      <div class="wx">${ic(icn, 'width:46px;height:46px;stroke-width:1.4')}<span class="wx-big"><span data-count="${w.now.t}">${w.now.t}</span>°</span>
        <div class="small muted">Max ${w.today.max}° · min ${w.today.min}°<br>Coucher du soleil ${w.today.sunset}</div></div>
      <div class="wx-hours">${hours.map(h => `<div class="wx-h"><span class="mono">${pad(h.h)}h</span>${ic(WX(h.code)[0])}<b>${h.t}°</b><span class="rain-bar" title="${h.p}% de pluie"><i style="width:${h.p}%"></i></span></div>`).join('')}</div>
      ${tips.length ? `<div style="display:grid;gap:10px;margin-top:14px">${tips.map(x => `<div class="tip"><span class="tip-icon" style="width:32px;height:32px;border-radius:10px">${ic(x.icon, 'width:16px;height:16px')}</span><p class="small" style="padding-top:6px">${x.text}</p></div>`).join('')}</div>` : ''}
    </section>`;
  }
  function countdownCard() {
    const cds = countdowns().slice(0, 8);
    return `<section class="card"><div class="card-head"><div><span class="eyebrow">À venir</span><h2>Les échéances</h2></div><button class="link" data-act="goSeg" data-seg="deadlines">Gérer</button></div>
      <div class="hscroll">${cds.map(c => `<div class="cd ${c.in <= 7 ? 'urgent' : ''}"><span class="cd-icon">${ic(c.icon)}</span>
        <div><div class="n">${c.in === 0 ? 'Auj.' : `<span data-count="${c.in}">${c.in}</span><small>${c.in > 1 ? 'jours' : 'jour'}</small>`}</div>
        <div class="t">${esc(c.title)}</div><div class="d">${c.note ? esc(c.note) + ' · ' : ''}${fmtShort(c.date)}${c.example ? ' · exemple' : ''}</div></div></div>`).join('')}</div></section>`;
  }
  function infosCard() {
    const c = city(), h = nextHoliday(today());
    const open = (U.stores || []).filter(s => s.kind !== 'Pharmacie').map(s => ({ s, st: openStatus(s.hours) })).find(x => x.st.open);
    const pharma = (U.stores || []).find(s => s.kind === 'Pharmacie');
    const phSt = pharma ? openStatus(pharma.hours) : null;
    return `<section class="card"><div class="card-head"><div><span class="eyebrow">Autour de toi</span><h2>Infos utiles</h2></div></div>
      <div class="infos">
        <div class="info"><span class="eyebrow">${ic('cross')} Pharmacie</span><strong>${phSt && phSt.open ? esc(pharma.name) : 'De garde : 3237'}</strong><span>${phSt && phSt.open ? phSt.label + ' · ' + fmtDist(pharma.dist) : 'Numéro national, 24h/24'}</span></div>
        <div class="info"><span class="eyebrow">${ic('store')} Ouvert</span><strong>${open ? esc(open.s.name) : 'Tout est fermé'}</strong><span>${open ? `${open.st.label} · ${fmtDist(open.s.dist)}` : 'Consulte l’onglet Courses'}</span></div>
        <div class="info"><span class="eyebrow">${ic('recycle')} Déchetterie</span><strong>${esc(c.decheterie.name)}</strong><span>${esc(c.decheterie.hours)}</span></div>
        <div class="info"><span class="eyebrow">${ic('calendar')} Férié</span><strong>${esc(h.name)}</strong><span>${h.in === 0 ? 'Aujourd’hui' : `Dans ${plural(h.in, 'jour')}`} · vérifie le décalage des collectes</span></div>
      </div></section>`;
  }
  function tipCard() {
    const tips = D.SEASON_TIPS[new Date().getMonth()], tip = tips[new Date().getDate() % tips.length];
    return `<section class="card tip"><span class="tip-icon">${ic('sparkle')}</span><div><span class="eyebrow">Astuce de saison</span><p style="margin-top:6px">${esc(tip)}</p></div></section>`;
  }

  /* ================= Vue : Collectes ================= */
  function viewCollectes() {
    const t = today(), nx = nextCollections(t, 21), p = S.profile;
    const first = nx.find(x => x.in > 0 || (x.in === 0 && new Date().getHours() < 9)) || nx[0];
    const hero = first ? `<section class="card next-bin ${first && first.in === 1 && doneSet(t).has('b:' + first.bin.id) ? 'gone' : ''}">${binSvg(first.bin.id, 76)}
      <div style="min-width:0"><span class="eyebrow">Prochaine collecte</span><h2 style="font-size:26px;margin:6px 0 4px">${relDay(first.date)} · ${D.BIN_TYPES[first.bin.id].short.toLowerCase()}</h2>
      <p class="small muted">${D.BIN_TYPES[first.bin.id].label}. ${first.in >= 1 ? `Sors le bac ${first.in === 1 ? 'ce soir' : `${DAY_NAMES[addDays(first.date, -1).getDay()]} soir`}, Tilt te prévient à ${p.briefs.evening}.` : 'Le camion passe ce matin.'}</p>
      ${first.in === 1 ? (doneSet(t).has('b:' + first.bin.id) ? `<span class="tag ok" style="margin-top:10px">${ic('check', 'width:12px;height:12px')} Bac sorti</span>` : `<button class="btn dark sm" style="margin-top:12px" data-act="binOut" data-id="b:${first.bin.id}">${ic('check')} C’est sorti</button>`) : ''}</div></section>` :
      `<section class="card"><p class="muted">Aucune collecte programmée. Ajoute tes jours ci-dessous.</p></section>`;
    const strip = `<section class="card"><div class="card-head"><div><span class="eyebrow">Les 14 prochains jours</span><h2>Calendrier</h2></div><span class="tag example">exemple à vérifier</span></div>
      <div class="days-strip">${Array.from({ length: 14 }, (_, i) => { const d = addDays(t, i), bs = binsOn(d), hol = holidayName(d);
        return `<div class="day ${i === 0 ? 'today' : ''} ${hol ? 'holiday' : ''}" title="${hol ? esc(hol) : ''}"><span class="dn">${DAY_SHORT[d.getDay()]}</span><span class="dd">${d.getDate()}</span><span class="bins">${bs.map(b => `<span class="dot" style="background:${D.BIN_TYPES[b.id].color}"></span>`).join('')}</span></div>`; }).join('')}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px" class="small muted">${(p.bins || []).map(b => `<span style="display:inline-flex;gap:6px;align-items:center"><span class="dot" style="background:${D.BIN_TYPES[b.id].color}"></span>${D.BIN_TYPES[b.id].short}</span>`).join('')}<span style="display:inline-flex;gap:6px;align-items:center"><span class="dot" style="box-shadow:inset 0 0 0 1.5px var(--signal)"></span>Jour férié</span></div>
    </section>`;
    const search = `<section class="card"><div class="card-head"><div><span class="eyebrow">Guide du tri</span><h2>Où jeter ça ?</h2></div></div>
      <div class="search">${ic('search')}<input id="tri-q" type="search" placeholder="Pot de yaourt, piles, miroir…" autocomplete="off" aria-label="Rechercher un déchet"></div>
      <div class="results" id="tri-res">${triResults('')}</div></section>`;
    const settings = `<section class="card"><div class="card-head"><div><span class="eyebrow">Mes bacs</span><h2>Jours de passage</h2></div><button class="btn sm" data-act="editBins">${U.editBins ? `${ic('check')} Terminé` : `${ic('sliders')} Modifier`}</button></div>
      ${(p.bins || []).map(b => { const T = D.BIN_TYPES[b.id]; return `<div class="bin-row">
        <span class="bin-swatch" style="background:${T.color};color:${binFg(b.id)}">${ic('trash')}</span>
        <div style="min-width:0"><strong>${T.label}</strong><div class="small muted">Bac ${T.short.toLowerCase()} · ${b.days.length ? WEEK.filter(d => b.days.includes(d)).map(d => DAY_NAMES[d]).join(', ') : 'aucun jour'}${b.freq === 'biweekly' ? ' · une semaine sur deux' : ''}</div></div>
        ${!U.editBins ? '' : `<div class="weekdays">${WEEK.map(d => `<button class="${b.days.includes(d) ? 'on' : ''}" data-act="binDay" data-bin="${b.id}" data-day="${d}" aria-label="${DAY_NAMES[d]}">${DAY_LETTER[d]}</button>`).join('')}
          <select data-set="binFreq" data-bin="${b.id}" aria-label="Fréquence"><option value="weekly" ${b.freq !== 'biweekly' ? 'selected' : ''}>Chaque semaine</option><option value="biweekly-even" ${b.freq === 'biweekly' && b.parity === 'even' ? 'selected' : ''}>Semaines paires</option><option value="biweekly-odd" ${b.freq === 'biweekly' && b.parity === 'odd' ? 'selected' : ''}>Semaines impaires</option></select></div>`}
      </div>`; }).join('')}
      <div class="bin-row"><span class="bin-swatch" style="background:var(--bin-verre)">${ic('glass')}</span><div><strong>Verre</strong><div class="small muted">${D.BIN_TYPES.verre.tip}</div></div></div>
      <p class="small muted" style="margin-top:6px">Les jours de ${esc(city().name)} sont des exemples. Corrige-les avec le calendrier officiel de ta commune, Tilt s’adapte tout de suite.</p>
    </section>`;
    const c = city();
    const dech = `<section class="card"><div class="card-head"><div><span class="eyebrow">Déchetterie</span><h2>${esc(c.decheterie.name)}</h2></div>${ic('recycle')}</div>
      <p class="muted small">${esc(c.decheterie.hours)}</p>
      <div class="suggest" style="margin-top:12px">${['Encombrants', 'Déchets verts', 'Gravats', 'Électroménager', 'Peintures', 'Huiles'].map(x => `<span class="chip">${x}</span>`).join('')}</div></section>`;
    return `<div class="grid-2"><div class="stack">${hero}${strip}${search}</div><div class="stack">${settings}${dech}</div></div>`;
  }
  function triResults(q) {
    const n = norm(q.trim());
    const list = n ? D.TRI.filter(([name]) => norm(name).includes(n) || n.split(' ').every(w => norm(name).includes(w))) : D.TRI.filter((_, i) => [0, 7, 15, 17, 26, 29].includes(i));
    if (!list.length) return `<div class="empty">Pas trouvé « ${esc(q)} ». Dans le doute : bac gris, ou demande à ta mairie.</div>`;
    return list.slice(0, 8).map(([name, dest, tip], i) => { const D2 = D.TRI_DEST[dest]; return `<div class="result" style="--i:${i}"><span class="sw" style="background:${D2.color}"></span><div style="min-width:0"><strong>${esc(name)}</strong><span>${esc(tip)}</span></div><span class="dest" style="color:${D2.color === 'var(--bin-emb)' ? 'var(--warn)' : D2.color}">${D2.label}</span></div>`; }).join('');
  }

  /* ================= Vue : Courses ================= */
  function viewCourses() {
    const toBuy = S.list.filter(i => !i.got), got = S.list.filter(i => i.got), sug = suggestions(), p = S.profile;
    const groups = {};
    toBuy.forEach(i => { (groups[i.rayon] = groups[i.rayon] || []).push(i); });
    const order = D.RAYONS.map(r => r[0]).concat('Divers');
    const rIcon = n => (D.RAYONS.find(r => r[0] === n) || [, 'bag'])[1];
    const itemHtml = i => { const w = S.members.length > 1 ? member(i.by) : null; return `<div class="item ${i.got ? 'got' : ''}" data-item="${i.id}">
      <button class="check" data-act="gotItem" aria-label="Dans le caddie">${CHECK_SVG}</button><span class="name">${esc(i.name)}</span>${w ? `<span class="who">${esc(w.name)}</span>` : ''}
      <button class="del" data-act="delItem" aria-label="Supprimer">${ic('x')}</button></div>`; };
    const list = `<section class="card"><div class="card-head"><div><span class="eyebrow">Liste partagée${S.members.length > 1 ? ' avec ' + esc(S.members.filter(m => m.id !== 'me' && m.role !== 'Enfant').map(m => m.name).join(', ') || 'le foyer') : ''}</span><h2>${toBuy.length ? `${plural(toBuy.length, 'article')} à acheter` : 'Liste vide'}</h2></div></div>
      <form class="add-line" data-form="addItem"><input id="add-item" placeholder="Ajouter : lait, pommes, lessive…" autocomplete="off" aria-label="Ajouter un article"><button class="btn primary" aria-label="Ajouter">${ic('plus')}</button></form>
      ${sug.length ? `<div style="margin-top:16px"><span class="eyebrow" style="display:flex;gap:6px;align-items:center">${ic('sparkle', 'width:14px;height:14px;color:var(--accent)')} Tu en as sûrement besoin</span><div class="suggest" style="margin-top:10px">${sug.slice(0, 5).map(s => `<button class="chip" data-act="addSug" data-name="${esc(s.name)}">${ic('plus', 'width:14px;height:14px')}${esc(s.name)} <small>acheté il y a ${s.since} j</small></button>`).join('')}</div></div>` : ''}
      ${order.filter(r => groups[r]).map(r => `<div class="rayon"><div class="rayon-h">${ic(rIcon(r))}<span class="eyebrow">${r}</span></div>${groups[r].map(itemHtml).join('')}</div>`).join('')}
      ${got.length ? `<div class="rayon"><div class="rayon-h" style="justify-content:space-between"><span class="eyebrow">Dans le caddie (${got.length})</span><button class="link" data-act="clearGot">Vider</button></div>${got.map(itemHtml).join('')}</div>` : ''}
    </section>`;

    const stores = U.stores;
    const nextShop = (() => { for (let i = 0; i < 8; i++) { const d = addDays(today(), i); if (p.shopDays.includes(d.getDay())) return d; } return null; })();
    const fav = stores && stores.find(s => S.favStores.includes(s.id));
    const plan = `<section class="card tip"><span class="tip-icon" style="background:var(--accent-soft);color:var(--accent)">${ic('cart')}</span><div style="min-width:0"><span class="eyebrow">Prochaines courses</span>
      <h3 style="margin:6px 0 2px">${nextShop ? relDay(nextShop) : 'Pas de jour fixe'}${fav ? ` · ${esc(fav.name)}` : ''}</h3>
      <p class="small muted">${nextShop ? `${plural(toBuy.length, 'article')} sur la liste. ` : ''}${fav && fav.calm ? esc(fav.calm) + '.' : 'Ajoute un magasin en favori avec l’étoile pour voir ses horaires ici.'}</p></div></section>`;
    const storeCard = `<section class="card"><div class="card-head"><div><span class="eyebrow">À moins de 2 km</span><h2>Magasins autour de toi</h2></div>${stores ? (U.storesLive ? '<span class="tag ok">OpenStreetMap</span>' : '<span class="tag example">exemples</span>') : ''}</div>
      ${!stores ? '<p class="muted">Recherche des magasins…</p>' : stores.map(s => { const st = openStatus(s.hours), isFav = S.favStores.includes(s.id); return `<div class="store">
        <span class="store-icon">${ic(KIND_ICON[s.kind] || 'store')}</span>
        <div class="body"><strong>${esc(s.name)}</strong><div class="meta"><span class="tag ${st.open ? (st.soon ? 'signal' : 'ok') : ''}">${st.open === null ? 'Horaires ?' : st.open ? (st.soon ? 'Ferme bientôt' : 'Ouvert') : 'Fermé'}</span><span>${esc(s.kind)} · ${st.open === null ? 'non renseignés' : esc(st.label.replace(/^(Ouvert|Fermé) · /, ''))}</span></div></div>
        <span class="dist">${fmtDist(s.dist)}</span>
        <button class="star ${isFav ? 'on' : ''}" data-act="favStore" data-id="${esc(s.id)}" aria-label="Magasin favori">${ic('star')}</button></div>`; }).join('')}
      ${stores && !U.storesLive ? '<p class="small muted" style="margin-top:10px">Magasins d’exemple. Dans l’app installée, Tilt affiche les vrais commerces autour de toi via OpenStreetMap.</p>' : ''}
    </section>`;
    return `<div class="grid-2"><div class="stack">${list}</div><div class="stack">${plan}${storeCard}</div></div>`;
  }

  /* ================= Vue : Rappels ================= */
  function viewRappels() {
    const segs = [['week', 'Semaine'], ['rec', 'Récurrents'], ['deadlines', 'Échéances'], ['ideas', 'Idées']];
    const si = segs.findIndex(s => s[0] === U.seg);
    const quick = `<section><div class="quick"><input id="quick-q" placeholder="Ex. Appeler maman dimanche 18h" autocomplete="off" aria-label="Nouveau rappel en langage naturel"><button class="btn primary" data-act="quickAdd" data-src="quick-q" aria-label="Ajouter">${ic('plus')}</button></div><div class="parse" id="quick-q-parse"><span class="small muted">Écris comme tu parles : Tilt comprend « demain », « tous les lundis », « le 12/11 à 9h30 »…</span></div></section>`;
    const seg = `<div class="seg" role="tablist"><span class="seg-ind" style="width:calc((100% - 8px) / ${segs.length});transform:translateX(${si * 100}%)"></span>${segs.map(([id, l]) => `<button class="${id === U.seg ? 'on' : ''}" data-act="seg" data-seg="${id}" role="tab" aria-selected="${id === U.seg}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (U.seg === 'week') {
      body = `<section class="card">${Array.from({ length: 7 }, (_, i) => { const d = addDays(today(), i), its = agendaFor(d), dn = doneSet(d), k = 'day-' + key(d), hol = holidayName(d);
        const open = U.open.has(k) || (i < 2 && !U.closed.has(k));
        return `<details class="day-group" data-k="${k}" ${open ? 'open' : ''}><summary><strong>${relDay(d)}</strong><span class="small muted">${i > 1 ? '' : fmtShort(d)}${hol ? (i > 1 ? '' : ' · ') + esc(hol) : ''}</span><span class="tl-n">${its.length ? plural(its.length, 'rappel') : 'libre'}</span></summary>${its.length ? dayTimeline(its, d, dn, { today: i === 0 }) : '<p class="small muted" style="padding:0 6px 12px">Rien de prévu.</p>'}</details>`; }).join('')}</section>`;
    } else if (U.seg === 'rec') {
      const rs = S.reminders.filter(r => r.rec.type !== 'once').slice().sort((a, b) => (nextOcc(a) || 0) - (nextOcc(b) || 0));
      const once = S.reminders.filter(r => r.rec.type === 'once' && parseKey(r.rec.date) >= today());
      body = `<section class="card">${rs.concat(once).map(r => { const nx = nextOcc(r); return `<div class="rec"><span class="row-icon">${ic(r.icon)}</span><div class="body"><strong>${esc(r.title)}</strong><span>${recLabel(r.rec)} · ${r.time}${nx && r.active !== false ? ` · prochain : ${relDay(nx).toLowerCase()}` : ''}</span></div>
        <button class="switch ${r.active !== false ? 'on' : ''}" data-act="remActive" data-id="${r.id}" role="switch" aria-checked="${r.active !== false}" aria-label="Activer"></button>
        <button class="snooze" data-act="delRem" data-id="${r.id}" aria-label="Supprimer">${ic('x')}</button></div>`; }).join('') || '<div class="empty">Aucun rappel.</div>'}</section>`;
    } else if (U.seg === 'deadlines') {
      const cds = countdowns();
      body = `<section class="card"><div class="card-head"><div><span class="eyebrow">Compte à rebours</span><h2>Tes échéances</h2></div><button class="btn sm primary" data-act="openDeadline">${ic('plus')} Ajouter</button></div>
        ${cds.map(c => `<div class="rec"><span class="row-icon" style="${c.in <= 7 ? 'background:var(--signal-soft);color:var(--warn)' : ''}">${ic(c.icon)}</span><div class="body"><strong>${esc(c.title)}</strong><span>${cap(fmtDate(c.date))}${c.note ? ' · ' + esc(c.note) : ''}${c.example ? ' · exemple' : ''}</span></div>
          <span class="mono" style="font-weight:600;font-size:13px;white-space:nowrap">${c.in === 0 ? 'auj.' : 'J-' + c.in}</span>${c.id ? `<button class="snooze" data-act="delDeadline" data-id="${c.id}" aria-label="Supprimer">${ic('x')}</button>` : '<span style="width:30px"></span>'}</div>`).join('')}
        <p class="small muted" style="margin-top:10px">Tilt te relance à J-30, J-14, J-7, J-3, la veille et le jour même.</p></section>`;
    } else {
      const have = new Set(S.reminders.map(r => norm(r.title)));
      body = `<section class="card"><div class="card-head"><div><span class="eyebrow">Bibliothèque</span><h2>Les rappels qu’on oublie toujours</h2></div></div>
        <div class="lib">${D.LIBRARY.map((l, i) => { const added = have.has(norm(l.title)); return `<button class="lib-item ${added ? 'added' : ''}" data-act="addLib" data-i="${i}" ${added ? 'aria-disabled="true"' : ''}>
          <div class="top"><span class="row-icon" style="width:32px;height:32px">${ic(l.icon)}</span>${added ? `<span class="tag ok">${ic('check', 'width:12px;height:12px')} ajouté</span>` : `<span class="tag">${ic('plus', 'width:12px;height:12px')} ajouter</span>`}</div>
          <strong>${esc(l.title)}</strong><span>${recLabel(Object.assign({ start: key(today()) }, l.rec))}. ${esc(l.why)}</span></button>`; }).join('')}</div></section>`;
    }
    return quick + seg + body;
  }

  /* ================= Vue : Foyer ================= */
  function viewFoyer() {
    const p = S.profile;
    const counts = id => S.reminders.filter(r => r.who === id && r.active !== false).length;
    const members = `<section class="card"><div class="card-head"><div><span class="eyebrow">Membres</span><h2>Qui fait quoi</h2></div></div>
      ${S.members.map(m => `<div class="member"><span class="avatar" style="background:${m.color}">${esc(m.name[0] || '?').toUpperCase()}</span><div class="body"><strong>${esc(m.name)}</strong><span>${m.role}${counts(m.id) ? ` · ${plural(counts(m.id), 'rappel')}` : ''}</span></div></div>`).join('')}
      <div class="invite" style="margin-top:12px"><div><span class="eyebrow">Code d’invitation</span><div class="code" style="margin-top:6px" id="invite-code">${S.invite}</div></div><button class="btn sm" data-act="copyInvite">${ic('copy')} Copier</button></div>
      <p class="small muted" style="margin-top:10px">Chaque membre reçoit seulement ses rappels, et la liste de courses est partagée en direct.</p></section>`;
    const briefs = `<section class="card"><div class="card-head"><div><span class="eyebrow">Notifications</span><h2>Tes deux briefs</h2></div></div>
      <div class="setting"><label for="set-morning">${ic('sun', 'width:16px;height:16px;vertical-align:-3px;margin-right:6px')}Brief du matin</label><input type="time" id="set-morning" data-set="brief" data-k="morning" value="${p.briefs.morning}"></div>
      <div class="setting"><label for="set-evening">${ic('moon', 'width:16px;height:16px;vertical-align:-3px;margin-right:6px')}Brief du soir</label><input type="time" id="set-evening" data-set="brief" data-k="evening" value="${p.briefs.evening}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn sm" data-act="previewBrief" data-type="morning">Tester le matin</button><button class="btn sm" data-act="previewBrief" data-type="evening">Tester le soir</button><button class="btn sm signal" data-act="enableNotifs">${ic('bell')} Activer sur ce téléphone</button></div></section>`;
    const prefs = `<section class="card"><div class="card-head"><div><span class="eyebrow">Préférences</span><h2>Réglages</h2></div></div>
      <div class="setting"><label for="set-theme">Apparence</label><select id="set-theme" data-set="theme"><option value="auto" ${S.theme === 'auto' ? 'selected' : ''}>Automatique</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>Clair</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Sombre</option></select></div>
      <div class="setting"><span>Ville</span><span class="muted">${esc(city().name)}${p.coords ? ' · localisé' : ''}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="redoOB">${ic('refresh')} Refaire le questionnaire</button><button class="btn sm" data-act="reset" id="reset-btn">Réinitialiser</button></div></section>`;
    const nums = `<section class="card"><div class="card-head"><div><span class="eyebrow">Toujours sous la main</span><h2>Numéros utiles</h2></div></div>
      <div class="infos">${D.USEFUL_NUMBERS.map(([l, n]) => `<a class="info" href="tel:${n}" style="text-decoration:none;color:inherit"><span class="eyebrow">${esc(l)}</span><strong class="mono" style="font-size:20px">${n}</strong></a>`).join('')}</div></section>`;
    const about = `<section class="card tip"><span class="tip-icon">${ic('info')}</span><div><span class="eyebrow">Prototype</span><p class="small muted" style="margin-top:6px">Tilt v0.1. Les calendriers de collecte et les échéances marqués « exemple » sont fictifs. La météo vient d’Open-Meteo et les magasins d’OpenStreetMap quand la connexion le permet. Tes données restent sur ton téléphone.</p></div></section>`;
    return `<div class="grid-2"><div class="stack">${members}${briefs}</div><div class="stack">${prefs}${nums}${about}</div></div>`;
  }

  /* ================= Notifications, toasts, voix ================= */
  function showNotif(title, lines, opts = {}) {
    const layer = document.getElementById('notifs'); if (!layer) return;
    layer.querySelectorAll('.notif').forEach(n => n.remove());
    const el = document.createElement('div');
    el.className = 'notif collapsed';
    el.innerHTML = `<div class="notif-head"><span class="app-icon"><i></i></span><b>TILT</b><span class="mono">${opts.when || 'maintenant'}</span></div><strong>${esc(title)}</strong><ul>${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    layer.appendChild(el);
    vibrate([12, 40, 12]);
    let timer = setTimeout(() => dismiss(), 7000);
    const dismiss = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); };
    el.addEventListener('click', () => { if (el.classList.contains('collapsed') && lines.length > 2) { el.classList.remove('collapsed'); clearTimeout(timer); timer = setTimeout(dismiss, 8000); } else dismiss(); });
    if (opts.system && 'Notification' in window && Notification.permission === 'granted') {
      const body = lines.join('\n');
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, icon: 'icons/icon.svg', badge: 'icons/icon.svg' }));
        else new Notification(title, { body });
      } catch (e) { /* ignore */ }
    }
  }
  function previewBrief(type) {
    const b = buildBrief(type === 'evening');
    showNotif(type === 'evening' ? `Brief du soir · ${b.title}` : `Brief du matin · ${b.title}`, b.plain, { when: b.time });
  }
  let toastTimer;
  function toast(msg, undo) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Annuler</button>' : ''}`;
    document.body.appendChild(el);
    if (undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
  }
  function speak() {
    const b = buildBrief(new Date().getHours() >= 15);
    if (!('speechSynthesis' in window)) { toast('La lecture vocale n’est pas disponible ici'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${greeting()} ${S.profile.name}. ${b.title}. ${b.plain.join(' ')}`);
    u.lang = 'fr-FR'; u.rate = 1.02;
    const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.startsWith('fr'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    toast('Lecture du brief…');
  }
  // Pendant que l'app est ouverte : briefs et rappels à l'heure pile
  function tick() {
    if (!S || U.ob) return;
    const k = key(today()), m = nowMin(), p = S.profile;
    S.notified = S.notified || {};
    const once = (id, fn) => { const kk = k + '|' + id; if (!S.notified[kk]) { S.notified[kk] = 1; save(); fn(); } };
    if (m === toMin(p.briefs.morning)) once('morning', () => { const b = buildBrief(false); showNotif(`Brief du matin · ${b.title}`, b.plain, { system: true }); });
    if (m === toMin(p.briefs.evening)) once('evening', () => { const b = buildBrief(true); showNotif(`Brief du soir · ${b.title}`, b.plain, { system: true }); });
    const dn = doneSet(today());
    agendaFor(today()).forEach(it => { if (toMin(it.time) === m && !dn.has(it.id) && it.kind !== 'bin') once(it.id, () => showNotif(it.title, [it.sub || ''], { system: true })); });
  }

  /* ================= Feuilles (bottom sheets) ================= */
  function openSheet(html, focusId, cls) {
    const sh = document.getElementById('sheet');
    sh.className = 'sheet' + (cls ? ' ' + cls : '');
    sh.innerHTML = `<div class="grab"></div>${html}`;
    sh.scrollTop = 0;
    document.getElementById('scrim').classList.add('open');
    requestAnimationFrame(() => sh.classList.add('open'));
    if (focusId) setTimeout(() => { const f = document.getElementById(focusId); if (f) f.focus(); }, 350);
  }
  function closeSheet() {
    const sh = document.getElementById('sheet');
    sh.classList.remove('open'); sh.style.transform = '';
    document.getElementById('scrim').classList.remove('open');
    if (U.pendingRender) { U.pendingRender = false; render(); }
  }
  const QUICK_EXAMPLES = ['Appeler maman dimanche 18h', 'Tous les lundis sortir le chien à 7h30', 'RDV dentiste le 14/11 à 9h30', 'Dans 2 heures étendre le linge', 'Payer la cantine tous les mois le 5', 'Demain matin déposer le colis'];
  function openQuick() {
    openSheet(`<h2>Nouveau rappel</h2><p class="small muted">Écris comme tu parles. Tilt comprend la date, l’heure et la répétition.</p>
      <div class="quick" style="margin-top:16px"><input id="sheet-q" placeholder="Ex. Appeler maman dimanche 18h" autocomplete="off" aria-label="Nouveau rappel"><button class="btn primary" data-act="quickAdd" data-src="sheet-q" aria-label="Ajouter">${ic('plus')}</button></div>
      <div class="parse" id="sheet-q-parse"></div>
      <span class="eyebrow" style="display:block;margin:18px 0 10px">Exemples, touche pour essayer</span>
      <div class="suggest">${QUICK_EXAMPLES.map(x => `<button class="chip" data-act="fillQuick" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      ${S.members.length > 1 ? `<div class="field"><label for="sheet-who">Pour qui ?</label><select id="sheet-who">${S.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>` : ''}`, 'sheet-q');
  }
  function openDeadline() {
    openSheet(`<h2>Nouvelle échéance</h2><p class="small muted">Contrôle technique, passeport, fin de garantie, résiliation… Tilt compte les jours et te relance.</p>
      <form data-form="addDeadline"><div class="field"><label for="dl-title">Quoi ?</label><input id="dl-title" required placeholder="Ex. Fin de garantie du lave-linge"></div>
      <div class="field"><label for="dl-date">Quand ?</label><input id="dl-date" type="date" required value="${key(addDays(today(), 30))}"></div>
      <div class="field"><label for="dl-action">Que faudra-t-il faire ? (facultatif)</label><input id="dl-action" placeholder="Ex. Appeler le SAV avant cette date"></div>
      <button class="btn primary block" style="margin-top:18px">Ajouter l’échéance</button></form>`, 'dl-title');
  }
  function parsePreview(inputId) {
    const inp = document.getElementById(inputId), out = document.getElementById(inputId + '-parse');
    if (!inp || !out) return;
    const r = parseQuick(inp.value);
    if (!r) { out.innerHTML = ''; return; }
    const when = r.rec.type === 'once' ? relDay(parseKey(r.rec.date)) : recLabel(r.rec);
    out.innerHTML = `<span class="tag">${ic(r.icon, 'width:12px;height:12px')} ${esc(r.title)}</span><span class="tag">${ic('calendar', 'width:12px;height:12px')} ${esc(when)}</span><span class="tag">${ic('clock', 'width:12px;height:12px')} ${r.time}</span>`;
  }
  function addRem(text, who) {
    const r = parseQuick(text); if (!r) return null;
    const rem = { id: uid(), title: r.title, icon: r.icon, time: r.time, rec: r.rec, active: true, who: who || 'me', custom: true, cat: 'Perso' };
    S.reminders.push(rem); save(); vibrate(10);
    const when = r.rec.type === 'once' ? relDay(parseKey(r.rec.date)).toLowerCase() : recLabel(r.rec).toLowerCase();
    toast(`Rappel ajouté : ${when} à ${r.time}`, () => { S.reminders = S.reminders.filter(x => x.id !== rem.id); save(); render(); });
    return rem;
  }
  function quickAdd(inputId) {
    const inp = document.getElementById(inputId);
    if (!inp || !inp.value.trim()) { if (inp) inp.focus(); return; }
    const whoSel = document.getElementById('sheet-who');
    addRem(inp.value, whoSel ? whoSel.value : 'me');
    inp.value = ''; parsePreview(inputId);
    if (inputId === 'sheet-q') closeSheet();
    render();
  }

  /* ================= Recherche globale ================= */
  const SEARCH_PAGES = [
    ['collectes', '', 'Collectes et poubelles', 'trash', 'poubelle collecte dechet bac tri dechetterie prochaine calendrier jaune grise marron verre'],
    ['courses', '', 'Liste de courses', 'cart', 'courses liste magasin supermarche acheter boulangerie'],
    ['rappels', 'week', 'Rappels de la semaine', 'bell', 'rappel semaine agenda planning'],
    ['rappels', 'deadlines', 'Échéances', 'calendar', 'echeance compte a rebours controle technique assurance ferie vacances heure'],
    ['rappels', 'ideas', 'Idées de rappels', 'sparkle', 'idees bibliotheque oublie'],
    ['foyer', '', 'Réglages et foyer', 'users', 'foyer reglages theme sombre clair notification brief membres invitation ville questionnaire'],
    ['today', '', 'Météo du jour', 'cloudSun', 'meteo pluie temperature soleil parapluie'],
  ];
  const sItem = o => {
    const tag = o.href ? 'a' : o.act ? 'button' : 'div';
    const col = o.color === 'var(--bin-emb)' ? 'var(--warn)' : o.color;
    return `<${tag} class="s-item" ${o.act ? `data-act="${o.act}"` : ''} ${o.data || ''} ${o.href ? `href="${o.href}"` : ''}><span class="row-icon">${ic(o.icon)}</span><span class="s-text"><strong>${esc(o.title)}</strong>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</span>${o.right ? `<span class="s-right" ${col ? `style="color:${col}"` : ''}>${esc(o.right)}</span>` : o.act ? ic('chevR') : ''}</${tag}>`;
  };
  function searchResults(q) {
    const n = norm(q.trim());
    if (!n) return `<div class="s-group"><span class="eyebrow">Recherches rapides</span><div class="suggest">${['Prochaine collecte', 'Piles', 'Pharmacie', 'Lait', 'Contrôle technique', 'Brief', 'Médicaments'].map(x => `<button class="chip" data-act="fillSearch" data-v="${x}">${x}</button>`).join('')}</div></div>`;
    const words = n.split(/\s+/);
    const match = str => { const v = norm(str); return words.every(w => v.includes(w)); };
    const groups = [];
    const pg = SEARCH_PAGES.filter(([, , l, , kw]) => match(l + ' ' + kw));
    if (pg.length) groups.push(['Aller à', pg.map(([tab, seg, l, icn]) => sItem({ icon: icn, title: l, act: 'searchGo', data: `data-tab="${tab}" data-seg="${seg}" ${tab === 'today' ? 'data-target="wx-card"' : ''}` }))]);
    if (match('prochaine collecte poubelle')) { const nx = nextCollections(today())[0]; if (nx) groups.push(['Réponse', [sItem({ icon: 'trash', title: `${relDay(nx.date)} : bac ${D.BIN_TYPES[nx.bin.id].short.toLowerCase()}`, sub: D.BIN_TYPES[nx.bin.id].label, act: 'searchGo', data: 'data-tab="collectes"' })]]); }
    const rems = S.reminders.filter(r => match(r.title)).slice(0, 5);
    if (rems.length) groups.push(['Rappels', rems.map(r => { const nx = nextOcc(r); return sItem({ icon: r.icon, title: r.title, sub: `${recLabel(r.rec)} · ${r.time}${nx && r.active !== false ? ` · prochain : ${relDay(nx).toLowerCase()}` : ''}`, act: 'searchGo', data: 'data-tab="rappels" data-seg="rec"' }); })]);
    const cds = countdowns().filter(c => match(c.title + ' ' + (c.note || ''))).slice(0, 4);
    if (cds.length) groups.push(['Échéances', cds.map(c => sItem({ icon: c.icon, title: c.title, sub: `${c.in === 0 ? 'Aujourd’hui' : 'Dans ' + plural(c.in, 'jour')} · ${fmtShort(c.date)}`, act: 'searchGo', data: 'data-tab="rappels" data-seg="deadlines"' }))]);
    const li = S.list.filter(i => match(i.name));
    if (li.length) groups.push(['Liste de courses', li.map(i => sItem({ icon: 'cart', title: i.name, sub: i.got ? 'Déjà dans le caddie' : `À acheter · ${i.rayon}`, act: 'searchGo', data: 'data-tab="courses"' }))]);
    const tri = D.TRI.filter(([nm]) => match(nm)).slice(0, 4);
    if (tri.length) groups.push(['Où jeter ?', tri.map(([nm, dest, tip]) => sItem({ icon: 'recycle', title: nm, sub: tip, right: D.TRI_DEST[dest].label, color: D.TRI_DEST[dest].color }))]);
    const st = (U.stores || []).filter(x => match(x.name + ' ' + x.kind)).slice(0, 4);
    if (st.length) groups.push(['Magasins', st.map(x => { const o = openStatus(x.hours); return sItem({ icon: KIND_ICON[x.kind] || 'store', title: x.name, sub: `${o.label} · ${fmtDist(x.dist)}`, act: 'searchGo', data: 'data-tab="courses"' }); })]);
    const nums = D.USEFUL_NUMBERS.filter(([l, num]) => match(l) || num.startsWith(n));
    if (nums.length) groups.push(['Numéros utiles', nums.map(([l, num]) => sItem({ icon: 'phone', title: l, right: num, href: `tel:${num}` }))]);
    const pq = parseQuick(q);
    groups.push(['Actions', [
      sItem({ icon: 'plus', title: `Ajouter « ${cap(q.trim())} » à la liste`, act: 'searchAddItem', data: `data-v="${esc(q.trim())}"` }),
      sItem({ icon: 'bell', title: `Créer le rappel « ${pq.title} »`, sub: `${pq.rec.type === 'once' ? relDay(parseKey(pq.rec.date)) : recLabel(pq.rec)} · ${pq.time}`, act: 'searchAddRem', data: `data-v="${esc(q.trim())}"` }),
    ]]);
    return groups.map(([t, its]) => `<div class="s-group"><span class="eyebrow">${t}</span>${its.join('')}</div>`).join('');
  }
  function openSearch() {
    openSheet(`<h2>Rechercher</h2><p class="small muted">Un rappel, un déchet, un magasin, un article de ta liste…</p>
      <div class="search" style="margin-top:14px">${ic('search')}<input id="search-q" type="search" placeholder="Ex. piles, lait, dentiste" autocomplete="off" aria-label="Rechercher dans Tilt"></div>
      <div id="search-res">${searchResults('')}</div>`, 'search-q', 'top');
  }

  /* ================= Actions ================= */
  function toggleDone(row) {
    const id = row.dataset.id, k = row.dataset.day;
    const arr = S.done[k] = S.done[k] || [];
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else { arr.push(id); vibrate(15); }
    save();
    row.classList.toggle('is-done', i < 0);
    if (k === key(today())) {
      const items = agendaFor(today()), dn = doneSet(today()), nd = items.filter(x => dn.has(x.id)).length;
      const ring = document.getElementById('ring');
      if (ring) { ring.dataset.done = nd; ring.querySelector('span').textContent = `${nd}/${items.length}`; setRing(); }
      const lt = document.getElementById('left-title');
      if (lt) lt.textContent = items.length - nd ? `Encore ${plural(items.length - nd, 'chose')} à faire` : 'Tout est fait, bravo';
      if (id.startsWith('b:')) { const bc = document.getElementById('bin-card'); if (bc && i < 0) { bc.classList.add('done'); } }
      updateBadges();
      if (items.length && nd === items.length && i < 0) toast('Journée bouclée. Tu peux souffler.');
    }
    clearTimeout(U.reflow); U.reflow = setTimeout(() => { if (!document.querySelector('.sheet.open')) render(); }, 700);
  }
  function snooze(row) {
    const id = row.dataset.id, k = row.dataset.day;
    const it = agendaFor(parseKey(k)).find(x => x.id === id); if (!it) return;
    const base = Math.max(toMin(it.time), nowMin());
    const nt = fromMin(Math.min(23 * 60 + 30, Math.ceil((base + 60) / 15) * 15));
    S.snoozed[k] = S.snoozed[k] || {}; S.snoozed[k][id] = nt; save();
    toast(`Décalé à ${nt}`); render();
  }
  const actions = {
    tab: el => { if (U.tab === el.dataset.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } U.tab = el.dataset.tab; U.enter = true; try { history.replaceState(null, '', '#' + U.tab); } catch (e) { /* ignore */ } render(); window.scrollTo({ top: 0 }); },
    seg: el => { U.seg = el.dataset.seg; U.enter = false; render(); },
    goSeg: el => { U.tab = 'rappels'; U.seg = el.dataset.seg; U.enter = true; render(); window.scrollTo({ top: 0 }); },
    toggleDone: el => toggleDone(el.closest('.row')),
    snooze: el => snooze(el.closest('.row')),
    nowDone: el => { const c = el.closest('.now-card'); c.classList.add('leaving'); toggleDone(c); },
    nowSnooze: el => snooze(el.closest('.now-card')),
    scrollTo: el => { if (U.tab !== 'today') { U.tab = 'today'; U.enter = false; render(); } const t = document.getElementById(el.dataset.target); if (!t) return; t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); },
    briefMore: () => { U.briefOpen = !U.briefOpen; const b = document.querySelector('.brief'); b.classList.toggle('expanded', U.briefOpen); render(); },
    editBins: () => { U.editBins = !U.editBins; render(); },
    openSearch: () => openSearch(),
    fillSearch: el => { const i = document.getElementById('search-q'); i.value = el.dataset.v; document.getElementById('search-res').innerHTML = searchResults(i.value); i.focus(); },
    searchGo: el => { closeSheet(); U.tab = el.dataset.tab; try { history.replaceState(null, '', '#' + U.tab); } catch (e) { /* ignore */ } if (el.dataset.seg) U.seg = el.dataset.seg; U.enter = true; render(); window.scrollTo({ top: 0 }); if (el.dataset.target) setTimeout(() => actions.scrollTo(el), 250); },
    searchAddItem: el => { closeSheet(); addItem(el.dataset.v); toast(`${cap(el.dataset.v)} ajouté à la liste`); },
    searchAddRem: el => { closeSheet(); addRem(el.dataset.v, 'me'); render(); },
    binOut: el => { const row = document.querySelector(`.row[data-id="${el.dataset.id}"]`); const k = key(today()); S.done[k] = S.done[k] || []; if (!S.done[k].includes(el.dataset.id)) S.done[k].push(el.dataset.id); save(); vibrate([10, 30, 10]); const card = el.closest('.bin-card, .next-bin'); if (card) card.classList.add('done'); el.disabled = true; el.innerHTML = `${ic('check')} Bac sorti`; el.classList.remove('dark'); if (row) row.classList.add('is-done'); setTimeout(() => render(), 950); toast('Bac sorti. Tilt te rappellera de le rentrer demain.'); },
    leave: el => { const k = key(today()), arr = S.leave[k] = S.leave[k] || [], v = el.dataset.k, i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else { arr.push(v); vibrate(8); } save(); el.classList.toggle('on', i < 0); const all = leaveFor(today()); const n = all.filter(x => arr.includes(x.l)).length; const c = document.getElementById('leave-count'); if (c) c.textContent = `${n}/${all.length}`; if (n === all.length && i < 0) toast('C’est bon, tu peux y aller.'); },
    speak: () => speak(),
    previewBrief: el => previewBrief(el.dataset.type),
    openQuick: () => openQuick(),
    openDeadline: () => openDeadline(),
    closeSheet: () => closeSheet(),
    fillQuick: el => { const inp = document.getElementById('sheet-q'); inp.value = el.dataset.v; parsePreview('sheet-q'); inp.focus(); },
    quickAdd: el => quickAdd(el.dataset.src),
    binDay: el => { const b = S.profile.bins.find(x => x.id === el.dataset.bin), d = +el.dataset.day, i = b.days.indexOf(d); if (i >= 0) b.days.splice(i, 1); else b.days.push(d); save(); render(); },
    gotItem: el => { const it = S.list.find(i => i.id === el.closest('.item').dataset.item); it.got = !it.got; if (it.got) { const n = norm(it.name); const kk = Object.keys(S.purchases).find(x => norm(x) === n) || it.name.toLowerCase(); (S.purchases[kk] = S.purchases[kk] || []); if (!S.purchases[kk].includes(key(today()))) S.purchases[kk].push(key(today())); vibrate(8); } save(); el.closest('.item').classList.toggle('got', it.got); setTimeout(render, 380); },
    delItem: el => { const id = el.closest('.item').dataset.item, idx = S.list.findIndex(i => i.id === id), it = S.list[idx]; S.list.splice(idx, 1); save(); render(); toast(`${it.name} retiré`, () => { S.list.splice(idx, 0, it); save(); render(); }); },
    clearGot: () => { const prev = S.list.slice(); S.list = S.list.filter(i => !i.got); save(); render(); toast('Caddie vidé', () => { S.list = prev; save(); render(); }); },
    addSug: el => { addItem(el.dataset.name); },
    favStore: el => { const id = el.dataset.id, i = S.favStores.indexOf(id); if (i >= 0) S.favStores.splice(i, 1); else S.favStores = [id]; save(); render(); },
    remActive: el => { const r = S.reminders.find(x => x.id === el.dataset.id); r.active = r.active === false; save(); el.classList.toggle('on', r.active); el.setAttribute('aria-checked', r.active); updateBadges(); },
    delRem: el => { const idx = S.reminders.findIndex(x => x.id === el.dataset.id), r = S.reminders[idx]; S.reminders.splice(idx, 1); save(); render(); toast('Rappel supprimé', () => { S.reminders.splice(idx, 0, r); save(); render(); }); },
    delDeadline: el => { const idx = S.deadlines.findIndex(x => x.id === el.dataset.id), r = S.deadlines[idx]; S.deadlines.splice(idx, 1); save(); render(); toast('Échéance supprimée', () => { S.deadlines.splice(idx, 0, r); save(); render(); }); },
    addLib: el => { const l = D.LIBRARY[+el.dataset.i]; if (S.reminders.some(r => norm(r.title) === norm(l.title))) return; const rec = Object.assign({}, l.rec); if (rec.type === 'every') rec.start = key(today()); S.reminders.push({ id: uid(), title: l.title, icon: l.icon, cat: l.cat, time: l.time, rec, active: true, who: 'me', custom: true, sub: l.why }); save(); vibrate(10); render(); toast(`« ${l.title} » ajouté`); },
    copyInvite: () => { const code = S.invite; const done = () => toast('Code copié'); try { navigator.clipboard.writeText(code).then(done, () => selectText('invite-code')); } catch (e) { selectText('invite-code'); } },
    enableNotifs: async () => {
      if (!('Notification' in window)) { toast('Installe Tilt sur ton écran d’accueil pour recevoir les notifications'); return; }
      try { const r = await Notification.requestPermission(); if (r === 'granted') { toast('Notifications activées'); showNotif('Tilt est prêt', [`Brief du matin à ${S.profile.briefs.morning}`, `Brief du soir à ${S.profile.briefs.evening}`], { system: true }); } else toast('Notifications refusées : active-les dans les réglages du téléphone'); }
      catch (e) { toast('Les notifications ne sont pas disponibles ici'); }
    },
    redoOB: () => startOB(JSON.parse(JSON.stringify(S.profile)), 1),
    reset: el => { if (el.dataset.confirm) { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } S = null; app.innerHTML = ''; startOB(null, 0); } else { el.dataset.confirm = '1'; el.textContent = 'Confirmer la réinitialisation'; el.classList.add('signal'); } },
  };
  function selectText(id) { const el = document.getElementById(id); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Code sélectionné, copie-le'); }
  function addItem(name) {
    name = cap(name.trim()); if (!name) return;
    if (S.list.some(i => !i.got && norm(i.name) === norm(name))) { toast(`${name} est déjà sur la liste`); return; }
    S.list.unshift({ id: uid(), name, rayon: rayonOf(name), got: false, by: 'me' }); save(); vibrate(8); render();
    const inp = document.getElementById('add-item'); if (inp) inp.focus();
  }
  function applyTheme() {
    const t = S && S.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.dataset.act.startsWith('ob')) return;
    if (U.justDragged) { U.justDragged = false; return; }
    const fn = actions[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    if (f.dataset.form === 'addItem') { const inp = document.getElementById('add-item'); addItem(inp.value); }
    if (f.dataset.form === 'addDeadline') {
      const title = document.getElementById('dl-title').value.trim(), date = document.getElementById('dl-date').value, action = document.getElementById('dl-action').value.trim();
      if (!title || !date) return;
      S.deadlines.push({ id: uid(), title: cap(title), date, action, icon: guessIcon(title) === 'bell' ? 'calendar' : guessIcon(title) });
      save(); closeSheet(); render(); toast(`Échéance ajoutée : J-${diffDays(today(), parseKey(date))}`);
    }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'tri-q') document.getElementById('tri-res').innerHTML = triResults(t.value);
    if (t.id === 'quick-q' || t.id === 'sheet-q') parsePreview(t.id);
    if (t.id === 'search-q') document.getElementById('search-res').innerHTML = searchResults(t.value);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.id === 'quick-q' || e.target.id === 'sheet-q')) { e.preventDefault(); quickAdd(e.target.id); }
    if (e.key === 'Escape' && document.querySelector('.sheet.open')) closeSheet();
    if (e.key === '/' && S && !U.ob && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !document.querySelector('.sheet.open')) { e.preventDefault(); openSearch(); }
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.dataset.set || !S) return;
    if (t.dataset.set === 'binFreq') { const b = S.profile.bins.find(x => x.id === t.dataset.bin); const [f, par] = t.value.split('-'); b.freq = f; if (par) b.parity = par; }
    if (t.dataset.set === 'brief' && t.value) S.profile.briefs[t.dataset.k] = t.value;
    if (t.dataset.set === 'theme') { S.theme = t.value; applyTheme(); }
    save(); render();
  });
  document.addEventListener('focusout', () => { setTimeout(() => { if (U.pendingRender && !document.querySelector('.sheet.open') && !(document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName))) { U.pendingRender = false; render(); } }, 50); });

  // Mémorise les sections repliées / dépliées entre deux rendus
  document.addEventListener('toggle', e => {
    const k = e.target.dataset && e.target.dataset.k; if (!k) return;
    if (e.target.open) { U.open.add(k); U.closed.delete(k); } else { U.open.delete(k); U.closed.add(k); }
  }, true);

  /* Glisser un rappel : droite = fait, gauche = +1 h */
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const inner = e.target.closest('.row-inner'); if (!inner || e.target.closest('button')) return;
    drag = { row: inner.parentElement, inner, x: e.clientX, y: e.clientY, dx: 0, active: false };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.active) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) { drag.active = true; drag.row.classList.add('dragging'); } else if (Math.abs(dy) > 10) { drag = null; return; } else return; }
    drag.dx = Math.max(-140, Math.min(140, dx));
    drag.inner.style.transform = `translateX(${drag.dx}px)`;
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.active) return;
    U.justDragged = true; setTimeout(() => { U.justDragged = false; }, 50);
    d.row.classList.remove('dragging'); d.inner.style.transform = '';
    if (d.dx > 80) toggleDone(d.row); else if (d.dx < -80 && d.row.querySelector('.snooze')) snooze(d.row);
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* Glisser la feuille vers le bas pour la fermer */
  let sdrag = null;
  document.addEventListener('pointerdown', e => {
    const sh = e.target.closest('.sheet.open'); if (!sh || matchMedia('(min-width: 960px)').matches) return;
    if (e.target.closest('input,select,button,textarea')) return;
    if (e.clientY - sh.getBoundingClientRect().top > 70 || sh.scrollTop > 0) return;
    sdrag = { sh, y: e.clientY, dy: 0 }; sh.classList.add('dragging');
  });
  document.addEventListener('pointermove', e => { if (!sdrag) return; sdrag.dy = Math.max(0, e.clientY - sdrag.y); sdrag.sh.style.transform = `translateY(${sdrag.dy}px)`; });
  document.addEventListener('pointerup', () => { if (!sdrag) return; const s = sdrag; sdrag = null; s.sh.classList.remove('dragging'); if (s.dy > 110) closeSheet(); else s.sh.style.transform = ''; });

  /* ================= Questionnaire d'accueil ================= */
  const DEMO = {
    name: 'Camille', cityId: 'limoges', coords: null, bins: null,
    household: { couple: true, partner: 'Sam', kids: [{ name: 'Léo', activity: 'Piscine', day: 2 }, { name: 'Jade', activity: 'Danse', day: 3 }], dog: true, cat: false, plants: true, car: true },
    wake: '07:00', sleep: '23:00', work: true, remote: [3, 5], shopDays: [6], shopPref: 'Supermarché', meds: false, medsTime: '08:00', sportDays: [1, 4],
    briefs: { morning: '07:15', evening: '20:00' },
  };
  function blankProfile() {
    return { name: '', cityId: null, coords: null, bins: null, household: { couple: false, partner: '', kids: [], dog: false, cat: false, plants: false, car: false },
      wake: '07:00', sleep: '23:00', work: true, remote: [], shopDays: [6], shopPref: 'Supermarché', meds: false, medsTime: '08:00', sportDays: [], briefs: { morning: '07:15', evening: '20:00' } };
  }
  const OB_TOTAL = 7;
  function startOB(data, step) {
    U.ob = { step: step || 0, dir: 'fwd', data: data || blankProfile(), redo: !!data, q: '' };
    let ob = document.getElementById('ob');
    if (!ob) { ob = document.createElement('div'); ob.id = 'ob'; ob.className = 'ob'; document.body.appendChild(ob); }
    ob.classList.remove('leaving');
    renderOB();
  }
  function optBtn(act, k, on, icon, title, sub) {
    return `<button class="opt ${on ? 'on' : ''}" data-act="${act}" data-k="${k}" aria-pressed="${on}"><span class="tick">${CHECK_SVG}</span><span class="oi">${ic(icon)}</span><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ''}</button>`;
  }
  const dayChips = (field, arr) => `<div class="weekdays">${WEEK.map(d => `<button class="${arr.includes(d) ? 'on' : ''}" data-act="obDay" data-field="${field}" data-day="${d}" aria-label="${DAY_NAMES[d]}" aria-pressed="${arr.includes(d)}">${DAY_SHORT[d]}</button>`).join('')}</div>`;
  const slider = (id, label, val, min, max) => `<div class="slider-row"><div class="top"><span class="small muted">${label}</span><span class="val" id="${id}-v">${val}</span></div><input type="range" id="${id}" min="${min}" max="${max}" step="15" value="${toMin(val)}" data-ob-time="${id}" aria-label="${label}"></div>`;
  function cityList(q) {
    const n = norm(q || '');
    const list = D.CITIES.filter(c => !n || norm(c.name).includes(n) || c.cp.startsWith(n));
    return list.map(c => `<button class="city ${U.ob.data.cityId === c.id ? 'on' : ''}" data-act="obCity" data-id="${c.id}"><strong>${esc(c.name)}</strong><span>${c.cp}</span></button>`).join('') || '<p class="small muted">Ta ville n’est pas encore dans le prototype. Choisis la plus proche, tu pourras régler les jours de collecte ensuite.</p>';
  }
  function renderOB() {
    const o = U.ob, d = o.data, s = o.step, ob = document.getElementById('ob');
    const top = s > 0 && s <= OB_TOTAL ? `<div class="ob-top"><button class="ob-back" data-act="obBack" aria-label="Retour">${ic('chevL')}</button><div class="ob-progress"><i style="width:${(s / OB_TOTAL) * 100}%"></i></div><span class="mono small muted">${s}/${OB_TOTAL}</span></div>` : '';
    const next = (label = 'Continuer', dis = false) => `<div class="ob-foot"><button class="btn primary block" data-act="obNext" id="ob-next" ${dis ? 'disabled' : ''} style="height:54px;font-size:16px">${label}</button></div>`;
    let body = '';
    if (s === 0) {
      body = `<div class="welcome">${logo()}<h1 style="max-width:14ch">Le pense-bête qui pense pour toi.</h1>
        <p class="lead">Poubelles, courses, rendez-vous, météo, échéances : Tilt te prévient au bon moment, sans que tu aies à tout noter.</p>
        <div class="mock-notifs">
          <div class="notif" style="--i:0"><div class="notif-head"><span class="app-icon"><i></i></span><b>TILT</b><span class="mono">20:00</span></div><strong>Ce soir : poubelle jaune</strong><ul><li>Collecte demain matin, sors le bac avant de dormir</li></ul></div>
          <div class="notif" style="--i:1"><div class="notif-head"><span class="app-icon"><i></i></span><b>TILT</b><span class="mono">07:15</span></div><strong>Pluie vers 17h</strong><ul><li>Prends le parapluie et le sac de piscine de Léo</li></ul></div>
        </div></div>
        <div class="ob-foot"><button class="btn primary block" data-act="obNext" style="height:54px;font-size:16px">Commencer, ça prend 2 minutes</button><button class="btn block" data-act="obDemo">Explorer avec un foyer d’exemple</button></div>`;
    } else if (s === 1) {
      body = `<span class="eyebrow">Faisons connaissance</span><h1>Comment tu t’appelles ?</h1><p class="lead">C’est pour personnaliser ton brief du matin.</p>
        <input class="ob-input" id="ob-name" value="${esc(d.name)}" placeholder="Ton prénom" autocomplete="given-name" maxlength="24">${next('Continuer', !d.name.trim())}`;
    } else if (s === 2) {
      body = `<span class="eyebrow">Ta ville</span><h1>Où habites-tu, ${esc(d.name)} ?</h1><p class="lead">Pour les jours de collecte, la météo et les magasins autour de toi.</p>
        <button class="btn dark" data-act="obLocate" id="ob-locate">${ic('nav')} Me localiser</button>
        <div class="search">${ic('search')}<input id="ob-city" type="search" placeholder="Ou cherche ta ville / code postal" autocomplete="off" value="${esc(o.q)}"></div>
        <div class="city-list" id="ob-cities">${cityList(o.q)}</div>${next('Continuer', !d.cityId)}`;
    } else if (s === 3) {
      if (!d.bins) d.bins = binsFromCity(D.CITIES.find(c => c.id === d.cityId));
      body = `<span class="eyebrow">Collectes · ${esc(D.CITIES.find(c => c.id === d.cityId).name)}</span><h1>Tes jours de poubelles</h1><p class="lead">On a prérempli avec un calendrier d’exemple. Corrige si ce n’est pas ton cas : c’est ce qui fait sonner Tilt la veille.</p>
        ${d.bins.map(b => { const T = D.BIN_TYPES[b.id]; return `<div class="slider-row"><div class="top" style="align-items:center;gap:10px;justify-content:flex-start"><span class="bin-swatch" style="background:${T.color};color:${binFg(b.id)};width:32px;height:32px;border-radius:10px">${ic('trash')}</span><strong>${T.label}</strong></div>
          <div class="weekdays">${WEEK.map(dd => `<button class="${b.days.includes(dd) ? 'on' : ''}" data-act="obBinDay" data-bin="${b.id}" data-day="${dd}" aria-label="${DAY_NAMES[dd]}">${DAY_SHORT[dd]}</button>`).join('')}</div>
          ${b.freq === 'biweekly' ? '<span class="small muted">Une semaine sur deux</span>' : ''}</div>`; }).join('')}${next()}`;
    } else if (s === 4) {
      const h = d.household;
      body = `<span class="eyebrow">Ton foyer</span><h1>Qui vit avec toi ?</h1><p class="lead">Tilt ajoute les bons rappels automatiquement. Coche tout ce qui te concerne.</p>
        <div class="opts">${optBtn('obToggle', 'couple', h.couple, 'heart', 'En couple', 'Liste et rappels partagés')}${optBtn('obToggle', 'kids', h.kids.length > 0, 'school', 'Enfants', 'Activités, sacs, vacances')}${optBtn('obToggle', 'dog', h.dog, 'paw', 'Un chien', 'Balades, vermifuge')}
          ${optBtn('obToggle', 'cat', h.cat, 'paw', 'Un chat', 'Litière, vermifuge')}${optBtn('obToggle', 'plants', h.plants, 'leaf', 'Des plantes', 'Arrosage selon la météo')}${optBtn('obToggle', 'car', h.car, 'car', 'Une voiture', 'Contrôle technique, pneus')}</div>
        ${h.couple ? `<input class="ob-input" style="font-size:16px;height:52px" id="ob-partner" value="${esc(h.partner)}" placeholder="Prénom de ton/ta partenaire" maxlength="24">` : ''}
        ${h.kids.length ? `<div style="display:grid;gap:8px"><span class="eyebrow">Enfants et activités</span>${h.kids.map((k, i) => `<div class="kid-row"><input data-kid="${i}" data-f="name" value="${esc(k.name)}" placeholder="Prénom" maxlength="20" aria-label="Prénom de l’enfant">
          <select data-kid="${i}" data-f="activity" aria-label="Activité"><option value="">Activité</option>${Object.keys(ACTIVITIES).map(a => `<option ${k.activity === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
          <select data-kid="${i}" data-f="day" aria-label="Jour">${WEEK.map(dd => `<option value="${dd}" ${+k.day === dd ? 'selected' : ''}>${DAY_SHORT[dd]}</option>`).join('')}</select>
          <button class="snooze" data-act="obDelKid" data-i="${i}" aria-label="Retirer">${ic('x')}</button></div>`).join('')}
          <button class="btn sm" data-act="obAddKid" style="justify-self:start">${ic('plus')} Ajouter un enfant</button></div>` : ''}${next()}`;
    } else if (s === 5) {
      body = `<span class="eyebrow">Ton rythme</span><h1>À quoi ressemblent tes journées ?</h1><p class="lead">Pour envoyer les rappels au bon moment, jamais pendant que tu dors.</p>
        ${slider('ob-wake', 'Je me lève vers', d.wake, 300, 660)}${slider('ob-sleep', 'Je me couche vers', d.sleep, 1200, 1439)}
        <div class="opts" style="grid-template-columns:1fr 1fr">${optBtn('obWork', 'work', d.work, 'badge', 'Je travaille / j’étudie', 'Badge, horaires')}${optBtn('obWork', 'nowork', !d.work, 'home', 'Plutôt à la maison', '')}</div>
        ${d.work ? `<div class="slider-row"><span class="small muted">Jours de télétravail (pas besoin de badge)</span>${dayChips('remote', d.remote)}</div>` : ''}${next()}`;
    } else if (s === 6) {
      body = `<span class="eyebrow">Courses & santé</span><h1>Tes habitudes</h1><p class="lead">Tilt prépare ta liste, surveille les horaires des magasins et suit ce que tu rachètes souvent.</p>
        <div class="slider-row"><span class="small muted">Je fais mes courses le</span>${dayChips('shopDays', d.shopDays)}</div>
        <div class="opts">${['Supermarché', 'Discount', 'Bio', 'Marché', 'Drive', 'Proximité'].map(x => optBtn('obShop', x, d.shopPref === x, { Supermarché: 'cart', Discount: 'card', Bio: 'leaf', Marché: 'store', Drive: 'car', Proximité: 'pin' }[x], x, '')).join('')}</div>
        <div class="slider-row"><span class="small muted">Sport ou activité régulière</span>${dayChips('sportDays', d.sportDays)}</div>
        <div class="opts" style="grid-template-columns:1fr">${optBtn('obMeds', 'meds', d.meds, 'pill', 'Je prends un traitement chaque jour', d.meds ? 'Rappel quotidien à l’heure choisie' : 'Tilt te le rappellera')}</div>
        ${d.meds ? slider('ob-meds', 'Heure de la prise', d.medsTime, 300, 1380) : ''}${next()}`;
    } else if (s === 7) {
      body = `<span class="eyebrow">Tes briefs</span><h1>Deux notifications par jour, pas plus.</h1><p class="lead">Le matin pour ta journée, le soir pour préparer demain. Le reste arrive pile à l’heure.</p>
        ${slider('ob-morning', 'Brief du matin', d.briefs.morning, 300, 720)}${slider('ob-evening', 'Brief du soir', d.briefs.evening, 1020, 1380)}
        <div class="notif" style="animation:none;cursor:default"><div class="notif-head"><span class="app-icon"><i></i></span><b>TILT</b><span class="mono" id="ob-prev-time">${d.briefs.evening}</span></div><strong>Ce soir, avant de dormir</strong><ul style="display:grid"><li>Sors la poubelle jaune, collecte demain matin</li>${d.household.kids[0] && d.household.kids[0].activity ? `<li>Prépare le ${(ACTIVITIES[d.household.kids[0].activity] || { bag: 'sac' }).bag.toLowerCase()} de ${esc(d.household.kids[0].name || 'ton enfant')}</li>` : ''}<li>Demain : 14° max, pluie vers 9h</li></ul></div>
        ${next('Créer mon pense-bête')}`;
    } else {
      const st = buildState(d, o.redo ? S : null);
      o.built = st;
      const steps = [
        `Calendrier de collecte de ${esc(D.CITIES.find(c => c.id === d.cityId).name)}`,
        `${plural(st.reminders.length, 'rappel')} adaptés à ton foyer`,
        'Météo et magasins autour de toi',
        `${plural(st.deadlines.length, 'échéance')} et jours fériés suivis`,
        `Brief du matin à ${d.briefs.morning}, du soir à ${d.briefs.evening}`,
      ];
      body = `<span class="eyebrow">C’est prêt</span><h1>On a préparé ton pense-bête, ${esc(d.name)}.</h1>
        <div class="big-count"><span data-count="${st.reminders.length + st.deadlines.length + (d.bins || []).length}">0</span> <span style="font-size:20px;letter-spacing:0;color:var(--ink-2)">choses que tu n’as plus à retenir</span></div>
        <ul class="build-list">${steps.map((x, i) => `<li style="--i:${i}"><span class="check">${CHECK_SVG}</span>${x}</li>`).join('')}</ul>
        <div class="ob-foot"><button class="btn primary block" data-act="obFinish" style="height:54px;font-size:16px">Ouvrir Tilt</button></div>`;
    }
    ob.innerHTML = `<div class="ob-inner">${top}<div class="ob-step ${o.dir}">${body}</div></div>`;
    o.dir = '';
    ob.scrollTop = 0;
    if (s === 8) animateCounts(ob);
    const f = ob.querySelector('#ob-name'); if (f && !('ontouchstart' in window)) f.focus();
  }
  function obGo(n) { const o = U.ob; o.dir = n > o.step ? 'fwd' : 'back'; o.step = n; renderOB(); }
  function finishOB() {
    const o = U.ob, ob = document.getElementById('ob');
    S = o.built || buildState(o.data, o.redo ? S : null);
    save(); U.ob = null; U.tab = 'today'; U.enter = true;
    renderShell(); render();
    loadWeather(); loadStores();
    ob.classList.add('leaving');
    setTimeout(() => ob.remove(), 700);
    setTimeout(() => showNotif(`Bienvenue ${S.profile.name} !`, [`Ton premier brief arrive à ${new Date().getHours() >= 15 ? S.profile.briefs.evening : S.profile.briefs.morning}.`, 'Touche + pour ajouter un rappel en langage naturel.']), 1200);
  }
  const obActions = {
    obNext: () => { const o = U.ob; if (o.step === 1 && !o.data.name.trim()) return; if (o.step === 2 && !o.data.cityId) return; obGo(o.step + 1); },
    obBack: () => obGo(Math.max(0, U.ob.step - 1)),
    obDemo: () => { U.ob.data = JSON.parse(JSON.stringify(DEMO)); U.ob.data.bins = binsFromCity(D.CITIES[0]); obGo(8); },
    obFinish: () => finishOB(),
    obCity: el => { const d = U.ob.data; if (d.cityId !== el.dataset.id) { d.cityId = el.dataset.id; d.bins = null; d.coords = null; } document.querySelectorAll('#ob-cities .city').forEach(c => c.classList.toggle('on', c.dataset.id === d.cityId)); document.getElementById('ob-next').disabled = false; },
    obLocate: el => {
      if (!navigator.geolocation) { toast('Localisation indisponible : choisis ta ville dans la liste'); return; }
      el.innerHTML = `${ic('nav')} Localisation…`;
      navigator.geolocation.getCurrentPosition(pos => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const near = D.CITIES.map(x => ({ x, d: haversine(c, x) })).sort((a, b) => a.d - b.d)[0];
        const d = U.ob.data; d.cityId = near.x.id; d.coords = c; d.bins = null;
        renderOB();
        toast(near.d > 30000 ? `Ville la plus proche dans le prototype : ${near.x.name}` : `Trouvé : ${near.x.name}`);
      }, () => { el.innerHTML = `${ic('nav')} Me localiser`; toast('Localisation refusée : choisis ta ville dans la liste'); }, { timeout: 8000, maximumAge: 600000 });
    },
    obBinDay: el => { const b = U.ob.data.bins.find(x => x.id === el.dataset.bin), dd = +el.dataset.day, i = b.days.indexOf(dd); if (i >= 0) b.days.splice(i, 1); else b.days.push(dd); el.classList.toggle('on', i < 0); },
    obToggle: el => { const h = U.ob.data.household, k = el.dataset.k; if (k === 'kids') h.kids = h.kids.length ? [] : [{ name: '', activity: '', day: 3 }]; else h[k] = !h[k]; renderOB(); },
    obAddKid: () => { U.ob.data.household.kids.push({ name: '', activity: '', day: 3 }); renderOB(); },
    obDelKid: el => { U.ob.data.household.kids.splice(+el.dataset.i, 1); renderOB(); },
    obWork: el => { U.ob.data.work = el.dataset.k === 'work'; renderOB(); },
    obDay: el => { const arr = U.ob.data[el.dataset.field], dd = +el.dataset.day, i = arr.indexOf(dd); if (i >= 0) arr.splice(i, 1); else arr.push(dd); el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', i < 0); },
    obShop: el => { U.ob.data.shopPref = el.dataset.k; document.querySelectorAll('[data-act="obShop"]').forEach(b => { b.classList.toggle('on', b.dataset.k === el.dataset.k); b.setAttribute('aria-pressed', b.dataset.k === el.dataset.k); }); },
    obMeds: () => { U.ob.data.meds = !U.ob.data.meds; renderOB(); },
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el || !el.dataset.act.startsWith('ob') || !U.ob) return;
    e.preventDefault(); obActions[el.dataset.act](el, e);
  });
  document.addEventListener('input', e => {
    if (!U.ob) return;
    const t = e.target, d = U.ob.data;
    if (t.id === 'ob-name') { d.name = t.value; document.getElementById('ob-next').disabled = !t.value.trim(); }
    if (t.id === 'ob-city') { U.ob.q = t.value; document.getElementById('ob-cities').innerHTML = cityList(t.value); }
    if (t.id === 'ob-partner') d.household.partner = t.value;
    if (t.dataset.kid != null) { const k = d.household.kids[+t.dataset.kid]; k[t.dataset.f] = t.dataset.f === 'day' ? +t.value : t.value; }
    if (t.dataset.obTime) {
      const v = fromMin(+t.value); document.getElementById(t.id + '-v').textContent = v;
      ({ 'ob-wake': () => { d.wake = v; }, 'ob-sleep': () => { d.sleep = v; }, 'ob-meds': () => { d.medsTime = v; }, 'ob-morning': () => { d.briefs.morning = v; }, 'ob-evening': () => { d.briefs.evening = v; const p = document.getElementById('ob-prev-time'); if (p) p.textContent = v; } })[t.id]();
    }
  });
  document.addEventListener('change', e => {
    if (!U.ob) return;
    const t = e.target; if (t.dataset.kid != null) { const k = U.ob.data.household.kids[+t.dataset.kid]; k[t.dataset.f] = t.dataset.f === 'day' ? +t.value : t.value; }
  });
  document.addEventListener('keydown', e => { if (U.ob && e.key === 'Enter' && e.target.id === 'ob-name' && U.ob.data.name.trim()) obGo(2); });

  /* ================= Démarrage ================= */
  function boot() {
    const h = (location.hash || '').slice(1);
    if (TABS.some(t => t[0] === h)) U.tab = h;
    if (!S || !S.profile) { startOB(null, 0); }
    else { renderShell(); render(); loadWeather(); loadStores(); }
    setInterval(() => { tick(); }, 20000);
    // Rafraîchir l'écran au changement de jour ou au retour dans l'app
    document.addEventListener('visibilitychange', () => { if (!document.hidden && S && !U.ob) render(); });
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* hors PWA */ });
    }
  }
  boot();
})();
