
"use strict";

/* =========================================================
   TRACKMATE — COMPLETE UPDATED JAVASCRIPT
   Academics | Skills | Planner | Focus | Analytics
========================================================= */

const STORAGE_KEYS = {
  academics: "trackmate_v2_academic",
  skills: "trackmate_v2_skills",
  sessions: "trackmate_v2_sessions",
  focusSessions: "trackmate_v2_focus_sessions"
};

const $ = (id) => document.getElementById(id);

/* -------------------- DATA STORAGE -------------------- */

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("TrackMate storage error:", error);
    return fallback;
  }
}

let academics = loadData(STORAGE_KEYS.academics, []);
let skills = loadData(STORAGE_KEYS.skills, []);
let sessions = loadData(STORAGE_KEYS.sessions, []);
let focusSessions = Number(loadData(STORAGE_KEYS.focusSessions, 0)) || 0;

if (!Array.isArray(academics)) academics = [];
if (!Array.isArray(skills)) skills = [];
if (!Array.isArray(sessions)) sessions = [];

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.academics, JSON.stringify(academics));
    localStorage.setItem(STORAGE_KEYS.skills, JSON.stringify(skills));
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.focusSessions, JSON.stringify(focusSessions));
  } catch (error) {
    console.error("Could not save TrackMate data:", error);
    alert("Could not save your data. Check your browser storage.");
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "No date";
  const parts = value.split("-");
  return parts.length === 3
    ? `${parts[2]}-${parts[1]}-${parts[0]}`
    : value;
}

function formatMinutes(value) {
  const minutes = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder} min`;
}

function showEmpty(element, message) {
  if (!element) return;
  element.classList.add("empty-state");
  element.innerHTML = `<p>${escapeHTML(message)}</p>`;
}

function clearEmpty(element) {
  if (element) element.classList.remove("empty-state");
}

/* -------------------- DATE HELPERS -------------------- */

function getDaysUntil(dateString) {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(deadline.getTime())) return null;

  return Math.round((deadline - today) / 86400000);
}

function getDueLabel(task) {
  if (task.completed) return "Completed";

  const days = getDaysUntil(task.deadline);

  if (days === null) return "No deadline";
  if (days < 0) return `${Math.abs(days)} day(s) overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";

  return `Due in ${days} days`;
}

function isThisWeek(dateString) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return date >= monday && date < nextMonday;
}

/* =========================================================
   NAVIGATION
========================================================= */

const pageInfo = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Make progress without overwhelming yourself."
  },
  academics: {
    title: "Academics",
    subtitle: "Deadlines are fixed. Your plan can adapt around them."
  },
  skills: {
    title: "Skill Tracker",
    subtitle: "Build valuable skills one session at a time."
  },
  planner: {
    title: "Smart Planner",
    subtitle: "Make a realistic plan for the time you have."
  },
  focus: {
    title: "Focus Mode",
    subtitle: "One task at a time. Progress over perfection."
  },
  analytics: {
    title: "Productivity",
    subtitle: "Understand your progress without judging yourself."
  }
};

function showSection(sectionId) {
  if (!pageInfo[sectionId]) return;

  document.querySelectorAll(".app-section").forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );
  });

  if ($("pageTitle")) $("pageTitle").textContent = pageInfo[sectionId].title;
  if ($("pageSubtitle")) $("pageSubtitle").textContent = pageInfo[sectionId].subtitle;

  renderAll();
}

document.querySelectorAll(".nav-item[data-section]").forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
  });
});

// Handles dashboard buttons such as "Plan my day" and "View all".
document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    showSection(goButton.dataset.go);
  }
});

/* =========================================================
   ACADEMIC TRACKER
========================================================= */

const academicForm = $("academicForm");

if (academicForm) {
  academicForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("academicTitle")?.value.trim();
    const type = $("academicType")?.value || "assignment";
    const subject = $("academicSubject")?.value.trim() || "General";
    const deadline = $("academicDeadline")?.value;
    const effort = Number($("academicEffort")?.value);
    const priority = $("academicPriority")?.value || "medium";

    if (!title || !deadline || !Number.isFinite(effort) || effort < 5) {
      alert("Enter a task name, deadline, and effort of at least 5 minutes.");
      return;
    }

    academics.push({
      id: makeId(),
      title,
      type,
      subject,
      deadline,
      effort: Math.round(effort),
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    });

    saveData();
    academicForm.reset();

    if ($("academicEffort")) $("academicEffort").value = "60";
    if ($("academicPriority")) $("academicPriority").value = "medium";

    renderAll();
  });
}

