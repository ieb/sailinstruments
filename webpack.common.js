const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

function isExternal(module) {
  var context = module.context;

  if (typeof context !== 'string') {
    return false;
  }

  return context.indexOf('node_modules') !== -1;
}

module.exports = {
  entry: {
     app: './src/index.jsx',
     print: './src/print.js'
  },  
  plugins: [
     new CleanWebpackPlugin(['dist']),
     new HtmlWebpackPlugin({
       template: 'src/index.html'
     }),
     new webpack.HashedModuleIdsPlugin(),
     new webpack.optimize.CommonsChunkPlugin({
       name: 'vendor',
       minChunks: function(module) {
          return isExternal(module);
       }
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
        test: /\.(jsx|js)$/,
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
        test: /\.(jsx|js)$/,
        include: /node_modules\/ws/,
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