# automation_pw_ts_demoblaze

Production-ready Playwright (TypeScript) test suite for [demoblaze.com](https://www.demoblaze.com) — built to match the conventions of the `automation_playwright_ts` reference project.

---

## Project structure

```
automation_pw_ts_demoblaze/
├── .github/
│   └── workflows/
│       └── e2e.yml              # GitHub Actions CI pipeline
│
├── pages/                       # Page Object Models
│   ├── base-page.ts             # Shared helpers (click, fill, getText, …)
│   ├── login-page.ts            # Bootstrap login modal
│   ├── signup-page.ts           # Bootstrap signup modal
│   ├── home-page.ts             # Product grid, category filter, pagination
│   ├── product-page.ts          # Product detail, add-to-cart
│   ├── cart-page.ts             # Cart table, totals, delete items
│   ├── checkout-page.ts         # Order modal + SweetAlert confirmation
│   └── index.ts                 # Barrel export
│
├── tests/
│   ├── api/
│   │   ├── helpers.ts           # Shared API constants + data loaders
│   │   ├── auth-api.spec.ts     # /login, /signup, /check
│   │   ├── product-api.spec.ts  # /entries, /bycat, /view
│   │   └── cart-api.spec.ts     # /addtocart, /viewcart, /deletecart, /placeorder
│   ├── e2e/
│   │   └── purchase-flow.spec.ts  # Full user journeys E2E-001 → E2E-006
│   └── ui/
│       ├── auth.spec.ts         # AUTH-001 → AUTH-015
│       ├── product.spec.ts      # PROD-001 → PROD-014
│       ├── cart.spec.ts         # CART-001 → CART-010
│       └── checkout.spec.ts     # CHK-001  → CHK-010
│
├── test_data/
│   └── test-data.json           # Products, users, checkout data, API config
│
├── utils/
│   └── api-utils.ts             # Typed Demoblaze API client
│
├── fixtures.ts                  # Custom test fixtures (page objects)
├── global-setup.ts              # Cleans stale artifacts before each run
├── playwright.config.ts         # Multi-browser config, reporters
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── .prettierrc
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
cd automation_pw_ts_demoblaze
npm install
npx playwright install --with-deps
```

### Configure credentials

```bash
cp .env.example .env
```

Edit `.env` with your Demoblaze account details (create a free account at demoblaze.com if needed):

```
TEST_USERNAME=your_username
TEST_PASSWORD=your_password
CHECKOUT_NAME=John Doe
CHECKOUT_COUNTRY=United Kingdom
CHECKOUT_CITY=London
CHECKOUT_CARD=4111111111111111
CHECKOUT_MONTH=12
CHECKOUT_YEAR=2027
```

> Tests that require login are automatically skipped when credentials are not set — safe to run without an account for product/API tests.
>
> Auth credentials are considered configured only when both TEST_USERNAME and TEST_PASSWORD are non-empty.
> Empty secrets in CI now fail open (warning + skip) instead of producing misleading auth failures.

---

## Running tests

```bash
# All tests (all browsers in parallel)
npm test

# By suite
npm run test:ui
npm run test:api
npm run test:e2e

# Smoke tests only
npm run test:smoke

# Single browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Headed mode (watch the browser)
npm run test:headed

# HTML report
npm run report
```

---

## Test coverage

| Suite       | File                              | Tests                                           |
| ----------- | --------------------------------- | ----------------------------------------------- |
| Auth UI     | `tests/ui/auth.spec.ts`           | AUTH-001 → AUTH-015                             |
| Product UI  | `tests/ui/product.spec.ts`        | PROD-001 → PROD-014                             |
| Cart UI     | `tests/ui/cart.spec.ts`           | CART-001 → CART-010                             |
| Checkout UI | `tests/ui/checkout.spec.ts`       | CHK-001 → CHK-010                               |
| Auth API    | `tests/api/auth-api.spec.ts`      | /login, /signup, /check                         |
| Product API | `tests/api/product-api.spec.ts`   | /entries, /bycat, /view                         |
| Cart API    | `tests/api/cart-api.spec.ts`      | /addtocart, /viewcart, /deletecart, /placeorder |
| E2E         | `tests/e2e/purchase-flow.spec.ts` | E2E-001 → E2E-006                               |

---

## Demoblaze API reference

All endpoints are at `https://api.demoblaze.com` and use `POST` with a JSON body.
The API always returns HTTP `200` — errors are signalled in the response body.

| Endpoint      | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| `/signup`     | Register a new user                                          |
| `/login`      | Authenticate → returns `"Auth_token: <token>"`               |
| `/check`      | Validate a session token                                     |
| `/entries`    | List all products                                            |
| `/bycat`      | Filter products by category (`phone`, `notebook`, `monitor`) |
| `/view`       | Get a single product by `id`                                 |
| `/addtocart`  | Add an item to the user's cart                               |
| `/viewcart`   | Get cart contents for a user                                 |
| `/deletecart` | Remove a cart entry by entry `id`                            |
| `/placeorder` | Submit an order                                              |

---

## CI/CD

The `.github/workflows/e2e.yml` pipeline runs on every push, pull request, and daily at 06:00 UTC.
Add secrets (`TEST_USERNAME`, `TEST_PASSWORD`, etc.) in your repository settings.

Pipeline jobs now include:

- Quality gate: `npm run quality` (typecheck, lint, format check) before test fan-out.
- Credentials preflight warning: emits an explicit warning when auth secrets are missing.
- Sharded browser execution with report artifact upload and merged report generation.
