import { exposureDelta } from '../camera/exposure.js';
import { $, cloneTemplate } from './dom.js';
import { createPhoneSettings } from './phone-settings.js';

/** Keep each existing widget's position so resizing restores the original wide screen. */
function placement(element, destination) {
  const marker = cloneTemplate('placement-marker-template');
  return {
    compact() {
      element.before(marker);
      destination.append(element);
    },
    wide() {
      if (marker.parentNode) marker.replaceWith(element);
    },
  };
}

function createPlacements() {
  const targets = [
    [$('welcome-open'), $('phone-help')],
    [$('viewfinder'), $('phone-preview')],
    [document.querySelector('.meter'), $('phone-meter')],
    [$('exposure-result'), $('phone-meter')],
    [document.querySelector('.exposure-mode'), $('phone-mode')],
    [$('editor-aperture'), $('phone-editors')],
    [$('editor-shutter'), $('phone-editors')],
    [$('editor-iso'), $('phone-editors')],
    [$('focus-control'), $('phone-editors')],
    [$('editor-focal'), $('phone-lens-editor')],
    [$('rotation-preference'), $('phone-lens-editor')],
    [$('exposure-panel'), $('phone-exposure-content')],
    [$('shutter'), $('phone-shutter')],
    [$('scene-grid'), $('phone-scene-grid')],
    [$('scene-description'), $('phone-scene-description')],
  ];
  return targets.map(([element, destination]) => placement(element, destination));
}

function bindScenePicker() {
  const dialog = $('phone-scene-picker');
  const button = $('phone-scene');
  button.addEventListener('click', () => {
    dialog.showModal();
    button.setAttribute('aria-expanded', 'true');
    dialog.querySelector('.tile[aria-pressed="true"]')?.focus();
  });
  $('phone-scenes-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => button.setAttribute('aria-expanded', 'false'));
  $('phone-scene-grid').addEventListener('click', (event) => {
    if (event.target.closest('.tile')) dialog.close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;
    if (outside) dialog.close();
  });
}

/** Reuse the same camera controls in a compact shooting screen below the wide breakpoint. */
export function createPhoneScreen({ store, onLayoutChange }) {
  const app = document.querySelector('.app');
  const root = cloneTemplate('phone-screen-template');
  app.before(root);
  const placements = createPlacements();
  const settings = createPhoneSettings(store);
  const compact = matchMedia('(max-width: 860px)');
  const description = $('exposure-description');
  let wideDescriptionOpen = description.open;

  function updateLayout() {
    onLayoutChange();
    if (!compact.matches && $('phone-scene-picker').open) $('phone-scene-picker').close();
    if (compact.matches) wideDescriptionOpen = description.open;
    for (const entry of placements) {
      if (compact.matches) entry.compact();
      else entry.wide();
    }
    description.open = compact.matches || wideDescriptionOpen;
    root.hidden = !compact.matches;
    app.hidden = compact.matches;
    document.documentElement.classList.toggle('compact-camera', compact.matches);
    // Re-render readouts and focus instructions after their layout changes.
    store.update({});
  }

  bindScenePicker();
  compact.addEventListener('change', updateLayout);
  updateLayout();

  return {
    render(state, scene) {
      $('phone-scene-name').textContent = scene.name;
      root.dataset.limit = String(state.mode !== 'M' && exposureDelta(scene.ev, state) !== 0);
      settings.render(state, scene);
    },
    renderFocus: settings.renderFocus,
  };
}
