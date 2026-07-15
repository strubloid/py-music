# Strubloid Project Guide

Strubloid teaches transferable musicianship through listening, playing, building, and writing music. It is not a music-history quiz, vocabulary flashcard app, or general-trivia game.

Before proposing, designing, or implementing a feature, read [Project Rules](docs/project-rules.md). Those rules are the mandatory product gate for all code, generated content, rewards, ranks, quests, visuals, and AI-assisted changes.

## Documentation Map

Read the [documentation index](docs/README.md). The core guides are Product, Project Rules, Curriculum, Practice and Progression, Instruments and Creation, Architecture, Design System, Deployment, and Security. Every implemented feature additionally has a detailed contract in `docs/features/`.

## Change Rule

## Mandatory Feature Documentation Workflow

Every new feature or substantial feature change follows these steps before code is considered complete:

1. **Update the system documentation first.** Read and update `docs/project-rules.md`. Update `docs/curriculum.md` for assessed content, `docs/practice-and-progression.md` for Play/reward behavior, `docs/instruments-and-creation.md` for Learn/Create behavior, and `docs/architecture.md` when routes, APIs, models, security, or persistence change.
2. **Create or update its detailed feature contract.** Add or expand `docs/features/<feature-name>.md` using the structure in `docs/features/README.md`: purpose, learner outcome, routes, flow, ownership, data/API, persistence, authority boundary, accessibility, dependencies, tests, rollout/migration, and known boundaries.
3. **Then implement.** Code, API, schema, tests, and UI must match both documentation layers. Update the feature contract with exact paths and verification results before declaring the work done.
4. **Keep the index accurate.** Add the feature to `docs/features/README.md`, `docs/README.md` when it is a major surface, and this root guide when it changes the project workflow.

A lower-level decision cannot contradict Project Rules. Do not create an unlinked document, duplicate a topic already owned by a current guide, or ship a feature without its detailed feature contract.
