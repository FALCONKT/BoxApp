# CLAUDE.md

このファイルは、このリポジトリで Claude Code が作業する際のガイドです。

## プロジェクト概要

**宝石BoxHunter** — 宝箱をクリックして開け、宝石を集めるブラウザゲーム。
React + Vite で構成し、認証には Supabase Auth（メールアドレス＋パスワード）を利用する。

起動には Node.js が必要（`file://` 直接オープンでは動作しない）。

```
npm install
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド（dist/ に出力）
npm run preview # ビルド結果のプレビュー
```

## ファイル構成

| ファイル/ディレクトリ | 役割 |
|---|---|
| `index.html` | Viteエントリポイント（`<div id="root">` と `src/main.jsx` の読み込みのみ） |
| `src/main.jsx` | Reactエントリ。`style.css` を読み込みルート要素へマウント |
| `src/App.jsx` | ルーティング（`/` ＝ホーム、`/ranking` ＝ランキング） |
| `src/supabaseClient.js` | Supabaseクライアント初期化（`.env` の値を使用） |
| `src/context/AuthContext.jsx` | Supabaseセッションを購読し `useAuth()` で全体共有 |
| `src/components/RequireAuth.jsx` | 未ログイン時に `/` へリダイレクトするガード |
| `src/components/AuthPanel.jsx` | ログイン／新規登録フォーム（メールアドレス＋パスワード） |
| `src/components/GameSection.jsx` | 宝箱盤・合計点数・開封結果テーブル |
| `src/pages/HomePage.jsx` | `/` ルート。ログイン状態でAuthPanel⇄GameSectionを出し分け |
| `src/pages/RankingPage.jsx` | `/ranking` ルート。全ユーザー中TOP30の合計点数ランキング（RequireAuthでガード） |
| `src/lib/prizes.js` | 宝箱の抽選テーブル（唯一の情報源） |
| `src/lib/gameStorage.js` | 開封結果一覧（ログ表示）のlocalStorage永続化ヘルパー |
| `src/lib/statsApi.js` | 累計スコア・宝石取得数（Supabase `user_stats`）へのCRUD操作 |
| `src/style.css` | 全ページ共通スタイル（デザインは移行前と同一） |
| `supabase/schema.sql` | `user_stats` テーブル定義・RLSポリシー（Supabase SQL Editorで実行） |
| `public/img/` | 画像アセット（後述） |
| `public/*.mp3` | 音声アセット（後述） |

## 認証（Supabase Auth）

- メールアドレス＋パスワードでの会員登録・ログインを Supabase Auth（`signUp` / `signInWithPassword`）で行う。
- Project URL / Publishable Key は `.env`（`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`）で管理し、`.gitignore` によりリポジトリには含めない。ローカル環境構築時は `.env.example` をコピーして値を設定する。
- 新規登録時、Supabaseプロジェクト側で「メール確認必須」が有効な場合はセッションが即時発行されないため、`AuthPanel` は確認メール送付の案内を表示してログインタブに戻す。
- `RequireAuth`（`src/components/RequireAuth.jsx`）が `/ranking` など保護されたルートをガードし、未ログイン時は `/` のログイン画面へリダイレクトする。`/` 自体はログイン状態に応じてAuthPanel⇄GameSectionを出し分ける構成（移行前のindex.html内での画面切替挙動を踏襲）。

## ゲームルール

- 宝箱は全36個、6×6グリッドで配置。
- 箱をクリックすると開封アニメーション（`popFront` キーフレーム：拡大しながら前面にせり出す）とともに中身を1回抽選する。
- 抽選確率と点数（合計重み36で正規化）：

  | 宝石 | 確率 | 点数 | 画像 |
  |---|---|---|---|
  | ダイヤモンド | 1/36 | 1000 | `/img/BOX_Op_Dia.png` |
  | ルビー | 3/36 | 100 | `/img/BOX_Op_Rub.png` |
  | サファイア | 6/36 | 10 | `/img/BOX_Op_Saf.png` |
  | トパーズ | 9/36 | 1 | `/img/BOX_Op_To.png` |
  | 空 | 17/36 | 0 | `/img/BOX_Op.png` |

- 開封時に対応する効果音を再生する（空の場合は `boxopen.mp3`）。
- 開封表示は `OPEN_DISPLAY_MS`（`src/lib/prizes.js`、1500ms）の間表示。その間は他の箱の再クリックは不可（見た目は不透明化せず通常表示のまま無効化）。
- 表示時間経過後は、その箱だけを閉じるのではなく **盤面36個すべてを一度消去してから再構築**（`GameSection` の `boardKey` をインクリメントして盤面を強制再マウント）して全closed状態に戻す。
- 抽選結果は結果テーブルの先頭（最新が上）に追加され、合計点数（テーブル上部に表示）にも即時反映される。
- 「開封結果」見出し横の「履歴を削除」ボタン（`GameSection` 内 `.result-header`）で、確認ダイアログ（`window.confirm`）の承認後に開封履歴と合計点数をまとめて削除できる（`gameStorage.js` の `clearHistory`）。履歴が0件のときはボタンを無効化。

`src/lib/prizes.js` の `PRIZES` 配列が確率テーブルの唯一の情報源。確率や点数を変更する場合はここだけを編集する。

## 画像・音声アセット

Viteの `public/` 配下は静的パスとしてそのまま配信されるため、参照パスは `/img/...` `/xxx.mp3` の形式（先頭スラッシュ必須）。

