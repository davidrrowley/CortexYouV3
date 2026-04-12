---
name: api-design
description: >-
  Design high-quality REST, GraphQL, and gRPC APIs with contract-first workflows, resource
  modelling, versioning, pagination, error contracts, and OpenAPI authoring. Use when designing
  a new API, reviewing an existing API contract, defining error schemas, choosing between REST /
  GraphQL / gRPC, or writing an OpenAPI specification. Triggers: "API design", "REST API",
  "OpenAPI", "swagger", "versioning", "pagination", "error contract", "gRPC", "GraphQL",
  "contract-first", "resource model", "API review", "HTTP API".
---

# API Design

## Design Philosophy

1. **Contract-first** — write the OpenAPI / schema before writing code
2. **Resource-oriented** — model nouns (resources), not verbs (actions)
3. **Stable contracts** — breaking changes require versioning; additive changes do not
4. **Consumer-driven** — design for the client's mental model, not the server's data model
5. **Fail visibly** — errors must be structured, machine-readable, and actionable

---

## Choosing the Protocol

| Criteria | REST | GraphQL | gRPC |
|----------|------|---------|------|
| **Consumers** | Public / multiple clients | One backend, many varied frontends | Internal service-to-service |
| **Query flexibility** | Fixed per endpoint | Client-defined (over/under-fetch solved) | Fixed per RPC method |
| **Tooling maturity** | Excellent | Good | Good (requires codegen) |
| **Streaming** | SSE / WebSocket add-on | Subscriptions | Native (server/client/bidi) |
| **Caching** | HTTP cache out of the box | Complex (persisted queries) | No HTTP cache |
| **Browser native** | Yes | Yes | No (needs gRPC-Web proxy) |
| **Schema / contract** | OpenAPI | GraphQL SDL | Protocol Buffers |
| **Best for** | Standard CRUD, public APIs | Data-rich SPAs, BFF pattern | Microservice RPC, high-throughput |

---

## REST API Design

### URL Structure

```
/<version>/<resource-collection>/<id>/<sub-resource>

/v1/orders                      # collection
/v1/orders/{orderId}            # single resource
/v1/orders/{orderId}/items      # sub-resource collection
/v1/orders/{orderId}/items/{itemId}
```

**Rules:**
- Plural nouns for collections (`/orders`, not `/order`)
- Lowercase, hyphen-separated words (`/order-lines`, not `/orderLines`)
- IDs in path, filters in query string
- Versions in path prefix (`/v1/`) — visible, cacheable, easy to route
- Never use verbs in resource paths (`/v1/cancelOrder` → `POST /v1/orders/{id}/cancellation`)

### HTTP Methods

| Method | Semantics | Idempotent | Safe | Body |
|--------|-----------|-----------|------|------|
| `GET` | Retrieve resource(s) | Yes | Yes | No |
| `POST` | Create new resource / trigger action | No | No | Yes |
| `PUT` | Replace resource entirely | Yes | No | Yes |
| `PATCH` | Partial update | No* | No | Yes |
| `DELETE` | Remove resource | Yes | No | No |

> *PATCH is idempotent if the operation is absolute, not relative.

**Action resources** — when an operation doesn't map cleanly to a resource:
```
POST /v1/orders/{id}/cancellation     # instead of PATCH with status=cancelled
POST /v1/documents/{id}/publication   # publish action
POST /v1/accounts/{id}/password-reset # trigger email
```

### Standard Response Codes

| Scenario | Code |
|----------|------|
| Created successfully | `201 Created` + `Location` header |
| Retrieved / updated | `200 OK` |
| No content (DELETE, some PUT) | `204 No Content` |
| Async operation accepted | `202 Accepted` + polling URL in body |
| Validation failure | `400 Bad Request` |
| Not authenticated | `401 Unauthorized` |
| Authenticated but not authorised | `403 Forbidden` |
| Not found | `404 Not Found` |
| Method not allowed | `405 Method Not Allowed` |
| Conflict (duplicate, stale ETag) | `409 Conflict` |
| Precondition failed (ETag mismatch) | `412 Precondition Failed` |
| Unprocessable entity (semantic error) | `422 Unprocessable Entity` |
| Rate limited | `429 Too Many Requests` + `Retry-After` header |
| Internal error | `500 Internal Server Error` |
| Service unavailable | `503 Service Unavailable` + `Retry-After` |

---

## Error Contract

All error responses **must** use a consistent machine-readable structure. Recommended (RFC 9457 / Problem Details):

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "One or more validation errors occurred",
  "status": 400,
  "detail": "The 'quantity' field must be greater than zero",
  "instance": "/v1/orders/ord_123",
  "traceId": "00-abc123-def456-00",
  "errors": {
    "quantity": ["Must be greater than zero"],
    "sku": ["Required field"]
  }
}
```

**Rules:**
- `type` — URI uniquely identifying the error class (links to docs if possible)
- `title` — human-readable, stable label for the error class
- `detail` — specific to this occurrence, safe to show in logs
- `traceId` — always include for server errors; aids support
- Never expose stack traces, SQL errors, or internal paths in error responses

---

## Pagination

### Cursor-based (preferred for large / real-time data)
```json
GET /v1/orders?limit=25&cursor=eyJpZCI6MTIzfQ==

