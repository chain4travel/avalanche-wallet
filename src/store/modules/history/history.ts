import { Module } from 'vuex'
import moment from 'moment'

import { ava, bintools } from '@/AVA'
import { RootState } from '@/store/types'
import { getAddressHistory } from '@/explorer_api'
import { Buffer } from '@c4tplatform/caminojs/dist'

import { ITransactionData, HistoryState } from '@/store/modules/history/types'
import { MultisigTx } from '@/store/modules/signavault/types'
import { parse, UnparsedTx } from './history_utils'

const history_module: Module<HistoryState, RootState> = {
    namespaced: true,
    state: {
        isUpdating: false,
        isUpdatingAll: false,
        transactions: [], // Used for the history sidepanel txs
        allTransactions: [], // Used for activity tab txs, paginates
        chains: [],
    },
    mutations: {
        clear(state) {
            state.transactions = []
            state.allTransactions = []
            state.chains = []
        },
    },
    actions: {
        async updateTransactionHistory(
            { state, rootState, rootGetters, dispatch },
            limit: number = 20
        ) {
            let wallet = rootState.activeWallet
            if (!wallet) return

            // If wallet is still loading delay
            // @ts-ignore
            let network = rootState.Network.selectedNetwork

            if (!wallet.isInit) {
                setTimeout(() => {
                    dispatch('updateTransactionHistory')
                }, 500)
                return false
            }

            // can't update if there is no explorer or no wallet
            if (!network || !network.explorerUrl || rootState.address === null) {
                return false
            }

            state.isUpdating = true

            let avmAddrs: string[] = wallet.getAllAddressesX()
            let pvmAddrs: string[] = wallet.getAllAddressesP()

            // this shouldnt ever happen, but to avoid getting every transaction...
            if (avmAddrs.length === 0) {
                state.isUpdating = false
                return
            }

            const txsSRaw = rootGetters['Signavault/transactions'] as MultisigTx[]
            const txsS = parse(
                txsSRaw.map(
                    (r): UnparsedTx => {
                        return {
                            chainID: r.tx.chainId,
                            multisigStatus: r.state,
                            timestamp: r.tx.timestamp,
                            txID: bintools.cb58Encode(Buffer.from(r.tx.id, 'hex')),
                            txBytes: r.tx.unsignedTx,
                        }
                    }
                )
            )

            var txs: ITransactionData[]
            var txsP: ITransactionData[]
            try {
                txs = await getAddressHistory(avmAddrs, limit, ava.XChain().getBlockchainID())
                txsP = await getAddressHistory(pvmAddrs, limit, ava.PChain().getBlockchainID())
            } catch (e: any) {
                txs = []
                txsP = []
                console.log(e)
            }

            let transactions = txs
                .concat(txsP)
                .concat(txsS)
                .sort((x, y) => (moment(x.timestamp).isBefore(moment(y.timestamp)) ? 1 : -1))
            if (limit === 0) {
                state.allTransactions = transactions
                state.transactions = txs
                    .slice(0, 20)
                    .concat(txsP.slice(0, 20))
                    .concat(txsS)
                    .sort((x, y) => (moment(x.timestamp).isBefore(moment(y.timestamp)) ? 1 : -1))
            } else state.transactions = transactions
            state.isUpdating = false
        },
        async updateAllTransactionHistory({ dispatch }) {
            return await dispatch('updateTransactionHistory', 0)
        },
        // Only refresh MultisigTransaction
        async updateMultisigTransactionHistory({ state, rootGetters, commit }) {
            const txsSRaw = rootGetters['Signavault/transactions'] as MultisigTx[]
            const txsS = parse(
                txsSRaw.map(
                    (r): UnparsedTx => {
                        return {
                            chainID: r.tx.chainId,
                            multisigStatus: r.state,
                            timestamp: r.tx.timestamp,
                            txID: bintools.cb58Encode(Buffer.from(r.tx.id, 'hex')),
                            txBytes: r.tx.unsignedTx,
                        }
                    }
                )
            )
            var txs = state.transactions.filter((t) => t.multisigStatus === undefined)
            state.transactions = txs
                .concat(txsS)
                .sort((x, y) => (moment(x.timestamp).isBefore(moment(y.timestamp)) ? 1 : -1))
            txs = state.allTransactions.filter((t) => t.multisigStatus === undefined)
            state.allTransactions = txs
                .concat(txsS)
                .sort((x, y) => (moment(x.timestamp).isBefore(moment(y.timestamp)) ? 1 : -1))
        },
        getAliasChains({ state, rootState }) {
            //@ts-ignore
            let network = rootState.Network.selectedNetwork
            if (!network.explorerUrl) {
                return
            }
            const res = ava.getChains()
            const chains = res.map((r) => {
                return { chainAlias: r.alias, chainID: r.id }
            })
            state.chains = chains
        },
    },
    getters: {
        stakingTxs(state) {
            return state.allTransactions.filter((tx) => {
                let types = ['add_validator', 'add_delegator']
                if (types.includes(tx.type)) {
                    return true
                }
                return false
            })
        },
    },
}

export default history_module
