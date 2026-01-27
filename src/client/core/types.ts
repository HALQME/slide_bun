export interface NavigatorOptions {
  containerId?: string;
  slideSelector?: string;
  minScale?: number;
  onSlideChange?: (index: number) => void;
}
