const MN = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ],
  DN = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
  DF = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
const $ = (s) => document.querySelector(s),
  p2 = (n) => String(n).padStart(2, "0"),
  K = (y, m, d) => `${y}-${p2(m + 1)}-${p2(d)}`;
const COL = {
  partita: "#e5534b",
  riunione: "#e0a030",
  campionato: "#9f30e0",
  milsim: "#196810",
  altro: "#4a90d9",
};
const TL = {
  partita: "Partita",
  riunione: "Riunione",
  campionato: "Campionato",
  milsim: "MilSim",
  altro: "Altro",
};
const NOW = new Date(),
  TD = K(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()),
  mob = () => matchMedia("(max-width: 900px)").matches;
let D, Y, M, sel, evId;

const evs = (k) =>
  D.events
    .filter((e) => e.date === k)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
const att = (k, m) => (D.attendance[k] || []).includes(m);
const ty = (e) => (COL[e.type] ? e.type : "altro");
const chip = (e) =>
  `<span class=chip style="background:${COL[ty(e)]}">${TL[ty(e)]}</span>`;
const note = (e) =>
  e.notes && e.notes.trim().toUpperCase() !== "N/A"
    ? `<p>${e.notes}</p>`
    : "";

// 4 giornate di gioco del mese: da data.json, altrimenti le prime 4 domeniche
function gd(y, m) {
  const ym = y + "-" + p2(m + 1);
  if (D.game_days[ym]) return D.game_days[ym];
  const r = [];
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++)
    if (new Date(y, m, d).getDay() == 0) r.push(K(y, m, d));
  return r.slice(0, 4);
}

function cal() {
  $("#ml").textContent = MN[M] + " " + Y;
  const g = gd(Y, M),
    off = (new Date(Y, M, 1).getDay() + 6) % 7,
    n = new Date(Y, M + 1, 0).getDate();
  let h =
    DN.map((d) => `<div class=wd>${d}</div>`).join("") +
    "<div></div>".repeat(off);
  for (let d = 1; d <= n; d++) {
    const k = K(Y, M, d),
      cls =
        "day" +
        (k == sel ? " sel" : "") +
        (g.includes(k) ? " gd" : "") +
        (k == TD ? " td" : "");
    h += `<div class="${cls}" data-k=${k}>${d}<i>${evs(k)
      .slice(0, 3)
      .map((e) => `<u style="background:${COL[ty(e)]}"></u>`)
      .join("")}</i></div>`;
  }
  $("#grid").innerHTML = h;
  document.querySelectorAll(".day").forEach(
    (e) =>
      (e.onclick = () => {
        sel = e.dataset.k;
        evId = null;
        render();
      }),
  );
}

function legend() {
  $("#lg").innerHTML =
    Object.keys(TL)
      .map((t) => `<span><u style="background:${COL[t]}"></u>${TL[t]}</span>`)
      .join("") + `<span><span class=g></span>Giornata di gioco</span>`;
}

function cur() {
  const l = evs(sel);
  return l.find((x) => x.id == evId) || l[0];
}

function det() {
  const e = cur(),
    d = new Date(sel + "T00:00");
  $("#det").innerHTML =
    `<div class=hd><h2>DETTAGLIO EVENTO</h2></div><div class=ev>` +
    (e
      ? `<div class=in>${chip(e)}<h3>${e.title}</h3><p>📍 ${e.place || "-"}</p><p>🕒 Ore ${e.time || "-"}</p>${note(e)}</div>`
      : `<div class=in><h3>Nessun evento</h3></div>`) +
    `<div class=db>${DF[d.getDay()].toUpperCase()}<b>${d.getDate()}</b>${MN[d.getMonth()].toUpperCase()}</div></div>`;
}

