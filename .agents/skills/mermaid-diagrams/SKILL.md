---
name: mermaid-diagrams
description: >-
  Create production-quality Mermaid diagrams for architecture, data flows, sequences, and entity
  relationships. Use when drawing system context diagrams, C4 diagrams, sequence diagrams, ER
  diagrams, state machines, data flow diagrams, GitFlow diagrams, Gantt charts, or any technical
  diagram using Mermaid syntax. Triggers: "diagram", "Mermaid", "architecture diagram", "sequence
  diagram", "C4", "context diagram", "container diagram", "component diagram", "flowchart",
  "data flow", "ER diagram", "state diagram", "class diagram", "draw", "visualise", "chart".
---

# Mermaid Diagrams

## Quick Rules

1. Always open with ` ```mermaid ` and close with ` ``` ` 
2. Use `%%` for comments, not `//` or `#`
3. Node IDs: alphanumeric + underscores only — no spaces, no special chars
4. Labels with special characters must be quoted: `A["Order (pending)"]`
5. Test diagrams with the Mermaid live editor: https://mermaid.live

---

## Diagram Type Selector

| Need | Diagram type | Keyword |
|------|-------------|---------|
| System-level context | C4 Context | `C4Context` |
| Services and their containers | C4 Container | `C4Container` |
| How components talk at runtime | Sequence | `sequenceDiagram` |
| Process or decision flow | Flowchart | `flowchart LR` / `flowchart TD` |
| Data flows with trust boundaries | Flowchart + subgraphs | `flowchart LR` |
| Database schema | Entity Relationship | `erDiagram` |
| State machine | State | `stateDiagram-v2` |
| Class hierarchy | Class | `classDiagram` |
| Timeline / milestones | Gantt | `gantt` |
| Git branching strategy | GitGraph | `gitGraph` |
| Deployment topology | Flowchart (with icons) | `flowchart TD` |

---

## C4 Diagrams

C4 = Context → Container → Component → Code. Draw as far in as needed.

### C4 Context (Level 1 — System in its environment)

```mermaid
C4Context
  title System Context — Order Management Platform

  Person(customer, "Customer", "Places and tracks orders via web/mobile")
  Person(support, "Support Agent", "Manages exceptions and refunds")

  System(oms, "Order Management System", "Handles order lifecycle from placement to fulfilment")

  System_Ext(payment, "Payment Gateway", "Stripe — processes card payments")
  System_Ext(wms, "Warehouse System", "SAP WM — manages inventory and dispatch")
  System_Ext(email, "Email Service", "SendGrid — transactional emails")

  Rel(customer, oms, "Places orders, tracks status", "HTTPS")
  Rel(support, oms, "Views and manages orders", "HTTPS")
  Rel(oms, payment, "Charges and refunds", "HTTPS/REST")
  Rel(oms, wms, "Reserves and releases inventory", "SFTP/XML")
  Rel(oms, email, "Sends order notifications", "HTTPS/REST")
```

### C4 Container (Level 2 — Technology choices inside the system)

```mermaid
C4Container
  title Container Diagram — Order Management System

  Person(customer, "Customer")

  System_Boundary(oms, "Order Management System") {
    Container(web, "Web App", "React / TypeScript", "Order placement and tracking UI")
    Container(api, "Order API", "ASP.NET Core", "REST API — order lifecycle")
    Container(worker, "Fulfilment Worker", ".NET Worker Service", "Processes fulfilment queue")
    ContainerDb(orderdb, "Order Database", "Azure SQL", "Orders, line items, status history")
    ContainerDb(cache, "Cache", "Azure Cache for Redis", "Session and product catalogue cache")
    Container(queue, "Message Queue", "Azure Service Bus", "Async order and fulfilment events")
  }

  System_Ext(payment, "Payment Gateway")
  System_Ext(wms, "Warehouse System")

  Rel(customer, web, "Uses", "HTTPS")
  Rel(web, api, "Calls", "HTTPS/JSON")
  Rel(api, orderdb, "Reads/Writes", "SQL over TLS")
  Rel(api, cache, "Caches", "Redis Protocol")
  Rel(api, queue, "Publishes events", "AMQP")
  Rel(api, payment, "Charges", "HTTPS")
  Rel(worker, queue, "Consumes events", "AMQP")
  Rel(worker, wms, "Reserves inventory", "SFTP")
```

