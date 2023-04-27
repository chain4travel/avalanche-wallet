<template>
    <div>
        <div class="claimables">
            <ClaimableRewardCard
                v-for="(v, i) in claimables()"
                :key="'c' + i"
                :title="v.title"
                :pendingRewards="v.pendingRewards"
                :rewardOwner="v.rewardOwner"
            ></ClaimableRewardCard>
        </div>
        <div class="user_offers" v-if="activeOffers.length > 0">
            <UserRewardCard
                v-for="(v, i) in activeOffers"
                :key="'u' + i"
                :depositTxID="v.depositTxID"
                :title="v.memo"
                :start="v.start"
                :end="v.end"
                :minLock="v.minAmount"
                :rewards="v.interestRateNominator"
                :rewardOwner="v.rewardOwner"
                :lockedAmount="v.amount"
                :alreadyClaimed="v.claimedRewardAmount"
                :pendingRewards="v.pendingRewards"
                class="reward_card"
            ></UserRewardCard>
        </div>
        <div v-else class="empty">No Active Earning</div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import Big from 'big.js'
import { Component, Vue } from 'vue-property-decorator'

import { AvaWalletCore } from '../../../js/wallets/types'
import { ActiveDeposit, Claimable, ValidatorRaw } from '@/components/misc/ValidatorList/types'
import ClaimableRewardCard from '@/components/wallet/earn/ClaimableRewardCard.vue'
import UserRewardCard from '@/components/wallet/earn/UserRewardCard.vue'
import { bnToBig } from '@/helpers/helper'

import { BN } from '@c4tplatform/caminojs/dist'
import { ZeroBN } from '@/constants'
import { RewardOwner } from '@/components/misc/ValidatorList/types'

@Component({
    components: {
        ClaimableRewardCard,
        UserRewardCard,
    },
})
export default class UserRewards extends Vue {
    get activeOffers(): ActiveDeposit[] {
        return this.$store.state.Platform.activeDepositOffer
    }

    get userAddresses() {
        let wallet: AvaWalletCore = this.$store.state.activeWallet
        if (!wallet) return []

        return wallet.getAllAddressesP()
    }

    get validators(): ValidatorRaw[] {
        let validators: ValidatorRaw[] = this.$store.state.Platform.validators

        return this.cleanList(validators) as ValidatorRaw[]
    }

    get totLength() {
        return this.validators?.length
    }

    get totalReward() {
        let vals = this.validators?.reduce((acc, val: ValidatorRaw) => {
            return acc.add(new BN(val.potentialReward))
        }, new BN(0))

        return vals
    }

    get totalRewardBig(): Big {
        return bnToBig(this.totalReward, 9)
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    cleanList(list: ValidatorRaw[]) {
        let res = list?.filter((val) => {
            let rewardAddrs = val.rewardOwner.addresses
            let filtered = rewardAddrs.filter((addr) => {
                return this.userAddresses.includes(addr)
            })
            return filtered.length > 0
        })

        res?.sort((a, b) => {
            let startA = parseInt(a.startTime)
            let startB = parseInt(b.startTime)
            return startA - startB
        })
        return res
    }

    claimables(): Claimable[] {
        return this.validators.map((v) => {
            return {
                title: 'Validator Rewards',
                pendingRewards: ZeroBN,
                rewardOwner: {
                    addresses: v.rewardOwner.addresses,
                    threshold: parseInt(v.rewardOwner.threshold),
                    locktime: new BN(v.rewardOwner.locktime),
                } as RewardOwner,
            } as Claimable
        })
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.user_offers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    grid-gap: 1rem;
}
.user_rewards {
    padding-bottom: 5vh;
}

.reward_row {
    margin-bottom: 12px;
}

h3 {
    margin: 12px 0;
    margin-top: 32px;
    font-size: 2em;
    color: var(--primary-color-light);
    font-weight: lighter;
}

label {
    margin-top: 6px;
    color: var(--primary-color-light);
    font-size: 14px;
    margin-bottom: 3px;
}

.amt {
    font-size: 2em;
}

.claimables {
    margin-bottom: 10px;
}

@include mixins.medium-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
@include mixins.mobile-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
</style>
