# Cortexyou revisited as a personal, web-accessible second brain and knowledge graph

## Context, objectives, and constraints

You are trying to get back to a personal system that captures the things that spark interest, works across devices, and then lets you connect and visualise those items as a graph. The underlying intent aligns with the “capture first, then progressively add structure” approach described in entity["book","Building a Second Brain","tiago forte 2022"], particularly the idea that capture needs to be frictionless and that organisation and distillation can be deferred until later. citeturn5search0

Your primary design constraint is complexity. You explicitly want to avoid a heavy operational footprint such as Cosmos DB, and you want something you can access anywhere without committing to native Windows or Android clients. That points towards a static-first web application with the smallest possible server-side surface area, used only where a static site cannot do the job (authentication, uploads, and controlled access to private content). citeturn1view2turn0search15

The most important non-functional requirement is that this remains “yours” in a durable way. The strongest pattern across modern personal knowledge tooling is that systems survive when the data stays portable and inspectable, and when the workflow is designed around maintenance cost, not feature count. citeturn3view0

## What the two links contribute and what to treat cautiously

### entity["people","Andrej Karpathy","ai researcher"]’s “LLM Wiki” pattern is a practical, layered model

The “LLM Wiki” gist is useful because it does not start with technology. It starts with an operational model for compounding knowledge over time, built around three layers: immutable raw sources, a maintained wiki of interlinked markdown pages, and an explicit “schema” document that constrains how the system is run. citeturn3view0

There are two ideas in that pattern that map well to Cortexyou even if you do not use LLMs heavily:

First, separate “raw capture” from “working knowledge”. Raw sources never change, which gives you an audit trail and makes later reinterpretation possible. The maintained layer is allowed to evolve as your understanding changes. citeturn3view0

Second, make navigation explicit with an index and an append-only log. Karpathy describes an `index.md` as a catalogue of what exists and a `log.md` as a chronological record of activity. That combination is deliberately low-tech and works without vector databases for moderate scale, while still supporting search tooling later. citeturn3view0

Karpathy also uses Obsidian as the browsing environment and calls out graph view as an effective way of seeing shape, hubs, and orphans. That is relevant because your objective includes graph-first visualisation, and the workflow implication is that graph value comes from dense linking and consistent conventions rather than from a sophisticated renderer. citeturn3view0

### The “MemPalace” repository highlights structural retrieval, but its claims need verification

The MemPalace README promotes a “memory palace” structure (wings, halls, rooms, tunnels) as a way to organise content and constrain retrieval. The conceptual mapping is straightforward: hierarchical grouping plus cross-links is a reasonable approach for improving findability and for giving users navigational affordances beyond flat search. citeturn4view1

However, there are two practical reasons to treat MemPalace as inspiration rather than as a foundation for your system.

First, the repository’s own issue tracker includes detailed critique that several README claims did not match the code at the time of review, including statements about contradiction detection, “lossless” compression, and attribution of benchmark results. citeturn10view0 The maintainers also acknowledge in the README that parts of the earlier write-up were misleading or incorrect, including the framing of the “palace boost” as a novel mechanism rather than metadata filtering and the status of contradiction detection. citeturn4view3turn1view1

Second, there is an open issue explicitly raising “possible scam” concerns. Regardless of whether those concerns are valid, the existence of that discussion is a signal that you should not couple a personal knowledge base to this codebase without a careful, security-oriented review. citeturn9view0turn8view0

The useful takeaway for Cortexyou is therefore narrower and still valuable: structure matters, and it is often enough to implement structure using explicit metadata and links rather than by adopting a heavy “memory framework”. citeturn4view1turn10view0

## Architectural options that match a personal knowledge graph with low operational overhead

You have three credible implementation directions. The right choice depends less on technology and more on where you want the work to sit: in your authoring workflow, in a small amount of backend code, or in periodic batch processing.

### Option centred on a web app with minimal backend

This is the approach that best matches your “Azure static website, access anywhere” bias. The static site hosts the UI, and a very small API exists only to perform privileged operations: authenticate the user, mint upload permissions, and read/write private data. Azure Static Web Apps is designed for this shape, including built-in authentication flows for GitHub and Microsoft Entra ID and route-level access rules via configuration. citeturn1view2turn0search15

For uploads, the established pattern is direct-to-blob using SAS tokens: the frontend requests a short-lived SAS token from an API, then uploads directly to Azure Blob Storage. Microsoft’s own examples explicitly describe this “request SAS then upload” architecture as the core flow. citeturn5search4turn5search10

This option keeps complexity low because Blob Storage becomes your content store for both notes and images, and the API can remain thin.

