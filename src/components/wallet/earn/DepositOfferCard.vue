<template>
    <div class="offer_row">
        <h3 class="offer_title">{{ rewardTitle }}</h3>
        <div class="offer_detail">
            <div class="progress">
                <label>{{ $t('earn.rewards.offer.pool_size') }}:</label>
                <span>
                    <span class="success" :style="'width:' + progress"></span>
                </span>
                {{ progressText }}
            </div>
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
            v-if="$listeners['selectOffer']"
            class="claim_button button_primary"
            @click="emitOffer"
            :disabled="isDepositDisabled"
        >
            {{ $t('earn.rewards.offer.deposit') }}
        </button>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { cleanAvaxBN, formatDuration } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

@Component
export default class DepositOfferCard extends Vue {
    @Prop() offer!: DepositOffer
    @Prop() maxDepositAmount!: BN

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

    get isDepositDisabled(): boolean {
        return this.maxDepositAmount.isZero()
    }

    get progress(): string {
        return this.offer.totalMaxAmount.isZero()
            ? '0px'
            : this.offer.depositedAmount
                  .div(this.offer.totalMaxAmount)
                  .mul(new BN(100))
                  .toString() + '%'
    }

    get progressText(): string {
        return this.offer.totalMaxAmount.isZero()
            ? 'No Limit'
            : this.progress +
                  '(' +
                  cleanAvaxBN(this.offer.totalMaxAmount) +
                  this.nativeAssetSymbol +
                  ')'
    }

    emitOffer(): void {
        this.$emit('selectOffer', this.offer)
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
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
        return formatDuration(dur)
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

.progress {
    grid-column: span 2;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 1.25rem;
    > span {
        margin-top: auto;
        margin-bottom: auto;
        height: 4px;
        background-color: var(--bg);
        display: inline-block;
    }
    .success {
        height: 100%;
        background-color: var(--color-success);
        display: block;
    }
}

.offer_detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 4px 1.25rem;
    .offer_detail_left {
        border-right: 2px solid var(--bg-wallet-light);
    }
}

label {
    color: var(--primary-color-light) !important;
    font-size: 13px;
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
