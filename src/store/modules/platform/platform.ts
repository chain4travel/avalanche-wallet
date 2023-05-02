import { Module } from 'vuex'
import { RootState } from '@/store/types'

import { ava } from '@/AVA'

import {
    ValidatorRaw,
    GetPendingValidatorsResponse,
    GetValidatorsResponse,
    PlatformState,
    ValidatorDelegatorDict,
    ValidatorListItem,
    PlatformRewards,
} from './types'

import { BN } from '@c4tplatform/caminojs/dist'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { ZeroBN } from '@/constants'

const MINUTE_MS = 60000
const HOUR_MS = MINUTE_MS * 60
const DAY_MS = HOUR_MS * 24

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

        async updateValidatorsCurrent({ state, commit }) {
            let res = (await ava.PChain().getCurrentValidators()) as GetValidatorsResponse
            let validators = res.validators

            commit('setValidators', validators)
        },

        async updateValidatorsPending({ state, commit }) {
            let res = (await ava.PChain().getPendingValidators()) as GetPendingValidatorsResponse
            let validators = res.validators

            //@ts-ignore
            state.validatorsPending = validators
        },

        async updateAllDepositOffers({ state, commit }) {
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

        async updateRewards({ state, commit, rootState }) {
            const newRewards: PlatformRewards = { treasuryRewards: [], depositRewards: [] }
            const wallet = rootState.activeWallet
            if (wallet) {
                const lockedTxIDs = wallet.getPlatformUTXOSet().getLockedTxIDs()
                if (lockedTxIDs.depositIDs.length > 0)
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
            state.rewards = newRewards
        },
    },
    getters: {
        validatorListEarn(state, getters): ValidatorListItem[] {
            // Filter validators we do not need
            let now = Date.now()

            let validators = state.validators
            validators = validators.filter((v) => {
                let endTime = parseInt(v.endTime) * 1000
                let dif = endTime - now

                // If End time is less than 2 weeks + 1 hour, remove from list they are no use
                let threshold = DAY_MS * 14 + 10 * MINUTE_MS
                if (dif <= threshold) {
                    return false
                }

                return true
            })

            let res: ValidatorListItem[] = []

            for (var i = 0; i < validators.length; i++) {
                let v = validators[i]

                let startTime = new Date(parseInt(v.startTime) * 1000)
                let endTime = new Date(parseInt(v.endTime) * 1000)

                let validatorStake = new BN(v.stakeAmount)
                // Calculate remaining stake
                let absMaxStake = ONEAVAX.mul(new BN(3000000))
                let relativeMaxStake = validatorStake.mul(new BN(5))
                let stakeLimit = BN.min(absMaxStake, relativeMaxStake)

                let remainingStake = stakeLimit.sub(validatorStake)

                let listItem: ValidatorListItem = {
                    nodeID: v.nodeID,
                    validatorStake: validatorStake,
                    delegatedStake: ZeroBN,
                    remainingStake: remainingStake,
                    numDelegators: 0,
                    startTime: startTime,
                    endTime,
                    uptime: parseFloat(v.uptime),
                    fee: parseFloat(v.delegationFee),
                }
                res.push(listItem)
            }

            res = res.filter((v) => {
                // Remove if remaining space is less than minimum
                let min = state.minStakeDelegation
                if (v.remainingStake.lt(min)) return false
                return true
            })

            return res
        },

        // Maps delegators to a node id

        nodeDelegatorMap(state): ValidatorDelegatorDict {
            let res: ValidatorDelegatorDict = {}
            let validators = state.validators
            for (var i = 0; i < validators.length; i++) {
                let validator = validators[i]
                let nodeID = validator.nodeID
                res[nodeID] = validator.delegators || []
            }
            return res
        },

        // Given a validator list item, calculate the max stake of this item
        validatorMaxStake: (state, getters) => (validator: ValidatorListItem) => {
            let stakeAmt = validator.validatorStake

            // 5 times the validator's stake
            let relativeMaxStake = stakeAmt.mul(new BN(5))

            // absolute max stake
            let mult = new BN(10).pow(new BN(6 + 9))
            let absMaxStake = new BN(3).mul(mult)

            if (relativeMaxStake.lt(absMaxStake)) {
                return relativeMaxStake
            } else {
                return absMaxStake
            }
        },

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
