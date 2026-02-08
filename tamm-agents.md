# TAMM Agent Architecture

TAMM (The App Manifestation Machine) uses a **team of specialized AI agents** that work in a continuous development loop. Each agent has a single responsibility, following the Unix philosophy of "do one thing well."

## Overview

The multi-agent architecture prevents context pollution and cognitive overload. Each agent starts fresh, avoiding the "accumulated confusion" problem where a single long-running agent gradually loses focus. This matches Anthropic's recommended patterns for complex autonomous workflows.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAMM Development Loop                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input ──► INBOX ANALYZER ──► PLANNER ──► Task Queue       │
│                                                                  │
│                              ┌─────────────────────┐             │
│                              │    Task Queue       │             │
│                              │  (Convex Workpool)  │             │
│                              └──────────┬──────────┘             │
│                                         │                        │
│         ┌───────────────────────────────┼───────────────────┐   │
│         ▼                               ▼                   ▼    │
│   BOOTSTRAPPER              SPEC MANAGER            IMPLEMENTOR  │
│   (bootstrap)               (spec-proposal)         (all others) │
│         │                          │                       │     │
│         └──────────────────────────┴───────────────────────┘     │
│                                         │                        │
│                                         ▼                        │
│                                    REVIEWER                      │
│                              (quality gate)                      │
│                                         │                        │
│                                         ▼                        │
│                               PR Merged → Done                   │
└─────────────────────────────────────────────────────────────────┘
```

## The Six TAMM Agents

| Agent                                     | File                    | Purpose                                   | Task Types                                                               |
| ----------------------------------------- | ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| [Inbox Analyzer](#1-inbox-analyzer-agent) | `dloop-inbox.md`        | Transform raw ideas into structured items | N/A (pre-queue)                                                          |
| [Planner](#2-planner-agent)               | `dloop-planner.md`      | Classify requests and create tasks        | N/A (creates tasks)                                                      |
| [Bootstrapper](#3-bootstrapper-agent)     | `dloop-bootstrap.md`    | Initialize new codebases                  | `bootstrap`                                                              |
| [Spec Manager](#4-spec-manager-agent)     | `dloop-spec-manager.md` | Write specifications                      | `spec-proposal`                                                          |
| [Implementor](#5-implementor-agent)       | `dloop-implementor.md`  | Write code                                | `spec-implementation`, `bugfix`, `design-system`, `tech-stack`, `schema` |
| [Reviewer](#6-reviewer-agent)             | `dloop-reviewer.md`     | Review PRs for quality                    | All PR reviews                                                           |

---

## 1. Inbox Analyzer Agent

**File:** `/agent-instructions/dloop-inbox.md`

**Purpose:** Transform raw user ideas into structured, actionable items.

### Input/Output

**Input:** Raw text from users (often brief, incomplete, or rough)

**Output:** Structured JSON with:

- Clear, actionable title
- Expanded description
- Priority assessment (1-100)
- Reasoning explanation

### Example

```
Input:  "dark mode"

