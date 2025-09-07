// Script/kontakt.js — RTDB submit; FIX: pričekaj auth init na prvom kliku
(() => {
  // === HERO animacija (kao i prije) ===
  const hero = document.querySelector(".kontakt-hero");
  const img = hero?.querySelector(".hero-media img");
  const text = hero?.querySelector(".hero-text");
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animateHero() {
    if (!hero || !img) return;
    hero.classList.add("is-animate");
    if (REDUCED) {
      img.style.opacity = "1";
      img.style.transform = "none";
      if (text) {
        text.style.opacity = "1";
        text.style.transform = "none";
      }
      return;
    }
    img.animate(
      [
        { opacity: 0, transform: "translateY(-24px) scale(1.02)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 800, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
    );
    if (text) {
      text.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 600, easing: "ease-out", delay: 150, fill: "forwards" }
      );
    }
  }
  animateHero();

  const form = document.getElementById("contactForm");
  if (!form) return;

  const statusEl = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const prevLabel = submitBtn?.textContent || "Pošalji";

  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", !!isError);
  }
  function lockBtn() {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Šaljem…";
    }
  }
  function unlockBtn() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  }

  // ⏳ pričekaj da Auth sigurno inicijalizira currentUser (radi i za compat i modular)
  async function waitForAuthUser(auth, timeoutMs = 3000) {
    if (auth?.currentUser) return auth.currentUser;

    // prvo probaj compat stil (auth.onAuthStateChanged)
    if (auth && typeof auth.onAuthStateChanged === "function") {
      return await new Promise((resolve) => {
        const to = setTimeout(
          () => resolve(auth.currentUser || null),
          timeoutMs
        );
        const unsub = auth.onAuthStateChanged((u) => {
          clearTimeout(to);
          unsub();
          resolve(u);
        });
      });
    }

    // fallback na modular (import funkcije)
    try {
      const { onAuthStateChanged } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
      );
      return await new Promise((resolve) => {
        const to = setTimeout(
          () => resolve(auth.currentUser || null),
          timeoutMs
        );
        const unsub = onAuthStateChanged(auth, (u) => {
          clearTimeout(to);
          unsub();
          resolve(u);
        });
      });
    } catch {
      return auth?.currentUser || null;
    }
  }

  // sigurnosni watchdog da UI ne ostane na "Šaljem…"
  let finished = false;
  const watchdog = setTimeout(() => {
    if (!finished) {
      setStatus("⏳ Spor pristup ili blokiran Firebase.", true);
      unlockBtn();
    }
  }, 15000);

  async function getFirebase() {
    const cfgRaw = window.__FIREBASE_CONFIG;
    if (!cfgRaw)
      throw new Error("Nedostaje window.__FIREBASE_CONFIG u kontakt.html.");
    if (!cfgRaw.databaseURL)
      throw new Error("Nedostaje databaseURL u Firebase configu.");
    const cfg = {
      ...cfgRaw,
      databaseURL: String(cfgRaw.databaseURL).replace(/\/+$/, ""),
    };

    // Modularni SDK + koristi GLOBALNE compat instance ako postoje (usklađeno s kontakt.html)
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    );
    const { getDatabase, ref, push, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"
    );
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);

    const db = window.db || getDatabase(app, cfg.databaseURL);
    const auth =
      window.auth ||
      (
        await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
        )
      ).getAuth(app);

    return { db, ref, push, serverTimestamp, auth };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("#ime")?.value.trim() || "";
    const email = form.querySelector("#mail")?.value.trim() || "";
    const type = form.querySelector("#tema")?.value.trim() || "";
    const message = form.querySelector("#poruka")?.value.trim() || "";
    const file = form.querySelector("#foto")?.files?.[0] || null;

    if (!name || !email || !message) {
      setStatus("Molimo ispunite ime, e-poštu i poruku.", true);
      return;
    }

    lockBtn();
    setStatus("Šaljem…");

    try {
      const { db, ref, push, serverTimestamp, auth } = await getFirebase();

      // ✅ NOVO: pričekaj auth init na prvom submitu
      const user = await waitForAuthUser(auth, 4000);
      if (!user) {
        setStatus("Za slanje poruke potrebno je biti prijavljen.", true);
        unlockBtn();
        return;
      }

      await push(ref(db, "kontakt_poruke"), {
        name,
        email,
        type,
        message,
        hasPhoto: !!file,
        photoName: file ? file.name : null,
        createdAt: serverTimestamp(),
        page: "kontakt.html",
        ua: navigator.userAgent || "",
        uid: user.uid,
      });

      finished = true;
      clearTimeout(watchdog);
      setStatus("✅ Hvala! Poruka je zaprimljena.");
      form.reset();
    } catch (err) {
      console.error(err);
      finished = true;
      clearTimeout(watchdog);
      setStatus(
        "⚠️ " + (err?.message || err?.code || "Došlo je do greške pri slanju."),
        true
      );
    } finally {
      unlockBtn();
    }
  });
})();