{
  "data": [ ... ],
  "pagination": {
    "nextCursor": "eyJpZCI6MTQ4fQ==",
    "hasMore": true
  }
}
```

### Offset-based (simpler, use for small stable datasets)
```json
GET /v1/reports?page=3&pageSize=20

{
  "data": [ ... ],
  "pagination": {
    "page": 3,
    "pageSize": 20,
    "totalCount": 347,
    "totalPages": 18
  }
}
```

**Cursor wins when:** data is large, real-time, or frequently updated. Offset produces inconsistent results on moving datasets.

---

## Versioning Strategy

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URL path** (recommended) | `/v2/orders` | Explicit, cacheable, routable | URL changes |
| **Header** | `API-Version: 2024-01-01` | Clean URLs | Less visible, harder to test |
| **Content negotiation** | `Accept: application/vnd.api.v2+json` | Purist REST | Complex client code |

**Versioning rules:**
- Breaking changes always require a new major version
- Breaking = removing fields, changing types, removing endpoints, changing semantics
- Non-breaking = adding optional fields, new endpoints, new enum values (with default handling)
- Support at least the previous major version for 12 months after deprecation notice
- Deprecation: respond with `Deprecation` header + `Sunset` header (RFC 8594)

---

## OpenAPI Authoring

### File structure
```
api/
├── openapi.yaml          # root spec
├── components/
│   ├── schemas/          # reusable models
│   ├── responses/        # reusable response objects
│   ├── parameters/       # reusable query/path params
│   └── securitySchemes/  # auth definitions
└── paths/
    ├── orders.yaml
    └── products.yaml
```

### Checklist for every endpoint
- [ ] `operationId` — unique, `verb-noun` format (`create-order`, `list-orders`)
- [ ] `summary` — one sentence
- [ ] `tags` — group by resource
- [ ] All path/query params documented with `description`, `example`, constraints
- [ ] All 4xx and 5xx responses documented with schema
- [ ] `200`/`201` response documented with complete schema
- [ ] Pagination params consistent across list endpoints
- [ ] Security requirement declared

### Schema rules
- Use `$ref` to avoid repetition — define once in `components/schemas/`
- Mark required fields explicitly with `required: [...]`
- Use `nullable: true` (OAS 3.0) or `type: [string, null]` (OAS 3.1) — never omit nullability
- Add `example` or `examples` on every property
- Use `readOnly: true` on server-generated fields (`id`, `createdAt`)
- Use `writeOnly: true` on credential fields (`password`)

---

## API Review Checklist

### Security
- [ ] Authentication on all non-public endpoints
- [ ] Authorisation checked server-side (never trust client claims)
- [ ] No PII or secrets in URLs (they end up in logs)
- [ ] Rate limiting on all public-facing endpoints
- [ ] CORS configured correctly (no `*` on authenticated APIs)
- [ ] Input validated and sanitised (prevent injection)

### Contract quality
- [ ] All error responses use Problem Details format
- [ ] No verb-based resource paths
- [ ] Paginated endpoints use consistent pattern
- [ ] Versioning strategy explicit and documented
- [ ] Breaking vs non-breaking change classification documented

### Operability
- [ ] `traceId` in all error responses
- [ ] Health endpoint (`GET /health`) returns structured JSON
- [ ] Deprecation headers on sunset endpoints
- [ ] OpenAPI spec linted (`spectral lint openapi.yaml`)

---

## gRPC / Protobuf Notes

```protobuf
// Naming: Services = PascalCase, RPCs = PascalCase, fields = snake_case
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc ListOrders(ListOrdersRequest) returns (stream Order);  // server streaming
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderLine line_items = 2;
}
```

**Rules:**
- Never reuse field numbers — reusing breaks wire compatibility
- Use `google.protobuf.Timestamp` for time, never strings
- Use `google.protobuf.FieldMask` for partial updates
- Define error details using `google.rpc.Status` + `google.rpc.ErrorInfo`
- Version proto packages: `package orders.v1;`

---

## GraphQL Notes

**When to use:** BFF (backend-for-frontend) pattern; heterogeneous clients needing different data shapes.

**Schema design rules:**
- Model the domain, not the database — GraphQL fields are resolved, not fetched
- Use `input` types for mutations, not inline args
- Implement cursor-based pagination via Relay spec (`edges`, `node`, `pageInfo`)
- Never return `null` for lists — return empty array `[]`
- Always handle N+1 queries with DataLoader
- Protect with query depth limiting and query cost analysis
