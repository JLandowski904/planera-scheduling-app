**Purpose**
- Keep production data intact while applying schema/policy changes.
- Use small, idempotent SQL migrations instead of re-running the full schema.

**When To Use Which File**
- `supabase-schema.sql` or `supabase-schema-fixed.sql`: Initial setup only.
- `supabase-migrations/*.sql`: Incremental, non-destructive updates for live apps.

**How To Apply A Migration**
- Open Supabase Dashboard → SQL Editor → paste the migration SQL → Run.
- Safe to run more than once (scripts use IF NOT EXISTS or DO $$ checks).

**Example: Add invitee-accept policy**
- Run `supabase-migrations/2025-10-27_add_invitee_self_member_policy.sql`.

**Authoring Future Migrations**
- Policies
  - Create new: use DO $$ with `pg_policies` check.
  - Update existing: prefer `ALTER POLICY` to change USING/WITH CHECK.
  - Replace: `DROP POLICY IF EXISTS ...; CREATE POLICY ...` (non-destructive).
- Columns
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;`
  - Backfill with a targeted `UPDATE` if needed.
- Indexes
  - `CREATE INDEX IF NOT EXISTS idx_name ON table (col);`
- Functions
  - `CREATE OR REPLACE FUNCTION ...;`

**Operational Tips**
- Never drop tables in production migrations.
- Test changes on a staging project when possible.
- Keep each migration focused and documented in a commit message.

