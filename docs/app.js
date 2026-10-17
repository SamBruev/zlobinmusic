'use strict';
const courses = {
 harmony: { title: 'Первые ii–V–I', intro: 'От знакомых аккордов к пониманию джазовой гармонии. Направление для тех, кто уже играет базовые аккорды и хочет услышать, что их связывает.', modules: ['Услышать устойчивость и напряжение. Спеть короткую фразу и найти её на гитаре.', 'Разобраться в септаккордах Dm7, G7 и Cmaj7. Найти удобные положения на грифе.', 'Соединить аккорды с небольшим движением голосов. Сохранить ровный пульс.', 'Построить короткую фразу на звуках аккордов. Оставить место паузе и ответу.'] },
 jazz: { title: 'Джаз как язык', intro: 'Основной путь для гитаристов, которым хочется выйти за рамки выученных ходов и выражать свою музыкальную мысль.', modules: ['Слух и ритм с самого начала: услышать, спеть и сыграть короткую идею.', 'Гармония на практике: звуки аккорда, устойчивость, напряжение и разрешение.', 'Фразировка: мотив, пауза, развитие и ответ. Придать фразе характер.', 'Разобрать музыкальный пример на слух и перенести найденный приём в свою игру.', 'Аккомпанемент и импровизация: слушать общий пульс и оставлять пространство другим.', 'Собрать собственное небольшое соло и осмысленно разобрать запись своей игры.'] },
 bossa: { title: 'Ритм босса-новы', intro: 'Отдельное направление для тех, кто хочет расширить свой аккомпанемент и разобраться в ритмическом языке босса-новы.', modules: ['Почувствовать пульс и услышать роль баса. Разделить партии баса и аккордов.', 'Собрать базовый рисунок правой руки в медленном темпе.', 'Понять синкопы и удержать рисунок при смене гармонии.', 'Соединить аккомпанемент и мелодию в небольшом музыкальном фрагменте.'] }
};
// Occasional UI transitions: native dialogs retain keyboard focus and modal semantics.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const easeDrawer = 'cubic-bezier(0.32, 0.72, 0, 1)';
let keyboardAction = false;
document.addEventListener('keydown', () => { keyboardAction = true; }, true);
document.addEventListener('pointerdown', () => { keyboardAction = false; }, true);
const dialogMotions = new Map();
const feedbackMotions = new Map();
function syncModalLock() { document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]')); }
function finishDialogMotion(panel) {
 const previous = dialogMotions.get(panel);
 if (previous) { dialogMotions.delete(panel); previous.animation.cancel(); }
 panel.style.removeProperty('will-change');
}
function animateDialog(panel, opening, then = () => {}) {
 const previous = dialogMotions.get(panel);
 const current = previous ? { transform: getComputedStyle(panel).transform, opacity: getComputedStyle(panel).opacity } : null;
 finishDialogMotion(panel);
 const drawer = panel.classList.contains('menu-drawer');
 const closed = { transform: drawer ? 'translateX(100%)' : 'translateY(24px) scale(0.97)', opacity: drawer ? .7 : 0 };
 const shown = { transform: 'none', opacity: 1 };
 panel.classList.toggle('is-closing', !opening);
 if (motionPreference.matches || keyboardAction || !panel.animate) { panel.classList.add('instant-motion'); then(); return; }
 panel.classList.remove('instant-motion');
 panel.style.willChange = 'transform, opacity';
 const animation = panel.animate([current || (opening ? closed : shown), opening ? shown : closed], {duration: drawer ? (opening ? 280 : 220) : (opening ? 240 : 180), easing: drawer ? easeDrawer : easeOut, fill: 'both'});
 const state = { animation, opening, then };
 dialogMotions.set(panel, state);
 animation.onfinish = () => {
  if (dialogMotions.get(panel) !== state) return;
  dialogMotions.delete(panel); animation.cancel(); panel.style.removeProperty('will-change'); then();
 };
}
function showMotionDialog(panel) {
 if (!panel.open) panel.showModal();
 syncModalLock(); animateDialog(panel, true);
}
function closeMotionDialog(panel, after = () => {}) {
 if (!panel.open) return;
 animateDialog(panel, false, () => { panel.close(); panel.classList.remove('is-closing'); syncModalLock(); after(); });
}
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
const menuDialog = document.querySelector('#menu-dialog');
function closeMenu(after) { menuButton.setAttribute('aria-expanded', 'false'); closeMotionDialog(menuDialog, after); }
menuButton.addEventListener('click', () => { menuButton.setAttribute('aria-expanded', 'true'); showMotionDialog(menuDialog); });
menuDialog.querySelector('.menu-close').addEventListener('click', () => closeMenu());
menuDialog.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
menuDialog.addEventListener('click', event => { if (event.target !== menuDialog) return; const r=menuDialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeMenu(); });
menuDialog.addEventListener('close', () => { finishDialogMotion(menuDialog); menuButton.setAttribute('aria-expanded', 'false'); syncModalLock(); });
menuDialog.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
 event.preventDefault();
 const target = document.querySelector(link.hash); if (!target) return;
 closeMenu(() => {
  history.pushState(null, '', link.hash);
  const focusTarget = target.querySelector('h2') || target;
  focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({preventScroll:true});
  target.scrollIntoView({behavior:motionPreference.matches || keyboardAction ? 'instant' : 'smooth'});
 });
}));
const dialog = document.querySelector('#course-dialog');
let dialogTrigger, activeCourse;
const messageDrafts = new Map();
function openCourse(id, trigger) {
 const course = courses[id]; if (!course) return;
 dialogTrigger = trigger;
 activeCourse = id;
 document.querySelector('#dialog-message').value = messageDrafts.get(id) ?? messageFor(id);
 document.querySelector('#dialog-message-status').textContent = '';
 updateContactMessage(id);
 document.querySelector('#dialog-title').textContent = course.title;
 document.querySelector('#dialog-intro').textContent = course.intro;
 document.querySelector('#dialog-modules').replaceChildren(...course.modules.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
 stopAudio(false); showMotionDialog(dialog); dialog.scrollTop = 0;
}
document.querySelectorAll('[data-course]').forEach(button => button.addEventListener('click', () => openCourse(button.dataset.course, button)));
dialog.querySelector('.dialog-close').addEventListener('click', () => closeMotionDialog(dialog));
dialog.querySelector('.dialog-return').addEventListener('click', () => closeMotionDialog(dialog));
dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeMotionDialog(dialog); });
dialog.addEventListener('cancel', event => { event.preventDefault(); closeMotionDialog(dialog); });
dialog.addEventListener('close', () => { finishDialogMotion(dialog); syncModalLock(); dialogTrigger?.focus({preventScroll:true}); });
const recommendations = {
 harmony: ['Тебе может подойти курс «Первые ii–V–I»', 'Связь аккордов, движение голосов и короткая музыкальная фраза.'],
 jazz: ['Присмотрись к курсу «Джаз как язык»', 'Слух, развитие мелодии и импровизация в музыкальном контексте.'],
 bossa: ['Присмотрись к курсу «Ритм босса-новы»', 'Бас, синкопы и независимость пальцев в аккомпанементе.'],
 personal: ['Давай обсудим твою задачу', 'Напиши мне, с чего хочешь начать. Обсудим индивидуальные онлайн-занятия.']
};
const recommendationAction = document.querySelector('#recommendation-action');
document.querySelectorAll('[name="goal"]').forEach(input => input.addEventListener('change', () => {
 const [title, text] = recommendations[input.value];
 updateContactMessage(input.value);
 document.querySelector('#recommendation-title').textContent = title;
 document.querySelector('#recommendation-text').textContent = text;
 recommendationAction.dataset.course = input.value;
 recommendationAction.replaceChildren(document.createTextNode(input.value === 'personal' ? 'Обсудить обучение ' : 'Посмотреть программу '));
 const arrow = document.createElement('span'); arrow.textContent = input.value === 'personal' ? '↓' : '+'; arrow.setAttribute('aria-hidden', 'true'); recommendationAction.append(arrow);
 softFeedback(document.querySelector('.recommendation'));
}));
recommendationAction.addEventListener('click', () => { if (recommendationAction.dataset.course === 'personal') { document.querySelector('#contact').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); document.querySelector('#contact .button').focus({ preventScroll: true }); } });
// Concert-pitch guitar voicings, strings 5–2: x5756x, x5546x, x3545x.
// Top voice F4 → F4 → E4. G7/D is explicitly shown as an inversion.
const voicings = [[50, 57, 60, 65], [50, 55, 59, 65], [48, 55, 59, 64]];
const names = ['Dm7 · верхняя нота фа', 'G7/D · верхняя нота фа', 'Cmaj7 · верхняя нота ми'];
const chordButtons = [...document.querySelectorAll('[data-chord]')];
const sequenceButton = document.querySelector('#play-sequence');
const stopButton = document.querySelector('#stop-audio');
const audioStatus = document.querySelector('#sound-status');
let context, master, voices = [], timers = [], playing = false, generation = 0;
function markChord(index) { chordButtons.forEach((b, i) => b.classList.toggle('active', index === i)); }
function resetPlayer() { playing = false; markChord(-1); sequenceButton.setAttribute('aria-pressed', 'false'); sequenceButton.innerHTML = '<span aria-hidden="true">▶</span> Послушать связку'; stopButton.disabled = true; }
function stopAudio(announce = true) {
 generation++; timers.forEach(clearTimeout); timers = [];
 voices.forEach(voice => { try { const now = context.currentTime; voice.releaseGain.gain.cancelAndHoldAtTime(now); voice.releaseGain.gain.linearRampToValueAtTime(0, now + 0.025); voice.stop(now + 0.03); } catch { try { voice.stop(); } catch {} } }); voices = [];
 resetPlayer(); if (announce) audioStatus.textContent = 'Воспроизведение остановлено. Можно послушать снова.';
}
async function getAudio() {
 const Audio = window.AudioContext || window.webkitAudioContext;
 if (!Audio) throw new Error('unsupported');
 if (!context) { context = new Audio(); master = context.createGain(); master.gain.value = Number(document.querySelector('#volume').value) / 100; master.connect(context.destination); }
 if (context.state !== 'running') await context.resume();
 if (context.state !== 'running') throw new Error('suspended');
}
function scheduleChord(notes, time, duration) {
 notes.forEach((midi, index) => {
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const onset = time + index * 0.025;
  [1, 2, 3].forEach((harmonic, h) => {
   const oscillator = context.createOscillator(), gain = context.createGain();
   oscillator.type = 'sine'; oscillator.frequency.value = freq * harmonic;
   const level = [0.105, 0.027, 0.012][h] * (index === 3 ? 1.3 : 1);
   gain.gain.setValueAtTime(0, onset); gain.gain.linearRampToValueAtTime(level, onset + 0.014);
   gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * 0.2), onset + duration * 0.82);
   gain.gain.exponentialRampToValueAtTime(0.0001, onset + duration);
   oscillator.connect(gain); gain.connect(master); oscillator.start(onset); oscillator.stop(onset + duration + 0.02);
   oscillator.releaseGain = gain; voices.push(oscillator); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices = voices.filter(item => item !== oscillator); };
  });
 });
}
async function play(indices) {
 stopAudio(false); const token = generation;
 try {
  await getAudio(); if (token !== generation) return;
  playing = true; stopButton.disabled = false;
  if (indices.length > 1) { sequenceButton.setAttribute('aria-pressed', 'true'); sequenceButton.innerHTML = '<span aria-hidden="true">■</span> Остановить'; }
  let offset = 0;
  indices.forEach((index, step) => {
   const duration = indices.length > 1 && step === indices.length - 1 ? 3.4 : 2.3;
   scheduleChord(voicings[index], context.currentTime + 0.06 + offset, duration);
   timers.push(setTimeout(() => { markChord(index); audioStatus.textContent = names[index]; document.querySelector('#voicing-notes').textContent = ['ре · ля · до · фа', 'ре · соль · си · фа', 'до · соль · си · ми'][index]; }, (offset + 0.06) * 1000));
   offset += duration;
  });
  timers.push(setTimeout(() => { resetPlayer(); audioStatus.textContent = indices.length > 1 ? 'Слышишь разрешение фа → ми? Теперь попробуй спеть эти ноты.' : 'Аккорд прозвучал. Спой верхнюю ноту или послушай всю связку.'; }, (offset + 0.2) * 1000));
 } catch { stopAudio(false); audioStatus.textContent = 'Браузер не включил звук. Попробуй ещё раз или сыграй аккорды по аппликатурам ниже.'; }
}
chordButtons.forEach((button, index) => button.addEventListener('click', () => play([index])));
sequenceButton.addEventListener('click', () => playing ? stopAudio() : play([0, 1, 2]));
stopButton.addEventListener('click', () => stopAudio());
document.querySelector('#volume').addEventListener('input', event => { if (master) master.gain.setTargetAtTime(Number(event.target.value) / 100, context.currentTime, 0.02); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
window.addEventListener('pagehide', () => stopAudio(false));

function messageFor(id) {
 const name = courses[id]?.title;
 return `Никита, привет! ${name ? 'Интересует курс «' + name + '».' : 'Хочу обсудить индивидуальные занятия гитарой.'}\nСейчас я играю…\nХочу научиться…\nПодскажи, с чего лучше начать?`;
}
function updateContactMessage(id) {
 const field = document.querySelector('#contact-message');
 setContactIntent(courses[id] ? 'course' : 'lesson');
 if (!field.dataset.edited) { field.value = courses[id] ? messageFor(id) : intentMessages.lesson; contactDrafts.set(contactTopic.value, field.value); document.querySelector('#contact-message-status').textContent = ''; }
}
document.querySelector('#contact-message').addEventListener('input', event => { event.target.dataset.edited = 'true'; document.querySelector('#contact-message-status').textContent = ''; });
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
 const field = document.getElementById(button.dataset.copy), status = document.getElementById(button.dataset.copy + '-status');
 try {
  if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
  await navigator.clipboard.writeText(field.value);
  status.textContent = 'Скопировано. Вставь текст в сообщении мне во ВКонтакте.';
 } catch {
  field.focus(); field.select();
  status.textContent = 'Текст выделен. Скопируй его вручную и отправь мне во ВКонтакте.';
 }
}));

