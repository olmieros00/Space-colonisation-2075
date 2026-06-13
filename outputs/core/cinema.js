const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const CARDS = {
  boot: {
    variant: "crawl",
    kicker: "Frontier 2075",
    title: "The Moonbound Age",
    subtitle: "A human route from Earth to Imbrium Haven",
    signature: "First Light Archive // Civilian Transit Reel",
    crawl: "In the first decades after the great climb, the old blue planet did not become smaller. It became the promise in every window. From Starbase Texas, the Colossus fleet opens a path through Guardian Net, across Gateway Station, and onward to the first lunar city people can call home."
  },
  hub: {
    variant: "iris",
    kicker: "Frontier 2075",
    title: "First Light",
    subtitle: "Starbase Texas // launch coast",
    signature: "Colossus clearance active"
  },
  orbit: {
    variant: "hyperspace",
    kicker: "Chapter I",
    title: "The First Climb",
    subtitle: "Earth orbit // Guardian Net",
    signature: "AI1 constellation tracking nominal"
  },
  gateway: {
    variant: "iris",
    kicker: "Chapter II",
    title: "The Crossing",
    subtitle: "Gateway Station // orbital transfer city",
    signature: "Centrifuge ring vector locked"
  },
  moon: {
    variant: "crawl",
    kicker: "Chapter III",
    title: "Imbrium Haven",
    subtitle: "The first open lunar address",
    signature: "Mare Imbrium civic beacon",
    crawl: "Above the basalt plain, Earth hangs like a memory with weather. The new city wakes under shielded glass, built by people who crossed the dark not to escape home, but to widen it."
  },
  starcloud: {
    variant: "hyperspace",
    kicker: "Atlas Class",
    title: "Starcloud",
    subtitle: "~50GW orbital data haven",
    signature: "Service droids awake // lasercom open"
  }
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function readyCinemaFonts() {
  if (!document.fonts) return;
  const loads = [
    document.fonts.load("900 96px Bungee Inline"),
    document.fonts.load("900 96px Orbitron"),
    document.fonts.load("48px Audiowide"),
    document.fonts.load("800 34px Oxanium"),
    document.fonts.load("600 32px Saira Condensed"),
    document.fonts.load("18px Share Tech Mono")
  ];
  await Promise.race([
    Promise.allSettled(loads).then(() => document.fonts.ready),
    wait(2500)
  ]);
}

export function hideCinematicTitle(UI) {
  if (!UI.cinema) return;
  UI.cinema.classList.remove("show", "crawl", "hyperspace", "iris");
  UI.cinema.setAttribute("aria-hidden", "true");
}

export async function showCinematicTitle(UI, key, options = {}) {
  const card = CARDS[key] || CARDS.hub;
  if (!UI.cinema || !UI.cinemaTitle) return;
  const variant = options.variant || card.variant || "iris";
  const duration = reduceMotion ? Math.min(options.duration || 900, 700) : options.duration || (variant === "crawl" ? 3200 : 1350);

  UI.cinemaKicker.textContent = options.kicker || card.kicker || "";
  UI.cinemaTitle.textContent = options.title || card.title || "";
  UI.cinemaSubtitle.textContent = options.subtitle || card.subtitle || "";
  UI.cinemaSignature.textContent = options.signature || card.signature || "";
  UI.cinemaCrawl.textContent = options.crawl || card.crawl || "";
  UI.cinema.className = variant;
  UI.cinema.setAttribute("aria-hidden", "false");

  // Restart CSS animations on repeat visits.
  void UI.cinema.offsetWidth;
  UI.cinema.classList.add("show");
  await wait(duration);
  hideCinematicTitle(UI);
  await wait(160);
}
