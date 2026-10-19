'use strict';
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
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
 const field = document.getElementById(button.dataset.copy), status = document.getElementById(button.dataset.copy + '-status');
 try {
  if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
  await navigator.clipboard.writeText(field.value);
  status.textContent = 'Скопировано. Вставь текст в сообщение во ВКонтакте.';
 } catch {
  field.focus(); field.select();
  status.textContent = 'Текст выделен. Скопируй его вручную и отправь мне во ВКонтакте.';
 }
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
 if (!element || motionPreference.matches || keyboardAction || !element.animate || element.contains(document.activeElement)) return;
 element.style.willChange = 'transform, opacity';
 const animation = element.animate([{opacity: hero ? 0.7 : 0.45, transform: 'translateY(20px)'},{opacity:1,transform:'none'}],{duration:hero?640:600,delay,easing:easeOut,fill:'backwards'});
 entranceMotions.set(element,animation);
 const clean = () => { if(entranceMotions.get(element)!==animation)return; entranceMotions.delete(element);element.style.removeProperty('will-change'); };
 animation.onfinish=clean;animation.oncancel=clean;
}
if (!location.hash && !motionPreference.matches) {
 document.querySelectorAll('.opening-copy h1, .opening-role, .opening-description, .opening-actions .button, .opening-listen').forEach((el,i)=>enter(el,i*60,true));
 // Keep the original hero portrait completely still to preserve the instrument crop.
}
if ('IntersectionObserver' in window) {
 const revealObserver = new IntersectionObserver(entries => {
  entries.filter(entry=>entry.isIntersecting).forEach((entry,i)=>{revealObserver.unobserve(entry.target);enter(entry.target,Math.min(i,2)*60);});
 },{threshold:.12,rootMargin:'0px 0px -24px 0px'});
 document.querySelectorAll('.section-heading h2, .section-heading p, .course-feature-copy, .sample-copy h2, .sample-description, .exercise-steps li, .lessons-copy h2, .lessons-copy .large-text, .lessons-photo, .mentor-intro, .mentor-copy, .music-portrait, .recording, .practice-intro h2, .practice-instruction, .concert-heading, .archive-item, .news-item, .faq h2, .faq-intro, .contact h2, .contact-intro, .contact-links, .course-page .course-hero-copy').forEach(el=>revealObserver.observe(el));
}
document.addEventListener('focusin', event => {
 for(const [el,animation] of entranceMotions) if(el.contains(event.target)) animation.cancel();
});
motionPreference.addEventListener('change', () => {
 if(!motionPreference.matches)return;
 for(const [panel,state] of [...dialogMotions]) { finishDialogMotion(panel);panel.classList.add('instant-motion');state.then(); }
 for(const [details,state] of [...collapses]) finishCollapse(details,state);
 for(const [element,animation] of entranceMotions) { animation.cancel(); element.style.removeProperty('will-change'); }
 entranceMotions.clear();
 for(const animation of feedbackMotions.values()) animation.cancel();
 feedbackMotions.clear();
});

function softFeedback(element) {
 if(motionPreference.matches || keyboardAction || !element.animate)return;
 feedbackMotions.get(element)?.cancel();
 const animation=element.animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:180,easing:easeOut});
 feedbackMotions.set(element,animation);
 const clean=()=>{if(feedbackMotions.get(element)===animation)feedbackMotions.delete(element);};
 animation.onfinish=clean;animation.oncancel=clean;
}

