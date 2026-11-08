const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const srv = http.createServer(app);
const io = new Server(srv, { cors: { origin: '*' } });

/* ================= ДАННЫЕ ================= */
const ago = h => Date.now() - h * 36e5;
const L = n => Array.from({ length: n }, (_, i) => 'b' + i);
let idc = 99999;
const since = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });

const U = (u, name, o) => ({ u, name, id: ++idc, bio: '', phone: '', alts: [], wear: '', avatar: '', banner: '', theme: 'ocean', song: null, pch: '', banned: 0, since, views: 200, badges: [], gifts: [], status: 'был(а) недавно', marks: [], ruby: 0, stars: 0, premium: 0, clan: '', ...o });

const users = {
  slasherchat: U('slasherchat', 'Slasher Chats', { logo: 1, marks: ['verified'], views: 5120, badges: ['💎'], admin: true }),
};

const chats = {
  news: { id: 'news', ch: 1, owner: 'owner', u: 'slashernews', bio: 'Официальные новости Slasher Chat', avatar: '', grp: 0, subs: ['owner', 'slasherchat'], name: 'Slasher News', logo: 1, ver: 1, pin: 1, msgs: [
    { id: 1, t: '29 октября в 20:00 МСК выставятся на маркет номера +666 бесплатно\n\nУспейте.', views: 848, ts: ago(60), re: { '❤️': L(27) } },
    { id: 2, t: 'В ближайшее время выйдет глобальное обновление…\n\nОжидайте', views: 825, ts: ago(40), re: { '💎': L(7), '❤️': L(48) } },
    { id: 3, t: 'Мы пробили потолок в 100 онлайна!', views: 724, ts: ago(30), re: { '💎': L(1), '❤️': L(58) } },
    { id: 4, t: 'Загружаем для вас подарок в честь Хэллуина 🎃', views: 166, ts: ago(2), re: { '❤️': L(22) } }] },
};

const posts = [];
const hist = {};
const auth = {}, tok = {};
const conv = {}, hid = {};
let serial = 652;

const BGS = [['Black', '#0b0b0d', '#2c2f38'], ['Emerald', '#0d3320', '#2fa05a'], ['Crimson', '#3d0a0a', '#c0392b'], ['Navy', '#0a1f45', '#2f6fd0'], ['Violet', '#25104a', '#7c3aed'], ['Gold', '#3d2a05', '#d4a017'], ['Teal', '#06302f', '#14b8a6']];
const RAR = [0.8, 1.3, 2, 3.5, 5, 8, 10, 15], rr = () => RAR[Math.random() * RAR.length | 0];
const G = (e, name, pat, price, total) => ({ e, name, pat, price, total, kind: 'gift' });

const CAT = {
  g1: G('🐈‍⬛', 'Зелёный кот', '🐾', 50, 1000), g2: G('🎃', 'Тыква', '🦇', 20, 2000), g3: G('👑', 'Корона', '⚜️', 120, 500), g4: G('🐉', 'Дракон', '🔥', 200, 300), g5: G('👻', 'Призрак', '🕸️', 30, 2000), g6: G('💠', 'NFT Кристалл', '✨', 300, 200),
  g7: G('😈', 'Devil', '🧰', 250, 400), g8: G('🚬', 'Сигара', '🐕', 90, 1000), g9: G('💍', 'Кольцо', '🔥', 300, 200), g10: G('🎭', 'Маска', '🐻', 180, 500), g11: G('🐈', 'Золотой кот', '🐾', 400, 150), g12: G('💐', 'Букет с деньгами', '💵', 60, 2000), g13: G('🧸', 'Плюшевый букет', '🌿', 70, 2000), g14: G('🤡', 'Клоун', '🃏', 220, 300), g15: G('🥷', 'Ниндзя', '⭐', 260, 300), g16: G('🦇', 'Ночной страж', '🦇', 350, 200),
  p1: G('🐸', 'Pepe Genesis', '🐸', 500, 50), p2: G('🐸', 'Pepe Gold', '💛', 900, 25), p3: G('🐸', 'Pepe Alien', '👽', 1500, 10), p4: G('🐸', 'Pepe King', '👑', 2500, 5),
  m1: { e: '📞', name: 'Номер +666…', price: 80, kind: 'badge' }, m2: { e: '🔖', name: 'Короткий ник', price: 150, kind: 'badge' }, m3: { e: '☎️', name: 'Номер +888', price: 200, kind: 'num' } };

