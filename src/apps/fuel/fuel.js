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

/* ------------------------------------------------------------------ */
/* History & Summary rendering helpers                                */
/* ------------------------------------------------------------------ */
function renderSummary() {
  const container = document.getElementById('summary-stats');
  if (!container) return;
  const fuel = totalFuel();
  const dist = totalDistance();
  const eco = averageFuelEconomy();
  container.innerHTML = `
    <div class="card"><strong>Total Fuel</strong><p>${fuel.toFixed(2)} L</p></div>
    <div class="card"><strong>Total Distance</strong><p>${dist.toFixed(0)} km</p></div>
    <div class="card"><strong>Avg. Economy</strong><p>${eco.toFixed(2)} km/L</p></div>
  `;
}

function renderHistory() {
  const tbody = document.querySelector('#history-table tbody');
  if (!tbody) return;
  const rows = getAll()
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  tbody.innerHTML = '';
  rows.forEach(item => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${new Date(item.date).toLocaleDateString()}</td>
      <td>${item.odometer}</td>
      <td>${item.amount}</td>
      <td>${item.price}</td>
      <td>${item.station}</td>
      <td>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachRowEvents();
}

function attachRowEvents() {
  document.querySelectorAll('#history-table .edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(e.target.closest('tr').dataset.id, 10);
      const data = read(id);
      if (!data) return;
      // Populate form for editing
      document.getElementById('fuel-date').value = data.date.split('T')[0];
      document.getElementById('fuel-odometer').value = data.odometer;
      document.getElementById('fuel-amount').value = data.amount;
      document.getElementById('fuel-price').value = data.price;
      document.getElementById('fuel-station').value = data.station;
      document.getElementById('fuel-location').value = data.location || '';
      document.getElementById('fuel-fill-type').value = data.type || 'regular';
      // Switch to Log tab
      document.querySelector('#tab-nav .tab[data-tab="log"]').click();
      // Store edit id on form for later submit
      document.getElementById('fuel-form').dataset.editId = id;
    });
  });
  document.querySelectorAll('#history-table .delete').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(e.target.closest('tr').dataset.id, 10);
      if (!confirm('Delete this entry?')) return;
      deleteFill(id);
      renderHistory();
      renderSummary();
    });
  });
}

/* Swipe delete support (simple left swipe detection) */
function enableSwipeDelete() {
  let startX = 0;
  let currentTr = null;
  document.querySelectorAll('#history-table tbody tr').forEach(tr => {
    tr.addEventListener('pointerdown', e => {
      startX = e.clientX;
      currentTr = tr;
    });
    tr.addEventListener('pointerup', e => {
      if (!currentTr) return;
      const dx = e.clientX - startX;
      if (dx > 30) { // right swipe
        const id = parseInt(currentTr.dataset.id, 10);
        if (confirm('Delete this entry via swipe?')) {
          deleteFill(id);
          renderHistory();
          renderSummary();
        }
      }
      currentTr = null;
    });
  });
}

/* Form handling (save / cancel) */
const form = document.getElementById('fuel-form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const payload = {
    date: form.querySelector('#fuel-date').value,
    odometer: Number(form.querySelector('#fuel-odometer').value),
    amount: Number(form.querySelector('#fuel-amount').value),
    price: Number(form.querySelector('#fuel-price').value),
    station: form.querySelector('#fuel-station').value,
    location: form.querySelector('#fuel-location').value,
    type: form.querySelector('#fuel-fill-type').value
  };
  const editId = form.dataset.editId;
  if (editId) {
    update(Number(editId), payload);
    delete form.dataset.editId;
  } else {
    create(payload);
  }
  form.reset();
  renderHistory();
  renderSummary();
});
document.getElementById('cancel-btn').addEventListener('click', () => {
  form.reset();
  delete form.dataset.editId;
});
// Initial render
renderHistory();
renderSummary();
enableSwipeDelete();

/* Settings actions */
function exportData() {
  const data = JSON.stringify(getAll(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fuelTracker.json';
  a.click();
  URL.revokeObjectURL(url);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      // assume array of items
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      renderHistory();
      renderSummary();
    } catch (err) {
      alert('Failed to parse JSON');
    }
    file.value = '';
  };
  reader.readAsText(file);
}
function clearData() {
  if (confirm('Clear all data?')) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    renderHistory();
    renderSummary();
  }
}
// Attach event listeners
document.getElementById('export-btn').addEventListener('click', exportData);
document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) importData(e.target);
});
document.getElementById('clear-btn').addEventListener('click', clearData);

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
