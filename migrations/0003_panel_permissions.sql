-- Granular permissions for the South York Roleplay management panel.
-- ADMIN_DISCORD_IDS remains the break-glass project-owner access.
INSERT OR IGNORE INTO panel_permissions (role_id, permission_key) VALUES
('player','portal.view'),('player','applications.create'),('player','applications.view_own'),('player','tickets.create'),('player','tickets.view_own'),
('support','portal.view'),('support','admin.access'),('support','tickets.view_queue'),('support','tickets.reply'),('support','tickets.assign'),
('moderator','portal.view'),('moderator','admin.access'),('moderator','users.view'),('moderator','users.moderate'),('moderator','discord.moderate'),
('department','portal.view'),('department','admin.access'),('department','applications.review_department'),('department','department.manage'),
('administrator','portal.view'),('administrator','admin.access'),('administrator','applications.manage'),('administrator','tickets.manage'),('administrator','users.view'),('administrator','users.manage'),('administrator','announcements.manage'),('administrator','discord.moderate'),
('senior-management','portal.view'),('senior-management','admin.access'),('senior-management','applications.manage'),('senior-management','tickets.manage'),('senior-management','users.view'),('senior-management','users.manage'),('senior-management','announcements.manage'),('senior-management','discord.moderate'),('senior-management','permissions.manage'),('senior-management','system.manage');
