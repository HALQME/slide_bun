// Minimal runtime for slide navigation
document.addEventListener("DOMContentLoaded", () => {
  // Indicate JS is active
  document.body.classList.add("js-active");

  let currentSlideIndex = 0;
  const slides = document.querySelectorAll<HTMLElement>(".slide");
  const totalSlides = slides.length;

  if (totalSlides === 0) return;

  /**
   * Compute a text-scale for a given slide so content fits within the
   * slide container. Returns a unitless scale between minScale and 1.
   *
   * Strategy:
   *  - Measure the slide's scrollHeight (content height including paddings).
   *  - Measure available height from the slide container (clientHeight).
   *  - scale = available / contentHeight (clamped).
   *
   * Notes:
   *  - The CSS multiplies all font-size by --text-scale, so adjusting
   *    --text-scale uniformly scales all typography and images together.
   *  - We avoid scaling below a minimum to preserve legibility.
   */
  function computeScaleForSlide(slide: HTMLElement, minScale = 0.6): number {
    const container = document.getElementById("slide-container");
    const containerHeight = container ? container.clientHeight : window.innerHeight;

    // slide.scrollHeight is content height including paddings
    const contentHeight = slide.scrollHeight || 0;

    if (!contentHeight || contentHeight <= containerHeight) return 1;

    const raw = containerHeight / contentHeight;
    return Math.max(minScale, Math.min(1, raw));
  }

  function applyScaleToSlide(slide: HTMLElement) {
    const scale = computeScaleForSlide(slide);
    slide.style.setProperty("--text-scale", String(Number(scale.toFixed(3))));
  }

  function clearScaleFromSlide(slide: HTMLElement) {
    // Reset to default by removing the inline property; CSS has a default of 1
    slide.style.removeProperty("--text-scale");
  }

  function showSlide(index: number) {
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("active", isActive);
      if (isActive) {
        // Compute and apply per-slide scale so content fits
        applyScaleToSlide(slide);
      } else {
        // Clear inline scale on non-active slides to avoid stale overrides
        clearScaleFromSlide(slide);
      }
    });
    currentSlideIndex = index;
    // Update URL hash
    window.location.hash = `#${index + 1}`;
  }

  function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) {
      showSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      showSlide(currentSlideIndex - 1);
    }
  }

  // Recompute scale for the active slide on resize or orientation change
  function recomputeActiveScale() {
    const active = slides[currentSlideIndex];
    if (active) applyScaleToSlide(active);
  }
  window.addEventListener("resize", () => {
    // Debounce light (simple rAF) to avoid layout thrash during resizing
    requestAnimationFrame(recomputeActiveScale);
  });
  window.addEventListener("orientationchange", () => {
    requestAnimationFrame(recomputeActiveScale);
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space": // Space might need preventDefault if it scrolls
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
      case "p":
        prevSlide();
        break;
      case "Home":
        showSlide(0);
        break;
      case "End":
        showSlide(totalSlides - 1);
        break;
    }
  });

  // Hash change handling
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= totalSlides) {
      showSlide(index - 1);
    }
  }

  // Initialize
  if (window.location.hash) {
    handleHash();
  } else {
    showSlide(0);
  }

  window.addEventListener("hashchange", handleHash);
});
