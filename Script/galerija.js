// galerija.js — CLEAN STABLE
// - Robust loading of products.json (multiple paths)
// - Stable image URLs (\\ to /, collapse //, add ./, encodeURI, root-absolute for Slike/Style/Script)
// - Category router (?cat=ogrlice → special layout; others → generic)
// - Single modal implementation (CSS class .show)
// - Fallbacks in modal: "Opis nije dostupan.", "Cijena na upit"
// - Qty stepper (+/–) without duplicate listeners
// - Add-to-cart to RTDB + optimistic badge update

document.addEventListener("DOMContentLoaded", () => {
  /* ========= UTIL ========= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const qs = new URLSearchParams(location.search);
  const catParam = (qs.get("cat") || "").toLowerCase().trim();

  // 1) products.json: try multiple paths
  const PRODUCT_PATHS = ["Script/products.json"];
  async function fetchProducts() {
    const tried = [];
    for (const p of PRODUCT_PATHS) {
      try {
        const r = await fetch(p, { cache: "no-store" });
        tried.push(`${p} → ${r.status}`);
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) {
            console.log(
              "[Galerija] Učitano iz:",
              p,
              `(${data.length} proizvoda)`
            );
            return data;
          }
        }
      } catch (err) {
        tried.push(`${p} → ERROR ${err?.message || err}`);
      }
    }
    throw new Error(
      "Ne mogu učitati products.json. Pokušano:\n" + tried.join("\n")
    );
  }
  // ==== FIX: mobile dropdown toggle (prevents '#' jump) ====
  (function fixMobileDropdown() {
    const dropdown = document.querySelector(".nav-list .dropdown");
    if (!dropdown) return;

    const trigger = dropdown.querySelector(':scope > a[href="#"]');
    const menu = dropdown.querySelector(":scope > .dropdown-content");

    const isTouchLike = () =>
      window.matchMedia("(hover: none)").matches || window.innerWidth <= 760;

    function open() {
      dropdown.classList.add("open");
      trigger?.setAttribute("aria-expanded", "true");
    }
    function close() {
      dropdown.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
    }
    function toggle(e) {
      if (!isTouchLike()) return; // desktop ostavi na :hover
      e.preventDefault(); // spriječi skok na vrh zbog '#'
      e.stopPropagation();
      dropdown.classList.toggle("open");
      trigger?.setAttribute(
        "aria-expanded",
        String(dropdown.classList.contains("open"))
      );
    }

    trigger?.setAttribute("role", "button");
    trigger?.setAttribute("aria-haspopup", "menu");
    trigger?.setAttribute("aria-expanded", "false");

    trigger?.addEventListener("click", toggle, { passive: false });
    trigger?.addEventListener("touchstart", toggle, { passive: false });

    // zatvori kad klikneš izvan menija ili pritisneš ESC
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // dopuštamo normalnu navigaciju po linkovima unutar menija
    menu?.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        close(); // zatvori i pusti da ode na npr. galerija.html?cat=narukvice
      },
      true
    );
  })();

  // 2) URL slika — RELATIVE za GitHub Pages (bez leading '/')
  const imgUrl = (src) => {
    if (!src) return "";
    let s = String(src).trim();
    s = s.replace(/\\\\/g, "/"); // backslash → slash
    s = s.replace(/(^|[^:])\/{2,}/g, (_, a) => (a || "") + "/"); // collapse // (ne nakon protokola)

    // ❌ NE radimo: if (/^(Slike|Style|Script)\//i.test(s)) s = "/" + s;
    // ✅ Umjesto toga: prisilno relativno (./) i bez leading slasha
    if (!/^(https?:)?\/\//i.test(s)) {
      s = s.replace(/^\/+/, ""); // skini sve početne '/'
      if (!s.startsWith("./")) s = "./" + s;
    }
    return encodeURI(s);
  };

  // 3) DOM targets
  const $collectionsRail = $(".collections-rail");
  const $collectionView = $("#collectionView");
  const $cvTitle = $("#collectionTitle");
  const $cvGrid = $("#collectionGrid");
  const $necklaceGrid = $("#necklaceGrid");

  const $catHead = $("#categoryHead");
  const $catTitle = $("#catTitle");
  const $catDesc = $("#catDesc");
  const $catWrap = $("#catGridWrap");
  const $catGrid = $("#catGrid");

  /* ========= STATE ========= */
  let renderedItems = [];
  let currentItem = null;

  /* ========= EVENTS: open cart on figure click/Enter/Space ========= */
  document.addEventListener("click", (e) => {
    const fig = e.target.closest("figure[data-product]");
    if (fig) openCart(fig.dataset.product);
  });
  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("figure[data-product]")
    ) {
      e.preventDefault();
      openCart(e.target.dataset.product);
    }
  });

  function openCart(productId) {
    const item = renderedItems.find((p) => p["data-product"] === productId);
    if (!item) return;
    // zajednički modal (iz script.js) napuni i otvori
    window.__cartModal?.showProduct(item);
  }

  /* ========= RENDER ========= */
  function cardHTML(p) {
    const title = p["Naziv proizvoda"] || p.title || "";
    const desc = (p.description || "").toString().trim();
    const price = (p.price || "").toString().trim();
    const pid = p["data-product"];
    const img = imgUrl(p.image || "");
    return `
      <article class="card" data-product="${pid}">
        <figure data-product="${pid}" title="Klikni za detalje" tabindex="0" role="button" aria-label="Dodaj '${title}' u košaricu">
          <img loading="eager" src="${img}" alt="${title}"
               onerror="this.onerror=null; this.style.opacity=0.25; this.alt='Slika nije pronađena'; console.warn('Ne mogu učitati sliku:', this.src);">
        </figure>
        <h4>${title}</h4>
        ${desc ? `<p class="desc">${desc}</p>` : ``}
        ${price ? `<div class="price">${price} €</div>` : ``}
      </article>`;
  }

  // Ogrlice – collections + ostale
  function renderOgrlice(all) {
    $collectionsRail?.removeAttribute("hidden");
    document.querySelector(".necklaces")?.removeAttribute("hidden");
    $catHead?.setAttribute("hidden", "");
    $catWrap?.setAttribute("hidden", "");

    const norm = (s) =>
      (s || "")
        .toString()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
    const necklaces = all.filter(
      (p) => norm(p["data-category"] ?? p.category) === "ogrlice"
    );

    const buckets = {
      "Do You Dare": [],
      "Aj lipo sidi": [],
      Divljakuša: [],
      Hera: [],
      Raskošna: [],
      Shaiba: [],
      Statement: [],
      __ostale__: [],
    };
    const pickBucket = (name = "") => {
      const n = name.toLowerCase();
      if (n.startsWith("do you dare")) return "Do You Dare";
      if (n.startsWith("aj lipo sidi")) return "Aj lipo sidi";
      if (n.startsWith("divljakuša")) return "Divljakuša";
      if (n.startsWith("hera")) return "Hera";
      if (n.startsWith("raskošna")) return "Raskošna";
      if (n.startsWith("shaiba")) return "Shaiba";
      if (n.includes("statement")) return "Statement";
      return "__ostale__";
    };

    const standalone = [];
    necklaces.forEach((item) => {
      const b = pickBucket(item["Naziv proizvoda"] || item.title || "");
      (buckets[b] || standalone).push(item);
      if (b === "__ostale__") standalone.push(item);
    });

    // counts on tiles
    $$(".collection-tile").forEach((btn) => {
      const c = btn.dataset.collection;
      const n = (buckets[c] || []).length;
      const cEl = btn.querySelector(".count");
      if (cEl) cEl.textContent = `${n} proizvoda`;
    });

    if ($necklaceGrid) {
      renderedItems = standalone.slice();
      $necklaceGrid.innerHTML = standalone.map(cardHTML).join("");
      // Paginacija – ogrlice (ostale)
      if (window.applyPagination) {
        // responsive per-row → per-page (desktop 5/row, laptop 4, tablet 3, mobile 2)
        const w = window.innerWidth;
        const perRow = w >= 1200 ? 5 : w > 1024 ? 4 : w > 640 ? 3 : 2;
        const defaults = { 5: 15, 4: 12, 3: 12, 2: 8 }; // default per page
        const options = {
          5: [5, 10, 15, 20, 25],
          4: [4, 8, 12, 16, 20],
          3: [6, 12, 21, 30], // uključuje 21 kako si tražila
          2: [4, 8, 12, 16],
        };
        const per = defaults[perRow] || 12;
        const opts = options[perRow] || [];
        const bp =
          perRow === 5
            ? "d5"
            : perRow === 4
            ? "d4"
            : perRow === 3
            ? "t3"
            : "m2";

        window.applyPagination($necklaceGrid, {
          itemSelector: ".card",
          perPage: per,
          perPageOptions: opts,
          id: "gal-neck" + "-" + bp,
        });
      }
    }

    $collectionsRail?.addEventListener("click", (e) => {
      const tile = e.target.closest(".collection-tile");
      if (!tile || !$collectionView || !$cvTitle || !$cvGrid) return;
      const col = tile.dataset.collection;
      const list = buckets[col] || [];
      renderedItems = list.slice();
      $cvTitle.textContent = `Kolekcija: ${col}`;
      $cvGrid.innerHTML =
        list.map(cardHTML).join("") ||
        `<p style="opacity:.7">Nema artikala u ovoj kolekciji.</p>`;
      // Paginacija – kolekcije
      if (window.applyPagination) {
        // responsive per-row → per-page (desktop 5/row, laptop 4, tablet 3, mobile 2)
        const w = window.innerWidth;
        const perRow = w >= 1200 ? 5 : w > 1024 ? 4 : w > 640 ? 3 : 2;
        const defaults = { 5: 15, 4: 12, 3: 12, 2: 8 }; // default per page
        const options = {
          5: [5, 10, 15, 20, 25],
          4: [4, 8, 12, 16, 20],
          3: [6, 12, 21, 30], // uključuje 21 kako si tražila
          2: [4, 8, 12, 16],
        };
        const per = defaults[perRow] || 12;
        const opts = options[perRow] || [];
        const bp =
          perRow === 5
            ? "d5"
            : perRow === 4
            ? "d4"
            : perRow === 3
            ? "t3"
            : "m2";

        window.applyPagination($cvGrid, {
          itemSelector: ".card",
          perPage: per,
          perPageOptions: opts,
          id: "gal-col-" + col + "-" + bp,
        });

        $collectionView.hidden = false;
        $collectionView.scrollIntoView({ behavior: "smooth", block: "start" });
        wakeImages();
      }
    });

    wakeImages();
  }

  // Generičke kategorije
  function renderGenericCategory(cat, all) {
    const texts = {
      cloud: {
        title: "My Happy Cloud",
        desc: "Tapiserija - za uređenje Vaših dnevnih i spavaćih soba, balkona, predsoblja, kuhinja.",
      },
      heart: {
        title: "My Happy Heart",
        desc: "Broš, dostupan i kao ukras za bor – podiže vaše modne kombinacije.",
      },
      letters: {
        title: "My Happy Letters",
        desc: "Vunena pisana slova – po narudžbi – za uređenje vašeg prostora.",
      },
      brosevi: {
        title: "My Happy Broševi",
        desc: "Za vezivanje marama i šalova, ukrašavanje sakoa i kaputa.",
      },
      nanognice: {
        title: "My Happy Nanognice",
        desc: "Ukrasite svoj gležanj – koračajte sa stilom.",
      },
      narukvice: {
        title: "My Happy Narukvice",
        desc: "Dostupne i po narudžbi, mix & match.",
      },
      privjesci: {
        title: "My Happy Privjesci",
        desc: "Privjesci za ključeve i torbe – detalji koji podižu kombinaciju.",
      },
      ogrlice: { title: "Ogrlice", desc: "" },
    };

    $collectionsRail && ($collectionsRail.hidden = true);
    $collectionView && ($collectionView.hidden = true);
    document.querySelector(".necklaces")?.setAttribute("hidden", "");

    const items = all.filter(
      (p) => (p["data-category"] || "").toLowerCase() === cat
    );
    renderedItems = items.slice();

    $catHead && ($catHead.hidden = false);
    $catWrap && ($catWrap.hidden = false);
    $catTitle && ($catTitle.textContent = texts[cat]?.title || cat);
    $catDesc && ($catDesc.textContent = texts[cat]?.desc || "");

    if ($catGrid) {
      $catGrid.innerHTML = items.length
        ? items.map(cardHTML).join("")
        : `<p style="opacity:.7">Trenutno nema proizvoda za kategoriju “${cat}”.</p>`;
      // Paginacija – generičke kategorije
      if (window.applyPagination) {
        // responsive per-row → per-page (desktop 5/row, laptop 4, tablet 3, mobile 2)
        const w = window.innerWidth;
        const perRow = w >= 1200 ? 5 : w > 1024 ? 4 : w > 640 ? 3 : 2;
        const defaults = { 5: 15, 4: 12, 3: 12, 2: 8 }; // default per page
        const options = {
          5: [5, 10, 15, 20, 25],
          4: [4, 8, 12, 16, 20],
          3: [6, 12, 21, 30], // 6–12–21… kako želiš
          2: [4, 8, 12, 16],
        };
        const per = defaults[perRow] || 12;
        const opts = options[perRow] || [];
        const bp =
          perRow === 5
            ? "d5"
            : perRow === 4
            ? "d4"
            : perRow === 3
            ? "t3"
            : "m2";

        window.applyPagination($catGrid, {
          itemSelector: ".card",
          perPage: per,
          perPageOptions: opts,
          id: "gal-cat-" + cat + "-" + bp,
        });
      }
    }
    wakeImages();
  }

  // Wake all images (safety)
  function wakeImages() {
    setTimeout(() => {
      document
        .querySelectorAll(
          "#collectionGrid img, #catGrid img, #necklaceGrid img"
        )
        .forEach((img) => (img.loading = "eager"));
    }, 0);
  }

  /* ========= INIT ========= */
  (async function init() {
    try {
      const all = await fetchProducts();
      console.log("[Galerija] Ukupno proizvoda:", all.length);
      if (!catParam || catParam === "ogrlice") renderOgrlice(all);
      else renderGenericCategory(catParam, all);
    } catch (err) {
      console.error("[Galerija] Greška:", err);
      const target = $catGrid || $cvGrid || $necklaceGrid || document.body;
      const box = document.createElement("div");
      box.style.cssText =
        "margin:12px;padding:12px;border:1px solid #eee;border-radius:12px;background:#fff;white-space:pre-wrap";
      box.innerHTML = `<strong>Ne mogu učitati proizvode.</strong>\n<small>${
        err?.message || err
      }</small>`;
      target.appendChild(box);
    }
  })();
});
// === COLLECTION ANIMATIONS (hover/touch trigger) ===
(function bindCollectionAnimations() {
  const rail = document.querySelector(".collections-rail");
  if (!rail) return;

  const trigger = (tile, cls) => {
    tile.classList.remove(cls); // reset ako je ostalo od prošlog puta
    void tile.offsetWidth; // reflow hack – omogućava ponovno pokretanje animacije
    tile.classList.add(cls);
    tile.addEventListener("animationend", () => tile.classList.remove(cls), {
      once: true,
    });
  };

  const onInteract = (e) => {
    const tile = e.target.closest(".collection-tile");
    if (!tile || !rail.contains(tile)) return;
    if (tile.classList.contains("c-divljakusa")) trigger(tile, "runaway");
    else if (tile.classList.contains("c-sidi")) trigger(tile, "sitmotion");
  };

  rail.addEventListener("mouseover", onInteract); // desktop hover
  rail.addEventListener("touchstart", onInteract, { passive: true }); // mobile tap
})();
// === Nadogradnja: dodaj još kolekcija u interakcijski trigger ===
// === COLLECTION ANIMATIONS — DESKTOP ONLY ===
(function collectionAnimations() {
  const rail = document.querySelector(".collections-rail");
  if (!rail) return;

  // ne veži ništa na mobitelu ili kad korisnik traži manje pokreta
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isMobile || reduced) return;

  const trigger = (tile, cls) => {
    if (tile.dataset.animating === "1") return;
    tile.dataset.animating = "1";
    tile.classList.remove(cls);
    void tile.offsetWidth; // reflow reset
    tile.classList.add(cls);
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove(cls);
        tile.dataset.animating = "0";
      },
      { once: true }
    );
  };

  rail.addEventListener("mouseover", (e) => {
    const tile = e.target.closest(".collection-tile");
    if (!tile) return;
    if (tile.classList.contains("c-divljakusa")) trigger(tile, "runaway");
    else if (tile.classList.contains("c-sidi")) trigger(tile, "sitmotion");
    else if (tile.classList.contains("c-raskosna")) trigger(tile, "framepulse");
    else if (tile.classList.contains("c-hera")) trigger(tile, "gradflip");
    else if (tile.classList.contains("c-dare")) trigger(tile, "daremotion");
    else if (tile.classList.contains("c-shaiba")) trigger(tile, "morphcircle");
  });
})();
