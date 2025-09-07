// Script/script.js — zajednički skript za sve stranice (čist, bez duplića)
// Funkcije: auth modal (login/register), Firebase Auth hookup, globalna košarica (badge + panel)

document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------------------------------------
   * 0) POMOĆNE
   * ----------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* -------------------------------------------------------
   * 1) AUTH MODAL – injektiraj ako ga nema
   * ----------------------------------------------------- */
  if (!document.getElementById("authModal")) {
    const host = document.createElement("div");
    host.innerHTML = `
    <dialog id="authModal" style="
      padding:0;border:none;margin:0;border-radius:20px;
      width:min(460px,92vw);color:#4b414b;
      inset:50% auto auto 50%;transform:translate(-50%,-50%);
      box-shadow:0 10px 30px rgba(0,0,0,.12),0 2px 10px rgba(0,0,0,.06);
    ">
      <!-- STYLE MUST LIVE *INSIDE* THE DIALOG so firstElementChild stays the <dialog> -->
      <style>
        /* ===== My Happy Cloud — soft & clean auth ===== */
        #authModal{
          --mhc-accent: #6a4a5e;      /* plum */
          --mhc-ink: #4b414b;         /* text */
          --mhc-on-accent: #ffffff;   /* on-accent */
          --mhc-ring: rgba(91,61,80,.18);
          --mhc-card: #ffffff;
          --mhc-card-2: #faf8fb;
          --mhc-border: #eee;
        }
        #authModal::backdrop{
          background: rgba(75,65,75,.55);
          backdrop-filter: blur(2px);
        }
        #authModal .auth-wrap{
          padding: 1.1rem;
          background: linear-gradient(180deg, var(--mhc-card), var(--mhc-card-2));
          border: 1px solid var(--mhc-border);
          border-radius: 20px;
          min-width: min(360px, 92vw);
        }
        #authModal #authTitle{
          margin:0;
          font-size: clamp(1.1rem, 2.2vw, 1.35rem);
          color: var(--mhc-ink);
          letter-spacing:.2px;
        }
        #authModal #authClose{
          border: none;
          background: transparent;
          width: 34px; height: 34px;
          line-height: 1;
          border-radius: 999px;
          font-size: 22px;
          color: var(--mhc-ink);
          cursor: pointer;
          transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
        }
        #authModal #authClose:hover{
          background: #f2edf3;
          box-shadow: 0 0 0 3px var(--mhc-ring) inset;
          transform: rotate(10deg) scale(1.02);
        }
        #authModal form{ margin:.2rem 0 0; }
        #authModal label{
          display:block;
          font-size:.94rem;
          color: var(--mhc-ink);
          margin:.35rem 0 .1rem;
        }
        #authModal input{
          width:100%;
          margin-top:.35rem;
          padding:.7rem .8rem;
          border-radius:12px;
          border:1px solid #e8e6ea;
          background:#fff;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }
        #authModal input:focus{
          border-color: var(--mhc-accent);
          box-shadow: 0 0 0 4px var(--mhc-ring);
        }
        #authModal button[type="submit"]{
          appearance:none;
          border:1px solid transparent;
          border-radius:12px;
          padding:.65rem .9rem;
          font-weight:600;
          cursor:pointer;
          background: linear-gradient(180deg, #7a5970, var(--mhc-accent));
          color: var(--mhc-on-accent);
          transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
        }
        #authModal button[type="submit"]:hover{
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,.10);
          filter: brightness(1.03);
        }
        #authModal a{ color: var(--mhc-accent); text-decoration:none; }
        #authModal a:hover{ text-decoration:underline; }
      </style>

      <div class="auth-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 id="authTitle">Prijava</h3>
          <button id="authClose" aria-label="Zatvori" type="button">×</button>
        </div>

        <!-- LOGIN -->
        <section id="loginForm">
          <form>
            <label>Email<br><input id="email" type="email" autocomplete="email" required></label><br>
            <label>Lozinka<br><input id="password" type="password" autocomplete="current-password" required></label><br>
            <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.6rem">
              <button type="submit">Prijava</button>
            </div>
          </form>
          <p style="margin-top:.6rem;font-size:.92rem">Nemaš račun? <a href="#" id="switchToRegister">Registriraj se</a></p>
        </section>

        <!-- REGISTER -->
        <section id="registerForm" hidden>
          <form>
            <label>Email<br><input id="new-email" type="email" autocomplete="email" required></label><br>
            <label>Lozinka<br><input id="new-password" type="password" autocomplete="new-password" required></label><br>
            <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.6rem">
              <button type="submit">Registracija</button>
            </div>
          </form>
          <p style="margin-top:.6rem;font-size:.92rem">Već imaš račun? <a href="#" id="switchToLogin">Prijava</a></p>
        </section>
      </div>
    </dialog>
  `;
    document.body.appendChild(host.firstElementChild);
  }

  const authModal = document.getElementById("authModal");
  const loginBox = document.getElementById("loginForm");
  const regBox = document.getElementById("registerForm");
  const authTitle = document.getElementById("authTitle");

  function openAuth(which = "login") {
    if (which === "register") {
      loginBox.hidden = true;
      regBox.hidden = false;
      authTitle.textContent = "Registracija";
    } else {
      regBox.hidden = true;
      loginBox.hidden = false;
      authTitle.textContent = "Prijava";
    }
    authModal.showModal();
  }
  function closeAuth() {
    authModal.close();
  }

  document.getElementById("authClose")?.addEventListener("click", closeAuth);
  document
    .getElementById("switchToRegister")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      openAuth("register");
    });
  document.getElementById("switchToLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth("login");
  });

  // Hook na linkove iz navigacije ako postoje
  document.getElementById("openLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth("login");
  });
  document.getElementById("openRegister")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth("register");
  });

  /* -------------------------------------------------------
   * 2) FIREBASE AUTH – login/registracija/odjava + status u navigaciji
   *    (pretpostavlja da su window.auth i window.db postavljeni u HTML-u)
   * ----------------------------------------------------- */
  if (window.auth) {
    // Uredi status u navigaciji + Odjava
    const navList = document.querySelector(".nav-list");
    let statusLi = document.getElementById("authStatus");
    if (!statusLi) {
      statusLi = document.createElement("li");
      statusLi.id = "authStatus";
    }
    let logoutA = document.getElementById("logoutLink");
    if (!logoutA) {
      const logoutLi = document.createElement("li");
      logoutA = document.createElement("a");
      logoutA.id = "logoutLink";
      logoutA.href = "#";
      logoutA.textContent = "Odjava";
      logoutLi.appendChild(logoutA);
      // dodaj tek kad treba (u onAuthStateChanged)
      logoutA.dataset.ready = "1";
    }

    const setNavForUser = (user) => {
      const loginLink = document.getElementById("openLogin");
      const registerLink = document.getElementById("openRegister");

      if (user) {
        if (loginLink) loginLink.parentElement.style.display = "none";
        if (registerLink) registerLink.parentElement.style.display = "none";
        statusLi.textContent = `Prijava: ${user.email}`;
        if (!document.getElementById("authStatus"))
          navList?.appendChild(statusLi);
        if (!document.getElementById("logoutLink"))
          navList?.appendChild(logoutA.parentElement || logoutA);
      } else {
        if (loginLink) loginLink.parentElement.style.display = "";
        if (registerLink) registerLink.parentElement.style.display = "";
        statusLi.remove();
        logoutA.parentElement?.remove();
      }
    };

    // Ljepše poruke
    const nice = (err) => {
      const m = {
        "auth/invalid-credential":
          "Krivi email ili lozinka — ili račun ne postoji.",
        "auth/user-not-found":
          "Ne postoji račun za ovaj email. Registriraj se.",
        "auth/wrong-password": "Kriva lozinka.",
        "auth/invalid-email": "Neispravan email.",
        "auth/missing-password": "Upiši lozinku.",
        "auth/operation-not-allowed": "Email/lozinka nisu omogućeni u konzoli.",
        "auth/too-many-requests": "Previše pokušaja. Pokušaj kasnije.",
        "auth/network-request-failed": "Provjeri internet vezu.",
      };
      return m[err?.code] || err?.message || "Greška.";
    };

    // Submit handleri
    loginBox?.querySelector("form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.trim();
      const pass = document.getElementById("password")?.value;
      try {
        await auth.signInWithEmailAndPassword(email, pass);
        closeAuth();
        alert("Prijava uspješna!");
      } catch (err) {
        alert(nice(err));
      }
    });

    regBox?.querySelector("form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("new-email")?.value.trim();
      const pass = document.getElementById("new-password")?.value;
      try {
        await auth.createUserWithEmailAndPassword(email, pass);
        closeAuth();
        alert("Račun kreiran!");
      } catch (err) {
        alert(nice(err));
      }
    });

    document.addEventListener("click", async (e) => {
      if (e.target?.id === "logoutLink") {
        e.preventDefault();
        try {
          await auth.signOut();
          alert("Odjavljeni ste.");
        } catch (err) {
          alert(nice(err));
        }
      }
    });

    // Guard: zaštićene stranice (po potrebi dopuni)
    auth.onAuthStateChanged((user) => {
      setNavForUser(user);
      const protectedPages = ["/webshop.html"];
      const isProtected = protectedPages.some((p) =>
        location.pathname.endsWith(p)
      );
      if (!user && isProtected) openAuth("login");
    });
  }

  /* -------------------------------------------------------
   * 3) GLOBALNA KOŠARICA — badge + panel na SVIM stranicama
   * ----------------------------------------------------- */
  (function setupGlobalCart() {
    if (window.__globalCartInit) return;
    window.__globalCartInit = true;

    // Panel + overlay (ako nema)
    function ensurePanel() {
      if (!document.getElementById("cartOverlay")) {
        const ov = document.createElement("div");
        ov.id = "cartOverlay";
        ov.hidden = true;
        document.body.appendChild(ov);
      }
      if (!document.getElementById("cartPanel")) {
        const panel = document.createElement("aside");
        panel.id = "cartPanel";
        panel.setAttribute("aria-label", "Košarica");
        panel.hidden = true;
        panel.innerHTML = `
          <header>
            <h3>Vaša košarica</h3>
            <button class="cart-close" aria-label="Zatvori">×</button>
          </header>
          <div id="cartItemsList"></div>
          <footer>
            <strong>Ukupno:</strong>
            <span id="cartTotal">0,00 €</span>
          </footer>
        `;
        document.body.appendChild(panel);
      }
    }

    function openPanel() {
      const overlay = document.getElementById("cartOverlay");
      const panel = document.getElementById("cartPanel");
      overlay.hidden = false;
      panel.hidden = false;
      overlay.classList.add("open");
      panel.classList.add("open");
      document.body.classList.add("modal-open");
    }
    function closePanel() {
      const overlay = document.getElementById("cartOverlay");
      const panel = document.getElementById("cartPanel");
      panel.classList.remove("open");
      overlay.classList.remove("open");
      document.body.classList.remove("modal-open");
      setTimeout(() => {
        overlay.hidden = true;
        panel.hidden = true;
      }, 200);
    }

    // RTDB attach kad ima auth + DOM elemente
    let currRef = null,
      handlersBound = false;
    function attachHandlers() {
      if (handlersBound) return;
      const navCart = document.getElementById("navCart");
      const badge = document.getElementById("cartBadge");
      if (!navCart || !badge || !window.auth || !window.db) return;

      handlersBound = true;
      ensurePanel();

      // klik na Košarica
      navCart.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!auth.currentUser) {
            openAuth("login");
            return;
          }
          openPanel();
        },
        true
      ); // capture

      // zatvori panel
      document
        .getElementById("cartOverlay")
        .addEventListener("click", closePanel);
      document
        .getElementById("cartPanel")
        .querySelector(".cart-close")
        ?.addEventListener("click", closePanel);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePanel();
      });

      // badge + lista iz RTDB
      const listEl = document.getElementById("cartItemsList");
      const totalEl = document.getElementById("cartTotal");

      auth.onAuthStateChanged((user) => {
        if (currRef) {
          currRef.off("value");
          currRef = null;
        }
        if (!user) {
          badge.textContent = "0";
          window.__cartBadgeLive = false;
          listEl.innerHTML = `<p class="cart-empty" style="opacity:.7">Prijavi se kako bi vidjela košaricu.</p>`;
          totalEl.textContent = "0,00 €";
          return;
        }
        window.__cartBadgeLive = true;

        currRef = db.ref(`carts/${user.uid}/items`);
        currRef.on("value", (snap) => {
          const items = snap.val() || {};
          const rows = Object.entries(items);

          // badge
          let count = 0;
          for (const [, v] of rows) count += Number(v?.qty || 0);
          badge.textContent = String(count);

          // lista + total
          if (!rows.length) {
            listEl.innerHTML = `<p class="cart-empty" style="opacity:.7">Košarica je prazna.</p>`;
            totalEl.textContent = "0,00 €";
            return;
          }
          listEl.innerHTML = rows
            .map(
              ([id, v]) => `
            <div class="cart-row" data-id="${id}">
              <img class="cart-thumb" src="${v.imageUrl || ""}" alt="${
                v.nameSnapshot || id
              }">
              <div class="cart-info">
                <div class="cart-name">${v.nameSnapshot || id}</div>
                <div class="cart-price">${(
                  Number(v.priceSnapshot) || 0
                ).toFixed(2)} €</div>
              </div>
              <div class="cart-qty">
                <button class="qty-dec" aria-label="Smanji">–</button>
                <span class="qty-val">${v.qty || 1}</span>
                <button class="qty-inc" aria-label="Povećaj">+</button>
              </div>
              <button class="cart-del" aria-label="Ukloni">×</button>
            </div>
          `
            )
            .join("");
          const total = rows.reduce(
            (s, [, v]) =>
              s + (Number(v.qty) || 0) * (Number(v.priceSnapshot) || 0),
            0
          );
          totalEl.textContent = `${total.toFixed(2)} €`;
        });
      });

      // delegacija +/–/ukloni
      document
        .getElementById("cartItemsList")
        .addEventListener("click", async (e) => {
          const row = e.target.closest(".cart-row");
          if (!row || !auth.currentUser) return;
          const id = row.dataset.id;
          const itemRef = db.ref(`carts/${auth.currentUser.uid}/items/${id}`);
          if (e.target.classList.contains("qty-inc")) {
            await itemRef.transaction((curr) =>
              curr
                ? ((curr.qty = (curr.qty || 0) + 1),
                  (curr.updatedAt = Date.now()),
                  curr)
                : curr
            );
          } else if (e.target.classList.contains("qty-dec")) {
            await itemRef.transaction((curr) => {
              if (!curr) return curr;
              const q = (curr.qty || 1) - 1;
              return q <= 0
                ? null
                : ((curr.qty = q), (curr.updatedAt = Date.now()), curr);
            });
          } else if (e.target.classList.contains("cart-del")) {
            await itemRef.remove();
          }
        });
    }

    // čekaj da sve bude spremno
    function when(cond, fn) {
      const t0 = Date.now();
      const it = setInterval(() => {
        if (cond()) {
          clearInterval(it);
          fn();
        } else if (Date.now() - t0 > 15000) {
          clearInterval(it);
        }
      }, 120);
    }

    ensurePanel();
    when(
      () =>
        !!window.auth &&
        !!window.db &&
        document.getElementById("navCart") &&
        document.getElementById("cartBadge"),
      attachHandlers
    );

    // ako se #navCart/#cartBadge pojave kasnije (različiti headeri)
    const mo = new MutationObserver(() => {
      if (
        document.getElementById("navCart") &&
        document.getElementById("cartBadge") &&
        window.auth &&
        window.db
      ) {
        attachHandlers();
        mo.disconnect();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Guard: blokiraj “Dodaj u košaricu” bez prijave (opće)
    document.addEventListener(
      "click",
      (e) => {
        const trg = e.target;
        if (!window.auth || !auth.currentUser) {
          // gumbi koji dodaju u košaricu po stranicama:
          if (
            trg?.closest?.(".more-btn") ||
            trg?.closest?.("#modal-add-to-cart")
          ) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof openAuth === "function") openAuth("login");
            else authModal?.showModal();
          }
        }
      },
      true
    );
    /* === CART: najjednostavniji checkout u panelu (add-on) === */
    (function simpleCheckout() {
      // Mali helper da pričekamo da panel postoji
      function waitFor(cond, cb, ms = 120, max = 15000) {
        const t0 = Date.now();
        const it = setInterval(() => {
          if (cond()) {
            clearInterval(it);
            cb();
          } else if (Date.now() - t0 > max) {
            clearInterval(it);
          }
        }, ms);
      }

      waitFor(
        () => window.auth && window.db && document.getElementById("cartPanel"),
        () => {
          const panel = document.getElementById("cartPanel");
          const footer = panel?.querySelector("footer");
          const totalEl = document.getElementById("cartTotal");

          // 1) Gumbi u footeru (kreiraj ako ih nema)
          if (footer && !document.getElementById("cartCheckout")) {
            const actions = document.createElement("div");
            actions.className = "cart-actions";
            const clearBtn = document.createElement("button");
            clearBtn.id = "cartClear";
            clearBtn.textContent = "Isprazni";
            const payBtn = document.createElement("button");
            payBtn.id = "cartCheckout";
            payBtn.textContent = "Nastavi na plaćanje";
            actions.append(clearBtn, payBtn);
            footer.appendChild(actions);

            clearBtn.addEventListener("click", async () => {
              if (!auth.currentUser) {
                window.openAuth?.("login");
                return;
              }
              const snap = await db
                .ref(`carts/${auth.currentUser.uid}/items`)
                .get();
              if (!snap.exists()) return;
              if (!confirm("Sigurno želiš isprazniti košaricu?")) return;
              await db.ref(`carts/${auth.currentUser.uid}/items`).remove();
            });

            payBtn.addEventListener("click", async () => {
              if (!auth.currentUser) {
                window.openAuth?.("login");
                return;
              }

              // Učitaj svježe stavke + total na klik (bez dodatnih listenera)
              const uid = auth.currentUser.uid;
              const snap = await db.ref(`carts/${uid}/items`).get();
              const items = snap.val() || {};
              const rows = Object.entries(items);
              if (!rows.length) {
                alert("Košarica je prazna.");
                return;
              }
              const total = rows.reduce(
                (s, [, v]) =>
                  s + (Number(v.priceSnapshot) || 0) * (Number(v.qty) || 0),
                0
              );

              // 2) Checkout mini-forma (dialog) — kreiraj ako ne postoji
              let dlg = document.getElementById("checkoutModal");
              if (!dlg) {
                dlg = document.createElement("dialog");
                dlg.id = "checkoutModal";
                dlg.innerHTML = `<style>
    /* ===== My Happy Cloud — suptilni checkout ===== */
    #checkoutModal{
      --mhc-accent: #6a4a5e;
      --mhc-ink: #4b414b;
      --mhc-on-accent: #ffffff;
      --mhc-ring: rgba(91,61,80,.18);
      --mhc-card: #ffffff;
      --mhc-card-2: #faf8fb;
      --mhc-border: #eee;

      /* <dialog> — centriranje i okvir */
      padding: 0; border: none; margin: 0; border-radius: 20px;
      width: min(520px, 92vw); color: var(--mhc-ink);
      inset: 50% auto auto 50%; transform: translate(-50%, -50%);
      box-shadow: 0 10px 30px rgba(0,0,0,.12), 0 2px 10px rgba(0,0,0,.06);
    }
    #checkoutModal::backdrop{
      background: rgba(75,65,75,.50);
      backdrop-filter: blur(2px);
    }

    /* kartica unutar dialoga */
    #checkoutModal .ck-wrap{
      padding: 1.1rem;
      background: linear-gradient(180deg, var(--mhc-card), var(--mhc-card-2));
      border: 1px solid var(--mhc-border);
      border-radius: 20px;
      min-width: min(420px, 92vw);
    }

    #checkoutModal h3{
      margin: 0;
      font-size: clamp(1.1rem, 2.2vw, 1.35rem);
      letter-spacing: .2px;
    }

    #checkoutModal label{
      display:block; margin:.35rem 0 .1rem; font-size:.94rem;
    }

    #checkoutModal input,
    #checkoutModal textarea,
    #checkoutModal select{
      width: 100%;
      margin-top: .35rem;
      padding: .7rem .8rem;
      border-radius: 12px;
      border: 1px solid #e8e6ea;
      background: #fff;
      outline: none;
      transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
    }
    #checkoutModal input:focus,
    #checkoutModal textarea:focus,
    #checkoutModal select:focus{
      border-color: var(--mhc-accent);
      box-shadow: 0 0 0 4px var(--mhc-ring);
    }

    #checkoutModal .btn{
      appearance: none;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: .65rem .9rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
    }
    #checkoutModal .btn.primary{
      background: linear-gradient(180deg, #7a5970, var(--mhc-accent));
      color: var(--mhc-on-accent);
    }
    #checkoutModal .btn.primary:hover{
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0,0,0,.10);
      filter: brightness(1.03);
    }
    #checkoutModal .btn.ghost{
      background: #fafafa;
      border: 1px solid #ddd;
    }

    #checkoutModal .close-x{
      border: none; background: transparent;
      width: 34px; height: 34px; line-height: 1;
      border-radius: 999px; font-size: 22px;
      color: var(--mhc-ink); cursor: pointer;
      transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
    }
    #checkoutModal .close-x:hover{
      background: #f2edf3;
      box-shadow: 0 0 0 3px var(--mhc-ring) inset;
      transform: rotate(10deg) scale(1.02);
    }

    #ckMsg{ margin:.4rem 0 0; opacity:.85; }
    #ckMsg:empty{ display:none; }

    @media (max-width: 480px){
      #checkoutModal .ck-wrap{ min-width: min(96vw, 420px); }
    }
  </style>

  <div class="ck-wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
      <h3>Plaćanje</h3>
      <button id="ckClose" class="close-x" aria-label="Zatvori">×</button>
    </div>

    <!-- Maknuli smo method="dialog" da se dijalog ne zatvara automatski na submit -->
    <form id="ckForm">
      <label>Ime i prezime<br><input name="fullName" required></label>
      <label>E-mail<br><input type="email" name="email" required></label>
      <label>Telefon (opcionalno)<br><input type="tel" name="phone"></label>
      <label>Adresa i grad<br><textarea name="address" rows="3" required></textarea></label>
      <label>Način plaćanja<br>
        <select name="payment" required>
          <option value="pouzece">Pouzeće</option>
          <option value="uplata">Bankovna uplata</option>
        </select>
      </label>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.6rem">
        <strong>Ukupno:</strong>
        <span id="ckTotal">0,00 €</span>
      </div>

      <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.6rem">
        <button id="ckCancel" type="button" class="btn ghost">Odustani</button>
        <button id="ckSubmit" type="submit" class="btn primary">Pošalji narudžbu</button>
      </div>

      <p id="ckMsg"></p>
    </form>
  </div>`;

                document.body.appendChild(dlg);
                // Close handlers
                dlg
                  .querySelector("#ckClose")
                  .addEventListener("click", () => dlg.close());
                dlg
                  .querySelector("#ckCancel")
                  .addEventListener("click", () => dlg.close());
                dlg.addEventListener("cancel", (e) => {
                  e.preventDefault();
                  dlg.close();
                });
              }

              // Prefill + total
              dlg.querySelector("#ckTotal").textContent = `${total.toFixed(
                2
              )} €`;
              const f = dlg.querySelector("#ckForm");
              f.fullName.value = f.fullName.value || "";
              f.email.value = auth.currentUser.email || f.email.value || "";
              f.phone.value = f.phone.value || "";
              f.address.value = f.address.value || "";

              // Submit – snimi order u RTDB i isprazni košaricu
              const onSubmit = async (ev) => {
                ev.preventDefault();
                const msg = dlg.querySelector("#ckMsg");
                msg.textContent = "";
                const data = Object.fromEntries(new FormData(f).entries());

                const order = {
                  userId: uid,
                  email: data.email || auth.currentUser.email || "",
                  contact: {
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                  },
                  payment: data.payment,
                  items, // cijela košarica (snapshot)
                  total: Number(total.toFixed(2)),
                  createdAt: Date.now(),
                  status: "new",
                };

                try {
                  dlg.querySelector("#ckSubmit").disabled = true;
                  // upiši order
                  const ref = db.ref(`orders/${uid}`).push();
                  await ref.set(order);
                  // isprazni košaricu
                  await db.ref(`carts/${uid}/items`).remove();
                  msg.textContent =
                    "Hvala! Narudžba je zaprimljena. Provjeri e-mail. 📩";
                  setTimeout(() => dlg.close(), 900);
                } catch (err) {
                  msg.textContent = "Greška: " + (err?.message || err);
                } finally {
                  dlg.querySelector("#ckSubmit").disabled = false;
                }
              };

              // osiguraj da nije duplo vezan
              f.addEventListener("submit", onSubmit, { once: true });
              const _m = dlg.querySelector("#ckMsg");
              if (_m) _m.textContent = "";
              dlg.showModal();
            });
          }

          // (sigurnosno) ako nema totalEl, kreiraj
          if (!totalEl) {
            const t = document.createElement("span");
            t.id = "cartTotal";
            t.textContent = "0,00 €";
            panel
              ?.querySelector("footer")
              ?.insertBefore(
                t,
                panel.querySelector("footer")?.firstChild || null
              );
          }
        }
      );
    })();
  })();

  /* -------------------------------------------------------
   * 4) (opcionalno) Preusmjeravanje starih linkova u galeriju
   * ----------------------------------------------------- */
  // Ako imaš stare linkove na mape slika, možeš ovdje dodati mapiranje u galerija.html?cat=...
  // Ostavio sam prazno da ne pretpostavljam strukturu; javi ako želiš da dodam.
});
/* -------------------------------------------------------
 * CART MODAL (shared)
 * ----------------------------------------------------- */
