# cdp-shuttering-template

A simple template to build the CDP shuttering HTML markup and associated assets using govuk-frontend. This HTML and associated assets are used for the CDP shuttering page, presented to users when a CDP application has been shuttered.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
- [Interactive Shuttering Page Creator (Recommended)](#interactive-shuttering-page-creator-recommended)
- [Adding custom html content](#adding-custom-html-content)
- [Development](#development)
- [Production Build](#production-build)
- [Demo](#demo)
- [Raw Assets](#raw-assets)
- [Testing](#testing)
  - [Standalone Mode](#standalone-mode)
  - [CI Mode](#ci-mode)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22.17.1` and [npm](https://nodejs.org/) `>= v10.9.2`.

> [!TIP]
> To install Node.js and npm Use Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of `Node.js` for this application, via `nvm`:

```bash
cd cdp-shuttering-tempalte
nvm use
```

## Local development

### Setup

Install application dependencies from the **project root**:

```bash
cd ..
npm install
```

This uses npm workspaces to install dependencies for all packages.

Alternatively, you can install dependencies directly in this folder:

```bash
npm install
```

## Interactive Shuttering Page Creator (Recommended)

The easiest way to create a new shuttering page is using the interactive CLI tool:

```bash
npm run create:interactive
```

This interactive script will:

1. **Prompt for service name** - Enter your service name (lowercase letters, numbers, and hyphens only)
2. **Create service folder** - Automatically creates `../tenants/<your-service-name>/content.njk`
3. **Prompt to edit** - Pause for you to edit the `content.njk` file with your custom content
4. **Build HTML** - Generates the shuttering page HTML using your content
5. **Preview in browser** - Automatically opens the generated HTML in your default browser
6. **Iterative refinement** - If you're not happy with the result, you can edit and rebuild as many times as needed
7. **Git commit** - Optionally creates a git commit with your new service folder

This streamlined workflow is much faster than the manual process below and includes automatic browser preview.

## Adding custom html content

1. Cd into cdp-app-shuttering-template

```bash
cd cdp-app-shuttering-template
```

2. Run the create custom content script

```bash
npm run create:content -- --service=<your-service-name>
```

3. Update the content in the `services/<your-service-name>/content.njk` generated file
4. Run the build command to generate the HTML with your custom content

```bash
npm run build:dev -- --service=<your-service-name>
```

5. Open up the generated html in the .dist folder to see your custom content in the shutter page
6. If you are happy with the content then raise a PR with your service folder and `content.njk` macro in it

## Development

Basically un-minified files with no content hashes to make it easier to read and debug

```bash
npm install
npm run build:dev
```

Rendered assets will be available in the `.dist` folder

## Production Build

> [!TIP]
> using npm run build:prod will create minified HTML and asset files for production use. The HTML will be minified and
> the assets will be minified and made production ready with their filenames containing contents hashes

```bash
npm install
npm run build:prod
```

Rendered and minified assets and HTML will be available in the `.dist` folder

## Demo

Screenshot of the generated HTML and assets. Currently using `govuk-frontend v5.13.0`

![Demo of Shuttering HTML](docs/shuttering-example.png 'Shuttering Example')

## Raw Assets

The rendered HTML and assets are available in the `.raw-assets` folder. These are the minified markup and assets that
will be used for the CDP Shuttering pages

## Testing

A unified test script is available to help validate the shuttering page workflow locally before pushing to GitHub. It supports two modes: standalone (default) and CI mode.

```bash
npm run test:workflow
```

### Standalone Mode

Tests the complete shuttering page workflow by creating a test service, building, validating, and generating screenshots.

```bash
npm run test:workflow
```

#### Options

| Option                 | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `-s, --service <name>` | Service name to test with (default: `test-service`)               |
| `--skip-cleanup`       | Keep test files after completion for inspection                   |
| `--skip-screenshot`    | Skip screenshot generation (useful if Playwright isn't installed) |
| `--open-browser`       | Open the generated HTML in your default browser                   |

#### Examples

```bash
# Run with default test-service
npm run test:workflow

# Use a custom service name
npm run test:workflow -- --service=my-test-service

# Keep files for inspection and open in browser
npm run test:workflow -- --skip-cleanup --open-browser

# Skip screenshots (faster, no Playwright required)
npm run test:workflow -- --skip-screenshot
```

#### What it does

1. Cleans previous build
2. Creates a test service folder with `content.njk`
3. Builds the shuttering page (production mode)
4. Validates the HTML
5. Generates validation comment markdown
6. Generates screenshot (if Playwright available)
7. Generates screenshot comment markdown
8. Verifies all output files exist
9. Cleans up test files (unless `--skip-cleanup`)

### CI Mode

Simulates the GitHub Actions CI workflow locally by detecting changed files in your branch and validating only those services.

```bash
npm run test:workflow -- --ci
```

> [!TIP]
> To get this script to run fully you need to create a new service or edit an existing service's `content.njk` file compared to the base branch (default: `origin/main`) and commit it. This simulates the changes that would be present in a pull request.

1. Create new service with `content.njk`

```bash
npm run create:content -- --service=<your-service-name>
```

2. Run ci workflow test

```bash
npm run test:workflow -- --ci
```

#### Options

| Option                       | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `--ci`                       | Enable CI mode (detect changed files from git)          |
| `-b, --base-branch <branch>` | Base branch to compare against (default: `origin/main`) |
| `--skip-screenshot`          | Skip screenshot generation                              |

#### Examples

```bash
# Compare against origin/main (default)
npm run test:workflow -- --ci

# Compare against a different branch
npm run test:workflow -- --ci --base-branch=origin/develop

# Skip screenshots for faster testing
npm run test:workflow -- --ci --skip-screenshot
```

#### What it does

1. Detects changed `content.njk` files compared to the base branch
2. Builds and validates only the changed services
3. Generates validation comment markdown
4. Generates screenshots for changed services
5. Generates screenshot comment markdown

> [!NOTE]
> CI mode requires you to be on a branch with changes to `tenants/*/content.njk` files compared to the base branch.

### Prerequisites for Screenshots

To generate screenshots, you need Playwright installed:

```bash
npx playwright install chromium
```

If Playwright is not installed, the scripts will skip screenshot generation automatically.
