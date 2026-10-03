import { describe, it, expect } from "vitest";
import {
  calculate,
  validate,
  remainingGames,
  requiredMinutes,
  yenPerHour,
  decide,
  formatYen,
  formatMinutes,
  type CalcInput,
} from "./calc";

/** 受入基準の基準入力: 現在500G/天井1000G/800G-h/15分/期待値3000円/残り120分/閾値2000円 */
const base: CalcInput = {
  currentGames: 500,
  ceilingGames: 1000,
  gamesPerHour: 800,
  postHitMinutes: 15,
  expectedValueYen: 3000,
  availableMinutes: 120,
  thresholdYenPerHour: 2000,
};

describe("受入基準の例値", () => {
  it("残りG=500・所要52.5分・時給≈3428.57円・判定『打つ』", () => {
    const r = calculate(base);
    expect(r.valid).toBe(true);
    expect(r.remainingGames).toBe(500);
    // 500/800*60 = 37.5, +15 = 52.5
    expect(r.requiredMinutes).toBeCloseTo(52.5, 5);
    // 3000 / (52.5/60) = 3428.571...
    expect(r.yenPerHour).toBeCloseTo(3428.5714, 3);
    expect(r.timeUp).toBe(false);
    expect(r.recommendation).toBe("打つ");
  });
});

describe("純関数の個別検証", () => {
  it("remainingGames", () => {
    expect(remainingGames(500, 1000)).toBe(500);
  });
  it("requiredMinutes", () => {
    expect(requiredMinutes(500, 800, 15)).toBeCloseTo(52.5, 5);
  });
  it("yenPerHour", () => {
    expect(yenPerHour(3000, 52.5)).toBeCloseTo(3428.5714, 3);
  });
  it("decide: 時間切れなら『やめ』（時給が高くても優先）", () => {
    expect(decide(true, 99999, 2000)).toBe("やめ");
  });
  it("decide: 時給>=閾値なら『打つ』", () => {
    expect(decide(false, 2000, 2000)).toBe("打つ");
  });
  it("decide: 時給<閾値なら『様子見』", () => {
    expect(decide(false, 1999, 2000)).toBe("様子見");
  });
});

describe("時間切れケース", () => {
  it("所要時間 > 残り時間 → timeUp=true・判定『やめ』", () => {
    // 残り時間を所要（52.5分）未満に
    const r = calculate({ ...base, availableMinutes: 40 });
    expect(r.valid).toBe(true);
    expect(r.timeUp).toBe(true);
    expect(r.recommendation).toBe("やめ");
  });

  it("残り時間==所要時間 は時間切れではない（境界）", () => {
    const r = calculate({ ...base, availableMinutes: 52.5 });
    expect(r.timeUp).toBe(false);
    expect(r.recommendation).toBe("打つ");
  });
});

describe("閾値の境界", () => {
  it("時給がちょうど閾値 → 『打つ』（>= 判定）", () => {
    // 時給を閾値ちょうど（2000）にする期待値を逆算: EV = 2000 * (52.5/60) = 1750
    const r = calculate({ ...base, expectedValueYen: 1750, thresholdYenPerHour: 2000 });
    expect(r.yenPerHour).toBeCloseTo(2000, 6);
    expect(r.recommendation).toBe("打つ");
  });

  it("時給が閾値をわずかに下回る → 『様子見』", () => {
    const r = calculate({ ...base, expectedValueYen: 1749, thresholdYenPerHour: 2000 });
    expect(r.yenPerHour).toBeLessThan(2000);
    expect(r.recommendation).toBe("様子見");
  });
});

describe("バリデーション", () => {
  it("天井 <= 現在G はエラー", () => {
    const errs = validate({ ...base, ceilingGames: 500 });
    expect(errs.length).toBeGreaterThan(0);
    const r = calculate({ ...base, ceilingGames: 500 });
    expect(r.valid).toBe(false);
    expect(Number.isNaN(r.remainingGames)).toBe(true);
  });

  it("天井 == 現在G はエラー（残りG=0・ゼロ除算回避）", () => {
    const r = calculate({ ...base, currentGames: 1000, ceilingGames: 1000 });
    expect(r.valid).toBe(false);
  });

  it("消化速度0 はゼロ除算のためエラー", () => {
    const r = calculate({ ...base, gamesPerHour: 0 });
    expect(r.valid).toBe(false);
  });

  it("負の消化速度はエラー", () => {
    const r = calculate({ ...base, gamesPerHour: -800 });
    expect(r.valid).toBe(false);
  });

  it("負の現在ゲーム数はエラー", () => {
    const r = calculate({ ...base, currentGames: -1 });
    expect(r.valid).toBe(false);
  });

  it("NaN入力はエラー", () => {
    const r = calculate({ ...base, expectedValueYen: NaN });
    expect(r.valid).toBe(false);
  });

  it("期待値が負でも計算は成立（マイナス期待値の台）", () => {
    // 期待値マイナスは有効な入力（不利な台）。時給もマイナス→様子見以外にならない
    const r = calculate({ ...base, expectedValueYen: -3000 });
    expect(r.valid).toBe(true);
    expect(r.yenPerHour).toBeLessThan(0);
    expect(r.recommendation).toBe("様子見");
  });
});

describe("表示フォーマッタ", () => {
  it("formatYen", () => {
    expect(formatYen(3428.57)).toBe("¥3,429");
    expect(formatYen(NaN)).toBe("—");
  });
  it("formatMinutes", () => {
    expect(formatMinutes(52.5)).toBe("52.5分");
    expect(formatMinutes(NaN)).toBe("—");
  });
});
