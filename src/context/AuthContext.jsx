import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// 認証状態（ログイン中のユーザー情報）をアプリ全体で共有するためのコンテキスト
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回読み込み時に現在のセッションを取得
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // ログイン・ログアウトなど認証状態の変化を監視
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
