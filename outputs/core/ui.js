export const UI = {
  location: document.getElementById("location"),
  hint: document.getElementById("hint"),
  tooltip: document.getElementById("tooltip"),
  panel: document.getElementById("missionPanel"),
  iris: document.getElementById("iris"),
  welcome: document.getElementById("welcome"),
  returnBtn: document.getElementById("returnBtn"),
  earthViewBtn: document.getElementById("earthViewBtn")
};

export function openPanel() {
  UI.panel.classList.add("open");
}

export function closePanel() {
  UI.panel.classList.remove("open");
}
