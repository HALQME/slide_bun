import { SlideNavigator } from "./core/navigator";
import { PresenterUI } from "./presenter/ui";

document.addEventListener("DOMContentLoaded", () => {
  // Check for preview role
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get("role") === "preview";

  // Sync setup
  // If preview, we don't sync. Otherwise we join the channel.
  let channel: BroadcastChannel | null = null;
  if (!isPreview) {
    try {
      channel = new BroadcastChannel("slide-bun-sync");
    } catch (e) {
      console.warn("BroadcastChannel not supported or failed to initialize:", e);
    }
  }

  // Determine if we are in presenter mode
  const isPresenter = window.location.pathname === "/presenter";

  if (isPresenter) {
    // Presenter mode requires channel to control others
    if (channel) {
      setupPresenterMode(channel);
    } else {
      // Fallback or error if channel is critical for presenter?
      // But we should probably just show UI without sync if channel failed.
      console.error("Presenter mode requires BroadcastChannel support.");
      // We can still try to setup UI but it won't control anything
      setupPresenterMode(channel as any); // Type cast or handle null inside
    }
  } else {
    setupClientMode(channel);
  }

  // HMR Client (Shared)
  const evtSource = new EventSource("/_reload");
  evtSource.onmessage = (event) => {
    if (event.data === "reload") {
      location.reload();
    }
  };
});

function setupClientMode(channel: BroadcastChannel | null) {
  const navigator = new SlideNavigator({
    onSlideChange: (index) => {
      // Broadcast change only if channel exists
      if (channel) {
        channel.postMessage({ type: "navigate", index });
      }
      updateHash(index);
    },
  });

  function updateHash(index: number) {
    window.location.hash = `#${index + 1}`;
  }

  // Listen for sync events
  if (channel) {
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
  }

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
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      // Force rendering on initial load even if index is 0
      navigator.goTo(index - 1);
    } else {
      navigator.goTo(0);
      updateHash(0);
    }
  } else {
    navigator.goTo(0);
    updateHash(0);
  }

  // Indicate JS is active after initial setup
  document.body.classList.add("js-active");

  window.addEventListener("hashchange", handleHash);
}

function setupPresenterMode(channel: BroadcastChannel | null) {
  // 1. Extract Data from DOM before wiping it
  const slides = document.querySelectorAll<HTMLElement>(".slide");
  const totalSlides = slides.length;
  const notesMap: string[] = [];

  slides.forEach((slide) => {
    const notes = slide.querySelector(".speaker-notes");
    if (notes) {
      notesMap.push(notes.innerHTML);
    } else {
      notesMap.push("");
    }
  });

  // 2. Initialize UI
  const ui = new PresenterUI();
  ui.mount();

  // 3. State
  let currentIndex = 0;

  // 4. Methods
  const update = (index: number) => {
    currentIndex = index;
    ui.updateViews(index, totalSlides);
    ui.updateNotes(notesMap[index] || "");
  };

  // 5. Interaction
  // In presenter mode, we control the remote slides via broadcast
  const navigate = (index: number) => {
    const target = Math.max(0, Math.min(index, totalSlides - 1));
    if (target !== currentIndex) {
      update(target);
      if (channel) {
        channel.postMessage({ type: "navigate", index: target });
      }
    }
  };

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigate(currentIndex + 1);
        break;
      case "ArrowLeft":
      case "p":
        navigate(currentIndex - 1);
        break;
      case "Home":
        navigate(0);
        break;
      case "End":
        navigate(totalSlides - 1);
        break;
    }
  });

  // Listen to sync from client (if user navigates on the projector view)
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === "navigate") {
        const index = event.data.index;
        if (typeof index === "number" && index !== currentIndex) {
          update(index);
        }
      }
    };
  }

  // Initialize
  update(0);
}
