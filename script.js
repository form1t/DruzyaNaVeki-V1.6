/* =========================================================================
   ДРУЗЬЯ НА ВЕКИ — логика сайта
   ========================================================================= */

const gallery = document.getElementById('gallery');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

/* Считает миллисекунды до ближайшего наступления дня рождения (MM-DD).
   Таймер не "хранится" между сессиями — ему это и не нужно: он всегда
   пересчитывается от текущего реального времени, поэтому даже если
   закрыть сайт и открыть его через неделю, обратный отсчёт покажет
   ровно столько, сколько прошло на самом деле. */
function msUntilNextBirthday(mmdd){
  const [month, day] = mmdd.split('-').map(Number);
  const now = new Date();
  let target = new Date(now.getFullYear(), month - 1, day, 0, 0, 0);
  if (target.getTime() <= now.getTime()){
    target = new Date(now.getFullYear() + 1, month - 1, day, 0, 0, 0);
  }
  return target.getTime() - now.getTime();
}

function formatCountdown(ms){
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function countdownHTML(id, mmdd){
  const { days, hours, minutes, seconds } = formatCountdown(msUntilNextBirthday(mmdd));
  return `
    <div class="countdown-label">до дня рождения</div>
    <div class="countdown" data-birthday="${mmdd}" data-target="${id}">
      <div class="seg"><b class="d">${days}</b><small>дн</small></div>
      <div class="seg"><b class="h">${String(hours).padStart(2,'0')}</b><small>ч</small></div>
      <div class="seg"><b class="m">${String(minutes).padStart(2,'0')}</b><small>мин</small></div>
      <div class="seg"><b class="s">${String(seconds).padStart(2,'0')}</b><small>сек</small></div>
    </div>`;
}

function photoBlockHTML(friend){
  if (friend.emojiAvatar){
    return `<div class="window-photo window-photo--emoji"><span class="emoji-avatar">${friend.emojiAvatar}</span><div class="charm-badge" title="${friend.charmLabel || ''}">${friend.charmEmoji || '✨'}</div></div>`;
  }
  return `<div class="window-photo">
      <img src="${friend.photo}" alt="Фото ${friend.name}" loading="lazy">
      <div class="charm-badge" title="${friend.charmLabel || ''}">${friend.charmEmoji || '✨'}</div>
    </div>`;
}

function renderCard(friend){
  const card = document.createElement('article');
  card.className = 'window-card' + (friend.filled ? '' : ' window-card--empty') + (friend.special === 'creator' ? ' window-card--creator' : '');
  card.dataset.id = friend.id;

  if (friend.filled){
    card.innerHTML = `
      <div class="window-frame">
        ${friend.special === 'creator' ? '<div class="creator-badge">🛠 создатель</div>' : ''}
        ${photoBlockHTML(friend)}
        <div class="window-name">${friend.name}</div>
        <div class="window-tag">${friend.city ? friend.city + ' · ' + friend.age + ' лет' : ''}</div>
        ${countdownHTML(friend.id, friend.birthday)}
      </div>`;
    card.addEventListener('click', () => openModal(friend));
  } else {
    card.innerHTML = `
      <div class="window-frame">
        <div class="window-photo window-photo--empty">+</div>
        <div class="window-name">Окошко #${friend.id}</div>
        <div class="empty-hint">Скоро здесь появится профиль</div>
      </div>`;
  }
  return card;
}

function renderGallery(){
  gallery.innerHTML = '';
  FRIENDS.forEach(friend => gallery.appendChild(renderCard(friend)));
}

/* обновляем все таймеры на странице раз в секунду */
function tickAllCountdowns(){
  document.querySelectorAll('.countdown').forEach(el => {
    const { days, hours, minutes, seconds } = formatCountdown(msUntilNextBirthday(el.dataset.birthday));
    el.querySelector('.d').textContent = days;
    el.querySelector('.h').textContent = String(hours).padStart(2,'0');
    el.querySelector('.m').textContent = String(minutes).padStart(2,'0');
    el.querySelector('.s').textContent = String(seconds).padStart(2,'0');
  });
}

/* ------------------------------------------------------------- модалка */
function field(title, content, full){
  if (!content) return '';
  return `<div class="field${full ? ' full' : ''}"><h4>${title}</h4>${content}</div>`;
}
function listField(title, items){
  if (!items || !items.length) return '';
  return `<div class="field"><h4>${title}</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
}

function openModal(friend){
  const photoHTML = friend.emojiAvatar
    ? `<div class="profile-photo profile-photo--emoji"><span>${friend.emojiAvatar}</span></div>`
    : `<img class="profile-photo" src="${friend.photo}" alt="Фото ${friend.name}">`;
  modalContent.innerHTML = `
    ${friend.special === 'creator' ? '<div class="creator-badge creator-badge--modal">🛠 создатель сайта</div>' : ''}
    <div class="profile-head">
      ${photoHTML}
      <div>
        <h2>${friend.name}</h2>
        <div class="meta">${friend.city || ''}${friend.city && friend.age ? ' · ' : ''}${friend.age ? friend.age + ' лет' : ''}${friend.zodiac ? ' · ' + friend.zodiac : ''}</div>
      </div>
    </div>

    <div class="profile-grid">
      ${field('Чем занимаюсь', `<p>${friend.activity || ''}</p>`)}
      ${field('Характер', `<p>${friend.character || ''}</p>`)}
      ${listField('Хобби', friend.hobbies)}
      ${field('Музыка / фильмы / сериалы', `<p>🎵 ${friend.music || '—'}<br>🎬 ${friend.movie || '—'} (${friend.genre || '—'})<br>📺 ${friend.series || '—'}</p>`)}
      ${listField('Три вещи, которые обожаю', friend.loves)}
      ${field('Мечта / цель', `<p>${friend.dream || ''}</p>`, true)}
      ${field('Забавный факт', `<p>${friend.funFact || ''}</p>`, true)}
    </div>

    ${friend.quote ? `<div class="quote-block">«${friend.quote}»</div>` : ''}

    <div class="modal-countdown">
      <div class="countdown-label">до дня рождения ${friend.name}</div>
      ${countdownHTML('modal-' + friend.id, friend.birthday)}
    </div>
  `;
  modalOverlay.classList.add('open');
}

function closeModal(){
  modalOverlay.classList.remove('open');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ------------------------------------------------------------------ init */
renderGallery();
setInterval(tickAllCountdowns, 1000);
