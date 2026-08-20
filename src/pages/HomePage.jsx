import { useAuth } from "../context/AuthContext";
import AuthPanel from "../components/AuthPanel";
import GameSection from "../components/GameSection";

// トップページ："/" 。ログイン状態に応じて認証フォームとゲーム画面を出し分ける
export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <>
      <header>
        <h1 className="title">宝石BoxHunter</h1>
      </header>

      {!loading && (user ? <GameSection user={user} /> : <AuthPanel />)}

      <footer>&copy; 2026 KT Corporation</footer>
    </>
  );
}
