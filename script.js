const KEY = 'trackmate_tasks_v1';
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
let editingId = null;

const $ = id => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };
const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = t => !t.done && t.due && t.due < today();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rank = { high: 0, medium: 1, low: 2 };

// Add or save a task
$('form').addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    title: $('title').value.trim(),
    subject: $('subject').value.trim(),
    due: $('due').value,
    priority: $('priority').value,
    notes: $('notes').value.trim()
  };
  if (!data.title) return;

  if (editingId) {
    Object.assign(tasks.find(t => t.id === editingId), data);
    editingId = null;
    $('submitBtn').textContent = 'Add task';
  } else {
    tasks.push({ id: Date.now().toString(36), done: false, created: Date.now(), ...data });
  }

  e.target.reset();
  $('priority').value = 'medium';
  save();
  render();
});

function render() {
  // Subject suggestions + filter
  const subjects = [...new Set(tasks.map(t => t.subject).filter(Boolean))].sort();
  $('subjects').innerHTML = subjects.map(s => `<option value="${esc(s)}">`).join('');
  const cur = $('fSubject').value;
  $('fSubject').innerHTML = '<option value="all">All subjects</option>' +
    subjects.map(s => `<option ${s === cur ? 'selected' : ''}>${esc(s)}</option>`).join('');

  // Stats
  const done = tasks.filter(t => t.done).length;
  $('sTotal').textContent = tasks.length;
  $('sDone').textContent = done;
  $('sPending').textContent = tasks.length - done;
  $('sOver').textContent = tasks.filter(isOverdue).length;
  $('progress').style.width = (tasks.length ? (done / tasks.length) * 100 : 0) + '%';

  // Filters
  const q = $('search').value.toLowerCase();
  const fs = $('fStatus').value;
  const fsub = $('fSubject').value;
  const view = tasks.filter(t =>
    (!q || (t.title + t.subject + t.notes).toLowerCase().includes(q)) &&
    (fsub === 'all' || t.subject === fsub) &&
    (fs === 'all' ||
      (fs === 'done' && t.done) ||
      (fs === 'pending' && !t.done) ||
      (fs === 'overdue' && isOverdue(t))));

  // Sorting
  const s = $('sort').value;
  view.sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done;
    if (s === 'priority') return rank[a.priority] - rank[b.priority];
    if (s === 'created') return b.created - a.created;
    return (a.due || '9999').localeCompare(b.due || '9999');
  });

  // Task list
  $('list').innerHTML = view.length ? view.map(t => `
    <div class="card task ${t.priority} ${t.done ? 'done' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggle('${t.id}')">
      <div class="body">
        <div class="title">${esc(t.title)}</div>
        <div class="meta">
          ${t.subject ? `<span class="tag">${esc(t.subject)}</span>` : ''}
          <span class="tag">${t.priority}</span>
          ${t.due ? `<span class="${isOverdue(t) ? 'overdue' : ''}">📅 ${t.due}${isOverdue(t) ? ' (overdue)' : ''}</span>` : ''}
        </div>
        ${t.notes ? `<div class="notes">${esc(t.notes)}</div>` : ''}
      </div>
      <div class="actions">
        <button onclick="edit('${t.id}')">Edit</button>
        <button onclick="removeTask('${t.id}')">✕</button>
      </div>
    </div>`).join('') : '<div class="empty">No tasks here. Add one above! 🎯</div>';
}

function toggle(id) {
  const t = tasks.find(t => t.id === id);
  t.done = !t.done;
  save();
  render();
}

function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function edit(id) {
  const t = tasks.find(t => t.id === id);
  editingId = id;
  $('title').value = t.title;
  $('subject').value = t.subject;
  $('due').value = t.due;
  $('priority').value = t.priority;
  $('notes').value = t.notes;
  $('submitBtn').textContent = 'Save changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('title').focus();
}

$('clearDone').onclick = () => {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
};

['search', 'fStatus', 'fSubject', 'sort'].forEach(id => $(id).addEventListener('input', render));

render();