import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTotals } from "../lib/gameStorage";

// TOP30ランキングページ："/ranking"（RequireAuthで未ログイン時はリダイレクトされる）
export default function RankingPage() {
  const { user } = useAuth();
  const totals = getTotals();
  const ranking = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  return (
    <>
      <header>
        <h1 className="title">宝石BoxHunter</h1>
      </header>

      <p className="subtitle">TOP30 ランキング</p>

      <div className="top-nav">
        <Link to="/" className="link-button secondary">
          ゲームに戻る
        </Link>
      </div>

      <table className="rank-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>ユーザー名</th>
            <th>合計点数</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td colSpan="3">まだ記録がありません</td>
            </tr>
          ) : (
            ranking.map(([rankEmail, score], i) => (
              <tr key={rankEmail} className={rankEmail === user?.email ? "me" : ""}>
                <td>{i + 1}</td>
                <td>{rankEmail}</td>
                <td>{score}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <footer>&copy; 2026 KT Corporation</footer>
    </>
  );
}
