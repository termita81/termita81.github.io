import { $ } from './dom.js';
import { verdict, formatFocus, num } from './format.js';
export function createLightbox({ readyShots, removeShot }) {
  const lightbox = $('lightbox'), lbImg = $('lbImg');
  let currentShot = null, comparing = false, comparisonShot = null;
  function comparisonCaption(shot) {
    return `#${shot.id} · ${shot.scene} · ${verdict(shot.delta)}
  ${shot.mode} · ISO ${shot.iso} · f/${shot.aperture} · ${shot.shutter} s · ${shot.focal} mm · ${shot.focusMode.toUpperCase()} ${formatFocus(shot.focusDistance)}`;
  }

  function syncComparisonRoll(list) {
    const strip = $('lb-comparison-list');
    const signature = list.map((shot) => shot.id).join(',');
    if (strip.dataset.photos !== signature) {
      strip.replaceChildren();
      for (const shot of list) {
        const item = $('comparison-shot-template').content.firstElementChild.cloneNode(true);
        const button = item.querySelector('button');
        item.dataset.shot = shot.id;
        item.querySelector('img').src = shot.url;
        item.querySelector('img').alt = `${shot.scene}, ${verdict(shot.delta).toLowerCase()}`;
        item.querySelector('b').textContent = `#${shot.id} · ${shot.scene}`;
        item.querySelector('.shot-cap > span').textContent = `ISO ${shot.iso} · f/${shot.aperture} · ${shot.shutter} s`;
        button.addEventListener('click', () => {
          if (shot.id === currentShot) return;
          if (!comparing) {
            showShot(shot.id);
            return;
          }
          comparisonShot = shot.id;
          syncComparison();
        });
        strip.append(item);
      }
      strip.dataset.photos = signature;
    }
    for (const item of strip.children) {
      const id = Number(item.dataset.shot);
      const main = id === currentShot;
      const selected = comparing ? id === comparisonShot : main;
      const button = item.querySelector('button');
      button.disabled = main;
      button.setAttribute('aria-pressed', String(selected));
      item.querySelector('.comparison-role').textContent = main ? (comparing ? 'Main' : 'Selected') : selected ? 'Comparison' : '';
    }
    $('lb-comparison-roll').hidden = list.length === 0;
    $('lb-comparison-roll').setAttribute('aria-label', comparing ? 'Photos for comparison' : 'Taken photos');
    $('lb-comparison-roll').querySelector('p').textContent = comparing ? 'Choose a photo to compare with the main image.' : 'Choose a photo to view.';
    lightbox.classList.toggle('comparing', comparing);
  }

  function syncComparison() {
    const list = readyShots();
    const primary = list.find((shot) => shot.id === currentShot);
    const others = list.filter((shot) => shot.id !== currentShot);
    const select = $('lb-comparison-select');
    select.replaceChildren();
    for (const shot of others) {
      const option = $('comparison-option-template').content.firstElementChild.cloneNode(true);
      option.value = shot.id;
      option.textContent = `#${shot.id} · ${shot.scene} · ISO ${shot.iso} · f/${shot.aperture} · ${shot.shutter} s · ${shot.focal} mm`;
      select.append(option);
    }
    const secondary = others.find((shot) => shot.id === comparisonShot) ?? others[0];
    comparisonShot = secondary?.id ?? null;
    if (secondary) select.value = secondary.id;
    if (!secondary) comparing = false;
    $('lb-compare').disabled = !secondary;
    $('lb-compare').setAttribute('aria-pressed', String(comparing));
    $('lb-compare').textContent = comparing ? 'Exit comparison' : 'Compare photos';
    $('lb-comparison-picker').hidden = !comparing;
    $('lb-comparison-photo').hidden = !comparing;
    $('lb-primary-caption').hidden = !comparing;
    $('lb-stage').classList.toggle('comparing', comparing);
    syncComparisonRoll(list);
    if (comparing && primary && secondary) {
      $('lb-primary-caption').textContent = comparisonCaption(primary);
      $('lb-comparison-image').src = secondary.url;
      $('lb-comparison-image').alt = `${secondary.scene}, ${verdict(secondary.delta).toLowerCase()}`;
      $('lb-comparison-caption').textContent = comparisonCaption(secondary);
    } else {
      $('lb-comparison-image').removeAttribute('src');
    }
  }

  function showShot(id) {
    const list = readyShots();
    const i = list.findIndex((s) => s.id === id);
    if (i < 0) { if (lightbox.open) lightbox.close(); return; }
    const s = list[i];
    currentShot = id;
    $('lbPrev').disabled = list.length < 2;
    $('lbNext').disabled = list.length < 2;

    lbImg.src = s.url;
    lbImg.alt = `${s.scene}, ${verdict(s.delta).toLowerCase()}`;
    $('lbCount').textContent = `Photo ${i + 1} of ${list.length}`;
    $('lbTitle').textContent = s.scene;
    $('lbResult').textContent = verdict(s.delta);
    $('lbResult').dataset.state = s.delta === 0 ? 'ok' : 'off';

    const n = Math.abs(s.delta);
    $('lbWhy').textContent = s.delta === 0
      ? `The settings expose for EV ${num(s.ev)}, which matches the scene.`
      : `The settings expose for EV ${num(s.ev)}, ${n} ${s.delta < 0 ? 'above' : 'below'} the scene’s EV ${num(s.sceneEV)}, ` +
        `so the photo is ${n} stop${n === 1 ? '' : 's'} too ${s.delta < 0 ? 'dark' : 'bright'}.`;

    const rows = [
      ['Scene brightness', `EV ${num(s.sceneEV)}`],
      ['Mode', s.mode],
      ['ISO', `ISO ${s.iso}`],
      ['Aperture', `f/${s.aperture}`],
      ['Shutter speed', `${s.shutter} s`],
      ['Focal length', `${s.focal} mm`],
      ['Focus', s.focusMode === 'mf' ? `MF · ${formatFocus(s.focusDistance)}` : `AF · ${formatFocus(s.focusDistance)}`],
      ['Settings EV', `${s.av} + ${s.tv} − ${s.sv} = ${num(s.ev)}`],
    ];
    const meta = $('lbMeta');
    meta.replaceChildren();
    for (const [term, value] of rows) {
      const row = $('photo-detail-template').content.cloneNode(true);
      row.querySelector('dt').textContent = term;
      row.querySelector('dd').textContent = value;
      meta.append(row);
    }
    $('lbDownload').href = s.url;
    $('lbDownload').download = `exposure-lab-${s.id}.jpg`;

    syncComparison();
    if (!lightbox.open) lightbox.showModal();
  }

  function stepShot(direction) {
    const list = readyShots();
    const i = list.findIndex((s) => s.id === currentShot);
    if (i < 0 || list.length < 2) return;
    showShot(list[(i + direction + list.length) % list.length].id);
  }
  $('lb-compare').addEventListener('click', () => {
    comparing = !comparing;
    syncComparison();
  });
  $('lb-comparison-select').addEventListener('change', (event) => {
    comparisonShot = Number(event.target.value);
    syncComparison();
  });
  lightbox.addEventListener('close', () => {
    comparing = false;
    comparisonShot = null;
    syncComparison();
  });

  $('lbPrev').addEventListener('click', () => stepShot(-1));
  $('lbNext').addEventListener('click', () => stepShot(1));
  $('lbClose').addEventListener('click', () => lightbox.close());
  $('lbDelete').addEventListener('click', () => {
    if (!confirm('Delete this photo?')) return;
    const i = readyShots().findIndex((s) => s.id === currentShot);
    removeShot(currentShot);
    const rest = readyShots();
    if (rest.length) showShot(rest[Math.min(Math.max(i, 0), rest.length - 1)].id);
    else lightbox.close();
  });
  function toggleComparison() { comparing = !comparing; syncComparison(); }

  return { showShot, stepShot, syncComparison, toggleComparison };
}
