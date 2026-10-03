"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculate,
  formatYen,
  formatMinutes,
  type CalcInput,
  type Recommendation,
} from "@/lib/ev";
import { MACHINES, type Machine } from "@/lib/machines";

const STORAGE_KEY = "jikyu-hyena-calc:v1";

const DEFAULTS: CalcInput = {
  currentGames: 500,
  ceilingGames: 1000,
  gamesPerHour: 800,
  postHitMinutes: 15,
  expectedValueYen: 3000,
  availableMinutes: 120,
  thresholdYenPerHour: 2000,
};

const LINE_URL = process.env.NEXT_PUBLIC_LINE_URL || "#";

const TIME_CHIPS = [30, 45, 60, 90, 120, 150];

const RECO: Record<
  Recommendation,
  { grad: string; border: string; text: string; dot: string; hint: string }
> = {
  打つ: {
    grad: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    border: "border-emerald-400/40",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    hint: "時給が基準を超えています",
  },
  様子見: {
    grad: "from-amber-500/25 via-amber-500/10 to-transparent",
    border: "border-amber-400/40",
    text: "text-amber-300",
    dot: "bg-amber-400",
    hint: "基準ぎりぎり。状況を見て判断",
  },
  やめ: {
    grad: "from-rose-500/25 via-rose-500/10 to-transparent",
    border: "border-rose-400/40",
    text: "text-rose-300",
    dot: "bg-rose-400",
    hint: "時間内に完走できない／時給が基準未満",
  },
};

