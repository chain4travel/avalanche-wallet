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
        <div class="button--container">
            <!-- <button v-if="!isDepositDisabled" @click="openDepositFundsModal()">open modal</button> -->
            <button
                style="margin-top: 16px"
                v-if="$listeners['selectOffer']"
                :class="[
                    'camino__primary--button',
                    { 'camino--button--disabled': isDepositDisabled },
                ]"
                @click.prevent="openDepositFundsModal()"
                :disabled="isDepositDisabled"
            >
                {{
                    isWhiteListing
                        ? 'add new addresses'
                        : !pendingOfferID || offer.id !== pendingOfferID
                        ? $t('earn.rewards.offer.deposit')
                        : 'Sign depositing funds'
                }}
            </button>
        </div>
        <ModalDepositFunds
            :isWhiteListing="isWhiteListing"
            @selectOffer="emitOffer"
            ref="modal_deposit_funds"
            :title="rewardTitle"
            :offer="offer"
            @emitOffer="emitOffer"
            :isDepositDisabled="isDepositDisabled"
            :maxDepositAmount="maxDepositAmount"
            @closeDepositFundsModal="closeDepositFundsModal"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

import { cleanAvaxBN, formatDuration } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'

import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import ModalDepositFunds from './ModalDepositFunds.vue'

import { bintools } from '@/AVA'
import { WalletHelper } from '@/helpers/wallet_helper'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { DepositTx, UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
@Component({
    components: {
        ModalDepositFunds,
    },
})
export default class DepositOfferCard extends Vue {
    @Prop() offer!: DepositOffer
    @Prop() maxDepositAmount!: BN
    @Prop() isWhiteListing?: boolean

    $refs!: {
        modal_deposit_funds: ModalDepositFunds
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

    get pendingDepositTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: SignavaultTx) =>
                item?.tx?.alias === this.$store.state.activeWallet?.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'DepositTx'
        )
    }
    get pendingOfferID(): string | undefined {
        if (this.pendingDepositTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingDepositTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction() as DepositTx
            return bintools.cb58Encode(utx.getDepositOfferID())
        }
        return undefined
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get isDepositDisabled(): boolean {
        return (
            this.maxDepositAmount.isZero() ||
            (!!this.pendingOfferID && this.offer.id !== this.pendingOfferID)
        )
    }

    get amountLimit(): { nominator: BN; amount: BN } {
        return this.offer.upgradeVersion === 0 || !this.offer.totalMaxAmount.isZero()
            ? { nominator: this.offer.depositedAmount, amount: this.offer.totalMaxAmount }
            : { nominator: this.offer.rewardedAmount, amount: this.offer.totalMaxRewardAmount }
    }

    get progress(): string {
        const amt = this.amountLimit
        return amt.amount.isZero()
            ? '0px'
            : amt.nominator.div(amt.amount).mul(new BN(100)).toString() + '%'
    }

    get progressText(): string {
        const amt = this.amountLimit
        return amt.amount.isZero()
            ? 'No Limit'
            : this.progress + '(' + cleanAvaxBN(amt.amount) + this.nativeAssetSymbol + ')'
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
    openDepositFundsModal() {
        this.$refs.modal_deposit_funds.open()
    }
    closeDepositFundsModal() {
        this.$refs.modal_deposit_funds.close()
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
.button--container {
    display: flex;
    width: 100%;
    justify-content: flex-end;
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
