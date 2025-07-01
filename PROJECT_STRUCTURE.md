# Service Call Manager - Project Structure & Naming Conventions

## Project Overview
This document outlines the project structure, file organization, and naming conventions for the Service Call Manager Electron desktop application.

## Project Structure

```
service-call-manager/
├── .github/                          # GitHub workflows and templates
│   └── workflows/
│       ├── ci.yml                    # Continuous integration
│       └── release.yml               # Release automation
├── .vscode/                          # VS Code configuration
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── docs/                             # Documentation
│   ├── architecture/                 # Architecture Decision Records (ADRs)
│   ├── api/                         # API documentation
│   └── user-guide/                  # User documentation
├── src/
│   ├── main/                        # Electron main process
│   │   ├── main.ts                  # Main entry point
│   │   ├── preload.ts               # Preload script for security
│   │   ├── services/                # Main process services
│   │   │   ├── call-service.ts      # Service call CRUD operations
│   │   │   ├── workflow-service.ts  # Workflow engine integration
│   │   │   ├── ai-service.ts        # AI integration service
│   │   │   ├── backup-service.ts    # Backup and sync operations
│   │   │   └── database/            # Database layer
│   │   │       ├── database.ts      # Database connection and setup
│   │   │       ├── migrations/      # Database migrations
│   │   │       │   ├── 001-initial-schema.sql
│   │   │       │   └── 002-add-tags.sql
│   │   │       └── models/          # Data models
│   │   │           ├── service-call.ts
│   │   │           ├── work-log.ts
│   │   │           └── index.ts
│   │   ├── utils/                   # Main process utilities
│   │   │   ├── config.ts           # Configuration management
│   │   │   ├── logger.ts           # Logging utilities
│   │   │   └── file-utils.ts       # File system utilities
│   │   └── workflows/               # Workflow definitions
│   │       ├── stale-call-reminder.ts
│   │       ├── auto-tagging.ts
│   │       └── daily-backup.ts
│   ├── renderer/                    # Electron renderer process (React app)
│   │   ├── index.html              # Main HTML template
│   │   ├── index.ts                # Renderer entry point
│   │   ├── App.tsx                 # Main React component
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # Base UI components (shadcn/ui style)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   └── main-layout.tsx
│   │   │   ├── forms/              # Form components
│   │   │   │   ├── service-call-form.tsx
│   │   │   │   └── work-log-form.tsx
│   │   │   └── features/           # Feature-specific components
│   │   │       ├── service-calls/
│   │   │       │   ├── call-list.tsx
│   │   │       │   ├── call-card.tsx
│   │   │       │   └── call-details.tsx
│   │   │       ├── daily-sheet/
│   │   │       │   ├── daily-sheet.tsx
│   │   │       │   └── print-preview.tsx
│   │   │       └── dashboard/
│   │   │           ├── dashboard.tsx
│   │   │           └── stats-card.tsx
│   │   ├── pages/                  # Page components
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── calls-page.tsx
│   │   │   ├── new-call-page.tsx
│   │   │   └── settings-page.tsx
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── use-service-calls.ts
│   │   │   ├── use-workflows.ts
│   │   │   └── use-local-storage.ts
│   │   ├── store/                  # Global state management (Zustand)
│   │   │   ├── service-call-store.ts
│   │   │   ├── ui-store.ts
│   │   │   └── index.ts
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── service-call.ts
│   │   │   ├── workflow.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   ├── utils/                  # Renderer utilities
│   │   │   ├── format-date.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   └── styles/                 # Styling files
│   │       ├── globals.css         # Global styles with Tailwind
│   │       └── components.css      # Component-specific styles
│   └── shared/                     # Shared code between main and renderer
│       ├── types/                  # Shared TypeScript types
│       │   ├── ipc.ts             # IPC channel types
│       │   └── common.ts          # Common types
│       └── constants/              # Shared constants
│           ├── ipc-channels.ts    # IPC channel names
│           └── app-constants.ts   # App-wide constants
├── test/                           # Test files
│   ├── main/                      # Main process tests
│   ├── renderer/                  # Renderer process tests
│   ├── e2e/                      # End-to-end tests
│   ├── fixtures/                  # Test fixtures and data
│   └── setup/                     # Test setup files
├── scripts/                        # Build and utility scripts
│   ├── build.js
│   ├── dev.js
│   └── migrate.js
├── resources/                      # Static resources
│   ├── icons/                     # Application icons
│   └── templates/                 # Document templates
├── dist/                          # Build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── .env.example                   # Environment variables template
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Package configuration
├── pnpm-lock.yaml               # Package lock file
└── README.md                     # Project documentation
```

