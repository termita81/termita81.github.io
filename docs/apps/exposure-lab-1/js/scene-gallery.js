import { $ } from './dom.js';
import { scenes } from './scenes.js';
import { state } from './state.js';
import { num } from './format.js';
const thumbnails = {
  gallery: 'focus-gallery.jpg',
  shapes: 'floating-shapes.jpg',
  night: 'city-street-at-night.jpg',
  beach: 'sunny-beach.jpg',
  'sunset-beach': 'golden-hour-beach.jpg',
  gray: 'gray-card.jpg',
};

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
    tile.querySelector('img').src = `./images/${thumbnails[sc.id]}`;
    $('sceneGrid').append(tile);
  }
}
