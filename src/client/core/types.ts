export interface NavigatorOptions {
  containerId?: string;
  slideSelector?: string;
  minScale?: number;
  minContainerWidth?: number; // コンテナーの最小幅（px）、デフォルト: 600
  minContainerScale?: number; // 最小スケール比率、デフォルト: 0.7（元サイズの70%まで縮小）
  onSlideChange?: (index: number) => void;
}