画像は `public/img/` フォルダに格納。

- `BOX.png` … 閉じた宝箱
- `BOX_Op.png` … 開いた宝箱（空の場合にも使用）
- `BOX_Op_Dia.png` … ダイヤモンド入り
- `BOX_Op_Rub.png` … ルビー入り
- `BOX_Op_Saf.png` … サファイア入り
- `BOX_Op_To.png` … トパーズ入り

音声は `public/` 直下に配置。開封結果に応じて `src/lib/prizes.js` の `PRIZES[].soundSrc` が再生される。

- `boxopen.mp3` … 空（ハズレ）の場合の開封音
- `Dia.mp3` … ダイヤモンド
- `Rub.mp3` … ルビー
- `Saf.mp3` … サファイア
- `To.mp3` … トパーズ

## データ永続化

会員登録・ログインは Supabase Auth、**累計スコア・宝石取得数は Supabase の `user_stats` テーブル**で管理する。開封結果一覧（日時付きのログ表示）は引き続き `localStorage` で管理する（テーブル定義には含まれないため）。

### user_stats テーブル（Supabase）

テーブル定義・RLSポリシーは [`supabase/schema.sql`](supabase/schema.sql) にまとめてある。Supabaseダッシュボードの SQL Editor で一度実行する必要がある（コード側からDDLは実行できない）。

| カラム | 内容 |
|---|---|
| `user_id` | 主キー。`auth.users.id` への外部キー |
| `username` | 表示用メールアドレス（`auth.users` はクライアントから直接SELECTできないため冗長保持） |
| `total_score` | 合計点数 |
| `diamond_count` / `ruby_count` / `sapphire_count` / `topaz_count` | 宝石ごとの累計取得数 |
| `updated_at` | 最終更新日時 |

RLSを有効化し、以下のポリシーを設定済み：
- **SELECT**：ログイン済みユーザーは全員分を閲覧可能（ランキング表示のため）
- **INSERT/UPDATE/DELETE**：`auth.uid() = user_id` の行のみ、本人操作に限定

CRUD操作は `src/lib/statsApi.js` に集約：
- `fetchUserStats(userId)` … 自分の累計を取得（SELECT）
- `fetchRanking()` … 全ユーザーの合計点数TOP30を取得（SELECT、`RankingPage`が使用）
- `recordBoxOpening(user, prize)` … 宝箱を開けた結果を反映。レコード未作成なら新規作成（INSERT）、既存なら加算更新（UPDATE）。`GameSection`の`openBox`から呼び出す
- `clearUserStats(userId)` … 累計レコードを削除（DELETE）。「履歴を削除」ボタンから呼び出す

いずれもエラー時は `GameSection`/`RankingPage` 側で `.error-text` によりエラーメッセージを表示し、画面はクラッシュさせない。

### 開封結果一覧（localStorage、引き続き暫定）

- `bh_history_<email>` … そのユーザーの開封履歴配列（新しい記録が先頭、日時付き）。`src/lib/gameStorage.js` の `getHistory`/`addHistoryRecord`/`clearLocalHistory` で操作。

## デザイン方針

- 背景色：薄茶色（`--bg-color: #e8d6b8`）
- フォント：明朝体（`游明朝` / `Yu Mincho` / `MS PMincho` 等のフォールバック）
- 見出し：太字・48px（`h1.title`）
- 宝箱盤：石畳風の背景（CSSグラデーションで表現、画像アセット不使用）＋縁取り枠
- フッター：`© 2026 KT Corporation`
- レスポンシブ：`style.css` 末尾のメディアクエリで、タブレット（〜1024px）・SP（〜600px）では `body`余白／`.board-wrap`余白・枠線／`.board`のgapを詰め、宝箱1個の見た目サイズをデスクトップ相対で約1.2〜1.4倍に拡大（6×6配置は変更しない）。数値をさらに詰めれば拡大率は上げられるが、詰めすぎると石畳の縁取りが失われるため、枠が視認できる範囲で調整済み。
- デスクトップ限定レイアウト（1025px以上）：`#gameSection` を `grid-template-columns: 7fr 3fr` にし、左＝宝箱盤、右＝「開封結果」パネル（`.result-panel` / `GameSection` 側で見出し＋テーブルを `.result-scroll` でラップ）を配置。結果側は `max-height: calc(100vh - 220px)` ＋ `overflow-y: auto` で独自スクロールし、`thead` を `position: sticky` で固定。タブレット・SPはこの節の影響を受けず、従来通り縦並び。
- ログイン／新規登録フォームは移行前の「ユーザー名」欄を「メールアドレス」欄（`type="email"`）に置き換えた以外、レイアウト・配色・クラス名（`.auth-panel` `.auth-tabs` `.auth-error` 等）は変更していない。確認メール案内表示用に `.auth-notice` を1クラスのみ追加。

## 今後の想定タスク（未着手）

- 開封結果一覧（日時付きログ）の localStorage → Supabaseテーブルへの移行
- Supabaseプロジェクト側の認証設定（メール確認要否、パスワードポリシー等）の運用方針整理

## Supabase設定

- Project URL: `https://ocyqvhudfnmpofpuzykv.supabase.co`
- 環境変数は `.env`（gitignore対象）で管理。キー名は `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`。
- ローカル環境構築時は `.env.example` を `.env` にコピーし、値をSupabaseダッシュボードのProject Settings > API から取得して設定する。

## GitHubリポジトリ

https://github.com/FALCONKT/BoxApp.git
