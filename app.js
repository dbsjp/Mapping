(() => {
  "use strict";

  const { nodes, links } = window.SCHOOL_MAP;
  const app = document.querySelector("#app");
  const categories = ["Quality Assurance", "Strategy", "Curriculum", "Evidence", "Classroom Practice", "Dialogue & Review"];
  const icons = ["◎", "↗", "▦", "◌", "✦", "↻"];
  const categoryCopy = {
    "Quality Assurance": "How we evaluate quality and know where to improve.",
    Strategy: "How priorities become coordinated action.",
    Curriculum: "What students learn and how learning is sequenced.",
    Evidence: "What helps us understand need, progress and impact.",
    "Classroom Practice": "How our shared approaches shape everyday learning.",
    "Dialogue & Review": "How reflection, voice and conversation drive next steps.",
  };

  const state = { mode: "understand", category: null, focus: null, trail: [], expanded: new Set(), full: new Set() };
  const byId = (id) => nodes.find((node) => node.id === id);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const shortDescription = (text) => text.split(/(?<=[.!?])\s/)[0];

  function directConnections(id) {
    const incoming = links.filter((link) => link.target === id).map((link) => byId(link.source));
    const outgoing = links.filter((link) => link.source === id).map((link) => byId(link.target));
    return { incoming, outgoing };
  }

  function setUrl(replace = false) {
    const params = new URLSearchParams();
    if (state.mode !== "understand") params.set("mode", state.mode);
    if (state.category) params.set("category", state.category);
    if (state.focus) params.set("focus", state.focus);
    const url = `${location.pathname}${params.size ? `?${params}` : ""}`;
    history[replace ? "replaceState" : "pushState"]({ ...state, expanded: [], full: [] }, "", url);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(location.search);
    state.mode = params.get("mode") === "connections" ? "connections" : "understand";
    state.category = categories.includes(params.get("category")) ? params.get("category") : null;
    state.focus = byId(params.get("focus")) ? params.get("focus") : null;
    state.trail = [];
    if (state.category) state.trail.push({ type: "category", value: state.category, label: state.category });
    if (state.focus) state.trail.push({ type: "focus", value: state.focus, label: byId(state.focus).title });
  }

  function breadcrumbs() {
    if (!state.category && !state.focus && state.mode === "understand") return "";
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><button data-action="home">Home</button>${state.trail.map((item, index) => `<span>› <button data-crumb="${index}">${escapeHtml(item.label)}</button></span>`).join("")}</nav>`;
  }

  function itemCard(node, relation = "") {
    const expanded = state.expanded.has(node.id);
    const full = state.full.has(node.id);
    const concise = shortDescription(node.description);
    return `<div class="card-wrap">${relation ? `<span class="relation-label">${escapeHtml(relation)}</span>` : ""}<article class="item-card${expanded ? " open" : ""}">
      <div class="item-top"><span>${escapeHtml(node.group)}</span><button class="info-button" data-info="${node.id}" aria-expanded="${expanded}" aria-label="${expanded ? "Hide" : "Understand"} ${escapeHtml(node.title)}">${expanded ? "×" : "i"}</button></div>
      <h3>${escapeHtml(node.title)}</h3>
      ${expanded ? `<div class="reveal"><p>${escapeHtml(full ? node.description : concise)}</p>${node.description !== concise ? `<button class="text-button" data-full="${node.id}">${full ? "Show less" : "Read full description"}</button>` : ""}</div>` : ""}
      <button class="explore-button" data-focus="${node.id}">Explore connections <span aria-hidden="true">→</span></button>
    </article></div>`;
  }

  function homeView() {
    return `<section class="hero"><div><p class="eyebrow">DBSJP SCHOOL INTERCONNECTIVITY</p><h1>Understand<br>our school<span class="accent">.</span></h1><p class="lede">Explore how the key systems, processes and practices across DBSJP work — and how they connect.</p></div><div class="orbit" aria-hidden="true"><span class="orbit-dot"></span><div class="orbit-copy">Start simple.<span>See the connections.</span></div></div></section>
    <section><div class="section-heading"><div><p class="eyebrow">SIX PLACES TO START</p><h2>Choose an area to explore</h2></div><p>Select a card to meet the systems and practices within it. You can follow connections in any direction from there.</p></div><div class="category-grid">${categories.map((category, index) => `<button class="category-card" data-category="${escapeHtml(category)}" data-index="${index}"><span class="category-icon" aria-hidden="true">${icons[index]}</span><span class="category-count">0${nodes.filter((node) => node.group === category).length}</span><h3>${escapeHtml(category)}</h3><p>${escapeHtml(categoryCopy[category])}</p><span class="card-link">Explore area →</span></button>`).join("")}</div></section>`;
  }

  function categoryView() {
    const categoryNodes = nodes.filter((node) => node.group === state.category);
    return `<section class="category-hero"><p class="eyebrow">AREA OVERVIEW</p><h1>${escapeHtml(state.category)}<span class="accent">.</span></h1><p>${escapeHtml(categoryCopy[state.category])} Choose any item to understand it or follow its direct relationships.</p></section><div class="section-heading"><div><p class="eyebrow">${categoryNodes.length} ITEMS</p><h2>Explore this area</h2></div><p>There is no fixed order. Every item can become the centre of your journey.</p></div><div class="item-grid">${categoryNodes.map((node) => itemCard(node)).join("")}</div>`;
  }

  function focusView() {
    const focus = byId(state.focus);
    const { incoming, outgoing } = directConnections(focus.id);
    const cards = [
      ...outgoing.map((node) => itemCard(node, `${focus.title} influences ${node.title}`)),
      ...incoming.map((node) => itemCard(node, `${focus.title} is influenced by ${node.title}`)),
    ];
    return `<section class="focus-hero"><p class="eyebrow">CURRENT FOCUS · ${escapeHtml(focus.group)}</p><h1>${escapeHtml(focus.title)}<span class="accent">.</span></h1><p>${escapeHtml(shortDescription(focus.description))}</p><div class="focus-meta"><span>Influences ${outgoing.length}</span><span>Influenced by ${incoming.length}</span></div></section><div class="section-heading"><div><p class="eyebrow">DIRECT CONNECTIONS</p><h2>${cards.length} ways this connects</h2></div><p>Open a card to understand the item, or make it your new focus.</p></div><div class="item-grid">${cards.join("")}</div><div class="back-row"><button data-category="${escapeHtml(focus.group)}">← View all ${escapeHtml(focus.group)}</button></div>`;
  }

  function connectionsView() {
    const focus = byId(state.focus) || byId("maps");
    const { incoming, outgoing } = directConnections(focus.id);
    return `<section class="connections-intro"><p class="eyebrow">FOCUSED CONNECTION VIEW</p><h1>How does <span class="accent">${escapeHtml(focus.title)}</span> connect across our school?</h1><p>Choose any item. Only its direct relationships are shown.</p><label class="focus-select">Focus on<select id="focus-select">${nodes.map((node) => `<option value="${node.id}"${node.id === focus.id ? " selected" : ""}>${escapeHtml(node.title)} · ${escapeHtml(node.group)}</option>`).join("")}</select></label></section>
    <section class="connection-map" aria-label="Direct relationship view"><div class="legend"><span class="key">Influences</span><span class="key incoming">Influenced by</span><span class="definition">A → B means A influences B</span></div><div class="flow-layout"><div class="flow-column"><h2>Influenced by</h2>${incoming.length ? incoming.map((node) => `<button class="flow-node incoming" data-focus="${node.id}"><small>${escapeHtml(node.group)}</small><strong>${escapeHtml(node.title)}</strong></button>`).join("") : `<div class="empty-flow">No incoming influences mapped yet.</div>`}</div><button class="focus-node" data-focus="${focus.id}"><small>${escapeHtml(focus.group)}</small><strong>${escapeHtml(focus.title)}</strong><span>Current focus</span></button><div class="flow-column"><h2>Influences</h2>${outgoing.length ? outgoing.map((node) => `<button class="flow-node outgoing" data-focus="${node.id}"><small>${escapeHtml(node.group)}</small><strong>${escapeHtml(node.title)}</strong></button>`).join("") : `<div class="empty-flow">No outgoing influences mapped yet.</div>`}</div></div></section>`;
  }

  function render() {
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));
    let content;
    if (state.mode === "connections") content = connectionsView();
    else if (state.focus) content = focusView();
    else if (state.category) content = categoryView();
    else content = homeView();
    app.innerHTML = `<div class="shell">${breadcrumbs()}${content}</div>`;
  }

  function home(push = true) { state.mode = "understand"; state.category = null; state.focus = null; state.trail = []; state.expanded.clear(); state.full.clear(); if (push) setUrl(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function selectCategory(category) { state.mode = "understand"; state.category = category; state.focus = null; state.trail = [{ type: "category", value: category, label: category }]; setUrl(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function selectFocus(id) { const node = byId(id); state.focus = id; state.category = node.group; const existing = state.trail.findIndex((item) => item.type === "focus" && item.value === id); if (existing >= 0) state.trail = state.trail.slice(0, existing + 1); else state.trail.push({ type: "focus", value: id, label: node.title }); setUrl(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.dataset.action === "home") return home();
    if (button.dataset.mode) { state.mode = button.dataset.mode; if (state.mode === "connections" && !state.focus) state.focus = "maps"; setUrl(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (button.dataset.category) return selectCategory(button.dataset.category);
    if (button.dataset.focus) return selectFocus(button.dataset.focus);
    if (button.dataset.info) { state.expanded.has(button.dataset.info) ? state.expanded.delete(button.dataset.info) : state.expanded.add(button.dataset.info); render(); return; }
    if (button.dataset.full) { state.full.has(button.dataset.full) ? state.full.delete(button.dataset.full) : state.full.add(button.dataset.full); render(); return; }
    if (button.dataset.crumb !== undefined) { const index = Number(button.dataset.crumb); const item = state.trail[index]; state.trail = state.trail.slice(0, index + 1); if (item.type === "category") { state.category = item.value; state.focus = null; } else { state.focus = item.value; state.category = byId(item.value).group; } setUrl(); render(); }
  });
  document.addEventListener("change", (event) => { if (event.target.id === "focus-select") selectFocus(event.target.value); });
  addEventListener("popstate", () => { restoreFromUrl(); render(); });
  restoreFromUrl(); setUrl(true); render();
})();
