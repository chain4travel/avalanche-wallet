import Vue from 'vue'
import { Module } from 'vuex'
import ERCNftToken from '@/js/ERCNftToken'
import {
    ERCNftBalance,
    ERCNftModuleState,
    ERCNftTokenInput,
} from '@/store/modules/assets/modules/types'
import { RootState } from '@/store/types'
import ERCNft_TOKEN_LIST from '@/ERC721Tokenlist.json'
import { WalletType } from '@/js/wallets/types'
import { web3 } from '@/evm'

const ercNft_module: Module<ERCNftModuleState, RootState> = {
    namespaced: true,
    state: {
        lastScannedBlock: 0,
        scannedTokens: new Set(),
        evmAddress: '',
        walletPrefix: '',
        ercNftTokens: [],
        ercNftTokensCustom: [],
        walletBalance: {},
    },
    mutations: {
        clear(state: ERCNftModuleState) {
            state.walletBalance = {}
        },
        loadCustomContracts(state) {
            let tokensRaw = localStorage.getItem('ercNft_tokens') || '[]'
            let tokens: ERCNftTokenInput[] = JSON.parse(tokensRaw)
            state.ercNftTokensCustom = []
            for (var i = 0; i < tokens.length; i++) {
                const token = new ERCNftToken(tokens[i])
                state.ercNftTokensCustom.push(token)
                token.updateSupports()
            }
        },
        saveCustomContracts(state) {
            // ercTokenIds will load later in 'updateWalletBalance'
            const tokenRawData = state.ercNftTokensCustom.map((token) => token.data)
            localStorage.setItem('ercNft_tokens', JSON.stringify(tokenRawData))
        },
        loadLastScannedBlock(state) {
            if (state.walletPrefix === '') return
            state.lastScannedBlock = parseInt(
                localStorage.getItem(state.walletPrefix + '_lastScanned') ?? '0'
            )
            const scannedTokens = localStorage.getItem(state.walletPrefix + '_scanned')
            if (scannedTokens) state.scannedTokens = new Set(JSON.parse(scannedTokens))
        },
        saveLastScannedBlock(state) {
            if (state.walletPrefix === '') return
            localStorage.setItem(
                state.walletPrefix + '_lastScanned',
                state.lastScannedBlock.toString()
            )
            localStorage.setItem(
                state.walletPrefix + '_scanned',
                JSON.stringify([...state.scannedTokens.values()])
            )
        },
    },
    actions: {
        async removeCustom({ state, commit }, data: ERCNftToken) {
            const index = state.ercNftTokensCustom.indexOf(data)
            state.ercNftTokensCustom.splice(index, 1)

            Vue.delete(state.walletBalance, data.data.address)
            commit('saveCustomContracts')
        },

        async addCustom({ state, dispatch, commit }, data: ERCNftTokenInput) {
            let tokens = state.ercNftTokens.concat(state.ercNftTokensCustom)

            // Make sure its not added before
            for (var i = 0; i < tokens.length; i++) {
                let t = tokens[i]
                if (data.address === t.data.address && data.chainId === t.data.chainId) {
                    throw new Error('Collection already added.')
                }
            }

            let token = new ERCNftToken(data)
            await token.updateSupports()

            if (token.canSupport) {
                state.ercNftTokensCustom = state.ercNftTokensCustom.concat([token])
                dispatch('updateWalletBalance')
                commit('saveCustomContracts')
                return token
            }
            throw new Error('Unsupported contract.')
        },

        async init({ state, commit }) {
            // Load default ercNft token contracts
            let ercNftTokens: ERCNftTokenInput[] = ERCNft_TOKEN_LIST.tokens
            for (var i = 0; i < ercNftTokens.length; i++) {
                ercNftTokens[i].address = web3.utils.toChecksumAddress(ercNftTokens[i].address)
                const token = new ERCNftToken(ercNftTokens[i])
                state.ercNftTokens.push(token)
                await token.updateSupports()
            }
            commit('loadCustomContracts')
        },
        updateUserNfts({ state, rootState, commit }) {
            const wallet = rootState.activeWallet
            if (!wallet) return

            state.evmAddress = '0x' + wallet.getEvmAddress()
            state.walletPrefix = wallet.chainId + '_' + wallet.getEvmAddress()
            commit('clear')
            commit('loadLastScannedBlock')
        },
        updateWalletBalance({ state, rootState, getters }) {
            let w: WalletType | null = rootState.activeWallet
            if (!w) return

            let walletAddr = '0x' + w.getEvmAddress()

            // Loop through contracts and update wallet balance object
            let contracts: ERCNftToken[] = getters.networkContracts
            for (var i = 0; i < contracts.length; i++) {
                let ercNft = contracts[i]
                ercNft
                    .getAllTokensIds(walletAddr)
                    .then((tokenIds: ERCNftBalance[]) => {
                        state.walletBalance = {
                            ...state.walletBalance,
                            [ercNft.data.address]: tokenIds
                        }
                        ercNft.data.ercTokenIds = tokenIds.map(token => token.tokenId)
                        // Vue.set(state.walletBalance, ercNft.data.address, tokenIds)
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            }
        },
    },
    getters: {
        networkContracts(state: ERCNftModuleState, _, rootState: RootState): ERCNftToken[] {
            let tokens = state.ercNftTokens.concat(state.ercNftTokensCustom)
            //@ts-ignore
            let chainId = rootState.Assets.evmChainId
            let filt = tokens.filter((t) => {
                if (t.data.chainId !== chainId) return false
                return true
            })
            return filt
        },

        networkContractsCustom(state: ERCNftModuleState, getters): ERCNftToken[] {
            let contracts: ERCNftToken[] = getters.networkContracts
            return contracts.filter((c) => {
                return state.ercNftTokensCustom.includes(c)
            })
        },
        owned: (state: ERCNftModuleState) => (contractAddr: string, tokenId: string) => {
            let bal = state.walletBalance[contractAddr]
            return bal.find((erc) => erc.tokenId === tokenId)?.quantity
        },
        totalOwned(state: ERCNftModuleState) {
            let bal = state.walletBalance
            let tot = 0
            for (let contractAddr in bal) {
                for (let ercNftBalance of bal[contractAddr]) {
                    tot += ercNftBalance.quantity
                }
            }
            return tot
        },
        totalCollectionsOwned(state: ERCNftModuleState) {
            let bal = state.walletBalance
            let tot = 0
            for (let contractAddress in bal) {
                let len = bal[contractAddress].length
                if (len > 0) tot++
            }
            return tot
        },
        find: (_, getters) => (contractAddr: string) => {
            let tokens: ERCNftToken[] = getters.networkContracts
            for (var i = 0; i < tokens.length; i++) {
                let t = tokens[i]
                if (t.data.address === contractAddr) {
                    return t
                }
            }
            return null
        },
    },
}

export default ercNft_module
