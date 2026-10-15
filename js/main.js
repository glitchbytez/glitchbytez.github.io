/* ==========================================================================
   main.js — render content.json, theme toggle
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Placeholders and TODO markers only ever show while developing locally.
  const DEV = ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname);

  /* ---------- Helpers ---------- */

  function isTodo(value) {
    return typeof value === "string" && value.trim().startsWith("TODO");
  }

  function hasValue(value) {
    return typeof value === "string" && value.trim() !== "" && !isTodo(value);
  }

  /** Tiny element builder: el("a", { href, class }, [children]). Text is always set safely. */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of [].concat(children || [])) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  /** A visible TODO marker in development; nothing in production. */
  function todo(value) {
    return DEV ? el("mark", { class: "todo", text: value }) : null;
  }

  /** Plain text, or a TODO marker (dev) / nothing (prod) if the value is a placeholder. */
  function textOrTodo(value) {
    if (isTodo(value)) return todo(value);
    return hasValue(value) ? value : null;
  }

  function slot(name) {
    return document.querySelector(`[data-slot="${name}"]`);
  }

  function fill(name, nodes) {
    const target = slot(name);
    if (!target) return;
    target.replaceChildren(...[].concat(nodes).filter(Boolean));
  }

  /* ---------- Sections ---------- */

  function renderSite(site) {
    if (!site) return;
    if (hasValue(site.title)) document.title = site.title;
    if (hasValue(site.lang)) root.lang = site.lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && hasValue(site.description)) meta.setAttribute("content", site.description);
  }

  function renderHero(person, links) {
    const title = document.getElementById("hero-title");
    if (title && hasValue(person.displayName)) title.textContent = person.displayName;

    fill("positioning", textOrTodo(person.positioning));
    fill("bio", (person.bio || []).map((para) => {
      const content = textOrTodo(para);
      return content ? el("p", {}, content) : null;
    }));

    fill("hero-links", [
      hasValue(links.github) && el("li", {}, el("a", { href: links.github, rel: "me" }, "GitHub")),
      hasValue(links.linkedin) && el("li", {}, el("a", { href: links.linkedin, rel: "me" }, "LinkedIn")),
    ]);
  }

  const LINK_LABELS = {
    repo: "Source on GitHub",
    docs: "API docs",
    demo: "Live demo",
  };

  function renderProjectMedia(project) {
    if (!project.image) return null;

    if (isTodo(project.imageAlt) || !hasValue(project.imageAlt)) {
      return DEV
        ? el("div", { class: "project__media project__media--todo" }, [
            "Screenshot: ", project.image, " — ", todo(project.imageAlt || "TODO(Ronald): alt text"),
          ])
        : null;
    }

    const figure = el("figure", { class: "project__media" });
    const img = el("img", {
      src: project.image,
      alt: project.imageAlt,
      width: project.imageWidth || 1200,
      height: project.imageHeight || 750,
      loading: "lazy",
      decoding: "async",
    });
    // A missing screenshot should leave no broken-image icon behind.
    img.addEventListener("error", () => figure.remove());
    figure.append(img);
    return figure;
  }

  function renderProjectLinks(links) {
    const items = Object.keys(LINK_LABELS).map((key) => {
      const url = links && links[key];
      if (hasValue(url)) {
        return el("li", {}, el("a", { class: "button button--quiet", href: url }, LINK_LABELS[key]));
      }
      if (isTodo(url) && DEV) return el("li", {}, [LINK_LABELS[key], ": ", todo(url)]);
      return null;
    }).filter(Boolean);

    return items.length ? el("ul", { role: "list", class: "project__links" }, items) : null;
  }

  function renderProject(project, index) {
    const id = project.id || `project-${index}`;
    const detailId = `${id}-detail`;

    const toggle = el("button", {
      class: "project__toggle",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": detailId,
    }, [
      el("span", { text: project.title }),
      el("span", { class: "project__toggle-hint", "aria-hidden": "true", text: "+" }),
    ]);

    const detailRows = [
      ["The problem", project.problem],
      ["My role", project.role],
    ].map(([label, value]) => {
      const content = textOrTodo(value);
      return content ? [el("dt", { text: label }), el("dd", {}, content)] : null;
    }).filter(Boolean).flat();

    const detail = el("div", { class: "project__detail", id: detailId, hidden: true },
      detailRows.length ? el("dl", {}, detailRows) : null);

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      detail.hidden = open;
    });

    const highlights = (project.highlights || []).map(textOrTodo).filter(Boolean);
    const next = textOrTodo(project.next);

    return el("article", { class: "project", id, "aria-labelledby": `${id}-title` }, [
      renderProjectMedia(project),
      el("div", { class: "project__body" }, [
        el("header", { class: "project__head" }, [
          el("h3", { class: "project__title", id: `${id}-title` }, toggle),
          hasValue(project.status) && el("span", { class: "tag tag--status", text: project.status }),
        ]),
        textOrTodo(project.summary) && el("p", { class: "project__summary" }, textOrTodo(project.summary)),
        detail,
        highlights.length > 0 && el("div", { class: "project__done" }, [
          el("h4", { class: "project__label", text: next ? "Done so far" : "Highlights" }),
          el("ul", { class: "project__highlights" }, highlights.map((h) => el("li", {}, h))),
        ]),
        next && el("p", { class: "project__next" }, [el("strong", { text: "Next: " }), next]),
        project.stack && project.stack.length > 0 && el("ul", {
          role: "list",
          class: "tags",
          "aria-label": "Tech stack",
        }, project.stack.map((s) => el("li", { class: "tag", text: s }))),
        renderProjectLinks(project.links),
      ]),
    ]);
  }

  function renderProjects(projects) {
    fill("projects", (projects || []).map(renderProject));
  }

  function renderSkills(skills) {
    fill("skills", Object.entries(skills || {}).map(([group, items]) =>
      el("div", { class: "skills__group" }, [
        el("h3", { class: "skills__title", text: group }),
        el("ul", { role: "list", class: "skills__list" }, items.map((s) => el("li", { text: s }))),
      ])
    ));
  }

  const SHELF_GROUPS = [
    ["reading", "Currently reading"],
    ["read", "Recently read"],
    ["next", "Up next"],
  ];

  function renderBook(book, index) {
    const spine = book.cover && !isTodo(book.cover)
      ? el("img", { class: "book__cover", src: book.cover, alt: "", width: 120, height: 180, loading: "lazy" })
      : el("span", { class: "book__spine-title", text: book.title });

    // Tone and height vary by position: a shelf of real books is never uniform.
    const variant = `book--tone-${(index % 4) + 1} book--h-${(index % 3) + 1}`;

    return el("li", { class: `book ${variant}`, tabindex: "0" }, [
      el("div", { class: "book__spine", "aria-hidden": "true" }, spine),
      el("div", { class: "book__info" }, [
        el("p", { class: "book__title" }, [
          el("cite", { text: book.title }),
          book.placeholder && DEV && el("mark", { class: "todo", text: "placeholder" }),
        ]),
        hasValue(book.author) && el("p", { class: "book__author", text: book.author }),
        textOrTodo(book.note) && el("p", { class: "book__note" }, textOrTodo(book.note)),
      ]),
    ]);
  }

  function renderShelf(shelf, books) {
    const section = document.getElementById("shelf");
    const navItem = document.querySelector('[data-nav="shelf"]');
    const visible = (books || []).filter((b) => DEV || !b.placeholder);

    // In production, an all-placeholder shelf hides itself (and its nav link).
    const empty = visible.length === 0;
    if (section) section.hidden = empty;
    if (navItem) navItem.hidden = empty;
    if (empty) return;

    fill("shelf-intro", textOrTodo(shelf && shelf.intro));

    let index = 0;
    fill("books", SHELF_GROUPS.map(([status, label]) => {
      const group = visible.filter((b) => b.status === status);
      if (!group.length) return null;
      return el("div", { class: "shelf__group" }, [
        el("h3", { class: "shelf__label", text: label }),
        el("ul", { role: "list", class: "shelf__row" }, group.map((b) => renderBook(b, index++))),
      ]);
    }));
  }

  function renderContact(contact, links, person) {
    const items = [
      hasValue(links.email) && ["Email", el("a", { href: `mailto:${links.email}` }, links.email)],
      hasValue(links.github) && ["GitHub", el("a", { href: links.github, rel: "me" }, links.github.replace(/^https?:\/\//, ""))],
      hasValue(links.linkedin) && ["LinkedIn", el("a", { href: links.linkedin, rel: "me" }, links.linkedin.replace(/^https?:\/\/(www\.)?/, ""))],
      textOrTodo(person.location) && ["Based in", textOrTodo(person.location)],
    ].filter(Boolean);

    fill("contact", [
      contact && textOrTodo(contact.line) && el("p", { class: "contact__line" }, textOrTodo(contact.line)),
      el("dl", { class: "contact__list" }, items.flatMap(([label, value]) => [
        el("dt", { text: label }),
        el("dd", {}, value),
      ])),
    ]);
  }

  function renderAll(data) {
    const person = data.person || {};
    const links = data.links || {};
    renderSite(data.site);
    renderHero(person, links);
    renderProjects(data.projects);
    renderSkills(data.skills);
    renderShelf(data.shelf, data.books);
    renderContact(data.contact, links, person);
  }

  function renderError() {
    fill("projects", el("p", { class: "section__intro" }, [
      "The project list couldn't load. You can find my work on ",
      el("a", { href: "https://github.com/glitchbytez" }, "GitHub"),
      ".",
    ]));
  }

  async function loadContent() {
    try {
      const response = await fetch("content.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderAll(await response.json());
    } catch (error) {
      console.error("Could not load content.json", error);
      renderError();
    }
  }

  /* ---------- Reveal on scroll ---------- */

  const REVEAL_TARGETS = [
    ".section__head",
    ".project",
    ".skills__group",
    ".shelf__group",
    "[data-slot='contact'] > *",
  ].join(",");

  function initReveal() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target); // once per element
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    // Mark elements first, then opt in to hiding: content is never hidden without a way back.
    for (const node of document.querySelectorAll(REVEAL_TARGETS)) {
      node.classList.add("reveal");
      observer.observe(node);
    }
    root.classList.add("reveal-ready");
  }

  /* ---------- Theme ---------- */

  function currentTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return darkQuery.matches ? "dark" : "light";
  }

  function syncToggle(button) {
    button.setAttribute("aria-pressed", String(currentTheme() === "dark"));
  }

  function initTheme() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    syncToggle(button);

    button.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* storage unavailable: the choice lasts for this visit only */
      }
      syncToggle(button);
    });

    darkQuery.addEventListener("change", () => syncToggle(button));
  }

  /* ---------- Boot ---------- */

  const year = slot("year");
  if (year) year.textContent = String(new Date().getFullYear());

  initTheme();
  loadContent().then(initReveal);
})();
