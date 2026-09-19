# Cricket Sports Management

Full-stack cricket sports platform with player registration, trials, scorecards, and a dynamic admin panel. Built with React.js, Node.js, Express.js, and MongoDB.

This is the sports application described on my resume: player registration, trials, scorecards, and role-based admin management.

## What’s included

| App | Stack | Role |
| --- | --- | --- |
| `client` | React + Vite | Public site and player portal |
| `admin` | React + Vite | Dynamic CMS / admin operations |
| `server` | Node.js + Express + MongoDB | REST API, auth, storage |

### Player & sports workflows

- Player registration and member IDs
- Teams and playing roles
- Trials and scorecard-oriented showcase content
- Gallery, news, videos, and home CMS

### Dynamic admin

- Role-based sub-admins
- Users, teams, playing roles, legal pages, FAQs
- Sliders, carousel sections, contact messages
- Application settings and account security (JWT)

## Run locally

```bash
cp .env.example .env
# fill in MongoDB, JWT secrets, and optional email/storage keys
```

```bash
cd server && npm install && npm run server
cd client && npm install && npm run dev
cd admin && npm install && npm run dev
```

Or with Docker Compose:

```bash
docker compose up --build
```

Default ports: API `5000`, client `3000`, admin `3001`.

Seed a local admin (development only):

```bash
cd server
SEED_ADMIN_PASSWORD='your-strong-password' npm run seed:admin
```

## Security

Secrets live in `.env` (see `.env.example`). Do not commit real API keys, database URIs, or production hosts.
