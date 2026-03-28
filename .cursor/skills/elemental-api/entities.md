# Entities

Entities are the core objects in the Knowledge Graph: companies, people, organizations, products, and other named things that appear in the news. Each entity has a unique **Named Entity ID (NEID)**.

NEIDs are stable and can be persisted long-term, but may occasionally change if the database is rebuilt or the application switches databases. When an NEID becomes invalid (e.g., resolution returns no results), re-resolve the entity using its canonical name from the previous query result, then redo any downstream operations that depended on it. NEIDs should NEVER be hardcoded in source code.

**Looking for property-based search?** To search for entities by type, property values, or relationships using the expression language, see [find.md](find.md).

## When to Use

- You have an entity name and need to find its NEID
- You have a NEID and need the entity's display name or details
- You're starting a new query and need to identify the subject
- You need entity metadata (industry, location, ticker, etc.)

## Key Concepts

- **NEID**: A unique identifier for each entity. Required for most other API calls.
    - Format: 20-character numeric string with zero-padding
    - Example: `00416400910670863867`
    - Always pad with leading zeros to exactly 20 characters when normalizing
- **EID**: The term EID is sometimes used interchangeably with NEID.
- **nindex**: The term nindex is sometimes used interchangeably with NEID.
- **Entity Resolution**: The same real-world entity may have multiple names (e.g., "Apple", "Apple Inc.", "AAPL"). The API resolves these to a single NEID.
- **Flavors (Entity Types)**: Each entity has a type identified by a Flavor ID (FID).

## Tips

- Always start by searching for the entity to get the correct NEID
- After resolving an entity to an NEID, save and use the the canonical entity name going forward.
- It's typically safe to resolve an entity to the top matching NEID. However, sometimes a useful pattern is to let the user give input that the resolution was incorrect, show them a longer list of matches, and let them choose a different resolution.
- Entity names are case-insensitive

## Key Endpoints

| What you need                       | Endpoint                              | Returns                                      |
| ----------------------------------- | ------------------------------------- | -------------------------------------------- |
| Find entity by name (batch, scored) | `POST /entities/search`               | Ranked matches with NEIDs and scores         |
| Basic info (name, aliases, type)    | `GET /entities/{neid}`                | Quick summary for display                    |
| Full property values                | `POST /elemental/entities/properties` | All properties with PIDs, values, timestamps |

**Important**: When a user asks for "entity properties," clarify which they mean:

- Basic info/metadata → use `/entities/{neid}`
- Detailed property data (like relationships, addresses, financial data) → use `/elemental/entities/properties`

## Searching for Entities

### Batch name search (direct HTTP only)

`POST /entities/search`

Search for entities by name with scored ranking and optional disambiguation. Supports batch queries (multiple entities in one request). Content-Type must be `application/json`.

**Note:** This endpoint is not exposed through the generated TypeScript client (`useElementalClient()`). For client-side entity search, use `findEntities()` (`POST /elemental/find`) or `getNEID()` (`GET /entities/lookup`).

### Request Body

| Field          | Type          | Required | Description                                            |
| -------------- | ------------- | -------- | ------------------------------------------------------ |
| queries        | SearchQuery[] | yes      | Array of search queries                                |
| minScore       | number        | no       | Minimum match score, 0.0-1.0 (default: 0.8)            |
| maxResults     | integer       | no       | Maximum results per query (default: 10)                |
| includeNames   | boolean       | no       | Include entity names in response (default: true)       |
| includeAliases | boolean       | no       | Include entity aliases in response (default: false)    |
| includeFlavors | boolean       | no       | Include entity type/flavor in response (default: true) |
| includeScores  | boolean       | no       | Include match scores in response (default: true)       |

### SearchQuery

| Field            | Type     | Required | Description                                                         |
| ---------------- | -------- | -------- | ------------------------------------------------------------------- |
| queryId          | integer  | yes      | User-provided ID for matching queries to results                    |
| query            | string   | yes      | Entity name or strong ID to search for                              |
| snippet          | string   | no       | Free-text snippet for disambiguating entities with similar names    |
| flavors          | string[] | no       | Limit results to these entity types (e.g., `["organization"]`)      |
| contextType      | string   | no       | Resolution context: `namedEntity` (default), `event`, or `strongId` |
| strongIdProperty | string   | no       | Property name to use as strong ID (when contextType is `strongId`)  |

