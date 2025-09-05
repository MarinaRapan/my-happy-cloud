let allProducts = [];
let currentCategory = "home"; // početno: početna stranica, bez tooltips

// Učitaj proizvode
fetch("Script/products.json")
  .then((r) => r.json())
  .then((products) => {
    allProducts = products;
    captureHomepageHTML();
    bindFilterButtons();
    bindTooltipEvents();
    initCartModalEvents();
    enhanceHomepageTiles();
    // GLOBAL paginacija POČETNE (jedan pager za sve stavke na stranici)
    if (window.applyPaginationPairs) {
      const grid = document.querySelector(".card-grid");
      if (grid) {
        window.applyPaginationPairs(grid, {
          pairSelector: ".card .tags span[data-image]",
          perPage: 40,
          id: "home-all",
        });
      }
    }
  })
  .catch((err) => console.error("Greška pri učitavanju proizvoda:", err));

/* ============== POVRATAK NA POČETNU (bez forsiranja "Svi") ============== */
let originalHomepageHTML = "";

function captureHomepageHTML() {
  if (originalHomepageHTML) return; // već spremljeno
  const grid = document.querySelector(".card-grid");
  if (grid) {
    originalHomepageHTML = grid.innerHTML;
  }
}

function showHomepage() {
  const grid = document.querySelector(".card-grid");
  const modal = document.getElementById("product-modal");
  if (!grid || !modal) return;

  // Vrati početni prikaz definiran u HTML-u
  grid.classList.remove("hidden");
  modal.classList.add("hidden");

  if (originalHomepageHTML) {
    grid.innerHTML = originalHomepageHTML;
  }

  // Makni aktivne filtere (ništa nije aktivno)
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Ponovno veži postojeće evente za novi DOM
  if (typeof bindTooltipEvents === "function") bindTooltipEvents();
  if (typeof initCartModalEvents === "function") initCartModalEvents();
  if (typeof enhanceHomepageTiles === "function") enhanceHomepageTiles();
  // GLOBAL paginacija POČETNE (jedan pager za sve stavke na stranici)
  if (window.applyPaginationPairs) {
    const grid = document.querySelector(".card-grid");
    if (grid) {
      window.applyPaginationPairs(grid, {
        pairSelector: ".card .tags span[data-image]",
        perPage: 40,
        id: "home-all",
      });
    }
  }
}

/* ============== FILTERI (toolbar) ============== */
function bindFilterButtons() {
  const filterButtons = document.querySelectorAll(".filters button");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const selectedCategory = (
        button.getAttribute("data-filter") || "all"
      ).toLowerCase();

      showCards(selectedCategory);
    });
  });
}

/* ============== RENDER: "Svi" ili kategorije ============== */
function showCards(category) {
  currentCategory = category || "home"; // prati koji je filter aktivan
  document
    .querySelectorAll(".image-tooltip") // ugasi eventualni otvoreni tooltip
    .forEach((el) => el.remove());
  // ... (tvoj postojeći kod dalje)

  const gridSection = document.querySelector(".card-grid");
  const modalDiv = document.getElementById("product-modal");
  if (!gridSection || !modalDiv) return;

  gridSection.innerHTML = "";
  modalDiv.innerHTML = "";

  if (category === "all") {
    // --- ARHIVA / SVI ---
    gridSection.classList.remove("hidden");
    modalDiv.classList.add("hidden");

    // očisti moguće stare pagere u gridu (spriječi duplu paginaciju)
    gridSection.querySelectorAll(".pagination").forEach((el) => el.remove());

    const tagsDiv = document.createElement("div");
    tagsDiv.className = "tags";

    allProducts.forEach((product) => {
      const status = (product.status || "active").toLowerCase();

      const span = document.createElement("span");
      span.className = "tooltip-trigger";
      span.setAttribute("data-image", product.image || "");
      span.setAttribute("data-product", product["data-product"] || "");

      const name = document.createElement("strong");
      name.textContent = product["Naziv proizvoda"] || "";
      span.appendChild(name);

      if (status !== "active") {
        const chip = document.createElement("em");
        chip.className = `chip chip--${status}`;
        chip.textContent =
          status === "sold"
            ? "Prodano"
            : status === "archived"
            ? "Arhivirano"
            : "Nedostupno";
        span.appendChild(document.createTextNode(" "));
        span.appendChild(chip);
      }

      const button = document.createElement("a");
      button.className = "more-btn";
      button.setAttribute("data-product", product["data-product"] || "");
      button.href = "#";
      if (status === "active") {
        button.textContent = "Dodaj u košaricu";
      } else {
        button.textContent = "Nije dostupno";
        button.classList.add("disabled");
        button.setAttribute("aria-disabled", "true");
      }

      tagsDiv.appendChild(span);
      tagsDiv.appendChild(button);
    });

    gridSection.appendChild(tagsDiv);

    // Paginacija nad parovima (span.tooltip-trigger + a.more-btn) u 'Svi'
    if (window.applyPaginationPairs) {
      window.applyPaginationPairs(tagsDiv, {
        pairSelector: ".tooltip-trigger",
        perPage: 40,
        id: "ws-all",
      });
    }
  } else {
    // --- KATEGORIJE (samo aktivni) ---
    gridSection.classList.add("hidden");
    modalDiv.classList.remove("hidden");

    // "X" za izlaz iz kategorije
    const closeButton = document.createElement("button");
    closeButton.className = "close-btn";
    closeButton.setAttribute("aria-label", "Zatvori kategoriju");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => {
      showHomepage();
    });
    modalDiv.appendChild(closeButton);

    const filtered = allProducts.filter((p) => {
      const cat = (p["data-category"] || "").toLowerCase();
      const filter = (p["data-filter"] || "").toLowerCase();
      const status = (p.status || "active").toLowerCase();
      return (cat === category || filter === category) && status === "active";
    });

    filtered.forEach((product) => {
      const card = document.createElement("article");
      card.className = "card generated";
      card.setAttribute("data-category", product["data-category"] || "");

      card.innerHTML = `
        <div class="card-content-wrapper">
          <h4>${product.title || ""}</h4>
          <img src="${product.image || ""}" alt="${
        product["Naziv proizvoda"] || ""
      }" />
          <h3>${product["Naziv proizvoda"] || ""}</h3>
          <p class="card-description">${
            (product.description || "").trim() ||
            "Opis će uskoro biti dostupan."
          }</p>
          <p class="card-price">${
            product.price ? product.price + " €" : "Cijena na upit"
          }</p>
        </div>
        <button class="more-btn" data-product="${
          product["data-product"] || ""
        }">Dodaj u košaricu</button>
      `;
      modalDiv.appendChild(card);
    });

    // Paginacija kartica u kategoriji
    if (window.applyPagination) {
      window.applyPagination(modalDiv, {
        itemSelector: ".card.generated",
        perPage: 12,
        id: "ws-" + category,
      });
    }
  }

  // Ponovno poveži evente
  bindTooltipEvents();
  initCartModalEvents();
  enhanceHomepageTiles();
}

