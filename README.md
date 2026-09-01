# Full-Stack Expense Manager

Personal expense tracker with a typed Python + React + PureScript stack. Track, categorize, and summarize spending with a FastAPI backend and a Vite React frontend, fully tested (unit, integration, E2E) and CI-gated.

![CI](https://github.com/anomalyco/full-stack-expense-manager/actions/workflows/ci.yml/badge.svg)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![Node 22](https://img.shields.io/badge/node-22-green)](https://nodejs.org/)
[![PureScript 0.15.16](https://img.shields.io/badge/purescript-0.15.16-violet)](https://www.purescript.org/)

---

## Features

- **CRUD expenses**: Create, read, update, delete with validation (`title 1-255`, `description ≤500`, `amount >0`, 8 categories: `food | transport | entertainment | utilities | healthcare | education | shopping | other`)
- **List with pagination & filtering**: `skip/limit (1-500)` + `?category=food` + client-side search (title/description)
- **Dashboard**: Recent 5 expenses, total / count / average stats
- **Summary**: Total spending + per-category aggregation with bar visualization
- **Validation & errors**: Pydantic 422 + 404 handling, client-side checks, network error states

---

## Architecture & Tech Stack

```
full-stack-expense-manager/
├── expense_tracker/          # Backend (Python)
│   ├── app/
│   │   ├── main.py           # FastAPI factory, CORS, lifespan (create_all)
│   │   ├── database.py       # SQLAlchemy engine (sqlite:///./expenses.db), SessionLocal, get_db
│   │   ├── models.py         # Expense ORM (id, title, description, amount, category, timestamps)
│   │   ├── schemas.py        # Pydantic Category StrEnum + ExpenseCreate/Update/Response DTOs
│   │   ├── crud.py           # DB ops (create, get, list, update, delete, summary, by_category)
│   │   └── routes.py         # APIRouter: POST/GET/PUT/DELETE /expenses, GET /summary, /summary/by-category
│   └── tests/                # pytest + httpx TestClient (with test_expenses.db isolation)
└── expense-tracker-ui/       # Frontend (Vite + React + PureScript)
    ├── src/
    │   ├── main.tsx / App.tsx          # Entry + BrowserRouter (Layout + 5 routes)
    │   ├── pages/                      # Dashboard, ExpenseList, ExpenseForm, Summary
    │   ├── components/                 # Layout, ExpenseItem, StatCard
    │   ├── purs/App/                   # PureScript: Types.purs (Category ADT), BusinessLogic.purs (filter/search/total/categorize/stats), Api.purs (Affjax)
    │   └── __tests__/ / components/__tests__/ / pages/__tests__/ # Vitest + RTL
    ├── e2e/                            # Playwright E2E (real backend via webServer)
    ├── test/Main.purs                  # PureScript spec suite
    ├── vite.config.ts                  # vite + vitest (jsdom, v8 coverage)
    ├── playwright.config.ts            # chromium, webServer (vite 5173 + uvicorn 8000)
    ├── spago.yaml                      # PureScript dependencies + test config
    └── package.json / tsconfig.*.json
```

**Backend:** `Python 3.11`, `FastAPI ≥0.115`, `Uvicorn ≥0.32`, `SQLAlchemy ≥2.0`, `Pydantic ≥2.0`, `SQLite`, `Ruff`, `pytest` + `httpx`
**Frontend:** `Vite 8`, `React 19`, `React Router 7`, `TypeScript 6`, `PureScript 0.15.16` + `Spago 1.0.4` (`aff`, `affjax-web`, `argonaut`, `spec`), `Vitest 4`, `React Testing Library 16`, `jsdom 30`, `Playwright 1.62`, `Oxlint`

**Data Flow:** `React state (useState) → fetch(http://127.0.0.1:8000) → FastAPI route (Depends(get_db)) → crud → SQLAlchemy → SQLite → Pydantic JSON → setState → re-render`

---

## Getting Started

### Prerequisites
- Python 3.11, Node 22, npm

### Backend
```bash
cd expense_tracker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# dev server (http://127.0.0.1:8000, docs at /docs)
uvicorn app.main:app --reload

# or via factory
python -c "import uvicorn; uvicorn.run('app.main:app', host='127.0.0.1', port=8000, reload=True)"
```

### Frontend
```bash
cd expense-tracker-ui
npm ci
npx spago build          # compile PureScript to output/
npm run dev              # http://localhost:5173 (proxies to backend 8000 via CORS)

npm run build            # tsc -b && vite build → dist/
npm run preview          # preview production build
```

CORS is whitelisted for `http://localhost:5173` and `http://127.0.0.1:5173` in `app/main.py:23`.

---

## API Endpoints

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| `POST` | `/expenses` | Create expense | `201` `ExpenseResponse` |
| `GET` | `/expenses?skip=0&limit=100&category=food` | List + pagination + optional category filter | `200` `{expenses, total}` |
| `GET` | `/expenses/{id}` | Get single | `200` / `404` |
| `PUT` | `/expenses/{id}` | Partial update (`exclude_unset`) | `200` / `404` |
| `DELETE` | `/expenses/{id}` | Delete | `204` / `404` |
| `GET` | `/summary` | Total amount + count | `200` `{total_amount, total_count}` |
| `GET` | `/summary/by-category` | Grouped by category | `200` `[{category, total, count}]` |
| `GET` | `/openapi.json` / `/docs` | OpenAPI | `200` |

Example:
```bash
curl -X POST http://127.0.0.1:8000/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":50.75,"category":"food","description":"Weekly"}'
```

---

## Testing

### Backend - Unit & Integration (pytest)
```bash
cd expense_tracker
.venv/bin/python -m pytest -v          # 30 tests (20 unit + 10 integration) → test_expenses.db isolated via dependency_overrides
.venv/bin/python -m pytest --cov=app --cov-report=term-missing --cov-report=html  # 86% coverage → htmlcov/index.html
```
- `tests/test_expenses.py` – CRUD, validation (422 for amount≤0, empty title, invalid category), pagination, 404s, summary
- `tests/test_integration.py` – direct `crud` DB roundtrip, category `value` handling, full lifecycle via `TestClient`, `CORS/OpenAPI`

### Frontend - Unit & Integration (Vitest + PureScript spec)
```bash
cd expense-tracker-ui
npm run test:run                        # Vitest 8 files 44 tests (jsdom)
npx spago test                          # PureScript spec 26 tests (BusinessLogic + Types)
npm run test:coverage                   # v8 → 93.47% stmts → coverage/index.html
```
- `src/components/__tests__/` – `ExpenseItem`, `StatCard`, `Layout` (NavLink active)
- `src/pages/__tests__/` – `Dashboard` (stats, recent, empty, fetch failure, delete), `ExpenseList` (loading, search, category via `?category=`, pagination, confirm), `ExpenseForm` (validation, POST/PUT, network error, cancel), `Summary` (bars `width: total/maxTotal*100%`)
- `src/__tests__/app.integration.test.tsx` – routing `MemoryRouter` + mocked `fetch` integration
- `test/Main.purs` – PureScript `formatCurrency/formatDate/filter/search/calculate/categorize/getExpenseStats` + `Category`

### E2E (Playwright - real backend)
```bash
cd expense-tracker-ui
npx playwright install --with-deps chromium
npx playwright test                     # 9 tests chromium, webServer starts vite 5173 + uvicorn 8000, helpers clear DB
npx playwright test --ui                # UI mode
npx playwright show-report
```
- `e2e/navigation.spec.ts` – layout + active link
- `e2e/expense-crud.spec.ts` – create→list→dashboard, client validation, edit (seed via API), delete (confirm dialog), filter/search, pagination (12 items)
- `e2e/summary.spec.ts` – empty → 3 via API → `$35.00` + bars
- `e2e/helpers.ts` – `clearAllExpenses` via `APIRequestContext` (`GET /expenses?limit=500` → `DELETE` each) before each test, `workers:1` to avoid DB race.

### Coverage Summary (latest)
- Backend: `148 stmts, 21 miss, 86%` (`crud 98%`, `database 69%`, `main 0%` lifespan/CORS)
- Frontend: `93.47% stmts, 90.9% branch, 84.61% funcs` (components `100%`, pages `93.23%`)
- Reports gitignored: `htmlcov/`, `.coverage*`, `coverage.xml`, `*.lcov`, `coverage/`, `playwright-report/`, `test-results/`

---

## Code Quality

```bash
# backend
cd expense_tracker && ruff check app tests

# frontend
cd expense-tracker-ui && npm run lint  # oxlint
```

---

## CI/CD

`.github/workflows/ci.yml` runs on `push` + `pull_request` to `main` (concurrency cancel):

- **backend** `ubuntu-latest` `Python 3.11` `cache:pip` → `pip install -r requirements.txt` → `ruff` → `pytest -v`
- **frontend** `Node 22` `cache:npm` → `npm ci` → `oxlint` → `spago build` → `spago test` → `vitest run` → `vite build`
- **e2e** `Python 3.11 + Node 22` → `pip + npm ci` → `playwright install --with-deps chromium` → `spago build` → `playwright test` (uploads `playwright-report` on failure)

Enable branch protection: Settings → Branches → Add rule `main` → Require status checks → `Backend (pytest)`, `Frontend (vitest + spago + build)`, `E2E (Playwright + real backend)`.

---

## Project Structure

```
.
├── expense_tracker/
│   ├── app/{main,database,models,schemas,crud,routes}.py
│   ├── tests/{conftest,test_expenses,test_integration}.py
│   ├── requirements.txt / pyproject.toml (ruff + pytest)
│   └── expenses.db (sqlite, gitignored)
├── expense-tracker-ui/
│   ├── src/{main,App}.tsx
│   ├── src/pages/{Dashboard,ExpenseList,ExpenseForm,Summary}.tsx
│   ├── src/components/{Layout,ExpenseItem,StatCard}.tsx
│   ├── src/purs/App/{Types,BusinessLogic,Api}.purs
│   ├── src/__tests__/ + components/__tests__/ + pages/__tests__/
│   ├── e2e/{helpers,navigation,expense-crud,summary}.spec.ts
│   ├── test/Main.purs
│   ├── playwright.config.ts / vite.config.ts (vitest jsdom + v8 coverage)
│   └── spago.yaml / package.json
└── .github/workflows/ci.yml
```

---

## Notes

- PureScript `App.BusinessLogic.formatCurrency` fixed to `floor (round)` for correct `show Int` cents.
- `ExpenseForm` uses `noValidate` to allow custom `Title required / Amount >0` messages over native HTML5 validation.
- `Playwright` `fullyParallel:false, workers:1` avoids `expenses.db` race; `clearAllExpenses` ensures isolation.
- SQLite is for dev; swap `DATABASE_URL` in `app/database.py:6` for Postgres in production.
