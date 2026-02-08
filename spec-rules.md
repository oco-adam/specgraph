# Spec Writing Rules & Best Practices

> **Canonical reference for writing DLOOP specifications.**
> This document consolidates every rule enforced by agents, Zod schemas, and code validation into one place.

---

## Table of Contents

- [The ONE Rule (Atomicity)](#the-one-rule-atomicity)
- [SPEC.json Structure](#specjson-structure)
- [ID Naming Convention](#id-naming-convention)
- [Writing Expectations](#writing-expectations)
- [Writing Invariants](#writing-invariants)
- [Writing Verification Criteria](#writing-verification-criteria)
- [Character Limits](#character-limits)
- [Red Flags — When to Split](#red-flags--when-to-split)
- [Quality Checklist](#quality-checklist)
- [Examples: Bad vs Good](#examples-bad-vs-good)
- [Enforcement Layers](#enforcement-layers)

---

## The ONE Rule (Atomicity)

Every behavior spec MUST have:

| | Exactly ONE |
|---|---|
| **Trigger** | A single event or action that starts the behavior |
| **Behavior** | A single thing that happens |
| **Outcome** | A single observable result |

If a spec describes more than one of any of these, it must be split into multiple specs.

---

## SPEC.json Structure

```json
{
  "$schema": "./spec.schema.json",
  "version": "1.0.0",
  "features": [
    {
      "id": "AUTH",
      "name": "User Authentication",
      "description": "Login, session management, and logout flows",
      "behaviors": [
        {
          "id": "AUTH-01",
          "name": "Login Form Display",
          "expectation": "Login page renders email and password input fields with a submit button",
          "invariant": "Password field must mask input characters",
          "verification": "npx tsc --noEmit && npm test -- --grep AUTH-01"
        }
      ]
    }
  ]
}
```

All five behavior fields (`id`, `name`, `expectation`, `invariant`, `verification`) are **required**. See `spec.schema.json` for the formal JSON Schema.

---

## ID Naming Convention

### Feature IDs

- 2–20 **uppercase letters only** (no numbers, hyphens, or underscores)
- Descriptive of the feature area

| Valid | Invalid | Why |
|-------|---------|-----|
| `AUTH` | `auth` | Must be uppercase |
| `DASHBOARD` | `DASH_BOARD` | No underscores |
| `DLOOPPLANNER` | `DLOOP-PLANNER` | No hyphens in feature IDs |
| `PAYMENTS` | `A` | Minimum 2 characters |

### Behavior IDs

- Format: `FEATUREID-##` where `##` is zero-padded 01–99
- Sequential within a feature — never skip or duplicate

| Valid | Invalid | Why |
|-------|---------|-----|
| `AUTH-01` | `AUTH-1` | Must be zero-padded |
| `AUTH-02` | `auth-02` | Must be uppercase |
| `DASHBOARD-05` | `DASH_BOARD-05` | Feature ID rules apply |

### ID Generation Rules

1. Check existing SPEC.json for the feature
2. If feature exists: use the next available number
3. If new feature: start at `01`
4. Never reuse a deleted ID

---

## Writing Expectations

The expectation field describes **WHAT** should happen from the user's perspective.

### Rules

1. **Active voice** — "Users can..." not "It should be possible to..."
2. **Behavioral, not technical** — Describe what the user sees/does, not how the code works
3. **One behavior per spec** — If you use "and" to connect two actions, split into two specs
4. **Specific enough to implement** — Another developer should understand the requirement without guessing
5. **No vague terms** — Avoid "nice", "fast", "better", "good", "improved"
6. **Under 200 characters**

### Good Expectations

| Expectation | Why It Works |
|---|---|
| "Users can enter email and password to authenticate" | Clear user action, one behavior |
| "Login form displays validation errors for invalid input" | Observable outcome, specific |
| "Session persists across page refreshes" | Testable, one behavior |
| "Invalid email shows 'Please enter a valid email' error" | Exact error text, verifiable |

### Bad Expectations

| Expectation | Problem |
|---|---|
| "Use bcrypt to hash passwords" | Implementation detail (HOW, not WHAT) |
| "The login should be nice" | Vague, not testable |
| "Make it fast" | Not measurable, not a behavior |
| "Users see a login form, enter credentials, and get redirected" | Multiple behaviors joined by "and" |
| "Handle authentication" | Too vague to implement |

---

## Writing Invariants

The invariant field is a **constraint that must ALWAYS be true** — a hard rule that cannot be violated at any point during or after the behavior.

### Rules

1. **Hard constraint or "None"** — Every spec must have an invariant or explicitly state "None"
2. **Enforceable** — Must be checkable via code, tests, or inspection
3. **Specific and measurable** — No subjective language
4. **One constraint per invariant** — If you have multiple constraints, they belong on separate specs
5. **Under 100 characters**

### When to Use "None"

Use "None" only when there is genuinely no data constraint, security requirement, or business rule that must hold. Pure UI display specs with no data flow are the most common case.

If you omit the invariant, you must provide an `invariantExemptionReason` (min 10 chars) in the task metadata explaining why no invariant applies.

### Good Invariants

| Invariant | Why It Works |
|---|---|
| "Password must not be stored in plain text" | Enforceable, specific |
| "Session tokens must expire within 24 hours" | Measurable, testable |
| "PNG resolution must be at least 1024x1024" | Exact threshold |
| "Balance cannot go negative" | Clear business rule |
| "None" | Explicitly acknowledged |

### Bad Invariants

| Invariant | Problem |
|---|---|
| "Should work well" | Subjective, not enforceable |
| "Use best practices" | Vague, not measurable |
| "Must be secure" | Not specific enough — secure how? |
| *(empty)* | Must be "None" if no constraint applies |

---

## Writing Verification Criteria

The verification field describes **HOW** to confirm the behavior works. There is a priority order:

### Priority 1: Executable Command (Best)

A shell command that can be run to verify:

```
npm test -- --grep "AUTH-01"
npx tsc --noEmit
curl -s localhost:3000/api/health | jq .status
```

### Priority 2: Type Check Sufficient

When the behavior is fully expressed in types:

```
npx tsc --noEmit && npx convex typecheck
```

### Priority 3: Observable Behavior

When no automation exists but the result is clearly observable:

```
Login form renders with email and password fields
Button click triggers authentication request
```

### Priority 4: Manual Verification (Last Resort)

Only when none of the above are possible:

```
Open app; navigate to login; verify form appears
```

### Rules

1. **Clear pass/fail** — It must be obvious whether verification succeeded or failed
2. **Prefer automation** — An executable command is always better than manual steps
3. **One check per verification** — Don't chain unrelated checks
4. **Under 150 characters**
5. **Not just "it works"** — State what specifically to observe

---

## Character Limits

These limits are **quality guidelines enforced by DLOOP agents** on newly created specs. The `spec.schema.json` schema intentionally does **not** enforce `maxLength` on `expectation`, `invariant`, or `verification` because many historical specs predate these rules. The limits are enforced at the agent layer:

- **Spec Designer** (`specDesigner.ts`) — truncates fields exceeding limits and detects atomicity violations
- **Zod schemas** (`schemas.ts`) — validates at tool call time when the planner creates proposals
- **Spec Manager agent** — rejects specs that fail the atomicity quality gate

| Field | Target Max | Enforced By | Rationale |
|-------|-----------|-------------|-----------|
| `expectation` | 200 chars | Spec Designer + Spec Manager | Longer means multiple concerns — split the spec |
| `invariant` | 100 chars | Spec Designer + Spec Manager | Single constraint only |
| `verification` | 150 chars | Spec Designer + Spec Manager | One pass/fail check |
| `name` | 100 chars | JSON Schema + Zod | Short behavior title |
| `feature.name` | 100 chars | JSON Schema + Zod | Short feature title |

> **Note:** `name` and `feature.name` are the only fields with `maxLength` enforced in the JSON Schema, since all 676 existing specs comply with that limit.

---

## Red Flags — When to Split

If any of these appear in an expectation, the spec **must be split** into multiple specs:

| Red Flag | Example | Fix |
|----------|---------|-----|
| **"and" connecting different actions** | "displays form **and** validates input" | One spec for display, one for validation |
| **Multiple UI states** | "displays X, **then** Y, **finally** Z" | One spec per state |
| **Conditional branches** | "**if** X **then** Y, **else** Z" | One spec for the base case, one per branch |
| **Multiple user workflows** | "users can login, register, and reset password" | One spec per workflow |
| **Expectation > 200 characters** | *(anything too long)* | Decompose into smaller behaviors |

### Decomposition Pattern

```
Feature request → Identify distinct behaviors → ONE spec per behavior
```

**Example: "Add login with validation and sessions"**

Split into:
- `AUTH-01`: Login form display
- `AUTH-02`: Email validation errors
- `AUTH-03`: Password validation errors
- `AUTH-04`: Submit and redirect on success
- `AUTH-05`: Session persistence across page loads

---

## Quality Checklist

Run through this checklist before submitting any spec:

### Expectation
- [ ] Describes behavior, not implementation
- [ ] Uses active voice ("Users can...")
- [ ] No vague terms ("nice", "fast", "better")
- [ ] Specific enough to implement without guessing
- [ ] ONE behavior only — no "and" connecting actions
- [ ] Under 200 characters

### Invariant
- [ ] Is a hard constraint or explicitly "None"
- [ ] Can be checked/enforced in code or tests
- [ ] Specific and measurable
- [ ] Under 100 characters

### Verification
- [ ] Clear pass/fail criteria
- [ ] Executable command preferred
- [ ] Not just "it works"
- [ ] Under 150 characters

### ID
- [ ] Feature ID: 2-20 uppercase letters
- [ ] Behavior ID: `FEATURE-##` format, zero-padded
- [ ] Not a duplicate of any existing ID
- [ ] Sequential within the feature

---

## Examples: Bad vs Good

### Example 1: Login Feature

**Bad (one mega-spec):**
```json
{
  "id": "AUTH-01",
  "name": "Login",
  "expectation": "Users see a login form with email and password fields, validation errors appear for invalid input, and after successful authentication they are redirected to the dashboard and a session is created",
  "invariant": "Passwords should be secure and sessions should be managed properly",
  "verification": "Test that login works end to end"
}
```

Problems: expectation > 200 chars, multiple "and" behaviors, invariant is vague, verification has no pass/fail criteria.

**Good (atomic specs):**
```json
[
  {
    "id": "AUTH-01",
    "name": "Login Form Display",
    "expectation": "Login page renders email and password input fields with a submit button",
    "invariant": "Password field must mask input characters",
    "verification": "npx tsc --noEmit && npm test -- --grep AUTH-01"
  },
  {
    "id": "AUTH-02",
    "name": "Email Validation Error",
    "expectation": "Invalid email shows 'Please enter a valid email' error below the email field",
    "invariant": "None",
    "verification": "npm test -- --grep AUTH-02"
  },
  {
    "id": "AUTH-03",
    "name": "Password Validation Error",
    "expectation": "Empty password shows 'Password is required' error below the password field",
    "invariant": "None",
    "verification": "npm test -- --grep AUTH-03"
  },
  {
    "id": "AUTH-04",
    "name": "Successful Login Redirect",
    "expectation": "Valid credentials redirect user to /dashboard",
    "invariant": "Password must not be stored in plain text",
    "verification": "npm test -- --grep AUTH-04"
  },
  {
    "id": "AUTH-05",
    "name": "Session Persistence",
    "expectation": "Session persists on page refresh after login",
    "invariant": "Session tokens must expire within 24 hours",
    "verification": "npm test -- --grep AUTH-05"
  }
]
```

### Example 2: Data Export

**Bad:**
```json
{
  "id": "EXPORT-01",
  "name": "Export Data",
  "expectation": "Users can export their data as CSV or JSON, with filtering by date range and column selection, and the file downloads automatically",
  "invariant": "Use best practices",
  "verification": "It works"
}
```

**Good:**
```json
[
  {
    "id": "EXPORT-01",
    "name": "CSV Export Trigger",
    "expectation": "Users can click 'Export CSV' to download their data as a .csv file",
    "invariant": "Exported file must use UTF-8 encoding",
    "verification": "npm test -- --grep EXPORT-01"
  },
  {
    "id": "EXPORT-02",
    "name": "JSON Export Trigger",
    "expectation": "Users can click 'Export JSON' to download their data as a .json file",
    "invariant": "Exported JSON must be valid per JSON.parse()",
    "verification": "npm test -- --grep EXPORT-02"
  },
  {
    "id": "EXPORT-03",
    "name": "Date Range Filter",
    "expectation": "Users can select a start and end date to filter exported rows",
    "invariant": "Start date must not be after end date",
    "verification": "npm test -- --grep EXPORT-03"
  },
  {
    "id": "EXPORT-04",
    "name": "Column Selection",
    "expectation": "Users can select which columns to include in the export",
    "invariant": "At least one column must be selected",
    "verification": "npm test -- --grep EXPORT-04"
  }
]
```

---

## Enforcement Layers

These rules are enforced at multiple points in the pipeline. Understanding where each check happens helps debug rejections.

| Layer | File | What It Checks |
|-------|------|----------------|
| **JSON Schema** | `spec.schema.json` | Structure, required fields, ID patterns, character limits |
| **Planner instructions** | `agent-instructions/dloop-planner.md` | Atomicity rules, decomposition before submission |
| **Zod schemas** | `src/agents/planner/schemas.ts` | Field presence, min/max lengths, invariant/verification required (or exemption reason) |
| **Spec Designer code** | `src/agents/planner/specDesigner.ts` | Atomicity violation detection (regex), field truncation, duplicate ID prevention |
| **Spec Manager instructions** | `agent-instructions/dloop-spec-manager.md` | Writing quality, atomicity gate, self-check checklist |
| **Reviewer instructions** | `agent-instructions/dloop-reviewer.md` | Clear expectations, testability, no implementation details, valid IDs |
| **Sync script** | `scripts/sync-spec.js` | Reads structure for progress tracking, detects executable verifications |
| **Generate script** | `scripts/generate-spec-md.js` | Reads structure for documentation generation |
