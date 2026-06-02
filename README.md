# School Management — Frontend

React + Vite + TypeScript + TailwindCSS + shadcn-style components.

## Démarrer

```bash
pnpm install   # ou npm install
pnpm dev
```

Par défaut, le frontend appelle `/api` via le proxy Vite vers `http://localhost:8080` (api-gateway).
Override : `VITE_API_BASE_URL=http://localhost:8080/api pnpm dev`.

## Structure

```
src/
├── components/
│   ├── layout/             Layout principal (sidebar + topbar + RBAC-aware)
│   └── ui/                 Composants atomiques (button, input, card, label)
├── lib/
│   ├── api.ts              Client Axios avec interceptor JWT + refresh
│   └── utils.ts            cn() utility
├── locales/                Traductions i18next (fr, en)
├── pages/
│   ├── auth/               Login, ForgotPassword, ResetPassword
│   ├── config/             Establishment, AcademicYears, Curriculum
│   ├── setup/              Wizard de configuration initiale
│   └── users/              Users, Roles, Audit
├── store/
│   └── auth.ts             Zustand store (token, user, RBAC helpers)
├── App.tsx                 Routing
├── i18n.ts
├── index.css
└── main.tsx
```

## Bootstrap du premier admin

Avant la première connexion (l'application ne fournit pas d'inscription publique), crée le
Super Admin initial via l'endpoint dédié :

```bash
curl -X POST http://localhost:8080/api/v1/auth/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@school.local","fullName":"Admin","password":"ChangeMe123!"}'
```

Cet endpoint est désactivé dès qu'un utilisateur existe.