document.querySelector('#dialog-message').addEventListener('input', event => { messageDrafts.set(activeCourse, event.target.value); document.querySelector('#dialog-message-status').textContent = ''; });

// Drafts stay only in this page's memory. Navigation never sends a message.
const contactTopic = document.querySelector('#contact-topic');
const contactField = document.querySelector('#contact-message');
const contactDrafts = new Map();
const contactEdited = new Set();
const intentMessages = {
 lesson: 'Никита, привет! Хочу записаться на индивидуальное онлайн-занятие.\nМой уровень…\nХочу научиться…\nМой часовой пояс и удобное время…\nПодскажи, пожалуйста, стоимость и ближайшие свободные часы.',
 concert: 'Никита, привет! Хотим пригласить тебя выступить.\nДата и город…\nПлощадка и событие…\nЖелаемый формат и продолжительность…\nРасскажи, пожалуйста, о возможной программе и условиях.',
 collaboration: 'Никита, привет! Хочу предложить совместный музыкальный проект.\nМеня зовут…\nМоя идея…\nСроки и формат…\nГде можно послушать мои работы…',
 course: 'Никита, привет! Интересуют твои курсы гитары.\nСейчас я играю…\nХочу научиться…\nПодскажи, какое направление мне подойдёт и как узнать о старте.'
};
let contactIntent = contactTopic.value;
function setContactIntent(intent) {
 if (!Object.hasOwn(intentMessages, intent)) return;
 contactDrafts.set(contactIntent, contactField.value);
 if (contactField.dataset.edited) contactEdited.add(contactIntent);
 contactIntent = intent;
 contactTopic.value = intent;
 contactField.value = contactDrafts.get(intent) ?? intentMessages[intent];
 if (contactEdited.has(intent)) contactField.dataset.edited = 'true';
 else delete contactField.dataset.edited;
 document.querySelector('#contact-message-status').textContent = '';
}
contactTopic.addEventListener('change', () => { setContactIntent(contactTopic.value); softFeedback(contactField); });
document.querySelectorAll('[data-contact-intent]').forEach(link => link.addEventListener('click', () => {
 setContactIntent(link.dataset.contactIntent);
 contactTopic.focus({ preventScroll: true });
}));

