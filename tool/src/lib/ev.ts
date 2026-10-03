/**
 * ev.ts — 計算ロジックの再エクスポート ＋ 機種プリセット（ダミー）
 *
 * 計算の本体は calc.ts に純関数として実装。ここではそれを再エクスポートし、
 * UI 用の入力補助（プリセット）を提供する。
 *
 * ⚠️ 注意（04の方針）: 本ツールは機種データを同梱しない。
 * 以下のプリセットは「入力の型を体験してもらうためのダミー例」であり、
 * 実在機種の正確な期待値ではない。数値の正確性の責任は負わない。
 * 実際の期待値・天井は各自が公開期待値表等で確認して手入力すること。
 */

export * from "./calc";

/** 機種プリセット（入力補助用のダミー雛形） */
export interface MachinePreset {
  /** 表示名（ダミー・架空） */
  name: string;
  /** 天井（またはゾーン）ゲーム数の目安 */
  ceilingGames: number;
  /** 消化速度の目安（G/h） */
  gamesPerHour: number;
  /** 当選後の消化時間の目安（分） */
  postHitMinutes: number;
}

/**
 * ダミー機種プリセット（架空・入力補助のみ）。
 * 期待値（円）はホール状況で変わるため含めない。ユーザーが手入力する。
 */
export const MACHINE_PRESETS: MachinePreset[] = [
  {
    name: "サンプルAT機（ダミー）",
    ceilingGames: 1000,
    gamesPerHour: 800,
    postHitMinutes: 15,
  },
  {
    name: "サンプルART機（ダミー）",
    ceilingGames: 1500,
    gamesPerHour: 750,
    postHitMinutes: 20,
  },
  {
    name: "サンプル軽量ゾーン機（ダミー）",
    ceilingGames: 600,
    gamesPerHour: 900,
    postHitMinutes: 10,
  },
];
