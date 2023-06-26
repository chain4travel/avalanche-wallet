const TerserPlugin = require('terser-webpack-plugin')
const ProvidePlugin = require('webpack/lib/ProvidePlugin')
const path = require('path')
process.env.VUE_APP_VERSION = process.env.npm_package_version
RegExp.prototype.toJSON = RegExp.prototype.toString

module.exports = {
    transpileDependencies: ['vuetify'],
    devServer: {
        /**
         * For e2e testing we turn this off using vue cli --mode e2e
         * @link https://cli.vuejs.org/guide/mode-and-env.html#modes
         */
        https: !process.env.USE_HTTP,
        port: 5000,
    },
    css: { extract: false },
    // publicPath: '',
    configureWebpack: (config) => {
        if (process.env.VUE_CLI_BUILD_TARGET === 'wc') {
            if (process.env.NODE_ENV === 'development') {
                config.devtool = 'source-map'
            }
        } else if (process.env.NODE_ENV === 'production') {
            this.parallel = require('os').cpus().length > 1
            config.optimization = {
                minimize: true,
                minimizer: [new TerserPlugin()],
                splitChunks: {
                    chunks: 'all',
                    minSize: 600 * 1000,
                    maxSize: 2000 * 1000,
                },
            }
        }

        config.resolve = {
            extensions: ['.tsx', '.ts', '.js', '.vue'],
            fallback: {
                assert: require.resolve('assert/'),
                buffer: require.resolve('buffer/'),
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
                http: false,
                https: false,
                os: false,
                fs: false,
                tls: false,
                path: false,
                url: false,
                zlib: false,
                net: false,
            },
            alias: {
                '~root/./src': path.resolve(__dirname, 'src'),
                '@': path.resolve(__dirname, 'src'),
                '/img': false,
            },
        }
        config.plugins.push(
            new ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            })
        )
    },
    pwa: {
        name: 'Camino Wallet',
        manifestOptions: {
            start_url: '/',
        },
        iconPaths: {
            favicon16: 'img/icons/favicon-16x16.png',
            favicon32: 'img/icons/favicon-32x32.png',
            appleTouchIcon: 'img/icons/apple-touch-icon.png',
            maskIcon: 'img/icons/favicon-32x32.png',
            msTileImage: 'img/icons/mstile-150x150.png',
        },
    },
}
