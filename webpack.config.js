'use strict'

const { resolve } = require('path')

module.exports = {
    entry: './src/main.js',
    output: {
        path: __dirname,
        filename: './public/bundle.js',
    },
    context: __dirname,
    devtool: 'source-map',
    resolve: {
        extensions: ['.js'],
    },
    module: {
        loaders: [
            {
                test: /js$/,
                include: resolve(__dirname, './src'),
                loader: 'babel-loader',
                query: {
                    presets: ['es2015'],
                },
            },
        ],
    },
}
