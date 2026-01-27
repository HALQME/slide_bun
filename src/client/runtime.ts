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

    // Use computed padding to measure the available inner height for content
    const cs = window.getComputedStyle(slide);
    const paddingTop = parseFloat(cs.paddingTop || "0") || 0;
    const paddingBottom = parseFloat(cs.paddingBottom || "0") || 0;
    const availableHeight = Math.max(0, containerHeight - (paddingTop + paddingBottom));

    // slide.scrollHeight includes padding; subtract padding to get content box height
    const contentHeight = Math.max(0, (slide.scrollHeight || 0) - (paddingTop + paddingBottom));

    if (!contentHeight || contentHeight <= availableHeight) return 1;

    const raw = availableHeight / contentHeight;
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
    // Precompute and apply scale for the target slide before toggling visibility
    // to reduce layout shift when it becomes visible.
    const target = slides[index];
    if (target) {
      const preScale = computeScaleForSlide(target);
      target.style.setProperty("--text-scale", String(Number(preScale.toFixed(3))));
    }

    slides.forEach((slide, i) => {
      const isActive = i === index;

      if (isActive) {
        // Make target visible first (so CSS transition can run) and schedule
        // a more thorough recompute after images/fonts settle.
        slide.classList.add("active");
        // Initial pass applied above; schedule a follow-up recompute for accuracy.
        scheduleRecompute(40);

        // If there are images that haven't loaded yet, recompute after they load.
        const imgs = Array.from(slide.querySelectorAll("img"));
        imgs.forEach((img) => {
          if (!img.complete) {
            const onLoad = () => {
              scheduleRecompute();
              img.removeEventListener("load", onLoad);
            };
            img.addEventListener("load", onLoad);
          }
        });

        // Recompute after fonts are loaded (if supported)
        if ((document as any).fonts && (document as any).fonts.ready) {
          (document as any).fonts.ready
            .then(() => {
              scheduleRecompute();
            })
            .catch(() => {});
        }
      } else {
        // When hiding a previously-active slide, delay clearing its --text-scale
        // until after the opacity transition completes to avoid visual jumps.
        // If there is no transitionend event, fallback after a short timeout.
        if (slide.classList.contains("active")) {
          let cleared = false;
          const onTrans = (e: TransitionEvent) => {
            if (e.propertyName === "opacity") {
              if (!cleared) {
                clearScaleFromSlide(slide);
                cleared = true;
              }
              slide.removeEventListener("transitionend", onTrans as EventListener);
            }
          };
          slide.addEventListener("transitionend", onTrans as EventListener);

          // Fallback: ensure we eventually clear even if transition doesn't fire.
          const fallback = window.setTimeout(() => {
            if (!cleared) clearScaleFromSlide(slide);
            try {
              slide.removeEventListener("transitionend", onTrans as EventListener);
            } catch {}
            clearTimeout(fallback);
          }, 350);
        } else {
          // If it wasn't active, clear immediately.
          clearScaleFromSlide(slide);
        }

        slide.classList.remove("active");
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

  // Debounced recompute helper
  let recomputeTimeout: number | null = null;
  function scheduleRecompute(delay = 80) {
    if (recomputeTimeout !== null) {
      window.clearTimeout(recomputeTimeout);
    }
    recomputeTimeout = window.setTimeout(() => {
      const active = slides[currentSlideIndex];
      if (active) applyScaleToSlide(active);
      recomputeTimeout = null;
    }, delay);
  }

  window.addEventListener("resize", () => {
    // Debounce to avoid layout thrash during resizing
    scheduleRecompute(80);
  });
  window.addEventListener("orientationchange", () => {
    scheduleRecompute(120);
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
