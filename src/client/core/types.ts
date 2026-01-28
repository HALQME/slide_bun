export interface NavigatorOptions {
  containerId?: string;
  slideSelector?: string;
  minScale?: number;
  // Design thresholds for container before scaling (px)
  minContainerWidth?: number;
  minContainerHeight?: number;
  // Minimum allowed scale ratio when shrinking (e.g. 0.7)
  minContainerScale?: number;
  onSlideChange?: (index: number) => void;
}
