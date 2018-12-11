const CopyWebpackPlugin = require('copy-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const settings = require('./settings');

console.log('Webpack mode:', settings.mode); // eslint-disable-line no-console

const config = {
  devtool: 'source-map',
  entry: [
    './src/index.js'
  ],
  mode: settings.mode,
  output: {
    path: settings.buildDestination,
    filename: settings.name + '.js',
    libraryTarget: 'amd'
  },
  externals: {
    jquery: {
      amd: 'jquery',
      commonjs: 'jquery',
      commonjs2: 'jquery',
      root: '_'
    },
    qlik: {
      amd: 'qlik',
      commonjs: 'qlik',
      commonjs2: 'qlik',
      root: '_'
    }
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          failOnError: true
        }
      },
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.html$/,
        use: [ {
          loader: 'html-loader',
          options: {
            minimize: true
          }
        }],
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'src/assets/' + settings.name + '.qext',
      'src/assets/' + settings.name + '.png',
      'src/assets/wbfolder.wbl'
    ], {}),
    new StyleLintPlugin()
  ]
};

module.exports = config;
