-- Add the first usable application form to the community portal.
-- Safe to run more than once.
INSERT OR IGNORE INTO application_types (
  id,
  name,
  description,
  form_schema_json,
  enabled,
  sort_order
) VALUES (
  'community-whitelist',
  'Community whitelist application',
  'Apply to join South York Roleplay. Please answer each question clearly and honestly.',
  '[{"id":"rp_experience","label":"Tell us about your roleplay experience","type":"textarea","required":true},{"id":"why_join","label":"Why would you like to join South York Roleplay?","type":"textarea","required":true},{"id":"scenario","label":"You attend a road traffic collision as the first responder. What would you do?","type":"textarea","required":true}]',
  1,
  1
);