### Option centred on markdown-first authoring with static publishing

This is closer to the Karpathy model operationally. You keep everything in a local vault of markdown files, you use an existing static publisher to render a web site, and you host that site. Tools like Quartz explicitly target Obsidian-style vaults and advertise features such as backlinks, wiki links, full-text search, and a graph view in the published site. citeturn6search33turn6search12

The advantage is long-term durability and minimal bespoke code. The disadvantage is capture friction, especially for mobile photo capture and quick notes, unless you build a capture pipeline that writes into the vault automatically.

### Option centred on local-first capture with browser storage, then sync

If your core problem is capture consistency, a local-first progressive web app can store captures in the browser even when offline. IndexedDB is designed for persistent storage of structured data in the browser and is explicitly positioned as enabling offline-capable web apps. citeturn5search3turn5search6

You can then sync to the cloud when available. This option helps if you often capture while moving, but it introduces sync complexity and conflict handling. For a single-user system it can still be manageable, but it is a conscious trade.

A related idea is using mobile sharing workflows. The Web Share API is now a W3C Recommendation for sharing from the browser to OS share targets, while the Web Share Target API enables a web app to register itself as a share target in some environments. citeturn5search2turn5search5turn5search28 In practice, browser support is uneven, so this should be treated as a best-effort enhancement rather than a dependency. citeturn5search11turn5search8

## Recommended target design for Cortexyou on Azure

Given your stated constraints, the lowest-risk design is a static-first web app hosted on Azure Static Web Apps, with Azure Functions for a small API surface, and Azure Blob Storage as the primary persistence layer.

This aligns with the Karpathy “layers” approach, but implemented without assuming an LLM-driven wiki is necessary from day one. It also borrows the MemPalace emphasis on structure, but implements that structure through simple metadata and explicit links rather than through a complex framework. citeturn3view0turn4view1turn10view0

### Core components and what each is responsible for

The frontend is a single-page app served from Azure Static Web Apps. It handles capture, browsing, search, and graph visualisation. Azure Static Web Apps provides a built-in authentication experience, and supports GitHub and Microsoft Entra ID as preconfigured providers, with users placed into `anonymous` and `authenticated` roles by default. citeturn1view2turn0search31

The API is a small set of Azure Functions (either managed by Static Web Apps or linked as a “bring your own” backend). Static Web Apps can map an existing Function App to the `/api` route, which keeps the deployment model straightforward. citeturn0search15

Blob Storage holds:

- Raw captured artefacts such as images and other attachments.
- Note objects stored as JSON or markdown-with-frontmatter.
- A small number of derived artefacts for performance such as an `index.json` and a `graph.json`.

For file uploads, use the SAS token pattern: the API mints short-lived, narrow-scope SAS tokens, and the client uploads directly to Blob Storage. This is positioned by Microsoft as both efficient and security-aligned when implemented with best practices. citeturn5search4turn5search10turn5search14

### Graph rendering approach

For graph visualisation in the browser, Cytoscape.js is a mature option designed for interactive graph visualisation and manipulation, and it supports both visualisation and graph operations. citeturn0search3turn0search9turn0search20 It also serialises graph state via JSON, which fits with a blob-backed architecture where the “graph” can be generated as a JSON document. citeturn0search6turn0search9

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["Cytoscape.js network graph example","personal knowledge graph web app interface","Obsidian graph view screenshot"],"num_per_query":1}

The key implementation decision is how edges are created. You can keep this deliberate rather than automatic:

- Explicit edges created by you when something is genuinely related.
- Implicit edges derived from consistent tags or from markdown links.
- Optional “suggested edges” based on similarity, treated as proposed links rather than as truth.

This keeps the graph meaningful and avoids the common failure mode where a graph becomes a visually impressive but semantically noisy hairball.

## Data model and workflow design mapped to the Second Brain method

A useful way to keep Cortexyou disciplined is to align the workflow with the CODE method described by entity["people","Tiago Forte","author, basb"]: capture, organise, distil, express. The point is not to mirror the methodology perfectly, but to ensure the app supports the natural progression from raw capture to reusable insight. citeturn5search0turn5search27

### Minimal object model that remains extensible

A pragmatic model is a small number of node types and a small number of edge types.

Node types:

- Spark: the captured item. This might be a URL, a photo, a short note, or an excerpt.
- Concept: an idea you want to accumulate around over time.
- Project or area: a stable organising container for decision-making, aligned to PARA-style thinking if you choose to use it.

Each Spark should carry:

- Raw content pointers (blob URLs for images, original URL for web sources).
- A short “why this matters” field, because interest without intent is hard to rediscover.
- Optional distilled fields such as highlights and a one-paragraph summary.

