import { defineConfig } from '@rspack/cli';
import path from 'path';

export default defineConfig({
  context: __dirname,
  entry: './src/extension.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
                target: 'es2022',
              },
              module: {
                type: 'es6', // Override tsconfig.json to emit ES6 modules for bundling
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [],
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
  devtool: 'source-map',
});

