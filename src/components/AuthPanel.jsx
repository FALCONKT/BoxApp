import { useState } from "react";
import { supabase } from "../supabaseClient";

// ログイン／新規登録フォーム（メールアドレス＋パスワード、Supabase Authを利用）
export default function AuthPanel() {
  const [mode, setMode] = useState("login"); // "login" または "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    const { data, error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setSubmitting(false);

    if (authError) {
      setError(translateAuthError(authError));
      return;
    }

    // 新規登録時、メール確認が必須の設定だとセッションが発行されないため案内を表示する
    if (mode === "register" && !data.session) {
      setNotice("確認メールを送信しました。メール内のリンクから認証を完了してからログインしてください。");
      setMode("login");
    }
  }

  return (
    <section id="authSection" className="auth-panel">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => switchMode("login")}
        >
          ログイン
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => switchMode("register")}
        >
          新規登録
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {notice && <div className="auth-notice">{notice}</div>}
        <div className="auth-error">{error}</div>
        <button type="submit" className="auth-submit" disabled={submitting}>
          {mode === "login" ? "ログイン" : "登録する"}
        </button>
      </form>
    </section>
  );
}

// Supabaseの認証エラーメッセージを日本語に変換する
function translateAuthError(error) {
  const message = error.message || "";
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが違います。";
  }
  if (message.includes("User already registered")) {
    return "そのメールアドレスは既に登録されています。";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (message.includes("Unable to validate email address")) {
    return "メールアドレスの形式が正しくありません。";
  }
  return "エラーが発生しました。しばらくしてから再度お試しください。";
}
