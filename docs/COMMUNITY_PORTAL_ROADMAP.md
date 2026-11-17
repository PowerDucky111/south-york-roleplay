# South York Roleplay Community Portal

## Confirmed product decisions

- Existing South York Roleplay branding stays.
- The interface direction is a modern dark navy dashboard with restrained blue accents.
- Discord OAuth is the identity provider.
- Players use the community portal; staff tools are separate and permission-controlled.
- Staff permissions will be managed in the panel, not inferred from Discord roles.
- Approving a whitelist application grants a configured Discord role. FiveM server whitelist integration is not part of this scope.

## Current implementation branch

Branch: `redesign/community-portal-foundation`

The first foundation pass:
- Refreshes the landing page and shared navigation.
- Adds a player portal overview, applications page and support-ticket page.
- Allows a Discord account that is a member of the configured guild to complete sign-in and reach the player portal.
- Keeps the existing staff CMS routes in place.
- Adds the first D1 schema migration for users, panel roles/permissions, applications, tickets, announcements and audit logs.

The applications and tickets screens are currently structural UI only. They do not yet save records or send Discord role updates. Do not advertise them as operational until the database-backed workflows are implemented.

## Data model

Cloudflare D1 is the intended persistent store. Apply `migrations/0001_initial_schema.sql` after creating the production database and binding it to the Worker as `DB`.

The schema deliberately separates:
- Discord identity from panel permissions.
- Player-owned application and ticket records from staff review/assignment.
- Public ticket messages from internal staff notes.
- Application approval from Discord whitelist-role assignment.
- Staff actions from the data they modify through audit logs.

## Permission model

The panel will enforce permissions on the server for every page and API route. Hiding a navigation link is not an access-control boundary.

Initial permission keys include:
- `portal.view`
- `applications.create`, `applications.view_own`, `applications.review_department`, `applications.manage`
- `tickets.create`, `tickets.view_own`, `tickets.view_queue`, `tickets.reply`, `tickets.assign`, `tickets.manage`
- `users.view`, `users.moderate`, `users.manage`
- `announcements.manage`, `discord.moderate`
- `permissions.manage`, `system.manage`

The existing `ADMIN_DISCORD_IDS` and Discord Administrator/Manage Server checks are retained temporarily for the current staff CMS. They must be replaced with panel role assignments before the panel-managed permission system is considered complete.

## Planned delivery order

1. Visual foundation and player portal shell.
2. Create and bind D1; add database access helpers and panel permission checks.
3. Application form builder, player submissions, staff review queue and decision history.
4. On approval, grant the configured Discord role using the existing bot integration; log success/failure and support manual retry.
5. Player and staff ticket workflows, private staff notes, assignment, priorities and transcripts.
6. Panel-managed staff roles and permissions, with server-side checks on all staff routes and APIs.
7. Noticeboard editor, audit log viewer, department tools, ban appeals, reports and events.

## Deployment notes

The project currently uses Next.js with the OpenNext Cloudflare adapter. Keep the existing deployment pipeline while implementing this redesign. Cloudflare's current guidance recommends evaluating vinext for new projects, but this is an existing working OpenNext deployment; do not migrate deployment tooling as part of the visual redesign without a separate compatibility review.

Before applying a D1 migration, verify the selected database and environment. Use a separate staging database for testing if available.
