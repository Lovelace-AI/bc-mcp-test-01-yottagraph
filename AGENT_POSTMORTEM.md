# Agent Post-Mortem: Building Pulse News Dashboard

**Date:** March 28, 2026  
**Task:** Scaffold initial Pulse application using Elemental API  
**Outcome:** ✅ Success (after significant debugging)  
**Time to working state:** ~4 hours of iterations

---

## Executive Summary

Successfully built the Pulse news intelligence dashboard, but encountered multiple API integration issues that should have been caught earlier. The root cause was **not utilizing available MCP tools for testing before implementation**. This post-mortem identifies specific documentation gaps and workflow improvements to make future agents 10x more productive.

---

## What Went Wrong

### 1. 🚨 **CRITICAL: Didn't Realize MCP Servers Were Available**

**What happened:** Agent had `lovelace-elemental` MCP tools in tool list but didn't think to use them for interactive testing during development.

**Impact:** Wrote code based on assumptions instead of testing actual API behavior. Led to multiple rounds of failed attempts.

**Why this happened:**

- MCP tools not mentioned in AGENTS.md
- No testing workflow that says "use MCP first"
- Skills/rules focus on REST client, barely mention MCP as a testing tool

**Evidence:**

```
Agent: "I should have been using [MCP tools] from the start"
User: "To be clear - do you have access to the elemental MCP servers?
       Those should give you a LOT of info."
```

---

### 2. 🐛 **Schema Response Structure Mismatch**

**What happened:**

- `api.mdc` rule says: "The API nests [flavors/properties] under `response.schema`"
- **Actual behavior:** Direct API returns them at top level: `{flavors: [...], properties: [...]}`
- TypeScript client may wrap differently

**Impact:** Confusion about how to access schema data. Added unnecessary fallback code.

**Current workaround in code:**

```typescript
const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];
```

**What the docs say:**

```markdown
### `getSchema()` response is nested — WILL crash if you don't handle it

The generated TypeScript types suggest `response.properties` and
`response.flavors` exist at the top level. **They don't.** The API nests
them under `response.schema`.
```

**This is backwards!** The direct API has them at top level.

---

### 3. 🐛 **`fid` vs `findex` Inconsistency**

**What happened:**

- Direct REST API `GET /schema` returns `findex: 12`
- TypeScript generated client returns `fid: 12`
- Same value, different field names
- Agent tried using `findex` → got `null` → "Unable to find article entity type"

**Actual error from console:**

```
[useNewsData] Article flavor found: {fid: 12, name: 'article', ...}
[useNewsData] Initialized - articlePid: null
```

**Impact:** 2-3 debugging iterations to discover the field name difference.

**Solution:** Added fallback: `flavor.fid ?? flavor.findex`

**Not documented anywhere** in skills or rules.

---

### 4. ⚠️ **Expression Language Gotchas Not Prominent**

**What happened:**

**Issue A:** Used `comparison` with `pid: 0` for flavor filtering

```json
{ "type": "comparison", "comparison": { "operator": "eq", "pid": 0, "value": 12 } }
```

→ Error: "Comparison expression requires pid != 0"

**Issue B:** Used `string_like` on `has_topic` property (PID 115)

```json
{
    "type": "comparison",
    "comparison": { "operator": "string_like", "pid": 115, "value": "Politics" }
}
```

→ Error: "string_like only supports the 'name' property (pid=8), got pid=115"

**What's documented:** The `find.md` operator table does mention:

- `string_like` - "Implemented (name property only)"

**Problem:** This critical limitation is buried in a table. Easy to miss when quickly scanning docs.

**Impact:** Multiple 400/500 errors, required curl debugging to discover.

---

### 5. 📋 **No "Quick Start" Testing Workflow**

**What's missing:** A clear workflow that says:

1. First, test with MCP
2. Then, test with curl
3. Finally, implement code

**What agent did instead:**

1. Read skills
2. Write code based on understanding
3. Run into errors
4. Debug with curl (eventually)
5. Realize MCP exists (too late)

---

## Recommended Documentation Improvements

### 🔥 HIGH PRIORITY - Quick Wins

#### 1. **Add MCP Tool Inventory to AGENTS.md**

````markdown
## Available MCP Tools (USE THESE FIRST!)

