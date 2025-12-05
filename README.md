# cdp-app-shuttering

Tools and templates for creating shuttering pages for CDP applications.

## Quick Start

Install dependencies

```bash
npm install
```

Create a shuttering page interactively

```bash
npm run create:interactive
```

Test the workflow locally

```bash
npm run test:workflow

```

Test the ci workflow locally

```bash
npm run test:workflow -- --ci

```

## Requirements

- [Node.js](http://nodejs.org/) `>= v22.17.1`
- [npm](https://nodejs.org/) `>= v10.9.2`

> [!TIP]
> Use [nvm](https://github.com/creationix/nvm) to manage Node.js versions: `nvm use`

## Available Commands

| Command                         | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `npm run create:interactive`    | Create a new shuttering page interactively     |
| `npm run test:workflow`         | Test the complete workflow with a test service |
| `npm run test:workflow -- --ci` | Test by detecting changed files (simulates CI) |
| `npm run format:check`          | Check code formatting                          |
| `npm run format`                | Format code                                    |
| `npm run lint`                  | Run linting                                    |

## Documentation

For detailed documentation, see the [cdp-app-shuttering-template README](./cdp-app-shuttering-template/README.md).

```

```
