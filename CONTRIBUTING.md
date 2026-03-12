# Contributing Guide

Thank you for contributing to the **automation_pw_ts_demoblaze** project! This guide explains our standards, processes, and best practices.

## Code of Conduct

Please follow our [Community Guidelines](CODE_OF_CONDUCT.md) in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Playwright**: Installed via `npm install`

### Setup

```bash
# Clone the repository
git clone https://github.com/thompsonoloko-droid/automation_pw_ts_demoblaze.git
cd automation_pw_ts_demoblaze

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Create environment file
cp .env.example .env
# Edit .env with your test credentials
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use descriptive branch names:

- `feature/`: New features or enhancements
- `fix/`: Bug fixes
- `test/`: New tests or test improvements
- `docs/`: Documentation updates
- `chore/`: Maintenance, dependencies, tooling

### 2. Code Quality Checks

Before committing, run the quality suite:

```bash
# Run all checks (recommended)
npm run quality

# Individual checks:
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint validation
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run format:check # Verify Prettier compliance
```

### 3. Testing

#### Run All Tests

```bash
npm test

# By category:
npm test -- --grep "@ui"           # UI tests only
npm test -- --grep "@api"          # API tests only
npm test -- --grep "@e2e"          # E2E tests only
npm test -- --grep "@smoke"        # Smoke tests only

# Single file:
npm test -- tests/ui/auth.spec.ts

# With specific browser:
npm test -- --project=chromium
npm test -- --project=firefox
npm test -- --project=webkit
```

#### Test Markers (Tags)

Organize tests using the following markers:

| Marker        | Purpose               | Example                                    |
| ------------- | --------------------- | ------------------------------------------ |
| `@smoke`      | Critical path tests   | `test("@smoke", async () => { ... })`      |
| `@regression` | Full regression suite | `test("@regression", async () => { ... })` |
| `@ui`         | UI/visual tests       | `test.describe("@ui", () => { ... })`      |
| `@api`        | API endpoint tests    | Within `api/` directory                    |
| `@e2e`        | End-to-end workflows  | Full user journeys                         |
| `@mobile`     | Mobile device tests   | Device-specific scenarios                  |
| `@slow`       | Long-running tests    | Performance/load tests                     |
| `@skip_ci`    | Skip in CI/CD         | Local debugging only                       |

### 4. Page Objects & Test Patterns

#### Creating a New Page Object

All page objects **must** extend `BasePage`:

```typescript
// pages/my-page.ts
import { Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class MyPage extends BasePage {
  // Locators - use ALL_CAPS with descriptive names
  readonly BUTTON_SAVE = "button[data-testid='save-btn']";
  readonly INPUT_EMAIL = "input[placeholder='Email']";
  readonly ERROR_MESSAGE = ".error-alert";

  constructor(page: Page) {
    super(page);
  }

  // Action methods - one per user action
  async fillEmail(email: string): Promise<void> {
    await this.fill(this.INPUT_EMAIL, email);
  }

  async clickSave(): Promise<void> {
    await this.click(this.BUTTON_SAVE);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.ERROR_MESSAGE);
  }
}
```

#### Writing Tests

Follow these patterns:

```typescript
import { test, expect } from "../../fixtures";
import { MyPage } from "../../pages/my-page";

