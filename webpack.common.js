const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
     app: './src/index.jsx',
     print: './src/print.js',
     vendor: [
       'lodash',
       'd3',
       'react',
       'react-dom',
       'baconjs',
       'js-quantities',
       '@signalk/signalk-schema',
       'react-grid-layout',
       'react-modal',
       'react-tabs'
     ]
  },  
  plugins: [
     new CleanWebpackPlugin(['dist']),
     new HtmlWebpackPlugin({
       template: 'src/index.html'
     }),
     new webpack.HashedModuleIdsPlugin(),
     new webpack.optimize.CommonsChunkPlugin({
       name: 'vendor'
     }),
     new webpack.optimize.CommonsChunkPlugin({
       name: 'manifest'
     })
   ],
  externals: ['mdns'],
  output: {
    filename: '[name].[chunkhash].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
     rules: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [ 'react-html-attrs' ],
            presets: ['env', 'react']
          }
        }
      },
       {
         test: /\.css$/,
         exclude: /(node_modules|bower_components)/,
         use: [
           'style-loader',
           'css-loader'
         ]
       },
       {
         test: /\.(png|svg|jpg|gif)$/,
         exclude: /(node_modules|bower_components)/,
         use: [
           'file-loader'
         ]
       },
       {
         test: /\.(woff|woff2|eot|ttf|otf)$/,
         exclude: /(node_modules|bower_components)/,
         use: [
           'file-loader'
         ]
       },
       {
         test: /\.(csv|tsv)$/,
         exclude: /(node_modules|bower_components)/,
         use: [
           'csv-loader'
         ]
       },
       {
         test: /\.xml$/,
         exclude: /(node_modules|bower_components)/,
         use: [
           'xml-loader'
         ]
       },
       {
          test: /README\.txt/,
          use: [
            'ignore-loader'
          ]
       }
     ]
   }
};