const CLANS = ['Shadow', 'Slasher Elite', 'Night Owls', 'DEV'];

/* ================= ХРАНИЛИЩЕ ================= */
const DBF = process.env.DATA_FILE || 'data.json';
const dbRead = () => { try { return JSON.parse(require('fs').readFileSync(DBF, 'utf8')); } catch { return null; } };
const dbWrite = j => { try { const f = require('fs'); f.writeFileSync(DBF + '.tmp', j); f.renameSync(DBF + '.tmp', DBF); } catch (e) { console.error('save', e.message); } };
const snap = () => JSON.stringify({ users, chats, posts, conv, hid, auth, tok, idc, serial, songs, bp, cnt: Object.fromEntries(Object.entries(CAT).map(([k, v]) => [k, v.cnt || 0])) });
let _st;
const flush = () => { clearTimeout(_st); dbWrite(snap()); };
const save = () => { clearTimeout(_st); _st = setTimeout(flush, 400); };
['SIGINT', 'SIGTERM'].forEach(g => process.on(g, () => { flush(); process.exit(); }));

const hash = p => require('crypto').createHash('sha256').update('slasher' + p).digest('hex');
const rid = () => require('crypto').randomUUID();

/* ================= ПОДАРКИ / УТИЛИТЫ ================= */
const give = (T, it, from) => { it.cnt = (it.cnt || 0) + 1; const b = BGS[Math.random() * BGS.length | 0]; T.gifts.push({ id: Math.random().toString(36).slice(2, 8), n: it.cnt, e: it.e, name: it.name, pat: it.pat || '✨', bg: b[0], c1: b[1], c2: b[2], mp: rr(), pp: rr(), bp: rr(), from: from || 'Slasher', total: it.total || 400 }); };
const ck = (a, b) => [a, b].sort().join('/');
const add = (k, from, t, x) => { const m = { id: Math.random(), from, t, ts: Date.now(), ...x }; (conv[k] ||= []).push(m); return m; };
const pm = ({ seen, ...m }) => m;
const tog = (a, x) => { const i = a.indexOf(x); i < 0 ? a.push(x) : a.splice(i, 1); };
const free = u => { const k = String(u).toLowerCase(); return !['support', 'admin', 'news', 'me', 'api'].includes(k) && !users[k] && !chats[k] && !Object.values(users).some(x => (x.alts || []).some(a => a.toLowerCase() == k)) && !Object.values(chats).some(c => (c.u || '').toLowerCase() == k); };
const imgOk = (v, n) => /^data:image\/(jpeg|png|webp);base64,/.test(v || '') && v.length < n;
const songOk = s => /^data:audio\/[\w;=+.-]+;base64,/.test(s || '') && s.length < 4.3e6;
const sanx = (img, aud) => ({ img: /^data:image\/(jpeg|png|webp);base64,/.test(img) && img.length < 250000 ? img : undefined, aud: /^data:audio\/[\w;=+.-]+;base64,/.test(aud) && aud.length < 400000 ? aud : undefined });

const pubCh = (c, me) => ({ id: c.id, ch: 1, grp: c.grp, u: c.u, name: c.name, bio: c.bio, avatar: c.avatar, logo: c.logo, ver: c.ver, pin: c.pin, owner: c.owner, subs: c.subs.length + (c.fake || 0), song: c.song || null, banner: c.banner, theme: c.theme, joined: c.subs.includes(me), msgs: c.msgs.map(pm) });

const boot = me => {
  const c = {};
  for (const k in chats) if (chats[k].subs.includes(me)) c[k] = pubCh(chats[k], me);
  for (const k in conv) { const p = k.split('/'); if (p[0] == 's') { if (p[1] == me) c.support = { id: 'support', sup: 1, msgs: conv[k] }; } else if (p.includes(me)) { const o = p[0] == me ? p[1] : p[0]; if (!hid[me + '/' + o]) c[o] = { id: o, dm: 1, msgs: conv[k] }; } }
  if (users[me]?.banned && !c.support) c.support = { id: 'support', sup: 1, msgs: [] };
  if (users.slasherai && me && !c.slasherai && !hid[me + '/slasherai']) c.slasherai = { id: 'slasherai', dm: 1, msgs: [] };
  if (c.slasherai) c.slasherai.pin = 1;
  return { users, chats: c, posts };
};

