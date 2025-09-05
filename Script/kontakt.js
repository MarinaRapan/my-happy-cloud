// Script/kontakt.js — mekani ulaz odozgo, ostaje vidljivo (bez trzaja)
(function () {
  const hero = document.querySelector(".kontakt-hero");
  if (!hero) return;

  const media = hero.querySelector(".hero-media");
  const img = media ? media.querySelector("img") : null;
  if (!media || !img) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1) Početno, ali ne diramo layout teksta
  function setInitial() {
    img.style.willChange = "transform, opacity";
    img.style.transformOrigin = "50% 50%";
    img.style.transform = "translateY(-24px)"; // malo iznad
    img.style.opacity = "0";
  }

  // 2) Čekamo da je slika spremna (sprječava trzaje)
  async function ready() {
    try {
      if (img.decode) await img.decode();
    } catch (e) {}
  }

  // 3) Ulaz: blagi slide + fade, pa miruje
  async function softStay() {
    await ready();
    setInitial();

    if (REDUCED) {
      img.style.transform = "none";
      img.style.opacity = "1";
      img.style.willChange = "auto";
      return;
    }

    const enter = img.animate(
      [
        { transform: "translateY(-24px)", opacity: 0 },
        { transform: "translateY(0px)", opacity: 1 },
      ],
      {
        duration: 900,
        easing: "cubic-bezier(0.16,1,0.3,1)", // mekano ease-out
        fill: "forwards",
      }
    );

    enter.addEventListener(
      "finish",
      () => {
        // Zaključaj konačno stanje i otpusti will-change (bolje perf)
        img.style.transform = "translateY(0px)";
        img.style.opacity = "1";
        img.style.willChange = "auto";
      },
      { once: true }
    );
  }

  // 4) (Opcionalno) Umjesto slidea, “zavjesa” s lijeva/desna — ostaje mirno.
  //    Uključi tako da pozoveš runCurtain() umjesto softStay() niže.
  async function runCurtain() {
    await ready();
    // ne diramo početni transform — koristimo clipPath
    img.style.opacity = "1";
    img.style.clipPath = "inset(0 50% 0 50%)";
    img.style.willChange = "clip-path";

    if (REDUCED) {
      img.style.clipPath = "inset(0 0 0 0)";
      img.style.willChange = "auto";
      return;
    }

    const curtain = img.animate(
      [{ clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)" }],
      {
        duration: 900,
        easing: "cubic-bezier(0.16,1,0.3,1)",
        fill: "forwards",
      }
    );

    curtain.addEventListener(
      "finish",
      () => {
        img.style.clipPath = "inset(0 0 0 0)";
        img.style.willChange = "auto";
      },
      { once: true }
    );
  }

  // — Pokreni željeni efekt (default: mekani ulaz i ostaje) —
  softStay();
  // runCurtain();
  //  // <- ako želiš “spajanje” s lijeva/desna, odkomentiraj ovu liniju i zakomentiraj softStay()
})();
