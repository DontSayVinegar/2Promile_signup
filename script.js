/* ============================================================
   běhna 2‰ — signup
   ============================================================ */

/* 1) PASTE YOUR GOOGLE APPS SCRIPT WEB-APP URL HERE
   (see README.md → "Setting up the overview"). Looks like:
   https://script.google.com/macros/s/AKfyc..../exec              */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywwihkau8iVyelj_-Bpf9_vBuPwMO0FZT3c0bzZXWiu3z8UBWfL07uqIfES4doZ6s8/exec";

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
const heading = document.querySelector("#screen-ask .prompt");
let lastCount = 0; // rate-limits how fast dodges are tallied toward the catch

function makeLoose() {
  const rect = btnNo.getBoundingClientRect();
  // Leave a same-sized placeholder in the flex row so the "yes" button
  // keeps its position instead of recentering once "no" goes free-floating.
  const ph = document.createElement("span");
  ph.style.display = "inline-block";
  ph.style.width = rect.width + "px";
  ph.style.height = rect.height + "px";
  btnNo.parentNode.insertBefore(ph, btnNo);

  btnNo.classList.add("is-loose");
  btnNo.style.left = rect.left + "px";
  btnNo.style.top  = rect.top + "px";
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function rectsOverlap(x, y, w, h, r) {
  return x < r.right && x + w > r.left && y < r.bottom && y + h > r.top;
}

/* the main heading, padded — the button must never land here */
function headingZone() {
  const r = heading.getBoundingClientRect();
  const m = 30;
  return { left: r.left - m, top: r.top - m, right: r.right + m, bottom: r.bottom + m };
}

/* pick a spot that flees away from (px,py), stays on-screen and clears the heading */
function fleeSpot(px, py) {
  const w = btnNo.offsetWidth;
  const h = btnNo.offsetHeight;
  const pad = 16;
  const maxX = Math.max(pad, window.innerWidth  - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);

  const rect = btnNo.getBoundingClientRect();
  const bx = rect.left + rect.width / 2;
  const by = rect.top + rect.height / 2;

  const base = Math.atan2(by - py, bx - px); // straight away from the cursor
  const flee = 240;                          // leap distance — keeps it fast
  const minGap = 170;                        // keep at least this clear of cursor
  const zone = headingZone();

  // Prefer the natural flee direction; peel sideways only if that spot is
  // off-screen or on the heading, so it slides along walls instead of cornering.
  const offsets = [0, 0.55, -0.55, 1.15, -1.15, 1.9, -1.9, Math.PI];
  let fallback = null;
  let fallbackDist = -1;

  for (const off of offsets) {
    const a = base + off;
    const x = clamp(bx + Math.cos(a) * flee - w / 2, pad, maxX);
    const y = clamp(by + Math.sin(a) * flee - h / 2, pad, maxY);
    if (rectsOverlap(x, y, w, h, zone)) continue;
    const dist = Math.hypot(x + w / 2 - px, y + h / 2 - py);
    if (dist > fallbackDist) { fallbackDist = dist; fallback = { x, y }; }
    if (dist >= minGap) return { x, y };
  }
  return fallback || { x: clamp(bx - w / 2, pad, maxX), y: clamp(by - h / 2, pad, maxY) };
}

function dodge(px, py) {
  if (caught) return;
  if (!btnNo.classList.contains("is-loose")) makeLoose();

  const spot = fleeSpot(px, py);
  btnNo.style.left = spot.x + "px";
  btnNo.style.top  = spot.y + "px";

  // Movement is continuous, but one lunge should only count as one dodge.
  const now = performance.now();
  if (now - lastCount > 140) {
    lastCount = now;
    dodges++;
    if (dodges >= DODGES_TO_CATCH) catchIt();
  }
}

function catchIt() {
  caught = true;
  btnNo.classList.add("is-caught");
  taunt.textContent = "tak jo no";
}

/* desktop: flee when the cursor gets close */
document.addEventListener("pointermove", (e) => {
  if (caught || e.pointerType !== "mouse") return;
  const rect = btnNo.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (Math.hypot(e.clientX - cx, e.clientY - cy) < 110) dodge(e.clientX, e.clientY);
});

/* mobile: a tap counts as a chase attempt until caught */
btnNo.addEventListener(
  "touchstart",
  (e) => {
    if (caught) return; // let the real click through
    e.preventDefault();
    const t = e.touches[0] || e.changedTouches[0];
    dodge(t ? t.clientX : 0, t ? t.clientY : 0);
  },
  { passive: false }
);

/* ============================================================
   Choosing → name screen
   ============================================================ */
btnYes.addEventListener("click", () => {
  choice = "yes";
  nameHeading.textContent = "jak se jmenuješ?";
  submitBtn.textContent = "jdu do toho";
  goToName();
});

btnNo.addEventListener("click", () => {
  if (!caught) return; // ignore clicks while it's still dodging
  choice = "no-but-caught";
  nameHeading.textContent = "Bylo nám to jasný... jméno?";
  submitBtn.textContent = "sorry no";
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
  if (choice === "no-but-caught") {
    doneHeading.textContent = `${first}, snad příští ročník.`;
    doneSub.textContent = "";
  } else {
    doneHeading.textContent = `${first}, jsi na startovce.`;
    doneSub.textContent = "Připravíme pro tebe Zubrowku 🍯";
  }
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