/* ================= БОТ / ИИ ================= */
const songs = {}, bp = { slasherai: 'Ты Slasher AI, самый сильный ассистент мессенджера. Помогаешь с вопросами, текстами, кодом, идеями и учёбой.' };
const AIK = process.env.ANTHROPIC_API_KEY;
const AIM = [process.env.AI_MODEL || 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'];
const AIBASE = 'Ты ИИ-бот внутри мессенджера Slasher Chat. Отвечай на языке собеседника, по делу и дружелюбно, без лишней воды. ';

const ask = async (system, msgs) => {
  try {
    if (AIK) {
      for (const model of AIM) {
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': AIK, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 2048, system, messages: msgs }) });
        const j = await r.json();
        if (r.ok) return (j.content || []).filter(c => c.type == 'text').map(c => c.text).join('').trim() || '…';
        if (r.status == 404 || j.error?.type == 'not_found_error') continue;
        return 'Ошибка ИИ: ' + (j.error?.message || r.status);
      }
      return 'Модель ИИ недоступна для этого ключа.';
    }
  } catch (e) { return 'Не удалось получить ответ ИИ'; }
  const q = (msgs.at(-1)?.content || '').trim(), low = q.toLowerCase();
  const R = [[/привет|здравств|хай|hello/, 'Привет! Я бот Slasher Chat. Спрашивай 🙂'], [/как дела/, 'Отлично! А у тебя?'], [/кто ты|что ты/, 'Я автоматический бот. Владелец задаёт мне инструкцию в настройках.'], [/врем/, 'Сейчас ' + new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })], [/спасибо/, 'Всегда пожалуйста! 🤝'], [/пока/, 'До связи! 👋']];
  for (const [r, a] of R) if (r.test(low)) return a;
  return 'Ты написал: «' + q.slice(0, 200) + '». Я работаю без ИИ-ключа, поэтому отвечаю шаблонно. Владелец может включить настоящий ИИ через ANTHROPIC_API_KEY.';
};

const aiHist = (key, bid) => { const out = []; for (const m of (conv[key] || []).slice(-24)) { const role = m.from == bid ? 'assistant' : 'user', t = m.t || (m.img ? '[фото]' : m.aud ? '[голосовое]' : ''); if (!t) continue; if (out.length && out.at(-1).role == role) out.at(-1).content += '\n' + t; else out.push({ role, content: t }); } while (out.length && out[0].role != 'user') out.shift(); return out; };
const aiBusy = {}, aiQ = {}, aiRate = {};

const botReply = async (me, bot) => {
  const bid = bot.u.toLowerCase(), k = ck(me, bid);
  if (aiBusy[me]) { aiQ[me] = bot; return; }
  const now = Date.now(), a = (aiRate[me] = (aiRate[me] || []).filter(t => now - t < 6e5));
  if (a.length >= 20) { const m = add(k, bid, 'Слишком много запросов. Подожди пару минут и напиши снова.'); io.to(me).emit('msg', { id: bid, m }); return; }
  a.push(now); aiBusy[me] = 1; io.to(me).emit('typing', { id: bid });
  let t; try { t = await ask(AIBASE + (bp[bid] || ''), aiHist(k, bid)); } finally { aiBusy[me] = 0; }
  const m = add(k, bid, String(t).slice(0, 4000)); io.to(me).emit('msg', { id: bid, m }); save();
  if (aiQ[me]) { const b = aiQ[me]; delete aiQ[me]; botReply(me, b); }
};

