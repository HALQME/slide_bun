import { presenterStyles } from "./styles";

export class PresenterUI {
  private container: HTMLElement;
  private currentFrame: HTMLIFrameElement;
  private nextFrame: HTMLIFrameElement;
  private notesContainer: HTMLElement;
  private clockElement: HTMLElement;
  private timerElement: HTMLElement;
  private startTime: number;
  private timerInterval: number | null = null;
  private isPaused: boolean = false;
  private pausedTime: number = 0;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "presenter-dashboard";
    this.container.tabIndex = -1; // Allow focus programmatically

    // Ensure clicking anywhere keeps focus on the dashboard for shortcuts
    this.container.onclick = () => {
      this.container.focus();
    };

    // Header
    const header = document.createElement("div");
    header.id = "presenter-header";

    this.clockElement = document.createElement("div");
    this.clockElement.id = "presenter-clock";

    const timerWrapper = document.createElement("div");
    timerWrapper.id = "presenter-timer";
    this.timerElement = document.createElement("span");
    this.timerElement.textContent = "00:00";

    const timerControls = document.createElement("div");
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.onclick = () => this.resetTimer();
    const pauseBtn = document.createElement("button");
    pauseBtn.textContent = "Pause";
    pauseBtn.onclick = () => this.toggleTimer(pauseBtn);

    timerControls.appendChild(pauseBtn);
    timerControls.appendChild(resetBtn);
    timerWrapper.appendChild(this.timerElement);
    timerWrapper.appendChild(timerControls);

    header.appendChild(this.clockElement);
    header.appendChild(timerWrapper);

    // Current Slide
    const currentView = document.createElement("div");
    currentView.id = "presenter-current";
    this.currentFrame = document.createElement("iframe");
    // Initial src is empty to avoid race condition with hash update
    currentView.appendChild(this.currentFrame);

    // Next Slide
    const nextView = document.createElement("div");
    nextView.id = "presenter-next";
    const nextLabel = document.createElement("div");
    nextLabel.className = "label";
    nextLabel.textContent = "NEXT SLIDE";
    this.nextFrame = document.createElement("iframe");
    // Initial src is empty
    nextView.appendChild(nextLabel);
    nextView.appendChild(this.nextFrame);

    // Notes
    this.notesContainer = document.createElement("div");
    this.notesContainer.id = "presenter-notes";

    this.container.appendChild(header);
    this.container.appendChild(currentView);
    this.container.appendChild(nextView);
    this.container.appendChild(this.notesContainer);

    this.startTime = Date.now();
  }

  public mount() {
    // Inject styles
    const style = document.createElement("style");
    style.textContent = presenterStyles;
    document.head.appendChild(style);

    // Clear body and append dashboard
    document.body.innerHTML = "";
    document.body.appendChild(this.container);
    document.body.classList.add("mode-presenter");

    this.startClock();
    this.startTimer();

    // Focus to capture keyboard events immediately
    this.container.focus();
  }

  public updateViews(currentIndex: number, totalSlides: number) {
    const baseUrl = "/?role=preview";

    // Update Current Slide
    const currentSrc = `${baseUrl}#${currentIndex + 1}`;
    if (
      this.currentFrame.contentWindow &&
      this.currentFrame.src &&
      this.currentFrame.src !== "about:blank" &&
      this.currentFrame.src.includes(baseUrl)
    ) {
      try {
        const currentUrl = new URL(this.currentFrame.src, window.location.origin);
        if (currentUrl.hash !== `#${currentIndex + 1}`) {
          this.currentFrame.src = currentSrc;
        }
      } catch {
        this.currentFrame.src = currentSrc;
      }
    } else {
      this.currentFrame.src = currentSrc;
    }

    // Update Next Slide
    const nextIndex = Math.min(currentIndex + 1, totalSlides - 1);
    const nextSrc = `${baseUrl}#${nextIndex + 1}`;

    if (
      this.nextFrame.contentWindow &&
      this.nextFrame.src &&
      this.nextFrame.src !== "about:blank" &&
      this.nextFrame.src.includes(baseUrl)
    ) {
      try {
        const nextUrl = new URL(this.nextFrame.src, window.location.origin);
        if (nextUrl.hash !== `#${nextIndex + 1}`) {
          this.nextFrame.src = nextSrc;
        }
      } catch {
        this.nextFrame.src = nextSrc;
      }
    } else {
      this.nextFrame.src = nextSrc;
    }
  }

  public updateNotes(notesHtml: string) {
    if (notesHtml && notesHtml.trim().length > 0) {
      this.notesContainer.innerHTML = notesHtml;
    } else {
      this.notesContainer.innerHTML = '<div class="empty-notes">No speaker notes</div>';
    }
  }

  private startClock() {
    setInterval(() => {
      const now = new Date();
      this.clockElement.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, 1000);
  }

  private startTimer() {
    this.timerInterval = window.setInterval(() => {
      if (this.isPaused) return;

      const now = Date.now();
      const diff = now - this.startTime;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  private resetTimer() {
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.timerElement.textContent = "00:00";
  }

  private toggleTimer(btn: HTMLButtonElement) {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      btn.textContent = "Resume";
      this.pausedTime = Date.now();
    } else {
      btn.textContent = "Pause";
      // Adjust start time to account for pause duration
      const pauseDuration = Date.now() - this.pausedTime;
      this.startTime += pauseDuration;
    }
  }
}
