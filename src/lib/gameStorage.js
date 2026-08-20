// 開封結果一覧（表示用ログ）のローカル永続化ヘルパー。
// 累計スコア・宝石取得数はSupabaseのuser_statsテーブルで管理する（src/lib/statsApi.js）。
// キーはSupabaseログイン中のメールアドレスを使用する。

const STORAGE_HISTORY_PREFIX = "bh_history_";

export function getHistory(email) {
  return JSON.parse(localStorage.getItem(STORAGE_HISTORY_PREFIX + email) || "[]");
}

function saveHistory(email, history) {
  localStorage.setItem(STORAGE_HISTORY_PREFIX + email, JSON.stringify(history));
}

export function addHistoryRecord(email, resultName, points) {
  const history = getHistory(email);
  history.unshift({ datetime: formatDateTime(new Date()), result: resultName, points });
  saveHistory(email, history);
}

export function clearLocalHistory(email) {
  localStorage.removeItem(STORAGE_HISTORY_PREFIX + email);
}

export function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
