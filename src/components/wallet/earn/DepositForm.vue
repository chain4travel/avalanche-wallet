<template>
    <form class="deposit_row">
        <div class="deposit_inputs">
            <p>
                <label>{{ $t('earn.deposit_end') }}</label>
                <DateForm
                    @change_end="setEndDate"
                    :maxEndDate="maxEndDate"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="maxDuration"
                ></DateForm>
                <span class="deposit_duration">{{ formatDuration(duration) }}</span>
            </p>
            <p>
                <label>{{ $t('earn.deposit_amount') }}</label>
                <AvaxInput :max="maxDepositAmount" v-model="amt"></AvaxInput>
            </p>
        </div>
        <div class="submit_box">
            <v-btn
                v-if="$listeners['selectOffer']"
                class="deposit_button button_primary"
                @click="submitDeposit"
                :disabled="isDepositDisabled"
            >
                {{ $t('earn.offer.deposit') }}
            </v-btn>
            <v-btn text @click="cancelDeposit" style="color: var(--primary-color)">
                {{ $t('earn.validate.cancel') }}
            </v-btn>
        </div>
    </form>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { MINUTE_MS, ZeroBN } from '@/constants'
import { cleanAvaxBN, formatDuration } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'
import DateForm from './DateForm.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { WalletType } from '@/js/wallets/types'
import { WalletHelper } from '@/helpers/wallet_helper'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component({
    components: {
        DateForm,
        AvaxInput,
    },
})
export default class DepositForm extends Vue {
    @Prop() offer!: DepositOffer
    @Prop() maxDepositAmount!: BN

    amt: BN = ZeroBN
    endDate: string = ''

    get maxEndDate() {
        return this.offer.end.toNumber() * 1000
    }

    get minDuration() {
        return this.offer.minDuration * 1000
    }

    get maxDuration() {
        return this.offer.maxDuration * 1000 - 15 * MINUTE_MS
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
            this.amt.isZero() ||
            this.amt.gt(this.maxDepositAmount) ||
            this.maxDepositAmount.isZero()
        )
    }

    get duration() {
        const endDate = new Date(this.endDate).getTime()
        return Math.floor((endDate - Date.now()) / 1000)
    }

    async submitDeposit(): Promise<void> {
        const wallet: WalletType = this.$store.state.activeWallet
        // @ts-ignore
        let { dispatchNotification } = this.globalHelper()
        try {
            const result = await WalletHelper.buildDepositTx(
                wallet,
                this.offer.id,
                this.duration,
                this.amt
            )
            this.$store.dispatch('Signavault/updateTransaction')
        } catch (error) {
            if (error instanceof SignatureError) {
                this.$store.dispatch('Signavault/updateTransaction')
            } else {
                console.error(error)
                dispatchNotification({
                    message: this.$t('notifications.deposit_failed'),
                    type: 'error',
                })
                return
            }
        }
        this.cancelDeposit()
    }

    cancelDeposit(): void {
        this.$emit('selectOffer')
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    formatDuration(dur: number): string {
        return formatDuration(dur)
    }

    setEndDate(val: string) {
        this.endDate = val
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.deposit_row {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    border: var(--primary-border);
    overflow: hidden;
    font-size: 14px;
    padding: 1rem;
}

form {
    display: grid;
    grid-template-columns: 1fr 340px;
    column-gap: 90px;

    .dates_form {
        margin-top: 4px;
        margin-bottom: 4px;
    }
    p {
        margin-bottom: 12px !important;
    }
}

.deposit_inputs {
    display: contents;
    margin-bottom: 10px;
}

.deposit_duration {
    font-size: 13px;
    padding-right: 12px;
    float: right;
}

.submit_box {
    margin-top: auto;
    margin-left: auto;
    .v-btn {
        margin-top: 14px;
        margin-right: 10px;
    }
}

.deposit_button {
    border-radius: var(--border-radius-sm);
    padding: 8px 30px;
    margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
}
</style>
