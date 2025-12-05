import path from 'node:path'
import { createRequire } from 'node:module'
import CopyPlugin from 'copy-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { WebpackAssetsManifest } from 'webpack-assets-manifest'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const { NODE_ENV = 'development' } = process.env

const require = createRequire(import.meta.url)
const dirname = import.meta.dirname
const govukFrontendPath = path.dirname(
  require.resolve('govuk-frontend/package.json')
)
const outputDir = path.join(dirname, '.dist', 'assets')

export default {
  entry: {
    application: './src/assets/javascripts/application.js'
  },
  experiments: {
    outputModule: true
  },
  mode: NODE_ENV === 'production' ? 'production' : 'development',
  devtool: NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000
  },
  output: {
    filename:
      NODE_ENV === 'production'
        ? 'javascripts/[name].[contenthash:7].min.js'
        : 'javascripts/[name].js',

    chunkFilename:
      NODE_ENV === 'production'
        ? 'javascripts/[name].[chunkhash:7].min.js'
        : 'javascripts/[name].js',

    path: outputDir,
    libraryTarget: 'module',
    module: true
  },

  resolve: {
    alias: {
      '/public/assets': path.join(govukFrontendPath, 'dist/govuk/assets')
    }
  },
  module: {
    rules: [
      {
        test: /\.(?:s[ac]|c)ss$/i,
        use: [
          'style-loader',
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
              esModule: false
            }
          },
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                loadPaths: [
                  path.join(dirname, 'src/assets/stylesheets'),
                  path.join(dirname, 'src/components')
                ],
                outputStyle: 'minified',
                quietDeps: true,
                includePaths: [path.resolve(dirname, 'src', 'components')]
              }
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[contenthash][ext]'
        }
      },
      {
        test: /\.(ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[fullhash].css'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(govukFrontendPath, 'dist/govuk/assets'),
          globOptions: {
            ignore: [
              path.join(govukFrontendPath, 'dist/govuk/assets/rebrand'),
              path.join(govukFrontendPath, 'dist/govuk/assets/images')
            ]
          }
        },
        {
          from: path.join(govukFrontendPath, 'dist/govuk/assets/rebrand')
        }
      ]
    }),
    new WebpackAssetsManifest({
      publicPath: 'assets/',
      output: '../assets-manifest.json'
    })
  ]
}
