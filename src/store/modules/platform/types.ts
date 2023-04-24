import {
    DelegatorPendingRaw,
    DelegatorRaw,
    ValidatorPendingRaw,
    ValidatorRaw,
    DepositOfferRaw,
} from '@/components/misc/ValidatorList/types'
import { BN } from '@c4tplatform/caminojs/dist'

export interface PlatformState {
    validators: ValidatorRaw[]
    validatorsPending: ValidatorPendingRaw[]
    delegatorsPending: DelegatorPendingRaw[]
    minStake: BN
    minStakeDelegation: BN
    currentSupply: BN
    depositOffers: DepositOfferRaw[]
    activeDepositOffer: DepositOfferRaw[]
}

export interface GetValidatorsResponse {
    validators: ValidatorRaw[]
}

export interface GetPendingValidatorsResponse {
    validators: ValidatorPendingRaw[]
    delegators: DelegatorPendingRaw[]
}

export interface ValidatorGroup {
    data: ValidatorRaw
    // delegators: DelegatorRaw[]
}

export interface ValidatorDelegatorDict {
    [key: string]: DelegatorRaw[]
}

export interface ValidatorDelegatorPendingDict {
    [key: string]: DelegatorPendingRaw[]
}

export interface ValidatorDict {
    [nodeId: string]: ValidatorRaw
}

export interface GetAllDepositOffersResponse {
    depositOffers: DepositOfferRaw[]
}

export interface ValidatorListItem {
    nodeID: string
    validatorStake: BN
    delegatedStake: BN
    remainingStake: BN
    numDelegators: number
    startTime: Date
    endTime: Date
    uptime: number
    fee: number
}
