<template>
    <div class="create-offer__container">
        <div class="create-offer__container__form">
            <div class="create-offer__container__form__element full-width">
                <label>{{ $t('earn.rewards.create.memo').toString() }}</label>
                <cam-input
                    class="input"
                    v-model="offer.memo"
                    :placeholder="$t('earn.rewards.create.memo')"
                    :error="nameLengthError"
                    :errorMessage="$t('earn.rewards.errors.title')"
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>{{ $t('earn.rewards.create.offer_start') }}</label>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="defaultDuration"
                    @change_end="setStartDate"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <label>{{ $t('earn.rewards.create.offer_end') }}</label>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="maxDuration"
                    @change_end="setEndDate"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <label>{{ $t('earn.rewards.create.min_amount') }}</label>
                <AvaxInput
                    class="input"
                    v-model="offer.minAmount"
                    :initial="offer.minAmount"
                    :max="maxDepositAmount"
                    :camInput="true"
                    :error="minAmountError"
                    :errorMessage="
                        $t('earn.rewards.errors.min_amount', {
                            minAmount: 0.001,
                            symbol: nativeAssetSymbol,
                        })
                    "
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.total_max_amount') }}
                </label>
                <AvaxInput
                    class="input"
                    v-model="offer.totalMaxAmount"
                    :initial="offer.totalMaxAmount"
                    :max="maxDepositAmount"
                    :camInput="true"
                    :error="maxAmountError"
                    :errorMessage="
                        $t('earn.rewards.errors.min_amount', {
                            minAmount: 0.001,
                            symbol: nativeAssetSymbol,
                        })
                    "
                ></AvaxInput>
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.min_duration') }}
                </label>
                <CamInput class="input" :placeholder="`minDuration`" v-model="offer.minDuration" />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.max_duration') }}
                </label>
                <CamInput class="input" :placeholder="`maxDuration`" v-model="offer.maxDuration" />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.unlock_duration') }}
                </label>
                <CamInput
                    class="input"
                    v-model="offer.unlockPeriodDuration"
                    :placeholder="`unlockPeriodDuration`"
                    :error="unlockDurationError"
                    :errorMessage="`Unlock duration must be greater than 0`"
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.no_rewards_duration') }}
                </label>
                <CamInput
                    class="input"
                    v-model="offer.noRewardsPeriodDuration"
                    :placeholder="`noRewardsPeriodDuration`"
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.interrest_rate') }}
                </label>
                <CamInput
                    class="input"
                    v-model="interestRateNominator"
                    v-on:input="setInterestRate"
                    :placeholder="`interestRateNominator`"
                    :error="interestRateAndTotalMaxRewardAmountError"
                    :errorMessage="`Interest rate must be 0 if total max reward amount is 0, and vice versa`"
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.total_max_reward_amount') }}
                </label>
                <CamInput
                    class="input"
                    v-model="totalMaxRewardAmount"
                    v-on:input="setTotalMaxRewardAmount"
                    :placeholder="`totalMaxRewardAmount`"
                    :readonly="sunrisePhase === 0"
                    :error="interestRateAndTotalMaxRewardAmountError"
                    :errorMessage="`Interest rate must be 0 if total max reward amount is 0, and vice versa`"
                ></CamInput>
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.flags') }}
                </label>
                <input
                    class="input"
                    type="number"
                    :value="offer.flags.toString(10)"
                    v-on:input="setFlags"
                    min="0"
                    inputmode="numeric"
                />
            </div>
            <div class="create-offer__container__form__element">
                <label>
                    {{ $t('earn.rewards.create.owner_address') }}
                </label>
                <CamInput
                    class="input"
                    :placeholder="`ownerAddress`"
                    v-model.number="offer.ownerAddress"
                    :disabled="sunrisePhase === 0"
                    :error="ownerAddressCheck"
                    :errorMessage="ownerAddressCheck"
                />
            </div>
            <div v-if="!isMultisigWallet" class="create-offer__container__form__element full-width">
                <label>Addresses allowed to deposit</label>
                <div class="addresses_container input">
                    <div v-for="(address, index) in addresses" :key="index">
                        <div class="address_container">
                            <button @click="removeAddress(index)" class="circle delete-button">
                                <CamTooltip
                                    :content="$t('edit_multisig.label.remove_owner')"
                                    placement="left"
                                >
                                    <fa icon="minus"></fa>
                                </CamTooltip>
                            </button>
                            <CamInput
                                class="input"
                                v-model="address.address"
                                :disabled="
                                    !offer.ownerAddress || ownerAddressCheck === 'Invalid address'
                                "
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Alert style="margin-top: 16px" variant="negative" v-if="validAddressError">
                {{ $t('edit_multisig.errors.invalid_addresses') }}
            </Alert>
            <button @click.prevent="addAddress" class="circle plus-button">
                <fa icon="plus"></fa>
            </button>
        </div>
        <div class="create-offer__container__actions">
            <div class="create-offer__container__actions__aletrs">
                <Alert v-if="hasExclusiveTotalMaxAmountOrReward" variant="negative">
                    can only use either TotalMaxAmount or TotalMaxRewardAmount
                </Alert>
                <Alert v-if="isMinDurationLessThanNoRewardsPeriod" variant="negative">
                    deposit offer minimum duration ({{ offer.minDuration }}) is less than no-rewards
                    period duration ({{ offer.noRewardsPeriodDuration }})
                </Alert>
                <Alert v-if="isMinDurationLessThanUnlockPeriod" variant="negative">
                    deposit offer minimum duration ({{ offer.minDuration }}) is less than unlock
                    period duration ({{ offer.unlockPeriodDuration }})
                </Alert>
                <Alert v-if="isMaxDirationLessThanMinDuration" variant="negative">
                    deposit offer max duration ({{ offer.maxDuration }}) is less than minimum
                    duration ({{ offer.minDuration }})
                </Alert>
                <Alert v-if="isMinDurationEqualtoZero" variant="negative">
                    deposit offer has zero minimum duration
                </Alert>
                <Alert v-if="isStartDateGreaterThanEndDate" variant="negative">
                    deposit offer start date is greater than end date
                </Alert>
                <Alert variant="warning">
                    Creating this depositOffer will incurr a fee of
                    {{ feeAmt }} {{ nativeAssetSymbol }}
                </Alert>
            </div>
            <div class="create-offer__container__actions__buttons">
                <CamBtn
                    v-if="$listeners['selectOffer']"
                    variant="primary"
                    @click.prevent="submitCreateOffer"
                    :disabled="!formValid"
                >
                    {{ $t('earn.rewards.create.submit') }}
                </CamBtn>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { ava } from '@/AVA'
