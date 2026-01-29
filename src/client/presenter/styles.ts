export const presenterStyles = `
body.mode-presenter {
  display: block; /* Reset flex from default theme */
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #1a1a1a;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

#presenter-dashboard {
  display: grid;
  grid-template-columns: 1fr 350px;
  grid-template-rows: 60px 1fr 1fr;
  height: 100vh;
  width: 100vw;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  outline: none; /* We focus this programmatically, avoid ring */
}

/* Header: Timer and Clock */
#presenter-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2a2a2a;
  padding: 0 24px;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}

#presenter-clock {
  font-size: 1.2rem;
  color: #aaaaaa;
}

#presenter-timer {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  gap: 1rem;
  align-items: center;
}

#presenter-timer button {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

#presenter-timer button:hover {
  background: #444;
  color: #fff;
}

/* Main View: Current Slide */
#presenter-current {
  grid-column: 1 / 2;
  grid-row: 2 / -1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px solid #444;
}

#presenter-current iframe {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none; /* Let parent handle clicks if needed, or pass through */
}

/* Side View: Next Slide */
#presenter-next {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px solid #444;
  display: flex;
  flex-direction: column;
}

#presenter-next .label {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0,0,0,0.7);
  padding: 4px 8px;
  font-size: 0.8rem;
  z-index: 10;
  color: #aaa;
}

#presenter-next iframe {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none;
  opacity: 0.8;
}

/* Notes View */
#presenter-notes {
  grid-column: 2 / 3;
  grid-row: 3 / -1;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  font-size: 1rem;
  line-height: 1.5;
  color: #e0e0e0;
}

#presenter-notes h1, #presenter-notes h2, #presenter-notes h3 {
  font-size: 1.1em;
  margin-top: 0;
  color: #fff;
}

#presenter-notes ul, #presenter-notes ol {
  padding-left: 1.2em;
}

#presenter-notes p {
  margin-bottom: 0.8em;
}

#presenter-notes .empty-notes {
  color: #666;
  font-style: italic;
  text-align: center;
  margin-top: 20px;
}

/* Controls Overlay (Optional) */
.slide-controls {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* Laser Pointer Overlay in Presenter Mode */
#presenter-current {
  position: relative;
}

#laser-pointer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

#presenter-laser-pointer {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff3333 0%, #ff0000 40%, #cc0000 100%);
  box-shadow:
    0 0 8px 2px rgba(255, 0, 0, 0.8),
    0 0 16px 4px rgba(255, 0, 0, 0.5),
    0 0 32px 8px rgba(255, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  transition: opacity 0.15s ease-out;
  opacity: 0;
}

#presenter-laser-pointer.active {
  opacity: 1;
}

/* Laser Pointer Toggle Button */
#laser-pointer-toggle {
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #555;
  transition: all 0.2s ease;
}

#laser-pointer-toggle:hover {
  background: #444;
  transform: scale(1.1);
}

#laser-pointer-toggle.active {
  border-color: #ff4444;
  background: rgba(255, 68, 68, 0.2);
}
`;
