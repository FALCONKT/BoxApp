/* 宝石BoxHunter ゲーム画面ロジック */

const BOX_COUNT = 36;
const BOX_CLOSED_IMG = "img/BOX.png";
const OPEN_DISPLAY_MS = 1500;
const openSound = new Audio("boxopen.mp3");

// 宝箱36個に対する内訳（合計36）。ダイヤ1・ルビー3・サファイア6・トパーズ9・空17。
// sound: その宝石が出た時に鳴らす専用の効果音（空はboxopen.mp3のまま）。
const PRIZES = [
  { key: "dia", name: "ダイヤモンド", points: 1000, img: "img/BOX_Op_Dia.png", weight: 1, rowClass: "row-dia", sound: new Audio("Dia.mp3") },
  { key: "rub", name: "ルビー", points: 100, img: "img/BOX_Op_Rub.png", weight: 3, rowClass: "row-rub", sound: new Audio("Rub.mp3") },
  { key: "saf", name: "サファイア", points: 10, img: "img/BOX_Op_Saf.png", weight: 6, rowClass: "row-saf", sound: new Audio("Saf.mp3") },
  { key: "to", name: "トパーズ", points: 1, img: "img/BOX_Op_To.png", weight: 9, rowClass: "row-to", sound: new Audio("To.mp3") },
  { key: "empty", name: "なし", points: 0, img: "img/BOX_Op.png", weight: 17, rowClass: "", sound: openSound },
];
const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0);

// 開封時に画像がロード待ちで一瞬透明表示になるのを防ぐため事前読み込みしておく
[BOX_CLOSED_IMG, ...PRIZES.map((p) => p.img)].forEach((src) => {
  const preload = new Image();
  preload.src = src;
});

let authMode = "login";
let currentUser = "";
let boardLocked = false;

const authSection = document.getElementById("authSection");
const gameSection = document.getElementById("gameSection");
const authForm = document.getElementById("authForm");
const authError = document.getElementById("authError");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const welcomeMsg = document.getElementById("welcomeMsg");
const logoutBtn = document.getElementById("logoutBtn");
const boardEl = document.getElementById("board");
const totalScoreEl = document.getElementById("totalScore");
const resultBodyEl = document.getElementById("resultBody");

function setAuthMode(mode) {
  authMode = mode;
  tabLogin.classList.toggle("active", mode === "login");
  tabRegister.classList.toggle("active", mode === "register");
  authForm.querySelector(".auth-submit").textContent = mode === "login" ? "ログイン" : "登録する";
  authError.textContent = "";
}

tabLogin.addEventListener("click", () => setAuthMode("login"));
tabRegister.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const result = authMode === "login"
    ? await loginUser(username, password)
    : await registerUser(username, password);

  if (!result.ok) {
    authError.textContent = result.message;
    return;
  }
  enterGame(getSession());
});

logoutBtn.addEventListener("click", () => {
  logoutUser();
  currentUser = "";
  gameSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  authForm.reset();
  setAuthMode("login");
});

function enterGame(username) {
  currentUser = username;
  welcomeMsg.textContent = `ようこそ、${username} さん`;
  authSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  buildBoard();
  renderTotal();
  renderHistory();
}

function buildBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < BOX_COUNT; i++) {
    const btn = document.createElement("button");
    btn.className = "box";
    btn.type = "button";
    btn.dataset.index = String(i);

    const img = document.createElement("img");
    img.src = BOX_CLOSED_IMG;
    img.alt = "閉じた宝箱";
    btn.appendChild(img);

    btn.addEventListener("click", () => openBox(btn, img));
    boardEl.appendChild(btn);
  }
}

function drawPrize() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const prize of PRIZES) {
    if (r < prize.weight) return prize;
    r -= prize.weight;
  }
  return PRIZES[PRIZES.length - 1];
}

function openBox(btn, img) {
  if (boardLocked) return;
  boardLocked = true;
  setBoardDisabled(true);

  const prize = drawPrize();
  img.src = prize.img;
  img.alt = prize.key === "empty" ? "空の宝箱" : prize.name;
  btn.classList.add("opened");

  prize.sound.currentTime = 0;
  prize.sound.play().catch(() => {});

  const total = addRecord(currentUser, prize.name, prize.points);
  renderTotal(total);
  prependResultRow(prize);

  setTimeout(() => {
    buildBoard();
    boardLocked = false;
  }, OPEN_DISPLAY_MS);
}

function setBoardDisabled(disabled) {
  boardEl.querySelectorAll(".box").forEach((b) => {
    if (!b.classList.contains("opened")) b.disabled = disabled;
  });
}

function renderTotal(total) {
  const totals = getTotals();
  totalScoreEl.textContent = String(total !== undefined ? total : (totals[currentUser] || 0));
}

function prependResultRow(prize) {
  const tr = document.createElement("tr");
  if (prize.rowClass) tr.classList.add(prize.rowClass);
  tr.innerHTML = `<td>${formatDateTime(new Date())}</td><td>${prize.name}</td><td>${prize.points}</td>`;
  resultBodyEl.insertBefore(tr, resultBodyEl.firstChild);
}

function renderHistory() {
  resultBodyEl.innerHTML = "";
  const history = getHistory(currentUser);
  for (const record of history) {
    const prize = PRIZES.find((p) => p.name === record.result);
    const tr = document.createElement("tr");
    if (prize && prize.rowClass) tr.classList.add(prize.rowClass);
    tr.innerHTML = `<td>${record.datetime}</td><td>${record.result}</td><td>${record.points}</td>`;
    resultBodyEl.appendChild(tr);
  }
}

const existingSession = getSession();
if (existingSession && getUsers()[existingSession]) {
  enterGame(existingSession);
}
