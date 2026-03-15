# @echo/cli

Administration CLI for user management.

This tool runs better-auth **in-process** (no HTTP server) and connects directly to the database. It is a separate deployment artifact and must never be shipped alongside the web app or API.

## Setup

### Prerequisites

- Node.js >= 20
- Access to the PostgreSQL database
- An existing admin user account in the database

### Environment variables

Create a `.env` file in `apps/cli/` (or export the variables):

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=echo
DATABASE_PASSWORD=echo
DATABASE_NAME=echo
AUTH_SECRET=<same secret used by the API>
CLI_ADMIN_EMAIL=admin@example.com
CLI_ADMIN_PASSWORD=<admin password>
```

> Admin credentials are read from env vars, never from CLI flags, to prevent shell history leakage.

## Usage

From the monorepo root:

```sh
pnpm cli <command> [options]
```

Or from `apps/cli/`:

```sh
pnpm dev -- <command> [options]
```

### Database

```sh
# Run pending migrations
pnpm cli db migrate
```

### User management

```sh
# Create a user
pnpm cli user create --email user@example.com --name "Jane Doe" --password secret123
pnpm cli user create --email admin@example.com --name "Admin" --password secret123 --role admin

# List users
pnpm cli user list
pnpm cli user list --search jane --limit 10

# Get user details
pnpm cli user get <userId>

# Update a user
pnpm cli user update <userId> --name "New Name"
pnpm cli user update <userId> --email new@example.com

# Delete a user (requires --confirm)
pnpm cli user delete <userId> --confirm

# Set role (requires --confirm)
pnpm cli user set-role <userId> admin --confirm
pnpm cli user set-role <userId> user --confirm

# Ban / unban (ban requires --confirm)
pnpm cli user ban <userId> --confirm
pnpm cli user ban <userId> --confirm --reason "Policy violation" --expires 2026-04-01
pnpm cli user unban <userId>

# Provision first admin user
pnpm cli user create-first-user
```

### Session management

```sh
# List active sessions for a user
pnpm cli session list <userId>

# Revoke all sessions for a user
pnpm cli session revoke <userId>
```

## Security model

- **Admin authentication required** — the CLI authenticates via `CLI_ADMIN_EMAIL` / `CLI_ADMIN_PASSWORD` at startup.
- **Confirmation required** — destructive commands (`delete`, `ban`, `set-role`) require the `--confirm` flag.
- **Separate deployment** — this tool should be run with restricted env vars provided via a secrets manager.

## Development

```sh
# Run tests
pnpm --filter @echo/cli test

# Typecheck
pnpm --filter @echo/cli typecheck

# Build
pnpm --filter @echo/cli build
```
