/* Review controls act only on the open snapshot. */
(() => {
  const pause = document.querySelector('[data-pause]');
  const notice = document.querySelector('[data-paused]');
  pause.addEventListener('click', () => {
    notice.hidden = !notice.hidden;
    const label = notice.hidden ? 'Pause' : 'Resume';
    pause.setAttribute('aria-label', label);
    pause.firstElementChild.textContent = notice.hidden ? 'Ⅱ' : '▶';
    pause.lastElementChild.textContent = label;
  });

  const music = document.querySelector('[data-music]');
  if (music) {
    const on = 'M11 5 6 9H2v6h4l5 4V5zm4.5 3.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13';
    const off = 'M11 5 6 9H2v6h4l5 4V5zm11 4-6 6m0-6 6 6';
    music.addEventListener('click', () => {
      const playing = music.getAttribute('aria-pressed') !== 'true';
      music.setAttribute('aria-pressed', String(playing));
      music.querySelector('path').setAttribute('d', playing ? on : off);
    });
  }

  const level = document.querySelector('.world-ride__resistance output');
  const steppers = document.querySelectorAll('[data-step]');
  steppers.forEach(button => button.addEventListener('click', () => {
    const next = Math.max(1, Math.min(32, Number(level.value) + Number(button.dataset.step)));
    level.value = String(next);
    document.querySelector('[data-mode]').textContent = 'Manual';
    steppers.forEach(step => {
      step.disabled = Number(step.dataset.step) < 0 ? next === 1 : next === 32;
    });
  }));
})();

const sceneryForm = document.querySelector('.world-ride__form');
if (sceneryForm) {
  const field = sceneryForm.querySelector('input');
  const submit = sceneryForm.querySelector('button');
  field.addEventListener('input', () => { submit.disabled = !field.value.trim(); });
}
