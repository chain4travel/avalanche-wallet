<template>
    <form class="create_offer">
        <div class="offer_inputs">
            <p>
                <label>{{ $t('earn.rewards.create.offer_start') }}</label>
                <DateForm
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="defaultDuration"
                    @change_end="setStartDate"
                ></DateForm>

                <label>{{ $t('earn.rewards.create.offer_end') }}</label>
                <DateForm
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="maxDuration"
                    @change_end="setEndDate"
                ></DateForm>

                <label>{{ $t('earn.rewards.create.interrest_rate') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    :value="offer.interestRateNominator.toString(10)"
                    v-on:input="setInterestRate"
                    min="0"
                    inputmode="numeric"
                />

                <label>{{ $t('earn.rewards.create.min_amount') }}</label>
                <AvaxInput v-model="offer.minAmount" :initial="offer.minAmount"></AvaxInput>

                <label>{{ $t('earn.rewards.create.total_max_amount') }}</label>
                <AvaxInput v-model="offer.totalMaxAmount"></AvaxInput>

                <label>{{ $t('earn.rewards.create.min_duration') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    v-model="offer.minDuration"
                    min="1"
                    inputmode="numeric"
                />

                <label>{{ $t('earn.rewards.create.max_duration') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    v-model="offer.maxDuration"
                    min="1"
                    inputmode="numeric"
                />
            </p>
            <p>
                <label>{{ $t('earn.rewards.create.unlock_duration') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    v-model="offer.unlockPeriodDuration"
                    min="1"
                    inputmode="numeric"
                />

                <label>{{ $t('earn.rewards.create.no_rewards_duration') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    v-model="offer.noRewardsPeriodDuration"
                    min="1"
                    inputmode="numeric"
                />

                <label>{{ $t('earn.rewards.create.flags') }}</label>
                <input
                    class="form_input hover_border"
                    type="number"
                    :value="offer.flags.toString(10)"
                    v-on:input="setFlags"
                    min="0"
                    inputmode="numeric"
                />

                <label>{{ $t('earn.rewards.create.total_max_reward_amount') }}</label>
                <AvaxInput
                    v-model="offer.totalMaxRewardAmount"
                    :readonly="sunrisePhase === 0"
                ></AvaxInput>

                <label>{{ $t('earn.rewards.create.owner_address') }}</label>
                <input
                    class="form_input hover_border"
                    type="text"
                    v-model="offer.ownerAddress"
                    :disabled="sunrisePhase === 0"
                />

                <label>{{ $t('earn.rewards.create.memo').toString() }}</label>
                <textarea
                    class="form_input hover_border memo"
                    maxlength="256"
                    placeholder="Memo"
                    v-model="offer.memo"
                ></textarea>
            </p>
        </div>
        <div class="submit_box">
            <v-btn
                v-if="$listeners['selectOffer']"
                class="create_button button_primary"
                @click="submitCreateOffer"
                :disabled="!formValid"
            >
                {{ $t('earn.rewards.create.submit') }}
            </v-btn>
            <v-btn text @click="cancelCreateOffer" style="color: var(--primary-color)">
                {{ $t('earn.validate.cancel') }}
            </v-btn>
        </div>
    </form>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'

import { DAY_MS, HOUR_MS, ZeroBN } from '@/constants'
import { cleanAvaxBN, formatDuration } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'
import DateForm from './DateForm.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { WalletType } from '@/js/wallets/types'
import { DepositOffer, WalletHelper } from '@/helpers/wallet_helper'

import { BN } from '@c4tplatform/caminojs/dist'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component({
    components: {
        DateForm,
        AvaxInput,
    },
})
export default class CreateOfferForm extends Vue {
    offer: DepositOffer = {
        upgradeVersion: this.sunrisePhase,
        id: '',
        interestRateNominator: ZeroBN,
        start: ZeroBN,
        end: ZeroBN,
        minAmount: new BN(1000000000),
        totalMaxAmount: ZeroBN,
        depositedAmount: ZeroBN,
        minDuration: 1,
        maxDuration: 86400,
        unlockPeriodDuration: 0,
        noRewardsPeriodDuration: 0,
        memo: '',
        flags: ZeroBN,
        // Upgrade Version 1
        totalMaxRewardAmount: ZeroBN,
        rewardedAmount: ZeroBN,
        ownerAddress: '',
    }

    get minDuration() {
        return 1 * HOUR_MS
    }

    get maxDuration() {
        return 1 * 365 * DAY_MS
    }

    get defaultDuration() {
        return 1 * DAY_MS
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get sunrisePhase(): number {
        return this.$store.getters['Platform/getSunrisePhase']
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get formValid(): boolean {
        if (this.offer.minDuration > this.offer.maxDuration) return false
        if (this.offer.maxDuration <= 0) return false
        if (this.offer.start > this.offer.end) return false
        return true
    }

    async submitCreateOffer(): Promise<void> {
        if (this.offer.ownerAddress === '') this.offer.ownerAddress = undefined
        const wallet: WalletType = this.$store.state.activeWallet
        try {
            const result = await WalletHelper.buildAddDepositOfferTx(wallet, this.offer)
            this.$store.dispatch('updateTransaction', {
                withDeposit: true,
                msgType: 'success',
                msgTitle: 'Transaction',
                msgText: `Create Offer Successful (TX: ${result})`,
            })
        } catch (error) {
            if (error instanceof SignatureError) {
                this.$store.dispatch('updateTransaction', {
                    onlyMultisig: true,
                    msgType: 'success',
                    msgTitle: 'Multisignature',
                    msgText: 'Transaction Recorded.',
                })
            } else {
                console.error(error)
                this.$store.dispatch('Notifications/add', {
                    type: 'error',
                    title: 'Create Offer Failed',
                    message: error,
                })
                return
            }
        }
        this.cancelCreateOffer()
    }

    cancelCreateOffer(): void {
        this.$emit('selectOffer')
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    formatDuration(dur: number): string {
        return formatDuration(dur)
    }

    setStartDate(val: string) {
        this.offer.start = new BN(new Date(val).getTime() / 1000)
    }

    setEndDate(val: string) {
        this.offer.end = new BN(new Date(val).getTime() / 1000)
    }

    setInterestRate(ev: any) {
        this.offer.interestRateNominator = new BN(ev.target.value)
    }

    setFlags(ev: any) {
        this.offer.flags = new BN(ev.target.value)
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.create_offer {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    border: var(--primary-border);
    overflow: hidden;
    font-size: 14px;
    padding: 0 1rem 1rem 1rem;

    p {
        min-width: 250px;
    }
}

form {
    display: grid;
    grid-template-columns: 1fr 340px;
    column-gap: 90px;
}

.offer_inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 15px;
    margin-bottom: 10px;

    .form_input {
        color: var(--primary-color);
        font-size: 14px;
        font-family: 'Inter';
        border-radius: var(--border-radius-sm);
        background-color: var(--bg-light);
        width: 100%;
        box-sizing: border-box;
        padding: 6px 12px;
    }

    label {
        display: inline-block;
        margin-top: 6px;
    }
}

.submit_box {
    margin-top: auto;
    margin-left: auto;
    .v-btn {
        margin-top: 14px;
        margin-right: 10px;
    }
}

.create_button {
    border-radius: var(--border-radius-sm);
    padding: 8px 30px;
    margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
}

@include mixins.mobile-device {
    .offer_inputs {
        grid-template-columns: 1fr;
    }
}
</style>
