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
  } catch (err) {
    console.error('Failed to parse storage', err);
    showMessage('Error reading data', 'error');
    return [];
  }
}

function create(fillUp) {
  try {
    const data = getAll();
    const item = { id: Date.now(), ...fillUp };
    data.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return item;
  } catch (err) {
    console.error('Create failed', err);
    showMessage('Error saving entry', 'error');
    return null;
  }
}

function read(id) {
  return getAll().find(i => i.id === id) || null;
}

function update(id, updates) {
  try {
    const data = getAll();
    const idx = data.findIndex(i => i.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data[idx];
  } catch (err) {
    console.error('Update failed', err);
    showMessage('Error updating entry', 'error');
    return null;
  }
}

function deleteFill(id) {
  try {
    const data = getAll();
    const newData = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  } catch (err) {
    console.error('Delete failed', err);
    showMessage('Error deleting entry', 'error');
    return [];
  }
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
  try {
    const fuel = totalFuel();
    const dist = totalDistance();
    const eco = averageFuelEconomy();
    container.innerHTML = `
      <div class="card"><strong>Total Fuel</strong><p>${fuel.toFixed(2)} L</p></div>
      <div class="card"><strong>Total Distance</strong><p>${dist.toFixed(0)} km</p></div>
      <div class="card"><strong>Avg. Economy</strong><p>${eco.toFixed(2)} km/L</p></div>
    `;
  } catch (err) {
    console.error('Render summary error', err);
    showMessage('Failed to render summary', 'error');
  }
}

function renderHistory() {
  const tbody = document.querySelector('#history-table tbody');
  if (!tbody) return;
  try {
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
          <button class="edit" aria-label="Edit entry">Edit</button>
          <button class="delete" aria-label="Delete entry">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachRowEvents();
  } catch (err) {
    console.error('Render history error', err);
    showMessage('Failed to render history', 'error');
  }
}

function attachRowEvents() {
  document.querySelectorAll('#history-table .edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(e.target.closest('tr').dataset.id, 10);
      openLogModal(id);
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
  // rows are rebuilt on every render, so handlers must be re-attached too
  enableSwipeDelete();
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

/* Log modal (create / edit) + form handling */
const form = document.getElementById('fuel-form');
const logModal = document.getElementById('log-modal');
const modalTitle = document.getElementById('log-modal-title');
let lastFocusedEl = null;

function fillForm(data) {
  document.getElementById('fuel-date').value = data.date.split('T')[0];
  document.getElementById('fuel-odometer').value = data.odometer;
  document.getElementById('fuel-amount').value = data.amount;
  document.getElementById('fuel-price').value = data.price;
  document.getElementById('fuel-station').value = data.station;
  document.getElementById('fuel-location').value = data.location || '';
  const savedType = data.type;
  document.getElementById('fuel-fill-type').value = ['full', 'partial'].includes(savedType) ? savedType : 'full';
}

function openLogModal(editId) {
  lastFocusedEl = document.activeElement;
  form.reset();
  delete form.dataset.editId;
  if (editId) {
    const data = read(editId);
    if (!data) return;
    form.dataset.editId = editId;
    fillForm(data);
    modalTitle.textContent = 'Edit Entry';
  } else {
    modalTitle.textContent = 'Log Fill-up';
  }
  logModal.hidden = false;
  document.getElementById('fuel-date').focus();
}

function closeLogModal() {
  logModal.hidden = true;
  form.reset();
  delete form.dataset.editId;
  if (lastFocusedEl && document.contains(lastFocusedEl)) {
    lastFocusedEl.focus();
  }
}

document.getElementById('log-btn').addEventListener('click', () => openLogModal());
logModal.addEventListener('click', e => {
  if (e.target === logModal) closeLogModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !logModal.hidden) closeLogModal();
});

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
    showMessage('Entry updated');
  } else {
    create(payload);
    showMessage('Entry saved');
  }
  closeLogModal();
  renderHistory();
  renderSummary();
});
document.getElementById('cancel-btn').addEventListener('click', closeLogModal);
/**
 * Utility for showing transient feedback in #message.
 * type: 'success' or 'error'.
 */
const messageEl = document.getElementById('message');
function showMessage(text, type = 'success') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = type;
  setTimeout(() => {
    if (messageEl) messageEl.textContent = '';
  }, 3000);
}

// Initial render (renderHistory re-attaches row handlers)
renderHistory();
renderSummary();

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
  showMessage('Data exported');
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
      showMessage('Data imported');
    } catch (err) {
      showMessage('Failed to import JSON', 'error');
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
    showMessage('All data cleared');
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
