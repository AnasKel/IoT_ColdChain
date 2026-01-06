const MIN_OK = 2;
const MAX_OK = 8;

const KEY_STATE = "dht_incident_state_v3";

let state = {
  lastTimestamp: null,
  alertCounter: 0,
  op1: { ack:false, comment:"", savedAt:null, draft:"" },
  op2: { ack:false, comment:"", savedAt:null, draft:"" },
  op3: { ack:false, comment:"", savedAt:null, draft:"" },
};

function loadState() {
  try {
    const s = localStorage.getItem(KEY_STATE);
    if (s) state = { ...state, ...JSON.parse(s) };
  } catch (e) {}
}

function saveState() {
  localStorage.setItem(KEY_STATE, JSON.stringify(state));
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

function $(id){ return document.getElementById(id); }

// ---- IMPORTANT: ne pas écraser un textarea si l'utilisateur est en train d'écrire
function isFocused(el) {
  return document.activeElement === el;
}

function renderOperator(op) {
  // checkbox
  $(op + "_ack").checked = !!state[op].ack;

  // textarea: on affiche draft si existe, sinon comment validé
  const ta = $(op + "_comment");
  const valueToShow = (state[op].draft ?? "").length > 0 ? state[op].draft : (state[op].comment || "");

  // ✅ si l'utilisateur tape (focus), on ne touche pas à son texte
  if (!isFocused(ta)) {
    ta.value = valueToShow;
  }

  // date validation
  const statusEl = $(op + "_status");
  if (state[op].savedAt) statusEl.textContent = new Date(state[op].savedAt).toLocaleString();
  else statusEl.textContent = "-";

  // ✅ affichage accusé validé / non validé
  const ackStatusEl = $(op + "_ack_status");
  if (state[op].ack) ackStatusEl.textContent = "Validé ✅";
  else ackStatusEl.textContent = "Non validé";

  // commentaire validé affiché
  const showEl = $(op + "_show");
  showEl.textContent = state[op].comment ? state[op].comment : "-";
}

function resetOperators() {
  state.op1 = { ack:false, comment:"", savedAt:null, draft:"" };
  state.op2 = { ack:false, comment:"", savedAt:null, draft:"" };
  state.op3 = { ack:false, comment:"", savedAt:null, draft:"" };
}

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

  if (state.alertCounter > 0) op1Box.classList.remove("hidden"); else op1Box.classList.add("hidden");
  if (state.alertCounter > 3) op2Box.classList.remove("hidden"); else op2Box.classList.add("hidden");
  if (state.alertCounter > 6) op3Box.classList.remove("hidden"); else op3Box.classList.add("hidden");

  renderOperator("op1");
  renderOperator("op2");
  renderOperator("op3");
}

// ✅ Sauvegarde auto du texte pendant la saisie (draft)
function bindDraft(op) {
  const ta = $(op + "_comment");
  ta.addEventListener("input", () => {
    state[op].draft = ta.value;   // on garde ce qui est en cours d'écriture
    saveState();
  });
}

function bindSaveButton(op) {
  $(op + "_save").addEventListener("click", () => {
    // on lit ce qui est dans le formulaire
    state[op].ack = $(op + "_ack").checked;

    // Au moment de valider, on prend le texte actuel
    const ta = $(op + "_comment");
    const txt = ta.value.trim();

    state[op].comment = txt;
    state[op].draft = ""; // ✅ draft vidé car maintenant c'est "validé"
    state[op].savedAt = new Date().toISOString();

    saveState();
    renderOperator(op);
  });
}
async function fetchIncidentStatus(){
  const res = await fetch("/incident/status/");
  return await res.json();
}

async function saveOperator(op){
  const ack = document.getElementById(op+"_ack").checked;
  const comment = document.getElementById(op+"_comment").value;

  const res = await fetch("/incident/update/", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      op: op === "op1" ? 1 : op === "op2" ? 2 : 3,
      ack: ack,
      comment: comment
    })
  });
  return await res.json();
}

async function loadLatest() {
  try {
    const res = await fetch("/latest/");
    const data = await res.json();

    const t = Number(data.temperature);
    const h = Number(data.humidity);
    const inc = await fetchIncidentStatus();
    $("temp").textContent = t.toFixed(1) + " °C";
    $("hum").textContent  = h.toFixed(1) + " %";

    const date = new Date(data.timestamp);
    const diffSec = Math.round((Date.now() - date.getTime()) / 1000);

    $("temp-time").textContent = "il y a : " + formatAge(diffSec) + " (" + date.toLocaleTimeString() + ")";
    $("hum-time").textContent  = "il y a : " + formatAge(diffSec) + " (" + date.toLocaleTimeString() + ")";

    const isIncident = (t < MIN_OK || t > MAX_OK);

    // compteur: uniquement si nouvelle mesure
    if (data.timestamp !== state.lastTimestamp) {
      state.lastTimestamp = data.timestamp;

      if (isIncident) {
        state.alertCounter += 1;
      } else {
        state.alertCounter = 0;
        resetOperators();
      }
      saveState();
    }

    setIncidentUI(isIncident);

  } catch (e) {
    console.log("Erreur API :", e);
  }
}

// ===== INIT =====
loadState();

bindDraft("op1");
bindDraft("op2");
bindDraft("op3");

bindSaveButton("op1");
bindSaveButton("op2");
bindSaveButton("op3");

renderOperator("op1");
renderOperator("op2");
renderOperator("op3");
// ===== INITIALISATION DU DASHBOARD =====

// Bouton valider opérateur 1
document.getElementById("op1_save").onclick = async () => {
    await saveOperator("op1");
};

// Bouton valider opérateur 2
document.getElementById("op2_save").onclick = async () => {
    await saveOperator("op2");
};

// Bouton valider opérateur 3
document.getElementById("op3_save").onclick = async () => {
    await saveOperator("op3");
};

// Chargement initial
loadLatest();

// Rafraîchissement automatique toutes les 5 secondes
setInterval(loadLatest, 5000);