This matches the idea in “LLM Wiki” that raw sources are immutable, and that your maintained layer can evolve over time. citeturn3view0

Edges:

- `relates_to` between Sparks and Concepts.
- `supports` or `examples` when you want directional meaning.
- `contradicts` only when you have strong evidence, because contradiction handling otherwise becomes a maintenance burden. The MemPalace discussion is a useful warning that contradiction detection is hard to do reliably and should not be over-claimed. citeturn10view0turn4view3

### Capture paths that reduce friction

For capture to work across devices, treat capture as a product in its own right.

A baseline set of capture paths that stay realistic on the web:

- A “quick add” screen with text, URL, tags, and optional image upload.
- A camera-first capture mode on mobile browsers that writes an image plus minimal metadata.
- A browser extension or bookmarklet later, if you find yourself repeatedly copying URLs manually.

If you want “share to Cortexyou” from mobile, you can explore Web Share Target. The specification does define how a web app can declare itself as a share target, including receiving shared content. citeturn5search5turn5search32 Support constraints mean this should be optional, but it can be worthwhile if your primary mobile environment supports it. citeturn5search8turn5search11

If offline capture matters, add IndexedDB storage as a queue. IndexedDB is explicitly designed for persistent storage and is commonly used to support offline-capable applications. citeturn5search3turn5search9

## Delivery plan with clear milestones and decision points

The intent here is to get you back to momentum by delivering a coherent minimum that you can actually use weekly, then adding capability only when it reduces ongoing cost.

### Establish the foundation

Start by choosing a single, stable content representation and sticking to it. JSON objects per capture are easier for a bespoke UI, while markdown-with-frontmatter is easier if you want interoperability with existing note tools. The Karpathy pattern argues strongly for keeping the system as a simple directory of files that can be versioned, reviewed, and evolved. citeturn3view0

On Azure, provision:

- Static Web App for the frontend and auth. Azure Static Web Apps supports authentication with GitHub and Microsoft Entra ID with minimal configuration and role-based route restriction via configuration. citeturn1view2turn0search31
- Blob Storage for content and attachments.
- Azure Functions for API endpoints, linked under `/api` if you want separation. citeturn0search15

### Deliver an MVP that solves capture and retrieval, not everything

The MVP should let you do four things:

- Add a Spark quickly.
- Upload an image.
- Browse recent Sparks with filters.
- Open a basic graph view that at least shows tags or backlinks.

File upload should use the SAS token approach so your API does not become a file proxy. Microsoft’s guidance and examples describe this as the core architecture for browser uploads to Blob Storage. citeturn5search4turn5search10turn5search14

At this stage, keep “graph” simple. Start with tags-as-nodes plus explicit links. A graph that you can understand beats a graph that tries to infer your mind.

### Add structure that compounds value

Once capture is stable, shift focus to “organise and distil”. Implement:

- A lightweight “index” view that lets you see Concepts and their connected Sparks.
- A weekly or monthly review workflow that encourages creating a small number of high-quality links, rather than tagging everything.

This is the same maintenance argument in “LLM Wiki”. The burden is bookkeeping, so you want the system to make bookkeeping easy and optional, while still rewarding it when you do it. citeturn3view0

### Introduce enrichment only where it reduces manual effort without taking control

If you later want AI assistance, constrain it:

- Use it to propose tags, Concepts, or links.
- Require explicit acceptance before it writes new edges.
- Keep raw sources unchanged.

This mirrors the “persistent, compounding artefact” idea in “LLM Wiki”, but you can make the “wiki layer” something you curate gradually rather than something the model rewrites continuously. citeturn3view0

MemPalace is a useful cautionary case here. The repository demonstrates how easily marketing claims can get ahead of code and how quickly complexity accumulates when a system tries to do contradiction detection, compression, and benchmark chasing at the same time. citeturn10view0turn4view3turn9view0 For Cortexyou, you get better outcomes by keeping enrichment as optional tooling around a stable data core.

### Operational safeguards so you do not lose momentum again

A personal system becomes long-lived when it is easy to back up, easy to migrate, and hard to corrupt accidentally.

Adopt two simple safeguards early:

- Append-only logging of capture events, similar to the `log.md` idea, so you always have a recoverable timeline even if derived indexes break. citeturn3view0
- Periodic export as a versioned bundle of JSON or markdown plus attachments, so the system is never hostage to one cloud configuration.

These choices trade a small amount of upfront discipline for a meaningful reduction in long-term risk, which is usually the difference between “I’ll revisit this later” and “this is now part of how I work”.