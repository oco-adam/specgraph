


Below is a **minimal-but-complete** set of JSON Schemas for the “edges live inside each node file” SpecGraph approach, plus schemas for the other JSON files you’ll likely want (index + optional generated index + optional lockfile).

I’m keeping **behavior and feature IDs compatible with the existing `SPEC.json` conventions** so you can project back to v2 cleanly using the existing `spec.schema.json`.  The behavior-writing discipline (ONE rule, etc.) still applies to `behavior` nodes.  And the overall loop stays consistent with DLOOP’s “GitHub repo as spec source of truth” workflow. 

---

## Files this set covers

### Required

1. `specgraph/graph.json`
2. `specgraph/nodes/**/*.json` (one file per node)

### Optional but recommended

3. `specgraph/graph.index.json` (generated adjacency list for fast tooling)
4. `specgraph/manifest.lock.json` (pins artifact hashes + toolchain metadata for re-manifestation)

### Existing (reused)

* `SPEC.json` keeps using your current `spec.schema.json`. 

---

## 1) `specgraph/graph.schema.json` (schema for `specgraph/graph.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://dloop.dev/specgraph/graph.schema.json",
  "title": "SpecGraph Graph Index",
  "description": "Entry-point index for a SpecGraph. Canonical membership and paths for node files. Edges are defined inside each node file.",
  "type": "object",
  "required": ["specgraphVersion", "nodes"],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string",
      "description": "Path/URL to this schema for editor validation."
    },
    "specgraphVersion": {
      "type": "string",
      "description": "SpecGraph schema/version for this graph.json file.",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z-.]+)?$",
      "examples": ["2.0.0", "2.1.0-beta.1"]
    },
    "root": {
      "type": "string",
      "description": "Optional: root node id (commonly an equivalence_contract node).",
      "minLength": 1
    },
    "nodeSearchPaths": {
      "type": "array",
      "description": "Optional: additional directories to scan for nodes. If omitted, tooling should rely on nodes[].path.",
      "items": { "$ref": "#/definitions/relativeJsonPath" }
    },
    "nodes": {
      "type": "array",
      "description": "Canonical list of nodes and their file paths (relative).",
      "minItems": 1,
      "items": { "$ref": "#/definitions/nodeRef" }
    },
    "projections": {
      "type": "object",
      "description": "Optional: configuration for generated projections (e.g., SPEC.json).",
      "additionalProperties": false,
      "properties": {
        "specJson": { "$ref": "#/definitions/specJsonProjection" }
      }
    },
    "defaults": {
      "type": "object",
      "description": "Optional defaults for tooling.",
      "additionalProperties": false,
      "properties": {
        "defaultNodeStatus": {
          "type": "string",
          "enum": ["draft", "proposed", "approved", "deprecated", "rejected"],
          "description": "Default status assigned by tooling if omitted (schema still requires status on nodes)."
        }
      }
    }
  },
  "definitions": {
    "relativeJsonPath": {
      "type": "string",
      "description": "Relative path to a .json file (POSIX style). Disallows absolute paths and parent traversal.",
      "pattern": "^(?!/)(?!.*\\.{2}/)[A-Za-z0-9._/-]+\\.json$",
      "examples": ["nodes/BEHAV/AUTH-01.json", "nodes/ARCH/ARCH-DEC-01.json"]
    },
    "sha256": {
      "type": "string",
      "description": "Hex-encoded SHA-256 digest.",
      "pattern": "^[A-Fa-f0-9]{64}$"
    },
    "nodeRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "path"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Node ID (must match the node file's id). Referential integrity is enforced by tooling.",
          "minLength": 1,
          "maxLength": 80
        },
        "path": { "$ref": "#/definitions/relativeJsonPath" },
        "sha256": {
          "$ref": "#/definitions/sha256",
          "description": "Optional: content hash of the node file for tamper detection or caching."
        },
        "expectedType": {
          "type": "string",
          "description": "Optional: expected node.type (tooling can validate this quickly).",
          "minLength": 1
        }
      }
    },
    "specJsonProjection": {
      "type": "object",
      "additionalProperties": false,
      "required": ["enabled", "outPath"],
      "properties": {
        "enabled": { "type": "boolean" },
        "outPath": {
          "type": "string",
          "description": "Where tooling writes the projected SPEC.json.",
          "pattern": "^(?!/)(?!.*\\.{2}/)[A-Za-z0-9._/-]+\\.json$",
          "examples": ["projections/SPEC.json"]
        },
        "schemaPath": {
          "type": "string",
          "description": "Optional: path to the SPEC.json schema used for editor validation.",
          "examples": ["../spec.schema.json", "./spec.schema.json"]
        },
        "featureSort": {
          "type": "string",
          "enum": ["id", "name", "none"],
          "description": "How to sort features in the projected SPEC.json."
        },
        "behaviorSort": {
          "type": "string",
          "enum": ["id", "name", "none"],
          "description": "How to sort behaviors in the projected SPEC.json."
        }
      }
    }
  }
}
```

---

## 2) `specgraph/node.schema.json` (schema for **every node file**)

This is the “big one”: it supports `feature`, `behavior` (DLOOP-compatible), plus “generic contract nodes” and a couple of structured special nodes.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://dloop.dev/specgraph/node.schema.json",
  "title": "SpecGraph Node",
  "description": "Schema for a single SpecGraph node file. Edges are expressed as outbound links under links.*.",
  "oneOf": [
    { "$ref": "#/definitions/featureNode" },
    { "$ref": "#/definitions/behaviorNode" },
    { "$ref": "#/definitions/artifactNode" },
    { "$ref": "#/definitions/manifestorProfileNode" },
    { "$ref": "#/definitions/manifestationPipelineNode" },
    { "$ref": "#/definitions/genericContractNode" }
  ],
  "definitions": {
    "nodeId": {
      "type": "string",
      "description": "General node identifier used for cross-node references. Tooling enforces referential integrity.",
      "minLength": 1,
      "maxLength": 80,
      "pattern": "^[A-Z][A-Za-z0-9:_-]{0,79}$",
      "examples": ["AUTH-01", "AUTH", "ARCH-DEC-01", "EQ-CONTRACT-01", "ART-DESIGNTOKENS-01"]
    },
    "status": {
      "type": "string",
      "enum": ["draft", "proposed", "approved", "deprecated", "rejected"],
      "description": "Lifecycle status used by planning/manifestation gates."
    },
    "sha256": {
      "type": "string",
      "description": "Hex-encoded SHA-256 digest.",
      "pattern": "^[A-Fa-f0-9]{64}$"
    },
    "links": {
      "type": "object",
      "description": "Outbound typed edges from this node to other nodes (by id).",
      "additionalProperties": false,
      "properties": {
        "contains": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "depends_on": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "constrains": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "derived_from": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "verified_by": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "supersedes": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        },
        "implements": {
          "type": "array",
          "items": { "$ref": "#/definitions/nodeId" }
        }
      }
    },
    "verificationEntry": {
      "description": "A single pass/fail verification. Keep checks small and deterministic; use tooling to aggregate.",
      "oneOf": [
        {
          "type": "string",
          "minLength": 1,
          "description": "Shorthand verification string (e.g., a command)."
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["kind"],
          "properties": {
            "kind": {
              "type": "string",
              "enum": ["command", "http", "manual", "observation", "policy"]
            },
            "command": {
              "type": "string",
              "minLength": 1,
              "description": "Shell command to run (kind=command)."
            },
            "cwd": {
              "type": "string",
              "minLength": 1,
              "description": "Optional working directory for the command."
            },
            "env": {
              "type": "object",
              "description": "Optional environment variables for the command.",
              "additionalProperties": { "type": "string" }
            },
            "timeoutSeconds": {
              "type": "integer",
              "minimum": 1,
              "maximum": 3600
            },

            "method": {
              "type": "string",
              "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
              "description": "HTTP method (kind=http)."
            },
            "url": {
              "type": "string",
              "minLength": 1,
              "description": "URL (kind=http)."
            },
            "expectStatus": {
              "type": "integer",
              "minimum": 100,
              "maximum": 599,
              "description": "Expected status code (kind=http)."
            },

            "steps": {
              "type": "array",
              "items": { "type": "string", "minLength": 1 },
              "minItems": 1,
              "description": "Manual steps (kind=manual)."
            },
            "expected": {
              "type": "string",
              "minLength": 1,
              "description": "Expected result (kind=manual/observation)."
            },

            "description": {
              "type": "string",
              "minLength": 1,
              "description": "Observation/policy description."
            },
            "ruleId": {
              "type": "string",
              "minLength": 1,
              "description": "Policy rule identifier (kind=policy)."
            }
          },
          "allOf": [
            {
              "if": { "properties": { "kind": { "const": "command" } }, "required": ["kind"] },
              "then": { "required": ["command"] }
            },
            {
              "if": { "properties": { "kind": { "const": "http" } }, "required": ["kind"] },
              "then": { "required": ["method", "url", "expectStatus"] }
            },
            {
              "if": { "properties": { "kind": { "const": "manual" } }, "required": ["kind"] },
              "then": { "required": ["steps"] }
            },
            {
              "if": { "properties": { "kind": { "const": "observation" } }, "required": ["kind"] },
              "then": { "required": ["description"] }
            },
            {
              "if": { "properties": { "kind": { "const": "policy" } }, "required": ["kind"] },
              "then": { "required": ["ruleId"] }
            }
          ]
        }
      ]
    },
    "metadata": {
      "type": "object",
      "description": "Non-normative context. Tooling should never treat metadata as a requirement unless explicitly referenced by a normative field.",
      "additionalProperties": true,
      "properties": {
        "rationale": { "type": "string" },
        "notes": { "type": "string" },
        "owner": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    },

    "featureNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "name", "description", "status"],
      "properties": {
        "$schema": { "type": "string" },
        "id": {
          "type": "string",
          "description": "Feature ID (compatible with SPEC.json feature.id).",
          "pattern": "^[A-Z]{2,20}$"
        },
        "type": { "const": "feature" },
        "name": { "type": "string", "minLength": 3, "maxLength": 100 },
        "description": { "type": "string", "minLength": 1 },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "verification": {
          "type": "array",
          "description": "Optional checks for the feature grouping node (usually empty).",
          "items": { "$ref": "#/definitions/verificationEntry" }
        },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    },

    "behaviorNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "name", "expectation", "invariant", "verification", "status"],
      "properties": {
        "$schema": { "type": "string" },
        "id": {
          "type": "string",
          "description": "Behavior ID (compatible with SPEC.json behaviors[].id).",
          "pattern": "^[A-Z]{2,20}-\\d{2}[a-z]?$"
        },
        "type": { "const": "behavior" },
        "name": { "type": "string", "minLength": 3, "maxLength": 100 },
        "expectation": {
          "type": "string",
          "description": "WHAT the system does (not HOW). Should remain atomic (ONE rule).",
          "minLength": 10
        },
        "invariant": {
          "type": "string",
          "description": "Hard constraint or 'None'.",
          "minLength": 1
        },
        "verification": {
          "type": "string",
          "description": "Single pass/fail check. Prefer executable commands.",
          "minLength": 5
        },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    },

    "artifactNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "title", "statement", "status", "verification", "artifact"],
      "properties": {
        "$schema": { "type": "string" },
        "id": { "$ref": "#/definitions/nodeId" },
        "type": { "const": "artifact" },
        "title": { "type": "string", "minLength": 3, "maxLength": 140 },
        "statement": { "type": "string", "minLength": 1 },
        "constraints": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "verification": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/verificationEntry" }
        },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "artifact": {
          "type": "object",
          "additionalProperties": false,
          "required": ["source", "sha256", "format"],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "description": "Where the artifact comes from (URL/URI)."
            },
            "sha256": { "$ref": "#/definitions/sha256" },
            "format": {
              "type": "string",
              "minLength": 1,
              "description": "Artifact format identifier (e.g., tokens-studio-json)."
            },
            "mediaType": {
              "type": "string",
              "minLength": 1,
              "description": "Optional media type (e.g., application/json)."
            }
          }
        },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    },

    "manifestorProfileNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "title", "statement", "status", "verification", "profile"],
      "properties": {
        "$schema": { "type": "string" },
        "id": { "$ref": "#/definitions/nodeId" },
        "type": { "const": "manifestor_profile" },
        "title": { "type": "string", "minLength": 3, "maxLength": 140 },
        "statement": { "type": "string", "minLength": 1 },
        "constraints": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "verification": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/verificationEntry" }
        },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "profile": {
          "type": "object",
          "additionalProperties": false,
          "required": ["agents"],
          "properties": {
            "agents": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["role", "model"],
                "properties": {
                  "role": {
                    "type": "string",
                    "minLength": 1,
                    "description": "e.g., planner, spec_manager, implementor, reviewer"
                  },
                  "model": { "type": "string", "minLength": 1 },
                  "toolsAllowed": {
                    "type": "array",
                    "items": { "type": "string", "minLength": 1 }
                  },
                  "policies": {
                    "type": "array",
                    "items": { "type": "string", "minLength": 1 }
                  }
                }
              }
            },
            "toolchain": {
              "type": "object",
              "description": "Optional pinned toolchain versions (can also go in manifest.lock.json).",
              "additionalProperties": { "type": "string" }
            }
          }
        },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    },

    "manifestationPipelineNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "title", "statement", "status", "verification", "steps"],
      "properties": {
        "$schema": { "type": "string" },
        "id": { "$ref": "#/definitions/nodeId" },
        "type": { "const": "manifestation_pipeline" },
        "title": { "type": "string", "minLength": 3, "maxLength": 140 },
        "statement": { "type": "string", "minLength": 1 },
        "constraints": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "verification": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/verificationEntry" }
        },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "kind", "description"],
            "properties": {
              "id": {
                "type": "string",
                "pattern": "^[A-Z0-9][A-Z0-9_-]{0,39}$",
                "description": "Step identifier (local to this pipeline)."
              },
              "kind": {
                "type": "string",
                "enum": ["validate", "plan", "implement", "verify", "release", "record"],
                "description": "Canonical pipeline step kind."
              },
              "description": { "type": "string", "minLength": 1 },
              "requiresNodes": {
                "type": "array",
                "items": { "$ref": "#/definitions/nodeId" },
                "description": "Optional: nodes that must be approved/satisfied before this step."
              }
            }
          }
        },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    },

    "genericContractNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "title", "statement", "status", "verification"],
      "properties": {
        "$schema": { "type": "string" },
        "id": { "$ref": "#/definitions/nodeId" },
        "type": {
          "type": "string",
          "enum": [
            "domain_term",
            "business_rule",
            "policy",
            "design_token",
            "ui_component_contract",
            "ux_rule",
            "stack",
            "dependency",
            "architecture_decision",
            "module_boundary",
            "interface_contract",
            "data_model",
            "api_contract",
            "infra_resource",
            "observability_contract",
            "security_constraint",
            "performance_budget",
            "equivalence_contract",
            "test_strategy"
          ]
        },
        "title": { "type": "string", "minLength": 3, "maxLength": 140 },
        "statement": { "type": "string", "minLength": 1 },
        "constraints": {
          "type": "array",
          "description": "Normative invariants/constraints for this node.",
          "items": { "type": "string", "minLength": 1 }
        },
        "verification": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/verificationEntry" }
        },
        "status": { "$ref": "#/definitions/status" },
        "links": { "$ref": "#/definitions/links" },
        "metadata": { "$ref": "#/definitions/metadata" }
      }
    }
  }
}
```

