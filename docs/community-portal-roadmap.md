# South York Roleplay Community Portal — implementation plan

## Confirmed product decisions
- Preserve South York Roleplay branding.
- Use a modern dark navy / charcoal dashboard with restrained blue accents.
- Discord login is available to ordinary community members, not only staff.
- Accepted whitelist applications grant a configured Discord role.
- Staff permissions are managed inside the panel, not inferred from Discord roles.

## Architecture
- Existing Next.js 15 App Router + OpenNext Cloudflare Workers deployment stays in place.
- Cloudflare D1 is the proposed persistent store for portal users, panel roles/permissions, applications, application form definitions, tickets, notices and audit events.
- Discord bot integration remains responsible for assigning the configured whitelist role after an authorised application approval.
- Every staff operation must be authorised in server-side route handlers / server components. Hiding navigation links is not an access-control boundary.

## Delivery phases
1. Foundation and visual refresh — modern landing page, responsive staff shell, member portal entry point, shared design tokens.
2. Identity and permissions — persist portal profiles, create panel-managed staff roles and granular permissions, seed initial owner/admin safely, remove Discord permission-based staff checks after migration.
3. Applications and whitelist — configurable forms, applicant submission and status tracking, reviewer queue, internal notes, decisions, Discord whitelist-role assignment and audit trail.
4. Support desk and notices — player tickets, staff assignment, replies, status/priority, notices and announcement editor.
5. Community operations — reports, ban appeals, department recruitment/transfers, character profiles, events, staff leave/training and analytics.

## Initial data model proposal
- portal_users: Discord user ID, display name, avatar, created/updated timestamps.
- panel_roles, panel_permissions, panel_role_permissions, portal_user_roles: panel-managed access.
- application_forms, application_questions, applications, application_answers, application_reviews.
- tickets, ticket_messages, ticket_assignments.
- notices, audit_logs.
- guild_settings: whitelist role ID and operational configuration.

## Important safety and migration notes
- Do not store Discord bot tokens, OAuth secrets or session secrets in source control or SQL migrations.
- Keep the current admin access path until the first panel-owner account and permission tables are deployed and tested. Then migrate authorisation deliberately; do not accidentally lock out all administrators.
- Application approval should record the decision first and only then attempt Discord role assignment. Failures must be visible and retryable; never silently mark a player whitelisted if Discord role assignment failed.
- Use D1 migrations committed to the repository and apply them separately to preview/production databases.
- No FiveM server whitelist integration is included in the current scope; the selected approval action is a Discord role grant.