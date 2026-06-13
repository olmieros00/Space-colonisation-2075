export const UI = {
  location: document.getElementById("location"),
  hint: document.getElementById("hint"),
  tooltip: document.getElementById("tooltip"),
  panel: document.getElementById("missionPanel"),
  iris: document.getElementById("iris"),
  cinema: document.getElementById("cinemaOverlay"),
  cinemaKicker: document.getElementById("cinemaKicker"),
  cinemaTitle: document.getElementById("cinemaTitle"),
  cinemaSubtitle: document.getElementById("cinemaSubtitle"),
  cinemaSignature: document.getElementById("cinemaSignature"),
  cinemaCrawl: document.getElementById("cinemaCrawl"),
  welcome: document.getElementById("welcome"),
  returnBtn: document.getElementById("returnBtn"),
  earthViewBtn: document.getElementById("earthViewBtn"),
  inspectBtn: document.getElementById("inspectBtn")
};

export function openPanel() {
  UI.panel.classList.add("open");
}

export function closePanel() {
  UI.panel.classList.remove("open");
}