function Field({
  label,
  value,
  onChange,
  suffix,
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  help?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-[13px] font-medium text-slate-300">
        {label}
        {help ? (
          <span
            className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-400"
            title={help}
            aria-label={help}
          >
            ?
          </span>
        ) : null}
      </span>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 transition focus-within:border-sky-400/70 focus-within:bg-white/[0.06]">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) =>
            onChange(e.target.value === "" ? NaN : Number(e.target.value))
          }
          className="w-full bg-transparent py-2.5 text-lg font-semibold tabular-nums text-slate-50 outline-none placeholder:text-slate-600"
          placeholder="0"
        />
        {suffix ? (
          <span className="shrink-0 pl-2 text-xs text-slate-400">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

export default function Page() {
  const [input, setInput] = useState<CalcInput>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CalcInput>;
        setInput((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* 破損データは無視 */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* 保存失敗は無視 */
    }
  }, [input, hydrated]);

  const result = useMemo(() => calculate(input), [input]);
  const set = (patch: Partial<CalcInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return MACHINES.slice(0, 8);
    return MACHINES.filter((m) => m.name.includes(q)).slice(0, 12);
  }, [query]);

  const selected = useMemo(
    () => MACHINES.find((m) => m.slug === selectedSlug) ?? null,
    [selectedSlug],
  );

  const applyMachine = (m: Machine) => {
    setSelectedSlug(m.slug);
    setQuery("");
    set({
      ...(m.tenjoGames > 0 ? { ceilingGames: m.tenjoGames } : {}),
      ...(m.gamesPerHour ? { gamesPerHour: m.gamesPerHour } : {}),
      ...(m.postHitMinutes ? { postHitMinutes: m.postHitMinutes } : {}),
    });
  };

  const reco = result.valid ? RECO[result.recommendation] : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
      {/* ヘッダー */}
      <header className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/30 to-emerald-400/20 text-base font-black text-sky-200 ring-1 ring-white/10">
          時
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight text-white">
            時給ハイエナ計算機
          </h1>
          <p className="text-[11px] text-slate-400">
            残り時間から時給を出して、打つ / 様子見 / やめ を即判断
          </p>
        </div>
      </header>

      {/* 機種を選ぶ */}
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">機種を選ぶ</span>
          <span className="text-[10px] text-slate-500">
            天井・狙い目を自動セット
          </span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 機種名で検索（例: からくり）"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-400/70 focus:bg-white/[0.06] placeholder:text-slate-500"
        />

        {query || !selected ? (
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => applyMachine(m)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
                  selected?.slug === m.slug
                    ? "border-sky-400/70 bg-sky-500/20 text-sky-200"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
                }`}
              >
                {m.name}
              </button>
            ))}
            {filtered.length === 0 ? (
              <span className="py-1.5 text-xs text-slate-500">
                該当なし（下の欄に手入力でOK）
              </span>
            ) : null}
          </div>
        ) : null}

        {selected ? (
          <div className="mt-2.5 rounded-2xl border border-sky-400/30 border-l-2 border-l-sky-400 bg-sky-500/[0.06] p-3.5 text-[13px] leading-relaxed">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-bold text-sky-100">
                {selected.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:bg-white/5"
              >
                解除
              </button>
            </div>
            <InfoRow
              k="天井"
              v={
                selected.tenjoGames > 0
                  ? `${selected.tenjoGames}G 前後（天井欄に自動セット）`
                  : "周期天井（G数天井なし・補足参照）"
              }
            />
            <InfoRow k="狙い目" v={selected.nerai} />
            <InfoRow k="やめどき" v={selected.yamedoki} />
            {selected.note ? <InfoRow k="補足" v={selected.note} muted /> : null}
          </div>
        ) : null}
      </section>

      {/* コア入力 */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-2 gap-3.5">
          <Field
            label="現在ゲーム数"
            value={input.currentGames}
            onChange={(v) => set({ currentGames: v })}
            suffix="G"
          />
          <Field
            label="天井ゲーム数"
            value={input.ceilingGames}
            onChange={(v) => set({ ceilingGames: v })}
            suffix="G"
            help="天井またはゾーンの到達G"
          />
          <Field
            label="台の期待値"
            value={input.expectedValueYen}
            onChange={(v) => set({ expectedValueYen: v })}
            suffix="円"
            help="公開期待値表などの値を入力"
          />
          <Field
            label="打てる残り時間"
            value={input.availableMinutes}
            onChange={(v) => set({ availableMinutes: v })}
            suffix="分"
            help="今日あと何分打てるか"
          />
        </div>

        {/* 残り時間クイックチップ */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {TIME_CHIPS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ availableMinutes: t })}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
                input.availableMinutes === t
                  ? "border-sky-400/70 bg-sky-500/20 text-sky-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20"
              }`}
            >
              {t}分
            </button>
          ))}
        </div>

        {/* 詳細設定（折りたたみ） */}
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-xs text-slate-400 hover:text-slate-200"
        >
          <span>詳細設定（消化速度・当選後消化・判定閾値）</span>
          <span
            className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {showAdvanced ? (
          <div className="mt-1 grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3">
            <Field
              label="消化速度"
              value={input.gamesPerHour}
              onChange={(v) => set({ gamesPerHour: v })}
              suffix="G/h"
              help="1時間に回せるG数（既定800）"
            />
            <Field
              label="当選後の消化"
              value={input.postHitMinutes}
              onChange={(v) => set({ postHitMinutes: v })}
              suffix="分"
              help="当選後AT/ART消化の時間（既定15）"
            />
            <Field
              label="判定閾値"
              value={input.thresholdYenPerHour}
              onChange={(v) => set({ thresholdYenPerHour: v })}
              suffix="円/h"
              help="この時給以上で『打つ』（既定2000）"
            />
          </div>
        ) : null}
      </section>

      {/* 結果 */}
      {!result.valid ? (
        <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="mb-1 font-semibold">入力を確認してください</p>
          <ul className="list-disc pl-5 text-amber-200/90">
            {result.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          className={`mt-4 overflow-hidden rounded-2xl border bg-gradient-to-b ${reco!.grad} ${reco!.border}`}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[11px] uppercase tracking-widest text-slate-300/80">
              推奨アクション
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${reco!.dot}`} />
          </div>
          <div className="px-5 pb-1">
            <span className={`text-5xl font-black ${reco!.text}`}>
              {result.recommendation}
            </span>
            <p className="mt-1 text-xs text-slate-300/90">{reco!.hint}</p>
          </div>

          {result.timeUp ? (
            <p className="mx-5 mt-2 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
              残り時間内に当選後の消化まで完走できない見込みです。
            </p>
          ) : null}

          <dl className="mt-3 grid grid-cols-3 gap-px bg-white/5 text-center">
            <Stat k="時給期待値" v={formatYen(result.yenPerHour)} accent />
            <Stat k="所要時間" v={formatMinutes(result.requiredMinutes)} />
            <Stat
              k="残りG"
              v={`${result.remainingGames.toLocaleString("ja-JP")}`}
            />
          </dl>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-8 border-t border-white/5 pt-4 text-xs text-slate-400">
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99]"
        >
          LINEで狙い目・使い方を受け取る
        </a>
        <p className="leading-relaxed">
          期待値は長期・試行回数前提の理論値であり、短期の結果を保証するものではありません。
        </p>
        <p className="mt-2 leading-relaxed">
          掲載の天井・狙い目・やめどきは要点の目安です。最新の解析・ホール状況は各自でご確認ください。入力値・結果について責任を負いません。
        </p>
        <p className="mt-2 font-semibold text-slate-300">
          20歳未満の方はご利用いただけません。
        </p>
        <p className="mt-2 leading-relaxed">
          のめり込みや生活に支障が出そうな場合は利用を控えてください。ギャンブル等依存症の相談窓口の利用もご検討ください。
        </p>
        <p className="mt-3 text-[10px] text-slate-600">時給ハイエナ計算機</p>
      </footer>

      {/* 固定サマリバー（常時結果が見える） */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#0b0f14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          {result.valid && reco ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${reco.dot}`} />
                <span className={`text-lg font-black ${reco.text}`}>
                  {result.recommendation}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">時給期待値</span>
                <span className="ml-2 text-lg font-bold tabular-nums text-sky-300">
                  {formatYen(result.yenPerHour)}
                  <span className="ml-0.5 text-xs font-normal text-slate-400">
                    /h
                  </span>
                </span>
              </div>
            </>
          ) : (
            <span className="w-full text-center text-xs text-slate-400">
              入力を確認してください
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoRow({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <p className={`mt-1 ${muted ? "text-slate-400" : "text-slate-200"}`}>
      <span className="text-slate-500">{k}: </span>
      {v}
    </p>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-[#0b0f14]/40 px-2 py-3">
      <dt className="text-[10px] text-slate-400">{k}</dt>
      <dd
        className={`mt-0.5 font-bold tabular-nums ${
          accent ? "text-lg text-sky-300" : "text-base text-slate-100"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
