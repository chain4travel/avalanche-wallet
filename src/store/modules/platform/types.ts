import { BN } from '@c4tplatform/caminojs/dist'
import {
    APIDeposit,
    DepositOffer,
    Owner,
} from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

export type RewardOwner = Owner

export interface PlatformState {
    validators: ValidatorRaw[]
    validatorsPending: ValidatorPendingRaw[]
    minStake: BN
    minStakeDelegation: BN
    currentSupply: BN
    depositOffers: DepositOffer[]
    rewards: PlatformRewards
}

export interface ValidatorRaw {
    connection: boolean
    endTime: string
    nodeID: string
    stakeAmount: string
    startTime: string
    uptime: string
    delegationFee: string
    delegators: DelegatorRaw[] | null
    potentialReward: string
    rewardOwner: ValidatorRewardOwner
    txID: string
}

export interface DelegatorRaw {
    endTime: string
    nodeID: string
    potentialReward: string
    rewardOwner: ValidatorRewardOwner
    stakeAmount: string
    startTime: string
    txID: string
}

export interface DelegatorPendingRaw {
    startTime: string
    endTime: string
    stakeAmount: string
    nodeID: string
}

export interface ValidatorPendingRaw {
    startTime: string
    endTime: string
    stakeAmount: string
    nodeID: string
    delegationFee: string
    connected: boolean
}

export interface ValidatorRewardOwner {
    addresses: string[]
    locktime: string
    threshold: string
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

export interface PlatformRewardTreasury {
    type: 'deposit' | 'validator'
    amountToClaim: BN
    rewardOwner: Owner
}

export interface PlatformRewardDeposit {
    amountToClaim: BN
    deposit: APIDeposit
}

export interface PlatformRewards {
    treasuryRewards: PlatformRewardTreasury[]
    depositRewards: PlatformRewardDeposit[]
}
