const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        api: './api.ts',
        timer: './classes/timer.extension.ts'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'umd',
            name: 'typoExt'
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};