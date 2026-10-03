/**
 * 時給ハイエナ計算機 — 純粋計算ロジック
 *
 * DB・認証・外部API・サーバー処理は一切含まない。
 * すべて純関数（同じ入力 → 同じ出力、副作用なし）。
 *
 * 免責: 期待値は長期・試行回数前提の理論値であり、短期の結果を保証するものではない。
 */

/** 入力パラメータ（すべてユーザー手入力・機種データは同梱しない） */
export interface CalcInput {
  /** 現在ゲーム数 */
  currentGames: number;
  /** 天井（またはゾーン）ゲーム数 */
  ceilingGames: number;
  /** 消化速度（G/h） */
  gamesPerHour: number;
  /** 当選後の消化時間（分） */
  postHitMinutes: number;
  /** 台の期待値（円・ユーザー手入力） */
  expectedValueYen: number;
  /** 打てる残り時間（分） */
  availableMinutes: number;
  /** 判定閾値（円/h） */
  thresholdYenPerHour: number;
}

/** 推奨アクション */
export type Recommendation = "打つ" | "様子見" | "やめ";

/** 計算結果 */
export interface CalcResult {
  /** 入力が有効か（false のとき数値フィールドは NaN、errors に理由） */
  valid: boolean;
  /** バリデーションエラーメッセージ（valid=true のとき空配列） */
  errors: string[];
  /** 残りゲーム数（天井G − 現在G） */
  remainingGames: number;
  /** 所要時間（分）= 残りG ÷ 消化速度 × 60 ＋ 当選後消化時間 */
  requiredMinutes: number;
  /** 時給期待値（円/h）= 期待値 ÷ (所要時間 / 60) */
  yenPerHour: number;
  /** 時間切れ判定 = 所要時間 > 打てる残り時間 */
  timeUp: boolean;
  /** 推奨アクション */
  recommendation: Recommendation;
}

/** 入力バリデーション。問題があればメッセージ配列を返す（空なら有効） */
export function validate(input: CalcInput): string[] {
  const errors: string[] = [];
  const {
    currentGames,
    ceilingGames,
    gamesPerHour,
    postHitMinutes,
    expectedValueYen,
    availableMinutes,
    thresholdYenPerHour,
  } = input;

  const nums: [string, number][] = [
    ["現在ゲーム数", currentGames],
    ["天井ゲーム数", ceilingGames],
    ["消化速度", gamesPerHour],
    ["当選後の消化時間", postHitMinutes],
    ["台の期待値", expectedValueYen],
    ["打てる残り時間", availableMinutes],
    ["判定閾値", thresholdYenPerHour],
  ];

  for (const [label, value] of nums) {
    if (!Number.isFinite(value)) {
      errors.push(`${label}を数値で入力してください`);
    }
  }
  // 数値でない項目がある場合、以降の比較は無意味なので早期リターン
  if (errors.length > 0) return errors;

  if (currentGames < 0) errors.push("現在ゲーム数は0以上で入力してください");
  if (ceilingGames < 0) errors.push("天井ゲーム数は0以上で入力してください");
  if (postHitMinutes < 0) errors.push("当選後の消化時間は0以上で入力してください");
  if (availableMinutes < 0) errors.push("打てる残り時間は0以上で入力してください");
  if (thresholdYenPerHour < 0) errors.push("判定閾値は0以上で入力してください");

  // ゼロ除算防止: 消化速度は正、かつ所要時間が0になると時給が発散する
  if (gamesPerHour <= 0) {
    errors.push("消化速度は0より大きい値で入力してください");
  }

  // 天井 ≤ 現在G は残りGが0以下 → 打つ対象にならない
  if (ceilingGames <= currentGames) {
    errors.push("天井ゲーム数は現在ゲーム数より大きくしてください");
  }

  return errors;
}

/** 残りゲーム数 = 天井G − 現在G */
export function remainingGames(currentGames: number, ceilingGames: number): number {
  return ceilingGames - currentGames;
}

/** 所要時間（分）= 残りG ÷ 消化速度 × 60 ＋ 当選後消化時間 */
export function requiredMinutes(
  remaining: number,
  gamesPerHour: number,
  postHitMinutes: number,
): number {
  return (remaining / gamesPerHour) * 60 + postHitMinutes;
}

/** 時給期待値（円/h）= 期待値 ÷ (所要時間 / 60) */
export function yenPerHour(expectedValueYen: number, reqMinutes: number): number {
  return expectedValueYen / (reqMinutes / 60);
}

/** 推奨アクションの決定 */
export function decide(
  timeUp: boolean,
  yph: number,
  thresholdYenPerHour: number,
): Recommendation {
  if (timeUp) return "やめ";
  if (yph >= thresholdYenPerHour) return "打つ";
  return "様子見";
}

/**
 * メイン計算関数（純関数）。
 * 無効な入力の場合 valid=false ＋ errors を返し、数値は NaN にする。
 */
export function calculate(input: CalcInput): CalcResult {
  const errors = validate(input);
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      remainingGames: NaN,
      requiredMinutes: NaN,
      yenPerHour: NaN,
      timeUp: false,
      recommendation: "様子見",
    };
  }

  const remaining = remainingGames(input.currentGames, input.ceilingGames);
  const reqMinutes = requiredMinutes(remaining, input.gamesPerHour, input.postHitMinutes);
  const yph = yenPerHour(input.expectedValueYen, reqMinutes);
  const timeUp = reqMinutes > input.availableMinutes;
  const recommendation = decide(timeUp, yph, input.thresholdYenPerHour);

  return {
    valid: true,
    errors: [],
    remainingGames: remaining,
    requiredMinutes: reqMinutes,
    yenPerHour: yph,
    timeUp,
    recommendation,
  };
}

/** 表示用: 円を「¥1,234」形式に */
export function formatYen(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return "¥" + Math.round(value).toLocaleString("ja-JP");
}

/** 表示用: 分を「52.5分」形式に（小数第1位まで） */
export function formatMinutes(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 10) / 10}分`;
}