function academicScore(task) {
  const days = getDaysUntil(task.deadline);
  let score = 0;

  if (days !== null) {
    if (days < 0) score += 100;
    else if (days === 0) score += 90;
    else if (days === 1) score += 80;
    else if (days <= 3) score += 65;
    else if (days <= 7) score += 45;
    else score += 20;
  }

  score += ({ high: 25, medium: 15, low: 5 })[task.priority] || 15;

  if (task.type === "exam") score += 10;
  if (task.type === "project") score += 5;

  return score;
}

function renderAcademics() {
  const container = $("academicTaskList");
  if (!container) return;

  if (!academics.length) {
    showEmpty(container, "Your academic tasks will appear here.");
    return;
  }

  clearEmpty(container);

  const sorted = [...academics].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return academicScore(b) - academicScore(a);
  });

  container.innerHTML = sorted.map((task) => `
    <article class="task-item ${task.completed ? "completed" : ""}">
      <div class="task-main">
        <h3>${escapeHTML(task.title)}</h3>
        <p>${escapeHTML(task.subject)} · ${escapeHTML(task.type)}</p>
        <p>Deadline: ${escapeHTML(formatDate(task.deadline))}</p>
        <p>Estimated effort: ${escapeHTML(formatMinutes(task.effort))}</p>
        <div class="task-meta">
          <span class="status-badge">${escapeHTML(getDueLabel(task))}</span>
          <span class="status-badge">${escapeHTML(task.priority)} priority</span>
        </div>
      </div>
      <div class="task-actions">
        <button type="button" class="secondary-button"
          data-action="toggle-academic" data-id="${escapeHTML(task.id)}">
          ${task.completed ? "Mark pending" : "Mark complete"}
        </button>
        <button type="button" class="danger-button"
          data-action="delete-academic" data-id="${escapeHTML(task.id)}">
          Delete
        </button>
      </div>
    </article>
  `).join("");
}

function toggleAcademic(id) {
  const task = academics.find((item) => item.id === id);
  if (!task) return;

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;

  saveData();
  renderAll();
}

function deleteAcademic(id) {
  if (!confirm("Delete this academic task?")) return;

  academics = academics.filter((task) => task.id !== id);
  saveData();
  renderAll();
}

/* =========================================================
   SKILL TRACKER
   IMPORTANT: Matches your HTML IDs:
   skillGoal = weekly target in minutes
   skillTarget = target topics or milestones (text)
========================================================= */

const skillForm = $("skillForm");

if (skillForm) {
  skillForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("skillName")?.value.trim();
    const category = $("skillCategory")?.value || "Other";

    // Corrected mapping for your HTML:
    const target = Number($("skillGoal")?.value);
    const goal = $("skillTarget")?.value.trim();

    if (!name || !Number.isFinite(target) || target <= 0) {
      alert("Enter a skill name and a valid weekly target in minutes.");
      return;
    }

    const duplicate = skills.some(
      (skill) => skill.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      alert("This skill is already in your tracker.");
      return;
    }

    skills.push({
      id: makeId(),
      name,
      category,
      goal,
      target: Math.round(target),
      createdAt: new Date().toISOString()
    });

    saveData();
    skillForm.reset();

    // Restore sensible defaults from the HTML.
    if ($("skillGoal")) $("skillGoal").value = "120";

    renderAll();
  });
}

function getSkillName(skillId) {
  return skills.find((skill) => skill.id === skillId)?.name || "Deleted skill";
}

function getSkillMinutes(skillId) {
  return sessions
    .filter((session) => session.skillId === skillId)
    .reduce((total, session) => total + (Number(session.duration) || 0), 0);
}

function getWeeklySkillMinutes(skillId) {
  return sessions
    .filter((session) => session.skillId === skillId && isThisWeek(session.date))
    .reduce((total, session) => total + (Number(session.duration) || 0), 0);
}