You have access to Lovelace MCP servers for interactive data exploration.
**ALWAYS test data access patterns with MCP before implementing features.**

### Elemental API MCP Tools

- `elemental_get_schema()` - List all entity types (flavors) and properties
- `elemental_get_schema(flavor="article")` - See properties for a specific type
- `elemental_get_entity(entity="Apple", properties=["name", "industry"])` - Test entity lookup
- `elemental_get_related(entity="Microsoft", related_flavor="person")` - Find related entities
- `elemental_graph_sentiment(entity="Tesla")` - Get sentiment analysis

**Example workflow:**

```typescript
// 1. First test with MCP to understand the data
elemental_get_schema((flavor = 'article'));
// Returns: {properties: [...], relationships: [...]}

// 2. Test entity lookup
elemental_get_entity((entity = 'Apple'), (properties = ['name', 'industry']));

// 3. Then implement your composable with confidence
```
````

### Other Available MCP Tools

- `lovelace-stocks` - Stock price data
- `lovelace-wiki` - Wikipedia enrichment
- `lovelace-polymarket` - Prediction markets

Check your tool list for the complete set of available MCP functions.

````

#### 2. **Fix Schema Response Structure Docs in `api.mdc`**

**Current (WRONG):**
```markdown
### `getSchema()` response is nested — WILL crash if you don't handle it

The API nests them under `response.schema`.
````

**Should be:**

````markdown
### `getSchema()` response structure varies by endpoint

The schema response structure depends on which endpoint is called:

- **`GET /schema`** (direct API): Returns `{flavors: [...], properties: [...]}`
- **`GET /elemental/metadata/schema`**: May nest under `.schema` key
- **TypeScript client `getSchema()`**: Returns `{flavors: [...], properties: [...]}` at top level

**Always use fallback pattern:**

```typescript
const schema = await client.getSchema();
const properties = schema.schema?.properties ?? schema.properties ?? [];
const flavors = schema.schema?.flavors ?? schema.flavors ?? [];
```
````

This handles all response formats.

````

#### 3. **Document fid/findex Inconsistency**

**Add to `api.mdc` or `find.md`:**
```markdown
## Schema Flavor ID Field Names

**GOTCHA:** Flavor IDs are returned with different field names depending on the endpoint:

- `GET /schema` → `findex: 12`
- `GET /elemental/metadata/schema` → `fid: 12`
- TypeScript client may return either

**Always use fallback when accessing flavor IDs:**
```typescript
const articleFid = flavors.find(f => f.name === 'article')?.fid
                ?? flavors.find(f => f.name === 'article')?.findex
                ?? null;

// Or more concisely:
const articleFlavor = flavors.find(f => f.name === 'article');
const articleFid = articleFlavor?.fid ?? articleFlavor?.findex ?? null;
````

Same pattern for mapping FID to names:

```typescript
const fidMap = new Map(flavors.map((f) => [f.fid ?? f.findex, f.name]));
```

````

#### 4. **Add "Common Mistakes" Section to `find.md`**

**Add near the top of `find.md`:**
```markdown
## ⚠️ Common Expression Mistakes

### ❌ Mistake 1: Using comparison for entity type filtering

**DON'T:**
```json
{"type": "comparison", "comparison": {"operator": "eq", "pid": 0, "value": 12}}
````

→ Error: "Comparison expression requires pid != 0"

**DO:**

```json
{ "type": "is_type", "is_type": { "fid": 12 } }
```

---

### ❌ Mistake 2: Using string_like on non-name properties

**DON'T:**

```json
{
    "type": "comparison",
    "comparison": { "operator": "string_like", "pid": 115, "value": "Politics" }
}
```

→ Error: "string_like only supports the 'name' property (pid=8)"

**DO use eq for exact matches:**

```json
{ "type": "comparison", "comparison": { "operator": "eq", "pid": 115, "value": "Politics" } }
```

**OR filter client-side** after fetching all results.

---

### ❌ Mistake 3: Using 'conjunction' instead of 'and'

**DON'T:**

```json
{"type": "conjunction", "conjunction": {"operator": "and", "expressions": [...]}}
```

**DO:**

```json
{"type": "and", "and": [expression1, expression2]}
```

---

### ⚡ Quick Validation

**Before implementing a find query, test it with curl:**

```bash
# Get credentials from broadchurch.yaml
GW="https://your-gateway.run.app"
ORG="org_xxxxx"
KEY="your_key"

