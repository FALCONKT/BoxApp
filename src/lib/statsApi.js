// user_stats テーブル（累計スコア・宝石取得数）に対するCRUD操作。
// テーブル定義・RLSポリシーは supabase/schema.sql を参照。
import { supabase } from "../supabaseClient";

// 宝石キーとuser_statsのカラム名の対応
const GEM_COLUMNS = {
  dia: "diamond_count",
  rub: "ruby_count",
  saf: "sapphire_count",
  to: "topaz_count",
};

// ログイン中ユーザー自身の累計スコア・宝石取得数を取得する（SELECT）
export async function fetchUserStats(userId) {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// TOP30ランキング表示用に全ユーザーの累計スコアを取得する（SELECT）
export async function fetchRanking() {
  const { data, error } = await supabase
    .from("user_stats")
    .select("username, total_score")
    .order("total_score", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

// 宝箱を開けた結果を累計スコア・宝石取得数に反映する。
// レコードが未作成の初回開封はINSERT、2回目以降は既存レコードをUPDATEする。
export async function recordBoxOpening(user, prize) {
  const userId = user.id;
  const username = user.email;
  const gemColumn = GEM_COLUMNS[prize.key];
  const existing = await fetchUserStats(userId);

  if (!existing) {
    // 初回開封：累計レコードを新規作成（INSERT）
    const { data, error } = await supabase
      .from("user_stats")
      .insert({
        user_id: userId,
        username,
        total_score: prize.points,
        diamond_count: gemColumn === "diamond_count" ? 1 : 0,
        ruby_count: gemColumn === "ruby_count" ? 1 : 0,
        sapphire_count: gemColumn === "sapphire_count" ? 1 : 0,
        topaz_count: gemColumn === "topaz_count" ? 1 : 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // 2回目以降：既存レコードの累計値を加算して更新（UPDATE）
  const updates = {
    total_score: existing.total_score + prize.points,
    updated_at: new Date().toISOString(),
  };
  if (gemColumn) updates[gemColumn] = existing[gemColumn] + 1;

  const { data, error } = await supabase
    .from("user_stats")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ユーザー自身の累計レコードを削除する（DELETE）
export async function clearUserStats(userId) {
  const { error } = await supabase.from("user_stats").delete().eq("user_id", userId);
  if (error) throw error;
}
