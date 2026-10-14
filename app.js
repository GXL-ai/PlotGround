(function () {
  "use strict";

  const D = window.PLOTGROUND;
  const $ = (sel) => document.querySelector(sel);
  const fmt = (n) => n.toLocaleString("en-US");
  const devColor = (dev) => D.developers[dev].color;
  const SVG_NS = "http://www.w3.org/2000/svg";

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
        <td class="model-name">${r.name}</td>
        <td><span class="dev"><span class="dot" style="background:${devColor(r.dev)}"></span>${r.dev}</span></td>
        <td class="num"><div class="acc-cell"><div class="acc-bar"><span style="width:${r.acc}%"></span></div><span class="acc-val">${r.acc.toFixed(1)}</span></div></td>
        <td class="num drop">−${r.drop.toFixed(1)}</td>
        <td class="num">${r.cost.toFixed(3)}</td>
        <td class="num">${fmt(r.tokens)}</td>
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
      else { board.sort = key; board.asc = key === "name" || key === "dev" || key === "cost" || key === "drop"; }
      renderBoard();
    })
  );

  /* ---------- Cost vs accuracy scatter ---------- */
  const tip = document.createElement("div");
  tip.className = "chart-tip";
  document.body.appendChild(tip);

  function el(name, attrs, text) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function renderScatter() {
    const host = $("#cost-chart");
    const W = 1000, H = 440, m = { t: 16, r: 24, b: 48, l: 56 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xMin = Math.log10(0.08), xMax = Math.log10(12);
    const yMin = 20, yMax = 95;
    const x = (c) => m.l + ((Math.log10(c) - xMin) / (xMax - xMin)) * iw;
    const y = (a) => m.t + (1 - (a - yMin) / (yMax - yMin)) * ih;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Scatter plot of accuracy at ±5% versus mean cost per question on a log scale" });

    [20, 30, 40, 50, 60, 70, 80, 90].forEach((v) => {
      svg.appendChild(el("line", { class: "gridline", x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
      svg.appendChild(el("text", { x: m.l - 10, y: y(v) + 4, "text-anchor": "end" }, v));
    });
    [0.1, 0.2, 0.5, 1, 2, 5, 10].forEach((v) => {
      svg.appendChild(el("line", { class: "gridline", x1: x(v), x2: x(v), y1: m.t, y2: H - m.b }));
      svg.appendChild(el("text", { x: x(v), y: H - m.b + 18, "text-anchor": "middle" }, v));
    });
    svg.appendChild(el("line", { class: "axis-domain", x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }));
    svg.appendChild(el("text", { class: "axis-title", x: m.l + iw / 2, y: H - 8, "text-anchor": "middle" }, "Mean cost per question (¢, log scale)"));
    svg.appendChild(el("text", { class: "axis-title", transform: `translate(14 ${m.t + ih / 2}) rotate(-90)`, "text-anchor": "middle" }, "Accuracy ±5% (%)"));

    // Pareto frontier: cheapest-first, keep strictly improving accuracy.
    const pareto = [];
    [...D.models].sort((a, b) => a.cost - b.cost).forEach((mdl) => {
      if (!pareto.length || mdl.acc5 > pareto[pareto.length - 1].acc5) pareto.push(mdl);
    });
    const onFront = new Set(pareto.map((p) => p.name));
    svg.appendChild(el("polyline", { class: "pareto-line", points: pareto.map((p) => `${x(p.cost)},${y(p.acc5)}`).join(" ") }));

    // Hand-tuned label offsets to avoid overlaps in the dense low-cost cluster.
    const offsets = {
      "GPT-5.6 Luna": [-10, -2, "end"], "GPT-5.6 Sol": [10, -6, "start"], "GPT-5.6 Terra": [-10, 4, "end"],
      "Gemini 3.7 Flash": [-10, 4, "end"], "Gemini 3.8 Flash": [10, 12, "start"], "Qwen3.8 Max": [10, -6, "start"],
      "Claude Opus 5": [10, 12, "start"], "Claude Sonnet 5": [-10, 4, "end"], "Gemini 3.1 Pro": [10, 4, "start"],
      "Qwen3.8 Flash": [10, 4, "start"], "Kimi K3": [-10, 4, "end"], "GLM-5.3 Flash": [10, 4, "start"],
      "Inkling": [10, 4, "start"], "MiniMax M3": [-6, -11, "end"], "DeepSeek V4.1 Flash": [10, 4, "start"],
      "DeepSeek V4 FV exp": [10, 4, "start"]
    };

    D.models.forEach((mdl) => {
      const cx = x(mdl.cost), cy = y(mdl.acc5);
      const c = el("circle", { cx, cy, r: 7, fill: devColor(mdl.dev) });
      c.style.fill = devColor(mdl.dev);
      c.addEventListener("mousemove", (e) => {
        tip.innerHTML = `<strong>${mdl.name}</strong>${mdl.dev}<br>±5%: ${mdl.acc5.toFixed(1)}% · ±2%: ${mdl.acc2.toFixed(1)}%<br>${mdl.cost.toFixed(3)}¢ / question`;
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top = e.clientY + 14 + "px";
        tip.style.opacity = 1;
      });
      c.addEventListener("mouseleave", () => (tip.style.opacity = 0));
      svg.appendChild(c);
      const [dx, dy, anchor] = offsets[mdl.name] || [10, 4, "start"];
      svg.appendChild(el("text", { class: "pt-label" + (onFront.has(mdl.name) ? " pareto" : ""), x: cx + dx, y: cy + dy, "text-anchor": anchor }, mdl.name));
    });

    host.innerHTML = "";
    host.appendChild(svg);

    $("#dev-legend").innerHTML = Object.keys(D.developers).map((d) =>
      `<span class="legend-item"><span class="dot" style="background:${devColor(d)}"></span>${d}</span>`
    ).join("");
  }

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

  /* ---------- Funnel ---------- */
  function renderFunnel() {
    const max = D.funnel[0].value;
    $("#funnel").innerHTML = D.funnel.map((f) => {
      return `<div class="funnel-row${f.final ? " final" : ""}">
        <span class="funnel-stage">${f.stage}</span>
        <div class="funnel-bar" style="--w:${((f.value / max) * 100).toFixed(1)}%">
          <span class="step">${f.step}</span>
          <span class="val">${fmt(f.value)} <small>${f.unit}${f.note ? " · " + f.note : ""}</small></span>
        </div></div>`;
    }).join("");
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
  renderScatter();
  renderExamples();
  renderFunnel();
})();
