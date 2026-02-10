# Knowledge Graph

Structured knowledge stored under `knowledge/` using PARA organization.

## Structure

```
knowledge/
├── projects/          ← Active project docs (Laser Lab, SEO, Kyber)
├── areas/
│   ├── people/        ← Contacts (Haley, partners, collaborators)
│   └── companies/     ← Business relationships (xTool, GweikeCloud)
├── resources/         ← Infrastructure docs (Tailscale, email, this doc set)
├── archives/          ← Completed/inactive items
└── index.md           ← Master index of all entities
```

## Entity Format

Each entity has:

- `summary.md` — short reference for fast loading
- `items.json` — atomic facts with metadata

### Fact Schema

```json
{
  "id": "fact-001",
  "fact": "The actual fact statement",
  "category": "milestone|relationship|status|preference|context|contact",
  "timestamp": "YYYY-MM-DD",
  "source": "conversation|observation|document",
  "status": "active|superseded",
  "supersededBy": null,
  "relatedEntities": ["areas/people/jane", "projects/laser-lab"],
  "lastAccessed": "YYYY-MM-DD",
  "accessCount": 1
}
```

## Current Coverage

- **People**: Haley Cullum, Heidi He (xTool), Zheyi Zeng (GweikeCloud), Grant Burrage, Jordan Osborne, etc.
- **Companies**: xTool, GweikeCloud, Make or Break Shop, Thunder Laser USA, etc.
- **Projects**: Laser Lab, NestLab, Business Audit, SEO Analysis, Kyber
- **Resources**: Tailscale network, email infrastructure, video storage, agent architecture
