const STORAGE_KEY = "yommy_tasks_v1";
const form = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
let currentFilter = "all";
let tasks = loadTasks();
let toastTimer;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);
}
function getPriorityLabel(priority) {
  return ({high:"مهمة", normal:"عادية", low:"بسيطة"})[priority] || "عادية";
}
function render() {
  const filtered = tasks.filter(task => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });
  taskList.innerHTML = filtered.map(task => `
    <article class="task-item ${task.done ? "completed" : ""}" data-id="${task.id}">
      <input class="task-check" type="checkbox" aria-label="إنجاز المهمة" ${task.done ? "checked" : ""}>
      <div class="task-info">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <div class="task-meta"><span class="priority ${task.priority}">${getPriorityLabel(task.priority)}</span><span>${task.done ? "اتعملت ✓" : "لسه في الانتظار"}</span></div>
      </div>
      <button class="delete-task" type="button" aria-label="حذف المهمة" title="حذف">×</button>
    </article>`).join("");
  emptyState.hidden = filtered.length > 0;
  taskList.hidden = filtered.length === 0;
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const remaining = total - done;
  const progress = total ? Math.round(done / total * 100) : 0;
  document.getElementById("totalCount").textContent = total;
  document.getElementById("doneCount").textContent = done;
  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("allFilterCount").textContent = total;
  document.getElementById("progressText").textContent = progress + "%";
  document.getElementById("progressBar").style.width = progress + "%";
  document.querySelectorAll(".filter").forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    showToast("اكتب اسم المهمة الأول 🙂");
    return;
  }
  tasks.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    title,
    priority: priorityInput.value,
    done: false,
    createdAt: new Date().toISOString()
  });
  saveTasks();
  currentFilter = "all";
  taskInput.value = "";
  priorityInput.value = "normal";
  render();
  taskInput.focus();
  showToast("المهمة اتضافت بنجاح ✨");
});
taskList.addEventListener("change", event => {
  if (!event.target.classList.contains("task-check")) return;
  const item = event.target.closest(".task-item");
  const task = tasks.find(t => t.id === item.dataset.id);
  if (!task) return;
  task.done = event.target.checked;
  saveTasks();
  render();
  showToast(task.done ? "عاش! مهمة اتنجزت 💪" : "رجّعنا المهمة للقائمة");
});
taskList.addEventListener("click", event => {
  const button = event.target.closest(".delete-task");
  if (!button) return;
  const item = button.closest(".task-item");
  tasks = tasks.filter(task => task.id !== item.dataset.id);
  saveTasks();
  render();
  showToast("تم حذف المهمة");
});
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});
document.getElementById("clearDone").addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter(task => !task.done);
  if (tasks.length === before) {
    showToast("مفيش مهام منجزة للمسح");
    return;
  }
  saveTasks();
  render();
  showToast("اتمسحت المهام المنجزة");
});
const now = new Date();
const dateLabel = new Intl.DateTimeFormat("ar-EG", {weekday:"long", day:"numeric", month:"long"}).format(now);
document.getElementById("todayLabel").textContent = dateLabel;
render();
