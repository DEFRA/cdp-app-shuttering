import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { minify } from 'html-minifier-terser'
import nunjucks from 'nunjucks'
import chalk from 'chalk'

const { NODE_ENV = 'development' } = process.env
const doMinify = NODE_ENV === 'production'

async function getGovFrontendVersion(pkgFilePath) {
  const fileContent = await readFile(pkgFilePath, 'utf-8')
  const packageJson = JSON.parse(fileContent)
  const version = packageJson.dependencies['govuk-frontend']

  console.log(chalk.blue(`govuk-frontend version: ${version}`))
  return version
}

const args = process.argv.slice(2)
const serviceArg = args.find((arg) => arg.startsWith('--service='))
const service = serviceArg ? serviceArg.split('=')[1] : 'default-content'

/**
 * Little script that builds the shuttering html page and associated files into the .dist folder
 * Setting the NODE_ENV to 'production' will minify the html output and the assets
 * Govuk Frontend version used is shown in the `govuk-frontend-version` html meta tag
 * @returns {Promise<void>}
 */
async function buildHtmlAndAssets() {
  const nunjucksEnvironment = nunjucks.configure(
    [
      'node_modules/govuk-frontend/dist/',
      path.normalize(path.resolve('src')),
      path.normalize(path.resolve('../tenants'))
    ],
    { autoescape: true }
  )
  const manifestPath = path.resolve('.dist/assets-manifest.json')
  const pkgFilePath = path.resolve('package.json')
  const webpackManifest = {}

  try {
    webpackManifest.contents = JSON.parse(await readFile(manifestPath, 'utf-8'))
  } catch (error) {
    console.error(chalk.red(error))
  }

  const globals = {
    pageTitle: 'Service Unavailable',
    serviceName: 'Service Unavailable',
    service,
    govukFrontendVersion: await getGovFrontendVersion(pkgFilePath),
    govukRebrand: true,
    getAssetPath: (asset) => webpackManifest.contents[asset]
  }

  Object.entries(globals).forEach(([key, value]) =>
    nunjucksEnvironment.addGlobal(key, value)
  )

  const htmlFiles = await readdir('src/templates/views/')

  for (const file of htmlFiles) {
    const html = nunjucks.render(`templates/views/${file}`)
    const output = doMinify
      ? await minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          removeEmptyElements: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: true,
          decodeEntities: true,
          collapseBooleanAttributes: true,
          minifyJS: true
        })
      : html

    await writeFile(`.dist/${file.replace('.njk', '.html')}`, output)
  }
}

console.log(chalk.blue(`Building html and assets for service: ${service}...`))
await buildHtmlAndAssets()
console.log(chalk.blue('Build complete!'))
