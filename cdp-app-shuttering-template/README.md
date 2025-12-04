# cdp-shuttering-template

A simple template to build the CDP shuttering HTML markup and associated assets using govuk-frontend. This HTML and
associated assets are used for the CDP shuttering page, presented to users when a CDP application has been shuttered.

1. Run `npm install` to install dependencies
1. Run `npm run build:prod` to create production ready shuttering HTML and assets
1. The generated HTML and assets will be in the `.dist` folder

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
- [Set up](#set-up)
- [Interactive Shuttering Page Creator (Recommended)](#interactive-shuttering-page-creator-recommended)
- [Adding custom html content](#adding-custom-html-content)
- [Development](#development)
- [Production Build](#production-build)
- [Demo](#demo)
- [Raw Assets](#raw-assets)

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

1. Run the create custom content script

```bash
npm run create:content -- --service=<your-service-name>
```

2. Update the content in the `services/<your-service-name>/content.njk` generated file
3. Run the build command to generate the HTML with your custom content

```bash
npm run build:dev -- --service=<your-service-name>
```

4. Open up the generated html in the .dist folder to see your custom content in the shutter page
5. If you are happy with the content then raise a PR with your service folder and `content.njk` macro in it

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
