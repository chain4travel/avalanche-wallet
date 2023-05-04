<template>
    <div class="offer_row">
        <h3 class="offer_title">{{ rewardTitle }}</h3>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposit_start') }}:</label>
                    <p class="reward">{{ startDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposit_end') }}:</label>
                    <p class="reward">{{ endDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.min_deposit') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(minLock) }} CAM</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.reward') }}:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposited_amount') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.deposit.amount) }} {{ nativeAssetSymbol }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.pending_reward') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.amountToClaim) }} {{ nativeAssetSymbol }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.already_claimed') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.deposit.claimedRewardAmount) }}
                        {{ nativeAssetSymbol }}
                    </p>
                </div>
            </div>
        </div>
        <button class="claim_button button_primary" @click="openModal" :disabled="isClaimDisabled">
            {{ $t('earn.rewards.active_earning.claim') }}
        </button>
        <ModalClaimReward
            ref="modal_claim_reward"
            :depositTxID="reward.deposit.depositTxID"
            :amount="reward.amountToClaim"
            :rewardOwner="reward.deposit.rewardOwner"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { cleanAvaxBN } from '@/helpers/helper'
import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import AvaAsset from '@/js/AvaAsset'
import { PlatformRewardDeposit } from '@/store/modules/platform/types'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import { ZeroBN } from '@/constants'

@Component({
    components: {
        ModalClaimReward,
    },
})
export default class DepositRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true

    @Prop() reward!: PlatformRewardDeposit

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

    get depositOffer(): DepositOffer | undefined {
        return this.$store.getters['Platform/depositOffer'](this.reward.deposit.depositOfferID)
    }

    get rewardTitle() {
        return this.depositOffer
            ? Buffer.from(this.depositOffer.memo.replace('0x', ''), 'hex').toString()
            : 'Unknown'
    }

    get startDate() {
        const startDate = new Date(parseInt(this.reward.deposit.start.toString()) * 1000)

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
        const endDate = new Date(
            (this.reward.deposit.start.toNumber() + this.reward.deposit.duration) * 1000
        )

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
        if (!this.depositOffer) return 0

        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (
            (this.depositOffer.interestRateNominator.toNumber() * interestRateBase * 100) /
            interestRateDenominator
        )
    }

    get minLock() {
        return this.depositOffer?.minAmount ?? ZeroBN
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get isClaimDisabled() {
        return this.reward.amountToClaim.isZero()
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
