# Pstack Agent Workflow Pack

**Version:** 0.15.5  
**Source:** https://github.com/cursor/plugins/tree/main/pstack  
**Author:** Lauren Tan  
**License:** MIT (see PSTACK_LICENSE)

## About

The pstack agent workflow pack provides skills and agents for effective AI-assisted software development. This pack was vendored into the repository to make these workflows available to all Cursor cloud agents working in this codebase.

## Included Skills

This repository includes 44 skills from pstack covering:
- **Agents**: architect, arena, blast-radius, bro, figure-it-out, how, interrogate, no-comments, poteto-mode, recall, reflect, show-me-your-work, swarm, tdd, teach, technical-writing, typescript-best-practices, unslop, why
- **Verification**: create-verification-skill, maintain-verification-skill
- **Principles**: 25+ principle skills covering boundary discipline, domain modeling, testing, type discipline, and architectural patterns

## Skipped Skills

The following skills were excluded because they only make sense on the author's machine or for Grok Bot:
- `setup-pstack` — Installation/setup specific to the author's environment
- `make-bot-ui` — Grok Bot UI generation
- `automate-me` — Personal automation configuration

## Agents

Two agent definitions were also included:
- `comment-sicko.md` — Agent specializing in code comment management
- `poteto-agent.md` — Routing target for /poteto-mode style work