(function setupCartModal() {
  const $ = (s, r = document) => r.querySelector(s);
  const modal = document.getElementById("cart-modal");
  if (!modal) return;

  function openCartModal() {
    modal.removeAttribute("hidden");
    modal.classList.add("show");
    modal.style.removeProperty("display");
    document.body.classList.add("modal-open");
    $("#modal-quantity")?.focus();
  }
  function closeCartModal() {
    modal.classList.remove("show");
    modal.setAttribute("hidden", "");
    modal.style.removeProperty("display");
    document.body.classList.remove("modal-open");
  }

  function ensureQtyButtons() {
    const q = $("#modal-quantity");
    if (!q || q.dataset.enhanced) return;
    q.dataset.enhanced = "1";
    const wrap = document.createElement("div");
    wrap.className = "qty";
    const dec = document.createElement("button");
    dec.type = "button";
    dec.className = "qty-btn";
    dec.textContent = "–";
    const inc = document.createElement("button");
    inc.type = "button";
    inc.className = "qty-btn";
    inc.textContent = "+";
    q.parentNode.insertBefore(wrap, q);
    wrap.append(dec, q, inc);
    const clamp = () => Math.max(1, parseInt(q.value || "1", 10));
    dec.addEventListener(
      "click",
      () => (q.value = String(Math.max(1, clamp() - 1)))
    );
    inc.addEventListener("click", () => (q.value = String(clamp() + 1)));
  }
  // ——— Toast (status) + optimistični badge ———
  function ensureToast() {
    let t = document.getElementById("cartToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "cartToast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      t.textContent = "Dodano u košaricu";
      document.body.appendChild(t);
    }
    return t;
  }
  function showToast(msg = "Dodano u košaricu") {
    const t = ensureToast();
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => t.classList.remove("show"), 1800);
  }
  function optimisticBadgeIncrement(delta = 1) {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const n = parseInt(badge.textContent || "0", 10);
    if (!Number.isNaN(n)) badge.textContent = String(Math.max(0, n + delta));
  }

  function fillAndOpen(product) {
    if (!product) return;

    const name = product["Naziv proizvoda"] || product.title || "";
    const titleExtra =
      product.title && product.title !== name ? ` (${product.title})` : "";

    const imgEl = $("#modal-image");
    if (imgEl) {
      imgEl.src = product.image || "";
      imgEl.alt = name;
    }
    $("#modal-title").textContent = name + titleExtra;
    $("#modal-description").textContent =
      (product.description || "").trim() || "Opis nije dostupan.";

    const rawPrice =
      product.price ??
      product.Cijena ??
      product.cijena ??
      product.price_eur ??
      product.priceEUR;
    $("#modal-price").textContent =
      rawPrice !== undefined && String(rawPrice).trim() !== ""
        ? `${rawPrice} €`
        : "Cijena na upit";

    const q = $("#modal-quantity");
    if (q) {
      q.type = "number";
      q.min = "1";
      q.value = "1";
    }

    // spremi u dataset za “Dodaj u košaricu”
    modal.dataset.productId =
      product["data-product"] || product.id || name || "";
    modal.dataset.productName = name || product.id || "";
    modal.dataset.productImage = product.image || "";
    modal.dataset.productPrice = String(rawPrice ?? "").trim();

    ensureQtyButtons();
    openCartModal();
  }

  // close handlers
  modal
    .querySelector(".close-modal")
    ?.addEventListener("click", closeCartModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeCartModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCartModal();
  });

  // add-to-cart (bind once)
  const addBtn = document.getElementById("modal-add-to-cart");
  if (addBtn && addBtn.dataset.bound !== "1") {
    addBtn.dataset.bound = "1";
    addBtn.addEventListener("click", async () => {
      try {
        if (!window.auth || !auth.currentUser) {
          if (typeof openAuth === "function") openAuth("login");
          else alert("Prijava je obavezna.");
          return;
        }
        const uid = auth.currentUser.uid;
        const pid = modal.dataset.productId || "";
        const name = modal.dataset.productName || pid;
        const image = modal.dataset.productImage || "";
        const raw = modal.dataset.productPrice || "";
        const price =
          parseFloat(
            String(raw)
              .replace(",", ".")
              .replace(/[^\d.]/g, "")
          ) || 0;
        const qty = Math.max(
          1,
          parseInt(document.getElementById("modal-quantity")?.value || "1", 10)
        );

        const ref = db.ref(`carts/${uid}/items/${pid}`);
        const payload = {
          nameSnapshot: name,
          priceSnapshot: price,
          imageUrl: image,
          qty,
          addedAt: Date.now(),
        };

        await ref.transaction((curr) => {
          if (curr) {
            curr.qty = (Number(curr.qty) || 0) + qty;
            curr.nameSnapshot = name;
            curr.priceSnapshot = price;
            curr.imageUrl = image;
            curr.updatedAt = Date.now();
            return curr;
          }
          return payload;
        });

        // Ako je live listener aktivan, on će postaviti badge točno stanje;
        // inače — optimistični +qty da korisnica odmah vidi promjenu.
        if (!window.__cartBadgeLive) optimisticBadgeIncrement(qty);

        showToast("Dodano u košaricu");
        closeCartModal();
      } catch (err) {
        console.error("Add to cart error", err);
        alert("Nešto je pošlo po zlu pri dodavanju u košaricu.");
      }
    });
  }

  // public API
  window.__cartModal = {
    open: openCartModal,
    close: closeCartModal,
    showProduct: fillAndOpen,
  };
})();

