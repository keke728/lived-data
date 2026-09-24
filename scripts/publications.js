/* Publications: cards, filters, and the featured-work carousel. */
(() => {
  const featuredPublication = document.querySelector("#featured-publication");
  const publicationGrid = document.querySelector("#publication-grid");
  const publicationFilters = document.querySelector("#publication-filters");
  const filterReset = document.querySelector("#publication-filter-reset");
  const publicationSearch = document.querySelector("#publication-search");
  const searchToggle = document.querySelector("#publication-search-toggle");
  const searchPanel = document.querySelector("#publication-search-panel");
  const resultCount = document.querySelector("#publication-result-count");
  const featuredPosition = document.querySelector("#featured-position");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!featuredPublication || !publicationGrid || !publicationFilters) return;

  const publications = [...(window.LDC_PUBLICATIONS || [])].sort((a, b) => b.year - a.year);
  const resourceIcons = {
    web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.2 3.5 5 3.5 8S14.3 17.8 12 20c-2.3-2.2-3.5-5-3.5-8S9.7 6.2 12 4"/></svg>',
    paper: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    poster: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12v12H4z"/><path d="m10 10 4 2-4 2M16 10l4-2v8l-4-2"/></svg>',
  };
  const resourceLabels = {
    web: "Open web version",
    paper: "Read paper PDF",
    poster: "View poster PDF",
    video: "Watch talk",
  };
  const resourceSlots = [
    ["paper", "poster"],
    ["web"],
    ["video"],
  ];
  const filterLabels = { type: "Type", venue: "Venue", year: "Year", theme: "Theme" };
  const filterOptions = Object.fromEntries(Object.keys(filterLabels).map((field) => {
    const values = [...new Set(publications.map((work) => String(work[field] || "")).filter(Boolean))];
    return [field, field === "year" ? values.sort((a, b) => Number(b) - Number(a)) : values.sort()];
  }));
  const filterState = Object.fromEntries(Object.keys(filterLabels).map((field) => [field, ""]));
  const featuredWorks = publications.slice(0, 5);
  const featuredDots = featuredWorks.map((work, index) => {
    const dot = document.createElement("button");
    dot.className = "publication-carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show featured work ${index + 1}`);
    featuredPosition.before(dot);
    return dot;
  });
  let featuredIndex = 0;

  const formatAuthorName = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return name;
    return `${parts.slice(0, -1).map((part) => `${part[0]}.`).join(" ")} ${parts.at(-1)}`;
  };

  const formatAuthors = (work, featured = false) => work.authors.map((author, index) => {
    const label = formatAuthorName(author);
    const name = work.labMembers.includes(author)
      ? `<span class="publication-author-lab-member">${label}</span>`
      : label;
    const separator = index === work.authors.length - 1 ? "" : index === work.authors.length - 2 ? " and " : ", ";
    const lineBreak = featured && author === work.featuredAuthorBreakBefore ? "<br>" : "";
    return `${lineBreak}${name}${separator}`;
  }).join("");

  const formatTitle = (title) => title.replace(
    /Data (?:Visualization|Science)/g,
    '<span class="publication-title-phrase">$&</span>'
  );

  const getFilterValue = (work, field) => String(work[field]);
  const normalizeSearch = (text) => text.replace(/&nbsp;/g, " ").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const searchIndex = new Map(publications.map((work) => [work.id, normalizeSearch([
    work.title, work.summary, ...work.authors, ...work.authors.map(formatAuthorName),
    work.venue, work.year, work.type, work.theme,
  ].join(" "))]));

  const createPublicationCard = (work, featured = false) => {
    const cardClass = [
      "publication-card",
      featured ? "publication-card-featured" : "",
      !featured && work.archiveThumbnailFit === "cover" ? "archive-thumbnail-cover" : "",
      !featured && work.archiveThumbnailFit === "contain" ? "archive-thumbnail-contain" : "",
    ].filter(Boolean).join(" ");
    const thumbnailClass = work.thumbnailFit === "contain-dark"
      ? "publication-thumbnail is-contained is-dark-contained"
      : work.thumbnailFit === "contain"
        ? "publication-thumbnail is-contained"
        : "publication-thumbnail";
    const imageScale = featured ? work.featuredImageScale : work.archiveImageScale;
    const imageStyles = [
      featured && work.featuredThumbnailWidth ? `--featured-thumbnail-width: ${work.featuredThumbnailWidth}` : "",
      featured && work.featuredImageOffsetY ? `--featured-thumbnail-offset-y: ${work.featuredImageOffsetY}` : "",
      imageScale ? `--${featured ? "featured" : "archive"}-thumbnail-scale: ${imageScale}` : "",
      !featured && work.archiveImageOffsetY ? `--archive-thumbnail-offset-y: ${work.archiveImageOffsetY}` : "",
      work.archiveThumbnailBackground ? `--archive-thumbnail-background: ${work.archiveThumbnailBackground}` : "",
      work.thumbnailBlendMode ? `--thumbnail-blend-mode: ${work.thumbnailBlendMode}` : "",
    ].filter(Boolean);
    const imageStyle = imageStyles.length ? ` style="${imageStyles.join("; ")}"` : "";
    const primaryResource = work.links.find((link) => (link.type === "paper" || link.type === "poster") && link.url);
    const title = primaryResource
      ? `<a class="publication-title-link" href="${primaryResource.url}" target="_blank" rel="noreferrer" aria-label="Read ${work.title} PDF">${formatTitle(work.title)}</a>`
      : formatTitle(work.title);
    const resources = resourceSlots.map((types) => {
      const link = work.links.find((item) => types.includes(item.type) && item.url);
      if (!link) return '<span class="publication-resource-link is-empty" aria-hidden="true"></span>';

      const label = resourceLabels[link.type];
      const icon = `${resourceIcons[link.type]}<span class="sr-only">${label}</span>`;
      return `<a class="publication-resource-link" href="${link.url}" target="_blank" rel="noreferrer" aria-label="${label}">${icon}</a>`;
    }).join("");

    return `<article class="${cardClass}">
      <div class="${thumbnailClass}"${imageStyle}>${work.thumbnail ? `<img src="${work.thumbnail}" alt="" />` : ""}</div>
      <div class="publication-card-copy">
        <div class="publication-card-primary">
          <p class="publication-card-meta"><span class="publication-type-tag">${work.type}</span><span>${work.venue} · ${work.year}</span></p>
          <${featured ? "h3" : "h4"}>${title}</${featured ? "h3" : "h4"}>
          <p class="publication-card-summary">${work.summary}</p>
          <p class="publication-card-authors">${formatAuthors(work, featured)}</p>
        </div>
        <div class="publication-card-footer">${resources ? `<div class="publication-resource-links" aria-label="Publication resources">${resources}</div>` : ""}</div>
      </div>
    </article>`;
  };

  const closeFilterMenus = () => {
    publicationFilters.querySelectorAll(".publication-filter-control").forEach((control) => {
      control.classList.remove("is-open");
      control.querySelector(".publication-filter-trigger").setAttribute("aria-expanded", "false");
    });
  };

  const createPublicationCardElement = (work, featured) => {
    const template = document.createElement("template");
    template.innerHTML = createPublicationCard(work, featured).trim();
    return template.content.firstElementChild;
  };

  const renderFeaturedPublication = ({ animate = false, direction = 1 } = {}) => {
    if (!featuredWorks.length) return;
    const currentCard = [...featuredPublication.children].find(
      (card) => !card.classList.contains("is-leaving")
    );
    const nextCard = createPublicationCardElement(featuredWorks[featuredIndex], true);

    if (currentCard) {
      if (animate && !prefersReducedMotion) {
        const enterClass = direction >= 0 ? "is-entering-from-right" : "is-entering-from-left";
        const exitClass = direction >= 0 ? "is-leaving-to-left" : "is-leaving-to-right";
        nextCard.classList.add("is-entering", enterClass);
        currentCard.classList.add("is-leaving", exitClass);
        window.setTimeout(() => currentCard.remove(), 300);
      } else {
        currentCard.remove();
      }
    }

    featuredPublication.append(nextCard);
    featuredPosition.textContent = `${featuredIndex + 1} / ${featuredWorks.length}`;
    featuredDots.forEach((dot, index) => {
      const isActive = index === featuredIndex;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  };

  const renderArchive = () => {
    const searchTerms = normalizeSearch(publicationSearch.value).trim().split(/\s+/).filter(Boolean);
    const visibleWorks = publications.filter((work) =>
      searchTerms.every((term) => searchIndex.get(work.id).includes(term)) &&
      Object.entries(filterState).every(([field, value]) => !value || getFilterValue(work, field) === value)
    );
    filterReset.classList.toggle("has-active-filters", searchTerms.length > 0 || Object.values(filterState).some(Boolean));
    resultCount.textContent = `${visibleWorks.length} of ${publications.length} publications`;
    const yearGroups = new Map();
    visibleWorks.forEach((work) => {
      if (!yearGroups.has(work.year)) yearGroups.set(work.year, []);
      yearGroups.get(work.year).push(work);
    });
    publicationGrid.innerHTML = visibleWorks.length
      ? [...yearGroups].map(([year, works]) => `<section class="publication-year-group" aria-labelledby="publication-year-${year}">
          <h3 id="publication-year-${year}" class="publication-year-heading">${year}</h3>
          <div class="publication-year-papers">${works.map((work) => createPublicationCard(work)).join("")}</div>
        </section>`).join("")
      : '<p class="publication-empty">No publications found. Try another search or clear the filters.</p>';
  };

  const populateFilters = () => {
    Object.entries(filterOptions).forEach(([field, options]) => {
      const control = publicationFilters.querySelector(`[data-field="${field}"]`);
      const menu = control.querySelector(".publication-filter-menu");
      const allLabel = `All ${field === "type" ? "types" : `${field}s`}`;
      menu.innerHTML = ["", ...options].map((value, index) =>
        `<button class="publication-filter-option${index === 0 ? " is-selected" : ""}" type="button" aria-pressed="${index === 0}" data-value="${value}">${value || allLabel}</button>`
      ).join("");
    });
  };

  const setFilter = (control, value) => {
    const field = control.dataset.field;
    const trigger = control.querySelector(".publication-filter-trigger");
    filterState[field] = value;
    trigger.textContent = value ? `${filterLabels[field]}: ${value}` : filterLabels[field];
    trigger.classList.toggle("is-filtered", Boolean(value));
    control.querySelectorAll(".publication-filter-option").forEach((option) => {
      const isSelected = option.dataset.value === value;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-pressed", String(isSelected));
    });
    closeFilterMenus();
    renderArchive();
  };

  const resetFilters = () => {
    publicationSearch.value = "";
    Object.keys(filterState).forEach((field) => {
      const control = publicationFilters.querySelector(`[data-field="${field}"]`);
      const trigger = control.querySelector(".publication-filter-trigger");
      filterState[field] = "";
      trigger.textContent = filterLabels[field];
      trigger.classList.remove("is-filtered");
      control.querySelectorAll(".publication-filter-option").forEach((option) => {
        const isAllOption = option.dataset.value === "";
        option.classList.toggle("is-selected", isAllOption);
        option.setAttribute("aria-pressed", String(isAllOption));
      });
    });
    closeFilterMenus();
    renderArchive();
  };

  populateFilters();
  renderFeaturedPublication();
  renderArchive();

  publicationFilters.addEventListener("click", (event) => {
    const trigger = event.target.closest(".publication-filter-trigger");
    const option = event.target.closest(".publication-filter-option");
    if (trigger) {
      const control = trigger.closest(".publication-filter-control");
      const willOpen = !control.classList.contains("is-open");
      closeFilterMenus();
      control.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    }
    if (option) setFilter(option.closest(".publication-filter-control"), option.dataset.value);
  });

  filterReset.addEventListener("click", resetFilters);
  publicationSearch.addEventListener("input", renderArchive);

  const setSearchExpanded = (expanded) => {
    searchPanel.hidden = !expanded;
    searchToggle.setAttribute("aria-expanded", String(expanded));
    if (expanded) {
      closeFilterMenus();
      publicationSearch.focus();
    } else {
      publicationSearch.value = "";
      renderArchive();
      searchToggle.focus();
    }
  };
  searchToggle.addEventListener("click", () => setSearchExpanded(searchPanel.hidden));
  publicationSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchExpanded(false);
    }
  });

  featuredDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (index === featuredIndex) return;
      const direction = index > featuredIndex ? 1 : -1;
      featuredIndex = index;
      renderFeaturedPublication({ animate: true, direction });
    });
  });

  if (featuredWorks.length > 1 && !prefersReducedMotion) {
    window.setInterval(() => {
      if (document.hidden) return;
      featuredIndex = (featuredIndex + 1) % featuredWorks.length;
      renderFeaturedPublication({ animate: true, direction: 1 });
    }, 3000);
  }

  document.addEventListener("pointerdown", (event) => {
    if (!publicationFilters.contains(event.target)) closeFilterMenus();
  });
  document.addEventListener("focusin", (event) => {
    if (!publicationFilters.contains(event.target)) closeFilterMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeFilterMenus();
  });
})();
