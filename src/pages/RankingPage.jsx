import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchRanking } from "../lib/statsApi";

// TOP30ランキングページ："/ranking"（RequireAuthで未ログイン時はリダイレクトされる）
export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState("");

  // Supabaseのuser_statsから全ユーザーの累計スコア上位30件を取得する（SELECT）
  useEffect(() => {
    let cancelled = false;

    fetchRanking()
      .then((rows) => {
        if (!cancelled) setRanking(rows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("ランキングの取得に失敗しました。");
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

      {error && <div className="error-text">{error}</div>}

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
            ranking.map((row, i) => (
              <tr key={row.username} className={row.username === user?.email ? "me" : ""}>
                <td>{i + 1}</td>
                <td>{row.username}</td>
                <td>{row.total_score}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <footer>&copy; 2026 KT Corporation</footer>
    </>
  );
}