import Alert from '@/components/Alert.vue'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { DAY_MS, ZeroBN } from '@/constants'
import { isValidPChainAddress } from '@/helpers/address_helper'
import { bnToBig } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'
import { BN } from '@c4tplatform/caminojs'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

const MAX_TITLE_BYTE_SIZE = 64

import { WalletHelper } from '@/helpers/wallet_helper'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'
import DateForm from './DateForm.vue'

@Component({
    components: { CamInput, CamBtn, Alert, DateForm, AvaxInput },
})
export default class CreateOfferForm extends Vue {
    @Prop() maxDepositAmount!: BN
    interestRateNominator = ZeroBN
    totalMaxRewardAmount = ZeroBN
    // @ts-ignore
    helpers = this.globalHelper()
    addresses: { address: string }[] = [{ address: '' }]
    offer: DepositOffer = {
        upgradeVersion: 1,
        id: '',
        interestRateNominator: ZeroBN,
        start: ZeroBN,
        end: ZeroBN,
        minAmount: new BN(1000000),
        totalMaxAmount: ZeroBN,
        depositedAmount: ZeroBN,
        minDuration: 1,
        maxDuration: 86400,
        unlockPeriodDuration: 1,
        noRewardsPeriodDuration: 0,
        memo: '',
        flags: ZeroBN,
        totalMaxRewardAmount: ZeroBN,
        rewardedAmount: ZeroBN,
        ownerAddress: '',
    }
    /* errors */
    get nameLengthError() {
        const bytes = new TextEncoder().encode(this.offer.memo)
        return bytes.length > MAX_TITLE_BYTE_SIZE || bytes.length === 0
    }
    get minAmountError() {
        // if (/[a-zA-Z]/.test(this.offer.minAmount.toString())) return true
        return this.offer.minAmount.lt(new BN(1000000))
    }
    get maxAmountError() {
        return false
        // if (/[a-zA-Z]/.test(this.offer.totalMaxAmount.toString())) return true
        // return this.offer.totalMaxAmount.lt(this.offer.minAmount)
    }
    get minDurationError() {
        const minDurationString = String(this.offer.minDuration)

        return (
            isNaN(this.offer.minDuration) ||
            /[a-zA-Z]/.test(minDurationString) ||
            this.offer.minDuration < 0 ||
            /^0[0-9]/.test(minDurationString)
        )
    }
    get maxDurationError() {
        const maxDurationString = String(this.offer.maxDuration)

        return (
            isNaN(this.offer.maxDuration) ||
            /[a-zA-Z]/.test(maxDurationString) ||
            this.offer.maxDuration < 0 ||
            /^0[0-9]/.test(maxDurationString) ||
            this.offer.maxDuration < this.offer.minDuration
        )
    }
    get unlockDurationError() {
        const unlockDurationString = String(this.offer.unlockPeriodDuration)

        return (
            isNaN(this.offer.unlockPeriodDuration) ||
            /[a-zA-Z]/.test(unlockDurationString) ||
            this.offer.unlockPeriodDuration < 0 ||
            /^0[0-9]/.test(unlockDurationString)
        )
    }
    get noRewardsPeriodDurationError() {
        const noRewardsPeriodDurationString = String(this.offer.noRewardsPeriodDuration)

        return (
            isNaN(this.offer.noRewardsPeriodDuration) ||
            /[a-zA-Z]/.test(noRewardsPeriodDurationString) ||
            this.offer.noRewardsPeriodDuration < 0 ||
            /^0[0-9]/.test(noRewardsPeriodDurationString)
        )
    }
    get hasExclusiveTotalMaxAmountOrReward() {
        const hasTotalMaxAmount =
            BN.isBN(this.offer.totalMaxAmount) && !this.offer.totalMaxAmount.isZero()
        const hasTotalMaxRewardAmount =
            BN.isBN(this.offer.totalMaxRewardAmount) && !this.offer.totalMaxRewardAmount.isZero()

        return hasTotalMaxAmount && hasTotalMaxRewardAmount
    }
    get isMinDurationLessThanNoRewardsPeriod() {
        return Number(this.offer.minDuration) < Number(this.offer.noRewardsPeriodDuration)
    }
    // deposit offer minimum duration (86400) is less than unlock period duration (864002)
    get isMinDurationLessThanUnlockPeriod() {
        return Number(this.offer.minDuration) < Number(this.offer.unlockPeriodDuration)
    }
    get isMaxDirationLessThanMinDuration() {
        return Number(this.offer.maxDuration) < Number(this.offer.minDuration)
    }
    get isMinDurationEqualtoZero() {
        return Number(this.offer.minDuration) === 0
    }
    get isStartDateGreaterThanEndDate() {
        return this.offer.start > this.offer.end
    }
    get interestRateAndTotalMaxRewardAmountError() {
        // Ensure that the values are instances of BN and then compare
        const interestRateNotZero =
            BN.isBN(this.offer.interestRateNominator) && !this.offer.interestRateNominator.isZero()
        const totalMaxRewardAmountNotZero =
            BN.isBN(this.offer.totalMaxRewardAmount) && !this.offer.totalMaxRewardAmount.isZero()

        // Error if only one of them is non-zero (XOR condition)
        return interestRateNotZero !== totalMaxRewardAmountNotZero
    }
    get ownerAddressCheck() {
        if (!this.offer.ownerAddress) return ''
        return !isValidPChainAddress(this.offer.ownerAddress as string) ||
            this.offer.ownerAddress != this.wallet?.getStaticAddress('P')
            ? 'Invalid address'
            : ''
    }
    get validAddressError(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')

        for (const addressObj of filledAddresses) {
            if (!isValidPChainAddress(addressObj.address)) return true
        }

        return false
    }
    /* validation */
    get formValid(): boolean {
        if (this.offer.start > this.offer.end) return false
        return true
    }