/* ================= ВЛАДЕЛЕЦ ================= */
const ADMIN_PASS = process.env.ADMIN_PASS || 'LUGM65Mf00mB';
users.slasherchat.admin = true; auth.slasherchat = hash(ADMIN_PASS);
const OWNER_PASS = process.env.OWNER_PASS || '3nqnBzv8bAxX';
users.owner = U('owner', 'Владелец', { color: '#ef4444', admin: true, root: true, id: 100000, phone: '+888 8888 8888', alts: ['wallet', 'gift', 'dev'], bio: 'не пиши сюда', since: '31 июл. 2026 г.', views: 2200, marks: ['verified', 'star', 'staff', 'vip'], premium: 1, badges: ['💎', '🛠', '1к', '⭐'], clan: 'DEV', ruby: 5000, stars: 100, status: 'в сети' });
auth.owner = hash(OWNER_PASS);
['g7', 'g8', 'g9', 'g10', 'g11', 'g12', 'g13', 'g14', 'g15', 'g16'].forEach(i => give(users.owner, CAT[i], 'Slasher'));
users.owner.wear = users.owner.gifts[0].id;

/* ================= ВОССТАНОВЛЕНИЕ ИЗ ФАЙЛА ================= */
{
  const d = dbRead();
  if (d && d.users) {
    for (const [n, o] of [['users', users], ['chats', chats], ['auth', auth], ['tok', tok], ['conv', conv], ['hid', hid]]) { for (const k in o) delete o[k]; Object.assign(o, d[n] || {}); }
    posts.length = 0; posts.push(...(d.posts || []));
    Object.assign(songs, d.songs || {}); Object.assign(bp, d.bp || {});
    idc = d.idc || idc; serial = d.serial || serial;
    for (const k in (d.cnt || {})) if (CAT[k]) CAT[k].cnt = d.cnt[k];
    for (const u of Object.values(users)) { u.marks = u.marks || []; u.alts = u.alts || []; u.gifts = u.gifts || []; u.badges = u.badges || []; u.banner = u.banner || ''; u.theme = u.theme || 'ocean'; }
  }
}
if (!users.slasherai) users.slasherai = U('slasherai', 'Slasher AI', { bot: true, owner: 'owner', marks: ['bot', 'verified'], color: '#0d9488', status: 'ИИ-бот', bio: 'Самый сильный ИИ-ассистент Slasher Chat. Пиши любой вопрос.' });

/* ================= HTTP ================= */
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.get('/', (req, res) => res.send('Slasher Chat server is running ✔'));
app.get('/api/data', (req, res) => { const me = tok[req.query.t] || ''; res.json(boot(me)); });