function renderSkills() {
  const container = $("skillList");
  if (!container) return;

  if (!skills.length) {
    showEmpty(container, "Add your first skill to begin tracking.");
    return;
  }

  clearEmpty(container);

  container.innerHTML = skills.map((skill) => {
    const total = getSkillMinutes(skill.id);
    const weekly = getWeeklySkillMinutes(skill.id);
    const target = Math.max(1, Number(skill.target) || 1);
    const progress = Math.min(100, Math.round((weekly / target) * 100));

    return `
      <article class="skill-card">
        <div class="skill-card-header">
          <div>
            <h3>${escapeHTML(skill.name)}</h3>
            <p>${escapeHTML(skill.category)}</p>
          </div>
          <button type="button" class="danger-button"
            data-action="delete-skill" data-id="${escapeHTML(skill.id)}">
            Delete
          </button>
        </div>
        <p>Weekly goal: ${escapeHTML(formatMinutes(target))}</p>
        ${skill.goal
          ? `<p>Topics or milestones: ${escapeHTML(skill.goal)}</p>`
          : ""}
        <p>This week: ${escapeHTML(formatMinutes(weekly))}</p>
        <div class="progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <p>Total practice: ${escapeHTML(formatMinutes(total))}</p>
      </article>
    `;
  }).join("");
}

function renderSessionSkillOptions() {
  const select = $("sessionSkill");
  if (!select) return;

  const previousValue = select.value;

  select.innerHTML = `
    <option value="">${skills.length ? "Choose a skill" : "Add a skill first"}</option>
    ${skills.map((skill) => `
      <option value="${escapeHTML(skill.id)}">${escapeHTML(skill.name)}</option>
    `).join("")}
  `;

  if (skills.some((skill) => skill.id === previousValue)) {
    select.value = previousValue;
  }
}

function deleteSkill(id) {
  if (!confirm("Delete this skill and its practice history?")) return;

  skills = skills.filter((skill) => skill.id !== id);
  sessions = sessions.filter((session) => session.skillId !== id);

  saveData();
  renderAll();
}

/* =========================================================
   PRACTICE SESSION LOG
========================================================= */

const sessionForm = $("sessionForm");

if (sessionForm) {
  sessionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const skillId = $("sessionSkill")?.value;
    const date = $("sessionDate")?.value || localISODate();
    const duration = Number($("sessionDuration")?.value);
    const topic = $("sessionTopic")?.value.trim();
    const notes = $("sessionNotes")?.value.trim() || "";

    if (!skills.some((skill) => skill.id === skillId)) {
      alert("Add a skill first, then select it here.");
      return;
    }

    if (!Number.isFinite(duration) || duration < 1) {
      alert("Enter a valid practice duration.");
      return;
    }

    if (!topic) {
      alert("Enter the topic or activity you practised.");
      return;
    }

    sessions.push({
      id: makeId(),
      skillId,
      date,
      duration: Math.round(duration),
      topic,
      notes,
      createdAt: new Date().toISOString()
    });

    saveData();
    sessionForm.reset();

    if ($("sessionDate")) $("sessionDate").value = localISODate();
    if ($("sessionDuration")) $("sessionDuration").value = "25";

    renderAll();
  });
}

function deleteSession(id) {
  if (!confirm("Delete this practice session?")) return;

  sessions = sessions.filter((session) => session.id !== id);
  saveData();
  renderAll();
}

function renderSessionHistory() {
  const container = $("sessionHistory");
  if (!container) return;

  if (!sessions.length) {
    showEmpty(container, "Your practice history will appear here.");
    return;
  }

  clearEmpty(container);

  const sorted = [...sessions].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "") ||
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  container.innerHTML = sorted.map((session) => `
    <article class="history-item">
      <div>
        <h3>${escapeHTML(session.topic)}</h3>
        <p>${escapeHTML(getSkillName(session.skillId))} · ${escapeHTML(formatDate(session.date))}</p>
        <p>${escapeHTML(formatMinutes(session.duration))}</p>
        ${session.notes ? `<p>${escapeHTML(session.notes)}</p>` : ""}
      </div>
      <button type="button" class="danger-button"
        data-action="delete-session" data-id="${escapeHTML(session.id)}">
        Delete
      </button>
    </article>
  `).join("");
}

/* =========================================================
   ADAPTIVE PLANNER
========================================================= */

const plannerForm = $("plannerForm");

if (plannerForm) {
  plannerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generatePlan();
  });
}

