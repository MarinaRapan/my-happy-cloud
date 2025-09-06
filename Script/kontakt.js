// Script/kontakt.js — kontakt stranica (animacija + Firestore submit, bez miješanja sa globalnim script.js)
(() => {
  // === HERO animacija (meki ulaz slike + teksta) ===
  const hero = document.querySelector(".kontakt-hero");
  const img = hero?.querySelector(".hero-media img");
  const text = hero?.querySelector(".hero-text");
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateHero() {
    if (!hero || !img) return;
    // Omogući CSS tranzicije koje već imaš u kontakt.css
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

    // Slika: lagani slide down + fade-in
    img.animate(
      [
        { opacity: 0, transform: "translateY(-24px) scale(1.02)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 800, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
    );

    // Tekst: kratki fade-up, malo kasnije
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

  // === Kontakt forma → Firestore ===
  const form = document.getElementById("contactForm");
  if (!form) return;

  const statusEl = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", !!isError);
  }

  async function ensureFirebase() {
    const cfg = window.__FIREBASE_CONFIG;
    if (!cfg)
      throw new Error(
        "Firebase config nije pronađen (window.__FIREBASE_CONFIG)."
      );

    // Modularni SDK — dinamički import (radi i iz klasičnog <script> taga)
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    );
    const { getFirestore, collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const app = initializeApp(cfg);
    const db = getFirestore(app);
    return { db, collection, addDoc, serverTimestamp };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("#ime")?.value.trim() || "";
    const email = form.querySelector("#mail")?.value.trim() || "";
    const type = form.querySelector("#tema")?.value.trim() || "";
    const message = form.querySelector("#poruka")?.value.trim() || "";
    const file = form.querySelector("#foto")?.files?.[0] || null;

    if (!name || !email || !message) {
      setStatus("Molimo ispunite ime, e‑poštu i poruku.", true);
      return;
    }

    // UI: disable gumb + status
    const prevLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Šaljem…";
    }
    setStatus("Šaljem…");

    try {
      const { db, collection, addDoc, serverTimestamp } =
        await ensureFirebase();

      await addDoc(collection(db, "kontakt_poruke"), {
        name,
        email,
        type,
        message,
        hasPhoto: !!file,
        photoName: file ? file.name : null, // napomena: samo ime; upload u Storage možemo dodati kasnije
        createdAt: serverTimestamp(),
        page: "kontakt.html",
        ua: navigator.userAgent || "",
      });

      setStatus("✅ Hvala! Poruka je zaprimljena.");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus(
        "Došlo je do greške pri slanju. Pokušajte ponovno ili pošaljite e‑poštu na myhappycloud@gmail.com.",
        true
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel || "Pošalji";
      }
    }
  });
})();