/* ================= SOCKET ================= */
io.on('connection', s => {
  let me = '';
  const on0 = s.on.bind(s);
  s.on = (e, f) => on0(e, (...a) => { try { return f(...a); } finally { save(); } });

  s.on('reg', ({ u, name, pw }, ack) => { u = String(u || '').replace(/\W/g, '').slice(0, 20); const k = u.toLowerCase();
    if (u.length < 3 || String(pw || '').length < 4) return ack({ err: 'Юзернейм от 3 символов, пароль от 4' });
    if (!free(u)) return ack({ err: 'Юзернейм занят' });
    name = String(name || u).slice(0, 24);
    users[k] = U(u, name, { color: '#14b8a6', status: 'в сети', views: 0, ruby: 100 });
    auth[k] = hash(pw); chats.news.subs.push(k); io.emit('user', users[k]); const t = rid(); tok[t] = k; ack({ t, u, name }); });

  s.on('login', ({ u, pw }, ack) => { const k = String(u || '').toLowerCase(); if (!auth[k] || auth[k] !== hash(pw)) return ack({ err: 'Неверный юзернейм или пароль' }); const t = rid(); tok[t] = k; ack({ t, u: users[k].u, name: users[k].name }); });

  s.on('hello', ({ t }, ack) => { const k = tok[t]; if (!k) return ack({ err: 1 }); me = k; s.join(me); ack({ cat: CAT, clans: CLANS }); });

  s.on('adm', ({ u, k, v }, ack) => { ack = ack || (() => {}); if (!users[me]?.admin) return ack({ err: 'Нет прав' });
    const all = u == '*', T = all ? null : users[String(u || '').toLowerCase()], tk = T ? T.u.toLowerCase() : ''; if (!all && !T) return ack({ err: 'Сначала выбери пользователя' });
    if (all && !['ruby', 'stars', 'gift', 'badge'].includes(k)) return ack({ err: 'Для «Все»: рубины, звёзды, подарки, значки' });
    const L2 = all ? Object.keys(auth).map(x => users[x]) : [T], n = Math.floor(+v);
    if (k == 'mark') { if (!MKS.includes(v)) return ack({ err: '?' }); tog(T.marks, v); }
    else if (k == 'prem') T.premium = T.premium ? 0 : 1;
    else if (k == 'ruby' || k == 'stars') { if (!n) return ack({ err: 'Введи число' }); L2.forEach(x => x[k] += n); }
    else if (k == 'gift' && CAT[v]) L2.forEach(x => give(x, CAT[v], users[me].name));
    else if (k == 'badge') { v = String(v || '').trim().slice(0, 4); if (!v) return ack({ err: 'Введи значок' }); L2.forEach(x => x.badges.push(v)); }
    else if (k == 'ungift') T.gifts.splice(+v, 1); else if (k == 'unbadge') T.badges.splice(+v, 1);
    else if (k == 'name') { v = String(v || '').trim().slice(0, 24); if (!v) return ack({ err: 'Пустое имя' }); T.name = v; }
    else if (k == 'bio') T.bio = String(v || '').slice(0, 120);
    else if (k == 'phone') T.phone = String(v || '').replace(/[^\d+ ]/g, '').slice(0, 18);
    else if (k == 'alt') { v = String(v || '').replace(/\W/g, '').slice(0, 20); if (!v) return ack({ err: 'Введи юзернейм' }); if (T.alts.length >= 100) return ack({ err: 'Максимум 100' }); if (!T.alts.includes(v)) T.alts.push(v); }
    else if (k == 'unalt') T.alts.splice(+v, 1);
    else if (k == 'admin') { if (!users[me].root) return ack({ err: 'Админку выдаёт только владелец' }); if (T.root) return ack({ err: 'Владельца менять нельзя' }); T.admin = T.admin ? 0 : 1; }
    else if (k == 'ban') { if (T.admin) return ack({ err: 'Админа банить нельзя' }); if (T.banned) { T.banned = 0; const m = add('s/' + tk, 'support', 'Ваш аккаунт разблокирован.'); io.to(tk).emit('msg', { id: 'support', m }); } else { T.banned = String(v || '').trim().slice(0, 100) || 'нарушение правил'; const m = add('s/' + tk, 'support', 'Ваш аккаунт заблокирован. Причина: ' + T.banned + '. Вы можете ответить в этом чате.'); io.to(tk).emit('msg', { id: 'support', m }); } }
    else if (k == 'sys') { v = String(v || '').trim().slice(0, 1000); if (!v) return ack({ err: 'Введи сообщение' }); const m = add('s/' + tk, 'support', v); io.to(tk).emit('msg', { id: 'support', m }); }
    else if (k == 'apw') { if (String(v || '').length < 4) return ack({ err: 'Минимум 4 символа' }); auth[T.u.toLowerCase()] = hash(v); }
    else return ack({ err: '?' });
    L2.forEach(x => io.emit('user', x)); ack({ ok: 1 }); });

  s.on('buy', ({ id }, ack) => { if (users[me]?.banned) return ack({ err: 'Аккаунт заблокирован' }); const T = users[me], it = CAT[id] || (id == 'prem' && { price: 100, kind: 'prem' }); if (!T || !it) return;
    if (T.ruby < it.price) return ack({ err: 'Недостаточно рубинов' }); T.ruby -= it.price;
    it.kind == 'gift' ? give(T, it, 'Магазин') : it.kind == 'badge' ? T.badges.push(it.e) : it.kind == 'num' ? (T.phone = '+888 ' + (1000 + Math.random() * 9000 | 0) + ' ' + (1000 + Math.random() * 9000 | 0)) : it.kind == 'star' ? (T.stars = (T.stars || 0) + 1) : (T.premium = 1); io.emit('user', T); ack({ ok: 1 }); });

  s.on('topup', () => { const T = users[me]; if (T) { T.ruby += 50; io.emit('user', T); } });

  s.on('pay', ({ u, n }, ack) => { if (users[me]?.banned) return ack({ err: 'Аккаунт заблокирован' }); const T = users[me], R = users[String(u || '').toLowerCase()]; n = Math.floor(+n);
    if (!T || !R || R == T || !(n > 0) || T.ruby < n) return ack({ err: 'Не удалось отправить' }); T.ruby -= n; R.ruby += n; io.emit('user', T); io.emit('user', R); ack({ ok: 1 }); });

  s.on('set', ({ k, v }) => { if (users[me]?.banned) return; const T = users[me]; if (!T) return; v = String(v ?? '');
    if (k == 'clan') T.clan = CLANS.includes(v) ? v : ''; else if (k == 'name' && v.trim()) T.name = v.trim().slice(0, 24); else if (k == 'bio') T.bio = v.slice(0, 120); else if (k == 'hp') T.hp = v == '1' ? 1 : 0; else if (k == 'pch') { const C = chats[v]; T.pch = (v == '' || (C && (C.owner == me || T.admin))) ? v : T.pch; } else if (k == 'banner') T.banner = (v == '' || (/^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < 220000)) ? v : T.banner; else if (k == 'theme' && THEMES.includes(v)) T.theme = v;
    else if (k == 'avatar') T.avatar = (v == '' || (/^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < 150000)) ? v : T.avatar; io.emit('user', T); });

  s.on('gwear', ({ id }) => { const T = users[me]; if (!T) return; T.wear = T.wear == id ? '' : (T.gifts.some(g => g.id == id) ? id : T.wear); io.emit('user', T); });

  s.on('gsend', ({ id, u }, ack) => { const T = users[me], R = users[String(u || '').replace('@', '').toLowerCase()], i = T ? T.gifts.findIndex(g => g.id == id) : -1;
    if (i < 0 || !R || R == T) return ack({ err: 'Не удалось передать' }); const [g] = T.gifts.splice(i, 1); if (T.wear == id) T.wear = ''; R.gifts.push(g); io.emit('user', T); io.emit('user', R); ack({ ok: 1 }); });

  s.on('cgift', ({ id, g }, ack) => { ack = ack || (() => {}); const T = users[me]; if (!T || T.banned) return ack({ err: 'Недоступно' });
    const C = chats[id], R = C ? users[C.owner] : users[id];
    if (!R) return ack({ err: 'Получатель не найден' });
    if (C && C.ch && !C.grp && C.owner != me && !T.admin) return ack({ err: 'Нет прав' });
    let txt;
    if (g == 's1' || g == 's2' || g == 's3') { const SN = { s1: [10, 10], s2: [50, 45], s3: [100, 85] }, [st, pr] = SN[g];
      if (T.ruby < pr) return ack({ err: 'Не хватает рубинов' }); T.ruby -= pr; R.stars = (R.stars || 0) + st; txt = `⭐ ${T.name} подарил ${st} звёзд`; }
    else { const it = CAT[g]; if (!it || it.kind != 'gift') return ack({ err: 'Подарок не найден' });
      if (T.ruby < it.price) return ack({ err: 'Не хватает рубинов' }); T.ruby -= it.price; give(R, it, T.name);
      const Lg = R.gifts.at(-1); txt = `🎁 ${T.name} дарит ${it.e} ${it.name} #${Lg.n} из ${Lg.total}`; }
    io.emit('user', R); io.emit('user', T);
    if (C) { const m = { id: Date.now() + Math.random(), t: txt, ts: Date.now(), views: 0, seen: [], re: { '❤️': [] }, from: me }; C.msgs.push(m); C.subs.forEach(k => io.to(k).emit('cmsg', { id, m: pm(m) })); }
    else { const m = add(ck(me, id), me, txt); io.to(me).emit('msg', { id, m }); io.to(id).emit('msg', { id: me, m }); }
    ack({ ok: 1 }); });

  s.on('pdel', ({ id }) => { const i = posts.findIndex(p => p.id == id); if (i < 0 || (posts[i].u != me && !users[me]?.admin)) return; posts.splice(i, 1); io.emit('pdel', { id }); });

  s.on('send', ({ id, t, img, aud }, ack) => { ack = ack || (() => {}); const T = users[me]; t = String(t || '').slice(0, 2000); const x = sanx(img, aud);
    if (!T || (!t && !x.
