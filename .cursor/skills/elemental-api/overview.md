# Elemental API Overview

The Elemental API provides access to the Lovelace Knowledge Graph through the Query Server. This document explains core concepts and guides you to the right endpoint documentation.

## Core Concepts

### Entities

Every entity has:

- **NEID** — a unique Named Entity ID (stable identifier)
- **Name** — human-readable label (may have aliases)
- **Flavor** — the entity type (e.g. "organization", "person", "country", "vessel", "event")

#### Named Entity ID (NEID)

Every entity in the system has a unique identifier called a NEID. Most API calls require a NEID, so your first step is usually looking up an entity by name to get its NEID.

**Format**: 20-character numeric string with zero-padding. Example: `00416400910670863867`

When normalizing NEIDs, always pad with leading zeros to exactly 20 characters.

NEIDs are stable and can be persisted long-term, but may occasionally change if the database is rebuilt or the application switches databases. When an NEID becomes invalid (e.g., resolution returns no results), re-resolve the entity using its canonical name from the previous query result, then redo any downstream operations that depended on it. NEIDs should NEVER be hardcoded in source code.

**Note**: The terms "eid" and "neid" are interchangeable throughout the API. Some endpoints use `neid` and others use `eid`, but they refer to the same entity identifier.

### Properties

Key-value facts attached to entities, scoped by flavor.

Examples: nationality, birth_date, industry, total_revenue, employee_count.

Use the schema to discover which properties are available for
a given entity type.

## Relationships

Directed, typed edges between two entities:

- **Type** — e.g. "owns", "board_member_of", "subsidiary_of", "appears_in"
- **Direction** — relationships go from source (subject) to target (object)

## Attributes

Metadata attached to relationships. For example, the "participant" relationship
connecting an entity to an event carries:

- **role** — the entity's role in the event (e.g. "acquirer", "target", "plaintiff")
- **sentiment** — an impact score for the entity's involvement

## Events

Structured occurrences extracted from source data, each with:

- **Category** — e.g. "Bankruptcy", "IPO", "Layoffs", "Acquisition"
- **Date** — when the event occurred (YYYY-MM-DD, or YYYY-MM / YYYY for partial dates)
- **Description** — detailed, objective description of the event
- **Likelihood** — temporal status: confirmed, ongoing, likely, or speculative
- **Participants** — entities involved, each with a role and sentiment score

## Endpoint Categories

| File                       | Use When You Need To...                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| [entities.md](entities.md) | Look up entities by name, get details and properties                                         |
| [find.md](find.md)         | Search for entities by type, property values, or relationships using the expression language |
| [schema.md](schema.md)     | Understand the data model: entity types (flavors), properties, and their metadata            |
| [graph.md](graph.md)       | Generate visual network graphs                                                               |
| [server.md](server.md)     | Check server status and capabilities                                                         |

## Common Workflows

### "Find all organizations in a specific sector"

1. `schema.md` → Check available properties and flavors
2. `find.md` → Use the expression language to search by property values

### "What companies are related to Apple?"

1. `entities.md` → Look up "Apple" to get NEID
2. `find.md` → Query linked entities to find related entities
