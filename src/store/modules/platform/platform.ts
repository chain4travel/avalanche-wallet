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
            const res = await ava.PChain().getAllDepositOffers()
            res.sort((a, b) => {
                if (!a.start.eq(b.start)) return a.start.lt(b.start) ? -1 : 1
                return a.id < b.id ? -1 : 1
            })
            state.depositOffers = res
        },

        async updateRewards({ state, rootState, getters }) {
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

                let validatorFound = false
                const pushReward = (c: Claimable, idx: number, v: boolean) => {
                    if (v) validatorFound = true
                    newRewards.treasuryRewards.push({
                        type: v ? 'validator' : 'deposit',
                        amountToClaim: c.expiredDepositRewards,
                        rewardOwner: c.rewardOwner
                            ? c.rewardOwner
                            : {
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
                    if (!validatorFound) {
                        const v = getters.getValidatorByRewardOwner(addresses) as ValidatorRaw
                        if (v)
                            pushReward(
                                {
                                    rewardOwner: {
                                        addresses: v.rewardOwner.addresses,
                                        threshold: parseInt(v.rewardOwner.threshold),
                                        locktime: new BN(v.rewardOwner.locktime),
                                    },
                                    validatorRewards: ZeroBN,
                                    expiredDepositRewards: ZeroBN,
                                },
                                -1,
                                true
                            )
                    }
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
        getValidatorByRewardOwner: (state) => (addresses: string[]): ValidatorRaw | undefined => {
            return state.validators.find(
                (v) => v.rewardOwner.addresses.findIndex((a) => addresses.includes(a)) >= 0
            )
        },
        depositOffers: (state) => (active: boolean) => {
            const lockedFlag = new BN(1)
            const expected = active ? ZeroBN : lockedFlag
            return state.depositOffers.filter((v) => v.flags.and(lockedFlag).eq(expected))
        },
        depositOffer: (state) => (depositOfferID: string) => {
            return state.depositOffers.find((v) => v.id === depositOfferID)
        },
    },
}

export default platform_module
