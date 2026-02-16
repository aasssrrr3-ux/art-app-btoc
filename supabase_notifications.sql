-- notifications テーブル
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'reaction', -- 'reaction', 'follow', 'comment'
    message TEXT NOT NULL,
    from_user_id UUID REFERENCES auth.users(id),
    from_user_name TEXT,
    related_log_id UUID REFERENCES process_logs(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Realtime有効化（既に追加済みならスキップ）
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- 既に追加済み
END;
$$;

-- ダミー通知データ（テスト用・user_idは適宜変更）
-- INSERT INTO notifications (user_id, type, message, from_user_name)
-- VALUES
--   ('YOUR_USER_ID', 'reaction', 'あなたの投稿に🔥をつけました', '初心者A'),
--   ('YOUR_USER_ID', 'reaction', 'あなたの投稿に✨をつけました', '先輩B');
