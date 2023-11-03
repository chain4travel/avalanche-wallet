import { NetworkState } from '@/store/modules/network/types'
import { RootState } from '@/store/types'
import { Module } from 'vuex'

import { ava, infoApi } from '@/AVA'
import { web3 } from '@/evm'
import { explorer_api } from '@/explorer_api'
import { AvaNetwork } from '@/js/AvaNetwork'
import { BN } from '@c4tplatform/caminojs/dist'
import { setSocketNetwork } from '../../../providers'
const network_module: Module<NetworkState, RootState> = {
    namespaced: true,
    state: {
        status: 'disconnected', // disconnected | connecting | connected
        networks: [],
        networksCustom: [],
        selectedNetwork: null,
        txFee: new BN(0),
        depositAndBond: false,
    },
    mutations: {
        addNetwork(state, net: AvaNetwork) {
            state.networks.push(net)
        },
        selectNetwork(state, net: AvaNetwork) {
            state.selectedNetwork = net
        },
    },
    getters: {
        allNetworks(state) {
            return state.networks.concat(state.networksCustom)
        },
        depositAndBond(state) {
            return state.depositAndBond
        },
        selectedNetwork(state) {
            return state.selectedNetwork
        },
    },
    actions: {
        addCustomNetwork({ state, dispatch }, net: AvaNetwork) {
            // Check if network alerady exists
            let networks = state.networksCustom
            // Do not add if there is a network already with the same url
            for (var i = 0; i < networks.length; i++) {
                let url = networks[i].url
                if (net.url === url) {
                    return
                }
            }
            state.networksCustom = [...state.networksCustom, net]
            dispatch('save')
        },
        editNetwork(
            { state, dispatch },
            { net, findNetwork }: { net: AvaNetwork; findNetwork: number }
        ) {
            if (findNetwork >= 0) {
                let newNetworksCustom = [...state.networksCustom]
                newNetworksCustom[findNetwork] = net
                state.networksCustom = newNetworksCustom
                dispatch('save')
            }
        },
        async removeCustomNetwork({ state, dispatch }, net: AvaNetwork) {
            let index = state.networksCustom.indexOf(net)
            if (index !== -1) {
                state.networksCustom.splice(index, 1)
                await dispatch('save')
            }
        },
        saveSelectedNetwork({ state }) {
            let data = JSON.stringify(state.selectedNetwork?.url)
            localStorage.setItem('network_selected', data)
        },
        async loadSelectedNetwork({ dispatch, getters }): Promise<boolean> {
            let data = localStorage.getItem('network_selected')
            if (!data) return false
            try {
                // let net: AvaNetwork = JSON.parse(data);
                let nets: AvaNetwork[] = getters.allNetworks

                for (var i = 0; i < nets.length; i++) {
                    let net = nets[i]
                    if (JSON.stringify(net.url) === data) {
                        await dispatch('setNetwork', net)
                        return true
                    }
                }
                return false
            } catch (e) {
                return false
            }
        },

        // Save custom networks to local storage
        save({ state }) {
            let data = JSON.stringify(state.networksCustom)
            localStorage.setItem('networks', data)
        },
        // Load custom networks from local storage
        load({ dispatch }) {
            let data = localStorage.getItem('networks')

            if (data) {
                let networks: AvaNetwork[] = JSON.parse(data)

                networks.forEach((n) => {
                    let newCustom = new AvaNetwork(
                        n.name,
                        n.url,
                        //@ts-ignore
                        parseInt(n.networkId),
                        n.explorerUrl,
                        n.explorerSiteUrl,
                        n.signavaultUrl,
                        n.readonly
                    )
                    dispatch('addCustomNetwork', newCustom)
                })
            }
        },
        async setNetwork({ state, dispatch, commit, rootState }, net: AvaNetwork) {
            state.status = 'connecting'

            // Chose if the network should use credentials
            await net.updateCredentials()
            ava.setRequestConfig('withCredentials', net.withCredentials)
            ava.setNetwork(net.ip, net.port, net.protocol, net.networkId)

            // Reset transaction history
            commit('History/clear', null, { root: true })

            // Wait until network settings are fetched
            await ava.fetchNetworkSettings()

            ava.XChain().getAVAXAssetID(true)
            ava.PChain().getAVAXAssetID(true)
            ava.CChain().getAVAXAssetID(true)

            commit('selectNetwork', net)
            dispatch('saveSelectedNetwork')

            state.depositAndBond =
                ava.getNetwork().P.lockModeBondDeposit && ava.getNetwork().P.verifyNodeSignature

            // Update explorer api
            explorer_api.defaults.baseURL = net.explorerUrl

            // Set web3 Network Settings
            let web3Provider = `${net.protocol}://${net.ip}:${net.port}/ext/bc/C/rpc`
            web3.setProvider(web3Provider)

            // Set socket connections
            setSocketNetwork(net)

            commit('Assets/removeAllAssets', null, { root: true })
            await dispatch('Assets/updateAvaAsset', null, { root: true })

            // If authenticated
            if (rootState.isAuth) {
                for (const w of rootState.wallets) {
                    w.onNetworkChange()
                }
                if (rootState.activeWallet) {
                    rootState.activeWallet.initialize()
                }
                rootState.wallets = rootState.wallets.filter((wallet) => wallet.type !== 'multisig')
            }

            await dispatch('Assets/onNetworkChange', net, { root: true })
            dispatch('Assets/updateUTXOs', null, { root: true }).then(() => {
                dispatch('Platform/update', null, { root: true })
            })
            dispatch('Platform/update', null, { root: true })
            dispatch('updateTxFee')
            dispatch('Accounts/updateKycStatus', null, { root: true })
            // Update tx history
            this.dispatch('History/getAliasChains')
            await dispatch('Signavault/updateTransaction', undefined, { root: true })
            this.dispatch('History/updateTransactionHistory', null, { root: true })

            commit('setNetwork', net, { root: true })
            state.status = 'connected'
            return true
        },

        async updateTxFee({ state }) {
            let txFee = await infoApi.getTxFee()
            state.txFee = txFee.txFee
            ava.XChain().setTxFee(txFee.txFee)
        },

        async init({ state, commit, dispatch }) {
            const columbusExplorerUrl = `${window.location.protocol}//${window.location.host}/explorer`

            let camino = new AvaNetwork(
                'Camino',
                'https://api.camino.network',
                1000,
                'https://magellan.camino.network',
                'https://explorer.camino.network',
                'https://signavault.camino.network/v1',
                true
            )

            let columbus = new AvaNetwork(
                'Columbus',
                'https://columbus.camino.network',
                1001,
                'https://magellan.columbus.camino.network',
                columbusExplorerUrl,
                'https://signavault.columbus.camino.network/v1',
                true
            )

            // Load custom networks if any
            try {
                await dispatch('load')
            } catch (e) {
                console.error(e)
            }

            commit('addNetwork', camino)
            commit('addNetwork', columbus)

            try {
                let urlSubstringParam = window.location.pathname?.split('/')?.[2]

                if (urlSubstringParam !== undefined) {
                    let networkFromParam = state.networks.find(
                        (val) => val.name.toLowerCase() === urlSubstringParam.toLowerCase()
                    )

                    if (networkFromParam) {
                        await dispatch('setNetwork', networkFromParam)
                    } else {
                        let networkCustomFromParam = state.networksCustom.find(
                            (val) => val.name.toLowerCase() === urlSubstringParam.toLowerCase()
                        )

                        if (networkCustomFromParam) {
                            await dispatch('setNetwork', networkCustomFromParam)
                        } else {
                            await dispatch('setNetwork', state.networks[0])
                        }
                    }
                } else {
                    await dispatch('setNetwork', state.networks[0])
                }

                return true
            } catch (e) {
                console.log(e)
                state.status = 'disconnected'
            }
        },
    },
}

export default network_module