function generatePlan() {
  const output = $("plannerResult");
  if (!output) return;

  const available = Number($("availableMinutes")?.value || 120);
  const energy = $("energyLevel")?.value || "medium";
  const preference = $("plannerPreference")?.value || "balanced";

  const energyFactor = {
    low: 0.7,
    medium: 0.85,
    high: 1
  }[energy] || 0.85;

  const usableMinutes = Math.max(10, Math.floor(available * energyFactor));
  const breakMinutes = available >= 90 ? 10 : 5;

  let remaining = Math.max(0, usableMinutes - breakMinutes);
  const plan = [];

  const pending = academics
    .filter((task) => !task.completed)
    .sort((a, b) => academicScore(b) - academicScore(a));

  // Allocate time to academic work first.
  for (const task of pending) {
    if (remaining < 10) break;

    const effort = Math.max(5, Number(task.effort) || 30);
    const allocation = Math.min(effort, remaining);

    plan.push({
      kind: "academic",
      title: task.title,
      description: `${task.subject} · ${getDueLabel(task)}`,
      minutes: allocation
    });

    remaining -= allocation;
  }

  // Add flexible skill practice only if time remains.
  if (remaining >= 15 && skills.length > 0 && preference !== "academics") {
    const skillChoices = [...skills].sort((a, b) => {
      const aProgress = getWeeklySkillMinutes(a.id) / Math.max(1, Number(a.target) || 1);
      const bProgress = getWeeklySkillMinutes(b.id) / Math.max(1, Number(b.target) || 1);
      return aProgress - bProgress;
    });

    const skill = skillChoices[0];
    const allocation = Math.min(remaining, preference === "skills" ? 45 : 25);

    if (allocation >= 15) {
      plan.push({
        kind: "skill",
        title: `Practise ${skill.name}`,
        description: skill.goal || skill.category,
        minutes: allocation
      });

      remaining -= allocation;
    }
  }

  if (plan.length === 0) {
    output.innerHTML = `
      <p>No tasks were added to this session.</p>
      <p>Add academic tasks or skills, or use this time for revision and rest.</p>
      <p>Suggested break: ${breakMinutes} minutes.</p>
    `;
    return;
  }

  const allocated = plan.reduce((total, item) => total + item.minutes, 0);

  output.innerHTML = `
    <h3>Your suggested plan</h3>
    <p>Available time: ${available} minutes</p>
    <p>Energy level: ${escapeHTML(energy)}</p>
    <p>Planned work: ${formatMinutes(allocated)}</p>
    <p>Suggested break: ${breakMinutes} minutes</p>
    <p>Your actual academic deadlines remain unchanged.</p>

    ${plan.map((item, index) => `
      <article class="plan-item">
        <div>
          <h4>${index + 1}. ${escapeHTML(item.title)}</h4>
          <p>${escapeHTML(item.description)}</p>
          <p>${escapeHTML(formatMinutes(item.minutes))}</p>
        </div>
        <button type="button" class="secondary-button"
          data-action="focus-task"
          data-title="${escapeHTML(item.title)}"
          data-minutes="${item.minutes}">
          Focus on this
        </button>
      </article>
    `).join("")}

    ${remaining > 0
      ? `<p>Time left unplanned: ${escapeHTML(formatMinutes(remaining))}. Keep it flexible.</p>`
      : ""}
  `;
}

/* =========================================================
   FOCUS TIMER
========================================================= */

let focusRemainingSeconds = 25 * 60;
let focusInterval = null;
let focusRunning = false;
let focusStartedAt = null;

function updateFocusDisplay() {
  const display = $("focusTimer");
  if (!display) return;

  const minutes = Math.floor(focusRemainingSeconds / 60);
  const seconds = focusRemainingSeconds % 60;

  display.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if ($("focusStatus")) {
    $("focusStatus").textContent = focusRunning
      ? "Focus session in progress. Keep going at your own pace."
      : focusRemainingSeconds === 0
        ? "Session complete. Take a break if you need one."
        : "Ready when you are.";
  }
}

function stopFocusInterval() {
  if (focusInterval !== null) {
    clearInterval(focusInterval);
    focusInterval = null;
  }
  focusRunning = false;
}

function startFocus() {
  if (focusRunning) return;

  const taskName = $("focusTask")?.value.trim();
  if (!taskName) {
    alert("Enter the task you want to focus on.");
    $("focusTask")?.focus();
    return;
  }

  if (focusRemainingSeconds <= 0) {
    const duration = Number($("focusDuration")?.value || 25);
    focusRemainingSeconds = Math.max(1, duration) * 60;
  }

  focusRunning = true;
  focusStartedAt = focusStartedAt || new Date().toISOString();

  focusInterval = setInterval(() => {
    if (focusRemainingSeconds > 0) {
      focusRemainingSeconds--;
      updateFocusDisplay();
    }

    if (focusRemainingSeconds <= 0) {
      stopFocusInterval();
      focusRemainingSeconds = 0;
      focusSessions++;
      saveData();
      updateFocusDisplay();
      renderAnalytics();
    }
  }, 1000);

  updateFocusDisplay();
}

