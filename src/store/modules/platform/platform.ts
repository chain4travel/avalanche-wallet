import { Module } from 'vuex'

import { ava, bintools } from '@/AVA'
import { OneBN, ZeroBN } from '@/constants'
import { RootState } from '@/store/types'
import {
    GetPendingValidatorsResponse,
    GetValidatorsResponse,
    PlatformRewards,
    PlatformState,
    ValidatorRaw,
} from './types'

import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { SignaVaultDepositOfferApi } from '@/signavault_api'
import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import { AddressState } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { Claimable, OwnerParam } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import { SECP256k1KeyPair } from '@c4tplatform/caminojs/dist/common'
import { ModelDepositOfferSig } from '@c4tplatform/signavaultjs'
import createHash from 'create-hash'

const platform_module: Module<PlatformState, RootState> = {
    namespaced: true,
    state: {
        validators: [],
        validatorsPending: [],
        minStake: new BN(0),
        minStakeDelegation: new BN(0),
        currentSupply: new BN(1),
        depositOffers: [],
        restrictedOffers: [],
        rewards: {
            treasuryRewards: [],
            depositRewards: [],
        },
        addressStates: ZeroBN,
        sunrisePhase: 0,
    },
    mutations: {
        setValidators(state, validators: ValidatorRaw[]) {
            state.validators = validators
        },
        setAddressStates(state, states: BN) {
            state.addressStates = states
        },
        setSunrisePhase(state, phase: number) {
            state.sunrisePhase = phase
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
            dispatch('updateSunrisePhase')
            dispatch('updateAddressStates')
            dispatch('getRestrictedOffers')
            dispatch('updateValidators').then(() =>
                dispatch('updateAllDepositOffers').then(() => {
                    dispatch('updateRewards')
                })
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
        async updateAddressStates({ commit, rootState }) {
            const address = rootState.activeWallet?.getStaticAddress('P')
            const states = address ? await ava.PChain().getAddressStates(address) : ZeroBN
            commit('setAddressStates', states)
        },
        async updateSunrisePhase({ commit }) {
            let sp = 0
            try {
                let res = await ava.PChain().getUpgradePhases()
                sp = res.SunrisePhase
            } catch (e: any) {
                if ((e.message as string).indexOf('platform.GetUpgradePhases') > 0)
                    console.log(e.message)
                throw e
            }
            commit('setSunrisePhase', sp)
        },
        addAllowedAddresses: async (
            { rootState },
            {
                allowedAddresses,
                depositOfferID,
                timestamp,
            }: {
                allowedAddresses: { address: string }[]
                depositOfferID: string
                timestamp: number
            }
        ) => {
            try {
                const wallet = rootState.activeWallet
                const addressString = wallet?.getStaticAddress('P')
                let shortIDAddresses = allowedAddresses.map((elem) => {
                    return bintools.cb58Encode(ava.PChain().parseAddress(elem.address))
                })
                if (!wallet || !addressString) return
                let signer: SECP256k1KeyPair | undefined = wallet?.getStaticKeyPair()
                let signatures = allowedAddresses.map((elem) => {
                    const msgHashed: Buffer = Buffer.from(
                        createHash('sha256')
                            .update(
                                Buffer.concat([
                                    bintools.cb58Decode(depositOfferID),
                                    ava.PChain().parseAddress(elem.address),
                                ])
                            )
                            .digest()
                    )
                    return signer?.sign(msgHashed).toString('hex')
                })
                const result = await SignaVaultDepositOfferApi().addSignature({
                    addresses: shortIDAddresses,
                    depositOfferID: depositOfferID,
                    signatures: signatures as string[],
                    timestamp,
                })
                return result
            } catch (e) {
                throw e
            }
        },
        async updateRestrictedOffers({ state, rootState }) {
            try {
                const wallet = rootState.activeWallet
                const addressString = wallet?.getStaticAddress('P')
                if (!wallet || !addressString) return
                const address = ava.PChain().parseAddress(addressString)
                let signer: SECP256k1KeyPair | undefined = wallet?.getStaticKeyPair()
                const timestamp = Math.floor(Date.now() / 1000).toString()
                const hashedMessage = Buffer.from(
                    createHash('sha256')
                        .update(Buffer.concat([address, Buffer.from(timestamp)]))
                        .digest()
                )
                const signatureTimestamp = signer?.sign(hashedMessage).toString('hex')
                const result = await SignaVaultDepositOfferApi().getSignatures(
                    bintools.cb58Encode(address),
                    signatureTimestamp as string,
                    timestamp,
                    'false'
                )
                state.restrictedOffers = result.data
            } catch (e) {
                let error = e as Error
                console.error('Error:', error.message)
            }
        },
        getRestrictedOffers: async ({ state, rootState }) => {
            try {
                const wallet = rootState.activeWallet
                const signer =
                    wallet instanceof MultisigWallet
                        ? wallet?.wallets[0].getStaticKeyPair()
                        : wallet?.getStaticKeyPair()
                const addressString = wallet?.getStaticAddress('P')
                if (!signer || !addressString) return
                const timestamp = Math.floor(Date.now() / 1000).toString()
                const a = ava.PChain().parseAddress(addressString)
                const t = Buffer.from(timestamp)
                const signature: Buffer = Buffer.concat([a, t])
                const hashedMessage = Buffer.from(createHash('sha256').update(signature).digest())
                const signatureAliasTimestamp = signer.sign(hashedMessage).toString('hex')
                const result = await SignaVaultDepositOfferApi().getSignatures(
                    bintools.cb58Encode(a),
                    signatureAliasTimestamp,
                    timestamp,
                    wallet?.type === 'multisig' ? 'true' : 'false'
                )
                state.restrictedOffers = result.data
            } catch (e) {
                let error = e as Error
                console.error('Error:', error.message)
            }
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
        getValidatorByRewardOwner:
            (state) =>
            (addresses: string[]): ValidatorRaw | undefined => {
                return state.validators.find(
                    (v) => v.rewardOwner.addresses.findIndex((a) => addresses.includes(a)) >= 0
                )
            },
        CreatedDepositOffer: (state, _, rootState) => (active: boolean) => {
            const lockedFlag = new BN(1)
            const expected = active ? ZeroBN : lockedFlag
            return state.depositOffers
                .filter((v) => v.flags.and(lockedFlag).eq(expected))
                .filter((elem) => {
                    const depositOwnerAddress = ava
                        .PChain()
                        .addressFromBuffer(bintools.cb58Decode(elem.ownerAddress as string))
                    if (rootState.activeWallet?.getStaticAddress('P') === depositOwnerAddress) {
                        return true
                    }
                    return false
                })
        },
        depositOffers: (state, _, rootState) => (active: boolean) => {
            const lockedFlag = new BN(1)
            const expected = active ? ZeroBN : lockedFlag

            return state.depositOffers
                .filter((v) => v.flags.and(lockedFlag).eq(expected))
                .filter((elem) => {
                    const depositOwnerAddress = ava
                        .PChain()
                        .addressFromBuffer(bintools.cb58Decode(elem.ownerAddress as string))
                    if (depositOwnerAddress === ava.PChain().addressFromBuffer(Buffer.alloc(20)))
                        return true
                    else if (state.restrictedOffers?.find((el) => elem.id === el.depositOfferID))
                        return true
                    else return false
                })
        },
        isDepositOfferRestricted: (state, _, rootState) => (depositOfferID: string) => {
            let restrictedDepositOffer: ModelDepositOfferSig | undefined
            if (
                (restrictedDepositOffer = state.restrictedOffers?.find(
                    (el) => depositOfferID === el.depositOfferID
                ))
            ) {
                return restrictedDepositOffer
            }
        },
        depositOffer: (state) => (depositOfferID: string) => {
            return state.depositOffers.find((v) => v.id === depositOfferID)
        },
        isOfferCreator: (state): boolean => {
            return !state.addressStates.and(OneBN.shln(AddressState.OFFERS_CREATOR)).isZero()
        },
        getSunrisePhase(state): number {
            return state.sunrisePhase
        },
    },
}

export default platform_module
