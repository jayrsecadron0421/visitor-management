# Visitor Management System (Go + PostgreSQL)

A development-ready backend for visitor management using Go (Gin) and PostgreSQL, written for macOS development.

## Features
- Role-based authentication (admin/user)
- Register / Login / Forgot password (6-digit code via email) / Reset password
- Visitor CRUD (users create, admin can delete)
- Time-in / Time-out tracking with duration calculation
- Reports (daily/weekly/monthly) + CSV export
- In-system notifications + email alerts for long visits
- Simple background job for alert generation
- Seed admin via `.env` or env vars

## Prerequisites (macOS)
- Install Go (recommended 1.21+): https://go.dev/dl/
- Homebrew: https://brew.sh/
- PostgreSQL: `brew install postgresql`
- Start Postgres:
  - `brew services start postgresql`
  - Create DB: `createdb visitordb` (or use psql to create user/db)

## Setup (local dev)
1. Clone repo and `cd visitor-management`
2. Copy `.env.example` to `.env` and edit values.
3. `go mod tidy`
4. Run migrations (two options)

### A) Use included SQL migration runner (Go auto-run)
The app runs a simple migration runner at startup that executes `.sql` files. So simply:
