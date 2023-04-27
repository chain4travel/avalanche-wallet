<template>
    <div class="offer_row">
        <h2 class="offer_title">{{ rewardTitle }}</h2>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.lock_start') }}:</label>
                    <p class="reward">{{ startDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.lock_end') }}:</label>
                    <p class="reward">{{ endDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.min_lock') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(minLock) }} CAM</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.reward') }}:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.locked_amount') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(lockedAmount) }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.pending_reward') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(pendingRewards) }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.already_claimed') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(alreadyClaimed) }} {{ nativeAssetSymbol }}</p>
                </div>
            </div>
        </div>
        <button class="claim_button button_primary" @click="openModal" :disabled="!isClaimDisabled">
            {{ $t('earn.rewards.active_earning.claim') }}
        </button>
        <ModalClaimReward
            ref="modal_claim_reward"
            :depositTxID="depositTxID"
            :amount="pendingRewards"
            :rewardOwner="rewardOwner"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { cleanAvaxBN } from '@/helpers/helper'
import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import AvaAsset from '@/js/AvaAsset'
import { RewardOwner } from '@/components/misc/ValidatorList/types'

import { BN } from '@c4tplatform/caminojs/dist'

@Component({
    components: {
        ModalClaimReward,
    },
})
export default class UserRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true

    @Prop() depositTxID!: string
    @Prop() title!: string
    @Prop() start!: BN
    @Prop() end!: BN
    @Prop() minLock!: BN
    @Prop() rewards!: string
    @Prop() rewardOwner!: RewardOwner
    @Prop() lockedAmount!: BN
    @Prop() pendingRewards!: BN
    @Prop() alreadyClaimed!: BN

    $refs!: {
        modal_claim_reward: ModalClaimReward
    }

    updateNow() {
        this.now = Date.now()
    }

    created() {
        this.intervalID = setInterval(() => {
            this.updateNow()
        }, 2000)
    }
    destroyed() {
        clearInterval(this.intervalID)
    }

    get rewardTitle() {
        return Buffer.from(this.title.replace('0x', ''), 'hex').toString()
    }

    get startDate() {
        const startDate = new Date(parseInt(this.start.toString()) * 1000)

        return startDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get endDate() {
        const endDate = new Date(parseInt(this.end.toString()) * 1000)

        return endDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get rewardPercent() {
        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (parseInt(this.rewards) / interestRateDenominator) * interestRateBase * 100
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get isClaimDisabled() {
        return !this.pendingRewards.isZero()
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    openModal() {
        this.$refs.modal_claim_reward.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.offer_row {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    font-size: 14px;
    background-color: var(--bg-light);
    padding: 1rem;
}

.offer_title {
    margin-bottom: 1rem;
}

.offer_detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 1.25rem;
    .offer_detail_left {
        border-right: 2px solid var(--bg-wallet-light);
    }
}

label {
    color: var(--primary-color-light) !important;
}

.claim_button {
    border-radius: var(--border-radius-sm);
    padding: 8px 30px;
    margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
}

@include mixins.mobile-device {
    .offer_detail {
        grid-template-columns: 1fr;
        grid-gap: 0.5rem;
        .offer_detail_left {
            border-right: none;
        }
    }
}
</style>
