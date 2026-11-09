-- South York Roleplay community portal
-- Initial schema for Cloudflare D1. Apply only after creating and binding the intended database.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS panel_users (
  discord_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_hash TEXT,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS panel_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS panel_permissions (
  role_id TEXT NOT NULL REFERENCES panel_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS panel_user_roles (
  discord_user_id TEXT NOT NULL REFERENCES panel_users(discord_user_id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES panel_roles(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES panel_users(discord_user_id) ON DELETE SET NULL,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (discord_user_id, role_id)
);

CREATE TABLE IF NOT EXISTS application_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  form_schema_json TEXT NOT NULL DEFAULT '[]',
  discord_role_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  applicant_discord_id TEXT NOT NULL REFERENCES panel_users(discord_user_id),
  application_type_id TEXT NOT NULL REFERENCES application_types(id),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'in_review', 'awaiting_information', 'approved', 'rejected', 'withdrawn')),
  answers_json TEXT NOT NULL DEFAULT '{}',
  assigned_to TEXT REFERENCES panel_users(discord_user_id) ON DELETE SET NULL,
  reviewed_by TEXT REFERENCES panel_users(discord_user_id) ON DELETE SET NULL,
  review_notes TEXT NOT NULL DEFAULT '',
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number INTEGER NOT NULL UNIQUE,
  owner_discord_id TEXT NOT NULL REFERENCES panel_users(discord_user_id),
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_staff', 'awaiting_player', 'resolved', 'closed')),
  assigned_to TEXT REFERENCES panel_users(discord_user_id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_discord_id TEXT NOT NULL REFERENCES panel_users(discord_user_id),
  body TEXT NOT NULL,
  is_internal_note INTEGER NOT NULL DEFAULT 0 CHECK (is_internal_note IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  author_discord_id TEXT REFERENCES panel_users(discord_user_id) ON DELETE SET NULL,
  publish_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_discord_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_discord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_queue ON applications(status, application_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner_discord_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_queue ON tickets(status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, publish_at, is_pinned);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id, created_at DESC);

-- Default role records. Permission assignments will be managed in the panel.
INSERT OR IGNORE INTO panel_roles (id, name, description, is_system) VALUES
  ('player', 'Player', 'Standard community portal access', 1),
  ('support', 'Support Team', 'Manage assigned player support tickets', 1),
  ('moderator', 'Moderator', 'Community moderation tools', 1),
  ('department', 'Department Staff', 'Manage department-specific workflows', 1),
  ('administrator', 'Administrator', 'Full community administration', 1),
  ('senior-management', 'Senior Management', 'System-wide access and permission management', 1);

INSERT OR IGNORE INTO panel_permissions (role_id, permission_key) VALUES
  ('player', 'portal.view'),
  ('player', 'applications.create'),
  ('player', 'applications.view_own'),
  ('player', 'tickets.create'),
  ('player', 'tickets.view_own'),
  ('support', 'portal.view'),
  ('support', 'tickets.view_queue'),
  ('support', 'tickets.reply'),
  ('support', 'tickets.assign'),
  ('moderator', 'portal.view'),
  ('moderator', 'users.view'),
  ('moderator', 'users.moderate'),
  ('department', 'portal.view'),
  ('department', 'applications.review_department'),
  ('department', 'department.manage'),
  ('administrator', 'portal.view'),
  ('administrator', 'admin.access'),
  ('administrator', 'applications.manage'),
  ('administrator', 'tickets.manage'),
  ('administrator', 'users.manage'),
  ('administrator', 'announcements.manage'),
  ('administrator', 'discord.moderate'),
  ('senior-management', 'portal.view'),
  ('senior-management', 'admin.access'),
  ('senior-management', 'permissions.manage'),
  ('senior-management', 'system.manage');
