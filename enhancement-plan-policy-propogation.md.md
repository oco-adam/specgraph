# **Spec Graph v1.0 Enhancement Plan: Agent-Native Decisions, Policies, and Propagation (Revised)**

This document outlines structural and semantic improvements to Spec Graph. The goal is to strengthen agent guidance while preserving schema minimality, avoiding redundant fields, and formalizing edge semantics that scale.

## **1. Upgrading Decision Nodes to Micro-ADRs (Without Top-Level Duplication)**

**The Problem:** Decision nodes capture _what_ was chosen, but rationale ("why") is not uniformly enforced. Without this context, an agent may propose previously rejected architectural paths.  
**Design Constraint:** Spec Graph should not duplicate meaning across top-level and metadata fields.  
**The Solution:** Keep rationale in `metadata`, require it for `decision` nodes, and track optional `metadata.rejected_alternatives`.

### **Schema Modifications (`node.schema.json`)**

1. Update metadata description so it reflects reality: metadata is non-executable context, but node-type rules may require specific metadata fields.
2. Extend `metadata.properties` with a structured `rejected_alternatives` field.
3. Update the `decision` `allOf` branch to require `metadata` and `metadata.rationale` (plus existing `category`), with minimum quality thresholds.

```json
{
  "metadata": {
    "type": "object",
    "description": "Non-executable context. Some fields may be required by type-specific rules.",
    "additionalProperties": true,
    "properties": {
      "rationale": { "type": "string" },
      "notes": { "type": "string" },
      "owner": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "rejected_alternatives": {
        "type": "array",
        "description": "Approaches considered and explicitly rejected.",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": ["title", "reason"],
          "properties": {
            "title": { "type": "string", "minLength": 3 },
            "reason": { "type": "string", "minLength": 10 }
          }
        }
      }
    }
  }
}
```

```json
{
  "if": { "properties": { "type": { "const": "decision" } }, "required": ["type"] },
  "then": {
    "required": ["category", "metadata"],
    "properties": {
      "metadata": {
        "type": "object",
        "required": ["rationale"],
        "properties": {
          "rationale": { "type": "string", "minLength": 10 }
        }
      }
    }
  },
  "else": { "not": { "required": ["category"] } }
}
```

### **Exact Documentation Wording**

**Decision Nodes (Micro-ADRs)**  
A decision node captures architectural, technical, or design choices.  
To prevent regressions, every decision node **must** include `metadata.rationale`. Decision nodes **should** include `metadata.rejected_alternatives` when trade-offs were evaluated.  
While metadata is non-executable for build tooling, agents must treat `metadata.rationale` and `metadata.rejected_alternatives` as critical historical context during context assembly.

## **2. Evolving Policy Nodes into Evaluable Constraints**

**The Problem:** Policies without strictness and verification behavior are too weak for reliable manifestation.  
**The Solution:** Keep policy nodes explicitly evaluable and blocking semantics explicit.

### **Schema Modifications (`node.schema.json`)**

- Require `severity` for `policy` nodes.
- Do **not** add an additional policy-only `verification` requirement: `verification` is already required globally for all contract nodes.

```json
{
  "if": { "properties": { "type": { "const": "policy" } }, "required": ["type"] },
  "then": { "required": ["severity"] },
  "else": { "not": { "required": ["severity"] } }
}
```

### **Exact Documentation Wording**

**Policy Nodes (Evaluable Constraints)**  
A policy node defines a hard boundary or non-functional requirement (security, performance, accessibility, reliability, cost).  
Every policy node **must** define `severity` (`hard` or `soft`) and a verifiable check.  
`hard` policy failures block manifestation; `soft` policy failures produce warnings.

## **3. Edge Semantics and Transitive Propagation (Crucial)**

**The Problem:** Authors may attach the same policy to many leaf nodes, causing graph clutter and high maintenance overhead.  
**The Solution:** Define explicit transitive propagation semantics for `constrains` across `contains`.

### **Operational Rules of Propagation**

No schema change is required; this is a specification and tooling rule.

1. **Downward Cascading (Inheritance Rule):**  
   If `A constrains B`, and `B contains C`, then `A` implicitly constrains `C` (transitively across nested `contains`).
2. **Upward Isolation (Boundary Rule):**  
   Constraints do not propagate upward from child to parent.
3. **Dependency Governance:**  
   `depends_on` does not propagate constraints. If `X depends_on Y` and `Y` is constrained by `Z`, `X` does not inherit `Z` automatically.
4. **Multi-Parent Union:**  
   If a node is contained by multiple ancestors, inherited constraints are the union from all ancestry paths.
5. **Conflict Handling:**  
   Constraint sets are additive. For policy strictness conflicts over the same requirement, `hard` overrides `soft`. Contradictory `hard` constraints should be surfaced as validation/tooling errors.
6. **Traversal Safety:**  
   Tooling must evaluate propagation with cycle-safe traversal (`visited` sets) to avoid infinite walks when non-`depends_on` cycles exist.

### **Exact Documentation Wording**

**Edge Semantics: Transitive Propagation and Constraint Cascading**  
To keep the graph minimal, Spec Graph allows constraints to cascade downward through `contains`.  
You should attach policies and decisions at the highest applicable node, then rely on transitive propagation for descendants.  
Propagation applies through grouping (`contains`), not dependency (`depends_on`), and inheritance results are unioned across multiple containment paths.

## **4. Clarifying Inline `constraints` vs Policy Nodes**

**The Problem:** Authors can misapply inline `constraints` where reusable `policy` nodes are more appropriate.  
**The Solution:** Reinforce a strict authoring rule in schema descriptions and docs.

### **Schema Modification (`node.schema.json`)**

Update `constraints` description in both `behaviorNode` and `contractNode`:

```json
{
  "constraints": {
    "type": "array",
    "description": "Localized normative conditions for this node only. For shared or cross-cutting rules, create a separate policy node and connect it via constrains edges.",
    "items": { "type": "string", "minLength": 1 },
    "default": []
  }
}
```

### **Exact Documentation Wording**

**When to Use Inline Constraints vs Policy Nodes**  
Spec Graph supports both inline node-local constraints and reusable policy nodes:

- **Use Inline Constraints** for localized rules unique to one node (e.g., `"Password input must cap at 64 characters"`).
- **Use Policy Nodes** for cross-cutting rules reused across multiple nodes (e.g., `"All user input must be sanitized"`), with independent verification and severity handling.

## **5. Tooling and Rollout Notes**

1. Update context assembly guidance so decision metadata is always loaded for agent reasoning.
2. Add schema tests for decision nodes missing `metadata.rationale`.
3. Add propagation tests for multi-level contains chains, multi-parent nodes, and conflict handling.