Output: {
  "title": "Add dark mode theme option for better low-light usability",
  "description": "Implement a dark mode theme that users can toggle in their settings. This should include:\n\n- A theme toggle in the settings or header area\n- Dark color variants for all UI components\n- Persistence of user preference across sessions\n- Respect system-level dark mode preference as default",
  "priority": 55,
  "reasoning": "Dark mode is a popular accessibility and comfort feature but is not blocking core functionality. Medium priority as it improves user experience without being urgent."
}
```

### Priority Guidelines

| Range  | Level    | Use For                                       |
| ------ | -------- | --------------------------------------------- |
| 80-100 | Critical | Security issues, blocking bugs, core features |
| 60-79  | High     | Important features, significant improvements  |
| 40-59  | Medium   | Nice-to-have features, minor improvements     |
| 20-39  | Low      | Cosmetic changes, optional enhancements       |
| 1-19   | Minimal  | Ideas to consider later, experiments          |

This agent acts as an **intelligent triaging layer** that converts casual ideas into properly formatted task candidates.

---

## 2. Planner Agent

**File:** `/agent-instructions/dloop-planner.md`

**Purpose:** Interpret user requests and create properly classified tasks in the Convex task queue.

### Key Responsibilities

1. **Intent Classification** - Determines task type from natural language
2. **Atomic Spec Design** - Ensures specs follow the ONE rule (one trigger, one behavior, one outcome)
3. **Clarifying Questions** - Asks for details when requests are ambiguous
4. **Task Creation** - Creates tasks with proper metadata

### Task Types Created

| Type            | Purpose                    | Default Priority |
| --------------- | -------------------------- | ---------------- |
| `spec-proposal` | New features needing specs | 100 (Normal)     |
| `bugfix`        | Bug reports/fixes          | 50 (High)        |
| `design-system` | UI/styling changes         | 100 (Normal)     |
| `tech-stack`    | Dependencies/tooling       | 80 (Moderate)    |
| `schema`        | Database changes           | 80 (Moderate)    |

### Atomicity Enforcement

The Planner enforces **atomicity** at spec design time. Each spec must have:

- **ONE trigger** - A single event/action that starts the behavior
- **ONE behavior** - A single thing that happens
- **ONE outcome** - A single observable result

**Size Limits (Enforced):**

| Field        | Max Length | Why                        |
| ------------ | ---------- | -------------------------- |
| expectation  | 200 chars  | Longer = multiple concerns |
| invariant    | 100 chars  | Single constraint only     |
| verification | 150 chars  | One pass/fail check        |

**Red Flags (Auto-reject):**

- "and" connecting different actions
- Multiple UI states ("displays X, then Y")
- Conditional logic ("if X then Y, else Z")

### Example: Bad vs Good Specs

**Bad (too big):**

```
"Users see a login form with email and password fields, validation
errors appear for invalid input, and after successful authentication
they are redirected to the dashboard"
```

**Good (atomic):**

```
AUTH-01: "Login form displays email and password input fields"
AUTH-02: "Invalid email shows 'Please enter a valid email' error"
AUTH-03: "Valid credentials redirect user to /dashboard"
```

### Priority Keywords

Users can indicate priority in their requests:

| Keywords                                        | Priority     |
| ----------------------------------------------- | ------------ |
| "urgent", "critical", "ASAP", "emergency"       | 10 (Urgent)  |
| "high priority", "important", "soon"            | 50 (High)    |
| "normal" (or no indication)                     | 100 (Normal) |
| "low priority", "when possible", "nice to have" | 200 (Low)    |

---

## 3. Bootstrapper Agent

**File:** `/agent-instructions/dloop-bootstrap.md`

**Purpose:** Initialize new codebases from business documents and tech stack specifications.

### When Used

Only for `bootstrap` tasks - setting up brand new projects.

### Key Responsibilities

1. **Validate** business document paths exist
2. **Read** business docs to understand requirements
3. **Detect or use** specified tech stack
4. **Initialize** project structure (src/, tests/, .github/, etc.)
5. **Configure** tooling (ESLint, Prettier, TypeScript, CI/CD)
6. **Create SDAD structure** (SPEC.json, .agent/, scripts/)
7. **Create PR** with all scaffolding

### Task Metadata Structure

```json
{
  "businessDocs": ["docs/business-goals.md", "docs/tech-stack.md"],
  "targetDirectory": "/path/to/new/project",
  "techStackOverride": {
    "framework": "next",
    "language": "typescript",
    "database": "convex",
    "styling": "tailwind",
    "testing": "vitest"
  }
}
```

### Generated Project Structure

```
targetDirectory/
├── src/
│   ├── components/    # React components
│   ├── lib/           # Utilities and helpers
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
├── tests/             # Test files
├── docs/              # Documentation (preserve existing)
├── .agent/            # SDAD structure
│   ├── progress.json
│   └── plans/
├── scripts/           # Build/sync scripts
├── .github/
│   └── workflows/     # CI/CD
├── SPEC.json          # Declarative specs
├── SPEC.md            # Generated spec docs (read-only)
├── CLAUDE.md          # AI instructions
├── package.json
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── .env.example
└── README.md
```

### Idempotency Rules

- **NEVER** overwrites existing files
- **NEVER** deletes directories
- **Only** creates missing pieces
- Logs warnings for skipped items

### Tech Stack Detection

If no `techStackOverride` is provided, the agent auto-detects:

1. Check existing `package.json` dependencies
2. Look for config files (`tsconfig.json`, `Cargo.toml`, `go.mod`, etc.)
3. Parse business docs for technology mentions
4. Apply sensible defaults if nothing detected

---

## 4. Spec Manager Agent

**File:** `/agent-instructions/dloop-spec-manager.md`

**Purpose:** Write and maintain high-quality specifications in SPEC.json.

### Task Types

Only handles `spec-proposal` tasks. Does **NOT** write code.

### SPEC.json Structure

The Spec Manager writes the "constitution" for features:

```json
{
  "$schema": "./spec.schema.json",
  "version": "1.0.0",
  "features": [
    {
      "id": "AUTH",
      "name": "User Authentication",
      "description": "Login and session management",
      "behaviors": [
        {
          "id": "AUTH-01",
          "name": "Login Form Display",
          "expectation": "Users see a form with email and password fields",
          "invariant": "Password field masks input characters",
          "verification": "npm test -- --grep 'login form'"
        }
      ]
    }
  ]
}
```

### ID Naming Convention

**Feature IDs:**

- 2-20 uppercase letters only
- Examples: `AUTH`, `DASHBOARD`, `EXPORT`
- Invalid: `auth`, `Auth`, `AUTH_FEATURE`

**Behavior IDs:**

- Format: `FEATUREID-##` where ## is 01-99
- Sequential within a feature
- Examples: `AUTH-01`, `AUTH-02`, `DASHBOARD-05`
- Invalid: `AUTH-1`, `auth-01`, `AUTH_01`

