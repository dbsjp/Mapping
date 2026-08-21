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

  const state = { category: null, focus: null, trail: [], full: new Set() };
  const byId = (id) => nodes.find((node) => node.id === id);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const shortDescription = (text) => text.split(/(?<=[.!?])\s/)[0];
  const uniqueNodes = (items) => [...new Map(items.filter(Boolean).map((node) => [node.id, node])).values()];

  function directConnections(id) {
    return {
      incoming: uniqueNodes(links.filter((link) => link.target === id).map((link) => byId(link.source))),
      outgoing: uniqueNodes(links.filter((link) => link.source === id).map((link) => byId(link.target))),
    };
  }

  function categoryConnections(category) {
    const ids = new Set(nodes.filter((node) => node.group === category).map((node) => node.id));
    return {
      incoming: uniqueNodes(links.filter((link) => ids.has(link.target) && !ids.has(link.source)).map((link) => byId(link.source))),
      outgoing: uniqueNodes(links.filter((link) => ids.has(link.source) && !ids.has(link.target)).map((link) => byId(link.target))),
    };
  }

  function setUrl(replace = false) {
    const params = new URLSearchParams();
    if (state.category) params.set("category", state.category);
    if (state.focus) params.set("focus", state.focus);
    const url = `${location.pathname}${params.size ? `?${params}` : ""}`;
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(location.search);
    state.category = categories.includes(params.get("category")) ? params.get("category") : null;
    state.focus = byId(params.get("focus")) ? params.get("focus") : null;
    if (state.focus && !state.category) state.category = byId(state.focus).group;
    state.trail = [];
    if (state.category) state.trail.push({ type: "category", value: state.category, label: state.category });
    if (state.focus) state.trail.push({ type: "focus", value: state.focus, label: byId(state.focus).title });
  }

  function breadcrumbs() {
    if (!state.category && !state.focus) return "";
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><button data-action="home">Home</button>${state.trail.map((item, index) => `<span>› <button data-crumb="${index}"${index === state.trail.length - 1 ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</button></span>`).join("")}</nav>`;
  }

  function itemCard(node) {
    const full = state.full.has(node.id);
    const concise = shortDescription(node.description);
    return `<article class="item-card${full ? " open" : ""}">
      <div class="item-top"><span>${escapeHtml(node.group)}</span><span class="summary-label">At a glance</span></div>
      <h3>${escapeHtml(node.title)}</h3>
      <div class="reveal"><p>${escapeHtml(full ? node.description : concise)}</p>${node.description !== concise ? `<button class="text-button" data-full="${node.id}" aria-expanded="${full}">${full ? "Show summary" : "Read full description"}</button>` : ""}</div>
      <button class="explore-button" data-focus="${node.id}">Explore connections <span aria-hidden="true">→</span></button>
    </article>`;
  }

  function relationshipSection(title, items, emptyMessage, modifier) {
    return `<section class="relationship-section ${modifier}" aria-labelledby="${modifier}-heading">
      <div class="relationship-heading"><div><p class="eyebrow">DIRECT CONNECTIONS</p><h2 id="${modifier}-heading">${escapeHtml(title)}</h2></div><span class="relationship-count">${items.length}</span></div>
      ${items.length ? `<div class="item-grid">${items.map(itemCard).join("")}</div>` : `<p class="empty-state">${escapeHtml(emptyMessage)}</p>`}
    </section>`;
  }

  function homeView() {
    return `<section class="hero"><div><p class="eyebrow">DUBAI BRITISH SCHOOL JUMEIRAH PARK · SCHOOL INTERCONNECTIVITY</p><h1>Understand<br>our school<span class="accent">.</span></h1><p class="lede">Explore how the key systems, processes and practices across Dubai British School Jumeirah Park work — and how they connect.</p></div><div class="orbit" aria-hidden="true"><span class="orbit-dot"></span><div class="orbit-copy">Start simple.<span>See the connections.</span></div></div></section>
    <section><div class="section-heading"><div><p class="eyebrow">SIX PLACES TO START</p><h2>Choose an area to explore</h2></div><p>Select a card to see what shapes this area, what it influences and the items within it.</p></div><div class="category-grid">${categories.map((category, index) => `<button class="category-card" data-category="${escapeHtml(category)}" data-index="${index}"><span class="category-icon" aria-hidden="true">${icons[index]}</span><span class="category-count">0${nodes.filter((node) => node.group === category).length}</span><h3>${escapeHtml(category)}</h3><p>${escapeHtml(categoryCopy[category])}</p><span class="card-link">Explore area →</span></button>`).join("")}</div></section>`;
  }

  function compactHero(label, title, description, incoming, outgoing) {
    return `<section class="focus-hero compact-hero"><div><p class="eyebrow">${escapeHtml(label)}</p><h1>${escapeHtml(title)}<span class="accent">.</span></h1><p>${escapeHtml(description)}</p></div><div class="focus-meta" aria-label="Relationship totals"><span>Influenced by ${incoming}</span><span>Influences ${outgoing}</span></div></section>`;
  }

  function categoryView() {
    const categoryNodes = nodes.filter((node) => node.group === state.category);
    const { incoming, outgoing } = categoryConnections(state.category);
    return `${compactHero("AREA OVERVIEW", state.category, categoryCopy[state.category], incoming.length, outgoing.length)}
      ${relationshipSection("Influenced by", incoming, `No direct influences into ${state.category} are currently mapped.`, "incoming")}
      ${relationshipSection("Influences", outgoing, `No direct influences from ${state.category} are currently mapped.`, "outgoing")}
      <section class="area-items" aria-labelledby="area-items-heading"><div class="relationship-heading"><div><p class="eyebrow">${categoryNodes.length} ITEMS</p><h2 id="area-items-heading">Explore this area</h2></div></div><p class="section-intro">Choose any item to understand it or make it the new focus.</p><div class="item-grid">${categoryNodes.map(itemCard).join("")}</div></section>`;
  }

  function focusView() {
    const focus = byId(state.focus);
    const { incoming, outgoing } = directConnections(focus.id);
    return `${compactHero(`CURRENT FOCUS · ${focus.group}`, focus.title, shortDescription(focus.description), incoming.length, outgoing.length)}
      ${relationshipSection("Influenced by", incoming, `${focus.title} has no incoming influences mapped yet.`, "incoming")}
      ${relationshipSection("Influences", outgoing, `${focus.title} has no outgoing influences mapped yet.`, "outgoing")}
      <div class="back-row"><button data-category="${escapeHtml(focus.group)}">← View all ${escapeHtml(focus.group)}</button></div>`;
  }

  function render() {
    const content = state.focus ? focusView() : state.category ? categoryView() : homeView();
    app.innerHTML = `<div class="shell">${breadcrumbs()}${content}</div>`;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function home(push = true) {
    state.category = null; state.focus = null; state.trail = []; state.full.clear();
    if (push) setUrl(); render(); scrollToTop();
  }

  function selectCategory(category) {
    state.category = category; state.focus = null; state.full.clear();
    state.trail = [{ type: "category", value: category, label: category }];
    setUrl(); render(); scrollToTop();
  }

  function selectFocus(id) {
    const node = byId(id);
    if (!node) return;
    state.focus = id; state.category ||= node.group; state.full.clear();
    const existing = state.trail.findIndex((item) => item.type === "focus" && item.value === id);
    if (existing >= 0) state.trail = state.trail.slice(0, existing + 1);
    else state.trail.push({ type: "focus", value: id, label: node.title });
    setUrl(); render(); scrollToTop();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "home") return home();
    if (button.dataset.category) return selectCategory(button.dataset.category);
    if (button.dataset.focus) return selectFocus(button.dataset.focus);
    if (button.dataset.full) {
      state.full.has(button.dataset.full) ? state.full.delete(button.dataset.full) : state.full.add(button.dataset.full);
      render(); return;
    }
    if (button.dataset.crumb !== undefined) {
      const index = Number(button.dataset.crumb);
      const item = state.trail[index];
      state.trail = state.trail.slice(0, index + 1);
      if (item.type === "category") { state.category = item.value; state.focus = null; }
      else { state.focus = item.value; }
      state.full.clear(); setUrl(); render(); scrollToTop();
    }
  });

  addEventListener("popstate", () => { restoreFromUrl(); state.full.clear(); render(); });
  restoreFromUrl(); setUrl(true); render();
})();
