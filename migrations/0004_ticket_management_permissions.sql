-- Ensure management roles can access and manage the support queue.
INSERT OR IGNORE INTO panel_permissions (role_id, permission_key) VALUES
  ('administrator', 'tickets.view_queue'),
  ('administrator', 'tickets.assign'),
  ('administrator', 'tickets.reply'),
  ('senior-management', 'tickets.view_queue'),
  ('senior-management', 'tickets.assign'),
  ('senior-management', 'tickets.reply');
