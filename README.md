# cdp-app-shuttering

CDP App Shuttering - Tools and templates for creating shuttering pages for CDP applications.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development set up](#local-development-set-up)
- [Interactive Shuttering Page Creator](#interactive-shuttering-page-creator)
- [Code Quality](#code-quality)
- [More Information on the CDP App Shuttering Template](#more-information-on-the-cdp-app-shuttering-template)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22.17.1` and [npm](https://nodejs.org/) `>= v10.9.2`.

> [!TIP]
> To install Node.js and npm Use Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of `Node.js` for this application, via `nvm`:

```bash
cd cdp-portal-frontend
nvm use
```

## Local development set up

Install application dependencies:

```bash
npm install
```

This will install dependencies for all workspaces, including the `cdp-app-shuttering-template`.

## Interactive Shuttering Page Creator

The easiest way to create a new shuttering page is using the interactive CLI tool:

```bash
npm run create:interactive
```

This interactive script will:

1. **Prompt for service name** - Enter your service name (lowercase letters, numbers, and hyphens only)
2. **Create service folder** - Automatically creates `tenants/<your-service-name>/content.njk`
3. **Prompt to edit** - Pause for you to edit the `content.njk` file with your custom content
4. **Build HTML** - Generates the shuttering page HTML using your content
5. **Preview in browser** - Automatically opens the generated HTML in your default browser
6. **Iterative refinement** - If you're not happy with the result, you can edit and rebuild as many times as needed
7. **Git commit** - Optionally creates a git commit with your new service folder

This streamlined workflow is much faster than the manual process and includes automatic browser preview.

## Code Quality

Run formatting checks across the entire repository:

```bash
npm run format:check
```

Format code across the entire repository:

```bash
npm run format
```

Run linting across all workspaces:

```bash
npm run lint
```

These commands run across both the root repository and all workspace packages.

## More Information on the CDP App Shuttering Template

For detailed documentation on the CDP app shuttering template, including manual setup and build options, see
the [cdp-app-shuttering-template README](./cdp-app-shuttering-template/README.md).
