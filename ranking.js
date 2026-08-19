/* 宝石BoxHunter ランキング画面ロジック */

const rankBody = document.getElementById("rankBody");
const me = getSession();

const totals = getTotals();
const ranking = Object.entries(totals)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

if (ranking.length === 0) {
  rankBody.innerHTML = `<tr><td colspan="3">まだ記録がありません</td></tr>`;
} else {
  ranking.forEach(([username, score], i) => {
    const tr = document.createElement("tr");
    if (username === me) tr.classList.add("me");
    tr.innerHTML = `<td>${i + 1}</td><td>${username}</td><td>${score}</td>`;
    rankBody.appendChild(tr);
  });
}
