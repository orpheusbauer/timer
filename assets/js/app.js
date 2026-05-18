(function () {
  "use strict";

  const THEME_KEY = "timerchrono-theme";

  let milestones = [];
  let elapsed = 0;
  let running = false;
  let interval = null;
  let passedMilestones = new Set();
  let notifTimeout = null;

  const el = {
    addMilestoneBtn: document.getElementById("addMilestoneBtn"),
    btnReset: document.getElementById("btnReset"),
    btnStartPause: document.getElementById("btnStartPause"),
    doneBadge: document.getElementById("doneBadge"),
    gaugeFill: document.getElementById("gaugeFill"),
    gaugeLabels: document.getElementById("gaugeLabels"),
    gaugeTrack: document.getElementById("gaugeTrack"),
    inputMinutes: document.getElementById("inputMinutes"),
    inputSeconds: document.getElementById("inputSeconds"),
    milestonesCount: document.getElementById("milestonesCount"),
    milestonesList: document.getElementById("milestonesList"),
    msLabel: document.getElementById("msLabel"),
    msMin: document.getElementById("msMin"),
    msSec: document.getElementById("msSec"),
    nextMilestone: document.getElementById("nextMilestone"),
    notif: document.getElementById("notif"),
    progressBar: document.getElementById("progressBar"),
    themeToggle: document.getElementById("themeToggle"),
    timerDisplay: document.getElementById("timerDisplay"),
    timerRemaining: document.getElementById("timerRemaining")
  };

  init();

  function init() {
    applyTheme(window.localStorage.getItem(THEME_KEY) || "dark");
    bindEvents();
    updateUI();
    renderMilestones();
    renderGaugeMarkers();
  }

  function bindEvents() {
    el.addMilestoneBtn.addEventListener("click", addMilestone);
    el.btnReset.addEventListener("click", resetTimer);
    el.btnStartPause.addEventListener("click", toggleTimer);
    el.themeToggle.addEventListener("click", toggleTheme);
    el.milestonesList.addEventListener("click", handleMilestoneListClick);

    [el.inputMinutes, el.inputSeconds].forEach((input) => {
      input.addEventListener("change", () => {
        resetTimer();
        renderGaugeMarkers();
      });
    });

    el.msLabel.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addMilestone();
      }
    });

    window.addEventListener("resize", debounce(renderGaugeMarkers, 120));
  }

  function toggleTimer() {
    if (!running && elapsed < parseDuration()) {
      startTimer();
      return;
    }

    if (running) {
      pauseTimer();
    }
  }

  function fmt(seconds) {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function parseDuration() {
    const minutes = Number.parseInt(el.inputMinutes.value, 10) || 0;
    const seconds = Number.parseInt(el.inputSeconds.value, 10) || 0;
    return minutes * 60 + seconds;
  }

  function showNotif(text) {
    el.notif.textContent = text;
    el.notif.classList.add("show");
    window.clearTimeout(notifTimeout);
    notifTimeout = window.setTimeout(() => el.notif.classList.remove("show"), 3200);
  }

  function addMilestone() {
    const minutes = Number.parseInt(el.msMin.value, 10) || 0;
    const seconds = Number.parseInt(el.msSec.value, 10) || 0;
    const label = el.msLabel.value.trim();
    const time = minutes * 60 + seconds;
    const duration = parseDuration();

    if (!label) {
      showNotif("Ajoute une note pour ce palier.");
      return;
    }
    if (duration === 0) {
      showNotif("Définis d'abord une durée totale.");
      return;
    }
    if (time <= 0 || time >= duration) {
      showNotif("Le palier doit être entre 00:01 et la durée totale.");
      return;
    }
    if (milestones.find((milestone) => milestone.t === time)) {
      showNotif("Un palier existe déjà à ce temps.");
      return;
    }

    milestones.push({ t: time, lbl: label });
    milestones.sort((first, second) => first.t - second.t);

    el.msMin.value = "";
    el.msSec.value = "";
    el.msLabel.value = "";

    renderMilestones();
    renderGaugeMarkers();
  }

  function deleteMilestone(time) {
    milestones = milestones.filter((milestone) => milestone.t !== time);
    passedMilestones.delete(time);
    renderMilestones();
    renderGaugeMarkers();
    updateUI();
  }

  function handleMilestoneListClick(event) {
    const button = event.target.closest("[data-delete-milestone]");
    if (!button) {
      return;
    }

    deleteMilestone(Number(button.dataset.deleteMilestone));
  }

  function renderMilestones() {
    el.milestonesCount.textContent = `(${milestones.length})`;

    if (!milestones.length) {
      el.milestonesList.innerHTML = "<div class=\"empty-milestones\">Aucun palier défini</div>";
      return;
    }

    el.milestonesList.innerHTML = milestones.map((milestone) => {
      return [
        `<div class="milestone-item" id="msitem-${milestone.t}">`,
        `<span class="milestone-time-badge">${fmt(milestone.t)}</span>`,
        `<span class="milestone-note">${escapeHtml(milestone.lbl)}</span>`,
        `<button class="milestone-delete" type="button" data-delete-milestone="${milestone.t}" aria-label="Supprimer ce palier">×</button>`,
        "</div>"
      ].join("");
    }).join("");

    updateActiveMilestoneItem();
  }

  function updateActiveMilestoneItem() {
    document.querySelectorAll(".milestone-item").forEach((item) => item.classList.remove("active-milestone"));
    const next = milestones.find((milestone) => milestone.t > elapsed);
    if (!next) {
      return;
    }

    const item = document.getElementById(`msitem-${next.t}`);
    if (item) {
      item.classList.add("active-milestone");
    }
  }

  function renderGaugeMarkers() {
    const total = parseDuration();
    el.gaugeTrack.querySelectorAll(".milestone-marker").forEach((marker) => marker.remove());
    el.gaugeLabels.querySelectorAll(".milestone-label").forEach((label) => label.remove());

    if (total === 0) {
      return;
    }

    const trackHeight = getTrackHeight();
    const minLabelBottom = 24;
    const maxLabelBottom = Math.max(minLabelBottom, trackHeight - 28);

    milestones
      .filter((milestone) => milestone.t > 0 && milestone.t < total)
      .forEach((milestone) => {
        const pct = milestone.t / total;
        const markerBottom = clamp(pct * trackHeight, 0, trackHeight);
        const labelBottom = clamp(markerBottom, minLabelBottom, maxLabelBottom);

        const marker = document.createElement("div");
        marker.className = `milestone-marker${passedMilestones.has(milestone.t) ? " passed" : ""}`;
        marker.id = `marker-${milestone.t}`;
        marker.style.bottom = `${markerBottom}px`;

        const dot = document.createElement("div");
        dot.className = "milestone-marker-dot";
        marker.appendChild(dot);
        el.gaugeTrack.appendChild(marker);

        const label = document.createElement("div");
        label.className = `milestone-label${passedMilestones.has(milestone.t) ? " passed" : ""}`;
        label.id = `label-${milestone.t}`;
        label.style.bottom = `${labelBottom}px`;
        label.innerHTML = [
          "<div class=\"milestone-label-line\"></div>",
          `<span class="milestone-label-text">${escapeHtml(milestone.lbl)}</span>`,
          `<span class="milestone-label-time">${fmt(milestone.t)}</span>`
        ].join("");
        el.gaugeLabels.appendChild(label);
      });
  }

  function getTrackHeight() {
    const rect = el.gaugeTrack.getBoundingClientRect();
    return rect.height || 420;
  }

  function updateUI() {
    const total = parseDuration();
    el.timerDisplay.textContent = fmt(elapsed);

    const remaining = Math.max(0, total - elapsed);
    el.timerRemaining.textContent = remaining > 0 ? `- ${fmt(remaining)} restant` : "";

    const pct = total > 0 ? Math.min(elapsed / total, 1) : 0;
    el.gaugeFill.style.height = `${pct * 100}%`;
    el.progressBar.style.width = `${pct * 100}%`;

    const next = milestones.find((milestone) => milestone.t > elapsed && milestone.t < total);
    if (next && elapsed < total) {
      el.nextMilestone.textContent = `→ "${next.lbl}" dans ${fmt(next.t - elapsed)}`;
    } else {
      el.nextMilestone.textContent = "";
    }

    milestones.forEach((milestone) => {
      if (elapsed >= milestone.t && !passedMilestones.has(milestone.t)) {
        passedMilestones.add(milestone.t);
        showNotif(`⏱ ${milestone.lbl}`);

        const marker = document.getElementById(`marker-${milestone.t}`);
        if (marker) {
          marker.classList.add("passed");
        }
        const label = document.getElementById(`label-${milestone.t}`);
        if (label) {
          label.classList.add("passed");
        }
      }
    });

    updateActiveMilestoneItem();

    if (elapsed >= total && total > 0) {
      el.timerDisplay.classList.add("done");
      el.doneBadge.classList.add("show");
      stopTimer();
      if (!passedMilestones.has("done")) {
        passedMilestones.add("done");
        showNotif("✓ Temps écoulé !");
      }
    }
  }

  function startTimer() {
    const total = parseDuration();
    if (running) {
      return;
    }
    if (total === 0) {
      showNotif("Définis une durée d'abord.");
      return;
    }
    if (elapsed >= total) {
      return;
    }

    running = true;
    el.btnStartPause.textContent = "Pause";
    interval = window.setInterval(() => {
      elapsed += 1;
      updateUI();
    }, 1000);
  }

  function pauseTimer() {
    running = false;
    el.btnStartPause.textContent = "Reprendre";
    window.clearInterval(interval);
  }

  function stopTimer() {
    running = false;
    el.btnStartPause.textContent = "Démarrer";
    window.clearInterval(interval);
  }

  function resetTimer() {
    stopTimer();
    elapsed = 0;
    passedMilestones.clear();
    el.timerDisplay.classList.remove("done");
    el.doneBadge.classList.remove("show");
    updateUI();
    renderGaugeMarkers();
    renderMilestones();
  }

  function toggleTheme() {
    const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  function applyTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = safeTheme;
    el.themeToggle.textContent = safeTheme === "dark" ? "Mode clair" : "Mode sombre";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function debounce(callback, delay) {
    let timer = 0;
    return function debounced() {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, delay);
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}());