### Response

The response contains a `results` array with one entry per query:

| Field               | Type    | Description                          |
| ------------------- | ------- | ------------------------------------ |
| results[].queryId   | integer | Matches the queryId from the request |
| results[].matches[] | Match[] | Matches sorted by decreasing score   |

Each Match contains:

| Field   | Type     | Description                                               |
| ------- | -------- | --------------------------------------------------------- |
| neid    | string   | 20-character entity ID                                    |
| name    | string   | Entity display name (when includeNames is true)           |
| aliases | string[] | Other names for this entity (when includeAliases is true) |
| flavor  | string   | Entity type name (when includeFlavors is true)            |
| score   | number   | Match confidence 0.0-1.0 (when includeScores is true)     |

### Example

**Request:**

```json
{
    "queries": [
        { "queryId": 1, "query": "Apple" },
        { "queryId": 2, "query": "MSFT", "flavors": ["financial_instrument"] }
    ],
    "maxResults": 3
}
```

**Response:**

```json
{
    "results": [
        {
            "queryId": 1,
            "matches": [
                {
                    "neid": "00416400910670863867",
                    "name": "Apple",
                    "flavor": "organization",
                    "score": 0.95
                },
                {
                    "neid": "07437212020357111309",
                    "name": "AAPL",
                    "flavor": "financial_instrument",
                    "score": 0.82
                }
            ]
        },
        {
            "queryId": 2,
            "matches": [
                {
                    "neid": "03016672914748108965",
                    "name": "MSFT",
                    "flavor": "financial_instrument",
                    "score": 0.98
                }
            ]
        }
    ]
}
```

## Form-Encoded JSON Parameters

Several Elemental API endpoints use `application/x-www-form-urlencoded` with
JSON-encoded values inside form fields. The `eids` and `pids` parameters on
`POST /elemental/entities/properties` are the most common example:

```
eids=["00416400910670863867","03016672914748108965"]&pids=[8,22]
```

The generated TypeScript client types show `eids: string` and `pids: string`
(not `string[]`) because the values are **JSON-stringified arrays passed as
strings**, not native arrays. When calling these endpoints:

```typescript
// Correct — JSON-stringify the arrays
eids: JSON.stringify(['00416400910670863867']);
pids: JSON.stringify([8, 22]);

// Wrong — passing raw arrays will not work
eids: ['00416400910670863867']; // ❌ type error or silent failure
```

The same pattern applies to the `expression` parameter on `POST /elemental/find`.

## Schema and Property Lookup

For understanding entity types (flavors), properties, and the data model, see **schema.md**. You'll need the schema because many API responses return only FIDs and PIDs — use it to translate these to human-readable names.

## Properties Return Multiple Timestamped Values

