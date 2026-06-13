export const UI = {
  location: document.getElementById("location"),
  hint: document.getElementById("hint"),
  tooltip: document.getElementById("tooltip"),
  panel: document.getElementById("missionPanel"),
  iris: document.getElementById("iris"),
  welcome: document.getElementById("welcome"),
  menuBtn: document.getElementById("menuBtn"),
  returnBtn: document.getElementById("returnBtn"),
  earthViewBtn: document.getElementById("earthViewBtn"),
  inspectBtn: document.getElementById("inspectBtn"),
  cinema: document.getElementById("cinemaOverlay"),
  cinemaKicker: document.getElementById("cinemaKicker"),
  cinemaTitle: document.getElementById("cinemaTitle"),
  cinemaSubtitle: document.getElementById("cinemaSubtitle"),
  cinemaSignature: document.getElementById("cinemaSignature"),
  cinemaCrawl: document.getElementById("cinemaCrawl")
};

export function openPanel() {
  UI.panel.classList.add("open");
}

export function closePanel() {
  UI.panel.classList.remove("open");
}

export function togglePanel() {
  UI.panel.classList.toggle("open");
}
