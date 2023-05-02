import { Module } from 'vuex'

import { ava } from '@/AVA'
import { ZeroBN } from '@/constants'
import { RootState } from '@/store/types'
import {
    ValidatorRaw,
    GetPendingValidatorsResponse,
    GetValidatorsResponse,
    PlatformState,
    PlatformRewards,
} from './types'

import { BN } from '@c4tplatform/caminojs/dist'
import { Claimable, OwnerParam } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

const platform_module: Module<PlatformState, RootState> = {
    namespaced: true,
    state: {
        validators: [],
        validatorsPending: [],
        minStake: new BN(0),
        minStakeDelegation: new BN(0),
        currentSupply: new BN(1),
        depositOffers: [],
        rewards: {
            treasuryRewards: [],
            depositRewards: [],
        },
    },
    mutations: {
        setValidators(state, validators: ValidatorRaw[]) {
            state.validators = validators
        },
    },
    actions: {
        async updateCurrentSupply({ state }) {
            state.currentSupply = await ava.PChain().getCurrentSupply()
        },

        updateMinStakeAmount({ state }) {
            state.minStake = ava.getNetwork().P.minStake
            state.minStakeDelegation = ava.getNetwork().P.minDelegationStake
        },

        async update({ dispatch }) {
            dispatch('updateCurrentSupply')
            dispatch('updateMinStakeAmount')
            dispatch('updateValidators').then(() =>
                dispatch('updateAllDepositOffers').then(() => dispatch('updateRewards'))
            )
        },

        async updateValidators({ dispatch }) {
            const p1 = dispatch('updateValidatorsCurrent')
            const p2 = dispatch('updateValidatorsPending')
            await Promise.all([p1, p2])
        },

        async updateValidatorsCurrent({ commit }) {
            let res = (await ava.PChain().getCurrentValidators()) as GetValidatorsResponse
            let validators = res.validators

            commit('setValidators', validators)
        },

        async updateValidatorsPending({ state }) {
            let res = (await ava.PChain().getPendingValidators()) as GetPendingValidatorsResponse
            let validators = res.validators

            //@ts-ignore
            state.validatorsPending = validators
        },

        async updateAllDepositOffers({ state }) {
            const promises = [
                ava.PChain().getAllDepositOffers(true),
                ava.PChain().getAllDepositOffers(false),
            ]

            const results = await Promise.all(promises)
            const concatenatedResults = results[0].concat(results[1])
            const res = concatenatedResults.filter((value, index, self) => {
                return self.findIndex((t) => t.id === value.id) === index
            })

            state.depositOffers = res
        },

        async updateRewards({ state, rootState }) {
            const newRewards: PlatformRewards = { treasuryRewards: [], depositRewards: [] }
            const wallet = rootState.activeWallet
            if (wallet) {
                const lockedTxIDs = wallet.getPlatformUTXOSet().getLockedTxIDs()
                const addresses = wallet.getAllAddressesP()
                if (lockedTxIDs.depositIDs.length > 0) {
                    try {
                        const activeDepositOffers = await ava
                            .PChain()
                            .getDeposits(lockedTxIDs.depositIDs)
                        activeDepositOffers.deposits.forEach((deposit, idx) =>
                            newRewards.depositRewards.push({
                                amountToClaim: activeDepositOffers.availableRewards[idx],
                                deposit: deposit,
                            })
                        )
                    } catch (e: unknown) {
                        console.log(e)
                    }
                }
                // Since magellan is not ready we get treasury rewards
                // by requesting the node with all single threshold owners
                const owners = addresses.map(
                    (a) => ({ locktime: '0', threshold: 1, addresses: [a] } as OwnerParam)
                )

                const pushReward = (c: Claimable, idx: number, v: boolean) => {
                    newRewards.treasuryRewards.push({
                        type: v ? 'validator' : 'deposit',
                        amountToClaim: c.expiredDepositRewards,
                        rewardOwner: {
                            addresses: owners[idx].addresses,
                            threshold: owners[idx].threshold,
                            locktime: new BN(owners[idx].locktime),
                        },
                    })
                }

                try {
                    const treasuryRewards = await ava.PChain().getClaimables(owners)
                    treasuryRewards.claimables.forEach((c, idx) => {
                        if (!c.expiredDepositRewards.isZero()) pushReward(c, idx, false)
                        if (!c.validatorRewards.isZero()) pushReward(c, idx, true)
                    })
                } catch (e: unknown) {
                    console.log(e)
                }
            }
            state.rewards = newRewards
        },
    },
    getters: {
        // Return if a given nodeID is either current or pending validator
        isValidator: (state) => (nodeID: string) => {
            return (
                state.validators.findIndex((v) => v.nodeID === nodeID) >= 0 ||
                state.validatorsPending.findIndex((v) => v.nodeID === nodeID) >= 0
            )
        },

        depositOffer: (state) => (depositOfferID: string) => {
            return state.depositOffers.find((v) => v.id === depositOfferID)
        },
    },
}

export default platform_module