function dayl() {
  const l = evs(sel),
    c = cur();
  $("#day").innerHTML = l.length
    ? l
        .map(
          (e) =>
            `<div class="it${c && e.id == c.id ? " act" : ""}" data-i=${e.id} style="border-left-color:${COL[ty(e)]}"><b>${e.title}</b>${chip(e)}<p>📍 ${e.place || "-"}</p><p>🕒 Ore ${e.time || "-"}</p>${note(e)}</div>`,
        )
        .join("")
    : "<p class=mu>Nessun evento in questa data.</p>";
  document.querySelectorAll(".it").forEach(
    (x) =>
      (x.onclick = () => {
        evId = x.dataset.i;
        det();
        document
          .querySelectorAll(".it")
          .forEach((y) => y.classList.toggle("act", y === x));
        // su telefono il dettaglio è più in basso: ci scorro sopra
        if (mob()) $("#det").scrollIntoView({ behavior: "smooth" });
      }),
  );
}

function tab() {
  const g = gd(Y, M),
    f = $("#flt").value;
  let h = `<tr><th>Membro</th>${g.map((k) => `<th>${+k.slice(8)} ${MN[+k.slice(5, 7) - 1].slice(0, 3)}</th>`).join("")}<th>Presenze</th></tr>`,
    rows = 0;
  D.members.forEach((m) => {
    const c = g.filter((k) => att(k, m)).length,
      ok = c >= 2;
    if ((f == "ok" && !ok) || (f == "ko" && ok)) return;
    rows++;
    h += `<tr><td>${m}</td>${g.map((k) => `<td><span class="c ${att(k, m) ? 'y">✓' : 'n">✕'}</span></td>`).join("")}<td><span class="bd ${ok ? "ok" : "ko"}"><b>${c}/${g.length}</b><span class=lbl>${ok ? "Sufficienti" : "Insufficienti"}</span></span></td></tr>`;
  });
  if (!rows)
    h += `<tr><td colspan=${g.length + 2} class=mu>Nessun membro con questo filtro.</td></tr>`;
  $("#tb").innerHTML = h;
}

const render = () => {
  cal();
  det();
  dayl();
  tab();
};
const go = (n) => {
  M += n;
  if (M < 0) {
    M = 11;
    Y--;
  }
  if (M > 11) {
    M = 0;
    Y++;
  }
  cal();
  tab();
};

$("#pv").onclick = () => go(-1);
$("#nx").onclick = () => go(1);
$("#tdb").onclick = () => {
  sel = TD;
  evId = null;
  Y = NOW.getFullYear();
  M = NOW.getMonth();
  render();
};
$("#flt").onchange = tab;

// swipe a destra/sinistra sul calendario per cambiare mese
let sx = null,
  sy = null;
$("#grid").addEventListener(
  "touchstart",
  (e) => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  },
  { passive: true },
);
$("#grid").addEventListener(
  "touchend",
  (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx,
      dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(dx < 0 ? 1 : -1);
    sx = sy = null;
  },
  { passive: true },
);

// voce di menu attiva
const links = [...document.querySelectorAll("nav a")];
links.forEach((a) =>
  a.addEventListener("click", () =>
    links.forEach((x) => x.classList.toggle("on", x === a)),
  ),
);

fetch("data/data.json?" + Date.now())
  .then((r) => r.json())
  .then((j) => {
    D = j;
    // normalizza le date: accetta sia "2027/01/17" che "2027-01-17"
    const nd = (s) => String(s || "").trim().replace(/\//g, "-");
    D.events.forEach((e) => (e.date = nd(e.date)));
    const s = [...D.events].sort((a, b) => a.date.localeCompare(b.date)),
      e = s.find((x) => x.date >= TD) || s[s.length - 1];
    sel = e ? e.date : TD;
    Y = +sel.slice(0, 4);
    M = +sel.slice(5, 7) - 1;
    legend();
    render();
  })
  .catch(() =>
    document.body.insertAdjacentHTML(
      "beforeend",
      '<p style="padding:20px">Errore nel caricamento di data/data.json</p>',
    ),
  );