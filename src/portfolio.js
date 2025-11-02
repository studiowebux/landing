// Portfolio.js - Dynamic project loading, filtering, and screenshot zoom
(function () {
  "use strict";

  let projectsData = [];
  let activeFilters = new Set();
  let portfolioLang = localStorage.getItem("language") || "en";

  document.addEventListener("DOMContentLoaded", async () => {
    // Get current language from localStorage (synced with script.js)
    portfolioLang = localStorage.getItem("language") || "en";

    // Listen for language changes
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        // Small delay to ensure localStorage is updated by script.js
        setTimeout(() => {
          portfolioLang = localStorage.getItem("language") || "en";
          renderProjects();
          updateFilterLabels();
        }, 50);
      });
    });

    // Load and render projects
    await loadProjects();
    setupImageModal();
  });

  // Load projects from JSON
  async function loadProjects() {
    try {
      const response = await fetch("projects.json");
      const data = await response.json();
      projectsData = data.projects || [];

      renderFilterTags();
      renderProjects();
    } catch (error) {
      console.error("Error loading projects:", error);
      showError();
    }
  }

  // Extract all unique tags from projects
  function getAllTags() {
    const tagsSet = new Set();
    projectsData.forEach((project) => {
      if (project.tags && Array.isArray(project.tags)) {
        project.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }

  // Render filter tags
  function renderFilterTags() {
    const filterContainer = document.getElementById("tag-filters");
    if (!filterContainer) return;

    const allTags = getAllTags();

    if (allTags.length === 0) {
      filterContainer.style.display = "none";
      return;
    }

    // Create "All" button
    const allButton = createFilterButton("All", "Tous", true);
    allButton.addEventListener("click", () => {
      activeFilters.clear();
      updateFilterButtons();
      renderProjects();
    });
    filterContainer.appendChild(allButton);

    // Create tag filter buttons
    allTags.forEach((tag) => {
      const button = createFilterButton(tag, tag, false);
      button.addEventListener("click", () => {
        toggleFilter(tag);
        updateFilterButtons();
        renderProjects();
      });
      filterContainer.appendChild(button);
    });
  }

  // Create a filter button element
  function createFilterButton(labelEn, labelFr, isAll = false) {
    const button = document.createElement("button");
    button.className = "filter-tag";
    button.dataset.tag = isAll ? "all" : labelEn;
    button.dataset.en = labelEn;
    button.dataset.fr = labelFr;
    button.textContent = portfolioLang === "fr" ? labelFr : labelEn;

    if (isAll && activeFilters.size === 0) {
      button.classList.add("active");
    }

    return button;
  }

  // Update filter button labels when language changes
  function updateFilterLabels() {
    const filterButtons = document.querySelectorAll(".filter-tag");
    filterButtons.forEach((button) => {
      const labelEn = button.dataset.en;
      const labelFr = button.dataset.fr;
      button.textContent = portfolioLang === "fr" ? labelFr : labelEn;
    });
  }

  // Toggle filter
  function toggleFilter(tag) {
    if (activeFilters.has(tag)) {
      activeFilters.delete(tag);
    } else {
      activeFilters.add(tag);
    }
  }

  // Update filter button states
  function updateFilterButtons() {
    const filterButtons = document.querySelectorAll(".filter-tag");

    filterButtons.forEach((button) => {
      const tag = button.dataset.tag;

      if (tag === "all") {
        button.classList.toggle("active", activeFilters.size === 0);
      } else {
        button.classList.toggle("active", activeFilters.has(tag));
      }
    });
  }

  // Render projects based on active filters
  function renderProjects() {
    const container = document.querySelector(".projects-grid");
    if (!container) return;

    container.innerHTML = "";

    const filteredProjects =
      activeFilters.size === 0
        ? projectsData
        : projectsData.filter((project) => {
            if (!project.tags) return false;
            return project.tags.some((tag) => activeFilters.has(tag));
          });

    if (filteredProjects.length === 0) {
      showNoResults(container);
      return;
    }

    filteredProjects.forEach((project) => {
      const card = createProjectCard(project);
      container.appendChild(card);
    });

    // Setup screenshot click handlers after rendering
    setupScreenshotHandlers();
  }

  // Create a project card element
  function createProjectCard(project) {
    const article = document.createElement("article");
    article.className = "project-card";

    // Project name
    const name = document.createElement("h2");
    name.className = "project-name";
    name.textContent = project.name;
    article.appendChild(name);

    // Tags
    if (project.tags && project.tags.length > 0) {
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "project-tags";
      project.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      article.appendChild(tagsDiv);
    }

    // Screenshots
    if (project.screenshots && project.screenshots.length > 0) {
      const screenshotsDiv = document.createElement("div");
      screenshotsDiv.className = "project-screenshots";
      project.screenshots.forEach((screenshot) => {
        const img = document.createElement("img");
        img.src = screenshot.url;
        img.alt = screenshot.alt || "Project screenshot";
        img.className = "screenshot-thumb";
        img.loading = "lazy";
        screenshotsDiv.appendChild(img);
      });
      article.appendChild(screenshotsDiv);
    }

    // Videos
    if (project.videos && project.videos.length > 0) {
      const videosDiv = document.createElement("div");
      videosDiv.className = "project-videos";
      project.videos.forEach((video) => {
        const link = document.createElement("a");
        link.href = video.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "video-link";

        const svg = createYouTubeIcon();
        link.appendChild(svg);

        const span = document.createElement("span");
        const label = video.label || { en: "Watch Video", fr: "Voir la vidéo" };
        span.textContent =
          typeof label === "object" ? label[portfolioLang] || label.en : label;
        link.appendChild(span);

        videosDiv.appendChild(link);
      });
      article.appendChild(videosDiv);
    }

    // Links
    if (project.links && Object.keys(project.links).length > 0) {
      const linksDiv = document.createElement("div");
      linksDiv.className = "project-links";

      if (project.links.github) {
        linksDiv.appendChild(
          createLinkButton("GitHub", project.links.github, createGitHubIcon()),
        );
      }
      if (project.links.website) {
        linksDiv.appendChild(
          createLinkButton(
            "Website",
            project.links.website,
            createWebsiteIcon(),
          ),
        );
      }
      if (project.links.npm) {
        linksDiv.appendChild(
          createLinkButton("NPM", project.links.npm, createNPMIcon()),
        );
      }
      if (project.links.jsr) {
        linksDiv.appendChild(
          createLinkButton("JSR", project.links.jsr, createJSRIcon()),
        );
      }
      if (project.links.appstore) {
        linksDiv.appendChild(
          createLinkButton(
            "App Store",
            project.links.appstore,
            createAppleIcon(),
          ),
        );
      }

      // Support for any other custom links
      Object.keys(project.links).forEach((key) => {
        if (!["github", "website", "npm", "jsr", "appstore"].includes(key)) {
          linksDiv.appendChild(
            createLinkButton(
              key.charAt(0).toUpperCase() + key.slice(1),
              project.links[key],
              createGenericIcon(),
            ),
          );
        }
      });

      article.appendChild(linksDiv);
    }

    // Description
    if (project.description) {
      const desc = document.createElement("p");
      desc.className = "project-description";
      desc.textContent =
        typeof project.description === "object"
          ? project.description[portfolioLang] || project.description.en
          : project.description;
      article.appendChild(desc);
    }

    return article;
  }

  // Create link button with icon
  function createLinkButton(label, url, icon) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "project-link";
    link.appendChild(icon);
    link.appendChild(document.createTextNode(label));
    return link;
  }

  // Icon creation functions
  function createGitHubIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.innerHTML =
      '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>';
    return svg;
  }

  function createWebsiteIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML =
      '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>';
    return svg;
  }

  function createNPMIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.innerHTML =
      '<path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/>';
    return svg;
  }

  function createJSRIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.innerHTML =
      '<path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>';
    return svg;
  }

  function createAppleIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.innerHTML =
      '<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>';
    return svg;
  }

  function createYouTubeIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.innerHTML =
      '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>';
    return svg;
  }

  function createGenericIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML =
      '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>';
    return svg;
  }

  // Setup screenshot click handlers
  function setupScreenshotHandlers() {
    const screenshots = document.querySelectorAll(".screenshot-thumb");
    const modal = document.getElementById("image-modal");
    const modalImage = modal.querySelector(".modal-image");

    screenshots.forEach((screenshot) => {
      screenshot.addEventListener("click", () => {
        modal.classList.add("active");
        modalImage.src = screenshot.src;
        modalImage.alt = screenshot.alt;
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      });
    });
  }

  // Setup image modal
  function setupImageModal() {
    const modal = document.getElementById("image-modal");
    const modalClose = modal.querySelector(".modal-close");

    const closeModal = () => {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    modalClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
      }
    });
  }

  // Show error message
  function showError() {
    const container = document.querySelector(".projects-grid");
    if (!container) return;

    container.innerHTML = `
        <div class="error-message">
            <p data-en="Failed to load projects. Please try again later." data-fr="Échec du chargement des projets. Veuillez réessayer plus tard.">
                Failed to load projects. Please try again later.
            </p>
        </div>
    `;
  }

  // Show no results message
  function showNoResults(container) {
    container.innerHTML = `
        <div class="no-results">
            <p data-en="No projects found with the selected tags." data-fr="Aucun projet trouvé avec les étiquettes sélectionnées.">
                No projects found with the selected tags.
            </p>
        </div>
    `;
  }
})(); // End of IIFE
