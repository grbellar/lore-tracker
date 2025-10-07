# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# DOCS
We keep all important docs in `.agent` folder and keep updating them, structure like below:

```
.agent/
├── README.md                           # Index of all documentation
├── Tasks/                              # PRD & implementation plans for each feature
│   └── ...
├── System/                            # Current state of the system. Examples include:
│   ├── project_architecture.md        # Project structure, tech stack, integration points
│   ├── database_schema.md            # Database schema & relationships
│   ├── authentication_system.md      # Auth flow & security
│   └── ...
└── SOP/                              # Best practices & procedures. Examples include:
    ├── schema_migration.md           # How to add schema migrations
    ├── new_page_route.md            # How to add new page routes
    ├── component_creation.md        # How to create new components
    └── ...
```

We should always update .agent docs after we implement new features or make changes to the codebase, to make sure it fully reflect the up to date information

BEFORE YOU PLAN ANY IMPLEMENTATION, always read the .agent/README first to get context

## Development Commands
THE SERVER IS USUALLY ALREADY RUNNING AND YOU DON'T NEED TO START IT TO TEST.

```bash
# Start development server with Turbopack BUT FIRST check to see if the server is already running. It most likely is. Only start the server if needed.
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Development server runs at http://localhost:3000