---

## 3) `specgraph/graph.index.schema.json` (optional schema for generated `graph.index.json`)

If you generate a flattened edge list for faster tooling, validate it with this.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://dloop.dev/specgraph/graph.index.schema.json",
  "title": "SpecGraph Generated Index",
  "description": "Optional generated adjacency index (flattened edges) derived from node links.",
  "type": "object",
  "required": ["specgraphVersion", "generatedFrom", "edges"],
  "additionalProperties": false,
  "properties": {
    "$schema": { "type": "string" },
    "specgraphVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z-.]+)?$"
    },
    "generatedFrom": {
      "type": "object",
      "additionalProperties": false,
      "required": ["graphPath"],
      "properties": {
        "graphPath": {
          "type": "string",
          "pattern": "^(?!/)(?!.*\\.{2}/)[A-Za-z0-9._/-]+\\.json$"
        },
        "graphSha256": {
          "type": "string",
          "pattern": "^[A-Fa-f0-9]{64}$"
        }
      }
    },
    "edges": {
      "type": "array",
      "minItems": 0,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["from", "type", "to"],
        "properties": {
          "from": { "type": "string", "minLength": 1, "maxLength": 80 },
          "type": {
            "type": "string",
            "enum": [
              "contains",
              "depends_on",
              "constrains",
              "derived_from",
              "verified_by",
              "supersedes",
              "implements"
            ]
          },
          "to": { "type": "string", "minLength": 1, "maxLength": 80 }
        }
      }
    }
  }
}
```

---

## 4) `specgraph/manifest.lock.schema.json` (optional schema for `manifest.lock.json`)

This is the piece that makes “re-manifestation” much more predictable: it records *what graph* was manifested, *with what artifacts/toolchain*, and *which equivalence contract* was used.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://dloop.dev/specgraph/manifest.lock.schema.json",
  "title": "SpecGraph Manifest Lockfile",
  "description": "Optional lockfile capturing the exact inputs/tooling used to manifest a system from a SpecGraph.",
  "type": "object",
  "required": ["specgraphVersion", "graph", "manifestedAt", "equivalenceContractId"],
  "additionalProperties": false,
  "properties": {
    "$schema": { "type": "string" },
    "specgraphVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z-.]+)?$"
    },
    "graph": {
      "type": "object",
      "additionalProperties": false,
      "required": ["path", "sha256"],
      "properties": {
        "path": {
          "type": "string",
          "pattern": "^(?!/)(?!.*\\.{2}/)[A-Za-z0-9._/-]+\\.json$"
        },
        "sha256": {
          "type": "string",
          "pattern": "^[A-Fa-f0-9]{64}$"
        }
      }
    },
    "manifestedAt": {
      "type": "string",
      "description": "ISO 8601 timestamp.",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$"
    },
    "equivalenceContractId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "description": "Node id of the equivalence_contract used as the definition of 'same system'."
    },
    "manifestorProfileId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "description": "Optional node id of the manifestor_profile used."
    },
    "toolchain": {
      "type": "object",
      "description": "Pinned versions / identifiers for the toolchain used to manifest (optional but recommended).",
      "additionalProperties": false,
      "properties": {
        "node": { "type": "string" },
        "npm": { "type": "string" },
        "pnpm": { "type": "string" },
        "yarn": { "type": "string" },
        "os": { "type": "string" },
        "git": { "type": "string" }
      }
    },
    "artifacts": {
      "type": "array",
      "description": "Resolved artifacts and their hashes at manifest time.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "sha256"],
        "properties": {
          "id": { "type": "string", "minLength": 1, "maxLength": 80 },
          "sha256": { "type": "string", "pattern": "^[A-Fa-f0-9]{64}$" },
          "source": { "type": "string" },
          "format": { "type": "string" }
        }
      }
    },
    "checks": {
      "type": "array",
      "description": "Optional record of verification checks executed as part of manifestation.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["check", "status"],
        "properties": {
          "check": { "type": "string", "minLength": 1 },
          "status": { "type": "string", "enum": ["pass", "fail", "skipped"] },
          "outputSha256": {
            "type": "string",
            "pattern": "^[A-Fa-f0-9]{64}$",
            "description": "Optional hash of captured output/logs for determinism/auditing."
          }
        }
      }
    }
  }
}
```

---

## Notes on compatibility with existing DLOOP specs

* `behavior` and `feature` nodes are intentionally aligned so you can generate `SPEC.json` and validate it with your existing `spec.schema.json`. 
* The *writing rules* (ONE rule, “WHAT not HOW”) remain enforced at the agent/tooling layer for behavior nodes. 
* The “multi-dimensional spec graph” part is achieved by adding additional node types (architecture decisions, stack contracts, artifacts, etc.), without losing the existing behavior-centric workflow. 

---

If you want, I can also provide a **small “specgraph lint ruleset”** (non-schema) that enforces the things JSON Schema can’t (e.g., “all referenced IDs exist”, “depends_on is acyclic”, “behavior IDs don’t collide with architecture IDs”, “feature contains only behaviors”, etc.).

