/**
 * Fuel Tracker Core State
 * Stored in localStorage under "fuelTracker"
 */

const STORAGE_KEY = 'fuelTracker';

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}
initStorage();

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function create(fillUp) {
  const data = getAll();
  const item = { id: Date.now(), ...fillUp };
  data.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return item;
}

function read(id) {
  return getAll().find(i => i.id === id) || null;
}

function update(id, updates) {
  const data = getAll();
  const idx = data.findIndex(i => i.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data[idx];
}

function deleteFill(id) {
  const data = getAll();
  const newData = data.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
}

function totalFuel() {
  return getAll().reduce((s, f) => s + (f.amount || 0), 0);
}

function totalDistance() {
  const sorted = [...getAll()].sort((a, b) => a.date - b.date);
  if (sorted.length < 2) return 0;
  let dist = 0;
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i].odometer - sorted[i-1].odometer;
    if (d > 0) dist += d;
  }
  return dist;
}

function averageFuelEconomy() {
  const d = totalDistance();
  const f = totalFuel();
  return d && f ? d / f : 0;
}

(function () {
  const tabs = document.querySelectorAll('#tab-nav .tab');
  const sections = document.querySelectorAll('.section');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sections.forEach(s => {
        if (s.id === `${target}-section`) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });
})();

window.fuelTracker = {
  initStorage,
  getAll,
  create,
  read,
  update,
  deleteFill,
  totalFuel,
  totalDistance,
  averageFuelEconomy
};
