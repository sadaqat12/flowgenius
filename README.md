# Service Call Manager

A desktop application for managing appliance repair service calls, built with Electron, React, and TypeScript.

## Features

- **Service Call Management**: Create, track, and manage service calls
- **Daily Service Sheets**: Generate printable daily schedules
- **AI-Powered Workflows**: Automated reminders and smart tagging
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Database**: SQLite (planned)
- **Workflows**: n8n / LangGraph (planned)
- **AI**: OpenAI API / Local LLM (planned)

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd service-call-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

This will start both the Vite development server and the Electron application.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run dist` - Build and package the application
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── main.ts        # Main process entry point
│   ├── preload.ts     # Preload script for IPC
│   └── services/      # Backend services
├── renderer/          # React renderer process
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom hooks
│   ├── store/         # State management
│   └── styles/        # Global styles
└── shared/            # Shared types and constants
    └── types/         # TypeScript type definitions
```

## Development Phases

### Phase 1: MVP Skeleton (Current)
- [x] Project setup with Electron + React + TypeScript
- [x] Basic UI layout and navigation
- [x] Development tooling (ESLint, Prettier, TypeScript)
- [ ] SQLite database integration
- [ ] Basic CRUD operations for service calls

### Phase 2: Workflow Engine
- [ ] n8n or LangGraph integration
- [ ] Automated reminder workflows
- [ ] Background task processing

### Phase 3: AI Features
- [ ] OpenAI API integration
- [ ] Smart tagging and categorization
- [ ] Automated suggestions

### Phase 4: Production Ready
- [ ] Application packaging
- [ ] Auto-update mechanism
- [ ] Installation packages

## Contributing

1. Follow the existing code style and conventions
2. Run tests and linting before submitting PRs
3. Use conventional commits for commit messages
4. Update documentation for new features

## License

MIT License - see LICENSE file for details 