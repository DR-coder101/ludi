# Pstack Agent Workflow Pack

**Version:** 0.15.13
**Pin:** `2cbf58508f40de470d7490b55c51d71241928fa2`
**Source:** https://github.com/cursor/plugins/tree/main/pstack
**Author:** Lauren Tan
**License:** MIT (see PSTACK_LICENSE)

## About

The pstack agent workflow pack provides skills and agents for effective AI-assisted software development. This pack was vendored into the repository to make these workflows available to all Cursor cloud agents working in this codebase. Skills are flattened from upstream `pstack/skills/<name>` into `.cursor/skills/<name>`.

## Included Skills

This repository includes 51 skills from pstack 0.15.13:

- **Workflows:** architect, arena, automate-me, benchmark-checklist, blast-radius, bro, correct, figure-it-out, how, interrogate, make-bot-ui, no-comments, poteto-help, poteto-mode, recall, reflect, setup-pstack, show-me-your-work, swarm, tdd, teach, technical-writing, typescript-best-practices, unslop, why
- **Verification:** create-verification-skill, maintain-verification-skill
- **Principles:** 24 principle skills, including explain-the-number, covering boundary discipline, domain modeling, testing, type discipline, and architectural patterns

`setup-pstack` is vendored so the pack is complete. Dean runs `/setup-pstack` himself. Do not run it as part of a skill refresh.

## Agents

Two agent definitions live in `.cursor/agents` and are not refreshed by a skills-only vendor pass.

- `comment-sicko.md`. Specializes in code comment management.
- `poteto-agent.md`. Routing target for /poteto-mode style work.