function pauseFocus() {
  stopFocusInterval();
  updateFocusDisplay();
}

function resetFocus() {
  stopFocusInterval();

  const duration = Number($("focusDuration")?.value || 25);
  focusRemainingSeconds = Math.max(1, duration) * 60;
  focusStartedAt = null;

  updateFocusDisplay();
}

if ($("startFocus")) {
  $("startFocus").addEventListener("click", startFocus);
}

if ($("pauseFocus")) {
  $("pauseFocus").addEventListener("click", pauseFocus);
}

if ($("resetFocus")) {
  $("resetFocus").addEventListener("click", resetFocus);
}

if ($("focusDuration")) {
  $("focusDuration").addEventListener("change", () => {
    if (!focusRunning) resetFocus();
  });
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  const pending = academics.filter((task) => !task.completed);
  const completed = academics.filter((task) => task.completed);

  if ($("currentDate")) {
    $("currentDate").textContent = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  if ($("pendingCount")) $("pendingCount").textContent = pending.length;
  if ($("skillCount")) $("skillCount").textContent = skills.length;
  if ($("completedCount")) $("completedCount").textContent = completed.length;

  const weeklyMinutes = sessions
    .filter((session) => isThisWeek(session.date))
    .reduce((total, session) => total + (Number(session.duration) || 0), 0);

  if ($("weeklySkillTime")) {
    $("weeklySkillTime").textContent = formatMinutes(weeklyMinutes);
  }

  // Upcoming deadlines
  const deadlineContainer = $("upcomingDeadlines");

  if (deadlineContainer) {
    const upcoming = pending
      .filter((task) => task.deadline)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5);

    if (!upcoming.length) {
      showEmpty(deadlineContainer, "No deadlines added yet.");
    } else {
      clearEmpty(deadlineContainer);

      deadlineContainer.innerHTML = upcoming.map((task) => `
        <article class="deadline-item">
          <div>
            <h3>${escapeHTML(task.title)}</h3>
            <p>${escapeHTML(task.subject)} · ${escapeHTML(task.type)}</p>
          </div>
          <div>
            <p>${escapeHTML(formatDate(task.deadline))}</p>
            <span class="status-badge">${escapeHTML(getDueLabel(task))}</span>
          </div>
        </article>
      `).join("");
    }
  }

  // Skill overview
  const skillsContainer = $("dashboardSkills");

  if (skillsContainer) {
    if (!skills.length) {
      showEmpty(skillsContainer, "Add C, DSA, or another skill to begin.");
    } else {
      clearEmpty(skillsContainer);

      skillsContainer.innerHTML = skills.slice(0, 4).map((skill) => `
        <article class="dashboard-skill-item">
          <h3>${escapeHTML(skill.name)}</h3>
          <p>${escapeHTML(skill.category)}</p>
          <p>This week: ${escapeHTML(formatMinutes(getWeeklySkillMinutes(skill.id)))}
            / ${escapeHTML(formatMinutes(skill.target))}</p>
        </article>
      `).join("");
    }
  }

  // Suggested tasks
  const planContainer = $("dashboardPlan");

  if (planContainer) {
    const urgent = [...pending]
      .sort((a, b) => academicScore(b) - academicScore(a))
      .slice(0, 3);

    if (!urgent.length) {
      showEmpty(planContainer, "No pending academic tasks. You can rest or practise a skill.");
    } else {
      clearEmpty(planContainer);

      planContainer.innerHTML = urgent.map((task) => `
        <article class="plan-item">
          <div>
            <h3>${escapeHTML(task.title)}</h3>
            <p>${escapeHTML(task.subject)} · ${escapeHTML(getDueLabel(task))}</p>
          </div>
          <button type="button" class="secondary-button"
            data-action="focus-task"
            data-title="${escapeHTML(task.title)}"
            data-minutes="${Math.min(Number(task.effort) || 25, 60)}">
            Focus
          </button>
        </article>
      `).join("");
    }
  }
}

/* =========================================================
   PRODUCTIVITY ANALYTICS
========================================================= */