---

## Sequence Diagrams

Best for: runtime behaviour, authentication flows, async event chains.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Browser
  participant APIM as API Gateway
  participant API as Order API
  participant Entra as Entra ID
  participant DB as SQL Database
  participant Bus as Service Bus

  User->>Browser: Place order (click)
  Browser->>APIM: POST /v1/orders (Bearer token)
  APIM->>Entra: Validate JWT
  Entra-->>APIM: Token claims
  APIM->>API: Forward request + claims

  API->>DB: BEGIN TRANSACTION
  API->>DB: INSERT order
  API->>DB: INSERT order_lines
  API->>DB: COMMIT

  API->>Bus: Publish OrderPlaced event
  Bus-->>API: Ack

  API-->>APIM: 201 Created { orderId }
  APIM-->>Browser: 201 Created
  Browser-->>User: Order confirmed

  Note over Bus,API: Async — fulfilment worker picks up event
```

### Sequence diagram tips
- `autonumber` adds step numbers automatically
- Use `Note over A,B:` for cross-participant annotations
- Use `activate` / `deactivate` to show lifetimes
- `loop`, `alt`, `opt`, `par` for control flow

```mermaid
sequenceDiagram
  participant API
  participant Stripe

  API->>Stripe: POST /v1/charges
  alt Payment succeeds
    Stripe-->>API: 200 { charge_id }
    API->>API: Update order status = paid
  else Payment fails
    Stripe-->>API: 402 { decline_code }
    API->>API: Update order status = payment_failed
    Note over API: Schedule retry or alert customer
  end
```

---

## Flowcharts

Best for: process flows, decision trees, data flows with trust boundaries.

```mermaid
flowchart TD
  Start([Start: Order received]) --> Validate{Validate order}
  Validate -->|Valid| Reserve[Reserve inventory]
  Validate -->|Invalid| Reject[Return 422 error]
  Reserve -->|Available| Charge[Charge payment]
  Reserve -->|Out of stock| Notify[Notify customer\nand cancel]
  Charge -->|Success| Confirm[Confirm order\nPublish OrderPlaced]
  Charge -->|Failed| RetryCharge{Retry count < 3?}
  RetryCharge -->|Yes| Charge
  RetryCharge -->|No| Notify
  Confirm --> End([End])
  Reject --> End
  Notify --> End
```

### Trust boundary / data flow variant

```mermaid
flowchart LR
  subgraph Internet["🌐 Internet (Untrusted)"]
    U["👤 User"]
  end

  subgraph Edge["Edge / DMZ"]
    FD["Azure Front Door\n+ WAF"]
  end

  subgraph App["Application (Trusted)"]
    API["Order API\n(Container App)"]
    Worker["Fulfilment Worker"]
    DB[("Azure SQL")]
    Cache[("Redis")]
    Bus["Service Bus"]
  end

  subgraph External["External Systems"]
    Stripe["Stripe\n(Payment)"]
    WMS["Warehouse\nSystem"]
  end

  U -->|"HTTPS"| FD
  FD -->|"HTTPS + JWT"| API
  API --- DB
  API --- Cache
  API -->|"AMQP"| Bus
  API -->|"HTTPS"| Stripe
  Bus -->|"AMQP"| Worker
  Worker -->|"SFTP"| WMS
