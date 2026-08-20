// 宝箱の抽選テーブル（唯一の情報源）。確率や点数を変更する場合はここだけを編集する。

export const BOX_COUNT = 36;
export const BOX_CLOSED_IMG = "/img/BOX.png";
export const OPEN_DISPLAY_MS = 1500;

// 宝箱36個に対する内訳（合計36）。ダイヤ1・ルビー3・サファイア6・トパーズ9・空17。
export const PRIZES = [
  { key: "dia", name: "ダイヤモンド", points: 1000, img: "/img/BOX_Op_Dia.png", weight: 1, rowClass: "row-dia", soundSrc: "/Dia.mp3" },
  { key: "rub", name: "ルビー", points: 100, img: "/img/BOX_Op_Rub.png", weight: 3, rowClass: "row-rub", soundSrc: "/Rub.mp3" },
  { key: "saf", name: "サファイア", points: 10, img: "/img/BOX_Op_Saf.png", weight: 6, rowClass: "row-saf", soundSrc: "/Saf.mp3" },
  { key: "to", name: "トパーズ", points: 1, img: "/img/BOX_Op_To.png", weight: 9, rowClass: "row-to", soundSrc: "/To.mp3" },
  { key: "empty", name: "なし", points: 0, img: "/img/BOX_Op.png", weight: 17, rowClass: "", soundSrc: "/boxopen.mp3" },
];

export const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0);