// Native details stay usable without JavaScript. Only their small content regions animate height.
const collapses = new Map();
function finishCollapse(details, state) {
 if (collapses.get(details) !== state) return;
 collapses.delete(details); state.animation?.cancel();
 details.open = state.expand; state.body.inert = !state.expand;
 details.style.removeProperty('overflow'); details.style.removeProperty('will-change');
 details.removeAttribute('data-expanding');
}
document.querySelectorAll('details').forEach(details => {
 const summary = details.querySelector(':scope > summary');
 const body = details.querySelector(':scope > .details-body');
 if (!summary || !body) return;
 body.inert = !details.open;
 summary.addEventListener('click', event => {
  event.preventDefault();
  const previous = collapses.get(details);
  const expand = !(previous ? previous.expand : details.open);
  const start = details.getBoundingClientRect().height;
  const style = getComputedStyle(details);
  const extras = parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth)+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
  if (previous) { collapses.delete(details); previous.animation?.cancel(); }
  if (!expand && body.contains(document.activeElement)) summary.focus({preventScroll:true});
  body.inert = !expand;
  if (motionPreference.matches || keyboardAction || !details.animate) {
   details.open = expand; details.style.removeProperty('overflow'); details.removeAttribute('data-expanding'); return;
  }
  details.open = true;
  details.dataset.expanding = String(expand);
  const end = summary.offsetHeight + extras + (expand ? body.offsetHeight : 0);
  details.style.overflow = 'hidden';
  const animation = details.animate([{height:start+'px'}, {height:end+'px'}], {duration:200,easing:easeOut,fill:'both'});
  const state = { animation, expand, body }; collapses.set(details,state);
  animation.onfinish = () => finishCollapse(details,state);
 });
 details.addEventListener('toggle', () => { if (!collapses.has(details)) body.inert = !details.open; });
});
// One-shot marketing entrances. Content is visible by default; no scroll handler or RAF loop.
const entranceMotions = new Map();
function enter(element, delay = 0, hero = false) {
 if (motionPreference.matches || keyboardAction || !element.animate || element.contains(document.activeElement)) return;
 element.style.willChange = 'transform, opacity';
 const animation = element.animate([{opacity:0,transform:hero?'translateY(28px)':'translateY(22px)'},{opacity:1,transform:'none'}],{duration:hero?640:600,delay,easing:easeOut,fill:'backwards'});
 entranceMotions.set(element,animation);
 const clean = () => { if(entranceMotions.get(element)!==animation)return; entranceMotions.delete(element);element.style.removeProperty('will-change'); };
 animation.onfinish=clean;animation.oncancel=clean;
}
if (!location.hash && !motionPreference.matches) {
 document.querySelectorAll('.hero-copy > .intro, .hero h1, .hero-description, .hero-actions').forEach((el,i)=>enter(el,i*60,true));
 enter(document.querySelector('.hero-photo'),80,true);
}
if ('IntersectionObserver' in window) {
 const revealObserver = new IntersectionObserver(entries => {
  entries.filter(entry=>entry.isIntersecting).forEach((entry,i)=>{revealObserver.unobserve(entry.target);enter(entry.target,Math.min(i,2)*60);});
 },{threshold:.12,rootMargin:'0px 0px -24px 0px'});
 document.querySelectorAll('.section-heading > div, .course, .mentor-image, .lessons-photo, .music-feature, .concert-heading, .news-item').forEach(el=>revealObserver.observe(el));
}
document.addEventListener('focusin', event => {
 for(const [el,animation] of entranceMotions) if(el.contains(event.target)) animation.cancel();
});
motionPreference.addEventListener('change', () => {
 if(!motionPreference.matches)return;
 for(const [panel,state] of [...dialogMotions]) { finishDialogMotion(panel);panel.classList.add('instant-motion');state.then(); }
 for(const [details,state] of [...collapses]) finishCollapse(details,state);
 for(const animation of entranceMotions.values()) animation.cancel();
 for(const animation of feedbackMotions.values()) animation.cancel();
});

function softFeedback(element) {
 if(motionPreference.matches || keyboardAction || !element.animate)return;
 feedbackMotions.get(element)?.cancel();
 const animation=element.animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:180,easing:easeOut});
 feedbackMotions.set(element,animation);
 const clean=()=>{if(feedbackMotions.get(element)===animation)feedbackMotions.delete(element);};
 animation.onfinish=clean;animation.oncancel=clean;
}
