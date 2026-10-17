'use strict';
const recommendations = {
 harmony: ['Тебе может подойти курс «Первые ii–V–I»', 'Связь аккордов, движение голосов и короткая музыкальная фраза.'],
 jazz: ['Присмотрись к курсу «Джаз как язык»', 'Подбор мелодий на слух и построение соло на звуках аккордов.'],
 bossa: ['Присмотрись к курсу «Ритм босса-новы»', 'Бас, синкопы и независимость пальцев в аккомпанементе.'],
 personal: ['Давай обсудим твою задачу', 'Напиши мне, с чего хочешь начать. Обсудим индивидуальные онлайн-занятия.']
};
const recommendationAction = document.querySelector('#recommendation-action');

function updateRecommendation() {
 const goal = document.querySelector('[name="goal"]:checked').value;
 const level = document.querySelector('[name="level"]:checked').value;
 const id = level === 'new' ? 'personal' : goal;
 const [title, text] = recommendations[id];
 document.querySelector('#recommendation-title').textContent = title;
 document.querySelector('#recommendation-text').textContent = text;
 recommendationAction.href = id === 'personal' ? '#lessons' : `course-${id}.html`;
 recommendationAction.textContent = id === 'personal' ? 'Об онлайн-занятиях' : 'Посмотреть программу';
 softFeedback(document.querySelector('.recommendation'));
}
document.querySelectorAll('[name="goal"], [name="level"]').forEach(input => input.addEventListener('change', updateRecommendation));
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


document.querySelector('#contact-message').addEventListener('input', event => { event.target.dataset.edited = 'true'; document.querySelector('#contact-message-status').textContent = ''; });