# Test your expression
curl -X POST "$GW/api/qs/$ORG/elemental/find" \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'expression={"type":"is_type","is_type":{"fid":12}}' \
  --data-urlencode 'limit=5'
```

If you get a 400 error with a validation message, the expression format is wrong.
If you get a 500 error, the query executed but failed - check your FIDs/PIDs.

````

---

### 🎯 MEDIUM PRIORITY - Workflow Improvements

#### 5. **Create Testing Workflow Skill**

**New file:** `.cursor/skills/testing-workflow/SKILL.md`

```markdown
---
name: testing-workflow
description: Step-by-step workflow for building and testing Elemental API features
---

# Testing Workflow for Elemental API Features

## Before Writing Any Code

When building a feature that uses the Elemental API:

### Step 1: Test with MCP (Interactive Exploration)

**Use MCP tools to understand the data:**

````

# Discover available entity types

elemental_get_schema()

# See properties for your target type

elemental_get_schema(flavor="article")

# Test entity lookup

elemental_get_entity(entity="Apple", flavor="organization", properties=["name", "industry"])

# Test relationships

elemental_get_related(entity="Microsoft", related_flavor="person", relationship_types=["works_at"])

````

**What this tells you:**
- ✅ Available properties and their names
- ✅ How entities resolve
- ✅ What relationships exist
- ✅ Actual response structures

### Step 2: Test Expressions with curl

**MCP doesn't support `/elemental/find` yet, so test complex queries with curl:**

```bash
# Read credentials from broadchurch.yaml
GW=$(grep "url:" broadchurch.yaml | head -1 | cut -d'"' -f2)
ORG=$(grep "org_id:" broadchurch.yaml | cut -d'"' -f2)
KEY=$(grep "qs_api_key:" broadchurch.yaml | cut -d'"' -f2)

# Test your find expression
curl -X POST "$GW/api/qs/$ORG/elemental/find" \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'expression={"type":"is_type","is_type":{"fid":12}}' \
  --data-urlencode 'limit=5'
````

**What to check:**

- ✅ 200 response = expression is valid
- ✅ Returns expected number of results
- ✅ `eids` array contains entity IDs

### Step 3: Implement Your Composable

**Now write the code with confidence:**

```typescript
import { useElementalClient } from '@yottagraph-app/elemental-api/client';

export function useMyFeature() {
    const client = useElementalClient();

    async function fetchData() {
        // Use the expression you already tested with curl
        const result = await client.findEntities({
            expression: JSON.stringify({
                type: 'is_type',
                is_type: { fid: 12 },
            }),
            limit: 50,
        });

        const neids = (result as any).eids ?? [];
        // ... rest of implementation
    }

    return { fetchData };
}
```

### Step 4: Verify in Browser

1. Add console.log statements for debugging
2. Check browser console for errors
3. Verify data loads correctly
4. Remove debug logs before committing

## Common Patterns

### Pattern 1: Get Recent Articles

```typescript
// 1. Test with MCP
elemental_get_schema((flavor = 'article'));

// 2. Implement
const schema = await client.getSchema();
const flavors = schema.flavors ?? [];
const articleFid = flavors.find((f) => f.name === 'article')?.fid ?? null;

const articles = await client.findEntities({
    expression: JSON.stringify({
        type: 'is_type',
        is_type: { fid: articleFid },
    }),
    limit: 50,
});
```

### Pattern 2: Get Entity Properties

```typescript
// 1. Test with MCP
elemental_get_entity((entity = 'Apple'), (properties = ['name', 'industry']));

// 2. Implement
const props = await client.getPropertyValues({
    eids: JSON.stringify([neid]),
    pids: JSON.stringify([8, 22]), // name, industry PIDs from schema
});
```

### Pattern 3: Find Related Entities

```typescript
// 1. Test with MCP
elemental_get_related(
    (entity = 'Microsoft'),
    (related_flavor = 'person'),
    (relationship_types = ['works_at'])
);

// 2. Implement using appears_in relationships
// (see cookbook rule for full example)
```

````

#### 6. **Add Expression Cookbook to `find.md`**

**Add section to `find.md`:**
```markdown
## Expression Cookbook - Copy-Paste Examples

