const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/renderer.js',
  target: isDevelopment ? 'web' : 'electron-renderer',
  devtool: isDevelopment ? 'source-map' : false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js',
    publicPath: isDevelopment ? '/' : './',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
      publicPath: '/',
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        // Global CSS files (not module scoped)
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        // CSS Module files (scoped styles)
        test: /\.module\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    ...(!isDevelopment ? [new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    })] : []),
  ],
};
