---
name: deep-research
description: Deep web research using Claude sub-agents with native web search. Spawns parallel researchers for comprehensive coverage. Use for "research X", "find best practices for Y", "compare options for Z".
user-invocable: true
metadata: { "starforgeos": { "requires": { "bins": ["claude"] }, "emoji": "🔬" } }
---

# Deep Research Skill

Spawns Claude sub-agents with web search to research topics in parallel, then synthesizes findings.

## When to Use

- "Research best practices for X"
- "Find information about Y"
- "Compare options for Z"
- "What are the top approaches to X?"
- Any research task that benefits from multiple perspectives

## Architecture

```
┌─────────────────┐
│   Coordinator   │  (You - Opus)
│   (this agent)  │
└────────┬────────┘
         │ spawns via sessions_spawn
         ▼
┌────────────────────────────────────────────┐
│           Research Sub-Agents              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Angle 1  │ │ Angle 2  │ │ Angle 3  │   │
│  │(overview)│ │(examples)│ │(pitfalls)│   │
│  └──────────┘ └──────────┘ └──────────┘   │
└────────────────────────────────────────────┘
         │ results announced back
         ▼
┌─────────────────┐
│   Coordinator   │  synthesizes into final report
└─────────────────┘
```

## Implementation

### Single-Agent Research (Quick)

For straightforward queries, spawn one researcher:

```bash
# Using sessions_spawn (preferred - announces results back)
sessions_spawn(
  task="Research: {topic}. Use web search to find current best practices, examples, and key considerations. Synthesize into a clear summary with sources.",
  model="anthropic/claude-sonnet-4"
)
```

### Multi-Agent Research (Deep)

For complex topics, spawn parallel researchers with different angles:

```python
# Angle 1: Overview & fundamentals
sessions_spawn(
  task="Research {topic}: Focus on fundamentals, definitions, and general best practices. Use web search. Be thorough.",
  model="anthropic/claude-sonnet-4",
  label="research-overview"
)

# Angle 2: Real-world examples & case studies
sessions_spawn(
  task="Research {topic}: Focus on real-world examples, case studies, and implementations. Use web search. Find concrete examples.",
  model="anthropic/claude-sonnet-4",
  label="research-examples"
)

# Angle 3: Pitfalls & advanced considerations
sessions_spawn(
  task="Research {topic}: Focus on common mistakes, pitfalls, advanced tips, and what experts recommend avoiding. Use web search.",
  model="anthropic/claude-sonnet-4",
  label="research-pitfalls"
)
```

### Synthesis

After sub-agents report back, synthesize:

```
Combine the findings from all research angles into a comprehensive report:
1. Executive summary
2. Key findings (with sources)
3. Best practices
4. Examples/case studies
5. Pitfalls to avoid
6. Recommendations
```

## Model Selection

| Task Type     | Model              | Why                      |
| ------------- | ------------------ | ------------------------ |
| Quick lookup  | claude-sonnet-4    | Fast, cheap, good enough |
| Deep research | claude-sonnet-4    | Balance of quality/cost  |
| Synthesis     | Your current model | You're already loaded    |

**Note:** Don't use Opus for sub-agent research — Sonnet with web search is sufficient and much cheaper. Use Opus (yourself) for synthesis and judgment.

## Example Prompts

**User asks:** "Research best practices for making YouTube videos"

**You spawn:**

1. "Research YouTube video best practices: filming, lighting, audio setup, equipment recommendations"
2. "Research YouTube algorithm and optimization: titles, thumbnails, descriptions, tags, timing"
3. "Research YouTube content strategy: hooks, retention, common mistakes successful creators avoid"

**Then synthesize** the results into actionable recommendations.

## Tips

- **Don't over-parallelize** — 2-3 angles is usually enough
- **Be specific** in sub-agent prompts — vague prompts get vague results
- **Let sub-agents finish** — they announce results back automatically
- **Cite sources** — sub-agents should include URLs in their findings
- **Sonnet is fine** — save Opus for synthesis, not raw research

## No Browser Needed

This skill uses Claude's native web search tool (`WebSearch`), not browser automation. Benefits:

- Faster (no page rendering)
- More reliable (no JS issues)
- Cleaner results (Claude extracts what matters)
- Parallel by default (multiple sub-agents)