/* ============== TOOLTIP + THUMB u pločicama ============== */
function bindTooltipEvents() {
  // thumbnail u pločici (početna)
  document.querySelectorAll(".card .tags span[data-image]").forEach((span) => {
    if (span.querySelector("img.thumb")) return;
    const src = span.getAttribute("data-image") || "";
    const labelText = span.textContent.trim();

    span.textContent = "";
    const img = document.createElement("img");
    img.className = "thumb";
    img.src = src;
    img.alt = "";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = labelText;

    span.appendChild(img);
    span.appendChild(label);
  });

  // globalni hover preview
  document.querySelectorAll("span[data-image]").forEach((span) => {
    if (span.dataset.tooltipBound === "1") return;
    span.dataset.tooltipBound = "1";

    span.addEventListener("mouseenter", function (e) {
      if (currentCategory !== "all") return; // 👈 tooltip samo kad je aktivan filter "Svi"
      const imageSrc = this.getAttribute("data-image") || "";
      const tooltip = document.createElement("div");
      tooltip.className = "image-tooltip";
      tooltip.innerHTML = `<img src="${imageSrc}" alt="" />`;
      document.body.appendChild(tooltip);

      const updatePos = (event) => {
        const r = tooltip.getBoundingClientRect();
        let left = event.clientX + 15;
        let top = event.clientY + 15;
        if (left + r.width > window.innerWidth)
          left = event.clientX - r.width - 15;
        if (top + r.height > window.innerHeight)
          top = event.clientY - r.height - 15;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      };

      updatePos(e);
      span._tooltip = tooltip;
      span.addEventListener("mousemove", updatePos);
    });

    span.addEventListener("mouseleave", function () {
      if (this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
      }
    });
  });
}

/* ============== MODAL KOŠARICE (#cart-modal) ============== */
function initCartModalEvents() {
  const modal = document.getElementById("cart-modal");
  if (!modal) return;

  const modalTitle = document.getElementById("modal-title");
  const modalImage = document.getElementById("modal-image");
  const modalDescription = document.getElementById("modal-description");
  const modalPrice = document.getElementById("modal-price");
  const qtyInput = document.getElementById("modal-quantity");

  // Otvaranje modala iz svih .more-btn
  document.querySelectorAll(".more-btn").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (btn.classList.contains("disabled")) return;

      const productId = btn.getAttribute("data-product");
      const product = Array.isArray(allProducts)
        ? allProducts.find((p) => p["data-product"] === productId)
        : null;
      if (!product) return;
      window.__cartModal?.showProduct(product);
    });
  });
}

/* ============== "Svi" pločice: opis/cijena uz gumb ============== */
function enhanceHomepageTiles() {
  const buttons = document.querySelectorAll(
    ".card .tags > a.more-btn[data-product]"
  );
  if (!buttons.length || !Array.isArray(allProducts)) return;

  buttons.forEach((btn) => {
    if (btn.parentElement && btn.parentElement.classList.contains("tile-right"))
      return;

    const id = btn.getAttribute("data-product") || "";
    const product =
      allProducts.find((p) => (p["data-product"] || "") === id) || {};

    const wrapper = document.createElement("div");
    wrapper.className = "tile-right";

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent =
      (product.description || "").trim() || "Opis će uskoro biti dostupan.";

    const priceEl = document.createElement("p");
    priceEl.className = "card-price";
    const rawPrice =
      product.price ??
      product.Cijena ??
      product.cijena ??
      product.price_eur ??
      product.priceEUR;
    priceEl.textContent =
      rawPrice !== undefined && String(rawPrice).trim() !== ""
        ? `${rawPrice} €`
        : "Cijena na upit";

    btn.replaceWith(wrapper);

    const buyBlock = document.createElement("div");
    buyBlock.className = "buy-block";
    buyBlock.append(priceEl, btn);

    wrapper.append(desc, buyBlock);
  });
}
