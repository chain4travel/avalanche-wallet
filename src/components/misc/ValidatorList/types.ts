import { BN } from '@c4tplatform/caminojs/dist'

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

export interface DepositOffer {
    id: string
    interestRateNominator: BN
    start: BN
    end: BN
    minAmount: BN
    minDuration: number
    maxDuration: number
    unlockPeriodDuration: number
    noRewardsPeriodDuration: number
    memo: string
    flags: BN
}

export interface ActiveDepositOffer {
    id: string
    interestRateNominator: BN
    start: BN
    end: BN
    minAmount: BN
    minDuration: number
    maxDuration: number
    unlockPeriodDuration: number
    noRewardsPeriodDuration: number
    memo: string
    flags: BN
    amount: BN
    claimedRewardAmount: BN
}

export interface ValidatorDict {
    [nodeId: string]: ValidatorRaw
}
