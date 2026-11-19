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
