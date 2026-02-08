# Development Loop (DLOOP) v1

A continuous development loop where teams of agents work incrementally on projects, using Convex as the task queue and GitHub as the spec source of truth.

---

## Overview

DLOOP v1 establishes a persistent development loop where:

1. **Planner agents** analyze requirements and create tasks
2. **Spec Manager agents** write specs to SPEC.json (spec-proposal tasks)
3. **Implementor agents** write code (spec-implementation, bugfix, etc.)
4. **Reviewer agents** review PRs and merge passing work

**Key Design Principles (from Anthropic's long-running agent research):**
- Single-task focus per agent session (minimal context)
- Single-responsibility agents (specs vs code)
- Pre-flight verification before any work
- Verification with fresh context (subagent pattern)
- Clean, atomic PRs for each task

---

## Sources of Truth

| What | Where | Why |
|------|-------|-----|
| **Task Queue** | Convex `taskQueue` table | Persistent, real-time, queryable from anywhere |
| **Spec (SPEC.json)** | GitHub repo | Versioned, reviewable, single source for behavior definitions |
| **Progress State** | Convex `progressState` | Tracks spec lifecycle, synced bidirectionally |
| **Events** | Convex `events` | Real-time activity stream for monitoring |

---

## Task Types

Planner agents create tasks in the queue for:

| Task Type | Description | Output |
|-----------|-------------|--------|
| `spec-proposal` | Proposed additions/modifications to SPEC.json | PR with spec changes only |
| `spec-implementation` | Implement an existing PENDING spec | PR with feature code |
| `bugfix` | Bug identified in existing functionality | PR with fix |
| `design-system` | Changes to design tokens, components, patterns | PR with design changes |
| `tech-stack` | Dependencies, tooling, infrastructure changes | PR with stack changes |
| `schema` | Database schema modifications | PR with migration |

### Spec Proposal → Implementation Flow

The `spec-proposal` and `spec-implementation` tasks are intentionally separated:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPEC LIFECYCLE                                │
│                                                                  │
│  User Request                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │  spec-proposal  │  Planner creates task to add/modify spec   │
│  │     task        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  SPEC MANAGER   │  Updates SPEC.json only                    │
│  │  (writes specs) │  Runs: generate-spec-md.js                 │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  PR Review      │  Spec reviewed before any code written     │
│  │  (spec-only)    │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼  PR merged                                           │
│  ┌─────────────────┐                                            │
│  │  AUTO-CREATE    │  System creates spec-implementation        │
│  │  impl tasks     │  tasks for each new spec ID                │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  spec-implementation tasks (one per spec ID)             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │    │
│  │  │ AUTH-01  │ │ AUTH-02  │ │ AUTH-03  │  ...            │    │
│  │  └──────────┘ └──────────┘ └──────────┘                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  IMPLEMENTOR    │  Implements ONE spec per session           │
│  │  (writes code)  │  Creates plan → builds → verifies          │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  PR Review      │  Code reviewed against approved spec       │
│  │  (code)         │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits of separation:**
- Specs are reviewed and approved before implementation begins
- Clear audit trail: "spec approved" → "implementation started"
- Single-responsibility tasks (spec-only OR code-only)
- Failed implementations don't block spec approval
- Multiple specs can be approved in one PR, then implemented in parallel

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONVEX                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  taskQueue   │  │    events    │  │ progressState│          │
│  │  (tasks)     │  │  (activity)  │  │  (spec state)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         ▲                   │                    │
         │                   ▼                    ▼
┌────────┴────────┐  ┌─────────────────────────────────┐
│  PLANNER AGENT  │  │        REAL-TIME DASHBOARD       │
│  (via chat)     │  │  (task board, events, progress)  │
└─────────────────┘  └─────────────────────────────────┘
         │
         │ creates tasks
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TASK ROUTING (by task type)                                      │
│                                                                  │
│   spec-proposal ────────►  SPEC MANAGER AGENT                    │
│                            • Writes SPEC.json                    │
│                            • Knows spec structure & quality      │
│                            • Creates spec-only PRs               │
│                                                                  │
│   spec-implementation ──►  IMPLEMENTOR AGENT                     │
│   bugfix ───────────────►  • Writes code                         │
│   design-system ────────►  • Follows codebase patterns           │
│   tech-stack ───────────►  • Creates code PRs                    │
│   schema ───────────────►                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ creates PR
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REVIEWER AGENT                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Review PR (code quality OR spec quality)                │  │
│  │ 2. Run automated checks (CI, tests, types)                 │  │
│  │ 3. Approve or request changes                              │  │
│  │ 4. Merge if approved                                       │  │
│  │ 5. For spec-proposals: trigger implementation task creation│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Specifications

### Planner Agent

**Trigger:** User interaction via chat (future: automated via autoloop-mode)

**Responsibilities:**
- Analyze feature requests, bug reports, or improvement ideas
- **Design atomic specs** using the `design_spec` tool
- Decompose into discrete, implementable tasks
- Create tasks in Convex `taskQueue`
- Propose spec changes when appropriate

#### Atomic Spec Design

When creating spec-proposals, the Planner MUST use the `design_spec` tool to ensure specs follow the **ONE rule**:

- **ONE trigger** - A single event/action that starts the behavior
- **ONE behavior** - A single thing that happens
- **ONE outcome** - A single observable result

**Size Limits (ENFORCED):**

| Field | Max | Why |
|-------|-----|-----|
| expectation | 200 chars | Longer = multiple concerns |
| invariant | 100 chars | Single constraint only |
| verification | 150 chars | One pass/fail check |

**Red Flags (MUST SPLIT):**
- ❌ "and" connecting different actions
- ❌ Multiple UI states ("displays X, then Y")
- ❌ Conditional logic ("if X then Y, else Z")
- ❌ Expectation > 200 characters

**Example - Bad (too big):**
```
expectation: "Users see a login form with email and password fields,
validation errors appear for invalid input, and after successful
authentication they are redirected to the dashboard"
```

**Example - Good (atomic):**
```
AUTH-01: "Login form displays email and password input fields"
AUTH-02: "Invalid email shows 'Please enter a valid email' error"
AUTH-03: "Valid credentials redirect user to /dashboard"
```

#### Spec Designer Tool

The `design_spec` MCP tool helps decompose features into atomic specs:

```json
{
  "featureDescription": "Add user authentication with login, validation, and sessions",
  "featureId": "AUTH",
  "featureName": "User Authentication",
  "context": {
    "businessRules": "Users must verify email before dashboard access",
    "techStack": "Next.js, Convex, Clerk"
  },
  "model": "claude"
}
```

**Model Selection:**
- **claude** (default): Simple features, 1-5 specs
- **gpt-5.2-pro**: Complex features requiring deep decomposition

**Task Creation:**
```typescript
// spec-proposal task (adds/modifies SPEC.json only)
{
  projectId: "proj_123",
  type: "spec-proposal",
  title: "Add user authentication spec",
  description: "Define AUTH-01 through AUTH-05 behaviors for login flow",
  priority: 1,
  metadata: {
    proposedSpecIds: ["AUTH-01", "AUTH-02", "AUTH-03", "AUTH-04", "AUTH-05"],
    featureId: "AUTH",
    featureName: "User Authentication",
    specDetails: [
      { id: "AUTH-01", name: "Login form", expectation: "..." },
      { id: "AUTH-02", name: "Session management", expectation: "..." }
    ]
  }
}

// spec-implementation task (created automatically after spec-proposal merges)
{
  projectId: "proj_123",
  type: "spec-implementation",
  title: "Implement AUTH-01: Login form",
  description: "Implement the login form behavior as defined in SPEC.json",
  priority: 2,
  metadata: {
    specId: "AUTH-01",           // Single spec per implementation task
    featureId: "AUTH",
    relatedFiles: ["src/auth/"], // Hints for implementor
    acceptanceCriteria: ["Login form renders", "Validates email format"]
  }
}

// Other task types (bugfix, design-system, etc.)
{
  projectId: "proj_123",
  type: "bugfix" | "design-system" | "tech-stack" | "schema",
  title: "Fix login redirect bug",
  description: "Users are not redirected after successful login",
  priority: 1,
  metadata: {
    relatedFiles: ["src/auth/login.ts"],
    relatedSpecIds: ["AUTH-01"],  // Optional: which specs this relates to
    acceptanceCriteria: ["User redirected to dashboard after login"]
  }
}
```

**Output:** Tasks queued in Convex

---

### Spec Manager Agent

**Trigger:** `spec-proposal` task available in queue

**Single Responsibility:** Writes specs to SPEC.json. Does NOT write code.

**Task Types Handled:** Only `spec-proposal`

**Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPEC MANAGER SESSION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEQUEUE                                                      │
│     └─ Get spec-proposal task from Convex                        │
│     └─ Mark task as "running"                                    │
│     └─ Create working branch: dloop/<spec-id>                    │
│                                                                  │
│  2. PRE-FLIGHT (abort if fails)                                  │
│     └─ Verify git status clean                                   │
│     └─ SPEC.json is valid JSON                                   │
│     └─ Dependencies installed                                    │
│                                                                  │
│  3. WRITE SPECS                                                  │
│     └─ Read specDetails from task metadata                       │
│     └─ Validate spec ID format (FEATURE-##)                      │
│     └─ Check for duplicate IDs                                   │
│     └─ Add behaviors to SPEC.json                                │
│     └─ Validate spec quality (clear, testable, enforceable)      │
│                                                                  │
│  4. POST-PROCESS                                                 │
│     └─ Run: node scripts/generate-spec-md.js                     │
│     └─ Run: node scripts/sync-spec.js                            │
│     └─ Commit: "spec: Add AUTH-01, AUTH-02, AUTH-03"             │
│                                                                  │
│  5. VERIFY                                                       │
│     └─ SPEC.json is valid JSON                                   │
│     └─ All IDs follow naming convention                          │
│     └─ SPEC.md regenerates without error                         │
│     └─ No duplicate spec IDs                                     │
│     └─ Expectations are clear and testable                       │
│                                                                  │
│  6. PR                                                           │
│     └─ Push branch to remote                                     │
│     └─ Create PR with spec summary                               │
│     └─ Update task status: "running" → "awaiting-review"         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**SPEC.json Structure:**

```json
{
  "features": [
    {
      "id": "AUTH",
      "name": "User Authentication",
      "description": "Login, logout, session management",
      "behaviors": [
        {
          "id": "AUTH-01",
          "name": "Login Form",
          "expectation": "Users can enter email and password to authenticate",
          "invariant": "Password must not be stored in plain text",
          "verification": "Login form renders; auth request sent on submit"
        }
      ]
    }
  ]
}
```

**Spec Quality Standards:**

| Field | Good | Bad |
|-------|------|-----|
| Expectation | "Users can download logos as PNG" | "Make download better" |
| Invariant | "PNG must be at least 1024x1024" | "Should work well" |
| Verification | `npm test -- --grep login` | "It works" |

**Atomicity Quality Gate:**

The Spec Manager enforces atomicity before writing specs to SPEC.json:

| Check | Limit | Action |
|-------|-------|--------|
| Expectation length | > 200 chars | **REJECT** |
| Invariant length | > 100 chars | **REJECT** |
| Verification length | > 150 chars | **REJECT** |
| Multiple "and" + verbs | detected | **REJECT** |
| Conditional logic | detected | **REJECT** |

If a spec fails validation, the task is rejected and the Planner must re-submit with properly atomic specs using the `design_spec` tool.

**ID Naming:**
- Feature ID: 2-20 uppercase letters (e.g., `AUTH`, `DASHBOARD`)
- Behavior ID: `FEATURE-##` format (e.g., `AUTH-01`, `AUTH-02`)

**Output:** PR created with spec changes only

---

### Implementor Agent

**Trigger:** Code task available in queue (manual or loop-driven)

**Single Responsibility:** Writes code. Does NOT write specs.

**Task Types Handled:**
- `spec-implementation` - Implement a spec's behavior
- `bugfix` - Fix reported bugs
- `design-system` - UI/styling changes
- `tech-stack` - Dependencies, tooling changes
- `schema` - Database schema changes

**Design Pattern:** Single-task, fresh-context sessions following Anthropic's harness model.

**Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTOR SESSION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEQUEUE                                                      │
│     └─ Get single highest-priority task from Convex              │
│     └─ Mark task as "running"                                    │
│     └─ Create working branch: dloop/<task-id>                    │
│                                                                  │
│  2. PRE-FLIGHT (abort if fails)                                  │
│     └─ npm install                                               │
│     └─ npx tsc --noEmit (type check)                             │
│     └─ npm run build (compilation check)                         │
│     └─ Verify git status clean                                   │
│                                                                  │
│  3. ORIENT                                                       │
│     └─ Read task description and acceptance criteria             │
│     └─ Review related files (from metadata)                      │
│     └─ Check current SPEC.json state                             │
│     └─ Review recent git history for context                     │
│                                                                  │
│  4. IMPLEMENT                                                    │
│     └─ Make focused code changes                                 │
│     └─ Follow existing patterns and conventions                  │
│     └─ Emit events to Convex for progress tracking               │
│     └─ Commit incrementally with descriptive messages            │
│                                                                  │
│  5. VERIFY (subagent with fresh context)                         │
│     └─ Spawn verifier subagent                                   │
│     └─ Run type checks: npx tsc --noEmit                         │
│     └─ Run tests if applicable                                   │
│     └─ Run spec verification criteria                            │
│     └─ If fail: diagnose, fix, retry (max 3 attempts)            │
│                                                                  │
│  6. PR                                                           │
│     └─ Push branch to remote                                     │
│     └─ Create PR with structured description                     │
│     └─ Link to task ID and spec IDs                              │
│     └─ Update task status: "running" → "awaiting-review"         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pre-Flight Script (run before every session):**
```bash
#!/bin/bash
# scripts/dloop-preflight.sh

set -e  # Exit on any error

echo "=== DLOOP Pre-Flight Check ==="

# 1. Dependencies
echo "Installing dependencies..."
npm install --silent

# 2. Type check
echo "Running type check..."
npx tsc --noEmit

# 3. Build check
echo "Running build..."
npm run build --silent

# 4. Git status
echo "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
  echo "ERROR: Working directory not clean"
  exit 1
fi

echo "=== Pre-Flight PASSED ==="
```

**Verification Subagent Pattern:**

The verification step uses a fresh-context subagent to avoid confirmation bias:

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPLEMENTOR                        VERIFIER SUBAGENT           │
│                                                                  │
│  "I've implemented AUTH-01"   ──►  (fresh context, no impl bias)│
│                                     - Read spec criteria        │
│                                     - Run verification commands │
│                                     - Check invariants          │
│                               ◄──  "PASS" or "FAIL: reason"     │
└─────────────────────────────────────────────────────────────────┘
```

**Output:** PR created, task status updated

---

### Implementor Behavior by Task Type

The implementor follows the same lifecycle for all tasks, but the **IMPLEMENT** and **VERIFY** steps differ by task type.

**Note:** The Implementor does NOT handle `spec-proposal` tasks. Those are handled by the Spec Manager agent.

#### `spec-implementation` Tasks

```
IMPLEMENT:
  └─ Read spec from SPEC.json (single specId from metadata)
  └─ Create implementation plan (like spec-architect)
  └─ Write code following the plan
  └─ Update progress.json: PENDING → PLANNED → (after verify) COMPLETED
  └─ Commit: "feat(AUTH-01): Implement login form"

VERIFY (subagent):
  └─ Run verification criteria from spec
  └─ If executable: run command directly
  └─ If descriptive: use Playwright to verify
  └─ Check invariants are enforced
  └─ Types pass: npx tsc --noEmit
```

#### `bugfix` Tasks

```
IMPLEMENT:
  └─ Reproduce the bug (if possible)
  └─ Identify root cause
  └─ Write minimal fix
  └─ Commit: "fix: Resolve login redirect issue"

VERIFY (subagent):
  └─ Bug no longer reproducible
  └─ Related spec criteria still pass
  └─ No regression in related functionality
  └─ Types pass
```

#### `design-system` / `tech-stack` / `schema` Tasks

```
IMPLEMENT:
  └─ Make focused changes to design/stack/schema
  └─ Update any affected documentation
  └─ Commit with appropriate prefix: "design:", "chore:", "schema:"

VERIFY (subagent):
  └─ Build passes
  └─ Types pass
  └─ No breaking changes to existing functionality
  └─ Migration runs successfully (for schema)
```

---

### Reviewer Agent

**Trigger:** PR created (webhook or polling)

**Responsibilities:**
- Code review for quality and patterns
- Verify spec compliance
- Run CI checks
- Approve and merge, or request changes

**Review Checklist:**
```markdown
## Automated Checks
- [ ] CI passes (build, lint, types)
- [ ] Tests pass
- [ ] No security vulnerabilities introduced

## Code Quality
- [ ] Follows existing patterns
- [ ] No over-engineering
- [ ] Focused changes (minimal diff)

## Spec Compliance
- [ ] Implements what the spec requires
- [ ] Doesn't implement more than spec requires
- [ ] Verification criteria pass
```

**Decision Flow:**
```
PR Created
    │
    ├─► Run automated checks
    │       │
    │       ├─► Fail → Request changes, mark task "needs-work"
    │       │
    │       └─► Pass → Continue
    │
    ├─► Code review
    │       │
    │       ├─► Issues found → Request changes, provide feedback
    │       │
    │       └─► Approved → Continue
    │
    └─► Merge PR
            │
            ├─► Update task: "awaiting-review" → "completed"
            │
            ├─► If spec-proposal:
            │       └─► Auto-create spec-implementation tasks
            │       └─► Emit impl_tasks_created event
            │
            └─► Sync state to Convex
```

**Spec-Proposal Review Checklist:**
```markdown
## Spec Quality
- [ ] Expectations are clear and testable
- [ ] Invariants are enforceable
- [ ] Verification criteria are specific
- [ ] No implementation details in expectations
- [ ] IDs follow naming convention (FEATURE-##)
```

**Output:** PR merged or feedback provided

---

## Task States

```
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              │
┌─────────┐    ┌─────────┐    ┌──────────────┐    │
│ queued  │───►│ running │───►│awaiting-review│───┤
└─────────┘    └─────────┘    └──────────────┘    │
                    │                              │
                    │ preflight fail               │
                    ▼                              │
              ┌─────────┐                         │
              │  failed │◄────────────────────────┤
              └─────────┘     review rejected     │
                    │                              │
                    │ retry                        │
                    ▼                              │
              ┌─────────┐                         │
              │ queued  │ (with retryCount++)     │
              └─────────┘                         │
                                                  │
                              review approved     │
                                    │             │
                                    ▼             │
                              ┌───────────┐       │
                              │ completed │◄──────┘
                              └───────────┘
```

**State Definitions:**

| State | Description |
|-------|-------------|
| `queued` | Task waiting to be picked up |
| `running` | Implementor working on task |
| `awaiting-review` | PR created, waiting for reviewer |
| `completed` | PR merged, task done |
| `failed` | Task failed (retry limit or blocked) |

---

## Convex Schema Extensions

```typescript
// Extended taskQueue schema for DLOOP
defineTable({
  projectId: v.string(),
  type: v.union(
    v.literal("spec-proposal"),       // Adds/modifies SPEC.json only
    v.literal("spec-implementation"), // Implements a single spec
    v.literal("bugfix"),
    v.literal("design-system"),
    v.literal("tech-stack"),
    v.literal("schema")
  ),
  title: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("queued"),
    v.literal("running"),
    v.literal("awaiting-review"),
    v.literal("completed"),
    v.literal("failed")
  ),
  priority: v.number(),

  // Execution tracking
  assignedAgent: v.optional(v.string()),
  branchName: v.optional(v.string()),
  prNumber: v.optional(v.number()),
  prUrl: v.optional(v.string()),

  // Timestamps
  queuedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),

  // Retry handling
  retryCount: v.number(),
  maxRetries: v.number(),
  lastError: v.optional(v.string()),

  // Task relationships
  parentTaskId: v.optional(v.id("taskQueue")),  // Links impl tasks to their spec-proposal
  childTaskIds: v.optional(v.array(v.id("taskQueue"))),  // spec-proposal → impl tasks

  // Task-specific metadata
  metadata: v.object({
    // For spec-proposal tasks
    proposedSpecIds: v.optional(v.array(v.string())),
    featureId: v.optional(v.string()),
    featureName: v.optional(v.string()),
    specDetails: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      expectation: v.string(),
    }))),

    // For spec-implementation tasks
    specId: v.optional(v.string()),  // Single spec ID

    // Common metadata
    relatedFiles: v.optional(v.array(v.string())),
    relatedSpecIds: v.optional(v.array(v.string())),
    acceptanceCriteria: v.optional(v.array(v.string())),
    planPath: v.optional(v.string()),
  }),
})
```

### Auto-Creation of Implementation Tasks

When a `spec-proposal` PR is merged, the system automatically creates `spec-implementation` tasks:

```typescript
// Convex mutation: called when spec-proposal task completes
async function onSpecProposalMerged(ctx, { taskId, mergedSpecIds }) {
  const task = await ctx.db.get(taskId);
  const childTaskIds = [];

  // Create one implementation task per spec
  for (const specId of mergedSpecIds) {
    const implTaskId = await ctx.db.insert("taskQueue", {
      projectId: task.projectId,
      type: "spec-implementation",
      title: `Implement ${specId}`,
      description: `Implement the ${specId} behavior as defined in SPEC.json`,
      status: "queued",
      priority: task.priority + 1,  // Slightly lower priority than proposal
      parentTaskId: taskId,
      queuedAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        specId: specId,
        featureId: task.metadata.featureId,
      },
    });
    childTaskIds.push(implTaskId);
  }

  // Link parent to children
  await ctx.db.patch(taskId, { childTaskIds });
}
```

---

## Operating Modes

### Manual Mode (v1 default)
- User interacts with planner via chat
- User triggers implementor manually
- Reviewer agent runs on PR creation

### Autoloop Mode (future)
- Planner monitors for new issues/feedback automatically
- Implementor continuously polls queue
- Full autonomous development loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTOLOOP MODE (future)                       │
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌────────────┐           │
│  │ Planner  │────►│ Implementor  │────►│  Reviewer  │           │
│  │  (poll)  │     │   (loop)     │     │  (webhook) │           │
│  └──────────┘     └──────────────┘     └────────────┘           │
│       ▲                                       │                  │
│       │                                       │                  │
│       └───────────────────────────────────────┘                  │
│              feedback loop (new tasks from reviews)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Types

DLOOP emits structured events for monitoring:

| Event Type | Payload | When |
|------------|---------|------|
| `task_created` | `{ taskId, type, title }` | Planner creates task |
| `task_started` | `{ taskId, agentId }` | Implementor picks up task |
| `preflight_passed` | `{ taskId }` | Pre-flight checks pass |
| `preflight_failed` | `{ taskId, error }` | Pre-flight checks fail |
| `implementation_progress` | `{ taskId, step, details }` | Progress updates |
| `spec_updated` | `{ taskId, specIds, action }` | SPEC.json modified (spec-proposal) |
| `impl_tasks_created` | `{ parentTaskId, childTaskIds }` | Auto-created impl tasks |
| `verification_started` | `{ taskId }` | Verifier subagent spawned |
| `verification_passed` | `{ taskId }` | Verification succeeds |
| `verification_failed` | `{ taskId, error }` | Verification fails |
| `pr_created` | `{ taskId, prUrl, prNumber }` | PR created |
| `pr_reviewed` | `{ taskId, decision, feedback }` | Review complete |
| `pr_merged` | `{ taskId, prNumber }` | PR merged |
| `task_completed` | `{ taskId, duration }` | Task finished |
| `task_failed` | `{ taskId, error }` | Task failed permanently |

---

## Commands

### User Commands (via chat)

| Command | Description |
|---------|-------------|
| `/plan <description>` | Start planner to create tasks |
| `/queue` | Show current task queue |
| `/task <id>` | Show task details |
| `/implement` | Trigger implementor for next task |
| `/status` | Show overall DLOOP status |

### Script Commands

```bash
# Pre-flight check
./scripts/dloop-preflight.sh

