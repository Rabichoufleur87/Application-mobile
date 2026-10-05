/* Marge — finances personnelles automatisées (prototype PWA, sans framework) */
(() => {
  'use strict';
  const D = window.MARGE_DATA;
  const STORE_KEY = 'marge.v1';
  const app = document.getElementById('app');

  /* ================= Utilitaires ================= */
  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = () => startOfDay(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addMonths = (d, n, dom) => { const day = dom || d.getDate(); const x = new Date(d.getFullYear(), d.getMonth() + n, 1); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; };
  const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const plural = (n, w, p) => `${n} ${n > 1 ? (p || w + 's') : w}`;
  const sum = a => a.reduce((s, x) => s + x, 0);
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const round2 = n => Math.round(n * 100) / 100;
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const DAY_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const fmtDate = d => `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtShort = d => `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
  const relDay = d => { const n = diffDays(today(), d); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : n === -1 ? 'hier' : n > 1 && n < 7 ? DAY_NAMES[d.getDay()] : `le ${fmtShort(d)}`; };
  const inDays = n => n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`;
  const NBSP = '\u00a0';
  const dots = h => h.replace(/\.\./g, '.');
  const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const EUR0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const eur = (n, dec = true) => (dec ? EUR : EUR0).format(Math.abs(n) < 0.005 ? 0 : n).replace(/[\u202f\u00a0 ]/g, NBSP);
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + eur(Math.abs(n));
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Icônes ================= */
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevR: '<path d="m9 5 7 7-7 7"/>',
    chevL: '<path d="m15 5-7 7 7 7"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>',
    fork: '<path d="M7 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 13v8"/><path d="M17 21V3c-2 0-3.5 2.5-3.5 6.5S15 14 17 14"/>',
    car: '<path d="M4 15.5v-3.2l1.9-4.8A2.2 2.2 0 0 1 8 6h8a2.2 2.2 0 0 1 2.1 1.5l1.9 4.8v3.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4.5 12h15M6.5 16.5v2M17.5 16.5v2"/>',
    ticket: '<path d="M3 8.5V6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v2a3.5 3.5 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2a3.5 3.5 0 0 0 0-7z"/><path d="M14 5v14" stroke-dasharray="2 2.5"/>',
    bag: '<path d="M5 8h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    cross: '<path d="M9 3.5h6v5.5h5.5v6H15v5.5H9V15H3.5V9H9z"/>',
    dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    arrowDown: '<path d="M12 4v15M6 13l6 6 6-6"/>',
    arrowUp: '<path d="M12 20V5M6 11l6-6 6 6"/>',
    piggy: '<path d="M19 11c0-3.3-3.1-6-7-6S5 7.7 5 11c0 1.6.7 3 1.9 4.1L7 19h3v-2h4v2h3l.3-3.3c.6-.4 1.1-.9 1.5-1.4H21v-4h-1.6"/><circle cx="15.5" cy="10" r=".8"/><path d="M11 5.2V3.5"/>',
    upload: '<path d="M12 15V4M7 9l5-5 5 5"/><path d="M4 15v4a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-4"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.2"/>',
    trendUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    trendDown: '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2"/><circle cx="16" cy="13.5" r="1.2"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2.5"/><path d="M16 8V5.5A2 2 0 0 0 14 3.5H5.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    scissors: '<circle cx="6" cy="7" r="2.8"/><circle cx="6" cy="17" r="2.8"/><path d="M8.3 8.6 20 18M8.3 15.4 20 6"/>',
    zap: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    copy2: '<path d="M8 4h11v11"/><rect x="4" y="8" width="12" height="12" rx="2"/>',
  };
  const ic = (n, style = '') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${style ? ` style="${style}"` : ''}>${I[n] || I.dots}</svg>`;

  /* ================= Catégories ================= */
  const CAT = {};
  D.CATS.forEach((c, i) => { CAT[c.id] = Object.assign({ color: `var(--c${i + 1})`, spend: true }, c); });
  D.SPECIAL.forEach(c => { CAT[c.id] = Object.assign({ color: c.id === 'revenus' ? 'var(--pos)' : 'var(--accent)', spend: false }, c); });
  const catIc = (id, size) => { const c = CAT[id] || CAT.autres; return `<span class="cat-ic" style="background:color-mix(in srgb, ${c.color} 16%, var(--surface));color:${c.color}${size ? `;width:${size}px;height:${size}px` : ''}">${ic(c.icon)}</span>`; };

  /* ================= État ================= */
  function load() { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } M = null; }
  let S = load();
  let M = null; // modèle calculé (cache)
  const U = { tab: 'today', enter: true, filter: 'all', q: '', month: 0, limit: 80, afford: '', ob: null };

  /* ================= Libellés & classement automatique ================= */
  function cleanName(label) {
    const known = D.PRETTY.find(([re]) => re.test(norm(label)));
    if (known) return (/salaire/i.test(label) ? 'Salaire · ' : '') + known[1];
    let s = String(label);
    const isRetrait = /^retrait/i.test(s);
    s = s.replace(/^(CB|CARTE\s+\S+|PRLV SEPA|PRLV|VIR SEPA RECU|VIR INST RECU|VIR SEPA|VIR INST|VIR|RETRAIT)\s+/i, '');
    s = s.replace(/^\/?DE\s+/i, '').replace(/\s*\/MOTIF.*$/i, '').replace(/\/.*$/, '');
    s = s.replace(/help\.uber\.com/gi, ' ').replace(/\.(com|fr|eu)\b/gi, ' ').replace(/^vers\s+/i, '');
    s = s.replace(/\b[A-Z0-9]*\d{3,}[A-Z0-9-]*\b/gi, ' ').replace(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,}\b/gi, ' ');
    s = s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    s = s.replace(/\b(Sarl|Sas|Sa|Sci|Eurl)\b\s*/g, '').replace(/\s(Fr|France)$/, '').trim();
    if (s.includes(' ')) s = s.replace(D.CITIES, '').trim();
    s = s.replace(/\b(Edf|Sncf|Maif|Macif|Caf|Cpam|Dab|Kfc|Ugc|Cgr|Ratp|Stcl|Sfr)\b/g, w => w.toUpperCase());
    const salary = /salaire/i.test(label) ? 'Salaire · ' : '';
    return (isRetrait ? 'Retrait ' : salary) + (s || label);
  }
  const STOP = new Set(['salaire', 'sa', 'sas', 'sarl', 'sci', 'de', 'du', 'des', 'la', 'le', 'les', 'fr', 'france', 'limoges', 'paris']);
  function merchantKey(label) {
    const w = norm(cleanName(label)).split(/[\s.'’-]+/).filter(x => x.length > 1 && !STOP.has(x));
    return w.slice(0, 2).join(' ') || norm(label).slice(0, 20);
  }
  function categorize(label, amount) {
    const mk = merchantKey(label);
    const user = (S && S.rules || []).find(r => r.m === mk);
    if (user) return { cat: user.cat, auto: false };
    const s = ' ' + norm(label).replace(/\s+/g, ' ') + ' ';
    const hit = D.RULES.find(([, re]) => re.test(s));
    if (hit && !(hit[0] === 'revenus' && amount < 0)) return { cat: hit[0], auto: true };
    return { cat: amount > 0 ? 'revenus' : 'autres', auto: true };
  }

  /* ================= Modèle financier ================= */
  function payDate(y, m) {
    const day = Math.min(S.profile.payday, new Date(y, m + 1, 0).getDate());
    const d = new Date(y, m, day);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d;
  }
  function nextPayday(t) { let d = payDate(t.getFullYear(), t.getMonth()); if (d <= t) d = payDate(t.getFullYear(), t.getMonth() + 1); return d; }
  function lastPayday(t) { let d = payDate(t.getFullYear(), t.getMonth()); if (d > t) d = payDate(t.getFullYear(), t.getMonth() - 1); return d; }

  function detectRecurring() {
    const groups = {};
    S.tx.forEach(t => { if (t.amount >= 0 || t.cat === 'epargne' || /retrait/i.test(t.label)) return; (groups[merchantKey(t.label)] = groups[merchantKey(t.label)] || []).push(t); });
    const out = [], t0 = today();
    Object.entries(groups).forEach(([k, list]) => {
      if (list.length === 1 && (list[0].cat === 'abos' || list[0].cat === 'logement') && diffDays(parseKey(list[0].date), t0) <= 31) {
        const x = list[0], d0 = parseKey(x.date), fam = D.FAMILIES.find(([, , re]) => re.test(norm(x.label)));
        out.push({ key: k, name: cleanName(x.label), cat: x.cat, amount: -x.amount, freq: 'mensuel', estimated: true, every28: false, step: d => addMonths(d, 1, d0.getDate()), last: d0, next: addMonths(d0, 1), change: 0, monthly: -x.amount, yearly: -x.amount * 12, family: fam ? fam[0] : null, familyLabel: fam ? fam[1] : null, isSub: x.cat === 'abos', count: 1 });
        return;
      }
      if (list.length < 2) return;
      list.sort((a, b) => a.date < b.date ? -1 : 1);
      const amts = list.map(x => -x.amount), med = median(amts);
      if (amts.slice(-4).some(a => Math.abs(a - med) / med > 0.15)) return;
      const gaps = []; for (let i = 1; i < list.length; i++) gaps.push(diffDays(parseKey(list[i - 1].date), parseKey(list[i].date)));
      const g = median(gaps);
      let freq;
      if (g >= 26 && g <= 35) freq = 'mensuel'; else if (g >= 6 && g <= 8) freq = 'hebdo'; else if (g >= 350 && g <= 380) freq = 'annuel'; else return;
      if (gaps.some(x => Math.abs(x - g) > (freq === 'annuel' ? 15 : 4))) return;
      const last = list[list.length - 1], lastD = parseKey(last.date);
      if (diffDays(lastD, t0) > g * 1.6) return; // arrêté
      const every28 = freq === 'mensuel' && gaps.every(x => Math.abs(x - 28) <= 1);
      const step = d => freq === 'annuel' ? addMonths(d, 12) : freq === 'hebdo' ? addDays(d, 7) : every28 ? addDays(d, 28) : addMonths(d, 1, lastD.getDate());
      const amount = -last.amount, prev = list.length > 1 ? -list[list.length - 2].amount : amount;
      const monthly = freq === 'annuel' ? amount / 12 : freq === 'hebdo' ? amount * 52 / 12 : every28 ? amount * 13 / 12 : amount;
      const fam = D.FAMILIES.find(([, , re]) => re.test(norm(last.label)));
      out.push({ key: k, name: cleanName(last.label), cat: last.cat, amount, freq, every28, step, last: lastD, next: step(lastD), change: Math.abs(amount - prev) >= 0.5 ? round2(amount - prev) : 0, monthly, yearly: monthly * 12, family: fam ? fam[0] : null, familyLabel: fam ? fam[1] : null, isSub: last.cat === 'abos', count: list.length });
    });
    return out.sort((a, b) => b.monthly - a.monthly);
  }

  function model() {
    if (M) return M;
    const t = today(), tk = key(t), p = S.profile;
    const rec = detectRecurring(), fixedKeys = new Set(rec.map(r => r.key));
    const isFixed = x => fixedKeys.has(merchantKey(x.label));
    const FIXED_CATS = new Set(['epargne', 'logement', 'abos']);
    const isVar = x => x.amount < 0 && !FIXED_CATS.has(x.cat) && !isFixed(x);
    const balanceAt = k => p.startBalance + sum(S.tx.filter(x => x.date <= k).map(x => x.amount));
    const balance = round2(balanceAt(tk));
    const nextPay = nextPayday(t), lastPay = lastPayday(t);
    const daysLeft = Math.max(1, diffDays(t, nextPay));
    const todayTx = S.tx.filter(x => x.date === tk);
    const varToday = -sum(todayTx.filter(isVar).map(x => x.amount));
    // Prélèvements attendus d'ici la paie
    const upcoming = [];
    rec.forEach(r => {
      let d = r.next, guard = 0;
      while (d < nextPay && guard++ < 60) {
        const dk = key(d);
        const already = d <= t && S.tx.some(x => x.date >= key(addDays(d, -3)) && merchantKey(x.label) === r.key && x.date <= tk && x.date > key(r.last));
        if (!already && d >= addDays(t, -3)) upcoming.push({ date: d < t ? t : d, key: dk, name: r.name, amount: r.amount, rec: r });
        d = r.step(d);
      }
    });
    upcoming.sort((a, b) => a.date - b.date);
    const upSum = sum(upcoming.map(u => u.amount));
    const savedCycle = -sum(S.tx.filter(x => x.cat === 'epargne' && x.date >= key(lastPay) && x.amount < 0).map(x => x.amount));
    const savingsLeft = Math.max(0, p.savingsGoal - savedCycle);
    const available = balance + varToday - upSum - savingsLeft - p.cushion;
    const daily = available / daysLeft;
    const leftToday = daily - varToday;
    const rest = available - varToday; // pour les jours suivants
    const tomorrowDaily = daysLeft > 1 ? rest / (daysLeft - 1) : rest;
    // Dépense variable moyenne (30 derniers jours, hors aujourd'hui)
    const k30 = key(addDays(t, -30));
    const avgVar = -sum(S.tx.filter(x => isVar(x) && x.date >= k30 && x.date < tk).map(x => x.amount)) / 30;
    // Historique du solde (30 jours) + projection jusqu'à la veille de la paie
    const history = [];
    for (let i = 30; i >= 0; i--) { const d = addDays(t, -i); history.push({ d, v: round2(balanceAt(key(d))), real: true }); }
    const projection = [{ d: t, v: balance, real: false, events: upcoming.filter(u => diffDays(t, u.date) === 0) }];
    let b = balance - upcoming.filter(u => diffDays(t, u.date) === 0).reduce((s, u) => s + u.amount, 0) - Math.max(0, avgVar - varToday);
    for (let i = 1; i < daysLeft; i++) {
      const d = addDays(t, i), ev = upcoming.filter(u => diffDays(d, u.date) === 0);
      b -= avgVar + sum(ev.map(e => e.amount));
      projection.push({ d, v: round2(b), real: false, events: ev });
    }
    const endBalance = projection[projection.length - 1].v;
    // Dépenses variables des 14 derniers jours
    const dailySpend = [];
    for (let i = 13; i >= 0; i--) { const d = addDays(t, -i), dk = key(d); dailySpend.push({ d, v: -sum(S.tx.filter(x => x.date === dk && isVar(x)).map(x => x.amount)) }); }
    // Revenus mensuels détectés
    const incomes = S.tx.filter(x => x.cat === 'revenus' && x.amount > 200);
    const income = incomes.length ? median(incomes.slice(-3).map(x => x.amount)) : 0;
    M = { t, tk, balance, nextPay, lastPay, daysLeft, varToday, upcoming, upSum, savedCycle, savingsLeft, available, daily, leftToday, rest, tomorrowDaily, avgVar, history, projection, endBalance, dailySpend, rec, isFixed, isVar, income };
    M.insights = buildInsights(M);
    return M;
  }

  function monthSpend(offset, uptoDay) {
    const t = today(), y = t.getFullYear(), m = t.getMonth() + offset;
    const from = key(new Date(y, m, 1)), lastDay = new Date(y, m + 1, 0).getDate();
    const to = key(new Date(y, m, uptoDay ? Math.min(uptoDay, lastDay) : lastDay));
    const txs = S.tx.filter(x => x.date >= from && x.date <= to);
    const byCat = {};
    D.CATS.forEach(c => { byCat[c.id] = 0; });
    txs.forEach(x => { if (x.amount < 0 && CAT[x.cat] && CAT[x.cat].spend) byCat[x.cat] += -x.amount; });
    return { byCat, total: sum(Object.values(byCat)), income: sum(txs.filter(x => x.amount > 0).map(x => x.amount)), saved: -sum(txs.filter(x => x.cat === 'epargne' && x.amount < 0).map(x => x.amount)), date: new Date(y, m, 1), txs };
  }

  function buildInsights(m) {
    const out = [], t = m.t;
    const soon = m.upcoming.filter(u => diffDays(t, u.date) <= 3);
    if (m.endBalance < S.profile.cushion && m.daily > 0) out.push({ tone: 'neg', icon: 'trendDown', title: `À ton rythme, tu finirais le mois à ${eur(m.endBalance, false)}`, sub: `Tu dépenses en moyenne ${eur(m.avgVar, false)} par jour au quotidien. Rester à ${eur(m.daily, false)} par jour te garde ton coussin de ${eur(S.profile.cushion, false)}.`, go: 'today' });
    if (soon.length) {
      const tot = sum(soon.map(u => u.amount));
      out.push({ tone: m.balance - tot < S.profile.cushion ? 'neg' : 'warn', icon: 'calendar', title: soon.length === 1 ? `${cap(relDay(soon[0].date))} : prélèvement ${soon[0].name} (${eur(soon[0].amount)})` : `${soon.length} prélèvements d’ici 3 jours : ${eur(tot)}`, sub: soon.length > 1 ? soon.map(u => `${u.name} ${eur(u.amount)}`).join(' · ') : `Solde estimé après : ${eur(m.balance - tot)}`, go: 'abos' });
    }
    m.rec.filter(r => r.change > 0).forEach(r => out.push({ tone: 'warn', icon: 'trendUp', title: `${r.name} a augmenté de ${eur(r.change)}`, sub: `Tu paies maintenant ${eur(r.amount)} ${r.freq === 'annuel' ? 'par an' : 'par mois'}, soit ${eur(r.change * (r.freq === 'annuel' ? 1 : 12), false)} de plus par an. Compare les offres ou négocie.`, go: 'abos' }));
    const fams = {};
    m.rec.filter(r => r.family).forEach(r => { (fams[r.family] = fams[r.family] || []).push(r); });
    Object.values(fams).filter(l => l.length > 1).forEach(l => {
      const cheapest = Math.min(...l.map(r => r.yearly));
      out.push({ tone: 'warn', icon: 'copy2', title: `${l.length} abonnements ${l[0].familyLabel.toLowerCase()} : ${l.map(r => r.name).join(' et ')}`, sub: `En garder un seul : jusqu’à ${eur(sum(l.map(r => r.yearly)) - cheapest, false)} d’économie par an.`, go: 'abos' });
    });
    m.rec.filter(r => r.freq === 'annuel' && diffDays(t, r.next) <= 30 && diffDays(t, r.next) >= 0).forEach(r => out.push({ tone: 'warn', icon: 'refresh', title: `${r.name} se renouvelle ${inDays(diffDays(t, r.next))} (${eur(r.amount)})`, sub: `Si tu ne t’en sers plus, résilie avant le ${fmtShort(addDays(r.next, -1))}.`, go: 'abos' }));
    const cur = monthSpend(0, t.getDate()), prev = monthSpend(-1, t.getDate());
    D.CATS.forEach(c => {
      const b = S.budgets[c.id], v = cur.byCat[c.id];
      if (b > 0 && v > b) out.push({ tone: 'neg', icon: 'alert', title: `Budget ${c.label.toLowerCase()} dépassé : ${eur(v, false)} sur ${eur(b, false)}`, sub: 'Ralentis sur cette catégorie jusqu’à la fin du mois, ou ajuste ce budget s’il est trop serré.', go: 'budget', cat: c.id });
      else if (c.spend && prev.byCat[c.id] > 15 && v - prev.byCat[c.id] > 20 && v / prev.byCat[c.id] > 1.3) out.push({ tone: 'warn', icon: 'trendUp', title: `${c.label} : +${Math.round((v / prev.byCat[c.id] - 1) * 100)} % par rapport à ${MONTHS[prev.date.getMonth()]}`, sub: `${eur(v, false)} depuis le 1er, contre ${eur(prev.byCat[c.id], false)} à la même date le mois dernier.`, go: 'budget', cat: c.id });
    });
    if (S.profile.savingsGoal > 0 && m.savedCycle >= S.profile.savingsGoal) out.push({ tone: 'pos', icon: 'piggy', title: `Objectif d’épargne atteint : ${eur(m.savedCycle, false)} mis de côté`, sub: 'Depuis ta dernière paie. Ce montant est déjà retiré de ton reste à vivre.', go: 'budget' });
    else if (S.profile.savingsGoal > 0) out.push({ tone: 'warn', icon: 'piggy', title: `Encore ${eur(m.savingsLeft, false)} à mettre de côté ce mois-ci`, sub: `Marge les réserve déjà : ton reste à vivre en tient compte.`, go: 'profil' });
    return out;
  }

  /* ================= Génération & import ================= */
  function txFrom(list) {
    return list.map(x => { const c = categorize(x.label, x.amount); return { id: uid(), date: typeof x.date === 'string' ? x.date : key(x.date), label: x.label, amount: round2(x.amount), cat: c.cat, auto: c.auto }; });
  }
  function demoState(name) {
    const t = today();
    const raw = D.sampleTransactions(t);
    S = { v: 1, profile: { name: name || 'Alex', payday: 28, cushion: 50, savingsGoal: 100, startBalance: 0 }, tx: [], rules: [], budgets: {}, subStatus: {}, theme: (S && S.theme) || 'auto', source: 'demo' };
    D.CATS.forEach(c => { S.budgets[c.id] = c.budget; });
    S.tx = txFrom(raw);
    S.profile.startBalance = round2(860.4 - sum(S.tx.map(x => x.amount)));
    M = null;
  }
  function parseNum(s) {
    s = String(s || '').replace(/[\s\u00a0\u202f€]|EUR/g, '');
    if (!s) return NaN;
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
    return parseFloat(s);
  }
  function parseDate(s) {
    s = String(s || '').trim();
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (m) { let y = +m[3]; if (y < 100) y += 2000; return new Date(y, m[2] - 1, +m[1]); }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], m[2] - 1, +m[3]);
    return null;
  }
  function splitRow(line, d) {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === d && !q) { out.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    out.push(cur.trim());
    return out;
  }
  function parseCSV(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) throw new Error('Le fichier est vide.');
    const counts = [';', ',', '\t'].map(d => [d, lines.slice(0, 5).reduce((s, l) => s + l.split(d).length, 0)]).sort((a, b) => b[1] - a[1]);
    const delim = counts[0][0];
    const rows = lines.map(l => splitRow(l, delim));
    let hi = rows.findIndex((r, i) => i < 15 && r.some(c => /date/i.test(c)));
    const cols = { date: -1, label: -1, amount: -1, debit: -1, credit: -1 };
    if (hi >= 0) {
      const h = rows[hi].map(norm);
      cols.date = h.findIndex(c => /date/.test(c) && !/valeur/.test(c)); if (cols.date < 0) cols.date = h.findIndex(c => /date/.test(c));
      cols.label = h.findIndex(c => /libell|description|intitul|nature|detail|label|operation|beneficiaire/.test(c) && !/date/.test(c));
      cols.amount = h.findIndex(c => /^montant|amount|^somme|^valeur$/.test(c));
      cols.debit = h.findIndex(c => /debit/.test(c)); cols.credit = h.findIndex(c => /credit/.test(c));
    } else {
      const r = rows[0];
      cols.date = r.findIndex(c => parseDate(c));
      cols.amount = r.map((c, i) => [i, !isNaN(parseNum(c)) && i !== cols.date]).filter(x => x[1]).map(x => x[0]).pop();
      cols.label = r.map((c, i) => [i, c.length]).filter(x => x[0] !== cols.date && x[0] !== cols.amount).sort((a, b) => b[1] - a[1])[0][0];
    }
    if (cols.date < 0 || cols.label < 0 || (cols.amount < 0 && cols.debit < 0 && cols.credit < 0)) throw new Error('Colonnes non reconnues : il faut une date, un libellé et un montant.');
    const tx = [];
    rows.slice(hi + 1).forEach(r => {
      const d = parseDate(r[cols.date]); if (!d) return;
      let a;
      if (cols.amount >= 0) a = parseNum(r[cols.amount]);
      else { const de = parseNum(r[cols.debit]), cr = parseNum(r[cols.credit]); a = (isNaN(cr) ? 0 : Math.abs(cr)) - (isNaN(de) ? 0 : Math.abs(de)); }
      if (isNaN(a) || a === 0) return;
      tx.push({ date: key(d), label: (r[cols.label] || 'Opération').replace(/\s+/g, ' '), amount: round2(a) });
    });
    if (!tx.length) throw new Error('Aucune opération lisible dans ce fichier.');
    tx.sort((a, b) => a.date < b.date ? -1 : 1);
    return { tx, delim: delim === '\t' ? 'tabulation' : delim, split: cols.amount < 0 };
  }
  function guessPayday(tx) {
    const sal = tx.filter(x => x.amount > 300 && /salaire|paie|remuneration/i.test(norm(x.label)));
    const list = sal.length ? sal : tx.filter(x => x.amount > 300);
    return list.length ? Math.round(median(list.map(x => parseKey(x.date).getDate()))) : 1;
  }

  /* ================= Coque & rendu ================= */
  const TABS = [['today', 'Aujourd’hui', 'sun'], ['ops', 'Opérations', 'list'], ['budget', 'Budget', 'pie'], ['abos', 'Abonnements', 'repeat'], ['profil', 'Profil', 'user']];
  const logo = lg => `<span class="logo${lg ? ' lg' : ''}" aria-label="Marge"><i></i>marge</span>`;
  function renderShell() {
    app.innerHTML = `<div class="shell">
        <aside class="sidebar">${logo()}
          ${TABS.map(([id, l, i]) => `<button class="side-tab" data-act="tab" data-tab="${id}">${ic(i)}<span>${l}</span><span class="badge" data-badge="${id}" hidden></span></button>`).join('')}
          <div class="side-foot">${ic('lock', 'width:16px;height:16px;vertical-align:-3px;margin-right:6px')}Tes données restent sur cet appareil.</div>
        </aside>
        <main class="main"><header class="topbar" id="topbar"></header><div id="view" class="view"></div></main>
      </div>
      <nav class="tabbar" aria-label="Navigation"><div class="tab-indicator" id="tab-ind"></div>
        ${TABS.map(([id, l, i]) => `<button class="tab" data-act="tab" data-tab="${id}">${ic(i)}<span>${l}</span><span class="badge" data-badge="${id}" hidden></span></button>`).join('')}
      </nav>
      <div class="scrim" id="scrim" data-act="closeSheet"></div>
      <div class="sheet" id="sheet" role="dialog" aria-modal="true"></div>`;
  }
  function applyTheme() { const t = S && S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  function render() {
    if (!S) return;
    if (!document.getElementById('view')) renderShell();
    applyTheme();
    const m = model();
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === U.tab ? 'page' : 'false'));
    const idx = TABS.findIndex(t => t[0] === U.tab);
    document.getElementById('tab-ind').style.transform = `translateX(${idx * 100}%)`;
    document.getElementById('topbar').innerHTML = topbar(m);
    const view = document.getElementById('view');
    view.innerHTML = dots(({ today: viewToday, ops: viewOps, budget: viewBudget, abos: viewAbos, profil: viewProfil })[U.tab](m));
    view.classList.toggle('enter', U.enter);
    view.querySelectorAll('.stack > *, .view > *:not(.grid-2)').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 10)));
    const anim = U.enter && !reduced();
    U.enter = false;
    drawCharts(anim);
    if (anim) countUp(view);
    const alerts = m.insights.filter(i => i.tone !== 'pos').length;
    document.querySelectorAll('[data-badge]').forEach(b => { const n = b.dataset.badge === 'today' ? alerts : 0; b.hidden = !n; b.textContent = n; });
  }
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; }
  function topbar(m) {
    const t = {
      today: [`${cap(fmtDate(m.t))} · paie ${inDays(m.daysLeft)}`, `${greeting()}, ${esc(S.profile.name)}`],
      ops: [`${plural(S.tx.length, 'opération')} · classées automatiquement`, 'Opérations'],
      budget: [`Solde ${eur(m.balance)}`, 'Budget'],
      abos: [`${plural(m.rec.length, 'prélèvement')} détectés`, 'Abonnements'],
      profil: [S.source === 'demo' ? 'Compte d’exemple' : 'Relevé importé', 'Profil'],
    }[U.tab];
    return `<div style="min-width:0"><span class="eyebrow">${t[0]}</span><h1>${t[1]}</h1></div>
      <div class="topbar-actions"><button class="icon-btn" data-act="openImport" aria-label="Importer un relevé">${ic('upload')}</button><button class="avatar" data-act="tab" data-tab="profil" aria-label="Profil">${esc((S.profile.name[0] || '?').toUpperCase())}</button></div>`;
  }
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count, dec = el.dataset.dec !== '0';
      const t0 = performance.now(), dur = 1000;
      const fmt = v => dec ? EUR.format(v).replace(/\s?€$/, '').replace(/[\u202f\u00a0 ]/g, NBSP) : String(Math.round(v));
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(target * e); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  const numOnly = v => EUR.format(v).replace(/\s?€$/, '').replace(/[\u202f\u00a0 ]/g, NBSP);

  /* ================= Vue : Aujourd'hui ================= */
  function viewToday(m) {
    const p = S.profile, over = m.leftToday < 0, red = m.available < 0;
    const pct = m.daily > 0 ? Math.min(100, m.varToday / m.daily * 100) : 100;
    const meterCls = m.varToday > m.daily ? 'over' : pct > 80 ? 'warn' : '';
    const payEve = addDays(m.nextPay, -1);
    let sub;
    if (red) sub = `<strong>Attention</strong> : avec les prélèvements à venir, ton solde risque de passer sous ton coussin de sécurité avant le ${fmtShort(m.nextPay)}. Limite-toi au strict nécessaire.`;
    else if (over) sub = `Budget du jour dépassé de <strong>${eur(-m.leftToday)}</strong>. Pas de panique : à partir de demain, ton budget passe à <strong>${eur(m.tomorrowDaily)}</strong> par jour.`;
    else sub = `Tu peux encore dépenser cette somme aujourd’hui, sans mettre en danger la fin du mois. Demain, ton budget sera de <strong>${eur(m.tomorrowDaily)}</strong>.`;
    const hero = `<section class="day-card">
      <span class="eyebrow">Reste à vivre · aujourd’hui</span>
      <div class="hero-num ${over || red ? 'neg' : ''}"><span ${over || red ? '' : `data-count="${Math.max(0, m.leftToday).toFixed(2)}"`}>${over ? '−' + numOnly(-m.leftToday) : numOnly(Math.max(0, m.leftToday))}</span><small>€</small></div>
      <p class="hero-sub">${sub}</p>
      <div class="meter ${meterCls}" role="meter" aria-valuemin="0" aria-valuemax="${Math.max(0, m.daily).toFixed(2)}" aria-valuenow="${m.varToday.toFixed(2)}" aria-label="Dépensé aujourd’hui"><i style="width:${pct}%"></i></div>
      <div class="meter-legend"><span>Dépensé : <b class="num">${eur(m.varToday)}</b></span><span>Budget du jour : <b class="num">${eur(Math.max(0, m.daily))}</b></span></div>
      <div class="day-meta">
        <div><span class="eyebrow">Solde</span><b>${eur(m.balance)}</b></div>
        <div><span class="eyebrow">À venir</span><b>${m.upSum ? '−' + eur(m.upSum) : eur(0)}</b></div>
        <div><span class="eyebrow">Paie</span><b>${inDays(m.daysLeft)}</b></div>
      </div>
    </section>`;
    const afford = `<section class="card afford" id="afford-card">
      <div><span class="eyebrow">Simulateur</span><h2 style="margin-top:6px">Je peux me le permettre ?</h2></div>
      <div class="afford-in"><label class="money-in"><input id="afford-in" inputmode="decimal" placeholder="45" value="${esc(U.afford)}" aria-label="Montant de l’achat"><span>€</span></label></div>
      <div class="hscroll">${[15, 30, 60, 120, 250].map(v => `<button class="chip" data-act="affordSet" data-v="${v}">${v} €</button>`).join('')}</div>
      <div id="afford-out">${affordVerdict(m, U.afford)}</div>
    </section>`;
    const ins = m.insights;
    const insights = `<section class="card"><div class="card-head"><div><span class="eyebrow">Repéré automatiquement</span><h2>${ins.length ? plural(ins.length, 'chose') + ' à savoir' : 'Rien à signaler'}</h2></div></div>
      <div class="insights">${ins.map(i => `<button class="insight ${i.tone}" data-act="goInsight" data-go="${i.go}" ${i.cat ? `data-cat="${i.cat}"` : ''}><span class="ii">${ic(i.icon)}</span><span style="min-width:0"><strong>${esc(i.title)}</strong><span>${esc(i.sub)}</span></span>${ic('chevR')}</button>`).join('') || '<p class="muted small">Tout roule. Marge te prévient dès qu’un prélèvement augmente ou qu’un budget dérape.</p>'}</div></section>`;
    const endTone = m.endBalance < 0 ? 'neg' : m.endBalance < p.cushion ? 'warn' : 'pos';
    const proj = `<section class="card" id="proj-card">
      <div class="card-head"><div><span class="eyebrow">À ton rythme actuel · ${fmtShort(payEve)}</span><h2>${m.endBalance >= 0 ? 'Il devrait te rester' : 'Tu finirais à'} <span class="${endTone === 'neg' ? 'neg' : ''}">${eur(m.endBalance, false)}</span></h2></div>${S.source === 'demo' ? '<span class="tag example">exemple</span>' : ''}</div>
      <div class="chart" data-chart="projection" style="height:200px" role="img" aria-label="Évolution du solde sur 30 jours et projection jusqu’à la paie"></div>
      <div class="legend"><span><i class="k-line"></i>Solde réel</span><span><i class="k-dash"></i>Projection : ${eur(m.avgVar, false)}/jour en moyenne + prélèvements</span></div>
      <details style="margin-top:10px"><summary class="small muted" style="cursor:pointer">Voir en tableau</summary>
        <div class="preview"><table><thead><tr><th>Date</th><th>Événement</th><th class="n">Solde prévu</th></tr></thead><tbody>
        ${m.projection.filter((x, i) => i === 0 || x.events.length || i === m.projection.length - 1).map(x => `<tr><td>${fmtShort(x.d)}</td><td>${x.events.length ? esc(x.events.map(e => e.name).join(', ')) : diffDays(m.t, x.d) === 0 ? 'Aujourd’hui' : 'Veille de paie'}</td><td class="n">${eur(x.v)}</td></tr>`).join('')}
        </tbody></table></div></details>
    </section>`;
    const daily = `<section class="card"><div class="card-head"><div><span class="eyebrow">Dépenses du quotidien</span><h2>Les 14 derniers jours</h2></div></div>
      <div class="chart" data-chart="daily" style="height:170px" role="img" aria-label="Dépenses variables par jour, comparées au budget quotidien"></div>
      <div class="legend"><span><i class="k-ref"></i>Ton budget par jour actuel (${eur(Math.max(0, m.daily), false)})</span></div>
      <p class="small muted" style="margin-top:8px">Hors loyer, factures et abonnements : uniquement ce que tu dépenses au jour le jour.</p></section>`;
    const up = m.upcoming.slice(0, 6);
    const upcoming = `<section class="card"><div class="card-head"><div><span class="eyebrow">D’ici la paie</span><h2>Prélèvements à venir</h2></div><button class="link" data-act="tab" data-tab="abos">Tout voir</button></div>
      <div class="cal">${up.map(u => `<div class="cal-item"><span class="cal-date"><b>${u.date.getDate()}</b><small>${MONTHS_S[u.date.getMonth()]}</small></span>${catIc(u.rec.cat, 34)}<div style="flex:1;min-width:0"><strong style="display:block;font-weight:600;font-size:14px">${esc(u.name)}</strong><span class="small muted">${cap(inDays(diffDays(m.t, u.date)))}</span></div><b class="num">−${eur(u.amount)}</b></div>`).join('') || '<p class="muted small">Aucun prélèvement prévu avant la paie.</p>'}</div></section>`;
    return `<div class="grid-2"><div class="stack">${hero}${afford}${insights}</div><div class="stack">${proj}${daily}${upcoming}</div></div>`;
  }
  function affordVerdict(m, raw) {
    const x = parseFloat(String(raw).replace(',', '.'));
    if (!x || x <= 0) return '<p class="small muted">Tape un montant : Marge te dit si ça passe, en tenant compte des prélèvements à venir.</p>';
    const rem2 = m.rest - x, days = Math.max(1, m.daysLeft - 1), nd = rem2 / days;
    let cls, icon, title, text;
    if (x <= m.leftToday) { cls = 'ok'; icon = 'check'; title = 'Oui, ça rentre dans ton budget du jour'; text = `Il te restera ${eur(m.leftToday - x)} pour aujourd’hui. Rien ne change pour la suite.`; }
    else if (rem2 >= 0 && nd >= 5) { cls = nd < m.tomorrowDaily * 0.75 ? 'tight' : 'ok'; icon = cls === 'ok' ? 'check' : 'alert'; title = cls === 'ok' ? 'Oui, sans souci' : 'Oui, mais ça va serrer'; text = `Ton budget par jour passera de ${eur(m.tomorrowDaily)} à ${eur(nd)} jusqu’au ${fmtShort(addDays(m.nextPay, -1))}.`; }
    else if (rem2 + S.profile.cushion >= 0) { cls = 'tight'; icon = 'alert'; title = 'Possible, mais tu entames ton coussin'; text = `Il te resterait ${eur(Math.max(0, nd))} par jour, et tu puiserais ${eur(-Math.min(0, rem2))} dans ton coussin de sécurité. Attends la paie si tu peux (${inDays(m.daysLeft)}).`; }
    else { cls = 'no'; icon = 'x'; title = 'Mieux vaut attendre'; text = `Avec les prélèvements à venir, ton compte passerait sous zéro avant le ${fmtShort(m.nextPay)}. Ta paie arrive ${inDays(m.daysLeft)}.`; }
    return dots(`<div class="verdict ${cls}"><span class="vi">${ic(icon)}</span><div><strong>${title}</strong><p>${text}</p></div></div>`);
  }

  /* ================= Vue : Opérations ================= */
  function filteredTx(m) {
    const q = norm(U.q.trim());
    return S.tx.filter(x => {
      if (U.filter === 'out' && x.amount >= 0) return false;
      if (U.filter === 'in' && x.amount <= 0) return false;
      if (U.filter === 'fixed' && !(x.amount < 0 && m.isFixed(x))) return false;
      if (CAT[U.filter] && x.cat !== U.filter) return false;
      if (q && !norm(cleanName(x.label) + ' ' + x.label + ' ' + (CAT[x.cat] || {}).label).includes(q)) return false;
      return true;
    }).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  }
  function txListHtml(m) {
    const list = filteredTx(m), shown = list.slice(0, U.limit), days = {};
    shown.forEach(x => { (days[x.date] = days[x.date] || []).push(x); });
    const total = sum(list.map(x => x.amount));
    return `<p class="small muted" style="padding:2px 4px">${plural(list.length, 'opération')} · total ${signed(total)}</p>` +
      (Object.entries(days).map(([d, xs]) => { const dd = parseKey(d), dt = sum(xs.map(x => x.amount));
        return `<div class="tx-day"><div class="tx-day-h"><span class="eyebrow">${cap(diffDays(today(), dd) > -2 && diffDays(today(), dd) <= 0 ? relDay(dd) : fmtDate(dd))}</span><span class="eyebrow num">${signed(dt)}</span></div>
        ${xs.map(x => `<button class="tx" data-act="openTx" data-id="${x.id}">${catIc(x.cat)}<span class="body"><strong>${esc(cleanName(x.label))}</strong><span>${esc((CAT[x.cat] || CAT.autres).label)}${x.auto ? `<span class="auto-mark" title="Classé automatiquement">${ic('sparkle')}</span>` : ''}${x.amount < 0 && m.isFixed(x) ? ' · prélèvement récurrent' : ''}</span></span><span class="amt ${x.amount > 0 ? 'in' : ''}">${signed(x.amount)}</span></button>`).join('')}</div>`; }).join('') || `<div class="small muted" style="padding:20px 4px;text-align:center">Aucune opération ne correspond.</div>`) +
      (list.length > U.limit ? `<button class="btn block" style="margin-top:10px" data-act="more">Afficher plus (${list.length - U.limit})</button>` : '');
  }
  function viewOps(m) {
    const f = [['all', 'Toutes'], ['out', 'Dépenses'], ['in', 'Revenus'], ['fixed', 'Prélèvements']].concat(D.CATS.map(c => [c.id, c.label]));
    return `<div class="search">${ic('search')}<input id="ops-q" type="search" placeholder="Rechercher : Uber, loyer, pharmacie…" value="${esc(U.q)}" autocomplete="off" aria-label="Rechercher une opération"></div>
      <div class="hscroll">${f.map(([id, l]) => `<button class="chip ${U.filter === id ? 'on' : ''}" data-act="filter" data-f="${id}">${CAT[id] && CAT[id].spend ? `<span class="dot" style="background:${CAT[id].color}"></span>` : ''}${l}</button>`).join('')}</div>
      <section class="card"><div class="card-head"><div><span class="eyebrow">Classement automatique</span><h2>Toutes tes opérations</h2></div><button class="btn sm" data-act="openImport">${ic('upload')} Importer</button></div>
        <p class="small muted" style="margin-bottom:6px">${ic('sparkle', 'width:13px;height:13px;color:var(--accent);vertical-align:-2px')} = classé automatiquement. Touche une opération pour changer sa catégorie : Marge retient ton choix pour les suivantes.</p>
        <div id="tx-list">${txListHtml(m)}</div></section>`;
  }

  /* ================= Vue : Budget ================= */
  function viewBudget(m) {
    const t = m.t, off = -U.month, cur = monthSpend(off), cmp = monthSpend(off - 1, off === 0 ? t.getDate() : null);
    const mName = MONTHS[cur.date.getMonth()];
    const cats = D.CATS.map(c => ({ c, v: cur.byCat[c.id], prev: cmp.byCat[c.id], b: S.budgets[c.id] || 0 })).sort((a, b) => b.v - a.v);
    const nz = cats.filter(x => x.v > 0);
    const switcher = `<div class="month-switch">${[0, 1, 2].map(i => { const d = new Date(t.getFullYear(), t.getMonth() - i, 1); return `<button class="chip ${U.month === i ? 'on' : ''}" data-act="month" data-m="${i}">${cap(MONTHS[d.getMonth()])}</button>`; }).join('')}</div>`;
    const summary = `<section class="card"><div class="card-head"><div><span class="eyebrow">${off === 0 ? `Du 1er au ${t.getDate()} ${mName}` : cap(mName) + ' ' + cur.date.getFullYear()}</span><h2>Dépensé : <span class="num">${eur(cur.total, false)}</span></h2></div></div>
      <div class="stackbar" role="img" aria-label="Répartition des dépenses par catégorie">${nz.map(x => `<i style="width:${x.v / cur.total * 100}%;background:${CAT[x.c.id].color}" title="${esc(x.c.label)} : ${eur(x.v)}"></i>`).join('')}</div>
      <div class="subs-hero" style="margin-top:14px">
        <div class="stat" style="box-shadow:none;background:var(--surface-2)"><span class="eyebrow">Entrées du mois</span><b class="pos">${eur(cur.income, false)}</b><span>salaire, remboursements</span></div>
        <div class="stat" style="box-shadow:none;background:var(--surface-2)"><span class="eyebrow">Épargne</span><b>${eur(cur.saved, false)}</b><span>objectif ${eur(S.profile.savingsGoal, false)}</span></div>
        <div class="stat" style="box-shadow:none;background:var(--surface-2)"><span class="eyebrow">${off === 0 ? 'Vs mois dernier' : 'Vs mois d’avant'}</span><b class="${cur.total > cmp.total ? 'neg' : 'pos'}">${cur.total > cmp.total ? '+' : '−'}${eur(Math.abs(cur.total - cmp.total), false)}</b><span>${off === 0 ? 'à la même date' : 'sur le mois entier'}</span></div>
      </div></section>`;
    const rows = `<section class="card"><div class="card-head"><div><span class="eyebrow">Par catégorie</span><h2>Où part ton argent</h2></div></div>
      ${cats.map(x => { const pct = x.b ? x.v / x.b * 100 : 0, cls = pct > 100 ? 'over' : pct > 85 ? 'warn' : '', d = x.v - x.prev;
        return `<button class="cat-row" data-act="openCat" data-cat="${x.c.id}">${catIc(x.c.id)}<span class="name">${esc(x.c.label)}</span><span class="amt">${eur(x.v, false)}</span>
        <span class="cat-sub">${x.b ? `<span class="bmeter ${cls}"><i style="width:${Math.min(100, pct)}%"></i></span><span>${pct > 100 ? `${ic('alert', 'width:12px;height:12px;vertical-align:-2px')} dépassé · ` : ''}sur ${eur(x.b, false)}</span>` : `<span style="flex:1">${x.c.id === 'abos' || x.c.id === 'logement' ? 'Charges fixes, sans budget' : 'Pas de budget'}</span>`}
        <span class="delta ${Math.abs(d) < 1 ? '' : d > 0 ? 'neg' : 'pos'}">${Math.abs(d) < 1 ? '=' : (d > 0 ? '+' : '−') + eur(Math.abs(d), false)}</span></span></button>`; }).join('')}
      <p class="small muted" style="margin-top:10px">Touche une catégorie pour régler son budget. L’écart à droite compare avec ${off === 0 ? 'le mois dernier à la même date' : 'le mois précédent'}.</p></section>`;
    const months = `<section class="card"><div class="card-head"><div><span class="eyebrow">Tendance</span><h2>Dépenses par mois</h2></div></div>
      <div class="chart" data-chart="months" style="height:170px" role="img" aria-label="Total des dépenses des 4 derniers mois"></div>
      <p class="small muted" style="margin-top:8px">Le mois en cours est encore incomplet.</p></section>`;
    return `${switcher}<div class="grid-2"><div class="stack">${summary}${rows}</div><div class="stack">${months}${savingsCard(m)}</div></div>`;
  }
  function savingsCard(m) {
    const g = S.profile.savingsGoal, pct = g ? Math.min(100, m.savedCycle / g * 100) : 0;
    return `<section class="card"><div class="card-head"><div><span class="eyebrow">Depuis la paie du ${fmtShort(m.lastPay)}</span><h2>Épargne du mois</h2></div>${ic('piggy', 'color:var(--accent)')}</div>
      <div class="hero-num" style="font-size:40px;margin:0">${eur(m.savedCycle, false)}<small style="font-size:.4em"> / ${eur(g, false)}</small></div>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <p class="small muted" style="margin-top:10px">${m.savingsLeft > 0 ? `Il manque ${eur(m.savingsLeft, false)}. Marge les met déjà de côté dans ton reste à vivre.` : 'Objectif atteint. Chaque euro en plus est un bonus.'}</p></section>`;
  }

  /* ================= Vue : Abonnements ================= */
  function viewAbos(m) {
    const st = S.subStatus, t = m.t;
    const subs = m.rec.filter(r => r.isSub), fixed = m.rec.filter(r => !r.isSub);
    const monthly = sum(m.rec.map(r => r.monthly)), saving = sum(m.rec.filter(r => st[r.key] === 'cancel').map(r => r.yearly));
    const fams = {}; m.rec.filter(r => r.family).forEach(r => { fams[r.family] = (fams[r.family] || 0) + 1; });
    const row = r => {
      const nIn = diffDays(t, r.next), cancel = st[r.key] === 'cancel';
      const tags = [];
      if (r.change > 0) tags.push(`<span class="tag warn">${ic('trendUp')} +${eur(r.change)}</span>`);
      if (r.family && fams[r.family] > 1) tags.push(`<span class="tag warn">${ic('copy2')} doublon ${r.familyLabel.toLowerCase()}</span>`);
      if (r.freq === 'annuel') tags.push(`<span class="tag">${ic('refresh')} annuel</span>`);
      return `<div class="sub ${cancel ? 'cancel' : ''}"><span class="logo-chip" style="background:${CAT[r.cat] ? CAT[r.cat].color : 'var(--c9)'}">${esc(r.name[0])}</span>
        <span class="name">${esc(r.name)}</span><span class="amt">${eur(r.amount)}<span class="small muted" style="font-weight:500">/${r.freq === 'annuel' ? 'an' : r.freq === 'hebdo' ? 'sem.' : r.every28 ? '4 sem.' : 'mois'}</span></span>
        <span class="meta">Prochain : ${fmtShort(r.next)}, ${inDays(nIn)} · ${eur(r.yearly, false)}/an${r.estimated ? ' · estimé' : ''} ${tags.join('')}</span>
        ${r.isSub ? `<span class="actions"><span class="seg" role="group" aria-label="Décision"><button class="${!cancel ? 'on' : ''}" data-act="subStatus" data-k="${esc(r.key)}" data-v="keep">Garder</button><button class="${cancel ? 'on cancel' : ''}" data-act="subStatus" data-k="${esc(r.key)}" data-v="cancel">${ic('scissors', 'width:13px;height:13px;vertical-align:-2px')} À résilier</button></span></span>` : ''}
      </div>`;
    };
    const hero = `<div class="subs-hero">
      <div class="stat"><span class="eyebrow">Par mois</span><b>${eur(monthly)}</b><span>tous prélèvements récurrents</span></div>
      <div class="stat"><span class="eyebrow">Par an</span><b>${eur(monthly * 12, false)}</b><span>dont ${eur(sum(subs.map(r => r.yearly)), false)} d’abonnements</span></div>
      <div class="stat"><span class="eyebrow">Économie choisie</span><b class="${saving ? 'pos' : ''}">${eur(saving, false)}</b><span>${saving ? 'par an si tu résilies' : 'marque ce que tu veux résilier'}</span></div></div>`;
    const subsCard = `<section class="card"><div class="card-head"><div><span class="eyebrow">Détectés dans tes relevés</span><h2>Abonnements</h2></div><span class="tag">${subs.length}</span></div>
      ${subs.map(row).join('') || '<p class="muted small">Aucun abonnement détecté pour l’instant.</p>'}
      <p class="small muted" style="margin-top:10px">${ic('info', 'width:14px;height:14px;vertical-align:-2px')} Depuis juin 2023, un abonnement souscrit en ligne doit pouvoir se résilier en ligne, en quelques clics, via un bouton « Résilier votre contrat ».</p></section>`;
    const fixedCard = `<section class="card"><div class="card-head"><div><span class="eyebrow">Loyer, énergie, assurances…</span><h2>Charges fixes</h2></div><span class="tag">${fixed.length}</span></div>${fixed.map(row).join('') || '<p class="muted small">Aucune charge fixe détectée.</p>'}</section>`;
    const next30 = [];
    m.rec.forEach(r => { let d = r.next, g = 0; while (diffDays(t, d) <= 30 && g++ < 10) { if (d >= t) next30.push({ d, r }); d = r.step(d); } });
    next30.sort((a, b) => a.d - b.d);
    const cal = `<section class="card"><div class="card-head"><div><span class="eyebrow">Calendrier</span><h2>Les 30 prochains jours</h2></div><b class="num">−${eur(sum(next30.map(x => x.r.amount)), false)}</b></div>
      <div class="cal">${next30.map(x => `<div class="cal-item"><span class="cal-date"><b>${x.d.getDate()}</b><small>${MONTHS_S[x.d.getMonth()]}</small></span><div style="flex:1;min-width:0"><strong style="display:block;font-weight:600;font-size:14px">${esc(x.r.name)}</strong><span class="small muted">${x.d >= m.nextPay ? 'après la paie' : 'avant la paie'}</span></div><b class="num">−${eur(x.r.amount)}</b></div>`).join('')}</div></section>`;
    return `${hero}<div class="grid-2"><div class="stack">${subsCard}${fixedCard}</div><div class="stack">${cal}</div></div>`;
  }

  /* ================= Vue : Profil ================= */
  function viewProfil(m) {
    const p = S.profile;
    const settings = `<section class="card"><div class="card-head"><div><span class="eyebrow">Ce qui règle ton reste à vivre</span><h2>Réglages</h2></div></div>
      <div class="setting"><label for="set-name">Prénom</label><input id="set-name" data-set="name" value="${esc(p.name)}" style="text-align:left;width:140px"></div>
      <div class="setting"><label for="set-payday">Jour de paie<span class="help">Revenu détecté : ${eur(m.income, false)}/mois</span></label><select id="set-payday" data-set="payday">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${p.payday === i + 1 ? 'selected' : ''}>le ${i + 1}</option>`).join('')}</select></div>
      <div class="setting"><label for="set-cushion">Coussin de sécurité<span class="help">Jamais compté dans ton reste à vivre</span></label><input id="set-cushion" data-set="cushion" inputmode="decimal" value="${p.cushion}"></div>
      <div class="setting"><label for="set-goal">Épargne par mois<span class="help">Mise de côté avant de calculer ton budget</span></label><input id="set-goal" data-set="savingsGoal" inputmode="decimal" value="${p.savingsGoal}"></div>
      <div class="setting"><label for="set-theme">Apparence</label><select id="set-theme" data-set="theme"><option value="auto" ${S.theme === 'auto' ? 'selected' : ''}>Automatique</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>Clair</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Sombre</option></select></div></section>`;
    const how = `<section class="card"><div class="card-head"><div><span class="eyebrow">Transparence</span><h2>Comment Marge calcule</h2></div></div>
      <div class="preview" style="max-height:none;margin-top:0"><table><tbody>
        <tr><td>Solde actuel</td><td class="n">${eur(m.balance)}</td></tr>
        <tr><td>+ Dépenses du jour (rajoutées)</td><td class="n">${eur(m.varToday)}</td></tr>
        <tr><td>− Prélèvements avant la paie</td><td class="n">−${eur(m.upSum)}</td></tr>
        <tr><td>− Épargne restant à faire</td><td class="n">−${eur(m.savingsLeft)}</td></tr>
        <tr><td>− Coussin de sécurité</td><td class="n">−${eur(p.cushion)}</td></tr>
        <tr><th>= Disponible pour ${plural(m.daysLeft, 'jour')}</th><th class="n">${eur(m.available)}</th></tr>
        <tr><th>Budget par jour</th><th class="n">${eur(m.daily)}</th></tr>
      </tbody></table></div></section>`;
    const data = `<section class="card"><div class="card-head"><div><span class="eyebrow">Tes données</span><h2>${S.source === 'demo' ? 'Compte d’exemple' : 'Relevé importé'}</h2></div>${ic('lock', 'color:var(--accent)')}</div>
      <p class="small muted">Tout reste sur cet appareil : rien n’est envoyé sur internet. Dans la version finale, la connexion à la banque passera par un agrégateur agréé (lecture seule, norme européenne DSP2).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn sm primary" data-act="openImport">${ic('upload')} Importer un relevé CSV</button><button class="btn sm" data-act="reset" id="reset-btn">${ic('refresh')} Tout recommencer</button></div></section>`;
    return `<div class="grid-2"><div class="stack">${settings}${data}</div><div class="stack">${how}</div></div>`;
  }

  /* ================= Graphiques (SVG à la main) ================= */
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw);
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + step / 2; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }
  const svgEl = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
  function tooltipFor(el) { let t = el.querySelector('.tooltip'); if (!t) { t = document.createElement('div'); t.className = 'tooltip'; t.style.opacity = 0; el.appendChild(t); } return t; }
  function drawCharts(anim) {
    if (!S || !document.getElementById('view')) return;
    const m = model();
    document.querySelectorAll('[data-chart]').forEach(el => {
      el.classList.toggle('draw', !!anim);
      ({ projection: chartProjection, daily: chartDaily, months: chartMonths })[el.dataset.chart](el, m);
    });
  }
  function chartProjection(el, m) {
    const W = Math.max(260, el.clientWidth), H = el.clientHeight || 200, pl = 52, pr = 14, pt = 22, pb = 24;
    const pts = m.history.concat(m.projection.slice(1));
    const t0 = pts[0].d, span = diffDays(t0, pts[pts.length - 1].d) || 1;
    const vals = pts.map(p => p.v), ticks = niceTicks(Math.min(0, ...vals), Math.max(...vals), 3);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const x = d => pl + diffDays(t0, d) / span * (W - pl - pr), y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
    const path = arr => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const real = m.history, proj = m.projection, end = proj[proj.length - 1], now = real[real.length - 1];
    const base = y(Math.max(0, y0));
    const area = `${path(real)}L${x(now.d).toFixed(1)},${base}L${x(real[0].d).toFixed(1)},${base}Z`;
    const endLabelX = Math.min(x(end.d), W - pr);
    let inner = `<g class="grid">${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g class="axis">${ticks.map(v => `<text x="${pl - 8}" y="${y(v) + 3.5}" text-anchor="end">${eur(v, false)}</text>`).join('')}
        <text x="${x(real[0].d)}" y="${H - 4}">${fmtShort(real[0].d)}</text><text x="${x(now.d)}" y="${H - 4}" text-anchor="middle">Auj.</text><text x="${W - pr}" y="${H - 4}" text-anchor="end">${fmtShort(end.d)}</text></g>
      ${y0 < 0 ? `<line class="zero" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/>` : ''}
      <path class="area" d="${area}"/><path class="line-real" d="${path(real)}"/><path class="line-proj" d="${path(proj)}"/>
      <circle class="dot" cx="${x(now.d)}" cy="${y(now.v)}" r="5" fill="var(--accent)"/>
      <circle class="dot" cx="${x(end.d)}" cy="${y(end.v)}" r="4.5" fill="${end.v < 0 ? 'var(--neg)' : 'var(--accent)'}"/>
      <text class="lbl" x="${endLabelX}" y="${y(end.v) - 10}" text-anchor="end">≈ ${eur(end.v, false)}</text>
      <line class="crosshair" x1="0" x2="0" y1="${pt}" y2="${H - pb}" style="opacity:0"/><circle class="hover-dot dot" r="5" fill="var(--accent)" style="opacity:0"/>
      <rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent" class="hit"/>`;
    el.innerHTML = svgEl(W, H, inner);
    const svg = el.querySelector('svg'), tt = tooltipFor(el), ch = svg.querySelector('.crosshair'), hd = svg.querySelector('.hover-dot');
    const move = e => {
      const r = svg.getBoundingClientRect(), mx = e.clientX - r.left;
      let best = pts[0]; pts.forEach(p => { if (Math.abs(x(p.d) - mx) < Math.abs(x(best.d) - mx)) best = p; });
      const px = x(best.d), py = y(best.v);
      ch.setAttribute('x1', px); ch.setAttribute('x2', px); ch.style.opacity = 1;
      hd.setAttribute('cx', px); hd.setAttribute('cy', py); hd.style.opacity = 1;
      const ev = best.events && best.events.length ? `<br>${best.events.map(e2 => `${esc(e2.name)} −${eur(e2.amount)}`).join('<br>')}` : '';
      tt.innerHTML = `<span class="tt-d">${cap(fmtDate(best.d))}</span>${best.real ? 'Solde' : 'Solde prévu'} : <b>${eur(best.v)}</b>${ev}`;
      tt.style.left = Math.max(70, Math.min(r.width - 70, px)) + 'px'; tt.style.top = (py - 12) + 'px'; tt.style.opacity = 1;
    };
    const leave = () => { tt.style.opacity = 0; ch.style.opacity = 0; hd.style.opacity = 0; };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);
  }
  const barPath = (x, y, w, yb, r) => { const h = yb - y; r = Math.min(r, h, w / 2); if (h <= 0) return ''; return `M${x},${yb}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${yb}Z`; };
  function chartColumns(el, data, opts) {
    const W = Math.max(240, el.clientWidth), H = el.clientHeight || 170, pl = opts.pl || 42, pr = 8, pt = 22, pb = 22;
    const max = Math.max(opts.ref || 0, ...data.map(d => d.v), 1), ticks = niceTicks(0, max, 2), y1 = ticks[ticks.length - 1];
    const slot = (W - pl - pr) / data.length, bw = Math.min(24, slot * 0.62);
    const y = v => pt + (1 - v / y1) * (H - pt - pb), yb = y(0);
    let inner = `<g class="grid">${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g class="axis">${ticks.map(v => `<text x="${pl - 8}" y="${y(v) + 3.5}" text-anchor="end">${eur(v, false)}</text>`).join('')}</g>`;
    data.forEach((d, i) => {
      const cx = pl + slot * i + slot / 2, bx = cx - bw / 2;
      inner += `<path class="bar" style="--i:${i}" d="${barPath(bx, y(d.v), bw, yb, 4)}" fill="var(--accent)" opacity="${d.hi ? 1 : 0.38}"/>`;
      if (d.label && (opts.everyLabel || i % 2 === (data.length - 1) % 2)) inner += `<text class="axis" x="${cx}" y="${H - 5}" text-anchor="middle">${d.label}</text>`;
      if (opts.capLabels && d.v > 0) inner += `<text class="lbl-2" x="${cx}" y="${y(d.v) - 6}" text-anchor="middle">${eur(d.v, false)}</text>`;
      inner += `<rect class="hit" data-i="${i}" x="${pl + slot * i}" y="${pt}" width="${slot}" height="${H - pt - pb}" fill="transparent"/>`;
    });
    if (opts.ref > 0) inner += `<line class="ref" x1="${pl}" x2="${W - pr}" y1="${y(opts.ref)}" y2="${y(opts.ref)}"/>`;
    el.innerHTML = svgEl(W, H, inner);
    const svg = el.querySelector('svg'), tt = tooltipFor(el);
    svg.querySelectorAll('.hit').forEach(h => {
      const show = () => { const i = +h.dataset.i, d = data[i], cx = pl + slot * i + slot / 2; tt.innerHTML = opts.tip(d); tt.style.left = Math.max(70, Math.min(W - 70, cx)) + 'px'; tt.style.top = (y(d.v) - 10) + 'px'; tt.style.opacity = 1; };
      h.addEventListener('pointerenter', show); h.addEventListener('pointerdown', show);
    });
    svg.addEventListener('pointerleave', () => { tt.style.opacity = 0; });
  }
  function chartDaily(el, m) {
    const data = m.dailySpend.map((d, i) => ({ v: d.v, d: d.d, hi: i === m.dailySpend.length - 1, label: i === m.dailySpend.length - 1 ? 'Auj.' : String(d.d.getDate()) }));
    chartColumns(el, data, { ref: Math.max(0, m.daily), tip: d => `<span class="tt-d">${cap(fmtDate(d.d))}</span>Dépensé : <b>${eur(d.v)}</b>${m.daily > 0 && d.v > m.daily ? `<br>${eur(d.v - m.daily)} au-dessus du budget` : ''}` });
  }
  function chartMonths(el) {
    const data = [3, 2, 1, 0].map(i => { const ms = monthSpend(-i); return { v: ms.total, d: ms.date, hi: i === U.month, label: cap(MONTHS_S[ms.date.getMonth()]) }; });
    chartColumns(el, data, { everyLabel: true, capLabels: true, pl: 48, tip: d => `<span class="tt-d">${cap(MONTHS[d.d.getMonth()])} ${d.d.getFullYear()}</span>Dépenses : <b>${eur(d.v)}</b>` });
  }
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => drawCharts(false), 150); });

  /* ================= Feuilles ================= */
  function openSheet(html, focusId) {
    const sh = document.getElementById('sheet');
    sh.innerHTML = dots(`<div class="grab"></div>${html}`); sh.scrollTop = 0;
    document.getElementById('scrim').classList.add('open');
    requestAnimationFrame(() => sh.classList.add('open'));
    if (focusId) setTimeout(() => { const f = document.getElementById(focusId); if (f) f.focus(); }, 350);
  }
  function closeSheet() { const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('open'); const sc = document.getElementById('scrim'); if (sc) sc.classList.remove('open'); }
  function openTx(id) {
    const x = S.tx.find(t => t.id === id); if (!x) return;
    const m = model(), mk = merchantKey(x.label), same = S.tx.filter(t => t.id !== x.id && merchantKey(t.label) === mk).length;
    const r = m.rec.find(rr => rr.key === mk);
    U.sheetTx = { id, all: same > 0 };
    openSheet(`<div style="display:flex;gap:14px;align-items:center">${catIc(x.cat, 48)}<div style="min-width:0"><h2>${esc(cleanName(x.label))}</h2><span class="small muted">${cap(fmtDate(parseKey(x.date)))}</span></div><b class="num" style="margin-left:auto;font-size:20px;${x.amount > 0 ? 'color:var(--pos)' : ''}">${signed(x.amount)}</b></div>
      <p class="small muted" style="margin-top:12px;font-family:var(--f-mono);font-size:11.5px;overflow-wrap:anywhere">${esc(x.label)}</p>
      ${r ? `<div class="verdict ok" style="margin-top:12px"><span class="vi">${ic('repeat')}</span><div><strong>Prélèvement ${r.freq} détecté</strong><p>Prochain ${relDay(r.next)} : ${eur(r.amount)}. Il est déjà déduit de ton reste à vivre.</p></div></div>` : ''}
      <span class="eyebrow" style="display:block;margin-top:18px">Catégorie${x.auto ? ' (choisie automatiquement)' : ''}</span>
      <div class="cat-grid">${D.CATS.concat(D.SPECIAL).map(c => `<button class="cat-pick ${x.cat === c.id ? 'on' : ''}" data-act="setCat" data-cat="${c.id}">${catIc(c.id, 36)}${esc(c.label)}</button>`).join('')}</div>
      ${same ? `<div class="switch-row"><span><strong style="font-weight:600">Appliquer aux ${plural(same, 'autre opération', 'autres opérations')}</strong><span class="small muted" style="display:block">« ${esc(cleanName(x.label))} », et aux prochaines</span></span><button class="switch on" id="apply-all" data-act="toggleAll" role="switch" aria-checked="true" aria-label="Appliquer à toutes"></button></div>` : ''}`);
  }
  function openCat(id) {
    const c = CAT[id], cur = monthSpend(0), top = {};
    cur.txs.filter(x => x.cat === id && x.amount < 0).forEach(x => { const n = cleanName(x.label); top[n] = (top[n] || 0) - x.amount; });
    const tops = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
    openSheet(`<div style="display:flex;gap:14px;align-items:center">${catIc(id, 48)}<div><h2>${esc(c.label)}</h2><span class="small muted">${eur(cur.byCat[id] || 0)} depuis le 1er</span></div></div>
      <form data-form="budget" data-cat="${id}"><div class="setting" style="margin-top:12px"><label for="bud-in">Budget mensuel<span class="help">0 = pas de budget pour cette catégorie</span></label><input id="bud-in" inputmode="decimal" value="${S.budgets[id] || 0}"></div>
      <button class="btn primary block">Enregistrer</button></form>
      ${tops.length ? `<span class="eyebrow" style="display:block;margin:18px 0 6px">Où ça part ce mois-ci</span>${tops.map(([n, v]) => `<div class="setting"><span>${esc(n)}</span><b class="num">${eur(v)}</b></div>`).join('')}` : ''}
      <button class="btn block" style="margin-top:12px" data-act="seeCatOps" data-cat="${id}">${ic('list')} Voir les opérations</button>`, 'bud-in');
  }
  function importPanel(inOnboarding) {
    return `<div class="drop" id="drop" data-act="pickFile" role="button" tabindex="0">${ic('upload')}<strong>Dépose ton relevé CSV ici</strong><span class="small muted">ou touche pour choisir le fichier exporté depuis ton appli bancaire</span></div>
      <input type="file" id="file-in" accept=".csv,text/csv,text/plain" hidden>
      <button class="btn block" style="margin-top:10px" data-act="sampleCsv">${ic('file')} Essayer avec un relevé d’exemple</button>
      <div id="import-out"></div>${inOnboarding ? '' : ''}`;
  }
  function openImport() {
    U.imp = null;
    openSheet(`<h2>Importer un relevé</h2><p class="small muted" style="margin-top:4px">Exporte tes opérations en CSV depuis l’espace client de ta banque. Marge reconnaît les formats français (séparateur « ; », virgule décimale, colonnes Débit/Crédit).</p><div style="margin-top:16px">${importPanel(false)}</div>`);
  }
  function showImport(res, targetId) {
    U.imp = res;
    const out = document.getElementById(targetId || 'import-out'); if (!out) return;
    const cats = res.tx.map(x => categorize(x.label, x.amount));
    const auto = cats.filter(c => c.cat !== 'autres').length;
    out.innerHTML = `<div class="verdict ok" style="margin-top:14px"><span class="vi">${ic('check')}</span><div><strong>${plural(res.tx.length, 'opération lue', 'opérations lues')}</strong><p>Du ${fmtShort(parseKey(res.tx[0].date))} au ${fmtShort(parseKey(res.tx[res.tx.length - 1].date))} · séparateur « ${res.delim} » · ${auto} classées automatiquement.</p></div></div>
      <div class="preview"><table><thead><tr><th>Date</th><th>Opération</th><th>Catégorie</th><th class="n">Montant</th></tr></thead><tbody>
      ${res.tx.slice(-8).reverse().map((x, i) => `<tr><td>${fmtShort(parseKey(x.date))}</td><td>${esc(cleanName(x.label))}</td><td>${esc(CAT[cats[res.tx.length - 1 - i].cat].label)}</td><td class="n">${signed(x.amount)}</td></tr>`).join('')}</tbody></table></div>
      ${U.ob ? '' : `<form data-form="import"><div class="setting" style="margin-top:12px"><label for="imp-bal">Solde actuel du compte<span class="help">Pour calculer ton reste à vivre</span></label><input id="imp-bal" inputmode="decimal" placeholder="0,00" required></div>
      <div class="setting"><label for="imp-mode">Opérations existantes</label><select id="imp-mode"><option value="replace" ${S.source === 'demo' ? 'selected' : ''}>Remplacer</option><option value="merge" ${S.source !== 'demo' ? 'selected' : ''}>Ajouter (sans doublons)</option></select></div>
      <button class="btn primary block">Importer ${plural(res.tx.length, 'opération')}</button></form>`}`;
  }
  function readFile(file, targetId) {
    const fr = new FileReader();
    fr.onload = () => {
      let text = fr.result;
      if (/\uFFFD/.test(text)) { const fr2 = new FileReader(); fr2.onload = () => tryParse(fr2.result, targetId); fr2.readAsText(file, 'windows-1252'); return; }
      tryParse(text, targetId);
    };
    fr.readAsText(file, 'utf-8');
  }
  function tryParse(text, targetId) {
    try { showImport(parseCSV(text), targetId); if (U.ob) obUpdateFoot(); }
    catch (e) { const out = document.getElementById(targetId || 'import-out'); if (out) out.innerHTML = `<div class="verdict no" style="margin-top:14px"><span class="vi">${ic('x')}</span><div><strong>Fichier non reconnu</strong><p>${esc(e.message)} Vérifie que c’est bien l’export CSV de ta banque.</p></div></div>`; }
  }
  function applyImport(res, balance, mode) {
    const incoming = txFrom(res.tx);
    if (mode === 'merge') {
      const seen = new Set(S.tx.map(x => `${x.date}|${x.amount}|${norm(x.label)}`));
      incoming.forEach(x => { if (!seen.has(`${x.date}|${x.amount}|${norm(x.label)}`)) S.tx.push(x); });
    } else S.tx = incoming;
    if (mode !== 'merge' || S.source === 'demo') S.profile.payday = guessPayday(S.tx);
    S.source = 'csv';
    S.profile.startBalance = round2(balance - sum(S.tx.filter(x => x.date <= key(today())).map(x => x.amount)));
    save();
  }

  /* ================= Toast ================= */
  let toastTimer;
  function toast(msg, undo) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Annuler</button>' : ''}`;
    document.body.appendChild(el);
    if (undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3400);
  }

  /* ================= Actions ================= */
  const go = (tab, extra) => { closeSheet(); U.tab = tab; Object.assign(U, extra || {}); U.enter = true; try { history.replaceState(null, '', '#' + tab); } catch (e) { /* ignore */ } render(); window.scrollTo({ top: 0 }); };
  const actions = {
    tab: el => { if (U.tab === el.dataset.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } go(el.dataset.tab); },
    closeSheet: () => closeSheet(),
    affordSet: el => { U.afford = el.dataset.v; const i = document.getElementById('afford-in'); if (i) i.value = el.dataset.v; document.getElementById('afford-out').innerHTML = affordVerdict(model(), U.afford); },
    goInsight: el => { const g = el.dataset.go; if (g === 'budget' && el.dataset.cat) { go('budget', { month: 0 }); setTimeout(() => openCat(el.dataset.cat), 300); } else go(g); },
    filter: el => { U.filter = el.dataset.f; U.limit = 80; render(); },
    more: () => { U.limit += 120; document.getElementById('tx-list').innerHTML = txListHtml(model()); },
    openTx: el => openTx(el.dataset.id),
    toggleAll: el => { U.sheetTx.all = !U.sheetTx.all; el.classList.toggle('on', U.sheetTx.all); el.setAttribute('aria-checked', U.sheetTx.all); },
    setCat: el => {
      const x = S.tx.find(t => t.id === U.sheetTx.id), cat = el.dataset.cat, before = S.tx.map(t => [t.id, t.cat, t.auto]), rulesBefore = S.rules.slice();
      const mk = merchantKey(x.label);
      let n = 1;
      x.cat = cat; x.auto = false;
      if (U.sheetTx.all) { S.rules = S.rules.filter(r => r.m !== mk); S.rules.unshift({ m: mk, cat }); S.tx.forEach(t => { if (t !== x && merchantKey(t.label) === mk) { t.cat = cat; t.auto = false; n++; } }); }
      save(); closeSheet(); vibrate(10); render();
      toast(n > 1 ? `${plural(n, 'opération classée', 'opérations classées')} en ${CAT[cat].label.toLowerCase()}` : `Classée en ${CAT[cat].label.toLowerCase()}`, () => { const map = new Map(before.map(([id, c, a]) => [id, [c, a]])); S.tx.forEach(t => { const v = map.get(t.id); if (v) { t.cat = v[0]; t.auto = v[1]; } }); S.rules = rulesBefore; save(); render(); });
    },
    month: el => { U.month = +el.dataset.m; U.enter = false; render(); },
    openCat: el => openCat(el.dataset.cat),
    seeCatOps: el => go('ops', { filter: el.dataset.cat, q: '' }),
    subStatus: el => { S.subStatus[el.dataset.k] = el.dataset.v; save(); vibrate(8); render(); if (el.dataset.v === 'cancel') toast('Marqué à résilier : pense à le faire avant le prochain prélèvement'); },
    openImport: () => openImport(),
    pickFile: () => { const f = document.getElementById('file-in'); if (f) f.click(); },
    sampleCsv: () => tryParse(D.SAMPLE_CSV, U.ob ? 'ob-import-out' : 'import-out'),
    reset: el => { if (el.dataset.confirm) { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } S = null; M = null; app.innerHTML = ''; startOB(); } else { el.dataset.confirm = '1'; el.innerHTML = `${ic('alert')} Confirmer : tout effacer`; el.style.background = 'var(--neg-soft)'; el.style.color = 'var(--neg)'; } },
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = (U.ob && obActions[el.dataset.act]) || actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSheet();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'drop') { e.preventDefault(); actions.pickFile(); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'afford-in') { U.afford = t.value; document.getElementById('afford-out').innerHTML = affordVerdict(model(), t.value); }
    if (t.id === 'ops-q') { U.q = t.value; U.limit = 80; document.getElementById('tx-list').innerHTML = txListHtml(model()); }
    if (U.ob) obInput(t);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'file-in' && t.files[0]) readFile(t.files[0], U.ob ? 'ob-import-out' : 'import-out');
    if (!t.dataset.set || !S) return;
    const p = S.profile, k = t.dataset.set;
    if (k === 'theme') S.theme = t.value;
    else if (k === 'name') p.name = t.value.trim() || p.name;
    else if (k === 'payday') p.payday = +t.value;
    else { const v = parseFloat(t.value.replace(',', '.')); if (!isNaN(v) && v >= 0) p[k] = v; }
    save(); render(); toast('Réglage enregistré, reste à vivre recalculé');
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    if (f.dataset.form === 'budget') { const v = parseFloat(document.getElementById('bud-in').value.replace(',', '.')); S.budgets[f.dataset.cat] = isNaN(v) ? 0 : Math.max(0, v); save(); closeSheet(); render(); toast('Budget enregistré'); }
    if (f.dataset.form === 'import' && U.imp) {
      const bal = parseFloat(document.getElementById('imp-bal').value.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(bal)) { document.getElementById('imp-bal').focus(); return; }
      applyImport(U.imp, bal, document.getElementById('imp-mode').value);
      closeSheet(); U.enter = true; U.tab = 'today'; render(); toast(`${plural(U.imp.tx.length, 'opération importée', 'opérations importées')} et classées`);
    }
  });
  ['dragover', 'dragenter'].forEach(ev => document.addEventListener(ev, e => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } }));
  ['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { const d = e.target.closest && e.target.closest('.drop'); if (!d) return; e.preventDefault(); d.classList.remove('over'); if (ev === 'drop' && e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0], U.ob ? 'ob-import-out' : 'import-out'); }));

  /* ================= Accueil (questionnaire) ================= */
  const OB_TOTAL = 4;
  function startOB() {
    U.ob = { step: 0, dir: 'fwd', name: '', source: null, payday: 28, cushion: 50, goal: 100, balance: '' };
    let ob = document.getElementById('ob');
    if (!ob) { ob = document.createElement('div'); ob.id = 'ob'; ob.className = 'ob'; document.body.appendChild(ob); }
    ob.classList.remove('leaving');
    renderOB();
  }
  function obCanNext() {
    const o = U.ob;
    if (o.step === 1) return !!o.name.trim();
    if (o.step === 2) return o.source === 'demo' || (o.source === 'csv' && U.imp && o.balance !== '' && !isNaN(parseFloat(String(o.balance).replace(',', '.'))));
    return true;
  }
  function obUpdateFoot() { const b = document.getElementById('ob-next'); if (b) b.disabled = !obCanNext(); if (U.imp && U.ob && U.ob.step === 2) { U.ob.payday = guessPayday(U.imp.tx); } }
  function renderOB() {
    const o = U.ob, s = o.step, ob = document.getElementById('ob');
    const top = s > 0 && s <= OB_TOTAL ? `<div class="ob-top"><button class="icon-btn" data-act="obBack" aria-label="Retour">${ic('chevL')}</button><div class="ob-progress"><i style="width:${s / OB_TOTAL * 100}%"></i></div><span class="eyebrow">${s}/${OB_TOTAL}</span></div>` : '';
    const next = (label = 'Continuer') => `<div class="ob-foot"><button class="btn primary block" data-act="obNext" id="ob-next" ${obCanNext() ? '' : 'disabled'} style="height:54px;font-size:16px">${label}</button></div>`;
    let body = '';
    if (s === 0) {
      body = `<div class="welcome">${logo(true)}<h1>Sache chaque matin combien tu peux dépenser.</h1>
        <p class="lead">Marge lit tes opérations, les classe toute seule, repère tes abonnements et calcule ton reste à vivre du jour, prélèvements à venir compris.</p>
        <div class="mock"><div class="day-card" style="padding-block:18px"><span class="eyebrow">Reste à vivre · aujourd’hui</span><div class="hero-num" style="font-size:54px">23,40<small>€</small></div><p class="hero-sub">Demain, ton budget sera de <strong>24,10 €</strong>.</p></div></div></div>
        <div class="ob-foot"><button class="btn primary block" data-act="obNext" style="height:54px;font-size:16px">Commencer</button><button class="btn block" data-act="obDemo">Explorer avec un compte d’exemple</button></div>`;
    } else if (s === 1) {
      body = `<span class="eyebrow">Faisons connaissance</span><h1>Comment tu t’appelles ?</h1><input class="ob-input" id="ob-name" value="${esc(o.name)}" placeholder="Ton prénom" autocomplete="given-name" maxlength="24">${next()}`;
    } else if (s === 2) {
      body = `<span class="eyebrow">Tes opérations</span><h1>D’où viennent tes données ?</h1><p class="lead">Dans ce prototype, rien ne se connecte à ta banque : tout reste sur ton appareil.</p>
        <button class="choice" data-act="obSource" data-v="csv" style="${o.source === 'csv' ? 'border-color:var(--accent)' : ''}"><span class="ci">${ic('upload')}</span><span><strong>Importer mon relevé CSV</strong><span>Exporté depuis l’appli ou le site de ta banque</span></span></button>
        <button class="choice" data-act="obSource" data-v="demo" style="${o.source === 'demo' ? 'border-color:var(--accent)' : ''}"><span class="ci">${ic('sparkle')}</span><span><strong>Utiliser un compte d’exemple</strong><span>3 mois d’opérations réalistes pour tout tester</span></span></button>
        ${o.source === 'csv' ? `<div>${importPanel(true).replace('id="import-out"', 'id="ob-import-out"')}</div>
          <div class="slider-row" ${U.imp ? '' : 'hidden'} id="ob-bal-row"><label for="ob-bal" class="small muted">Solde actuel de ton compte</label><div class="money-in"><input id="ob-bal" inputmode="decimal" placeholder="0,00" value="${esc(o.balance)}"><span>€</span></div></div>` : ''}
        ${next()}`;
    } else if (s === 3) {
      body = `<span class="eyebrow">Ton rythme</span><h1>Quand arrive ta paie ?</h1><p class="lead">Ton reste à vivre est calculé jusqu’à ce jour-là. ${o.source === 'csv' ? 'On l’a deviné d’après ton relevé.' : ''}</p>
        <div class="slider-row"><div class="top"><span class="small muted">Je reçois mon salaire, ma bourse ou mes revenus le</span><span class="val" id="ob-pay-v">${o.payday}</span></div><input type="range" id="ob-pay" min="1" max="31" value="${o.payday}" aria-label="Jour de paie"></div>
        ${next()}`;
    } else if (s === 4) {
      body = `<span class="eyebrow">Ta marge de sécurité</span><h1>On garde un peu de côté ?</h1><p class="lead">Ces montants sont retirés avant de calculer ce que tu peux dépenser. Tu pourras les changer quand tu veux.</p>
        <div class="slider-row"><div class="top"><span class="small muted">Coussin de sécurité (jamais dépensé)</span><span class="val"><span id="ob-cush-v">${o.cushion}</span> €</span></div><input type="range" id="ob-cush" min="0" max="500" step="10" value="${o.cushion}" aria-label="Coussin de sécurité"></div>
        <div class="slider-row"><div class="top"><span class="small muted">Épargne chaque mois</span><span class="val"><span id="ob-goal-v">${o.goal}</span> €</span></div><input type="range" id="ob-goal" min="0" max="600" step="10" value="${o.goal}" aria-label="Épargne mensuelle"></div>
        ${next('Calculer mon reste à vivre')}`;
    } else {
      buildFromOB();
      const m = model();
      const steps = [`${plural(S.tx.length, 'opération classée', 'opérations classées')} automatiquement`, `${plural(m.rec.length, 'prélèvement récurrent', 'prélèvements récurrents')} détectés`, `${plural(m.insights.filter(i => i.tone !== 'pos').length, 'alerte')} à regarder`, `Paie le ${fmtShort(m.nextPay)}, dans ${plural(m.daysLeft, 'jour')}`];
      body = `<span class="eyebrow">C’est prêt</span><h1>Ton reste à vivre aujourd’hui, ${esc(S.profile.name)} :</h1>
        <div class="hero-num ${m.leftToday < 0 ? 'neg' : ''}" style="font-size:64px"><span data-count="${Math.max(0, m.leftToday).toFixed(2)}">0</span><small>€</small></div>
        <ul class="ready-list">${steps.map((x, i) => `<li style="--i:${i}"><span class="ok">${ic('check')}</span>${x}</li>`).join('')}</ul>
        <div class="ob-foot"><button class="btn primary block" data-act="obFinish" style="height:54px;font-size:16px">Ouvrir Marge</button></div>`;
    }
    ob.innerHTML = `<div class="ob-inner">${top}<div class="ob-step ${o.dir}">${body}</div></div>`;
    o.dir = ''; ob.scrollTop = 0;
    if (s === 5) countUp(ob);
  }
  function buildFromOB() {
    const o = U.ob;
    if (o.source === 'csv' && U.imp) {
      S = { v: 1, profile: { name: o.name.trim() || 'Toi', payday: o.payday, cushion: o.cushion, savingsGoal: o.goal, startBalance: 0 }, tx: [], rules: [], budgets: {}, subStatus: {}, theme: 'auto', source: 'csv' };
      D.CATS.forEach(c => { S.budgets[c.id] = c.budget; });
      S.tx = txFrom(U.imp.tx);
      const bal = parseFloat(String(o.balance).replace(/\s/g, '').replace(',', '.')) || 0;
      S.profile.startBalance = round2(bal - sum(S.tx.filter(x => x.date <= key(today())).map(x => x.amount)));
    } else {
      demoState(o.name.trim() || 'Alex');
      Object.assign(S.profile, { payday: o.payday, cushion: o.cushion, savingsGoal: o.goal });
    }
    M = null;
  }
  function obGo(n) { U.ob.dir = n > U.ob.step ? 'fwd' : 'back'; U.ob.step = n; renderOB(); }
  const obActions = {
    obNext: () => { if (!obCanNext()) return; obGo(U.ob.step + 1); },
    obBack: () => obGo(Math.max(0, U.ob.step - 1)),
    obDemo: () => { U.ob.name = 'Alex'; U.ob.source = 'demo'; obGo(5); },
    obSource: el => { U.ob.source = el.dataset.v; if (el.dataset.v === 'demo') U.ob.payday = 28; renderOB(); },
    obFinish: () => {
      save(); const ob = document.getElementById('ob');
      U.ob = null; U.imp = null; U.tab = 'today'; U.enter = true;
      renderShell(); render();
      ob.classList.add('leaving'); setTimeout(() => ob.remove(), 700);
    },
  };
  function obInput(t) {
    const o = U.ob;
    if (t.id === 'ob-name') o.name = t.value;
    if (t.id === 'ob-bal') o.balance = t.value;
    if (t.id === 'ob-pay') { o.payday = +t.value; document.getElementById('ob-pay-v').textContent = t.value; }
    if (t.id === 'ob-cush') { o.cushion = +t.value; document.getElementById('ob-cush-v').textContent = t.value; }
    if (t.id === 'ob-goal') { o.goal = +t.value; document.getElementById('ob-goal-v').textContent = t.value; }
    obUpdateFoot();
  }
  // Après un import pendant l'accueil : afficher le champ « solde »
  const origShow = showImport;
  showImport = function (res, targetId) { origShow(res, targetId); const r = document.getElementById('ob-bal-row'); if (r) r.hidden = false; };
  document.addEventListener('keydown', e => { if (U.ob && e.key === 'Enter' && e.target.id === 'ob-name' && obCanNext()) obGo(2); });

  /* ================= Démarrage ================= */
  function boot() {
    const h = (location.hash || '').slice(1);
    if (TABS.some(t => t[0] === h)) U.tab = h;
    if (!S || !S.profile) startOB(); else { renderShell(); render(); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && S && !U.ob) { M = null; render(); } });
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol) && !/claude\.ai|claudeusercontent/.test(location.host)) navigator.serviceWorker.register('sw.js').catch(() => { /* hors PWA */ });
  }
  boot();
})();
