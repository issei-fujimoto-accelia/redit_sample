-- 初期スキーマ（docs/ARCHITECTURE.md §4.2〜4.3）

CREATE TABLE communities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  author_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  community_id INTEGER NOT NULL REFERENCES communities(id),
  title TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  last_posted_at TEXT NOT NULL,
  post_count INTEGER NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES threads(id),
  is_opening INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_threads_last_posted ON threads (last_posted_at DESC, id DESC);
CREATE INDEX idx_threads_community_last_posted ON threads (community_id, last_posted_at DESC, id DESC);
CREATE INDEX idx_posts_thread_created ON posts (thread_id, created_at, id);
CREATE UNIQUE INDEX idx_posts_opening ON posts (thread_id) WHERE is_opening = 1;