function renderAnalytics() {
  const pending = academics.filter((task) => !task.completed);
  const completed = academics.filter((task) => task.completed);

  const totalSkillMinutes = sessions.reduce(
    (total, session) => total + (Number(session.duration) || 0), 0
  );

  if ($("analyticsCompleted")) $("analyticsCompleted").textContent = completed.length;
  if ($("analyticsPending")) $("analyticsPending").textContent = pending.length;
  if ($("analyticsSkillTime")) {
    $("analyticsSkillTime").textContent = formatMinutes(totalSkillMinutes);
  }
  if ($("analyticsFocusSessions")) {
    $("analyticsFocusSessions").textContent = focusSessions;
  }

  // Skill-page summary cards
  if ($("totalSkills")) $("totalSkills").textContent = skills.length;
  if ($("totalSkillTime")) {
    $("totalSkillTime").textContent = formatMinutes(totalSkillMinutes);
  }
  if ($("totalSessions")) $("totalSessions").textContent = sessions.length;
  if ($("topicsCompleted")) {
    $("topicsCompleted").textContent = new Set(
      sessions.map((session) =>
        `${session.skillId}:${session.topic.trim().toLowerCase()}`
      )
    ).size;
  }

  const workload = $("workloadAnalysis");

  if (workload) {
    const overdue = pending.filter((task) => {
      const days = getDaysUntil(task.deadline);
      return days !== null && days < 0;
    });

    const dueSoon = pending.filter((task) => {
      const days = getDaysUntil(task.deadline);
      return days !== null && days >= 0 && days <= 3;
    });

    const effort = pending.reduce(
      (total, task) => total + (Number(task.effort) || 0), 0
    );

    let message = "Keep your workload realistic and leave room for breaks.";

    if (overdue.length) {
      message = `${overdue.length} task(s) are overdue. Review them and decide on your next action.`;
    } else if (dueSoon.length >= 3) {
      message = "Several tasks are due soon. Prioritise them and avoid overloading your day.";
    } else if (!pending.length) {
      message = "No pending academic tasks are recorded. Protect your rest time too.";
    }

    workload.innerHTML = `
      <p>${escapeHTML(message)}</p>
      <p>Estimated pending effort: ${escapeHTML(formatMinutes(effort))}</p>
      <p>Due within 3 days: ${dueSoon.length}</p>
      <p>Overdue tasks: ${overdue.length}</p>
    `;
  }

  const skillAnalysis = $("skillAnalysis");

  if (skillAnalysis) {
    if (!skills.length) {
      showEmpty(skillAnalysis, "Add skills and log practice sessions to see your learning summary.");
    } else {
      clearEmpty(skillAnalysis);

      skillAnalysis.innerHTML = skills.map((skill) => `
        <article class="analytics-item">
          <h3>${escapeHTML(skill.name)}</h3>
          <p>Total practice: ${escapeHTML(formatMinutes(getSkillMinutes(skill.id)))}</p>
          <p>This week: ${escapeHTML(formatMinutes(getWeeklySkillMinutes(skill.id)))}</p>
          <p>Weekly target: ${escapeHTML(formatMinutes(skill.target))}</p>
        </article>
      `).join("");
    }
  }
}

/* =========================================================
   ACTION BUTTONS
========================================================= */

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  switch (action) {
    case "toggle-academic":
      toggleAcademic(id);
      break;

    case "delete-academic":
      deleteAcademic(id);
      break;

    case "delete-skill":
      deleteSkill(id);
      break;

    case "delete-session":
      deleteSession(id);
      break;

    case "focus-task": {
      const title = button.dataset.title || "";
      const minutes = Number(button.dataset.minutes || 25);

      if ($("focusTask")) $("focusTask").value = title;

      if ($("focusDuration")) {
        // Choose the closest supported timer duration.
        const options = [...$("focusDuration").options].map((option) =>
          Number(option.value)
        );

        const closest = options.reduce((best, value) =>
          Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best
        );

        $("focusDuration").value = String(closest);
      }

      resetFocus();
      showSection("focus");
      break;
    }
  }
});

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {
  renderAcademics();
  renderSkills();
  renderSessionSkillOptions();
  renderSessionHistory();
  renderDashboard();
  renderAnalytics();
  updateFocusDisplay();
}

/* =========================================================
   INITIAL SETUP
========================================================= */

if ($("sessionDate") && !$("sessionDate").value) {
  $("sessionDate").value = localISODate();
}

if ($("focusDuration") && !$("focusDuration").value) {
  $("focusDuration").value = "25";
}

renderAll();
