/* 宝石BoxHunter 共通ロジック（ユーザー登録・ログイン・データ永続化）
   現状はDB未接続のため localStorage で代替。将来的にサーバーAPI/DBへ差し替え予定。 */

const STORAGE_USERS = "bh_users";
const STORAGE_SESSION = "bh_session";
const STORAGE_TOTALS = "bh_totals";
const STORAGE_HISTORY_PREFIX = "bh_history_";

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(STORAGE_SESSION) || "";
}

function setSession(username) {
  localStorage.setItem(STORAGE_SESSION, username);
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
}

function getTotals() {
  return JSON.parse(localStorage.getItem(STORAGE_TOTALS) || "{}");
}

function saveTotals(totals) {
  localStorage.setItem(STORAGE_TOTALS, JSON.stringify(totals));
}

function getHistory(username) {
  return JSON.parse(localStorage.getItem(STORAGE_HISTORY_PREFIX + username) || "[]");
}

function saveHistory(username, history) {
  localStorage.setItem(STORAGE_HISTORY_PREFIX + username, JSON.stringify(history));
}

function addRecord(username, resultName, points) {
  const history = getHistory(username);
  history.unshift({ datetime: formatDateTime(new Date()), result: resultName, points });
  saveHistory(username, history);

  const totals = getTotals();
  totals[username] = (totals[username] || 0) + points;
  saveTotals(totals);

  return totals[username];
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function registerUser(username, password) {
  username = username.trim();
  if (!username || !password) {
    return { ok: false, message: "ユーザー名とパスワードを入力してください。" };
  }
  const users = getUsers();
  if (users[username]) {
    return { ok: false, message: "そのユーザー名は既に登録されています。" };
  }
  users[username] = await hashPassword(password);
  saveUsers(users);
  setSession(username);
  return { ok: true };
}

async function loginUser(username, password) {
  username = username.trim();
  const users = getUsers();
  if (!users[username]) {
    return { ok: false, message: "ユーザーが見つかりません。" };
  }
  const hashed = await hashPassword(password);
  if (users[username] !== hashed) {
    return { ok: false, message: "パスワードが違います。" };
  }
  setSession(username);
  return { ok: true };
}

function logoutUser() {
  clearSession();
}
