function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}


const MIN_OK = 2;
const MAX_OK = 8;

const KEY_STATE = "dht_incident_state_v3";

let state = {
  lastIncidentStart: null,
  alertCounter: 0,
  op1: { ack:false, comment:"", savedAt:null, draft:"" },
  op2: { ack:false, comment:"", savedAt:null, draft:"" },
  op3: { ack:false, comment:"", savedAt:null, draft:"" },
};

/* ================== UTILS ================== */

function $(id){ return document.getElementById(id); }

function isFocused(el) {
  return document.activeElement === el;
}

function formatAge(seconds) {
  const s = Math.max(0, seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (days > 0) return `${days}j ${hours}h ${mins}min ${secs}s`;
  if (hours > 0) return `${hours}h ${mins}min ${secs}s`;
  if (mins > 0) return `${mins}min ${secs}s`;
  return `${secs}s`;
}

function loadState() {
  try {
    const s = localStorage.getItem(KEY_STATE);
    if (s) state = { ...state, ...JSON.parse(s) };
  } catch (e) {}
}

function saveState() {
  localStorage.setItem(KEY_STATE, JSON.stringify(state));
}

/* ================== OPERATORS UI ================== */

function renderOperator(op) {
  const ackEl = $(op + "_ack");
  const ta = $(op + "_comment");

  // checkbox (ne pas écraser si clic en cours)
  if (!isFocused(ackEl)) {
    ackEl.checked = !!state[op].ack;
  }

  // textarea (ne pas écraser si saisie)
  if (!isFocused(ta)) {
    ta.value = state[op].draft || state[op].comment || "";
  }

  $(op + "_status").textContent =
    state[op].savedAt ? new Date(state[op].savedAt).toLocaleString() : "-";

  $(op + "_ack_status").textContent =
    state[op].ack ? "Validé ✅" : "Non validé";

  $(op + "_show").textContent =
    state[op].comment || "-";
}

function resetOperators() {
  ["op1","op2","op3"].forEach(op => {
    state[op] = { ack:false, comment:"", savedAt:null, draft:"" };
  });
}

/* ================== INCIDENT UI ================== */

function setIncidentUI(isIncident) {
  const badge = $("incident-badge");
  const status = $("incident-status");
  const counterEl = $("incident-counter");

  const op1Box = $("op1");
  const op2Box = $("op2");
  const op3Box = $("op3");

  counterEl.textContent = String(state.alertCounter);

  if (!isIncident) {
    badge.textContent = "OK";
    status.textContent = "Pas d’incident";
    op1Box.classList.add("hidden");
    op2Box.classList.add("hidden");
    op3Box.classList.add("hidden");
    return;
  }

  badge.textContent = "ALERTE";
  status.textContent = "Incident en cours (T hors plage)";

  // ✅ LOGIQUE DU PROF (inchangée)
  state.alertCounter > 0 ? op1Box.classList.remove("hidden") : op1Box.classList.add("hidden");
  state.alertCounter > 3 ? op2Box.classList.remove("hidden") : op2Box.classList.add("hidden");
  state.alertCounter > 6 ? op3Box.classList.remove("hidden") : op3Box.classList.add("hidden");

  renderOperator("op1");
  renderOperator("op2");
  renderOperator("op3");
}

/* ================== API ================== */

async function fetchIncidentStatus(){
  const res = await fetch("/incident/status/");
  return await res.json();
}

async function saveOperator(op){
  const ack = $(op+"_ack").checked;
  const comment = $(op+"_comment").value;

  await fetch("/incident/update/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({
      op: op === "op1" ? 1 : op === "op2" ? 2 : 3,
      ack: ack,
      comment: comment
    })
  });
}

/* ================== MAIN LOOP ================== */

async function loadLatest() {
  try {
    const res = await fetch("/latest/");
    const data = await res.json();

    $("temp").textContent = Number(data.temperature).toFixed(1) + " °C";
    $("hum").textContent  = Number(data.humidity).toFixed(1) + " %";

    const date = new Date(data.timestamp);
    const diffSec = Math.round((Date.now() - date.getTime()) / 1000);

    $("temp-time").textContent =
      "il y a : " + formatAge(diffSec) + " (" + date.toLocaleTimeString() + ")";

    $("hum-time").textContent =
      "il y a : " + formatAge(diffSec) + " (" + date.toLocaleTimeString() + ")";

const incident = await fetchIncidentStatus();
const isIncident = incident.is_open;

if (!isIncident) {
  // 🔴 incident terminé → reset total
  state.lastIncidentStart = null;
  state.alertCounter = 0;
  resetOperators();
  saveState();
  setIncidentUI(false);
  return;
}

// 🟢 incident en cours
const currentStart = incident.start_at;

// 🆕 NOUVEL INCIDENT détecté
if (state.lastIncidentStart !== currentStart) {
  state.lastIncidentStart = currentStart;
  resetOperators();          // ✅ efface anciens commentaires
}

// compteur vient de la DB
state.alertCounter = incident.counter || 0;

setIncidentUI(true);
saveState();


  } catch (e) {
    console.log("Erreur API :", e);
  }
}

/* ================== EVENTS ================== */

["op1","op2","op3"].forEach(op => {

  // draft live
  $(op+"_comment").addEventListener("input", e => {
    state[op].draft = e.target.value;
    saveState();
  });

  // validation
  $(op+"_save").addEventListener("click", async () => {
    state[op].ack = $(op+"_ack").checked;
    state[op].comment = $(op+"_comment").value.trim();
    state[op].draft = "";
    state[op].savedAt = new Date().toISOString();

    saveState();
    await saveOperator(op);
    renderOperator(op);
  });
});

/* ================== INIT ================== */

loadState();
loadLatest();
setInterval(loadLatest, 5000);
