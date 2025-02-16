const path = require('path');

module.exports = {
    entry: "./src/filetsone.ts",
    mode: 'production',
    output: {
        filename: "filetsone.bundle.js",
        path: path.resolve(__dirname, "build"),
        library: {
            type: "module" // ✅ Ensures Webpack outputs a proper ES module
        }
    },
    experiments: {
        outputModule: true // ✅ Required for ES module output
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
};