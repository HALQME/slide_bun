import { SlideNavigator } from "./core/navigator";

document.addEventListener("DOMContentLoaded", () => {
  const navigator = new SlideNavigator();

  function updateHash() {
    window.location.hash = `#${navigator.currentIndex + 1}`;
  }

  // Handle hash changes
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      if (index - 1 !== navigator.currentIndex) {
        navigator.goTo(index - 1);
      }
    }
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigator.next();
        updateHash();
        break;
      case "ArrowLeft":
      case "p":
        navigator.prev();
        updateHash();
        break;
      case "Home":
        navigator.goTo(0);
        updateHash();
        break;
      case "End":
        navigator.goTo(navigator.totalSlides - 1);
        updateHash();
        break;
    }
  });

  // Initial load
  if (window.location.hash) {
    handleHash();
  } else {
    navigator.goTo(0);
    updateHash();
  }

  window.addEventListener("hashchange", handleHash);
});
