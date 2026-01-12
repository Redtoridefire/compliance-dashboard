# Contributing to CyberComply

Thank you for your interest in contributing to CyberComply! This document provides guidelines and instructions for contributing to this open-source cybersecurity compliance framework mapper.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Next.js

### Development Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/compliance-dashboard.git
   cd compliance-dashboard
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/compliance-dashboard.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration (Supabase and OpenAI keys are optional for development).

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Fix issues and improve stability
- **New features** - Add new functionality
- **Documentation** - Improve or add documentation
- **Tests** - Add or improve test coverage
- **Performance** - Optimize code and improve performance
- **Accessibility** - Improve accessibility features
- **Translations** - Add support for new languages
- **Framework data** - Add new compliance frameworks or controls

### Finding Issues to Work On

- Look for issues labeled `good first issue` for beginner-friendly tasks
- Check `help wanted` labels for issues that need attention
- Review `enhancement` labels for feature requests
- Feel free to propose new features by opening an issue first

### Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to reproduce** - Detailed steps to reproduce the issue
3. **Expected behavior** - What you expected to happen
4. **Actual behavior** - What actually happened
5. **Screenshots** - If applicable
6. **Environment** - Browser, OS, Node.js version

Use the bug report issue template when available.

### Suggesting Features

1. Check existing issues to avoid duplicates
2. Open a new issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why this feature would benefit users

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests if applicable

4. **Test your changes**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

### Submitting the PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Use a descriptive title
   - Reference related issues
   - Describe your changes in detail
   - Include screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation
   - [ ] Refactoring

   ## Related Issues
   Fixes #123

   ## Testing
   How to test the changes

   ## Screenshots
   (if applicable)
   ```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Delete your feature branch after merge

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Avoid `any` types - use proper typing
- Export interfaces and types from dedicated files
- Use descriptive variable and function names

```typescript
// Good
interface ControlMapping {
  sourceControlId: string;
  targetControlId: string;
  mappingType: MappingType;
}

// Avoid
interface Mapping {
  src: any;
  tgt: any;
  type: string;
}
```

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper prop typing

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  // ...
}
```

### Styling

- Use Tailwind CSS for styling
- Follow the cyber-luxe design system
- Use CSS variables for theme colors
- Ensure responsive design

### File Organization

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Base UI components
│   └── [feature]/   # Feature-specific components
├── lib/             # Utility functions
├── stores/          # Zustand stores
├── types/           # TypeScript types
└── hooks/           # Custom React hooks
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(controls): add bulk import functionality
fix(auth): resolve session expiration issue
docs(readme): update installation instructions
refactor(api): simplify gap analysis logic
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for meaningful test coverage
- Use descriptive test names

```typescript
describe('GapAnalysis', () => {
  it('should identify gaps when control is not implemented', () => {
    // Test implementation
  });

  it('should calculate correct severity based on framework requirements', () => {
    // Test implementation
  });
});
```

## Documentation

### Code Comments

- Add JSDoc comments for public functions
- Explain complex logic with inline comments
- Keep comments up to date with code changes

```typescript
/**
 * Calculates the compliance score for a given framework
 * @param frameworkId - The UUID of the framework
 * @param implementations - Array of control implementations
 * @returns Compliance percentage (0-100)
 */
export function calculateComplianceScore(
  frameworkId: string,
  implementations: ControlImplementation[]
): number {
  // Implementation
}
```

### Documentation Files

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Add inline documentation for API routes

## Community

### Getting Help

- Open a GitHub issue for bugs or feature requests
- Check existing issues and discussions
- Be respectful and patient

### Communication

- Use clear and concise language
- Provide context when asking questions
- Share your use case when suggesting features

### Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributor list

## License

By contributing to CyberComply, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CyberComply! Your efforts help make compliance more accessible for organizations everywhere.
