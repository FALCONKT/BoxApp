// スコア・開封履歴のローカル永続化ヘルパー。
// 現状はDB未接続のため localStorage で代替（将来的にサーバーAPI/DBへ差し替え予定）。
// キーはSupabaseログイン中のメールアドレスを使用する。

const STORAGE_TOTALS = "bh_totals";
const STORAGE_HISTORY_PREFIX = "bh_history_";

export function getTotals() {
  return JSON.parse(localStorage.getItem(STORAGE_TOTALS) || "{}");
}

function saveTotals(totals) {
  localStorage.setItem(STORAGE_TOTALS, JSON.stringify(totals));
}

export function getHistory(email) {
  return JSON.parse(localStorage.getItem(STORAGE_HISTORY_PREFIX + email) || "[]");
}

function saveHistory(email, history) {
  localStorage.setItem(STORAGE_HISTORY_PREFIX + email, JSON.stringify(history));
}

export function addRecord(email, resultName, points) {
  const history = getHistory(email);
  history.unshift({ datetime: formatDateTime(new Date()), result: resultName, points });
  saveHistory(email, history);

  const totals = getTotals();
  totals[email] = (totals[email] || 0) + points;
  saveTotals(totals);

  return totals[email];
}

export function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
