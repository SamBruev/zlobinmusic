'use strict';
const courses = {
 harmony: { title: 'Первые ii–V–I', intro: 'От знакомых аккордов к пониманию джазовой гармонии. Направление для тех, кто уже играет базовые аккорды и хочет услышать, что их связывает.', modules: ['Услышать устойчивость и напряжение. Спеть короткую фразу и найти её на гитаре.', 'Разобраться в септаккордах Dm7, G7 и Cmaj7. Найти удобные положения на грифе.', 'Соединить аккорды с небольшим движением голосов. Сохранить ровный пульс.', 'Построить короткую фразу на звуках аккордов. Оставить место паузе и ответу.'] },
 jazz: { title: 'Джаз как язык', intro: 'Основной путь для гитаристов, которым хочется выйти за рамки выученных ходов и выражать свою музыкальную мысль.', modules: ['Слух и ритм с самого начала: услышать, спеть и сыграть короткую идею.', 'Гармония на практике: звуки аккорда, устойчивость, напряжение и разрешение.', 'Фразировка: мотив, пауза, развитие и ответ. Придать фразе характер.', 'Разобрать музыкальный пример на слух и перенести найденный приём в свою игру.', 'Аккомпанемент и импровизация: слушать общий пульс и оставлять пространство другим.', 'Собрать собственное небольшое соло и осмысленно разобрать запись своей игры.'] },
 bossa: { title: 'Ритм босса-новы', intro: 'Отдельное направление для тех, кто хочет расширить свой аккомпанемент и разобраться в ритмическом языке босса-новы.', modules: ['Почувствовать пульс и услышать роль баса. Разделить партии баса и аккордов.', 'Собрать базовый рисунок правой руки в медленном темпе.', 'Понять синкопы и удержать рисунок при смене гармонии.', 'Соединить аккомпанемент и мелодию в небольшом музыкальном фрагменте.'] }
};
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
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
 stopAudio(false); dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('modal-open');
}
document.querySelectorAll('[data-course]').forEach(button => button.addEventListener('click', () => openCourse(button.dataset.course, button)));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.dialog-return').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); dialogTrigger?.focus(); });
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
contactTopic.addEventListener('change', () => setContactIntent(contactTopic.value));
document.querySelectorAll('[data-contact-intent]').forEach(link => link.addEventListener('click', () => {
 setContactIntent(link.dataset.contactIntent);
 contactTopic.focus({ preventScroll: true });
}));
