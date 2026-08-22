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

  const categoryColours = ["#071d3a", "#c81932", "#4f8cc9", "#0f315d", "#a91429", "#365f91"];
  const mapWidth = 1800;
  const mapHeight = 2100;
  const initialMapViewport = { x: 0, y: 0, width: mapWidth, height: 1000 };
  let mapViewport = { ...initialMapViewport };

  const state = { view: "explore", category: null, focus: null, mapFocus: null, mapMode: "all", trail: [], full: new Set() };
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
    if (state.view === "map") {
      params.set("view", "map");
      if (state.mapFocus) params.set("node", state.mapFocus);
    } else {
      if (state.category) params.set("category", state.category);
      if (state.focus) params.set("focus", state.focus);
    }
    const url = `${location.pathname}${params.size ? `?${params}` : ""}`;
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(location.search);
    state.view = params.get("view") === "map" ? "map" : "explore";
    state.category = categories.includes(params.get("category")) ? params.get("category") : null;
    state.focus = byId(params.get("focus")) ? params.get("focus") : null;
    state.mapFocus = byId(params.get("node")) ? params.get("node") : null;
    if (state.focus && !state.category) state.category = byId(state.focus).group;
    state.trail = [];
    if (state.category) state.trail.push({ type: "category", value: state.category, label: state.category });
    if (state.focus) state.trail.push({ type: "focus", value: state.focus, label: byId(state.focus).title });
  }

  function breadcrumbs() {
    if (state.view === "map") return `<nav class="breadcrumbs" aria-label="Breadcrumb"><button data-action="home">Home</button><span>› <button aria-current="page" data-map>Full school map</button></span></nav>`;
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
    <section><div class="section-heading"><div><p class="eyebrow">SIX PLACES TO START</p><h2>Choose an area to explore</h2></div><p>Select a card to see what shapes this area, what it influences and the items within it.</p></div><div class="category-grid">${categories.map((category, index) => `<button class="category-card" data-category="${escapeHtml(category)}" data-index="${index}"><span class="category-icon" aria-hidden="true">${icons[index]}</span><span class="category-count">0${nodes.filter((node) => node.group === category).length}</span><h3>${escapeHtml(category)}</h3><p>${escapeHtml(categoryCopy[category])}</p><span class="card-link">Explore area →</span></button>`).join("")}</div></section>
    <section class="map-callout"><div><p class="eyebrow">READY FOR THE COMPLETE PICTURE?</p><h2>See the whole school system<span class="accent">.</span></h2><p>View every mapped item and all 102 directional relationships together, then select a node to make its influences clear.</p></div><button type="button" data-map>View the full school map <span aria-hidden="true">→</span></button></section>`;
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

  function fullMapLayout() {
    return new Map(Object.entries({
      dsib: { x: 170, y: 120 }, bso: { x: 650, y: 120 }, taaleem: { x: 1130, y: 120 }, safeguarding: { x: 1630, y: 120 },
      sdp: { x: 280, y: 470 }, improvement: { x: 760, y: 470 }, mer: { x: 1240, y: 470 }, values: { x: 1630, y: 470 },
      maps: { x: 170, y: 820 }, descriptors: { x: 650, y: 820 }, super: { x: 1130, y: 820 }, core: { x: 1630, y: 820 },
      cat4: { x: 130, y: 1180 }, ngrt: { x: 430, y: 1180 }, data: { x: 730, y: 1180 }, context: { x: 1030, y: 1180 }, assessment: { x: 1330, y: 1180 }, inclusion: { x: 1630, y: 1180 },
      bigq: { x: 170, y: 1530 }, outcomes: { x: 520, y: 1530 }, criteria: { x: 870, y: 1530 }, ptc: { x: 1220, y: 1530 }, ppm: { x: 1630, y: 1530 },
      tutor: { x: 130, y: 1900 }, student_leadership: { x: 385, y: 1900 }, enrichment: { x: 640, y: 1900 }, careers: { x: 895, y: 1900 }, challenge: { x: 1150, y: 1900 }, far: { x: 1405, y: 1900 }, professional_development: { x: 1660, y: 1900 },
    }));
  }

  function mapEdgePoint(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const ratio = 1 / Math.max(Math.abs(dx) / 112, Math.abs(dy) / 49, 1);
    return { x: from.x + dx * ratio, y: from.y + dy * ratio };
  }

  function mapTitleLines(title) {
    const words = title.split(" ");
    const lines = [];
    words.forEach((word) => {
      const current = lines[lines.length - 1];
      if (!current || `${current} ${word}`.length > 22) lines.push(word);
      else lines[lines.length - 1] = `${current} ${word}`;
    });
    return lines.slice(0, 3);
  }

  function mapPanel() {
    if (!state.mapFocus) return `<aside class="map-panel"><p class="eyebrow">HOW TO USE THE MAP</p><h2>Select any item</h2><p>Every arrow uses the original relationship model: A → B means A influences B. Select a node to isolate what influences it and what it influences.</p><div class="map-panel-key"><span class="incoming">Influenced by</span><span class="outgoing">Influences</span></div></aside>`;
    const focus = byId(state.mapFocus);
    const { incoming, outgoing } = directConnections(focus.id);
    const list = (items) => items.length ? `<ul>${items.map((node) => `<li><button data-map-node="${node.id}">${escapeHtml(node.title)}</button></li>`).join("")}</ul>` : `<p class="map-none">None mapped</p>`;
    return `<aside class="map-panel"><p class="eyebrow">CURRENT FOCUS · ${escapeHtml(focus.group)}</p><h2>${escapeHtml(focus.title)}</h2><p>${escapeHtml(shortDescription(focus.description))}</p><div class="map-panel-links"><section><h3>Influenced by <span>${incoming.length}</span></h3>${list(incoming)}</section><section><h3>Influences <span>${outgoing.length}</span></h3>${list(outgoing)}</section></div><div class="map-panel-actions"><button class="primary" data-map-explore="${focus.id}">Explore as cards →</button><button data-map-clear>Show all relationships</button></div></aside>`;
  }

  function fullMapView() {
    const positions = fullMapLayout();
    const selected = state.mapFocus;
    const focusSelected = selected && state.mapMode === "focus";
    const related = selected ? directConnections(selected) : { incoming: [], outgoing: [] };
    const incomingIds = new Set(related.incoming.map((node) => node.id));
    const outgoingIds = new Set(related.outgoing.map((node) => node.id));
    const relationshipClass = (source, target) => {
      if (!focusSelected) return "";
      if (source === selected) return " outgoing";
      if (target === selected) return " incoming";
      return " muted";
    };
    const nodeClass = (id) => {
      if (!focusSelected) return "";
      if (id === selected) return " focus";
      if (incomingIds.has(id) && outgoingIds.has(id)) return " both";
      if (incomingIds.has(id)) return " incoming";
      if (outgoingIds.has(id)) return " outgoing";
      return " muted";
    };
    const paths = links.map((link, index) => {
      const source = positions.get(link.source);
      const target = positions.get(link.target);
      const start = mapEdgePoint(source, target);
      const end = mapEdgePoint(target, source);
      const reverse = links.some((candidate) => candidate.source === link.target && candidate.target === link.source);
      const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
      const offset = reverse ? (link.source < link.target ? 7 : -7) : 0;
      const offsetX = -(end.y - start.y) / length * offset;
      const offsetY = (end.x - start.x) / length * offset;
      const kind = relationshipClass(link.source, link.target);
      const marker = kind.includes("outgoing") ? "map-arrow-out" : kind.includes("incoming") ? "map-arrow-in" : "map-arrow";
      const path = `M ${start.x + offsetX} ${start.y + offsetY} L ${end.x + offsetX} ${end.y + offsetY}`;
      return `<path class="map-link-halo${kind}" d="${path}"/><path class="map-link${kind}" data-source="${link.source}" data-target="${link.target}" d="${path}" marker-end="url(#${marker})"/>`;
    }).join("");
    const mapNodes = nodes.map((node) => {
      const position = positions.get(node.id);
      const lines = mapTitleLines(node.title);
      return `<g class="map-node${nodeClass(node.id)}" data-map-node="${node.id}" role="button" tabindex="0" aria-label="${escapeHtml(node.title)}, ${escapeHtml(node.group)}" transform="translate(${position.x - 112} ${position.y - 49})"><rect width="224" height="98" rx="16" style="--node-colour:${categoryColours[categories.indexOf(node.group)]}"/><text class="map-node-title" x="16" y="${lines.length === 1 ? 38 : lines.length === 2 ? 29 : 21}">${lines.map((line, index) => `<tspan x="16" dy="${index ? 17 : 0}">${escapeHtml(line)}</tspan>`).join("")}</text><text class="map-node-group" x="16" y="82">${escapeHtml(node.group)}</text></g>`;
    }).join("");
    return `<section class="map-intro"><div><p class="eyebrow">THE COMPLETE PICTURE</p><h1>See the whole school system<span class="accent">.</span></h1><p>Explore all 30 school systems, processes and practices and all 102 directional relationships. Select any item to make its direct influences clear.</p></div><div class="map-stat"><strong>30</strong><span>items</span></div><div class="map-stat"><strong>102</strong><span>relationships</span></div></section>
      <div class="map-toolbar" aria-label="Map controls"><div class="map-mode-switch" aria-label="Relationship display"><button data-map-mode="all" class="${state.mapMode === "all" ? "active" : ""}">All relationships</button><button data-map-mode="focus" class="${state.mapMode === "focus" ? "active" : ""}"${selected ? "" : " disabled"}>Focus on selection</button></div><div class="map-legend"><span class="incoming">Influenced by</span><span class="outgoing">Influences</span><span>A → B means A influences B</span></div><div><button data-map-zoom="in" aria-label="Zoom in">+</button><button data-map-zoom="out" aria-label="Zoom out">−</button><button data-map-reset>Back to the top</button></div></div>
      <div class="full-map-layout"><div class="map-canvas"><svg id="full-school-map" viewBox="${mapViewport.x} ${mapViewport.y} ${mapViewport.width} ${mapViewport.height}" role="img" aria-label="Complete network of 30 school items and 102 directional relationships"><defs><marker id="map-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z"/></marker><marker id="map-arrow-in" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z"/></marker><marker id="map-arrow-out" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z"/></marker></defs><rect class="map-board" width="${mapWidth}" height="${mapHeight}"/><g class="map-links">${paths}</g><g class="map-nodes">${mapNodes}</g></svg><p class="map-hint">Drag to move through the map · Scroll or use the controls to zoom</p></div>${mapPanel()}</div>`;
  }

  function initialiseMap() {
    const svg = document.querySelector("#full-school-map");
    if (!svg) return;
    const applyViewBox = () => svg.setAttribute("viewBox", `${mapViewport.x} ${mapViewport.y} ${mapViewport.width} ${mapViewport.height}`);
    const zoom = (factor, anchorX = .5, anchorY = .5) => {
      const aspect = mapViewport.height / mapViewport.width;
      const nextWidth = Math.max(620, Math.min(mapWidth, mapViewport.width * factor));
      const nextHeight = nextWidth * aspect;
      mapViewport.x += (mapViewport.width - nextWidth) * anchorX;
      mapViewport.y += (mapViewport.height - nextHeight) * anchorY;
      mapViewport.width = nextWidth; mapViewport.height = nextHeight;
      mapViewport.x = Math.max(0, Math.min(mapWidth - nextWidth, mapViewport.x));
      mapViewport.y = Math.max(0, Math.min(mapHeight - nextHeight, mapViewport.y));
      applyViewBox();
    };
    let drag = null;
    svg.addEventListener("pointerdown", (event) => { if (event.target.closest(".map-node")) return; drag = { x: event.clientX, y: event.clientY, viewX: mapViewport.x, viewY: mapViewport.y }; svg.setPointerCapture(event.pointerId); svg.classList.add("dragging"); });
    svg.addEventListener("pointermove", (event) => { if (!drag) return; const rect = svg.getBoundingClientRect(); mapViewport.x = Math.max(0, Math.min(mapWidth - mapViewport.width, drag.viewX - (event.clientX - drag.x) * mapViewport.width / rect.width)); mapViewport.y = Math.max(0, Math.min(mapHeight - mapViewport.height, drag.viewY - (event.clientY - drag.y) * mapViewport.height / rect.height)); applyViewBox(); });
    const endDrag = () => { drag = null; svg.classList.remove("dragging"); };
    svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", endDrag);
    svg.addEventListener("wheel", (event) => { event.preventDefault(); const rect = svg.getBoundingClientRect(); zoom(event.deltaY < 0 ? .86 : 1.16, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height); }, { passive: false });
    document.querySelectorAll("[data-map-zoom]").forEach((button) => button.addEventListener("click", () => zoom(button.dataset.mapZoom === "in" ? .8 : 1.25)));
  }

  function render() {
    const content = state.view === "map" ? fullMapView() : state.focus ? focusView() : state.category ? categoryView() : homeView();
    app.innerHTML = `<div class="shell">${breadcrumbs()}${content}</div>`;
    initialiseMap();
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function home(push = true) {
    state.view = "explore"; state.category = null; state.focus = null; state.mapFocus = null; state.trail = []; state.full.clear();
    if (push) setUrl(); render(); scrollToTop();
  }

  function selectCategory(category) {
    state.view = "explore"; state.category = category; state.focus = null; state.mapFocus = null; state.full.clear();
    state.trail = [{ type: "category", value: category, label: category }];
    setUrl(); render(); scrollToTop();
  }

  function selectFocus(id) {
    const node = byId(id);
    if (!node) return;
    state.view = "explore"; state.focus = id; state.mapFocus = null; state.category ||= node.group; state.full.clear();
    const existing = state.trail.findIndex((item) => item.type === "focus" && item.value === id);
    if (existing >= 0) state.trail = state.trail.slice(0, existing + 1);
    else state.trail.push({ type: "focus", value: id, label: node.title });
    setUrl(); render(); scrollToTop();
  }

  function showMap(id = null) {
    state.view = "map"; state.mapFocus = byId(id) ? id : null; state.mapMode = id ? "focus" : "all"; state.focus = null; state.category = null; state.trail = []; state.full.clear(); mapViewport = { ...initialMapViewport };
    setUrl(); render(); scrollToTop();
  }

  function selectMapNode(id) {
    if (!byId(id)) return;
    state.mapFocus = id; state.mapMode = "focus";
    setUrl(); render();
  }

  document.addEventListener("click", (event) => {
    const mapNode = event.target.closest("[data-map-node]");
    if (mapNode) return selectMapNode(mapNode.dataset.mapNode);
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "home") return home();
    if (button.hasAttribute("data-map")) return showMap();
    if (button.dataset.mapExplore) return selectFocus(button.dataset.mapExplore);
    if (button.hasAttribute("data-map-clear")) { state.mapFocus = null; state.mapMode = "all"; setUrl(); render(); return; }
    if (button.dataset.mapMode) { if (button.dataset.mapMode === "focus" && !state.mapFocus) return; state.mapMode = button.dataset.mapMode; render(); return; }
    if (button.hasAttribute("data-map-reset")) { mapViewport = { ...initialMapViewport }; render(); return; }
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

  document.addEventListener("keydown", (event) => {
    const mapNode = event.target.closest(".map-node[data-map-node]");
    if (mapNode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectMapNode(mapNode.dataset.mapNode); }
  });

  addEventListener("popstate", () => { restoreFromUrl(); state.full.clear(); render(); });
  restoreFromUrl(); setUrl(true); render();
})();
