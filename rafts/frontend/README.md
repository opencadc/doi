# RAFTS - Research Announcement for Transient Sources

A submission and review system for astronomical transient observations, enabling researchers to submit, review, and publish RAFTs (Research Announcements for Transient Sources) with DOI integration.

## Features

- **RAFT Submission** - Multi-step form with validation and draft saving
- **Review System** - Workflow for reviewers to approve/reject submissions
- **DOI Integration** - DataCite DOI generation for published RAFTs
- **File Upload** - ADES file validation and storage via CANFAR VOSpace
- **Internationalization** - English/French language support
- **Role-Based Access** - Contributor, Reviewer, and Admin roles

## Tech Stack

- **Next.js 15** with App Router and Server Actions
- **TypeScript** with strict mode
- **Material-UI (MUI)** for components
- **NextAuth.js** for CADC authentication
- **next-intl** for i18n
- **Zod** for schema validation
- **React Hook Form** for form management
- **TanStack Table** for data tables

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start development server with Turbopack |
| `npm run build`         | Build for production                    |
| `npm run start`         | Start production server                 |
| `npm run lint`          | Run ESLint                              |
| `npm run format`        | Format code with Prettier               |
| `npm run typecheck`     | Run TypeScript type checking            |
| `npm run test`          | Run tests with Vitest                   |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run validate`      | Run typecheck, lint, and tests          |

## Project Structure

```
src/
├── app/[locale]/        # Next.js App Router pages with i18n
├── actions/             # Server actions for data operations
├── auth/                # CADC authentication (NextAuth.js)
├── components/          # React components organized by feature
├── context/             # React Context providers
├── services/            # External service integrations
├── shared/              # Shared types and constants
├── styles/              # MUI theming
└── utilities/           # Helper functions
```

## Documentation

See [doc_n_dev/](./doc_n_dev/) for detailed documentation:

- [Development Setup](./doc_n_dev/DEVELOPMENT.md)
- [Deployment Guide](./doc_n_dev/deployment/)
- [Technical Guides](./doc_n_dev/guides/)

## Route Structure

| Route                | Description          | Access        |
| -------------------- | -------------------- | ------------- |
| `/`                  | Dashboard            | Authenticated |
| `/form/create`       | RAFT submission form | Contributor+  |
| `/form/edit/[id]`    | Edit existing RAFT   | Owner         |
| `/view/rafts`        | View published RAFTs | Authenticated |
| `/review/rafts`      | Review system        | Reviewer+     |
| `/admin`             | Admin panel          | Admin         |
| `/public-view/rafts` | Public RAFT viewing  | Public        |

## Environment Variables

Key environment variables (see `.env.example` for full list):

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
NEXT_DOI_BASE_URL=https://doi-service/instances
NEXT_CANFAR_STORAGE_BASE_URL=https://storage-service/files
```

## License

Copyright (c) National Research Council Canada
