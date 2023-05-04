<template>
    <div class="offer_row">
        <h3 class="offer_title">{{ rewardTitle }}</h3>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>{{ $t('earn.rewards.offer.pool_start') }}:</label>
                    <p class="reward">{{ formatDate(offer.start) }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.pool_end') }}:</label>
                    <p class="reward">{{ formatDate(offer.end) }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.min_deposit') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(offer.minAmount) }} CAM</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.reward') }}:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.available') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(maxDepositAmount) }}
                        {{ nativeAssetSymbol }}
                    </p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>{{ $t('earn.rewards.offer.min_duration') }}:</label>
                    <p class="reward">
                        {{ formatDuration(offer.minDuration) }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.max_duration') }}:</label>
                    <p class="reward">
                        {{ formatDuration(offer.maxDuration) }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.unlock_duration') }}:</label>
                    <p class="reward">
                        {{ formatDuration(offer.unlockPeriodDuration) }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.no_reward_duration') }}:</label>
                    <p class="reward">
                        {{ formatDuration(offer.noRewardsPeriodDuration) }}
                    </p>
                </div>
            </div>
        </div>
        <button
            class="claim_button button_primary"
            @click="openModal"
            :disabled="isDepositDisabled"
        >
            {{ $t('earn.rewards.offer.deposit') }}
        </button>
        <ModalClaimReward ref="modal_deposit_reward" :amount="maxDepositAmount" />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { cleanAvaxBN } from '@/helpers/helper'
import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import AvaAsset from '@/js/AvaAsset'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import { FormTagsPlugin } from 'bootstrap-vue'

@Component({
    components: {
        ModalClaimReward,
    },
})
export default class DepositOfferCard extends Vue {
    @Prop() offer!: DepositOffer
    @Prop() maxDepositAmount!: BN

    $refs!: {
        modal_deposit_reward: ModalClaimReward
    }

    get rewardTitle() {
        return Buffer.from(this.offer.memo.replace('0x', ''), 'hex').toString()
    }

    get rewardPercent() {
        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (
            (this.offer.interestRateNominator.toNumber() * interestRateBase * 100) /
            interestRateDenominator
        )
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get isDepositDisabled() {
        return this.maxDepositAmount.isZero()
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    openModal() {
        this.$refs.modal_deposit_reward.open()
    }

    formatDate(date: BN): string {
        const jsDate = new Date(date.toNumber() * 1000)
        return jsDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    formatDuration(dur: number): string {
        let result = ''
        const addPart = (val: number, label: string) => {
            if (val === 0) return
            if (result !== '') result += ' '
            result += val.toString() + label + (val === 1 ? '' : 's')
        }

        addPart(Math.floor(dur / 86400), ' Day')
        dur = dur % 86400

        addPart(Math.floor(dur / 3600), ' Hour')
        dur = dur % 3600

        addPart(Math.floor(dur / 60), ' Min')
        dur = dur % 60

        addPart(dur, ' Sec')

        return result === '' ? 'None' : result
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
