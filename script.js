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
let D, Y, M, sel, evId;
const evs = (k) =>
  D.events
    .filter((e) => e.date === k)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
const att = (k, m) => (D.attendance[k] || []).includes(m);
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
    const k = K(Y, M, d);
    h += `<div class="day${k == sel ? " sel" : ""}${g.includes(k) ? " gd" : ""}" data-k=${k}>${d}<i>${evs(
      k,
    )
      .slice(0, 3)
      .map((e) => `<u style="background:${COL[e.type] || COL.altro}"></u>`)
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
function det() {
  const l = evs(sel),
    e = l.find((x) => x.id == evId) || l[0],
    d = new Date(sel + "T00:00");
  $("#det").innerHTML =
    `<div class=hd><h2>DETTAGLIO EVENTO</h2></div><div class=ev>` +
    (e
      ? `<div class=in><h3>${e.title}</h3><p>📍 ${e.place || "-"}</p><p>🕒 Ore ${e.time || "-"}</p><p>${e.notes || ""}</p></div>`
      : `<div class=in><h3>Nessun evento</h3></div>`) +
    `<div class=db>${DF[d.getDay()].toUpperCase()}<b>${d.getDate()}</b>${MN[d.getMonth()].toUpperCase()}</div></div>`;
}
function dayl() {
  const l = evs(sel);
  $("#day").innerHTML = l.length
    ? l
        .map(
          (e) =>
            `<div class=it data-i=${e.id} style="border-left-color:${COL[e.type] || COL.altro}"><b>${e.title}</b><p>📍 ${e.place || "-"}</p><p>🕒 Ore ${e.time || "-"}</p><p>${e.notes || ""}</p></div>`,
        )
        .join("")
    : "<p class=mu>Nessun evento in questa data.</p>";
  document.querySelectorAll(".it").forEach(
    (x) =>
      (x.onclick = () => {
        evId = x.dataset.i;
        det();
      }),
  );
}
function tab() {
  const g = gd(Y, M),
    f = $("#flt").value;
  let h = `<tr><th>Membro</th>${g.map((k) => `<th>${+k.slice(8)} ${MN[+k.slice(5, 7) - 1].slice(0, 3)}</th>`).join("")}<th>Presenze</th></tr>`;
  D.members.forEach((m) => {
    const c = g.filter((k) => att(k, m)).length,
      ok = c >= 2;
    if ((f == "ok" && !ok) || (f == "ko" && ok)) return;
    h += `<tr><td>${m}</td>${g.map((k) => `<td><span class="c ${att(k, m) ? 'y">✓' : 'n">✕'}</span></td>`).join("")}<td>${c}/${g.length}<span class="bd ${ok ? "ok" : "ko"}">${ok ? "Presenze sufficienti" : "Presenze insufficienti"}</span></td></tr>`;
  });
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
$("#flt").onchange = tab;
fetch("data/data.json?" + Date.now())
  .then((r) => r.json())
  .then((j) => {
    D = j;
    const t = new Date().toISOString().slice(0, 10),
      s = [...D.events].sort((a, b) => a.date.localeCompare(b.date)),
      e = s.find((x) => x.date >= t) || s[s.length - 1];
    sel = e ? e.date : t;
    Y = +sel.slice(0, 4);
    M = +sel.slice(5, 7) - 1;
    render();
  })
  .catch(() =>
    document.body.insertAdjacentHTML(
      "beforeend",
      '<p style="padding:20px">Errore nel caricamento di data/data.json</p>',
    ),
  );