### Spec Quality Guidelines

**Expectation Field (WHAT should happen):**

- Good: "Users can enter email and password to authenticate"
- Bad: "Use bcrypt to hash passwords" (implementation detail)

**Invariant Field (constraint that must ALWAYS be true):**

- Good: "Password must not be stored in plain text"
- Bad: "Should work well" (not enforceable)

**Verification Field (HOW to verify):**

1. Executable command (best): `npm test -- --grep "login"`
2. Type check: `npx tsc --noEmit`
3. Observable behavior: "Login form renders with email and password fields"
4. Manual verification (last resort): "Open app; navigate to login; verify form appears"

### Workflow

1. Dequeue `spec-proposal` task
2. Pre-flight checks (git clean, SPEC.json valid)
3. Write specs to SPEC.json
4. Run `scripts/generate-spec-md.js` and `scripts/sync-spec.js`
5. Create PR with spec changes
6. Exit - TaskProcessor handles merge and child task creation

---

## 5. Implementor Agent

**File:** `/agent-instructions/dloop-implementor.md`

**Purpose:** Execute tasks by implementing code changes and verifying them.

### Task Types Handled

| Type                  | Purpose                     | Commit Prefix     |
| --------------------- | --------------------------- | ----------------- |
| `spec-implementation` | Implement a spec's behavior | `feat(<specId>):` |
| `bugfix`              | Fix reported bugs           | `fix:`            |
| `design-system`       | UI/styling changes          | `design:`         |
| `tech-stack`          | Dependencies/tooling        | `chore:`          |
| `schema`              | Database changes            | `schema:`         |

**Does NOT handle:** `spec-proposal` tasks (those go to Spec Manager)

### Workflow

1. **Pre-flight checks**

   ```bash
   npm install
   npx tsc --noEmit
   npm run build
   git status --porcelain  # Must be empty
   ```

2. **Validate spec exists** (for spec-implementation)

   ```bash
   jq -e '.features[].specs[] | select(.id == "SPEC_ID")' SPEC.json
   ```

3. **Create plan** using architect subagent

4. **Implement** following existing patterns

5. **Verify** using fresh-context verifier subagent:

   ```
   You are a verification agent with fresh context.
   Verify spec ${specId} is correctly implemented.

   DO NOT: Look at implementation plans, consider "how it was built"
   DO: Run verification criteria, check actual behavior, report PASS/FAIL
   ```

6. **Create PR** (with retry logic - up to 3 attempts on failure)

### Sprint-Aware Execution

When implementing multiple specs for a feature (sprint mode):

| Task Position | Branch Action        | PR Action                  |
| ------------- | -------------------- | -------------------------- |
| First task    | Create sprint branch | No PR                      |
| Middle tasks  | Commit to branch     | No PR                      |
| Final task    | Push branch          | Create PR with all commits |

### Critical Validation Rules

**Before creating PR, verify:**

- Spec exists in SPEC.json (fail immediately if not)
- Code was actually written (`git diff --stat HEAD~1`)
- Build/tests pass

**Never exit successfully if:**

- Spec doesn't exist in SPEC.json
- No source files were created or modified
- Implementation is incomplete or placeholder code

---

## 6. Reviewer Agent

**File:** `/agent-instructions/dloop-reviewer.md`

**Purpose:** Review PRs created by other TAMM agents for quality and compliance.

### PR Detection

Only processes DLOOP-generated PRs:

- Branch starts with `dloop/`
- PR description contains task ID

Non-DLOOP PRs are left for human review.

### Automated Checks

| Check      | Command                         | Requirement                      |
| ---------- | ------------------------------- | -------------------------------- |
| CI Status  | `gh pr checks <number> --watch` | All green                        |
| Type Check | `npx tsc --noEmit`              | Zero errors                      |
| Tests      | `npm test`                      | All pass                         |
| Security   | `npm audit --audit-level=high`  | No high/critical vulnerabilities |

### Code Quality Review

**Pattern Adherence:**

- Does it use existing utilities?
- Does it match the file structure?
- Is naming consistent?

**Complexity:**

