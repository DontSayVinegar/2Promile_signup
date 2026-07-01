/* ============================================================
   běhna 2‰ — signup
   ============================================================ */

/* 1) PASTE YOUR GOOGLE APPS SCRIPT WEB-APP URL HERE
   (see README.md → "Setting up the overview"). Looks like:
   https://script.google.com/macros/s/AKfyc..../exec              */
const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

/* how many times the "no" button dodges before it lets itself be caught */
const DODGES_TO_CATCH = 6;

/* ---------- element refs ---------- */
const screenAsk  = document.getElementById("screen-ask");
const screenName = document.getElementById("screen-name");
const screenDone = document.getElementById("screen-done");

const btnYes = document.getElementById("btnYes");
const btnNo  = document.getElementById("btnNo");
const taunt  = document.getElementById("taunt");

const nameForm    = document.getElementById("nameForm");
const nameInput   = document.getElementById("nameInput");
const nameErr     = document.getElementById("nameErr");
const submitBtn   = document.getElementById("submitBtn");
const nameHeading = document.getElementById("nameHeading");

const doneHeading = document.getElementById("doneHeading");
const doneSub     = document.getElementById("doneSub");

/* ---------- state ---------- */
let choice = "yes";          // which button they ended up clicking
let dodges = 0;
let caught = false;
let sending = false;

/* ============================================================
   The evasive "sorry ale ne" button
   ============================================================ */
const taunts = [
  "ne? určitě?",
  "no tak…",
  "to myslíš vážně?",
  "chyť mě jestli to dokážeš",
  "skoro! ještě kousíček",
];

function makeLoose() {
  const rect = btnNo.getBoundingClientRect();
  btnNo.classList.add("is-loose");
  btnNo.style.left = rect.left + "px";
  btnNo.style.top  = rect.top + "px";
}

function dodge() {
  if (caught) return;
  if (!btnNo.classList.contains("is-loose")) makeLoose();

  dodges++;
  taunt.textContent = taunts[Math.min(dodges - 1, taunts.length - 1)];

  const pad = 16;
  const w = btnNo.offsetWidth;
  const h = btnNo.offsetHeight;
  const maxX = Math.max(pad, window.innerWidth  - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);
  const x = pad + Math.random() * (maxX - pad);
  const y = pad + Math.random() * (maxY - pad);
  btnNo.style.left = x + "px";
  btnNo.style.top  = y + "px";

  if (dodges >= DODGES_TO_CATCH) catchIt();
}

function catchIt() {
  caught = true;
  btnNo.classList.add("is-caught");
  taunt.textContent = "no dobře, chytils mě. tak klikni.";
}

/* desktop: dodge when the cursor gets close */
document.addEventListener("pointermove", (e) => {
  if (caught || e.pointerType !== "mouse") return;
  const rect = btnNo.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
  if (dist < 95) dodge();
});

/* mobile: a tap counts as a chase attempt until caught */
btnNo.addEventListener(
  "touchstart",
  (e) => {
    if (caught) return; // let the real click through
    e.preventDefault();
    dodge();
  },
  { passive: false }
);

/* ============================================================
   Choosing → name screen
   ============================================================ */
btnYes.addEventListener("click", () => {
  choice = "yes";
  nameHeading.textContent = "tak jak ti budem řvát v cíli?";
  goToName();
});

btnNo.addEventListener("click", () => {
  if (!caught) return; // ignore clicks while it's still dodging
  choice = "no-but-caught";
  nameHeading.textContent = "věděli jsme to. jméno?";
  goToName();
});

function goToName() {
  screenAsk.classList.add("is-hidden");
  screenName.classList.remove("is-hidden");
  nameInput.focus();
}

/* ============================================================
   Submit
   ============================================================ */
nameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (sending) return;

  const name = nameInput.value.trim();
  if (name.length < 2) {
    nameErr.textContent = "no tak, napiš aspoň něco.";
    nameInput.focus();
    return;
  }
  nameErr.textContent = "";

  sending = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "posílám…";

  await sendSignup({ name, choice });

  sending = false;
  showDone(name);
});

async function sendSignup(data) {
  const payload = {
    name: data.name,
    choice: data.choice,
    ts: new Date().toISOString(),
    ua: navigator.userAgent,
  };

  // Local backup — nothing is ever lost even if the network hiccups.
  try {
    const key = "behna_signups";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    prev.push(payload);
    localStorage.setItem(key, JSON.stringify(prev));
  } catch (_) {}

  if (!SCRIPT_URL || SCRIPT_URL.startsWith("PASTE_")) {
    console.warn("[běhna] SCRIPT_URL not set — signup not sent anywhere:", payload);
    return;
  }

  try {
    // text/plain avoids a CORS preflight; no-cors because the Apps Script
    // web app doesn't return CORS headers. Fire-and-forget.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[běhna] send failed (kept in localStorage backup):", err);
  }
}

function showDone(name) {
  screenName.classList.add("is-hidden");
  screenDone.classList.remove("is-hidden");
  const first = name.split(/\s+/)[0];
  doneHeading.textContent = `${first}, jsi na startovce.`;
  doneSub.textContent =
    choice === "no-but-caught"
      ? "útěk se nekonal. uvidíme se u prvního piva."
      : "uvidíme se u prvního piva. 🍺";
}

/* keep the loose "no" button on-screen if the window resizes */
window.addEventListener("resize", () => {
  if (!btnNo.classList.contains("is-loose") || caught) return;
  const pad = 16;
  const maxX = Math.max(pad, window.innerWidth - btnNo.offsetWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - btnNo.offsetHeight - pad);
  btnNo.style.left = Math.min(parseFloat(btnNo.style.left) || 0, maxX) + "px";
  btnNo.style.top  = Math.min(parseFloat(btnNo.style.top) || 0, maxY) + "px";
});
