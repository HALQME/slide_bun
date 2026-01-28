import type { NavigatorOptions } from "./types";

export class SlideNavigator {
  private slides: HTMLElement[];
  private currentSlideIndex: number = 0;
  private container: HTMLElement | null;
  private minScale: number;
  private recomputeTimeout: number | null = null;
  private onSlideChange?: (index: number) => void;

  constructor(options: NavigatorOptions = {}) {
    const selector = options.slideSelector || ".slide";
    this.slides = Array.from(document.querySelectorAll<HTMLElement>(selector));
    this.container = document.getElementById(options.containerId || "slide-container");
    this.minScale = options.minScale || 0.6;
    this.onSlideChange = options.onSlideChange;

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);

    // Add listeners
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("orientationchange", this.handleOrientation);
  }

  public get totalSlides(): number {
    return this.slides.length;
  }

  public get currentIndex(): number {
    return this.currentSlideIndex;
  }

  public destroy() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("orientationchange", this.handleOrientation);
  }

  public goTo(index: number, suppressCallback = false) {
    if (this.slides.length === 0) return;

    // Clamp index
    const targetIndex = Math.max(0, Math.min(index, this.totalSlides - 1));

    // If already there, do we still re-render? Yes, to ensure scale is correct.
    // But maybe we skip callback if index didn't change?
    // For now, let's proceed.

    // Precompute scale for target
    const target = this.slides[targetIndex];
    if (target) {
      try {
        const preScale = this.computeScaleForSlide(target);
        target.style.setProperty("--text-scale", String(Number(preScale.toFixed(3))));
      } catch (e) {
        console.warn("Failed to compute scale for slide:", e);
      }
    }

    this.slides.forEach((slide, i) => {
      const isActive = i === targetIndex;

      if (isActive) {
        slide.classList.add("active");
        this.scheduleRecompute(40);

        // Image loading handling
        const imgs = Array.from(slide.querySelectorAll("img"));
        imgs.forEach((img) => {
          if (!img.complete) {
            const onLoad = () => {
              this.scheduleRecompute();
              img.removeEventListener("load", onLoad);
            };
            img.addEventListener("load", onLoad);
          }
        });

        // Fonts ready handling
        if ((document as any).fonts && (document as any).fonts.ready) {
          (document as any).fonts.ready
            .then(() => {
              this.scheduleRecompute();
            })
            .catch(() => {});
        }
      } else {
        // Hiding logic with transition handling
        if (slide.classList.contains("active")) {
          let cleared = false;
          const onTrans = (e: TransitionEvent) => {
            if (e.propertyName === "opacity") {
              if (!cleared) {
                this.clearScaleFromSlide(slide);
                cleared = true;
              }
              slide.removeEventListener("transitionend", onTrans as EventListener);
            }
          };
          slide.addEventListener("transitionend", onTrans as EventListener);

          const fallback = window.setTimeout(() => {
            if (!cleared) this.clearScaleFromSlide(slide);
            try {
              slide.removeEventListener("transitionend", onTrans as EventListener);
            } catch {}
            clearTimeout(fallback);
          }, 350);
        } else {
          this.clearScaleFromSlide(slide);
        }

        slide.classList.remove("active");
      }
    });

    const prevIndex = this.currentSlideIndex;
    this.currentSlideIndex = targetIndex;

    if (!suppressCallback && this.onSlideChange && prevIndex !== targetIndex) {
      this.onSlideChange(targetIndex);
    }
  }

  public next() {
    if (this.currentSlideIndex < this.totalSlides - 1) {
      this.goTo(this.currentSlideIndex + 1);
    }
  }

  public prev() {
    if (this.currentSlideIndex > 0) {
      this.goTo(this.currentSlideIndex - 1);
    }
  }

  private computeScaleForSlide(slide: HTMLElement): number {
    const containerHeight = this.container ? this.container.clientHeight : window.innerHeight;

    const cs = window.getComputedStyle(slide);
    const paddingTop = parseFloat(cs.paddingTop || "0") || 0;
    const paddingBottom = parseFloat(cs.paddingBottom || "0") || 0;
    const availableHeight = Math.max(0, containerHeight - (paddingTop + paddingBottom));

    // slide.scrollHeight includes padding; subtract padding to get content box height
    const contentHeight = Math.max(0, (slide.scrollHeight || 0) - (paddingTop + paddingBottom));

    if (!contentHeight || contentHeight <= availableHeight) return 1;

    const raw = availableHeight / contentHeight;
    return Math.max(this.minScale, Math.min(1, raw));
  }

  private applyScaleToSlide(slide: HTMLElement) {
    const scale = this.computeScaleForSlide(slide);
    slide.style.setProperty("--text-scale", String(Number(scale.toFixed(3))));
  }

  private clearScaleFromSlide(slide: HTMLElement) {
    slide.style.removeProperty("--text-scale");
  }

  private scheduleRecompute(delay = 80) {
    if (this.recomputeTimeout !== null) {
      window.clearTimeout(this.recomputeTimeout);
    }
    this.recomputeTimeout = window.setTimeout(() => {
      const active = this.slides[this.currentSlideIndex];
      if (active) this.applyScaleToSlide(active);
      this.recomputeTimeout = null;
    }, delay);
  }

  private handleResize() {
    this.scheduleRecompute(80);
  }

  private handleOrientation() {
    this.scheduleRecompute(120);
  }
}