test.describe("Feature Group @smoke", () => {
  // Setup - runs before each test
  test.beforeEach(async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.navigateTo();
  });

  test("TEST-001 | Should do something specific", async ({ page }) => {
    const myPage = new MyPage(page);

    // Arrange
    await myPage.fillEmail("test@example.com");

    // Act
    await myPage.clickSave();

    // Assert - one primary assertion per test
    const message = await myPage.getErrorMessage();
    expect(message).toContain("Success");
  });

  test("TEST-002 | Should handle error states", async ({ page }) => {
    const myPage = new MyPage(page);

    await myPage.fillEmail("invalid-email");
    await myPage.clickSave();

    const error = await myPage.getErrorMessage();
    expect(error).toContain("Invalid email");
  });
});
```

#### Test Naming Convention

Use descriptive test names with IDs:

```
Test-ID | Clear description of what is being tested
```

Examples:

- `AUTH-001 | User can login with valid credentials`
- `CART-005 | Product quantity updates correctly in checkout`
- `CHK-009 | Invalid card number shows validation error`

### 5. Adding Test Data

**Never hardcode test data!** Add to `test_data/test-data.json` or `.env`:

**Non-sensitive data** (`test_data/test-data.json`):

```json
{
  "products": {
    "phone": { "name": "Samsung galaxy s6", "price": 360 }
  },
  "api": {
    "timeout_ms": 5000
  }
}
```

**Sensitive data** (`.env` - git-ignored):

```bash
TEST_USERNAME=your_test_username
TEST_PASSWORD=your_secure_password
CHECKOUT_NAME=John Doe
CHECKOUT_CARD=4111111111111111
```

### 6. API Testing

Use the `ApiUtils` fixture for API tests:

```typescript
test("POST /login returns auth token", async ({ apiUtils }) => {
  const response = await apiUtils.post("/login", {
    username: "testuser",
    password: "password123",
  });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("userId");
});
```

### 7. Debugging

#### Enable Verbose Logging

```bash
DEBUG=pw:api,pw:browser npm test
```

#### Inspector Mode

```bash
npx playwright test --debug
```

#### View Traces & Screenshots

Traces and screenshots are saved in `reports/` on failures:

- `reports/screenshots/` - Failure screenshots
- `test-results/` - Playwright traces and videos

Open HTML report:

```bash
npx playwright show-report
```

## Commit Guidelines

Write clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature or enhancement
- `fix`: Bug fix
- `test`: Test additions or fixes
- `docs`: Documentation changes
- `refactor`: Code refactoring without behavior change
- `perf`: Performance improvement
- `chore`: Maintenance, dependencies, tooling
- `ci`: CI/CD changes

### Examples

```bash
git commit -m "feat: add login page object with email validation"
git commit -m "fix: handle authentication modal timeout"
git commit -m "test: add comprehensive cart checkout tests"
git commit -m "docs: add TypeScript path alias configuration"
```

## Submitting a Pull Request

1. **Push your branch** to GitHub

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** with:
   - Clear title: Use commit message format
   - Description of changes
   - Link issues if applicable (e.g., `Closes #123`)
   - Screenshots/videos if UI changes

3. **PR Checklist**
   - ✅ All tests pass (`npm test`)
   - ✅ Code quality passes (`npm run quality`)
   - ✅ No hardcoded test data
   - ✅ No sensitive information in commits
   - ✅ Documentation updated if needed
   - ✅ Branch is up-to-date with main

4. **Code Review Process**
   - Maintainers will review your PR
   - Address feedback and update the PR
   - Once approved, your PR will be merged

## TypeScript / ESLint Standards

### TypeScript

- ✅ Use strict mode (enabled by default)
- ✅ Add type hints to all functions and parameters
- ✅ Use interfaces for complex types
- ✅ Avoid `any` type (use explicit types instead)

```typescript
// ✅ Good
function getProductPrice(productId: string): Promise<number> {
  return apiUtils.get<{ price: number }>(`/products/${productId}`);
}

// ❌ Bad
function getProductPrice(productId) {
  return apiUtils.get(`/products/${productId}`);
}
```

### ESLint Rules

Key rules enforced:

- **No unused variables** - Clean code (with `_` prefix exception)
- **No empty blocks** - Intentional catch blocks allowed
- **No explicit `any`** - Use proper typing
- **Semicolons required** - Consistent with Prettier
- **Double quotes** - Default string style

Auto-fix violations:

```bash
npm run lint:fix
npx prettier --write .
```

## Performance & Accessibility

### Performance Testing

Add performance assertions to critical tests:

```typescript
test("should load homepage within threshold", async ({ perfUtils }) => {
  const metrics = await perfUtils.getPageMetrics();
  expect(metrics.pageLoadTime).toBeLessThan(5000);
  expect(metrics.lcp).toBeLessThan(2500);
});
```

### Accessibility Testing

Use the `a11yUtils` fixture:

```typescript
test("homepage should be WCAG 2.1 AA compliant", async ({ a11yUtils }) => {
  const results = await a11yUtils.checkPage();

  expect(results.criticalViolations).toBe(0);
  expect(results.seriousViolations).toBe(0);
});
```

## Documentation

If your changes affect functionality, update relevant docs:

- `README.md` - Major changes to setup/usage
- Inline code comments - Complex logic
- JSDoc comments - Public functions

```typescript
/**
 * Fills a form field with the provided text.
 *
 * @param selector - CSS selector of the input element
 * @param text - Text to enter
 * @throws {Error} If element is not found or not interactive
 *
 * @example
 * await basePage.fill("input[name='email']", "user@example.com");
 */
async fill(selector: string, text: string): Promise<void> {
  // implementation
}
```

## Resource Links

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Demoblaze Website](https://www.demoblaze.com)
- [ESLint Rules](https://eslint.org/docs/rules)
- [Prettier Formatting](https://prettier.io/docs)

## Questions?

- Check [README.md](README.md) for general project info
- Review existing tests in `tests/` for examples
- Look for similar page objects in `pages/`
- Open a GitHub Issue for questions

---

**Thank you for contributing to quality test automation!** 🎉
