-- =============================================================
-- 自動通知トリガー: リアクション更新時に通知を生成
-- =============================================================
-- 実行条件: process_logs.reactions カラムが UPDATE された時
-- 書き込み先: notifications テーブル
-- =============================================================

-- 1. トリガー関数の定義
CREATE OR REPLACE FUNCTION handle_new_reaction_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- RLSをバイパスして通知を挿入するため
SET search_path = public
AS $$
DECLARE
    reaction_type TEXT;
    old_count INT;
    new_count INT;
    reactor_name TEXT;
BEGIN
    -- reactions が NULL → NULL の場合は何もしない
    IF NEW.reactions IS NULL THEN
        RETURN NEW;
    END IF;

    -- 各リアクションタイプをチェック
    FOR reaction_type IN SELECT jsonb_object_keys(NEW.reactions::jsonb)
    LOOP
        -- 新旧のカウントを比較
        new_count := COALESCE((NEW.reactions::jsonb ->> reaction_type)::INT, 0);
        old_count := COALESCE((OLD.reactions::jsonb ->> reaction_type)::INT, 0);

        -- カウントが増加した場合のみ通知を作成
        IF new_count > old_count THEN
            -- 投稿者自身への通知は作らない（自分で自分にリアクションした場合）
            -- ※ 現在のセッションユーザーが投稿者と同じ場合はスキップ
            IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
                -- リアクションした人の名前を取得（usersテーブルがあれば）
                SELECT COALESCE(
                    (SELECT name FROM users WHERE id = auth.uid()),
                    (SELECT email FROM auth.users WHERE id = auth.uid()),
                    '誰か'
                ) INTO reactor_name;

                INSERT INTO notifications (
                    user_id,
                    type,
                    message,
                    from_user_id,
                    from_user_name,
                    related_log_id,
                    is_read
                ) VALUES (
                    NEW.user_id,                                          -- 通知先: 投稿の持ち主
                    'reaction',                                           -- 通知タイプ
                    CASE reaction_type
                        WHEN 'fire'    THEN 'あなたの投稿に🔥をつけました'
                        WHEN 'sparkle' THEN 'あなたの投稿に✨をつけました'
                        WHEN 'heart'   THEN 'あなたの投稿に❤️をつけました'
                        WHEN 'muscle'  THEN 'あなたの投稿に💪をつけました'
                        ELSE 'あなたの投稿にリアクションしました'
                    END,
                    auth.uid(),                                           -- リアクションした人
                    reactor_name,                                         -- リアクションした人の名前
                    NEW.id,                                               -- 対象の process_log
                    FALSE                                                 -- 未読
                );
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

-- 2. トリガーの定義
-- process_logs の reactions カラムが更新された時に発火
DROP TRIGGER IF EXISTS on_reaction_updated ON process_logs;
CREATE TRIGGER on_reaction_updated
    AFTER UPDATE OF reactions ON process_logs
    FOR EACH ROW
    WHEN (OLD.reactions IS DISTINCT FROM NEW.reactions)
    EXECUTE FUNCTION handle_new_reaction_notification();
