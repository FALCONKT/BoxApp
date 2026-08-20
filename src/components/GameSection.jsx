import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { BOX_COUNT, BOX_CLOSED_IMG, OPEN_DISPLAY_MS, PRIZES, TOTAL_WEIGHT } from "../lib/prizes";
import { addRecord, getHistory, getTotals, formatDateTime } from "../lib/gameStorage";

// 宝箱ゲーム本体（宝箱盤・合計点数・開封結果テーブル）
export default function GameSection({ user }) {
  const email = user.email;
  const [locked, setLocked] = useState(false);
  const [openedIndex, setOpenedIndex] = useState(null);
  const [openedPrize, setOpenedPrize] = useState(null);
  const [boardKey, setBoardKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const soundsRef = useRef({});

  // 初回表示時に既存の合計点数・履歴を読み込み、画像/音声をプリロードする
  useEffect(() => {
    const totals = getTotals();
    setTotal(totals[email] || 0);
    setHistory(getHistory(email));

    [BOX_CLOSED_IMG, ...PRIZES.map((p) => p.img)].forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    PRIZES.forEach((p) => {
      soundsRef.current[p.key] = new Audio(p.soundSrc);
    });
  }, [email]);

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

    const newTotal = addRecord(email, prize.name, prize.points);
    setTotal(newTotal);
    setHistory((prev) => [
      { datetime: formatDateTime(new Date()), result: prize.name, points: prize.points },
      ...prev,
    ]);

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

      <div className="result-panel">
        <h2 className="section-heading">開封結果</h2>
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
