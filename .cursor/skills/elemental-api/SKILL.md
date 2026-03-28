---
name: elemental-api
description: Query the Elemental API for entity discovery, search, and metadata. Use with the Lovelace News Query Server.
---

# Elemental API

This skill provides documentation for the Lovelace Elemental API, the primary interface for querying the Lovelace Knowledge Graph.

## When to Use This Skill

Use this skill when you need to:

- Look up entities (companies, people, organizations) by name or ID
- Search for entities by type, property values, or relationships using the expression language
- Get entity metadata (types/flavors, properties)
- Build knowledge graphs of entity networks

## Quick Start

1. **Find an entity**: Use `entities.md` to look up a company or person by name and get their NEID (Named Entity ID)
2. **Get information**: Use the NEID to query entity properties or explore the graph
3. **Search**: Use `find.md` for expression-based entity searches

## Files in This Skill

See [overview.md](overview.md) for descriptions of each endpoint category:

- `entities.md` - Entity search, details, and properties
- `find.md` - Expression language for searching entities by type, property values, and relationships
- `schema.md` - Data model: entity types (flavors), properties, and schema endpoints
- `graph.md` - Visual graph generation
- `server.md` - Server status and health
