-- Whitelist controls, multiple Discord roles and unique player callsigns.
ALTER TABLE panel_users ADD COLUMN callsign TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_panel_users_callsign
  ON panel_users(callsign) WHERE callsign IS NOT NULL;

ALTER TABLE application_types ADD COLUMN discord_role_ids_json TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO system_settings (key, value)
VALUES ('whitelist_applications_enabled', '1');

UPDATE application_types
SET form_schema_json = '[{"id":"why_join","label":"Why would you like to join South York Roleplay?","type":"textarea","required":true},{"id":"rp_name","label":"What is you roleplay name?","type":"text","required":true},{"id":"anything_else","label":"Is there anything else you would like to tell us?","type":"textarea","required":false}]'
WHERE id = 'community-whitelist';
