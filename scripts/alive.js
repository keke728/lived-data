/* Alive layer: the heart mascot (hero seal, header companion, peeking helper), floating
   paper stars, title squiggles and scroll rises. Pairs with alive.css.
   The page works without this file. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const STAR = "M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0Z";
  const HEART_SRC = "assets/mascot/heart-face.svg";

  const svgEl = (name, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  const rand = (min, max) => min + Math.random() * (max - min);
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const pointer = { x: -1, y: -1 };
  if (finePointer) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      },
      { passive: true }
    );
  }

  /* ---------- One heart character, used everywhere ----------
     Builds the eye rig over the traced heart artwork (340 x 344 space) and
     returns small, deliberate actions: look, blink, hop. */
  const HEART_EYES = {
    viewBox: "0 0 340 344",
    eyes: [
      { cx: 116, cy: 107, r: 29, p: 21 },
      { cx: 192.5, cy: 115.5, r: 26.5, p: 19 },
    ],
  };

  const createHeart = (host, rig = HEART_EYES, colors = {}) => {
    const { body = "#eb434a", eyeWhite = "#ffffff", pupil: pupilColor = "#000000" } = colors;
    const face = svgEl("svg", { class: "mascot-face", viewBox: rig.viewBox, "aria-hidden": "true" });
    const eyes = rig.eyes.map((eye) => {
      face.appendChild(svgEl("circle", { cx: eye.cx, cy: eye.cy, r: eye.r + 3, fill: body }));
      const ball = svgEl("g", { class: "eyeball" });
      ball.appendChild(svgEl("circle", { cx: eye.cx, cy: eye.cy, r: eye.r, fill: eyeWhite }));
      const pupil = svgEl("circle", { class: "pupil", cx: eye.cx, cy: eye.cy, r: eye.p, fill: pupilColor });
      ball.appendChild(pupil);
      face.appendChild(ball);
      return { ...eye, ball, pupil };
    });
    host.appendChild(face);

    let gaze = { x: 0, y: 0 };
    const look = (x, y) => {
      if (Math.hypot(x - gaze.x, y - gaze.y) < 0.2) return;
      gaze = { x, y };
      eyes.forEach((eye) => {
        const reach = eye.r - eye.p - 1.5;
        eye.pupil.style.transform = `translate(${(x * reach).toFixed(2)}px, ${(y * reach).toFixed(2)}px)`;
      });
    };

    /* Fast close, a beat shut, open with a tiny overshoot. */
    const blink = () =>
      Promise.all(
        eyes.map(({ ball }) =>
          ball.animate(
            [
              { transform: "scaleY(1)", easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
              { transform: "scaleY(0.08)", offset: 0.36 },
              { transform: "scaleY(0.08)", offset: 0.5, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
              { transform: "scaleY(1.07)", offset: 0.78, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
              { transform: "scaleY(1)" },
            ],
            { duration: 280 }
          ).finished
        )
      );

    /* Point the eyes at a screen position, deliberately (direction is quantized). */
    const lookAtPoint = (x, y, box = host.getBoundingClientRect()) => {
      const dx = x - (box.left + box.width * 0.45);
      const dy = y - (box.top + box.height * 0.32);
      const distance = Math.hypot(dx, dy) || 1;
      const strength = Math.min(1, distance / (box.width * 0.9));
      look((dx / distance) * strength, (dy / distance) * strength);
    };

    return { look, blink, lookAtPoint, getGaze: () => gaze };
  };

  /* Blink on a calm, natural schedule while the element is on screen. */
  const blinkLoop = (heart, target, min = 3400, max = 6800) => {
    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      }).observe(target);
    }
    const next = () =>
      window.setTimeout(async () => {
        if (visible && !document.hidden) {
          await heart.blink();
          if (Math.random() < 0.2) {
            await wait(110);
            await heart.blink();
          }
        }
        next();
      }, rand(min, max));
    next();
  };

  /* ---------- Hero: the seal stays still; only the heart's eyes follow the mouse ---------- */
  const sealEyes = document.querySelector(".seal-eyes");
  if (sealEyes) {
    /* Eye positions in the 1000 x 1000 seal artwork (ldc-seal.png). */
    const heart = createHeart(sealEyes, {
      viewBox: "0 0 1000 1000",
      eyes: [
        { cx: 469, cy: 362, r: 29, p: 21 },
        { cx: 545.5, cy: 370.5, r: 26.5, p: 19 },
      ],
    });

    if (finePointer && !reduceMotion) {
      const eyes = [...sealEyes.querySelectorAll(".pupil")].map((pupil, index) => ({
        pupil,
        reach: index === 0 ? 7 : 6.5 /* the full travel inside each eye (artwork pixels) */,
      }));
      const MAX_TILT_X = 6;
      const MAX_TILT_Y = 9;
      const current = { x: 0, y: 0 };
      const velocity = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      let frame = 0;

      /* One springy value (-1..1 per axis) drives both the eyes and the seal's lean:
         quick to respond, with a tiny overshoot so it settles crisply. */
      const step = () => {
        velocity.x = (velocity.x + (target.x - current.x) * 0.22) * 0.62;
        velocity.y = (velocity.y + (target.y - current.y) * 0.22) * 0.62;
        current.x += velocity.x;
        current.y += velocity.y;
        eyes.forEach(({ pupil, reach }) => {
          pupil.style.transform = `translate(${(current.x * reach).toFixed(2)}px, ${(current.y * reach).toFixed(2)}px)`;
        });
        sealEyes.style.setProperty("--tilt-y", `${(current.x * MAX_TILT_Y).toFixed(2)}deg`);
        sealEyes.style.setProperty("--tilt-x", `${(-current.y * MAX_TILT_X).toFixed(2)}deg`);
        const moving = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(velocity.x) + Math.abs(velocity.y);
        frame = moving > 0.002 ? requestAnimationFrame(step) : 0;
      };
      const ensureFrame = () => {
        if (!frame) frame = requestAnimationFrame(step);
      };

      window.addEventListener(
        "pointermove",
        (event) => {
          const box = sealEyes.getBoundingClientRect();
          const dx = event.clientX - (box.left + box.width * 0.507);
          const dy = event.clientY - (box.top + box.height * 0.366);
          const distance = Math.hypot(dx, dy) || 1;
          /* Reaches full strength within about a quarter of the screen, so it clearly follows you. */
          const strength = Math.min(1, distance / (window.innerWidth * 0.22));
          target.x = (dx / distance) * strength;
          target.y = (dy / distance) * strength;
          ensureFrame();
        },
        { passive: true }
      );
      document.documentElement.addEventListener("pointerleave", () => {
        target.x = 0;
        target.y = 0;
        ensureFrame();
      });
    }

    /* Fun to play with: press squishes the seal; release bounces it back with a burst
       of stars and a happy double blink. */
    const burst = () => {
      const colors = ["#f1bc42", "#e5485e", "#8fb0e0", "#f4efe6"];
      for (let i = 0; i < 9; i += 1) {
        const angle = (Math.PI * 2 * i) / 9 + rand(-0.25, 0.25);
        const distance = rand(0.5, 0.64);
        const piece = svgEl("svg", { class: "seal-burst", viewBox: "0 0 24 24", "aria-hidden": "true" });
        piece.appendChild(svgEl("path", { d: STAR, fill: colors[i % colors.length] }));
        piece.style.setProperty("--size", `${Math.round(rand(16, 26))}px`);
        sealEyes.appendChild(piece);
        const duration = rand(700, 950);
        piece.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.2) rotate(0deg)" },
            {
              transform: `translate(calc(-50% + ${(Math.cos(angle) * distance * 100).toFixed(1)}cqw), calc(-50% + ${(Math.sin(angle) * distance * 100).toFixed(1)}cqw)) scale(1) rotate(${Math.round(rand(-140, 140))}deg)`,
            },
          ],
          { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
        );
        piece
          .animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.65 }, { opacity: 0 }], { duration, fill: "forwards" })
          .finished.then(() => piece.remove());
      }
    };

    if (!reduceMotion) {
      sealEyes.addEventListener("pointerdown", () => {
        sealEyes.animate([{ scale: getComputedStyle(sealEyes).scale === "none" ? "1" : getComputedStyle(sealEyes).scale }, { scale: "0.95" }], {
          duration: 140,
          easing: "cubic-bezier(0.3, 0, 0.6, 1)",
          fill: "forwards",
        });
      });
      sealEyes.addEventListener("pointerup", () => {
        sealEyes.animate(
          [{ scale: "0.95" }, { scale: "1.06" }, { scale: "0.985" }, { scale: "1.03" }],
          { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
        );
        burst();
      });
      sealEyes.addEventListener("pointerleave", () => {
        sealEyes.getAnimations().filter((a) => a.effect && a.effect.getKeyframes().some((k) => "scale" in k)).forEach((a) => a.cancel());
      });
    }

    sealEyes.addEventListener("click", async () => {
      heart.look(0, -0.6);
      await heart.blink();
      await wait(70);
      await heart.blink();
    });

    if (!reduceMotion) blinkLoop(heart, sealEyes, 5000, 9000);
  }

  /* ---------- Header companion: the same heart beside the wordmark on every page ---------- */
  const lockup = document.querySelector(".brand-lockup");
  if (lockup) {
    const buddy = document.createElement("a");
    buddy.className = "header-heart";
    buddy.href = "index.html";
    buddy.setAttribute("aria-hidden", "true");
    buddy.tabIndex = -1;
    buddy.innerHTML = `<span class="header-heart-hop"><span class="header-heart-breath"><img src="${HEART_SRC}" alt="" /></span></span>`;
    lockup.prepend(buddy);
    const heart = createHeart(buddy.querySelector(".header-heart-breath"));

    if (!reduceMotion) {
      blinkLoop(heart, buddy, 5000, 9500);

      /* It looks at whichever navigation link you are about to choose. */
      document.querySelectorAll(".site-nav a").forEach((link) => {
        link.addEventListener("pointerenter", () => {
          const box = link.getBoundingClientRect();
          heart.lookAtPoint(box.left + box.width / 2, box.top + box.height / 2);
        });
        link.addEventListener("pointerleave", () => heart.look(0, 0));
      });
      document.querySelector(".wordmark")?.addEventListener("pointerenter", () => heart.blink());
    }
  }

  /* ---------- Scattered paper stars floating slowly around the home hero ---------- */
  const homeHero = document.querySelector(".hero");
  if (homeHero) {
    const layer = document.createElement("div");
    layer.className = "alive-confetti";
    layer.setAttribute("aria-hidden", "true");
    /* A loose frame around the whole hero: the seal and the intro text together. */
    [
      { l: 6, t: 14, s: 14, c: "#f1bc42", star: true },
      { l: 44, t: 9, s: 8, c: "#8fb0e0" },
      { l: 94, t: 12, s: 13, c: "#8fb0e0", star: true },
      { l: 98, t: 52, s: 7, c: "#f1bc42" },
      { l: 92, t: 94, s: 12, c: "#e5485e", star: true },
      { l: 47, t: 93, s: 10, c: "#f1bc42", star: true },
      { l: 2, t: 62, s: 8, c: "#e5485e" },
    ].forEach((item, index) => {
      const span = document.createElement("span");
      span.style.cssText = [
        `left:${item.l}%`,
        `top:${item.t}%`,
        `--s:${item.s}px`,
        `--c:${item.c}`,
        `--o:${item.star ? 0.9 : 0.6}`,
        `--d:${(2.8 + index * 0.4).toFixed(1)}s`,
        `--tw:${(0.8 + index * 0.15).toFixed(2)}s`,
        `--fx:${[16, -18, 14, -14, 18, -12, 12][index]}px`,
        `--fy:${[-24, -18, -28, -22, -20, -16, -22][index]}px`,
        `--fr:${[28, 0, -30, 0, 34, -26, 0][index]}deg`,
        `--in:${(0.6 + index * 0.12).toFixed(2)}s`,
      ].join(";");
      const inner = document.createElement("i");
      if (item.star) {
        const svg = svgEl("svg", { viewBox: "0 0 24 24" });
        svg.appendChild(svgEl("path", { d: STAR, fill: "currentColor" }));
        inner.appendChild(svg);
      } else {
        span.className = "dot";
      }
      span.appendChild(inner);
      layer.appendChild(span);
    });
    homeHero.prepend(layer);
  }

  /* ---------- Subtle twinkles across every page ----------
     A light, fixed scatter of tiny stars and dots behind the content, each twinkling
     on its own slow rhythm. Kept to the edges so text stays clear. */
  const pageTitle = document.querySelector(".hero") ? null : document.querySelector("main h1");
  const titleBlock = pageTitle && pageTitle.parentElement;
  if (titleBlock) {
    const sky = document.createElement("div");
    sky.className = "alive-twinkles";
    sky.setAttribute("aria-hidden", "true");
    /* Three small accents placed around the page title, relative to the title itself. */
    [
      { x: "-34px", y: "-6px", side: "left", s: 11, c: "#f1bc42", star: true },
      { x: "-22px", y: "-14px", side: "right", s: 8, c: "#8fb0e0", star: true },
      { x: "-20px", y: "42px", side: "left", s: 4, c: "#f4efe6" },
    ].forEach((item, index) => {
      const span = document.createElement("span");
      span.style.cssText = `--x:${item.x};--y:${item.y};--s:${item.s}px;--c:${item.c};--tw:${(0.9 + index * 0.25).toFixed(2)}s;--delay:${(-index * 0.4).toFixed(1)}s`;
      span.dataset.side = item.side;
      if (item.star) {
        const svg = svgEl("svg", { viewBox: "0 0 24 24" });
        svg.appendChild(svgEl("path", { d: STAR, fill: "currentColor" }));
        span.appendChild(svg);
      } else {
        span.className = "dot";
      }
      sky.appendChild(span);
    });
    pageTitle.classList.add("has-twinkles");
    if (getComputedStyle(pageTitle).textAlign === "center") pageTitle.classList.add("is-centered");
    pageTitle.appendChild(sky);
  }

  /* ---------- Hand-drawn squiggle under interior page titles ---------- */
  document.querySelectorAll("main h1").forEach((heading) => {
    if (heading.closest(".hero")) return;
    const squiggle = svgEl("svg", { class: "alive-squiggle", viewBox: "0 0 132 14", "aria-hidden": "true" });
    squiggle.appendChild(svgEl("path", { d: "M3 8 C 18 1, 26 13, 42 7 S 66 1, 80 7 S 106 13, 129 5" }));
    const align = getComputedStyle(heading).textAlign;
    if (align === "left" || align === "start") squiggle.style.marginLeft = "2px";
    heading.insertAdjacentElement("afterend", squiggle);
  });

  /* ---------- Cards respond like paper: a gentle lift (styles in alive.css) ---------- */
  const setupCards = (root = document) => {
    root.querySelectorAll(".research-theme-card, .publication-card, .join-card, .news-item").forEach((card) => {
      card.classList.add("alive-card");
      /* A pen stroke under the card's title that draws itself on hover. */
      const title = card.querySelector("h2, h3, h4");
      if (!title || title.querySelector(".card-squiggle")) return;
      const squiggle = svgEl("svg", { class: "card-squiggle", viewBox: "0 0 96 10", "aria-hidden": "true" });
      squiggle.appendChild(svgEl("path", { d: "M2 6 C 12 1.5, 20 9.5, 32 5 S 52 1.5, 64 5.5 S 84 9, 94 4" }));
      if (getComputedStyle(title).textAlign === "center") squiggle.classList.add("is-centered");
      title.appendChild(squiggle);
    });
  };
  setupCards();
  /* Publication cards are re-rendered when filters change; pick up the new ones. */
  const publicationGrid = document.querySelector(".publications-main");
  if (publicationGrid && "MutationObserver" in window) {
    new MutationObserver(() => setupCards(publicationGrid)).observe(publicationGrid, { childList: true, subtree: true });
  }

  /* ---------- Content rises in as it scrolls into view ---------- */
  const riseTargets = document.querySelectorAll(
    [
      ".research-perspective",
      ".research-theme-card",
      ".person-tile",
      ".publication-collection .publication-card",
      ".publication-feature",
      ".news-archive-main .news-item",
      ".join-card",
    ].join(",")
  );

  if (riseTargets.length && !reduceMotion && "IntersectionObserver" in window) {
    const riseObserver = new IntersectionObserver(
      (entries) => {
        let order = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          target.style.setProperty("--i", String(Math.min(order, 6)));
          order += 1;
          target.classList.add("is-in");
          riseObserver.unobserve(target);
          /* Hand transitions back to the element's own hover styles once it has settled. */
          window.setTimeout(() => {
            target.classList.remove("alive-rise", "is-in");
            target.style.removeProperty("--i");
          }, 1500);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );

    riseTargets.forEach((target) => {
      target.classList.add("alive-rise");
      riseObserver.observe(target);
    });
  }

  /* ---------- A quiet footer on every page ---------- */
  const shell = document.querySelector(".page-shell");
  if (shell && !document.querySelector(".alive-footer")) {
    const footer = document.createElement("footer");
    footer.className = "alive-footer";
    footer.innerHTML = `<p>Lived Data Collective · University of Maryland, College Park</p>`;
    shell.appendChild(footer);
    if ("IntersectionObserver" in window) {
      const footerObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        footer.classList.add("is-in");
        footerObserver.disconnect();
      }, { threshold: 0.6 });
      footerObserver.observe(footer);
    } else {
      footer.classList.add("is-in");
    }
  }

  /* ---------- Peeking heart: the same character waves at the bottom and takes you back up ---------- */
  const peek = document.createElement("button");
  peek.type = "button";
  peek.className = "alive-peek";
  peek.setAttribute("aria-label", "Back to top");
  peek.innerHTML = `<span class="alive-peek-label">Back to top</span><span class="alive-peek-body"><img src="${HEART_SRC}" alt="" /></span>`;
  document.body.appendChild(peek);
  const peekHeart = createHeart(peek.querySelector(".alive-peek-body"));

  if (finePointer) {
    let lastGlance = 0;
    window.addEventListener(
      "pointermove",
      () => {
        if (!peek.classList.contains("is-peeking")) return;
        const now = performance.now();
        if (now - lastGlance < 260) return;
        lastGlance = now;
        peekHeart.lookAtPoint(pointer.x, pointer.y, peek.querySelector(".alive-peek-body").getBoundingClientRect());
      },
      { passive: true }
    );
  }

  let wasPeeking = false;
  const updatePeek = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const nearBottom = scrollable > 160 && window.scrollY > scrollable - 140;
    peek.classList.toggle("is-peeking", nearBottom);
    if (nearBottom && !wasPeeking && !reduceMotion) wait(650).then(() => peekHeart.blink());
    wasPeeking = nearBottom;
  };
  updatePeek();
  window.addEventListener("scroll", updatePeek, { passive: true });
  window.addEventListener("resize", updatePeek);

  peek.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    peek.blur();
  });
})();
