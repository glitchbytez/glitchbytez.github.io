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
    npm: "Package on npm",
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
    const hasCover = hasValue(book.cover);
    const art = hasCover
      ? el("img", {
          class: "book__cover",
          src: book.cover,
          alt: "",
          width: book.coverWidth || 240,
          height: book.coverHeight || 360,
          loading: "lazy",
          decoding: "async",
        })
      : el("span", { class: "book__spine-title", text: book.title });

    // Height (and spine tone) vary by position: a shelf of real books is never uniform.
    const variant = `book--h-${(index % 3) + 1}` + (hasCover ? " book--cover" : ` book--tone-${(index % 4) + 1}`);

    return el("li", { class: `book ${variant}`, tabindex: "0" }, [
      el("div", { class: "book__art", "aria-hidden": "true" }, art),
      el("div", { class: "book__info" }, [
        el("p", { class: "book__title" }, el("cite", { text: book.title })),
        hasValue(book.author) && el("p", { class: "book__author", text: book.author }),
        textOrTodo(book.note) && el("p", { class: "book__note" }, textOrTodo(book.note)),
        book.placeholder && DEV && el("mark", { class: "todo", text: "placeholder" }),
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

  const SVG_NS = "http://www.w3.org/2000/svg";

  const ICONS = {
    email: { viewBox: "0 0 24 24", stroke: ["M3.5 6h17v12h-17z", "M3.5 6.5 12 12.5l8.5-6"] },
    github: {
      viewBox: "0 0 16 16",
      fill: ["M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"],
    },
    linkedin: {
      viewBox: "0 0 24 24",
      stroke: ["M6.5 3.5h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3z", "M8.5 10.5V16", "M12 16v-5.5", "M12 13c0-1.6 1-2.6 2.3-2.6s2.2 1 2.2 2.6V16"],
      fill: ["M8.5 6.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"],
    },
  };

  function icon(name) {
    const spec = ICONS[name];
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", spec.viewBox);
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "channel__icon");
    for (const [kind, list] of [["stroke", spec.stroke || []], ["fill", spec.fill || []]]) {
      for (const d of list) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", `icon-${kind}`);
        svg.append(path);
      }
    }
    return svg;
  }

  function handleFrom(url, prefix) {
    const path = url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    return prefix + path;
  }

  function channel(name, label, href, handle, rel) {
    return el("li", {}, el("a", { class: "channel", href, rel }, [
      icon(name),
      el("span", { class: "channel__text" }, [
        el("span", { class: "channel__label", text: label }),
        el("span", { class: "channel__handle", text: handle }),
      ]),
      el("span", { class: "channel__arrow", "aria-hidden": "true", text: "\u2197" }),
    ]));
  }

  function copyButton(email) {
    const status = el("p", { class: "contact__status", role: "status" });
    const button = el("button", { class: "button contact__copy", type: "button" }, "Copy address");
    let timer;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        status.textContent = "Copied to your clipboard.";
      } catch (error) {
        status.textContent = `Couldn't copy automatically. The address is ${email}.`;
      }
      clearTimeout(timer);
      timer = setTimeout(() => { status.textContent = ""; }, 4000);
    });

    return [button, status];
  }

  function renderContact(contact, links, person) {
    const email = hasValue(links.email) ? links.email : null;
    const [copy, status] = email ? copyButton(email) : [null, null];
    const location = textOrTodo(person.location);

    fill("contact", el("div", { class: "contact" }, [
      el("div", { class: "contact__intro" }, [
        contact && textOrTodo(contact.line) && el("p", { class: "contact__line" }, textOrTodo(contact.line)),
        email && el("div", { class: "contact__actions" }, [
          el("a", { class: "button button--primary", href: `mailto:${email}` }, "Email me"),
          copy,
        ]),
        status,
        location && el("p", { class: "contact__location" }, ["Based in: ", location]),
      ]),
      el("ul", { role: "list", class: "channels", "aria-label": "Ways to reach me" }, [
        email && channel("email", "Email", `mailto:${email}`, email),
        hasValue(links.github) && channel("github", "GitHub", links.github, handleFrom(links.github, "@"), "me"),
        hasValue(links.linkedin) && channel("linkedin", "LinkedIn", links.linkedin, handleFrom(links.linkedin, ""), "me"),
      ]),
    ]));
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
    ".craft__block",
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
