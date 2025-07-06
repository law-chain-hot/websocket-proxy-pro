# Contributing to WebSocket Proxy Extension

Thank you for your interest in contributing to WebSocket Proxy Extension! This document provides guidelines for contributing to the project.

## 🎯 How to Contribute

### Reporting Bugs
- Use the GitHub issue tracker to report bugs
- Include detailed steps to reproduce the issue
- Provide information about your environment (Chrome version, OS, etc.)
- Include screenshots or screen recordings if applicable

### Suggesting Features
- Open an issue with the "enhancement" label
- Clearly describe the feature and its use case
- Explain why this feature would be useful for other users

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18.0 or higher
- pnpm 8.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/websocket-proxy-extension.git
cd websocket-proxy-extension

# Install dependencies
pnpm install

# Start development build
pnpm run dev
```

### Building
```bash
# Production build
pnpm run build

# Development build with source maps
pnpm run build:dev
```

### Testing
```bash
# Run tests (when implemented)
pnpm run test

# Run linting
pnpm run lint
```

## 📋 Code Style Guidelines

### JavaScript/React
- Use modern ES6+ features
- Follow React hooks best practices
- Use descriptive variable and function names
- Include JSDoc comments for complex functions
- Use consistent formatting (Prettier will be added)

### CSS
- Use CSS custom properties for theming
- Follow BEM naming convention where applicable
- Maintain responsive design principles

### Git Commits
- Use clear and descriptive commit messages
- Follow conventional commits format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code refactoring
  - `test:` for adding tests
  - `chore:` for maintenance tasks

## 🔍 Code Review Process

### Pull Request Guidelines
- Ensure your PR has a clear title and description
- Link related issues using keywords (e.g., "Fixes #123")
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused on a single feature or fix

### Review Criteria
- Code quality and readability
- Performance impact
- Security considerations
- Compatibility with different Chrome versions
- User experience improvements

## 🏗️ Architecture Guidelines

### Chrome Extension Structure
- Keep background script lightweight
- Use content scripts for page interaction
- Isolate DevTools panel logic
- Follow Chrome Extension V3 best practices

### React Components
- Use functional components with hooks
- Keep components small and focused
- Use proper prop validation
- Implement proper error boundaries

## 📝 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex algorithms and business logic
- Include usage examples in documentation

### User Documentation
- Update README.md for new features
- Add usage examples
- Include troubleshooting information

## 🎨 UI/UX Guidelines

### Design Principles
- Maintain consistency with Chrome DevTools
- Follow accessibility guidelines
- Ensure responsive design
- Use intuitive icons and labels

### Color Scheme
- Follow the established dark theme
- Use CSS custom properties for colors
- Ensure sufficient contrast ratios
- Consider color-blind accessibility

## 🔒 Security Considerations

### Extension Security
- Minimize required permissions
- Validate all user inputs
- Avoid executing arbitrary code
- Follow Chrome Extension security guidelines

### Data Privacy
- Don't collect unnecessary user data
- Clearly document data usage
- Implement proper data sanitization

## 🚀 Release Process

### Version Management
- Follow semantic versioning (semver)
- Update CHANGELOG.md for all changes
- Test thoroughly before release

### Chrome Web Store
- Test extension in different scenarios
- Ensure all features work as expected
- Follow Chrome Web Store policies

## 🆘 Getting Help

### Communication Channels
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for general questions
- Email: [your-email@example.com] for security issues

### Resources
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://reactjs.org/docs/)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 📜 License

By contributing to WebSocket Proxy Extension, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WebSocket Proxy Extension! 🎉