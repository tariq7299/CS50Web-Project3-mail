const path = require('path');

module.exports = {
    mode: 'development',
    entry: './inbox.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
        {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
            loader: 'babel-loader',
            },
        },
        ],
    },
};