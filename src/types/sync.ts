/** 同期メッセージの型定義 */
export type SyncMessage =
  | { type: "navigate"; index: number } // 既存
  | { type: "pointer"; payload: PointerPayload }; // 新規追加

/** ポインター位置のペイロード */
export interface PointerPayload {
  x: number; // 0.0 〜 1.0 (左上原点)
  y: number; // 0.0 〜 1.0 (左上原点)
  active: boolean; // ポインター表示状態 (true: ON, false: OFF)
  timestamp: number; // パケット破棄判定用
}