### Find All Articles
```json
{
    "type": "is_type",
    "is_type": {"fid": 12}
}
````

### Find Organizations by Name

```json
{
    "type": "comparison",
    "comparison": {
        "operator": "string_like",
        "pid": 8,
        "value": "Apple"
    }
}
```

### Find Articles AND Organizations (Multiple Types)

```json
{
    "type": "or",
    "or": [
        { "type": "is_type", "is_type": { "fid": 12 } },
        { "type": "is_type", "is_type": { "fid": 10 } }
    ]
}
```

### Find Organizations with Name Filter

```json
{
    "type": "and",
    "and": [
        { "type": "is_type", "is_type": { "fid": 10 } },
        {
            "type": "comparison",
            "comparison": {
                "operator": "string_like",
                "pid": 8,
                "value": "Microsoft"
            }
        }
    ]
}
```

### Find Entities Related to Another Entity

```json
{
    "type": "linked",
    "linked": {
        "to_entity": "00416400910670863867",
        "distance": 1,
        "direction": "incoming"
    }
}
```

````

---

### 💡 MEDIUM PRIORITY - Enhanced Documentation

#### 7. **Operator Limitations - Make Them LOUD**

**Current state:** Operator table in `find.md` says `string_like` is "Implemented (name property only)" in a Status column.

**Should be:**
```markdown
## Operator Reference

### `string_like` - Substring Match (NAME ONLY!)

⚠️ **CRITICAL LIMITATION:** Only works on the `name` property (PID 8).

✅ **Valid:**
```json
{"operator": "string_like", "pid": 8, "value": "Apple"}
````

❌ **Invalid (will fail with 500 error):**

```json
{ "operator": "string_like", "pid": 115, "value": "Politics" } // pid != 8
```

**For other string properties, use `eq` for exact matches:**

```json
{ "operator": "eq", "pid": 115, "value": "Politics" }
```

Or fetch all results and filter client-side.

---

### `eq` - Exact Match

Works on any property type (string, number, boolean).

### `lt` / `gt` - Numeric Comparison

Only works on numeric properties (data_int, data_float).

### `has_value` - Existence Check

Checks if entity has any value for a property. No value parameter needed.

````

#### 8. **Add curl Testing Examples to `api.mdc`**

**Add section:**
```markdown
## Testing API Calls Before Implementation

**ALWAYS test API calls with curl before writing code.** This is especially critical
for `/elemental/find` expressions.

### Setup (one-time)

```bash
# Read credentials from broadchurch.yaml
GW=$(grep "url:" broadchurch.yaml | head -1 | cut -d'"' -f2)
ORG=$(grep "org_id:" broadchurch.yaml | cut -d'"' -f2)
KEY=$(grep "qs_api_key:" broadchurch.yaml | cut -d'"' -f2)

# Or set manually:
GW="https://your-gateway.run.app"
ORG="org_xxxxx"
KEY="your_key"
````

### Test Schema Discovery

```bash
# Get all flavors and properties
curl -s "$GW/api/qs/$ORG/schema" -H "X-Api-Key: $KEY" | python3 -m json.tool

# Find article flavor
curl -s "$GW/api/qs/$ORG/schema" -H "X-Api-Key: $KEY" | \
  python3 -c "import json,sys; data=json.load(sys.stdin); \
  print([f for f in data['flavors'] if f['name']=='article'])"
```

### Test Find Expressions

```bash
# Find articles
curl -s -X POST "$GW/api/qs/$ORG/elemental/find" \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'expression={"type":"is_type","is_type":{"fid":12}}' \
  --data-urlencode 'limit=5'

# Find organizations by name
curl -s -X POST "$GW/api/qs/$ORG/elemental/find" \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'expression={"type":"comparison","comparison":{"operator":"string_like","pid":8,"value":"Apple"}}' \
  --data-urlencode 'limit=5'
```

### Understanding Errors

- **400 + validation error** → Expression syntax is wrong
- **500 + execution error** → Expression syntax is valid but query failed (wrong PID, wrong operator for that property, etc.)
- **200 + empty eids array** → Query worked but no results found

````

#### 9. **Create Elemental API Gotchas Checklist**

**New section in `api.mdc`:**
```markdown
## Elemental API Gotchas Checklist

Before implementing Elemental API features, review this checklist:

