(function () {
  "use strict";

  const D = window.PLOTGROUND;
  const $ = (sel) => document.querySelector(sel);
  const devColor = (dev) => D.developers[dev].color;

  /* ---------- Theme + menu ---------- */
  const isDark = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  $("#theme-toggle").addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("plotground-theme", next); } catch (e) {}
  });

  const menu = $("#nav-right");
  const menuBtn = $("#menu-toggle");
  menuBtn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Leaderboard ---------- */
  function modelLogo(dev) {
    const d = D.developers[dev];
    const inner = d.logo
      ? `<img src="${d.logo}" alt="" width="18" height="18">`
      : `<span class="model-logo-mono">${d.monogram}</span>`;
    return `<span class="model-logo" title="${dev}">${inner}</span>`;
  }

  const board = { tol: "acc5", sort: "acc", asc: false };

  function renderBoard() {
    const tol = board.tol;
    const rows = D.models.map((m) => ({ ...m, acc: m[tol], drop: m.acc5 - m.acc2 }));

    // Rank is always by accuracy at the selected tolerance; ties share a rank.
    const byAcc = [...rows].sort((a, b) => b.acc - a.acc);
    const rankOf = new Map();
    byAcc.forEach((r, i) => rankOf.set(r.name, i > 0 && r.acc === byAcc[i - 1].acc ? rankOf.get(byAcc[i - 1].name) : i + 1));

    const key = board.sort;
    rows.sort((a, b) => {
      const va = a[key], vb = b[key];
      const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return board.asc ? cmp : -cmp;
    });

    $("#acc-head").textContent = tol === "acc5" ? "Acc. ±5%" : "Acc. ±2%";
    document.querySelectorAll("#board-table th.sortable").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === key);
      th.classList.toggle("asc", th.dataset.sort === key && board.asc);
    });

    $("#board-body").innerHTML = rows.map((r) => {
      const rank = rankOf.get(r.name);
      return `<tr>
        <td><span class="rank rank-${rank}">${rank}</span></td>
        <td><span class="model-cell">${modelLogo(r.dev)}<span class="model-name">${r.name}</span></span></td>
        <td class="dev" style="color:${devColor(r.dev)}">${r.dev}</td>
        <td class="num"><div class="acc-cell"><div class="acc-bar"><span style="width:${r.acc}%;background:${devColor(r.dev)}"></span></div><span class="acc-val">${r.acc.toFixed(1)}</span></div></td>
        <td class="num drop">−${r.drop.toFixed(1)}</td>
      </tr>`;
    }).join("");
  }

  document.querySelectorAll("#tol-switch button").forEach((btn) =>
    btn.addEventListener("click", () => {
      board.tol = btn.dataset.tol;
      document.querySelectorAll("#tol-switch button").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      renderBoard();
    })
  );

  document.querySelectorAll("#board-table th.sortable").forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (board.sort === key) board.asc = !board.asc;
      else { board.sort = key; board.asc = key === "name" || key === "dev" || key === "drop"; }
      renderBoard();
    })
  );

  /* ---------- Examples ---------- */
  function renderExamples() {
    const tabs = $("#example-tabs");
    tabs.innerHTML = D.examples.map((ex, i) =>
      `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}" class="${i === 0 ? "is-active" : ""}">${ex.type}</button>`
    ).join("");
    const show = (i) => {
      const ex = D.examples[i];
      tabs.querySelectorAll("button").forEach((b) => {
        const on = Number(b.dataset.i) === i;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      $("#example-body").innerHTML = `
        <div class="example-figure"><img src="${ex.img}" alt="${ex.type} plot example figure from a bioRxiv preprint"></div>
        <div class="example-qa">
          <div class="qa-block"><span class="qa-label">Question</span>${ex.q}</div>
          <div class="qa-block answer"><span class="qa-label">Source-grounded answer</span><span class="qa-value">${ex.a}</span></div>
          <p class="qa-note">Correct if the prediction is within ±5% (or ±2%) relative error of this value. The value is recomputed from the paper's deposited source table, not read from the image.</p>
        </div>`;
    };
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) show(Number(b.dataset.i));
    });
    show(0);
  }

  /* ---------- Citation ---------- */
  $("#citation-copy").addEventListener("click", async () => {
    const text = $("#citation-bibtex").textContent;
    const status = $("#citation-copy-status");
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied to clipboard.";
    } catch (e) {
      const range = document.createRange();
      range.selectNodeContents($("#citation-bibtex"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      status.textContent = "Selected — press Ctrl/Cmd+C to copy.";
    }
    setTimeout(() => (status.textContent = ""), 2500);
  });

  renderBoard();
  renderExamples();
})();
