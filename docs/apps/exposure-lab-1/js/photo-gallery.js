import { $, cloneTemplate } from './dom.js';
import { verdict, signed } from './format.js';
export function createPhotoGallery({ showShot, syncComparison }) {
  const shots = [];
  const rollList = $('rollList');
  const readyShots = () => shots.filter(s => s.url);
  function addToRoll(shot) {
    const li = cloneTemplate('photo-template');
    li.dataset.shot = shot.id;
    const btn = li.querySelector('button');
    const img = li.querySelector('img');
    img.src = shot.url;
    img.alt = `${shot.scene}, ${verdict(shot.delta).toLowerCase()}`;
    const badge = li.querySelector('.shot-badge');
    badge.hidden = shot.delta === 0;
    badge.textContent = `${signed(shot.delta)} EV`;
    li.querySelector('b').textContent = `f/${shot.aperture} · ${shot.shutter} s`;
    li.querySelector('[data-field="settings"]').textContent = `ISO ${shot.iso} · ${shot.focal} mm`;
    btn.addEventListener('click', () => showShot(shot.id));

    const older = [...rollList.children].find((el) => Number(el.dataset.shot) < shot.id);
    rollList.insertBefore(li, older || null);
    syncRoll();
    rollList.scrollLeft = 0;
  }

  function removeShot(id) {
    const i = shots.findIndex((s) => s.id === id);
    if (i < 0) return;
    URL.revokeObjectURL(shots[i].url);
    shots.splice(i, 1);
    const el = rollList.querySelector(`[data-shot="${id}"]`);
    if (el) el.remove();
    syncRoll();
  }

  function syncRoll() {
    const n = readyShots().length;
    $('rollCount').textContent = n ? `(${n})` : '';
    rollList.hidden = n === 0;
    $('rollEmpty').hidden = n > 0;
    $('rollClear').hidden = n === 0;
    $('rollClear').disabled = n < 1;
    if ($('lightbox').open) syncComparison();
  }
  $('rollClear').addEventListener('click', () => {
    const list = readyShots();
    if (!confirm(list.length === 1 ? 'Delete this photo?' : `Delete all ${list.length} photos?`)) return;
    for (const s of list) removeShot(s.id);
    $('shutter').focus();
  });

  return { shots, readyShots, addToRoll, removeShot, syncRoll };
}
