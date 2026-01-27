/**
 * Layout Design System
 *
 * このモジュールは、スライドのコンテンツ量に基づいて
 * 適切なfont-sizeを計算するシステムを提供します。
 *
 * 設計原則：
 * - スライドサイズは固定（1280px × 720px、16:9アスペクト比）
 * - 親要素のfont-sizeを設定すれば、子要素はem単位で自動スケール
 * - コンテンツ量（テキスト文字数、段落数など）に応じて事前に計算
 */

/** スライドサイズの定義（基準サイズ: 1280×720 を保持しつつ、実行時はレスポンシブ化） */
export const SLIDE_DIMENSIONS = {
  // baseWidth / baseHeight は「デザイン基準」サイズです。
  // 実際の表示サイズはランタイム（ブラウザ）でビュー幅に合わせて変動します。
  baseWidth: 1280,
  baseHeight: 720,
  padding: 32, // 2em相当（16px * 2）
  // CSS側で扱いやすくするため '16/9' のような比率文字列にしておく
  aspectRatio: "16/9",
} as const;

/** レイアウトタイプの定義 */
export type LayoutType =
  | "default" // 標準レイアウト（タイトル + コンテンツ）
  | "center" // 中央配置（タイトルのみ、シンプル）
  | "columns" // 2列レイアウト
  | "cover"; // カバースライド（背景画像）

/** コンテンツ密度の分類 */
export type ContentDensity = "sparse" | "normal" | "dense" | "very-dense";

/**
 * コンテンツ量に基づいてコンテンツ密度を判定
 * @param contentLength - テキスト文字数（推定値）
 * @returns コンテンツ密度
 */
export function getContentDensity(contentLength: number): ContentDensity {
  // 文字数ベースの閾値（スライド1枚における適切な情報量）
  if (contentLength < 100) {
    return "sparse"; // 少なくテキスト（タイトルのみ等）
  } else if (contentLength < 300) {
    return "normal"; // 標準的な情報量
  } else if (contentLength < 600) {
    return "dense"; // 情報が多い
  } else {
    return "very-dense"; // 非常に多い
  }
}

/**
 * レイアウトタイプとコンテンツ密度に基づいて
 * 推奨するfont-scale（親font-sizeに掛ける倍率、無単位）を計算します。
 *
 * 設計方針：
 * - スライドの実サイズはレスポンシブ（ビュー幅に依存）に変化させるため、
 *   ここでは「レイアウト/密度による倍率」を返します。
 * - 実際のフォントは CSS 側で base-font-size（16px） × ビューに対するスケール ×
 *   この倍率 で計算されます。
 *
 * @param layout - レイアウトタイプ
 * @param density - コンテンツ密度
 * @returns font-scale（無単位の倍率）
 */
export function calculateFontScale(layout: LayoutType, density: ContentDensity): number {
  // レイアウト別の基本スケール（従来の値をそのまま倍率に移行）
  const layoutScale: Record<LayoutType, number> = {
    default: 1.0, // 標準的なスケール
    center: 1.2, // シンプルなので少し大きく
    columns: 0.95, // 2列なので少し小さく
    cover: 1.1, // カバーページは目立たせる
  };

  // コンテンツ密度別のスケール
  const densityScale: Record<ContentDensity, number> = {
    sparse: 1.2,
    normal: 1.0,
    dense: 0.85,
    "very-dense": 0.7,
  };

  const scale = layoutScale[layout] * densityScale[density];
  // 小数第3位で丸めて安定させる（CSSでの掛け算で扱いやすいように）
  return Math.round(scale * 1000) / 1000;
}

/**
 * レイアウト情報からCSSカスタムプロパティの値を生成します。
 * 生成されるプロパティは「無単位の倍率」を表す `--slide-font-scale` です。
 *
 * 使い方（CSS側）：
 *  - スライドのレスポンシブベースサイズ（例: ビューポート幅に基づくスケール）を
 *    `--slide-base-scale` （または別名）として定義し、最終的な font-size を:
 *      font-size: calc(16px * var(--slide-base-scale, 1) * var(--slide-font-scale, 1));
 *
 * @param layout - レイアウトタイプ
 * @param contentLength - コンテンツの文字数
 * @returns CSSカスタムプロパティの文字列（例: "--slide-font-scale: 1.2"）
 */
export function getSlideStyleAttribute(layout: LayoutType, contentLength: number): string {
  const density = getContentDensity(contentLength);
  const scale = calculateFontScale(layout, density);
  return `--slide-font-scale: ${scale}`;
}

/**
 * 推奨レイアウトとコンテンツ密度情報
 * （パーサー/ジェネレータで参考用）
 */
export const LAYOUT_RECOMMENDATIONS = {
  // 推奨される最小/最大の文字数
  contentLengthRanges: {
    sparse: { min: 0, max: 100 },
    normal: { min: 100, max: 300 },
    dense: { min: 300, max: 600 },
    "very-dense": { min: 600, max: Infinity },
  },

  // 各レイアウトの特性
  layouts: {
    default: {
      description: "標準レイアウト（タイトル + メインコンテンツ）",
      bestFor: ["normal", "dense"],
      maxContentLength: 600,
    },
    center: {
      description: "中央配置（シンプルなテキストやタイトルのみ）",
      bestFor: ["sparse", "normal"],
      maxContentLength: 200,
    },
    columns: {
      description: "2列レイアウト（左右に分割）",
      bestFor: ["normal", "dense"],
      maxContentLength: 500,
    },
    cover: {
      description: "カバースライド（背景画像 + オーバーレイテキスト）",
      bestFor: ["sparse"],
      maxContentLength: 100,
    },
  },
} as const;
