// ========================================
// Cybersecurity Resources — App Logic
// Loads JSON, renders lists, handles
// filtering, collapsing, and sorting.
// ========================================

(function () {
  "use strict";

  const DATA_URL = "data/resources.json";

  // --- State ---
  let allResources = [];
  let activeTags = new Set();
  let collapsedCategories = new Set();

  // --- DOM References ---
  const dom = {
    tagContainer: document.getElementById("tag-container"),
    filterClear: document.getElementById("filter-clear"),
    filterStatus: document.getElementById("filter-status"),
    resourceContainer: document.getElementById("resource-container"),
    siteDescription: document.getElementById("site-description"),
    siteMeta: document.getElementById("site-meta"),
  };

  // --- Init ---
  async function init() {
    showLoading();
    try {
      const data = await loadJSON(DATA_URL);
      validateData(data);
      allResources = data.resources;

      // Set page metadata
      if (data.meta) {
        if (data.meta.description) {
          dom.siteDescription.textContent = data.meta.description;
        }
        if (data.meta.lastUpdated) {
          dom.siteMeta.textContent = `Last updated: ${data.meta.lastUpdated}`;
        }
      }

      renderTags();
      renderResources();
    } catch (err) {
      showError(err);
    }
  }

  // --- Data Loading ---
  async function loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load resources: HTTP ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON in resources file: ${e.message}`);
    }
  }

  function validateData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Resources file must contain a JSON object.");
    }
    if (!Array.isArray(data.resources)) {
      throw new Error(
        'Resources file must contain a "resources" array.'
      );
    }
    data.resources.forEach((r, i) => {
      if (!r.title || !r.url || !r.category) {
        throw new Error(
          `Resource at index ${i} is missing required fields (title, url, category).`
        );
      }
    });
  }

  // --- Tag Extraction & Rendering ---
  function getAllTags() {
    const tagMap = new Map();
    allResources.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    // Sort alphabetically
    return new Map([...tagMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }

  function getFilteredTagCounts() {
    const filtered = getFilteredResources();
    const tagMap = new Map();
    filtered.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  }

  function renderTags() {
    const allTags = getAllTags();
    const filteredCounts = activeTags.size > 0 ? getFilteredTagCounts() : allTags;

    dom.tagContainer.innerHTML = "";

    allTags.forEach((totalCount, tag) => {
      const displayCount = activeTags.size > 0
        ? (filteredCounts.get(tag) || 0)
        : totalCount;

      // While filtering, hide tags that have zero matches in the current
      // results so the sticky header doesn't show dead options. Active tags
      // stay visible so they can always be deselected.
      if (activeTags.size > 0 && displayCount === 0 && !activeTags.has(tag)) {
        return;
      }

      const btn = document.createElement("button");
      btn.className = "tag-btn" + (activeTags.has(tag) ? " active" : "");
      btn.type = "button";

      btn.innerHTML = `${escapeHTML(tag)}<span class="tag-count">${displayCount}</span>`;
      btn.addEventListener("click", () => toggleTag(tag));

      dom.tagContainer.appendChild(btn);
    });
  }

  // --- Filtering ---
  function toggleTag(tag) {
    if (activeTags.has(tag)) {
      activeTags.delete(tag);
    } else {
      activeTags.add(tag);
    }
    updateFilterUI();
    renderTags();
    renderResources();
  }

  function clearFilters() {
    activeTags.clear();
    updateFilterUI();
    renderTags();
    renderResources();
  }

  function updateFilterUI() {
    // Show/hide clear button
    dom.filterClear.classList.toggle("visible", activeTags.size > 0);

    // Update status text
    if (activeTags.size > 0) {
      const filtered = getFilteredResources();
      dom.filterStatus.textContent = `Showing ${filtered.length} resource${filtered.length !== 1 ? "s" : ""} matching ${activeTags.size} tag${activeTags.size !== 1 ? "s" : ""}`;
    } else {
      dom.filterStatus.textContent = `${allResources.length} resources across ${getCategoryCount()} categories`;
    }
  }

  function getFilteredResources() {
    if (activeTags.size === 0) return allResources;

    return allResources.filter((r) => {
      const resourceTags = r.tags || [];
      return [...activeTags].every((tag) => resourceTags.includes(tag));
    });
  }

  function getCategoryCount() {
    const categories = new Set(allResources.map((r) => r.category));
    return categories.size;
  }

  // --- Resource Rendering ---
  function renderResources() {
    const resources = getFilteredResources();

    if (resources.length === 0) {
      dom.resourceContainer.innerHTML =
        '<div class="empty-state">No resources match the selected filters.</div>';
      updateFilterUI();
      return;
    }

    // Group by category
    const grouped = groupByCategory(resources);

    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b)
    );

    dom.resourceContainer.innerHTML = "";

    sortedCategories.forEach((category) => {
      const items = grouped[category].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      const section = createCategorySection(category, items);
      dom.resourceContainer.appendChild(section);
    });

    updateFilterUI();
  }

  function groupByCategory(resources) {
    const groups = {};
    resources.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }

  function createCategorySection(category, items) {
    const section = document.createElement("div");
    section.className = "category-section";

    const isCollapsed = collapsedCategories.has(category);

    // Header
    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span class="category-title">${escapeHTML(category)}</span>
      <div class="category-meta">
        <span class="category-count">${items.length}</span>
        <span class="category-toggle">${isCollapsed ? "[+]" : "[−]"}</span>
      </div>
    `;
    header.addEventListener("click", () => {
      toggleCategory(category, body, header);
    });

    // Body
    const body = document.createElement("div");
    body.className = "category-body" + (isCollapsed ? " collapsed" : "");

    const list = document.createElement("ul");
    list.className = "resource-list";

    items.forEach((resource) => {
      list.appendChild(createResourceItem(resource));
    });

    body.appendChild(list);
    section.appendChild(header);
    section.appendChild(body);

    return section;
  }

  function createResourceItem(resource) {
    const li = document.createElement("li");
    li.className = "resource-item";

    // Link
    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = resource.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = resource.title;
    li.appendChild(link);

    // Download badge
    if (resource.downloadable) {
      const badge = document.createElement("span");
      badge.className = "resource-badge badge-download";
      badge.textContent = "Download";
      li.appendChild(badge);
    }

    // Description
    if (resource.description) {
      const desc = document.createElement("span");
      desc.className = "resource-desc";
      desc.textContent = resource.description;
      li.appendChild(desc);
    }

    return li;
  }

  // --- Category Collapse ---
  function toggleCategory(category, bodyEl, headerEl) {
    const isCollapsed = collapsedCategories.has(category);

    if (isCollapsed) {
      collapsedCategories.delete(category);
      bodyEl.classList.remove("collapsed");
      headerEl.querySelector(".category-toggle").textContent = "[−]";
    } else {
      collapsedCategories.add(category);
      bodyEl.classList.add("collapsed");
      headerEl.querySelector(".category-toggle").textContent = "[+]";
    }
  }

  // --- UI States ---
  function showLoading() {
    dom.resourceContainer.innerHTML =
      '<div class="loading">Loading resources...</div>';
  }

  function showError(err) {
    dom.resourceContainer.innerHTML = `
      <div class="error-message">
        Error loading resources
        <code>${escapeHTML(err.message)}</code>
      </div>
    `;
    console.error("Resource load error:", err);
  }

  // --- Utility ---
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Event Listeners ---
  dom.filterClear.addEventListener("click", clearFilters);

  // --- Start ---
  document.addEventListener("DOMContentLoaded", init);
})();
