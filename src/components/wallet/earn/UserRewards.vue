<template>
    <div>
        <h3>Offers</h3>
        <div class="user_offers" v-if="activeOffers.length > 0">
            <UserRewardCard
                v-for="(v, i) in activeOffers"
                :key="i"
                :title="v.memo"
                :start="v.start"
                :end="v.end"
                :minLock="v.minAmount"
                :rewards="v.interestRateNominator"
                :lockedAmount="v.amount"
                :alreadyClaimed="v.claimedRewardAmount"
                :pendingRewards="v.pendingRewards"
                class="reward_card"
            ></UserRewardCard>
        </div>
        <div v-else class="empty">No Active Earning</div>
        <h3>{{ $t('earn.rewards.validation') }}</h3>
        <div v-if="totLength > 0" class="user_rewards">
            <div>
                <label>{{ $t('earn.rewards.total') }}</label>
                <p class="amt">{{ totalRewardBig.toLocaleString(9) }} {{ nativeAssetSymbol }}</p>
            </div>
            <div v-if="validators.length > 0">
                <UserRewardRow
                    v-for="(v, i) in validators"
                    :key="i"
                    :staker="v"
                    class="reward_row"
                ></UserRewardRow>
            </div>
        </div>
        <div v-else class="empty">
            <p>{{ $t('earn.rewards.empty') }}</p>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'
import { AvaWalletCore } from '../../../js/wallets/types'
import { DelegatorRaw, ValidatorRaw } from '@/components/misc/ValidatorList/types'
import UserRewardRow from '@/components/wallet/earn/UserRewardRow.vue'
import UserRewardCard from '@/components/wallet/earn/UserRewardCard.vue'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import { BN } from '@c4tplatform/caminojs/dist'

@Component({
    components: {
        UserRewardRow,
        UserRewardCard,
    },
})
export default class UserRewards extends Vue {
    get activeOffers() {
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

    cleanList(list: ValidatorRaw[] | DelegatorRaw[]) {
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
}
</script>
<style scoped lang="scss">
@use '../../../styles/main';
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
    color: var(--primary-color);
    font-weight: normal;
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

@include main.medium-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
@include main.mobile-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
</style>