    /* methods */
    async submitCreateOffer() {
        if (this.offer.ownerAddress === '') this.offer.ownerAddress = undefined
        const wallet: WalletType = this.$store.state.activeWallet
        let addresses = this.addresses.filter((a) => a.address !== '')
        this.printOffer()
        try {
            const result = await WalletHelper.buildAddDepositOfferTx(wallet, this.offer)
            this.offer = this.offer
            this.clearOffer()
            this.$store.dispatch('Platform/addAllowedAddresses', {
                depositOfferID: result,
                allowedAddresses: addresses,
                timestamp: this.offer.start.toNumber(),
            })
            this.helpers.dispatchNotification({
                message: `Create Offer Successful (TX: ${result})`,
                type: 'success',
            })
        } catch (error) {
            if (error instanceof SignatureError) {
                await this.$store.dispatch('Signavault/updateTransaction')
                this.helpers.dispatchNotification({
                    message: 'Transaction Recorded.',
                    type: 'success',
                })
            } else {
                let err = error as Error
                this.helpers.dispatchNotification({
                    message: err.message,
                    type: 'error',
                })
                return
            }
        }
        this.cancelCreateOffer()
        this.printOffer()
    }
    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }
    setStartDate(val: string) {
        this.offer.start = new BN(new Date(val).getTime() / 1000)
    }
    setEndDate(val: string) {
        this.offer.end = new BN(new Date(val).getTime() / 1000)
    }
    setInterestRate(ev: any) {
        if (ev && ev.target) {
            const interestRateValue = ev.target.value
            this.offer.interestRateNominator = new BN(interestRateValue)
        }
    }
    setFlags(ev: any) {
        this.offer.flags = new BN(ev.target.value)
    }
    setTotalMaxRewardAmount(ev: any) {
        if (ev && ev.target) {
            const totalMaxRewardAmountValue = ev.target.value
            this.offer.totalMaxRewardAmount = new BN(totalMaxRewardAmountValue)
        }
    }
    cancelCreateOffer(): void {
        this.$emit('selectOffer')
    }
    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '' })
    }
    removeAddress(index: number): void {
        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) this.addAddress()
    }
    /* computed */
    get wallet(): WalletType {
        return this.$store.state.activeWallet
    }
    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }
    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }
    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }
    get minDuration() {
        return 1
    }
    get maxDuration() {
        return 1 * 365 * DAY_MS
    }
    get defaultDuration() {
        return 1
    }
    get sunrisePhase(): number {
        return this.$store.getters['Platform/getSunrisePhase']
    }
    get isMultisigWallet(): boolean {
        return this.wallet instanceof MultisigWallet
    }
    /* lifecycle */
    /* watchers */
    @Watch('interestRateNominator')
    onInterestRateNominatorChange() {
        this.offer.interestRateNominator = new BN(this.interestRateNominator)
    }
    @Watch('totalMaxRewardAmount')
    onTotalMaxRewardAmountChange() {
        this.offer.totalMaxRewardAmount = new BN(this.totalMaxRewardAmount)
    }
    /* filters */
    /* refs */
    /* utiils */
    clearOffer() {
        this.offer = {
            ...this.offer,
            interestRateNominator: ZeroBN,
            minAmount: new BN(1000000),
            totalMaxAmount: ZeroBN,
            depositedAmount: ZeroBN,
            minDuration: 1,
            maxDuration: 86400,
            unlockPeriodDuration: 1,
            noRewardsPeriodDuration: 0,
            memo: '',
            flags: ZeroBN,
            totalMaxRewardAmount: ZeroBN,
            rewardedAmount: ZeroBN,
            ownerAddress: '',
        }
        this.setInterestRate({ target: { value: 0 } })
        this.setFlags({ target: { value: 0 } })
        this.setTotalMaxRewardAmount({ target: { value: 0 } })
        this.setStartDate(new Date().toISOString())
        this.setEndDate(new Date().toISOString())
    }
    printOffer() {
        let Offer = {
            interestRateNominator: Number(bnToBig(this.offer.interestRateNominator)),
            minAmount: Number(bnToBig(this.offer.minAmount, 9)),
            totalMaxAmount: Number(bnToBig(this.offer.totalMaxAmount, 9)),
            minDuration: this.offer.minDuration,
            maxDuration: this.offer.maxDuration,
            unlockPeriodDuration: this.offer.unlockPeriodDuration,
            noRewardsPeriodDuration: this.offer.noRewardsPeriodDuration,
            flags: Number(bnToBig(this.offer.flags)),
            totalMaxRewardAmount: Number(bnToBig(this.offer.totalMaxRewardAmount)),
            memo: this.offer.memo,
            ownerAddress: this.offer.ownerAddress,
            start: new Date(Number(bnToBig(this.offer.start)) * 1000),
            end: new Date(Number(bnToBig(this.offer.end)) * 1000),
        }
        console.log(Offer)
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.create-offer__container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    &__form {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        &__element {
            min-width: 300px;
            flex: 1 1 45%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            align-self: stretch;
            .input {
                width: 100%;
            }
            input {
                padding: 10px 12px;
                border-radius: 8px;
                border: 1px solid var(--camino-slate-slate-600);
                &:disabled {
                    border: 1px solid var(--camino-slate-slate-600) !important;
                }
            }
        }
        .full-width {
            flex: 1 1 100%;
        }
    }
    &__actions {
        display: flex;
        flex-direction: column;
        gap: 16px;
        &__aletrs {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        &__buttons {
        }
    }
    .addresses_container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .address_container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
    }

    .circle {
        border: 2px solid var(--camino-slate-slate-600);
        cursor: pointer;
        justify-content: center;
        align-items: center;
        display: flex;
        border-radius: 100%;
        padding: 10px;
    }

    .plus-button {
        border: 2px solid var(--camino-success-color);
        font-size: 10px;
        width: 40px !important;
        height: 40px !important;
        svg {
            color: var(--camino-success-color);
        }
    }

    .delete-button {
        border: 2px solid var(--camino-error-color);
        width: 35px !important;
        height: 35px !important;
        svg {
            color: var(--camino-error-color);
        }
    }
    .delete-button.mobile {
        display: none;
    }

    .delete-button.desktop {
        display: flex;
    }

    @include mixins.mobile-device {
        .delete-button.mobile {
            display: flex;
        }

        .delete-button.desktop {
            display: none;
        }
    }
}
</style>
