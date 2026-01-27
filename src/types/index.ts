import type { Token } from "marked";

/** プレゼンテーション全体 */
export interface Presentation {
  meta: PresentationMeta;
  slides: Slide[];
}

/** プレゼンテーションのメタデータ */
export interface PresentationMeta {
  title?: string;
  theme?: string;
  mode?: "light" | "dark" | "auto"; // ダークモード対応
  aspectRatio?: string;
  [key: string]: unknown; // その他のFrontmatterも許容
}

/** スライド1枚のデータ */
export interface Slide {
  id: number;
  contentTokens: Token[]; // MarkedのToken配列（聴衆用）
  noteTokens: Token[]; // MarkedのToken配列（ノート用）
  layout?: string; // 'default' | 'center' | 'columns'
}
