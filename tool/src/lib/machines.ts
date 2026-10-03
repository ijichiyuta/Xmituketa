/**
 * machines.ts — 機種データ（天井・狙い目・やめどきの「要点」）
 *
 * 各値は一般に公開されている天井・狙い目情報の要点を再構成したもの。
 * 詳細な解析・実践値・最新のホール状況は各自でご確認ください。数値の正確性・結果は保証しません。
 * 期待値(円)はホール状況で変わるため、機種側には持たせず利用者が手入力する（ev.ts の方針を踏襲）。
 *
 * ⚠️ これは第1バッチ（代表機種）。全機種はデータ変換フローで順次追加する。
 */

export interface Machine {
  /** 一意キー */
  slug: string;
  /** 表示名 */
  name: string;
  /** 天井(またはゲーム数天井)の到達G目安。周期天井などG数で表せない場合は 0 */
  tenjoGames: number;
  /** 消化速度の目安(G/h)。未指定ならフォーム既定値を使う */
  gamesPerHour?: number;
  /** 当選後の消化時間の目安(分) */
  postHitMinutes?: number;
  /** 狙い目の要点（再構成） */
  nerai: string;
  /** やめどきの要点（再構成） */
  yamedoki: string;
  /** 補足（周期・二重天井・期待値の考え方など） */
  note?: string;
}

export const MACHINES: Machine[] = [
  {
    slug: "karakuri-circus-2",
    name: "からくりサーカス2",
    tenjoGames: 890,
    gamesPerHour: 800,
    postHitMinutes: 15,
    nerai:
      "実ゲーム数890G到達でCZ当選＝実G数天井狙いが軸。朝一リセット時はCZ天井(液晶)が500Gに短縮されるため、リセ台は狙い目が下がる。",
    yamedoki:
      "当選後は状況確認。有利区間リセット(エンディング等)時は上位A-CZに繋がるので続行、通常時はCZ/AT間のG数を見て天井が遠ければやめ。",
    note: "液晶1200G(1100Gゾーン)と実890Gの二重天井。CZ4連続失敗後の5回目CZはAT書き換え濃厚。",
  },
  {
    slug: "yabachiba",
    name: "ヤバチバ",
    tenjoGames: 999,
    gamesPerHour: 800,
    postHitMinutes: 15,
    nerai:
      "ゲーム数天井狙いは450G〜(虹7モード後は890G〜で激辛傾向)。リセット狙いは300G〜。チェリー規定回数(40回/リセ30回)天井も併存。",
    yamedoki:
      "ボーナス後の天国モード(32G以内)を否定したらやめ。虹7モード後は当日辛いので深追いしない。",
  },
  {
    slug: "dark-hibi",
    name: "ダークハイビ",
    tenjoGames: 999,
    gamesPerHour: 800,
    postHitMinutes: 12,
    nerai:
      "スルー回数で調整。0スルー天井狙い300G〜/2スルー400G〜/その他700G〜。0スルーのゾーン狙いは90〜250G。",
    yamedoki: "天国連(連チャン)を否定し、スルー回数・G数を見て天井が遠ければやめ。",
    note: "設置台数が少なく狙い目は暫定。変則押し/ハサミ打ちで天井が1G延長するペナルティに注意。",
  },
  {
    slug: "sengoku-otome5",
    name: "戦国乙女5 業火を穿つ宿焔の双刃",
    tenjoGames: 999,
    gamesPerHour: 800,
    postHitMinutes: 15,
    nerai:
      "ゲーム数天井狙い620G〜。周期天井は3周期目〜。リセ台は260G〜(周期・液晶が未進行想定)。液晶メニューからATハマりG確認可。",
    yamedoki: "有利区間リセット後・周期/G数が浅い所ではやめ。",
    note: "最大6周期(リセ4周期)の周期天井＋ゲーム数天井の二重構造。",
  },
  {
    slug: "sao2",
    name: "ソードアート・オンラインII",
    tenjoGames: 1200,
    gamesPerHour: 800,
    postHitMinutes: 15,
    nerai:
      "AT間ゲーム数天井狙い800G〜。CZ間(実499G+α)狙いは液晶550〜。初回の上位CZ失敗後は256G+αでCZ天井が発動。",
    yamedoki: "AT間・CZ間のハマりが浅い所でやめ。実践値の期待値表が出にくいタイプなので慎重に。",
  },
  {
    slug: "birdie-wing",
    name: "BIRDIE WING",
    tenjoGames: 0,
    gamesPerHour: 800,
    postHitMinutes: 12,
    nerai:
      "周期タイプ(1周期平均110G前後)。周期頭から打ち出す想定で、期待値表のボーダーを5〜6%上げて狙う。天井は10周期(リセ7周期)。",
    yamedoki: "周期を消化した直後(次周期の頭以外)はやめ。",
    note: "G数天井ではなく周期天井。時給は『残り周期×1周期のG/消化速度』で概算する。",
  },
  {
    slug: "biohazard-re3",
    name: "バイオハザードRE:3",
    tenjoGames: 1000,
    gamesPerHour: 800,
    postHitMinutes: 15,
    nerai:
      "実ゲーム数天井1000G+α(リセ650G+α)。NE-ポイント(500ptでCZ間天井)も考慮してボーダー調整。CZスルー回数はメニューで確認。",
    yamedoki:
      "CZ間・NE-ポイント残量を見て天井が遠ければやめ。上位CZ後はデータ機と液晶のG数が8G前後ズレる点に注意。",
  },
];
