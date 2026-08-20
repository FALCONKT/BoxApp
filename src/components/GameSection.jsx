import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { BOX_COUNT, BOX_CLOSED_IMG, OPEN_DISPLAY_MS, PRIZES, TOTAL_WEIGHT } from "../lib/prizes";
import { addHistoryRecord, clearLocalHistory, getHistory, formatDateTime } from "../lib/gameStorage";
import { fetchUserStats, recordBoxOpening, clearUserStats } from "../lib/statsApi";

// 宝箱ゲーム本体（宝箱盤・合計点数・開封結果テーブル）
export default function GameSection({ user }) {
  const email = user.email;
  const [locked, setLocked] = useState(false);
  const [openedIndex, setOpenedIndex] = useState(null);
  const [openedPrize, setOpenedPrize] = useState(null);
  const [boardKey, setBoardKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [saveError, setSaveError] = useState("");
  const soundsRef = useRef({});

  // 初回表示時に既存の合計点数（Supabase）・履歴（ローカル）を読み込み、画像/音声をプリロードする
  useEffect(() => {
    let cancelled = false;

    fetchUserStats(user.id)
      .then((stats) => {
        if (!cancelled) setTotal(stats?.total_score || 0);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setSaveError("合計点数の取得に失敗しました。");
      });

    setHistory(getHistory(email));

    [BOX_CLOSED_IMG, ...PRIZES.map((p) => p.img)].forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    PRIZES.forEach((p) => {
      soundsRef.current[p.key] = new Audio(p.soundSrc);
    });

    return () => {
      cancelled = true;
    };
  }, [user.id, email]);

  function drawPrize() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const prize of PRIZES) {
      if (r < prize.weight) return prize;
      r -= prize.weight;
    }
    return PRIZES[PRIZES.length - 1];
  }

  function openBox(index) {
    if (locked) return;
    setLocked(true);

    const prize = drawPrize();
    setOpenedIndex(index);
    setOpenedPrize(prize);

    const sound = soundsRef.current[prize.key];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }

    // 開封結果一覧はローカルに即時追加（表示用ログ）
    addHistoryRecord(email, prize.name, prize.points);
    setHistory((prev) => [
      { datetime: formatDateTime(new Date()), result: prize.name, points: prize.points },
      ...prev,
    ]);

    // 累計スコア・宝石取得数はSupabaseへ反映（INSERT/UPDATE）
    setTotal((prev) => prev + prize.points);
    recordBoxOpening(user, prize)
      .then(() => setSaveError(""))
      .catch((err) => {
        console.error(err);
        setSaveError("スコアの保存に失敗しました。通信環境をご確認のうえ再度お試しください。");
      });

    // 一定時間表示した後、盤面36個すべてを消去して再構築する
    setTimeout(() => {
      setOpenedIndex(null);
      setOpenedPrize(null);
      setLocked(false);
      setBoardKey((k) => k + 1);
    }, OPEN_DISPLAY_MS);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function handleClearHistory() {
    if (history.length === 0) return;
    if (!window.confirm("開封結果と合計点数をすべて削除します。よろしいですか？")) return;

    clearLocalHistory(email);
    setHistory([]);
    setTotal(0);

    // 累計スコア・宝石取得数のレコードをSupabaseから削除（DELETE）
    clearUserStats(user.id)
      .then(() => setSaveError(""))
      .catch((err) => {
        console.error(err);
        setSaveError("Supabase側のデータ削除に失敗しました。");
      });
  }

  return (
    <section id="gameSection">
      <div className="user-bar">
        <span>ようこそ、{email} さん</span>
        <Link to="/ranking" className="link-button">
          TOP30ランキングを見る
        </Link>
        <button type="button" className="secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      <p className="subtitle">宝箱を開けよう</p>

      <div className="board-wrap">
        <div className="board" key={boardKey}>
          {Array.from({ length: BOX_COUNT }, (_, i) => {
            const isOpened = i === openedIndex;
            const img = isOpened ? openedPrize.img : BOX_CLOSED_IMG;
            const alt = isOpened
              ? openedPrize.key === "empty"
                ? "空の宝箱"
                : openedPrize.name
              : "閉じた宝箱";
            return (
              <button
                key={i}
                type="button"
                className={isOpened ? "box opened" : "box"}
                disabled={locked && !isOpened}
                onClick={() => openBox(i)}
              >
                <img src={img} alt={alt} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="total-score-panel">
        <div className="label">合計点数</div>
        <div className="value">{total}</div>
      </div>

      {saveError && <div className="error-text">{saveError}</div>}

      <div className="result-panel">
        <div className="result-header">
          <h2 className="section-heading">開封結果</h2>
          <button
            type="button"
            className="secondary"
            disabled={history.length === 0}
            onClick={handleClearHistory}
          >
            履歴を削除
          </button>
        </div>
        <div className="result-scroll">
          <table className="result-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>結果</th>
                <th>点数</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, i) => {
                const prize = PRIZES.find((p) => p.name === record.result);
                return (
                  <tr key={i} className={prize?.rowClass || ""}>
                    <td>{record.datetime}</td>
                    <td>{record.result}</td>
                    <td>{record.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
