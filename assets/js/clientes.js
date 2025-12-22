(() => {
  // --- Client search (simple, fast) ---
  const input = document.getElementById("mrClientSearch");
  const grid = document.getElementById("mrClientGrid");
  const countEl = document.getElementById("mrClientCount");

  if (input && grid) {
    const cards = Array.from(grid.querySelectorAll(".mr-client-card"));
    const normalize = (s) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const updateCount = () => {
      const visible = cards.filter((c) => !c.hasAttribute("hidden")).length;
      if (countEl) countEl.textContent = `${visible} clientes`;
    };

    input.addEventListener("input", () => {
      const q = normalize(input.value.trim());
      cards.forEach((card) => {
        const name = card.querySelector(".mr-client-card__title")?.textContent || "";
        const meta = card.querySelector(".mr-client-card__meta")?.textContent || "";
        const hay = normalize(name + " " + meta);
        if (!q || hay.includes(q)) card.removeAttribute("hidden");
        else card.setAttribute("hidden", "");
      });
      updateCount();
    });

    updateCount();
  }

  // --- Lightbox (page-local, sin depender de otros scripts) ---
  const lb = document.querySelector(".mr-lightbox");
  if (!lb) return;

  const lbImg = lb.querySelector(".mr-lightbox-img, [data-lightbox-img]");
  const btnClose = lb.querySelector("[data-lightbox-close]");
  const btnPrev = lb.querySelector("[data-lightbox-prev]");
  const btnNext = lb.querySelector("[data-lightbox-next]");

  let images = [];
  let index = 0;
  let caption = "";

  const set = () => {
    if (!lbImg) return;
    lbImg.src = images[index] || "";
    lbImg.alt = caption ? `${caption} (${index + 1}/${images.length})` : `Imagen ${index + 1} de ${images.length}`;
  };

  const open = (imgs, i, cap) => {
    images = Array.isArray(imgs) ? imgs : [];
    index = Math.max(0, Math.min(i || 0, images.length - 1));
    caption = cap || "";

    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("mr-lock-scroll");
    document.body.classList.add("mr-lock-scroll");
    set();
  };

  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("mr-lock-scroll");
    document.body.classList.remove("mr-lock-scroll");
  };

  const prev = () => {
    if (!images.length) return;
    index = (index - 1 + images.length) % images.length;
    set();
  };

  const next = () => {
    if (!images.length) return;
    index = (index + 1) % images.length;
    set();
  };

  // Bind cards
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".mr-client-card__media");
    if (!btn) return;

    const raw = btn.getAttribute("data-images") || "[]";
    let imgs = [];
    try { imgs = JSON.parse(raw); } catch (_) { imgs = []; }
    const client = btn.getAttribute("data-client") || "";
    open(imgs, 0, client);
  });

  // Overlay click closes (si el lightbox cubre pantalla)
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  btnClose?.addEventListener("click", close);
  btnPrev?.addEventListener("click", prev);
  btnNext?.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });
})();