```

### Flowchart node shapes

| Shape | Syntax | Use for |
|-------|--------|---------|
| Rectangle | `A[Text]` | Process, service |
| Rounded | `A(Text)` | Start/end terminal |
| Stadium | `A([Text])` | Start/end terminal (preferred) |
| Diamond | `A{Text}` | Decision |
| Parallelogram | `A[/Text/]` | Input/output |
| Cylinder | `A[(Text)]` | Database / data store |
| Subroutine | `A[[Text]]` | Subprocess call |
| Hexagon | `A{{Text}}` | Preparation |

---

## Entity Relationship Diagrams

```mermaid
erDiagram
  CUSTOMER {
    uuid id PK
    string email UK
    string name
    timestamp created_at
  }

  ORDER {
    uuid id PK
    uuid customer_id FK
    string status
    decimal total_amount
    string currency
    timestamp placed_at
  }

  ORDER_LINE {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int quantity
    decimal unit_price
  }

  PRODUCT {
    uuid id PK
    string sku UK
    string name
    decimal price
    int stock_quantity
  }

  CUSTOMER ||--o{ ORDER : "places"
  ORDER ||--|{ ORDER_LINE : "contains"
  PRODUCT ||--o{ ORDER_LINE : "appears in"
```

### Cardinality syntax
| Symbol | Meaning |
|--------|---------|
| `\|\|` | Exactly one |
| `\|o` | Zero or one |
| `\|{` | One or more |
| `o{` | Zero or more |

---

## State Diagrams

```mermaid
stateDiagram-v2
  [*] --> Pending: Order placed

  Pending --> PaymentProcessing: Payment initiated
  PaymentProcessing --> Paid: Payment succeeded
  PaymentProcessing --> PaymentFailed: Payment declined

  PaymentFailed --> Pending: Customer retries
  PaymentFailed --> Cancelled: Customer cancels

  Paid --> Fulfilling: Inventory reserved
  Fulfilling --> Shipped: Dispatched
  Shipped --> Delivered: Delivery confirmed
  Delivered --> [*]

  Paid --> Cancelled: Customer cancels before dispatch
  Fulfilling --> Cancelled: Out of stock

  Cancelled --> [*]

  note right of PaymentFailed
    Max 3 retries
    then auto-cancel
  end note
```

---

## Class Diagrams

```mermaid
classDiagram
  class Order {
    +UUID id
    +String status
    +Money totalAmount
    +DateTime placedAt
    +place() void
    +cancel() void
    +addLine(product, qty) void
  }

  class OrderLine {
    +UUID id
    +int quantity
    +Money unitPrice
    +Money subtotal()
  }

  class Product {
    +UUID id
    +String sku
    +String name
    +Money price
  }

  class Money {
    +Decimal amount
    +String currency
    +add(Money) Money
    +multiply(int) Money
  }

  Order "1" *-- "1..*" OrderLine : contains
  OrderLine "0..*" --> "1" Product : references
  Order ..> Money : uses
  OrderLine ..> Money : uses
```

---

## GitGraph

```mermaid
gitGraph
  commit id: "Initial commit"
  branch develop
  checkout develop
  commit id: "Feature scaffold"

  branch feature/order-api
  checkout feature/order-api
  commit id: "Add order endpoints"
  commit id: "Add tests"

  checkout develop
  merge feature/order-api id: "Merge order-api"

  branch release/1.0
  checkout release/1.0
  commit id: "Bump version"
  commit id: "Fix regression"

  checkout main
  merge release/1.0 id: "Release 1.0" tag: "v1.0.0"

  checkout develop
  merge release/1.0 id: "Back-merge release fixes"
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Spaces in node IDs | `order_api` not `order api` |
| Unquoted labels with brackets | `A["My (label)"]` |
| `->` instead of `-->` in sequence | Use `-->>` for response, `->>` for request |
| Missing `autonumber` in long sequences | Add `autonumber` at top |
| Overloaded flowchart (>15 nodes) | Split into two diagrams with a linking note |
| `C4Context` without `title` | Always add `title` |

---

## Architecture Diagram Conventions

| Element | Convention |
|---------|-----------|
| External systems | Grey background or `System_Ext` |
| Trust boundaries | Dashed border subgraph or `:::boundary` class |
| Databases | Cylinder shape `[(DB)]` |
| Message queues | Parallelogram or "Queue" label |
| Users/actors | `👤` emoji prefix or `Person()` in C4 |
| HTTPS flows | Label `"HTTPS"` on arrows |
| Async flows | Dashed arrow `-.->` in flowcharts |
| Synchronous RPC | Solid arrow `-->` |