`getPropertyValues` returns **all** recorded values for a property, not just the latest. A single entity and property (e.g. Apple's `company_cik`) may return dozens of rows with different `recorded_at` timestamps — one per filing or data ingestion event. For display, take the first (or latest) value and deduplicate by PID:

```typescript
const byPid = new Map<number, string>();
for (const v of values) {
    if (!byPid.has(v.pid)) byPid.set(v.pid, v.value);
}
```

## `include_attributes` Parameter

`getPropertyValues` accepts an `include_attributes` parameter (set to `'true'` as a string) that returns additional metadata on each value. This is essential for relationship properties like `appears_in`, where attributes carry entity-level sentiment scores and article URLs.

**Note:** The generated TypeScript client types don't include `include_attributes` in the parameter type. Pass it as an extra property — the API accepts it:

```typescript
const res = await client.getPropertyValues({
    eids: JSON.stringify([neid]),
    pids: JSON.stringify([appearsInPid]),
    include_attributes: 'true', // Not in TS types, but API accepts it
} as any);
```

Attribute values are keyed by **numeric PID**, not by name. Resolve attribute names to PIDs via the schema before accessing them.

<!-- BEGIN GENERATED CONTENT -->

## Endpoints

### Get entity details

`GET /entities/{neid}`

Get details about a named entity including name, aliases, and type. This is an alias for /reports/{neid}. Response is cached for 5 minutes.

#### Guidance

Response is wrapped in a 'report' container object. Access entity data via response.report.

#### Parameters

| Name | Type   | Required | Description     |
| ---- | ------ | -------- | --------------- |
| neid | string | yes      | Named Entity ID |

#### Responses

| Status | Description                                     |
| ------ | ----------------------------------------------- |
| 200    | Entity details (`GetNamedEntityReportResponse`) |
| 400    | Invalid NEID (`Error`)                          |
| 404    | Entity not found (`Error`)                      |
| 500    | Internal server error (`Error`)                 |

#### Example

**Request:**

```
GET /entities/00416400910670863867
```

**Response:**

```json
{
    "report": {
        "neid": "00416400910670863867",
        "name": "Apple",
        "aliases": ["AAPL", "APPLE", "APPLE INC", "Apple Inc"],
        "type": "organization"
    }
}
```

---

### Get property values for entities

`POST /elemental/entities/properties`

Retrieves property values for specified entities. Returns the current values of requested properties for each entity.

#### Guidance

Pass entity IDs as a JSON array in the 'eids' form field (eids and neids are interchangeable terms for entity IDs). Optionally filter to specific properties via 'pids'. If pids is omitted, returns all available properties. Set include_attributes=true to get additional metadata about each property value.

#### Request Body

**Content-Type:** `application/x-www-form-urlencoded`

| Name               | Type   | Required | Description                                                                |
| ------------------ | ------ | -------- | -------------------------------------------------------------------------- |
| eids               | string | yes      | JSON array of entity IDs to get properties for                             |
| pids               | string | no       | JSON array of property IDs to retrieve (optional, omit for all properties) |
| include_attributes | string | no       | Include property attributes in response (true/false)                       |

#### Responses

| Status | Description                                                          |
| ------ | -------------------------------------------------------------------- |
| 200    | Property values retrieved successfully (`GetPropertyValuesResponse`) |
| 400    | Bad request - invalid parameters or malformed expression (`Error`)   |
| 500    | Internal server error (`Error`)                                      |

#### Example

**Request:**

```
POST /elemental/entities/properties
Content-Type: application/x-www-form-urlencoded

eids=["00416400910670863867"]&pids=[8]
```

**Response:**

```json
{
    "op_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "follow_up": false,
    "values": [
        {
            "eid": "00416400910670863867",
            "pid": 8,
            "value": "Apple",
            "recorded_at": "2026-01-15T10:30:00Z"
        }
    ]
}
```

## Types

### GetNamedEntityReportResponse

Response containing a report about a named entity

| Field  | Type                | Description |
| ------ | ------------------- | ----------- |
| report | `NamedEntityReport` |             |

### NamedEntityReport

The named entity report

| Field   | Type     | Description                                                         |
| ------- | -------- | ------------------------------------------------------------------- |
| aliases | string[] | Aliases of the Named Entity from the forwarding map (i.e., from ER) |
| name    | string   | Name of the Named Entity                                            |
| neid    | string   | Named Entity ID                                                     |
| type    | string   | Entity type (flavor)                                                |

### GetPropertyValuesResponse

| Field      | Type              | Description                                         |
| ---------- | ----------------- | --------------------------------------------------- |
| **values** | `PropertyValue`[] | Array of property values for the requested entities |

### PropertyValue

| Field       | Type               | Description                                                                     |
| ----------- | ------------------ | ------------------------------------------------------------------------------- |
| **eid**     | string             | Entity ID this property value belongs to                                        |
| **pid**     | integer            | Property ID                                                                     |
| **value**   | any                | Property value (type varies by property: string, number, boolean, or entity ID) |
| recorded_at | string (date-time) | Timestamp when this value was recorded                                          |
| imputed     | boolean            | Whether this value was imputed (inferred) rather than directly observed         |
| attributes  | object             | Additional metadata about this property value (when include_attributes=true)    |

<!-- END GENERATED CONTENT -->