- Is the solution appropriately simple?
- Are there unnecessary abstractions?

**Focused Changes:**

- Is the diff minimal?
- Are there unrelated changes?

**Error Handling:**

- Are errors caught appropriately?
- Are error messages helpful?

### Spec Compliance (spec-implementation)

1. **Read the Spec** - Get expectation, invariant, verification
2. **Check Implementation vs Expectation** - Does code do what spec says?
3. **Verify Invariants** - Is the constraint enforced?
4. **Check Scope** - No features beyond what spec requires

### Output Format

The Reviewer outputs structured JSON for the TaskProcessor:

**Approved:**

```json
{
  "verdict": "approved",
  "codeQualityIssues": [],
  "specComplianceIssues": []
}
```

**Changes Requested:**

```json
{
  "verdict": "changes-requested",
  "codeQualityIssues": [
    {
      "file": "src/auth/login.ts",
      "line": 42,
      "issue": "Property 'user' does not exist on type 'Session'",
      "suggestion": "Add 'user' to the Session interface"
    }
  ],
  "specComplianceIssues": [
    {
      "specId": "AUTH-01",
      "issue": "Implementation adds 'forgot password' link not in spec"
    }
  ]
}
```

### Review Tone

**Be:**

- Objective (based on facts, not preferences)
- Specific (point to exact lines/issues)
- Constructive (explain how to fix)
- Efficient (don't nitpick minor style issues)

**Avoid:**

- Subjective opinions ("I don't like this")
- Vague feedback ("needs improvement")
- Excessive praise or criticism

---

## Task State Machine

All tasks flow through this state machine:

```
queued → running → awaiting-review → completed
   ↓         ↓           ↓
   └─────────┴───────────┴──→ failed (can retry)
```

### State Descriptions

| State             | Meaning                              |
| ----------------- | ------------------------------------ |
| `queued`          | Task waiting to be picked up         |
| `running`         | Agent actively working on task       |
| `awaiting-review` | PR created, waiting for review/merge |
| `completed`       | Work done and merged                 |
| `failed`          | Error occurred (can be retried)      |

---

## Review Workflow Settings

Projects can configure how PRs are handled in `projects.settings.reviewWorkflow`:

| Setting        | Behavior                                                   |
| -------------- | ---------------------------------------------------------- |
| `auto-approve` | PRs auto-merged, child tasks spawned immediately (default) |
| `human-review` | PRs wait for human approval before merging                 |
| `agent-review` | Reviewer agent evaluates PR quality                        |

### Per-Task-Type Overrides

Override the global setting for specific task types:

```bash
npx convex run projects:updateTaskTypeReviewSettings '{
  "projectId": "my-project",
  "taskTypeReviewSettings": {
    "bugfix": "auto-approve",
    "schema": "human-review",
    "tech-stack": "human-review",
    "bootstrap": "human-review"
  }
}'
```

**Recommended Settings:**

| Task Type             | Recommended Setting | Reason             |
| --------------------- | ------------------- | ------------------ |
| `bugfix`              | auto-approve        | Low risk           |
| `bootstrap`           | human-review        | High impact        |
| `schema`              | human-review        | Database changes   |
| `tech-stack`          | human-review        | Dependency changes |
| `spec-proposal`       | per-team preference |                    |
| `spec-implementation` | per-team preference |                    |
| `design-system`       | per-team preference |                    |

---

## The Complete Flow

1. **User** types a rough idea
2. **Inbox Analyzer** structures it into actionable format
3. **Planner** classifies and creates tasks in queue
4. **Workpool** monitors queue and triggers appropriate agent:
   - `bootstrap` → **Bootstrapper**
   - `spec-proposal` → **Spec Manager**
   - Everything else → **Implementor**
5. Agent creates PR with changes
6. **Reviewer** (or auto-approve) validates
7. PR merged → task completed → child tasks spawned if applicable
8. Loop continues with next task

This creates a **continuous development loop** that can operate autonomously while maintaining quality through specification compliance.

---

## Key Files

| File                         | Purpose                        |
| ---------------------------- | ------------------------------ |
| `/agent-instructions/*.md`   | Agent instruction source files |
| `src/agents/instructions.ts` | Compiled agent instructions    |
| `src/agents/runner.ts`       | Agent SDK wrapper              |
| `convex/taskProcessor.ts`    | Workpool-based task processor  |
| `convex/taskQueue.ts`        | Task queue mutations/queries   |

---

## Related Documentation

- [SDAD Guide](./sdad-guide-v2.md) - Spec-Driven Agentic Development methodology
- [DLOOP v1](./dloop-v1.md) - Original development loop architecture
- [Agent Customization](./agent-customization.md) - Customizing agent behavior per-project