# Start implementor for next task
./scripts/dloop-implement.sh

# Check queue status
./scripts/dloop-status.sh
```

---

## Summary

DLOOP v1 introduces a persistent, queue-driven development loop with specialized agents:

**Four-Agent Architecture:**
| Agent | Responsibility | Task Types |
|-------|---------------|------------|
| **Planner** | Create tasks from user requests | (creates all) |
| **Spec Manager** | Write specs to SPEC.json | `spec-proposal` |
| **Implementor** | Write code | `spec-implementation`, `bugfix`, etc. |
| **Reviewer** | Review and merge PRs | (reviews all) |

**Key Principles:**

1. **Single-responsibility agents** - Spec Manager writes specs, Implementor writes code
2. **Convex is the task queue** - All work items live in `taskQueue`
3. **GitHub is the spec source** - SPEC.json versioned in repo
4. **Spec-first development** - Specs are reviewed before implementation begins
5. **Single-task focus** - Each agent session handles one task
6. **Pre-flight verification** - Always ensure healthy state before work
7. **Fresh-context verification** - Subagent pattern for unbiased validation
8. **PR-based delivery** - All changes flow through review
9. **Automatic task chaining** - Merged spec-proposals auto-create implementation tasks

This architecture enables future autoloop-mode while maintaining human oversight in v1.