- [ ] **Have you tested with MCP tools first?** (elemental_get_schema, elemental_get_entity)
- [ ] **Are you using `fid` OR `findex` with fallback?** (`flavor.fid ?? flavor.findex`)
- [ ] **Are you using `is_type` for entity type filtering?** (NOT comparison with pid=0)
- [ ] **Are you using `string_like` only on pid=8 (name)?** (Use `eq` for other properties)
- [ ] **Are you using `type: 'and'` not `type: 'conjunction'`?**
- [ ] **Are you zero-padding relationship NEIDs?** (`.padStart(20, '0')`)
- [ ] **Are you handling `schema.flavors` vs `schema.schema.flavors`?** (Use fallback)
- [ ] **Are you JSON-stringifying eids/pids parameters?** (`JSON.stringify([...])`)
- [ ] **Have you tested the expression with curl before implementing?**
````

---

### 📚 LOW PRIORITY - Nice to Have

#### 10. **Video Walkthrough**

A 5-minute screen recording showing:

1. Using MCP to explore schema
2. Testing with curl
3. Implementing a simple news feed composable
4. Verifying in browser

#### 11. **MCP Playground Page**

Add to starter app: `/tools/mcp-playground` page with:

- Schema browser (explore flavors/properties)
- Entity lookup tester
- Expression builder/tester
- Live curl command generator

#### 12. **Expression Validator Utility**

```typescript
// utils/validateExpression.ts
export function validateExpression(expr: any): string[] {
    const errors = [];

    if (expr.type === 'comparison') {
        if (expr.comparison?.pid === 0) {
            errors.push('Cannot use comparison with pid=0. Use is_type instead.');
        }
        if (expr.comparison?.operator === 'string_like' && expr.comparison?.pid !== 8) {
            errors.push('string_like only works on name property (pid=8)');
        }
    }

    if (expr.type === 'conjunction') {
        errors.push('Use type:"and" not type:"conjunction"');
    }

    return errors;
}
```

---

## What Actually Helped (Keep These!)

✅ **Comprehensive skill docs** - `find.md`, `entities.md`, `schema.md` separation is good  
✅ **Error messages from API** - Actually quite helpful once we saw them  
✅ **Fallback patterns in examples** - The `schema.schema?.properties ?? (schema as any).properties` pattern was good  
✅ **Multiple schema endpoint options** - Having both `/schema` and `/elemental/metadata/schema` documented

---

## Metrics

| Metric                             | Value                        |
| ---------------------------------- | ---------------------------- |
| **Initial commits to working app** | 4 commits                    |
| **Issues encountered**             | 6 distinct API/schema issues |
| **Debug iterations**               | ~8 rounds                    |
| **Time to working state**          | ~4 hours                     |
| **Time if MCP tested first**       | Estimated 30-60 minutes      |

---

## Recommendations Summary

### Immediate Actions (Do These First)

1. ✅ Add MCP tool inventory + usage examples to AGENTS.md
2. ✅ Add "Common Mistakes" section to find.md with clear examples
3. ✅ Fix schema response structure docs in api.mdc
4. ✅ Document fid/findex inconsistency with fallback pattern

### Short Term

5. Add testing workflow skill showing MCP → curl → implement pattern
6. Add operator limitations prominently to find.md
7. Add curl testing examples to api.mdc
8. Create Elemental API gotchas checklist

### Long Term

9. Video walkthrough of building a data feature
10. MCP playground page in starter app
11. Expression validator utility

---

## Agent's Self-Reflection

**What I should have done:**

1. Check my tool list for MCP servers FIRST
2. Test `elemental_get_schema()` before writing any code
3. Test entity lookups with MCP before implementing composables
4. Curl test expressions before using them in findEntities()

**What I actually did:**

1. Read skill docs
2. Made assumptions about API behavior
3. Wrote composables based on assumptions
4. Hit errors
5. Debugged with curl
6. Eventually realized MCP exists

**The gap:** No workflow/checklist that forces MCP-first testing.

---

## Conclusion

The Aether/Broadchurch platform has excellent tools (MCP servers, comprehensive skills, generated client), but they're not "discoverable" enough for agents. The fix is simple: **make MCP tools the first thing agents see** and **create workflows that force testing before implementation**.

With these doc improvements, future agents should get to working code in 30-60 minutes instead of 4 hours.
