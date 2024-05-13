const HtmlWebPackPlugin = require('html-webpack-plugin')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')
const { VueLoaderPlugin } = require('vue-loader')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const path = require('path')
const Dotenv = require('dotenv-webpack')
const webpack = require('webpack')
const childProcess = require('child_process')
let GIT_COMMIT_HASH

try {
    GIT_COMMIT_HASH = childProcess.execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
    GIT_COMMIT_HASH = 'N/A'
}
module.exports = {
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                include: /src/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    appendTsSuffixTo: [/\.vue$/],
                },
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(scss|css|sass)$/,
                use: ['vue-style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        fallback: {
            fs: false,
            tls: false,
            net: false,
        },
        extensions: ['.tsx', '.ts', '.vue', '.jsx', '.js', '.json'],
        alias: {
            vue: 'vue/dist/vue.min.js',
            '@': path.resolve(__dirname, 'src'),
        },
    },

    plugins: [
        new Dotenv(),
        new webpack.DefinePlugin({
            'process.env.GIT_COMMIT_HASH': JSON.stringify(GIT_COMMIT_HASH),
        }),
        new VueLoaderPlugin(),
        new VuetifyLoaderPlugin(),
        new NodePolyfillPlugin(),
        new ModuleFederationPlugin({
            name: 'wallet',
            filename: 'remoteEntry.js',
            remotes: {},
            exposes: {
                './store': './src/store/index.ts',
                './mountApp': './src/bootloader.ts',
                './AvaNetwork': './src/js/AvaNetwork.ts',
                './moutHomePage': './src/mountHomePage.ts',
                './mountCreate': './src/views/createMount.ts',
                './mountAccessComponents': './src/views/access/mountAccessComponents.ts',
                './mountLegal': './src/views/mountLegal.ts',
                './mountAccountMenu': './src/components/wallet/sidebar/mountAccountMenu.ts',
                './mountAccounts': './src/components/Access/mountAccounts.ts',
                './mountKyesComponent': './src/components/wallet/manage/mountKyesComponent.ts',
                './mountsaveKyesButton': './src/views/wallet/mountSaveKeysButton.ts',
                './mountMultisigWalletSetting': './src/views/mountMultisigWalletSetting.ts',
                './mountVersionComponent': './src/components/misc/mountVersion.ts',
                './mountCreateOfferForm': './src/components/wallet/earn/mountCreateOfferForm.ts',
                './caminoClient': './src/AVA.ts',
            },
        }),
        new HtmlWebPackPlugin({
            template: path.resolve(__dirname, 'public/index.html'),
            favicon: './public/favicon.ico',
        }),
    ],
}