/* ===== Paginacija – ZAJEDNIČKI HELPERI (globalno) ===== */
(function paginationModule() {
  // ako već postoje, ne redefiniraj
  if (window.applyPagination && window.applyPaginationPairs) return;

  function getURL() {
    try {
      return new URL(location.href);
    } catch {
      return null;
    }
  }
  function getStartPage(id) {
    const u = getURL();
    if (!u) return 1;
    const raw = parseInt(u.searchParams.get("p_" + id), 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }
  function setPageInURL(id, page) {
    const u = getURL();
    if (!u) return;
    u.searchParams.set("p_" + id, String(page));
    history.replaceState({}, "", u);
  }

  // ------- tvorničica navigacije + "Prikaži:" select -------
  function makeNav(totalPages, current, onGo, opts = {}) {
    const nav = document.createElement("div"); // <div> (ne <nav>) — da ga ne sakrije neki globalni CSS
    nav.className = "pagination";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Paginacija proizvoda");

    const btnPrev = document.createElement("button");
    btnPrev.type = "button";
    btnPrev.textContent = "‹ Prethodna";
    btnPrev.addEventListener("click", () => onGo(current - 1));

    const indicator = document.createElement("span");
    indicator.className = "page-indicator";

    const btnNext = document.createElement("button");
    btnNext.type = "button";
    btnNext.textContent = "Sljedeća ›";
    btnNext.addEventListener("click", () => onGo(current + 1));

    nav.append(btnPrev, indicator, btnNext);

    // "Prikaži: X" select
    const { perPageOptions = [], currentPerPage, onPerPageChange } = opts;
    if (perPageOptions.length && typeof onPerPageChange === "function") {
      const label = document.createElement("label");
      label.className = "pp-label";
      label.style.marginLeft = "12px";
      label.append("Prikaži: ");

      const sel = document.createElement("select");
      perPageOptions.forEach((n) => {
        const o = document.createElement("option");
        o.value = n;
        o.textContent = n;
        if (Number(n) === Number(currentPerPage)) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", () => onPerPageChange(Number(sel.value)));
      label.append(sel, document.createTextNode(" po stranici"));
      nav.append(label);
    }

    nav.__refresh = (cur, tp) => {
      current = cur; // ⬅️ sinkronizacija za prev/next
      indicator.textContent = `Stranica ${cur}/${tp}`;
      btnPrev.disabled = cur <= 1;
      btnNext.disabled = cur >= tp;
    };

    return nav;
  }

  // ------- standardne KARTICE (npr. .card.generated) -------
  window.applyPagination = function (
    container,
    {
      itemSelector = ".card",
      perPage = 12, // default 12 — vidi se u "Prikaži:"
      id = null,
      scrollToTop = true,
      perPageOptions = [12, 24, 40, 80],
    } = {}
  ) {
    if (!container) return;
    // ukloni SVE postojeće pagere u istom parentu (spriječi duple evente)
    // ukloni SVE postojeće pagere u istom parentu (spriječi duple evente)
    const parent = container.parentElement;
    if (parent)
      parent
        .querySelectorAll(":scope > .pagination")
        .forEach((el) => el.remove());

    const items = Array.from(container.querySelectorAll(itemSelector));
    const pid =
      id || container.id || "pg_" + Math.random().toString(36).slice(2);
    let perPageVal =
      Number(localStorage.getItem("pp_" + pid)) || Number(perPage) || 12;

    if (items.length <= perPageVal) {
      items.forEach((el) => (el.hidden = false));
      return;
    }

    let current = getStartPage(pid);
    const totalPages = () => Math.ceil(items.length / perPageVal) || 1;

    function showPage(n) {
      const tp = totalPages();
      current = Math.min(Math.max(1, n), tp);
      const start = (current - 1) * perPageVal;
      const end = start + perPageVal;
      items.forEach((el, i) => {
        el.hidden = !(i >= start && i < end);
      });
      setPageInURL(pid, current);
      nav.__refresh(current, tp);
      if (scrollToTop)
        container.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const nav = makeNav(totalPages(), current, showPage, {
      perPageOptions,
      currentPerPage: perPageVal,
      onPerPageChange: (val) => {
        perPageVal = val;
        localStorage.setItem("pp_" + pid, String(val));
        showPage(1);
      },
    });

    showPage(current);
    container.after(nav);
    return {
      destroy() {
        nav.remove();
        items.forEach((el) => (el.hidden = false));
      },
    };
  };

  // ------- PAROVI (npr. “Svi”: <span.tooltip-trigger> + <a.more-btn>) -------
  window.applyPaginationPairs = function (
    container,
    {
      pairSelector = ".tooltip-trigger",
      perPage = 40, // default 40 — vidi se u "Prikaži:"
      id = "pairs",
      scrollToTop = true,
      perPageOptions = [20, 40, 60, 100],
    } = {}
  ) {
    if (!container) return;
    if (container.nextElementSibling?.classList?.contains("pagination")) {
      container.nextElementSibling.remove();
    }

    const triggers = Array.from(container.querySelectorAll(pairSelector));
    if (!triggers.length) return;

    let perPageVal =
      Number(localStorage.getItem("pp_" + id)) || Number(perPage) || 40;
    if (triggers.length <= perPageVal) return;

    let current = getStartPage(id);
    const totalPages = () => Math.ceil(triggers.length / perPageVal) || 1;

    function setVisible(n) {
      const tp = totalPages();
      current = Math.min(Math.max(1, n), tp);
      const start = (current - 1) * perPageVal;
      const end = start + perPageVal;

      triggers.forEach((span, i) => {
        const sib = span.nextElementSibling; // može biti <a.more-btn> ili .tile-right
        const show = i >= start && i < end;
        span.hidden = !show;
        if (sib) sib.hidden = !show; // pokrij i wrapper
      });

      setPageInURL(id, current);
      nav.__refresh(current, tp);
      if (scrollToTop)
        container.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const nav = makeNav(totalPages(), current, setVisible, {
      perPageOptions,
      currentPerPage: perPageVal,
      onPerPageChange: (val) => {
        perPageVal = val;
        localStorage.setItem("pp_" + id, String(val));
        setVisible(1);
      },
    });

    setVisible(current);
    container.after(nav);

    return {
      destroy() {
        nav.remove();
        triggers.forEach((span) => {
          span.hidden = false;
          const btn = span.nextElementSibling;
          if (btn) btn.hidden = false;
        });
      },
    };
  };
})();
// === MINI SEARCH (global, na svim stranicama) — prijedlozi + klik na proizvod ===
(function () {
  const FORMS = () => Array.from(document.querySelectorAll("#search"));
  const INPUT = (f) =>
    f.querySelector('input[name="search"], input[type="text"]');

  // ❶ Putanje do JSON-a (tvoja stvarna je prva)
  const CANDIDATES = [
    "Script/products.json",
    "script/products.json",
    "products.json",
    "./products.json",
    "data/products.json",
    "assets/products.json",
    "assets/json/products.json",
    "JSON/products.json",
  ];

  // ❷ Normalizacija (case + dijakritika, uključujući đ/Đ)
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d");

  let CACHE = null,
    USED_URL = null;
  async function loadProducts() {
    if (CACHE) return CACHE;
    for (const url of CANDIDATES) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const data = await r.json();
        const arr = Array.isArray(data)
          ? data
          : data.products || data.items || [];
        if (!Array.isArray(arr)) continue;

        const lower = (o) =>
          Object.fromEntries(
            Object.entries(o).map(([k, v]) => [String(k).toLowerCase(), v])
          );
        const pick = (o, keys) => {
          for (const k of keys) {
            if (o[k] != null && o[k] !== "") return o[k];
          }
          return "";
        };

        CACHE = arr.map((p) => {
          const lo = lower(p);
          const name = pick(lo, ["name", "naziv", "naziv proizvoda", "title"]);
          const cat = pick(lo, ["category", "kategorija", "data-category"]);
          const tags = pick(lo, ["tags", "tagovi", "oznake"]);
          const desc = pick(lo, ["description", "opis"]);
          const img = pick(lo, ["image", "slika", "img", "photo", "src"]);
          const price = pick(lo, ["price", "cijena", "price_eur", "priceeur"]);
          const id = pick(lo, ["id", "data-product", "sku", "šifra"]) || name;
          const url = pick(lo, ["url", "link", "href"]);
          const tagStr = Array.isArray(tags)
            ? tags.join(" ")
            : String(tags || "");
          return {
            id,
            name,
            cat,
            tags: tagStr,
            desc,
            img,
            price,
            url,
            raw: p,
            hay: norm([name, cat, tagStr, desc].join(" ")),
          };
        });

        USED_URL = url;
        console.info("[SEARCH] Učitano", CACHE.length, "stavki iz", USED_URL);
        // izloži za debug i za klik-handler
        window.__SEARCH_CACHE = CACHE;
        window.__searchDiag = {
          count: CACHE.length,
          from: USED_URL,
          sample: CACHE.slice(0, 3),
        };
        return CACHE;
      } catch {
        /* pokušaj sljedeću putanju */
      }
    }
    console.warn("[SEARCH] products.json nije pronađen u:", CANDIDATES);
    CACHE = [];
    window.__SEARCH_CACHE = CACHE;
    window.__searchDiag = {
      error: "products.json nije pronađen",
      tried: CANDIDATES,
    };
    return CACHE;
  }

  async function runQuery(q) {
    const nq = norm(q);
    if (!nq) return [];
    const items = await loadProducts();
    return items
      .map((it) => {
        let s = 0;
        const nname = norm(it.name),
          ncat = norm(it.cat);
        if (nname.startsWith(nq)) s += 50;
        else if (nname.includes(nq)) s += 30;
        if (it.hay.includes(nq)) s += 15;
        if (ncat.startsWith(nq)) s += 8;
        return { ...it, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);
  }

  // ❸ UI za prijedloge + poruka o grešci ispod forme
  function ensureUI(form) {
    let box = form.querySelector(".search-suggest");
    if (!box) {
      box = document.createElement("div");
      box.className = "search-suggest";
      box.style.cssText = `
        position:absolute; left:0; right:0; top:calc(100% + 6px);
        background:#fff; border:1px solid #e9e9ee; border-radius:12px;
        box-shadow:0 10px 28px rgba(0,0,0,.08); padding:.4rem;
        z-index:9999; max-height:320px; overflow:auto;
      `;
      form.style.position = form.style.position || "relative";
      form.appendChild(box);
      box.hidden = true;
    }
    let err = form.querySelector(".search-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "search-error";
      err.style.cssText =
        "margin-top:.4rem;color:#b00020;font-size:.9em;display:none;";
      form.appendChild(err);
    }
    return { box, err };
  }

  function render(box, items) {
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = items
      .map(
        (p) => `
      <div class="item"
           data-id="${String(p.id).replace(/"/g, "&quot;")}"
           data-cat="${String(p.cat || "").replace(/"/g, "&quot;")}"
           style="display:flex;gap:.6rem;align-items:center;padding:.45rem;border-radius:10px;cursor:pointer">
        <img src="${p.img || ""}" alt="" loading="lazy"
             style="width:36px;height:36px;object-fit:cover;border-radius:8px;background:#f2f2f2">
        <div>
          <div style="font-weight:600">${p.name || ""}</div>
          <div style="opacity:.7;font-size:.9em">${p.cat || ""}</div>
        </div>
        <div style="margin-left:auto;opacity:.8">${
          p.price !== "" && p.price != null ? `${p.price} €` : ""
        }</div>
      </div>
    `
      )
      .join("");
  }

  // ❹ Otvori proizvod: modal ako postoji, inače deep-link na webshop.html
  const WEB_SHOP_PAGE = "webshop.html";
  function openProduct(prod) {
    if (!prod) return;
    // App modal/detalji ako postoji
    if (typeof window.openProductDetails === "function") {
      window.openProductDetails(prod.raw || prod);
      return;
    }
    if (window.__cartModal?.showProduct) {
      window.__cartModal.showProduct(prod.raw || prod);
      return;
    }
    // URL iz JSON-a ako postoji
    if (prod.url) {
      location.href = prod.url;
      return;
    }
    // Fallback: webshop.html?product=<id>&cat=<kategorija>
    const u = new URL(WEB_SHOP_PAGE, location.href);
    u.searchParams.set("product", prod.id);
    if (prod.cat) u.searchParams.set("cat", prod.cat);
    location.href = u.href;
  }

  // ❺ Poveži forme
  function bind(form) {
    const input = INPUT(form);
    if (!input || input.dataset.bound) return;
    input.dataset.bound = "1";
    const { box, err } = ensureUI(form);

    const deb = (fn, ms = 150) => {
      let t;
      return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
      };
    };
    const setErr = (msg) => {
      err.textContent = msg || "";
      err.style.display = msg ? "block" : "none";
    };

    input.addEventListener(
      "input",
      deb(async () => {
        const q = input.value.trim();
        if (q.length < 2) {
          box.hidden = true;
          box.innerHTML = "";
          setErr("");
          return;
        }
        const list = await runQuery(q);
        render(box, list);
        if (!CACHE || CACHE.length === 0)
          setErr("⚠️ products.json nije pronađen (provjeri putanju).");
        else setErr("");
      }, 160)
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      const list = await runQuery(q);
      render(box, list);
      if (!list.length && CACHE && CACHE.length > 0)
        setErr(`Nema rezultata za “${q}”.`);
      else setErr("");
    });

    // Klik na prijedlog → otvori proizvod
    box.addEventListener("click", (e) => {
      const it = e.target.closest(".item");
      if (!it) return;
      const id = it.dataset.id;
      const prod = (window.__SEARCH_CACHE || CACHE || []).find(
        (x) => String(x.id) === String(id)
      );
      box.hidden = true;
      if (prod) openProduct(prod);
    });

    // Zatvori kad klikneš izvan
    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) box.hidden = true;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") box.hidden = true;
    });
  }

  function init() {
    FORMS().forEach(bind);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  // ❻ Deep-link: ako URL ima ?product=… skrolaj do kartice i otvori detalje
  (function deepLinkToProduct() {
    const pid = new URLSearchParams(location.search).get("product");
    if (!pid) return;

    // vizualni highlight za lakše praćenje
    if (!document.getElementById("hl-prod-style")) {
      const st = document.createElement("style");
      st.id = "hl-prod-style";
      st.textContent = `.highlight-product{outline:2px solid #8a4a6a; outline-offset:4px; border-radius:12px;}`;
      document.head.appendChild(st);
    }
    const sel = `[data-product="${CSS && CSS.escape ? CSS.escape(pid) : pid}"]`;

    const tryOpen = () => {
      const card = document.querySelector(sel);
      if (!card) return false;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("highlight-product");
      setTimeout(() => card.classList.remove("highlight-product"), 1600);
      const btn = card.querySelector(
        '[data-act="details"], .details, .more-btn, button'
      );
      if (btn && btn.click) btn.click();
      return true;
    };

    if (!tryOpen()) {
      let tries = 20;
      const t = setInterval(() => {
        if (tryOpen() || !--tries) clearInterval(t);
      }, 200);
    }
  })();
})();
/* =====================================================
 * SHARED HELPERS (global) — imgUrl, fetchProducts
 * ===================================================*/
(function () {
  window.MHC = window.MHC || {};

  const PRODUCT_PATHS = ["Script/products.json"];

  window.MHC.fetchProducts = async function fetchProducts() {
    const tried = [];
    for (const p of PRODUCT_PATHS) {
      try {
        const r = await fetch(p, { cache: "no-store" });
        tried.push(`${p} → ${r.status}`);
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) {
            const a = document.createElement("a");
            a.href = p;
            window.__ASSET_BASE = a.href.replace(
              /Script\/products\.json(\?.*)?$/,
              ""
            );
            console.log("[Shared] Asset base:", window.__ASSET_BASE);
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
  };

  window.MHC.imgUrl = function imgUrl(src) {
    if (!src) return "";
    let s = String(src)
      .trim()
      .replace(/\\/g, "/")
      .replace(/(^|[^:])\/{2,}/g, (_, a) => (a || "") + "/");
    if (/^(https?:)?\/\//i.test(s)) return s;
    s = s.replace(/^\/+/, "");
    if (window.__ASSET_BASE) {
      try {
        return new URL(s, window.__ASSET_BASE).href;
      } catch {}
    }
    return s.startsWith("./") ? s : "./" + s;
  };
})();
