/* NextMove Planner — VIP Deluxe JS */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* Elements */
const taskInput = $('#task-input');
const taskDate = $('#task-date');
const taskPriority = $('#task-priority');
const addBtn = $('#add-btn');
const taskList = $('#task-list');
const filters = $$('.filter');
const totalCount = $('#total-count');
const activeCount = $('#active-count');
const doneCount = $('#done-count');
const completeAllBtn = $('#complete-all');
const purgeCompletedBtn = $('#purge-completed');
const clearAllBtn = $('#clear-all');
const modal = $('#modal');
const modalMsg = $('#modal-msg');
const modalConfirm = $('#modal-confirm');
const modalCancel = $('#modal-cancel');
const toast = $('#toast');
const themeToggle = $('#theme-toggle');
const soundAdd = $('#sound-add');
const soundDelete = $('#sound-delete');
const timeDisplay = $('#time-display');

let tasks = JSON.parse(localStorage.getItem('nm_tasks') || '[]');
let currentFilter = 'all';

/* Utility: save & toast */
function save(){
  localStorage.setItem('nm_tasks', JSON.stringify(tasks));
  updateCounts();
}
function toastShow(msg, ms=2000){
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(()=> toast.classList.add('hidden'), ms);
}
function play(sound){
  try{ sound.currentTime = 0; sound.play() }catch(e){}
}
// Add new task with auto date
addBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();
  if (taskText !== "") {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB"); // dd/mm/yyyy format
    tasks.push({ text: `${taskText} — (${formattedDate})`, completed: false });
    taskInput.value = "";
    saveTasks();
    renderTasks(document.querySelector(".filters button.active").dataset.filter);
  }
});

/* Time display */
function updateTime(){
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  timeDisplay.textContent = `${hh}:${mm}`;
}
setInterval(updateTime, 1000);
updateTime();

/* Render tasks */
function render(){
  taskList.innerHTML = '';
  const filtered = tasks.filter(t => 
    currentFilter === 'all' ? true : currentFilter === 'active' ? !t.completed : t.completed
  );

  filtered.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'task fade-in' + (t.completed ? ' done' : '');
    li.dataset.index = idx;

    li.innerHTML = `
      <div class="task-left">
        <button class="checkbox ${t.completed ? 'done':''}" aria-label="toggle done">${t.completed ? '✔' : ''}</button>
        <div class="task-info">
          <div class="task-title">${escapeHtml(t.text)}</div>
          <div class="task-meta">
            ${t.date ? `<span class="meta-date">📅 ${t.date}</span>` : ''}
            ${t.priority === 'high' ? `<span class="priority-high">🔺 Priority</span>` : t.priority==='low'?`<span class="priority-low">🔹 Low</span>` : ''}
            <small class="created">⏱ ${t.createdAt}</small>
          </div>
        </div>
      </div>

      <div class="task-right">
        <button class="icon-btn edit" title="Edit">✏️</button>
        <button class="icon-btn star" title="Toggle Priority">${t.priority === 'high' ? '⭐' : '☆'}</button>
        <button class="icon-btn delete" title="Delete">🗑️</button>
      </div>
    `;

    // index mapping: map filtered index to real index
    // since filtered is subset, we need real index:
    const realIndex = tasks.indexOf(t);

    // toggle complete
    li.querySelector('.checkbox').addEventListener('click', ()=> {
      tasks[realIndex].completed = !tasks[realIndex].completed;
      save(); render();
      play(soundAdd);
      toastShow(tasks[realIndex].completed ? 'Marked done' : 'Marked active', 1100);
    });

    // edit
    li.querySelector('.edit').addEventListener('click', ()=> {
      const newText = prompt('Edit task:', t.text);
      if(newText !== null && newText.trim() !== ''){
        tasks[realIndex].text = newText.trim();
        tasks[realIndex].editedAt = (new Date()).toLocaleString();
        save(); render();
        toastShow('Task updated',1100);
      }
    });

    // toggle star / priority quick
    li.querySelector('.star').addEventListener('click', ()=> {
      tasks[realIndex].priority = tasks[realIndex].priority === 'high' ? 'none' : 'high';
      save(); render();
      toastShow('Priority toggled',900);
    });

    // delete
    li.querySelector('.delete').addEventListener('click', ()=> {
      showModal('Delete this task?', ()=> {
        tasks.splice(realIndex,1);
        save(); render();
        play(soundDelete);
        toastShow('Task deleted',1100);
      });
    });

    taskList.appendChild(li);
  });

  updateCounts();
}

/* Escaping function for safety */
function escapeHtml(text){
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* Update counts */
function updateCounts(){
  totalCount.textContent = tasks.length;
  doneCount.textContent = tasks.filter(t=>t.completed).length;
  activeCount.textContent = tasks.filter(t=>!t.completed).length;
}

/* Add new task */
function addTask(){
  const text = taskInput.value.trim();
  if(!text) { taskInput.focus(); return; }
  const date = taskDate.value || '';
  const priority = taskPriority.value || 'none';
  const createdAt = (new Date()).toLocaleString();

  tasks.unshift({ text, date, priority, completed:false, createdAt });
  save();
  render();
  taskInput.value=''; taskDate.value=''; taskPriority.value='none';
  play(soundAdd); toastShow('Added to NextMove', 1200);
  taskInput.focus();
}

/* Filters */
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* Bulk actions */
completeAllBtn.addEventListener('click', ()=> {
  showModal('Mark ALL tasks as done?', ()=> {
    tasks.forEach(t=> t.completed = true);
    save(); render();
    toastShow('All completed',1200);
  });
});

purgeCompletedBtn.addEventListener('click', ()=> {
  showModal('Purge completed tasks permanently?', ()=> {
    tasks = tasks.filter(t => !t.completed);
    save(); render();
    toastShow('Completed purged',1200);
  });
});

clearAllBtn.addEventListener('click', ()=> {
  showModal('Clear ALL tasks? This cannot be undone.', ()=> {
    tasks = [];
    save(); render();
    toastShow('All cleared',1200);
  });
});

/* Modal helpers */
function showModal(message, onConfirm){
  modalMsg.textContent = message;
  modal.classList.remove('hidden');
  modalConfirm.focus();

  function handleConfirm(){
    modal.classList.add('hidden');
    modalConfirm.removeEventListener('click', handleConfirm);
    modalCancel.removeEventListener('click', handleCancel);
    onConfirm && onConfirm();
  }
  function handleCancel(){
    modal.classList.add('hidden');
    modalConfirm.removeEventListener('click', handleConfirm);
    modalCancel.removeEventListener('click', handleCancel);
  }

  modalConfirm.addEventListener('click', handleConfirm);
  modalCancel.addEventListener('click', handleCancel);
}

/* Theme toggle: save preference */
themeToggle.addEventListener('change', ()=> {
  if(themeToggle.checked){
    document.body.classList.add('royal');
    localStorage.setItem('nm_theme','royal');
  } else {
    document.body.classList.remove('royal');
    localStorage.setItem('nm_theme','darkgold');
  }
});

/* Init theme from storage */
(function initTheme(){
  const t = localStorage.getItem('nm_theme') || 'darkgold';
  if(t === 'royal'){ themeToggle.checked = true; document.body.classList.add('royal') }
  else { themeToggle.checked = false; document.body.classList.remove('royal') }
})();

/* Add button and Enter key */
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addTask() });

/* Initial render */
save();
render();

/* Accessibility: close modal on ESC */
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});

/* If user double clicks header, focus input (small shortcut) */
document.querySelector('.brand h1').addEventListener('dblclick', ()=> taskInput.focus());
