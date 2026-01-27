import { SlideNavigator } from "./core/navigator";

document.addEventListener("DOMContentLoaded", () => {
  // Sync setup
  const channel = new BroadcastChannel("slide-bun-sync");

  // Determine if we are in presenter mode
  const isPresenter = window.location.pathname === "/presenter";
  if (isPresenter) {
    document.body.classList.add("mode-presenter");
    // Show speaker notes
    const notes = document.querySelectorAll(".speaker-notes");
    notes.forEach((el) => el.removeAttribute("hidden"));
  }

  const navigator = new SlideNavigator({
    onSlideChange: (index) => {
      // Broadcast change
      channel.postMessage({ type: "navigate", index });
      updateHash(index);
    },
  });

  function updateHash(index: number) {
    window.location.hash = `#${index + 1}`;
  }

  // Listen for sync events
  channel.onmessage = (event) => {
    if (event.data && event.data.type === "navigate") {
      const index = event.data.index;
      if (typeof index === "number" && index !== navigator.currentIndex) {
        // Go to slide but suppress callback to avoid loop
        navigator.goTo(index, true);
        updateHash(index);
      }
    }
  };

  // HMR Client
  const evtSource = new EventSource("/_reload");
  evtSource.onmessage = (event) => {
    if (event.data === "reload") {
      location.reload();
    }
  };

  // Handle hash changes
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      if (index - 1 !== navigator.currentIndex) {
        // If hash changes manually, we treat it like a nav event (broadcast)
        navigator.goTo(index - 1);
      }
    }
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    // In presenter mode, we might want to prevent default behavior more aggressively
    // but for now stick to standard binding
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigator.next();
        break;
      case "ArrowLeft":
      case "p":
        navigator.prev();
        break;
      case "Home":
        navigator.goTo(0);
        break;
      case "End":
        navigator.goTo(navigator.totalSlides - 1);
        break;
    }
  });

  // Initialize
  if (window.location.hash) {
    handleHash();
  } else {
    navigator.goTo(0);
  }

  window.addEventListener("hashchange", handleHash);
});