## Naming Conventions

### Files and Directories
- **Files**: Use kebab-case for file names (`service-call-form.tsx`, `daily-sheet.ts`)
- **Directories**: Use kebab-case for directory names (`service-calls/`, `daily-sheet/`)
- **Components**: Use PascalCase for React component files (`ServiceCallForm.tsx`)
- **Types**: Use kebab-case with `.types.ts` suffix (`service-call.types.ts`)
- **Tests**: Use `.test.ts` or `.spec.ts` suffix (`service-call.test.ts`)

### Code Conventions

#### TypeScript/JavaScript
- **Variables and Functions**: camelCase (`serviceCallData`, `createServiceCall`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_BASE_URL`)
- **Classes**: PascalCase (`ServiceCallService`, `DatabaseManager`)
- **Interfaces/Types**: PascalCase with descriptive names (`ServiceCall`, `WorkLog`, `ApiResponse`)
- **Enums**: PascalCase (`CallStatus`, `CallType`)

#### React Components
- **Component Names**: PascalCase (`ServiceCallForm`, `DailySheet`)
- **Props Interfaces**: ComponentName + `Props` (`ServiceCallFormProps`)
- **Hook Names**: Start with `use` (`useServiceCalls`, `useWorkflows`)

#### Database
- **Table Names**: snake_case plural (`service_calls`, `work_logs`)
- **Column Names**: snake_case (`customer_name`, `created_at`)
- **Migration Files**: Numbered with descriptive names (`001-initial-schema.sql`)

#### IPC Channels
- **Channel Names**: Colon-separated namespace (`service-calls:create`, `workflows:trigger`)
- **Constants**: SCREAMING_SNAKE_CASE (`SERVICE_CALLS_CREATE`, `WORKFLOWS_TRIGGER`)

### Git Conventions
- **Branches**: 
  - Feature: `feature/description` (`feature/service-call-crud`)
  - Bugfix: `fix/description` (`fix/date-picker-validation`)
  - Hotfix: `hotfix/description` (`hotfix/critical-security-fix`)
- **Commits**: Follow Conventional Commits
  - `feat: add service call creation form`
  - `fix: resolve PDF export formatting issue`
  - `docs: update API documentation`
  - `test: add unit tests for call service`

### Environment Variables
- Use SCREAMING_SNAKE_CASE (`DATABASE_URL`, `OPENAI_API_KEY`)
- Prefix with app name for clarity (`SCM_DATABASE_PATH`, `SCM_LOG_LEVEL`)

### CSS Classes (Tailwind)
- Use Tailwind utility classes primarily
- Custom classes in kebab-case (`service-call-card`, `print-preview`)
- Component-specific classes prefixed with component name (`dashboard-stats`, `call-form-input`)

### API/IPC Design Patterns
- **Services**: Follow CRUD pattern (`create`, `read`, `update`, `delete`)
- **Error Handling**: Consistent error response format
- **Validation**: Use Zod schemas for runtime validation
- **Logging**: Structured logging with consistent format

## Architecture Principles

1. **Separation of Concerns**: Clear separation between main and renderer processes
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Security**: Context isolation and secure IPC communication
4. **Testability**: Modular design enabling easy unit testing
5. **Maintainability**: Consistent structure and naming conventions
6. **Performance**: Efficient data flow and minimal re-renders

## Development Workflow

1. **Feature Development**: Create feature branch → implement → test → PR → review → merge
2. **Code Quality**: Pre-commit hooks for linting and formatting
3. **Testing**: Unit tests required for services, integration tests for workflows
4. **Documentation**: Update relevant docs with each feature
5. **Deployment**: Automated builds and releases through CI/CD

This structure supports the iterative development process outlined in the project roadmap while maintaining code quality and developer experience. 