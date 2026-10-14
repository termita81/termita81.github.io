import { formatEv } from '../camera/format.js';
import { $, cloneTemplate } from './dom.js';

function createTile(scene) {
  const tile = cloneTemplate('scene-template');
  tile.querySelector('.tile-name').textContent = scene.name;
  tile.querySelector('.tile-ev').textContent = formatEv(scene.ev);
  tile.querySelector('img').src = `./images/${scene.thumbnail}`;
  return tile;
}

/** Keep the chosen scene visible in the compact strip without scrolling the page. */
function scrollTileIntoView(grid, tile) {
  if (getComputedStyle(grid).display !== 'flex') return;
  const start = tile.offsetLeft - grid.offsetLeft;
  const end = start + tile.offsetWidth;
  if (start < grid.scrollLeft) grid.scrollLeft = start;
  else if (end > grid.scrollLeft + grid.clientWidth) grid.scrollLeft = end - grid.clientWidth;
}

/** The "Expand scenes" button, which opens the compact strip into a full grid. */
function createExpander(browser, button) {
  const isExpanded = () => button.getAttribute('aria-expanded') === 'true';

  function setExpanded(expanded) {
    browser.classList.toggle('expanded', expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Collapse scenes' : 'Expand scenes';
  }

  button.addEventListener('click', () => setExpanded(!isExpanded()));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isExpanded()) return;
    setExpanded(false);
    button.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!browser.contains(event.target) && !button.contains(event.target)) setExpanded(false);
  });

  return { collapse: () => setExpanded(false) };
}

/** The scene thumbnails and the heading that describes the selected scene. */
export function createSceneGallery({ scenes, onSelect }) {
  const grid = $('scene-grid');
  const expander = createExpander($('scene-browser'), $('scenes-expand'));
  const tiles = new Map();

  for (const scene of scenes) {
    const tile = createTile(scene);
    tile.addEventListener('click', () => {
      onSelect(scene.id);
      expander.collapse();
      scrollTileIntoView(grid, tile);
    });
    tiles.set(scene.id, tile);
    grid.append(tile);
  }

  return {
    render(state, scene) {
      for (const [id, tile] of tiles) tile.setAttribute('aria-pressed', String(id === scene.id));
      $('scene-name').textContent = scene.name;
      $('scene-description').textContent = scene.note;
    },
  };
}
