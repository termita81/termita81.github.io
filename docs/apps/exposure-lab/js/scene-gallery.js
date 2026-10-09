import { $ } from './dom.js';
import { scenes } from './scenes.js';
import { state } from './state.js';
import { num } from './format.js';
import { renderer, expose } from './renderer.js';
import { referenceView } from './exposure.js';

export function setupSceneGallery({ refresh }) {
  const browser = $('scene-browser');
  const expand = $('scenes-expand');
  const setExpanded = expanded => {
    browser.classList.toggle('expanded', expanded);
    expand.setAttribute('aria-expanded', String(expanded));
    expand.textContent = expanded ? 'Collapse scenes' : 'Expand scenes';
  };
  expand.addEventListener('click', () => setExpanded(expand.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expand.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      expand.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!browser.contains(event.target) && !expand.contains(event.target)) setExpanded(false);
  });
  for (const sc of scenes) {
    const tile = $('scene-template').content.firstElementChild.cloneNode(true);
    tile.querySelector('.tile-name').textContent = sc.name;
    tile.querySelector('.tile-ev').textContent = `EV ${num(sc.ev)}`;
    tile.addEventListener('click', () => {
      state.selected = sc.id;
      refresh();
      setExpanded(false);
      // Keep the chosen scene visible in the compact strip without scrolling the page.
      const grid = $('sceneGrid');
      if (getComputedStyle(grid).display === 'flex') {
        const offset = tile.offsetLeft - grid.offsetLeft;
        if (offset < grid.scrollLeft) grid.scrollLeft = offset;
        else if (offset + tile.offsetWidth > grid.scrollLeft + grid.clientWidth) {
          grid.scrollLeft = offset + tile.offsetWidth - grid.clientWidth;
        }
      }
    });
    sc.tile = tile;
    sc.ctx = tile.querySelector('canvas').getContext('2d');
    $('sceneGrid').append(tile);
    const view = referenceView(sc.thumbnailExposure?.time ?? 0);
    if (sc.thumbnailExposure) {
      // Integrate subject movement without changing brightness or adding lens blur.
      view.shutter = sc.thumbnailExposure.shutter;
      view.samples = 48;
    }
    const rotation = sc.thumbnailExposure;
    const originalRotation = sc.viewRotation ? { ...sc.viewRotation } : null;
    try {
      if (rotation && sc.rotateBy) sc.rotateBy(rotation.yaw ?? 0, rotation.pitch ?? 0);
      expose(sc, view);
      sc.ctx.drawImage(renderer.domElement, 0, 0);
    } finally {
      // Thumbnail framing must not change the user's live camera direction.
      if (originalRotation) {
        sc.resetView();
        sc.rotateBy(originalRotation.yaw, originalRotation.pitch);
      }
    }
  }
}
