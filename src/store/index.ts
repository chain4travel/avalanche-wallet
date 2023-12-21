import {
    AccessWalletMultipleInput,
    AccessWalletMultipleInputParams,
    ExportWalletsInput,
    ImportKeyfileInput,
    IssueBatchTxInput,
    RootState,
} from '@/store/types'
import { INetwork, WalletType } from '@/js/wallets/types'
import {
    KEYSTORE_VERSION,
    extractKeysFromDecryptedFile,
    makeKeyfile,
    readKeyFile,
} from '@/js/Keystore'
import { ava, bintools } from '@/AVA'

import Accounts from './modules/accounts/accounts'
import { AllKeyFileDecryptedTypes } from '@/js/IKeystore'
import Assets from './modules/assets/assets'
import { Buffer as BufferAvalanche } from '@c4tplatform/caminojs/dist'
import History from './modules/history/history'
import Launch from './modules/launch/launch'
import Ledger from './modules/ledger/ledger'
import { LedgerWallet } from '@/js/wallets/LedgerWallet'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import { MultisigAliasReply } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import Network from './modules/network/network'
import Notifications from './modules/notifications/notifications'
import Platform from './modules/platform/platform'
import Signavault from './modules/signavault/signavault'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import Vue from 'vue'
import Vuex from 'vuex'
import createHash from 'create-hash'
import { getAvaxPriceUSD } from '@/helpers/price_helper'
import { getMultisigAliases } from '@/explorer_api'
import { privateToAddress } from '@ethereumjs/util'
import router from '@/router'
import { updateFilterAddresses } from '../providers'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        Assets,
        Notifications,
        Network,
        History,
        Platform,
        Ledger,
        Accounts,
        Launch,
        Signavault,
    },
    state: {
        network: {
            name: '',
            id: '',
            protocol: '',
            port: 0,
            ip: '',
            networkId: 0,
            url: '',
            explorerUrl: '',
            explorerSiteUrl: '',
            signavaultUrl: '',
            readonly: false,
            withCredentials: false,
        },
        isAuth: false,
        activeWallet: null,
        storedActiveWallet: null,
        address: null, // current active derived address
        wallets: [],
        volatileWallets: [], // will be forgotten when tab is closed
        warnUpdateKeyfile: false, // If true will promt the user the export a new keyfile
        multiSigAliases: [],
        theme: 'light',
        walletsDeleted: false,
        prices: {
            usd: 0,
        },
    },
    getters: {
        addresses(state: RootState): string[] {
            let wallet = state.activeWallet
            if (!wallet) return []
            let addresses = wallet.getAllAddressesX()
            return addresses
        },
        staticAddresses: (state: RootState) => (): string[] => {
            return state.wallets.map((w) => w.getStaticAddress('P')).filter((e) => e != '')
        },
        accountChanged(state: RootState): boolean {
            return (
                state.volatileWallets.length > 0 ||
                state.warnUpdateKeyfile ||
                state.walletsDeleted ||
                state.activeWallet !== state.storedActiveWallet
            )
        },
        multiSigAliases(state: RootState): string[] {
            return state.multiSigAliases
        },
    },
    mutations: {
        updateTheme(state) {
            if (state.theme === 'light') state.theme = 'light'
            else state.theme = 'dark'
        },
        updateActiveAddress(state) {
            if (!state.activeWallet) {
                state.address = null
            } else {
                let addrNow = state.activeWallet.getCurrentAddressAvm()
                state.address = addrNow

                // Update the websocket addresses
                updateFilterAddresses()
            }
        },
        setActiveWallet(state, wallet) {
            state.activeWallet = wallet
            if (!state.storedActiveWallet) state.storedActiveWallet = wallet
        },
        setNetwork(state, net: INetwork) {
            state.network = net
        },
    },
    actions: {
        // Used in home page to access a user's wallet
        // Used to access wallet with a single key
        // TODO rename to accessWalletMenmonic
        async accessWallet({ dispatch, commit }, mnemonic: string): Promise<MnemonicWallet> {
            const wallet: MnemonicWallet = await dispatch('addWalletMnemonic', { key: mnemonic })

            commit('setActiveWallet', wallet)
            dispatch('onAccess')
            return wallet
        },

        // Only for singletons and mnemonics
        async accessWalletMultiple(
            { state, dispatch, commit },
            { keys: keyList, activeIndex }: AccessWalletMultipleInputParams
        ) {
            for (var i = 0; i < keyList.length; i++) {
                try {
                    let keyInfo = keyList[i]
                    if (keyInfo.type === 'mnemonic') {
                        await dispatch('addWalletMnemonic', { file: keyInfo })
                    } else if (keyInfo.type === 'singleton') {
                        await dispatch('addWalletSingleton', { file: keyInfo })
                    } else {
                        await dispatch('addWalletsMultisig', { file: keyInfo })
                    }
                } catch (e) {
                    continue
                }
            }
            if (activeIndex >= keyList.length) activeIndex = 0
            commit('setActiveWallet', state.wallets[activeIndex])
            dispatch('onAccess', state.wallets[activeIndex])
            dispatch('updateMultisigWallets')
        },

        async accessWalletLedger({ state, commit, dispatch }, wallet: LedgerWallet) {
            state.wallets = [wallet]

            commit('setActiveWallet', wallet)
            dispatch('onAccess')
        },

        async accessWalletSingleton({ commit, dispatch }, key: string) {
            let wallet = await dispatch('addWalletSingleton', { key })

            commit('setActiveWallet', wallet)
            dispatch('onAccess')
        },

        async onAccess({ state, dispatch }) {
            state.isAuth = true
            dispatch('activateWallet', state.activeWallet)
        },

        async logout(store) {
            localStorage.removeItem('w')
            store.state.wallets = []
            store.state.volatileWallets = []
            store.state.activeWallet = null
            store.state.storedActiveWallet = null
            store.state.address = null
            store.state.isAuth = false
            store.state.multiSigAliases = []
            store.dispatch('Accounts/onLogout')
            store.dispatch('Assets/onLogout')
            store.dispatch('Launch/onLogout')
            router.push('/login')
        },

        // used with logout
        async removeAllKeys({ state, dispatch }) {
            let wallets = state.wallets

            while (wallets.length > 0) {
                let wallet = wallets[0]
                await dispatch('removeWallet', wallet)

                // @ts-ignore
                let { dispatchNotification } = this.globalHelper()
                dispatchNotification({
                    title: 'Key Removed',
                    message: 'Private key and assets removed from the wallet.',
                })
            }

            state.wallets = []
            state.volatileWallets = []
        },

        // Add a HD wallet from mnemonic string
        async addWalletMnemonic(
            { state },
            { key, file }
        ): Promise<MnemonicWallet | SingletonWallet | null> {
            // Cannot add mnemonic wallets on ledger mode
            if (state.activeWallet?.type === 'ledger') return null

            // get mnemonic either from key or from file
            const mnemonic = (file as AccessWalletMultipleInput) ? file.key : (key as string)
            const accountHash = createHash('sha256').update(mnemonic).digest()

            // Split mnemonic and seed hash
            const mParts = mnemonic.split('\n')

            // Make sure wallet doesnt exist already
            for (const w of state.wallets) {
                if (w.type === 'mnemonic' && w.accountHash === accountHash) {
                    throw new Error('Wallet already exists.')
                }
            }

            // let wallet = new MnemonicWallet(mParts[0], mParts[1])
            let wallet = new SingletonWallet('', mParts[0], mParts[1])
            if (file?.name) wallet.name = file.name
            wallet.accountHash = accountHash
            state.wallets = [...state.wallets, wallet]
            state.volatileWallets = [...state.volatileWallets, wallet]
            if (!file) this.dispatch('updateMultisigWallets')
            return wallet
        },

        // Add a singleton wallet from private key string
        async addWalletSingleton(
            { state, dispatch },
            { key, file }
        ): Promise<SingletonWallet | null> {
            let pk = (file as AccessWalletMultipleInput) ? file.key : key
            const accountHash = createHash('sha256').update(pk).digest()

            try {
                let keyBuf = Buffer.from(pk, 'hex')
                // @ts-ignore
                privateToAddress(keyBuf)
                pk = `PrivateKey-${bintools.cb58Encode(BufferAvalanche.from(keyBuf))}`
            } catch (e) {
                //
            }

            // Cannot add singleton wallets on ledger mode
            if (state.activeWallet?.type === 'ledger') return null

            // Make sure wallet doesnt exist already
            for (const w of state.wallets) {
                if (w.type === 'singleton' && w.accountHash === accountHash) {
                    throw new Error('Wallet already exists.')
                }
            }

            let wallet = new SingletonWallet(pk)
            if (file?.name) wallet.name = file.name
            wallet.accountHash = accountHash
            state.wallets = [...state.wallets, wallet]
            state.volatileWallets = [...state.volatileWallets, wallet]
            if (!file) this.dispatch('updateMultisigWallets')
            return wallet
        },

        async fetchMultiSigAliases(
            { state, getters },
            { disable }: { disable: boolean }
        ): Promise<string[] | null> {
            try {
                if (!disable) {
                    const staticAddresses = getters['staticAddresses']('P')
                    const multisigAliases = await getMultisigAliases(staticAddresses)
                    if (!multisigAliases || multisigAliases.length === 0) {
                        state.wallets = state.wallets.filter((wallet) => wallet.type !== 'multisig')
                        state.multiSigAliases = []
                        return null
                    }
                    multisigAliases.forEach((alias: string) => {
                        bintools.parseAddress(`P-${alias}`, 'P', ava.getHRP())
                    })
                    state.multiSigAliases = multisigAliases
                    return multisigAliases
                }
                state.multiSigAliases = []
                return []
            } catch (e) {
                return null
            }
        },
        // Add a multisig wallet from multisig alias
        async addWalletsMultisig(
            { state, getters },
            { keys, file }
        ): Promise<MultisigWallet[] | null> {
            // Cannot add singleton wallets on ledger mode
            if (state.activeWallet?.type === 'ledger') return null

            if (file as AccessWalletMultipleInput) {
                const wallet = new MultisigWallet()
                if (file.name) wallet.name = file.name
                wallet.accountHash = createHash('sha256').update(file.key).digest()
                wallet.setKey(file.key)
                state.wallets = [...state.wallets, wallet]
                state.volatileWallets = [...state.volatileWallets, wallet]
                return [wallet]
            }

            const wallets: MultisigWallet[] = []
            const staticAddresses = getters.staticAddresses('P') as string[]
            state.wallets = state.wallets.filter((wallet) => wallet.type != 'multisig')
            for (const alias of keys as string[]) {
                var response: MultisigAliasReply
                try {
                    // get owner from alias
                    response = await ava.PChain().getMultisigAlias(alias)
                } catch (e) {
                    continue
                }

                const aliasBuffer = bintools.stringToAddress(alias)
                // Make sure wallet doesnt exist already
                for (const wallet of state.wallets) {
                    if (wallet.type === 'multisig') {
                        if ((wallet as MultisigWallet).alias().compare(aliasBuffer) === 0) {
                            throw new Error('Wallet already exists.')
                        }
                    }
                }

                // Check that we have at least one staticAddress in owner
                if (!response.addresses.some((address) => staticAddresses.includes(address)))
                    continue

                const wallet = new MultisigWallet(aliasBuffer, response.memo, response)
                wallet.accountHash = createHash('sha256').update(wallet.getKey()).digest()
                wallets.push(wallet)
                state.wallets = [...state.wallets, wallet]
                state.volatileWallets = [...state.volatileWallets, wallet]
                this.dispatch('updateMultisigWallets')
            }
            return wallets
        },
        async editWalletsMultisig(
            { state, dispatch, getters },
            { keys }
        ): Promise<MultisigWallet[] | null> {
            // Cannot add singleton wallets on ledger mode
            if (state.activeWallet?.type === 'ledger') return null

            const wallets: MultisigWallet[] = []
            const staticAddresses = getters.staticAddresses('P') as string[]
            for (const alias of keys as string[]) {
                var response: MultisigAliasReply
                try {
                    // get owner from alias
                    response = await ava.PChain().getMultisigAlias(alias)
                } catch (e) {
                    continue
                }

                const aliasBuffer = bintools.stringToAddress(alias)
                const oldWallet = state.wallets.find((w) => {
                    if (
                        (w.type === 'multisig' &&
                            (w as MultisigWallet).alias().compare(aliasBuffer)) === 0
                    ) {
                        return true
                    }
                    return false
                })

                if (oldWallet) {
                    if (!response.addresses.some((address) => staticAddresses.includes(address)))
                        // Check that we have at least one staticAddress in owner
                        continue

                    const wallet = new MultisigWallet(aliasBuffer, response.memo, response)
                    wallet.accountHash = createHash('sha256').update(wallet.getKey()).digest()
                    const indexOfOldWalelt = state.wallets.indexOf(oldWallet)
                    state.wallets[indexOfOldWalelt] = wallet
                    dispatch('activateWallet', state.wallets[indexOfOldWalelt])
                    this.dispatch('updateMultisigWallets')
                }
            }
            return wallets
        },
        removeWallet({ state, dispatch, commit }, wallet: WalletType) {
            let index = state.wallets.indexOf(wallet)
            let wallets = [...state.wallets]
            wallets.splice(index, 1)
            state.wallets = wallets
            state.walletsDeleted = true
            index = state.volatileWallets.indexOf(wallet)
            if (index >= 0) {
                let volatileWallets = [...state.volatileWallets]
                volatileWallets.splice(index, 1)
                state.volatileWallets = volatileWallets
            }
            commit('Accounts/deleteKey', wallet)
            dispatch('updateMultisigWallets')
        },

        updateMultisigWallets({ state }) {
            state.wallets.forEach((w) => {
                if (w instanceof MultisigWallet) w.updateWallets(state.wallets)
            })
        },

        async issueBatchTx({ state }, data: IssueBatchTxInput) {
            let wallet = state.activeWallet
            if (!wallet) return 'error'

            let txId: string = await wallet.issueBatchTx(
                data.chainId,
                data.orders,
                data.toAddress,
                data.memo
            )
            return txId
        },

        activateWallet({ dispatch, commit }, wallet: MnemonicWallet | LedgerWallet) {
            if (wallet) {
                wallet.initialize()
                commit('setActiveWallet', wallet)
                commit('updateActiveAddress')
            }

            dispatch('Assets/updateWallet').then(() => {
                dispatch('Assets/updateAvaAsset')
                dispatch('Accounts/updateKycStatus')
                dispatch('updateBalances')
                updateFilterAddresses()
                dispatch('Platform/update')
                dispatch('fetchMultiSigAliases', { disable: false })
            })
        },

        async exportWallets({ state, dispatch }, input: ExportWalletsInput) {
            try {
                let pass = input.password
                let wallets = input.wallets
                let wallet = state.activeWallet as MnemonicWallet | SingletonWallet | null
                if (!wallet) throw new Error('No active wallet.')
                let activeIndex = wallets.findIndex((w) => w.id == wallet!.id)

                let file_data = await makeKeyfile(wallets, pass, activeIndex)

                // Download the file
                let text = JSON.stringify(file_data)
                // let addr = file_data.keys[0].address.substr(2,5);

                let utcDate = new Date()
                let dateString = utcDate.toISOString().replace(' ', '_')
                let filename = `NATIVE_${dateString}.json`

                var blob = new Blob([text], {
                    type: 'application/json',
                })
                let url = URL.createObjectURL(blob)
                var element = document.createElement('a')

                element.setAttribute('href', url)
                element.setAttribute('download', filename)
                element.style.display = 'none'
                document.body.appendChild(element)
                element.click()
                document.body.removeChild(element)
            } catch (e) {
                // @ts-ignore
                let { dispatchNotification } = this.globalHelper()
                dispatchNotification({
                    title: 'Export Wallet',
                    message: 'Error exporting wallet.',
                    type: 'error',
                })
            }
        },

        // Given a key file with password, will try to decrypt the file and add keys to user's
        // key chain
        async importKeyfile(store, data: ImportKeyfileInput) {
            let pass = data.password
            let fileData = data.data

            let version = fileData.version

            // Decrypt the key file with the password
            let keyFile: AllKeyFileDecryptedTypes = await readKeyFile(fileData, pass)
            // Extract wallet keys
            let keys = extractKeysFromDecryptedFile(keyFile)

            // If not auth, login user then add keys
            if (!store.state.isAuth) {
                await store.dispatch('accessWalletMultiple', {
                    keys,
                    activeIndex: keyFile.activeIndex,
                })
            } else {
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i]

                    // Private keys from the keystore file do not have the PrivateKey- prefix
                    if (key.type === 'mnemonic') {
                        await store.dispatch('addWalletMnemonic', { file: key })
                    } else if (key.type === 'singleton') {
                        await store.dispatch('addWalletSingleton', { file: key })
                    } else if (key.type === 'multisig') {
                        await store.dispatch('addWalletsMultisig', { file: key })
                    }
                }
            }

            // Keystore warning flag asking users to update their keystore files;
            store.state.warnUpdateKeyfile = false
            if (version !== KEYSTORE_VERSION) {
                store.state.warnUpdateKeyfile = true
            }
            store.state.volatileWallets = []

            return {
                success: true,
                message: 'success',
            }
        },

        async updateAvaxPrice(store) {
            let usd = await getAvaxPriceUSD()
            store.state.prices = {
                usd,
            }
        },

        updateTransaction(
            { dispatch },
            options: {
                fullHistory: boolean
                onlyMultisig: boolean
                withMultisig: boolean
                msgType: 'success'
                msgTitle: 'Validator Added'
                msgText: 'Your tokens are now locked to stake.'
            }
        ) {
            if (options.onlyMultisig) {
                setTimeout(() => {
                    dispatch('Signavault/updateTransaction').then(() => {
                        dispatch('History/updateMultisigTransactionHistory')
                    })
                }, 3000)
            } else if (options.withMultisig) {
                setTimeout(() => {
                    dispatch('Assets/updateUTXOs')
                    dispatch('Signavault/updateTransaction').then(() => {
                        dispatch(
                            options.fullHistory
                                ? 'History/updateAllTransactionHistory'
                                : 'History/updateTransactionHistory'
                        )
                    })
                }, 3000)
            } else {
                setTimeout(() => {
                    dispatch('Assets/updateUTXOs')
                    dispatch('History/updateTransactionHistory')
                }, 3000)
            }
        },
        updateBalances({ dispatch }) {
            dispatch('Assets/updateUTXOs').then(() =>
                dispatch('Signavault/updateTransaction', undefined, { root: true }).then(() => {
                    dispatch('History/updateTransactionHistory')
                })
            )
            dispatch('Platform/updateAddressStates')
        },
    },
})
