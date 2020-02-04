const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const outputPath = path.resolve(__dirname, 'build');

module.exports = {
  mode: 'production',

  // entry: path.resolve(__dirname, 'build-ts/lib/auto-complete-input-export.js'),
  entry: path.resolve(__dirname, 'lib/auto-complete-input-export.ts'),

  output: {
    path: outputPath,
    filename: 'auto-complete-input.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },

  resolve: {
    extensions: [
      '.js', '.jsx', '.ts', '.json'
    ],
  },

  devtool: 'source-map',

  plugins: [
    new CleanWebpackPlugin(),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin()
    ],
  },
}