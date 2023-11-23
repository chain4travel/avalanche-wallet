<template>
    <div>
        <br />
        <div v-if="!validatorIsLoading">
            <div class="cols">
                <form @submit.prevent="">
                    <transition-group name="fade" mode="out-in">
                        <div v-show="!isConfirm" key="form" class="ins_col">
                            <div>
                                <h4 class="input_label">{{ $t('earn.validate.nodeId') }}</h4>
                                <span class="disabled_input" role="textbox">
                                    {{ nodeId }}
                                </span>
                            </div>
                            <div v-if="isMultiSig" style="margin: 30px 0">
                                <h4>{{ $t('earn.validate.transaction_duration.label') }}</h4>
                                <p class="desc">
                                    {{ $t('earn.validate.transaction_duration.desc') }}
                                </p>
                                <DateForm
                                    @change_end="setTransactionEnd"
                                    :minDurationMs="minValidationStartDate"
                                    :maxDurationMs="maxValidationStartDate"
                                    :defaultDurationMs="minValidationStartDate"
                                ></DateForm>
                            </div>
                            <div style="margin: 30px 0">
                                <h4>{{ $t('earn.validate.duration.label') }}</h4>
                                <p class="desc">
                                    {{ $t('earn.validate.duration.desc') }}
                                </p>
                                <DateForm
                                    @change_end="setEnd"
                                    :minDurationMs="minStakeDuration"
                                    :maxDurationMs="maxStakeDuration"
                                    :defaultDurationMs="minStakeDuration"
                                ></DateForm>
                            </div>
                            <div style="margin: 30px 0">
                                <h4>{{ $t('earn.validate.amount.label') }}</h4>
                                <p class="desc">
                                    {{
                                        $t('earn.validate.amount.desc', [
                                            displayMinStakeAmt.toLocaleString(),
                                        ])
                                    }}
                                </p>
                                <AvaxInput
                                    v-model="stakeAmt"
                                    :max="maxAmt"
                                    ref="avaxinput"
                                    :readonly="true"
                                    class="amt_in"
                                ></AvaxInput>
                            </div>
                        </div>
                        <ConfirmPage
                            key="confirm"
                            v-show="isConfirm"
                            :node-i-d="nodeId"
                            :end="formEnd"
                            :txEnd="formTxExpirationDate"
                            :amount="formAmt"
                            :reward-address="rewardIn"
                            :reward-destination="rewardDestination"
                            :isMultisig="isMultiSig"
                            :timeSpan="timeSpanofStartValidationTime"
                        ></ConfirmPage>
                    </transition-group>
                    <div>
                        <div class="summary" v-if="!isSuccess">
                            <div>
                                <label>{{ $t('earn.validate.summary.duration') }}</label>
                                <p>{{ durationText }}</p>
                            </div>
                            <div class="submit_box">
                                <p
                                    v-if="
                                        warnShortDuration &&
                                        isMultiSig &&
                                        thresholdMultiSig &&
                                        !isConfirm
                                    "
                                    class="err"
                                >
                                    {{
                                        $t('earn.validate.errs.duration_warn_multisig', {
                                            threshold: thresholdMultiSig - 1,
                                        })
                                    }}
                                    <em class="cursive">
                                        {{ $t('earn.validate.errs.cursive_word') }}
                                    </em>
                                    {{
                                        $t('earn.validate.errs.duration_warn_multisig_confrim', {
                                            threshold: thresholdMultiSig - 1,
                                        })
                                    }}
                                </p>
                                <p
                                    v-else-if="
                                        warnShortDuration &&
                                        isMultiSig &&
                                        thresholdMultiSig &&
                                        isConfirm
                                    "
                                    class="err"
                                >
                                    {{
                                        $t('earn.validate.errs.duration_warn_multisig', {
                                            threshold: thresholdMultiSig - 1,
                                        })
                                    }}
                                    <em class="cursive">
                                        {{ $t('earn.validate.errs.cursive_word') }}
                                    </em>
                                    {{
                                        $t('earn.validate.errs.duration_warn_multisig_submit', {
                                            threshold: thresholdMultiSig - 1,
                                        })
                                    }}
                                </p>
                                <p class="err" style="margin-bottom: 1rem">{{ err }}</p>
                                <Alert variant="warning" style="margin-bottom: 1rem">
                                    {{
                                        $t('earn.validate.warns.duration_warn', {
                                            period: minStakeDurationText,
                                        })
                                    }}
                                </Alert>
                                <CamBtn
                                    v-if="!isConfirm"
                                    variant="primary"
                                    @click="confirm"
                                    :loading="isLoading"
                                    :disabled="!canSubmit"
                                    style="width: 100%"
                                >
                                    {{ $t('earn.validate.confirm') }}
                                </CamBtn>
                                <template v-else>
                                    <div class="box_buttons_container">
                                        <CamBtn
                                            variant="transparent"
                                            @click="cancelConfirm"
                                            style="width: 100%"
                                        >
                                            {{ $t('earn.validate.cancel') }}
                                        </CamBtn>
                                        <CamBtn
                                            @click="submit"
                                            variant="primary"
                                            :loading="isLoading"
                                            style="width: 100%"
                                        >
                                            {{ $t('earn.validate.submit') }}
                                        </CamBtn>
                                    </div>
                                </template>
                            </div>
                        </div>
                        <div class="success_cont" v-else>
                            <h2>{{ $t('earn.validate.success.title') }}</h2>
                            <p>{{ $t('earn.validate.success.desc') }}</p>
                            <p class="tx_id">Tx ID: {{ txId }}</p>

                            <div class="tx_status">
                                <div>
                                    <label>{{ $t('earn.validate.success.status') }}</label>
                                    <p v-if="!txStatus">Waiting..</p>
                                    <p v-else>{{ txStatus }}</p>
                                </div>
                                <div class="status_icon">
                                    <Spinner
                                        v-if="!txStatus"
                                        style="color: var(--primary-color)"
                                    ></Spinner>
                                    <p
                                        style="color: var(--success)"
                                        v-if="txStatus === 'Committed'"
                                    >
                                        <fa icon="check-circle"></fa>
                                    </p>
                                    <p style="color: var(--error)" v-if="txStatus === 'Dropped'">
                                        <fa icon="times-circle"></fa>
                                    </p>
                                </div>
                            </div>

                            <div class="reason_cont" v-if="txReason">
                                <label>{{ $t('earn.validate.success.reason') }}</label>
                                <p>{{ txReason }}</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div v-else>
            <validator-pending></validator-pending>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
//@ts-ignore
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { BN } from '@c4tplatform/caminojs/dist'
import Big from 'big.js'
//@ts-ignore
import { QrInput } from '@c4tplatform/vue_components'
import { ava, bintools } from '@/AVA'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import ConfirmPage from '@/components/wallet/earn/Validate/ConfirmPage.vue'
import moment from 'moment'
import Tooltip from '@/components/misc/Tooltip.vue'
import Spinner from '@/components/misc/Spinner.vue'
import DateForm from '@/components/wallet/earn/DateForm.vue'
import UtxoSelectForm from '@/components/wallet/earn/UtxoSelectForm.vue'
import Expandable from '@/components/misc/Expandable.vue'
import { AmountOutput, UTXO } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { WalletType } from '@/js/wallets/types'
import { WalletHelper } from '@/helpers/wallet_helper'
import { bnToBig } from '@/helpers/helper'
import ValidatorPending from './ValidatorPending.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'

const MIN_MS = 60000
const HOUR_MS = MIN_MS * 60
const DAY_MS = HOUR_MS * 24
const DEFAULT_VALIDATION_START_TIME = 10
const SINGLETON_WALLET_MIN_VALIDATION_START_TIME = MIN_MS * 5 // 5 minutes

@Component({
    name: 'add_validator',
    components: {
        Tooltip,
        AvaxInput,
        QrInput,
        ConfirmPage,
        Spinner,
        DateForm,
        Expandable,
        UtxoSelectForm,
        ValidatorPending,
        CamBtn,
        Alert,
    },
})
export default class AddValidator extends Vue {
    @Prop() nodeId!: string
    startDate: string = new Date(Date.now() + MIN_MS * 15).toISOString()
    endDate: string = new Date().toISOString()
    transactionEndDate: string = new Date(
        new Date().setMinutes(new Date().getMinutes() + DEFAULT_VALIDATION_START_TIME)
    ).toISOString() // 10 minutes after as default
    rewardIn: string = ''

    rewardDestination = 'local' // local || custom
    isLoading = false
    isConfirm = false
    err: string = ''
    stakeAmt: BN = new BN(0)
    loading: boolean = false
    minFee = 2

    formAmt: BN = new BN(0)
    formEnd: Date = new Date()
    formFee: number = 0
    formRewardAddr = ''
    formUtxos: UTXO[] = []
    formTxExpirationDate = new Date()

    txId = ''
    txStatus: string | null = null
    txReason: null | string = null

    isSuccess = false

    currency_type = 'NATIVE'
    validatorIsLoading = false

    // @ts-ignore
    helpers = this.globalHelper()

    mounted() {
        this.rewardSelect('local')
        this.validateReadyValidator()
        //@ts-ignore
        this.$refs.avaxinput.maxOut()
    }

    get minValidationStartDate(): number {
        return DEFAULT_VALIDATION_START_TIME * MIN_MS
    }

    get maxValidationStartDate(): number {
        // max 13 days from now as validation start date
        return 14 * DAY_MS
    }

    get minStakeDuration() {
        if (this.isMultiSig)
            return ava.getNetwork().P.minStakeDuration * 1000 + this.minValidationStartDate
        return ava.getNetwork().P.minStakeDuration * 1000
    }

    get minStakeDurationText() {
        let duration = ava.getNetwork().P.minStakeDuration * 1000

        return moment.duration(duration, 'milliseconds').humanize()
    }

    get maxStakeDuration() {
        if (this.isMultiSig) {
            let start = new Date(this.transactionEndDate)
            let now = Date.now() + DEFAULT_VALIDATION_START_TIME * MIN_MS
            let duration = start.getTime() - now

            return (
                ava.getNetwork().P.maxStakeDuration * 1000 + duration + this.minValidationStartDate
            )
        }
        return ava.getNetwork().P.maxStakeDuration * 1000
    }

    get defaultStakeDuration() {
        return 21 * DAY_MS
    }

    async validateReadyValidator() {
        let dataValidator = await this.verifyIfexistNodeInCurrentValidator()
        this.$emit('validatorReady', dataValidator)
    }

    async verifyIfexistNodeInCurrentValidator() {
        let validator = await WalletHelper.findNodeIDInCurrentValidators(this.nodeId)
        return validator
    }

    setEnd(val: string) {
        this.endDate = val
    }
    setTransactionEnd(val: string) {
        this.transactionEndDate = val
    }

    get rewardAddressLocal() {
        let wallet: MnemonicWallet = this.$store.state.activeWallet
        return wallet.getPlatformRewardAddress()
    }
    get isMultiSig() {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'multisig'
    }
    get thresholdMultiSig(): number | undefined {
        let wallet: WalletType = this.$store.state.activeWallet
        return (wallet as MultisigWallet)?.keyData?.owner?.threshold
    }
    get timeSpanofStartValidationTime() {
        return SINGLETON_WALLET_MIN_VALIDATION_START_TIME / MIN_MS
    }
    rewardSelect(val: 'local' | 'custom') {
        if (val === 'local') {
            this.rewardIn = this.rewardAddressLocal
        } else {
            this.rewardIn = ''
        }
        this.rewardDestination = val
    }

    // Returns true to show a warning about short validation periods that can not take any delegators
    get warnShortDuration(): boolean {
        let dur = this.stakeDuration

        // If duration is less than 16 days give a warning
        if (dur <= DAY_MS * 16) {
            return true
        }
        return false
    }

    get stakeDuration(): number {
        let start = this.isMultiSig ? new Date(this.transactionEndDate) : new Date(this.startDate)
        let end = new Date(this.endDate)

        if (this.isConfirm) {
            end = this.formEnd
        }

        let diff = this.isMultiSig
            ? end.getTime() - start.getTime()
            : end.getTime() - start.getTime() + 15 * MIN_MS
        return diff
    }

    get durationText() {
        let d = moment.duration(this.stakeDuration, 'milliseconds')
        let days = Math.floor(d.asDays())
        return `${days} days ${d.hours()} hours ${d.minutes()} minutes`
    }

    get denomination() {
        return 9
    }

    get platformUnlocked(): BN {
        return this.$store.getters['Assets/walletPlatformBalance']
    }

    get platformLockedStakeable(): BN {
        return this.$store.getters['Assets/walletPlatformBalanceLockedStakeable']
    }

    get feeAmt(): BN {
        return ava.PChain().getTxFee()
    }

    get utxosBalance(): BN {
        return this.formUtxos.reduce((acc, val: UTXO) => {
            let out = val.getOutput() as AmountOutput
            return acc.add(out.getAmount())
        }, new BN(0))
    }

    get maxAmt(): BN {
        return ava.getNetwork().P.minStake
    }

    updateFormData() {
        this.formAmt = this.stakeAmt
        this.formEnd = new Date(this.endDate)
        this.formRewardAddr = this.rewardIn
        this.formTxExpirationDate = new Date(this.transactionEndDate)
    }

    confirm() {
        if (!this.formCheck()) return
        this.updateFormData()
        this.isConfirm = true
    }

    cancelConfirm() {
        this.isConfirm = false
    }

    cancel() {
        this.$emit('cancel')
    }

    get canSubmit() {
        let minDuration = ava.getNetwork().P.minStakeDuration * 1000
        let maxDuration = ava.getNetwork().P.maxStakeDuration * 1000

        if (!this.nodeId) {
            return false
        }

        if (this.stakeAmt.isZero()) {
            return false
        }

        if (!this.rewardIn) {
            return false
        }

        if (this.stakeDuration < minDuration || this.stakeDuration > maxDuration) {
            return false
        }

        return true
    }

    formCheck(): boolean {
        this.err = ''

        // Reward Address
        if (this.rewardDestination !== 'local') {
            let rewardAddr = this.rewardIn

            // If it doesnt start with P
            if (rewardAddr[0] !== 'P') {
                this.err = this.$t('earn.validate.errs.address') as string
                return false
            }

            // not a valid address
            try {
                bintools.stringToAddress(rewardAddr)
            } catch (e) {
                this.err = this.$t('earn.validate.errs.address') as string
                return false
            }
        }

        // Stake amount
        if (this.stakeAmt.lt(this.minStakeAmt)) {
            let big = Big(this.minStakeAmt.toString()).div(Math.pow(10, 9))
            this.err = this.$t('earn.validate.errs.amount', [big.toLocaleString()]) as string
            return false
        }

        return true
    }

    async submit() {
        if (!this.formCheck()) return
        let wallet: WalletType = this.$store.state.activeWallet

        /* If multisig flow we set the start date of the validator
         * same as the expiration date of the TX in signavault
         * In single sig flow, set the start date of validation
         * after 5 minutes
         */
        let startDate = this.isMultiSig
            ? this.formTxExpirationDate
            : new Date(Date.now() + SINGLETON_WALLET_MIN_VALIDATION_START_TIME)
        let endMs = this.formEnd.getTime()
        let startMs = startDate.getTime()

        let milisecondsMaxStakeDuration = ava.getNetwork().P.maxStakeDuration * 10000

        // If End date - start date is greater than max stake duration, adjust start date
        if (endMs - startMs > milisecondsMaxStakeDuration) {
            startDate = new Date(endMs - milisecondsMaxStakeDuration)
        }
        try {
            this.isLoading = true
            this.err = ''
            const startTime = startDate.getTime() / 1000
            const endTime = this.formEnd.getTime() / 1000
            let txId = await WalletHelper.addValidatorTx(
                wallet,
                this.nodeId,
                new BN(startTime),
                new BN(endTime),
                new BN(this.formAmt.toString()),
                Math.trunc(new Date(this.transactionEndDate).getTime() / 1000)
            )
            this.isLoading = false

            if (txId) {
                this.onTxSubmit(txId)
            } else {
                this.$emit('initiated')
            }
        } catch (err: any) {
            this.helpers.dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error', {
                    error: `:` + err.message.split(':')[1] ?? '',
                }),
                type: 'error',
            })
            this.isLoading = false
            this.onerror(err)
        }
    }

    onTxSubmit(txId: string) {
        this.txId = txId
        this.isSuccess = true
        this.updateTxStatus(txId)
    }

    async onValidatorIsConfirmed() {
        this.validatorIsLoading = true
        let dataValidator = await this.verifyIfexistNodeInCurrentValidator()
        if (dataValidator === undefined || dataValidator === null) {
            setTimeout(() => {
                this.onValidatorIsConfirmed()
            }, 5000)
        } else {
            this.onsuccess(dataValidator)
        }
    }

    onsuccess(dataValidator: any) {
        // Update History
        setTimeout(() => {
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
            this.validatorIsLoading = false
            this.$emit('validatorReady', dataValidator)
        }, 3000)
    }

    async updateTxStatus(txId: string) {
        let res = await ava.PChain().getTxStatus(txId)
        let status
        let reason = null
        if (typeof res === 'string') {
            status = res
        } else {
            status = res.status
            reason = res.reason
        }

        if (!status || status === 'Processing' || status === 'Unknown') {
            setTimeout(() => {
                this.updateTxStatus(txId)
            }, 5000)
        } else {
            this.txStatus = status
            this.txReason = reason

            if (status === 'Committed') {
                this.onValidatorIsConfirmed()
            }
        }
    }

    get minStakeAmt(): BN {
        return this.$store.state.Platform.minStake
    }

    get displayMinStakeAmt(): Big {
        let bn = this.$store.state.Platform.minStake
        return bnToBig(bn, 9)
    }

    onerror(err: any) {
        let msg: string = err.message
        console.error(err)

        if (msg.includes('startTime')) {
            this.err = this.$t('earn.validate.errs.date') as string
        } else if (msg.includes('must be at least')) {
            let minAmt = this.minStakeAmt
            let big = Big(minAmt.toString()).div(Math.pow(10, 9))
            this.err = this.$t('earn.validate.errs.amount', [big.toLocaleString()]) as string
        } else if (msg.includes('address format')) {
            this.err = this.$t('earn.validate.errs.address') as string
        } else {
            this.err = err.message
        }
    }

    async refresh() {
        this.$emit('refresh')
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/main';
@use '../../../../styles/abstracts/mixins';
.cursive {
    font-style: italic;
}
form {
    display: grid;
    grid-template-columns: 1fr 340px;
    column-gap: 1rem;
}

.ins_col {
    max-width: 490px;
}

.amt {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    border: 1px solid #999;
    padding: 4px 14px;
}

.bigIn {
    flex-grow: 1;
}

input {
    color: var(--primary-color);
    background-color: var(--bg-light);
    padding: 6px 14px;
}

.desc {
    @include mixins.typography-caption;
    margin-bottom: 8px !important;
    color: var(--primary-color-light);
}

h4 {
    font-weight: bold;
}

label {
    margin-top: 6px;
    color: var(--primary-color-light);
    @include mixins.typography-caption;
    margin-bottom: 3px;
}

.dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 15px;

    label > span {
        float: right;
        opacity: 0.4;
        cursor: pointer;

        &:hover {
            opacity: 1;
        }
    }
}

.submit_box {
    .v-btn {
        margin-top: 14px;
    }
}

.summary {
    border-left: 2px solid var(--bg-light);
    padding-left: 30px;
    height: 100%;

    > div {
        margin-bottom: 14px;

        p {
            @include mixins.typography-subtitle-1;
        }
    }

    .err {
        margin: 14px 0 !important;
        @include mixins.typography-caption;
    }
}

.success_cont {
    .check {
        font-size: 4em;
        color: var(--success);
    }

    .tx_id {
        @include mixins.typography-caption;
        color: var(--primary-color-light);
        word-break: break-all;
        margin: 14px 0 !important;
        font-weight: bold;
    }
}

.reward_in {
    transition-duration: 0.2s;

    &[type='local'] {
        .reward_addr_in {
            opacity: 0.3;
            user-select: none;
            pointer-events: none;
        }
    }
}

.reward_tabs {
    margin-bottom: 8px;
    @include mixins.typography-caption;

    button {
        color: var(--primary-color-light);

        &:hover {
            color: var(--primary-color);
        }

        &[selected] {
            color: var(--secondary-color);
        }
    }

    span {
        margin: 0px 12px;
    }
}

.tx_status {
    display: flex;
    justify-content: space-between;

    .status_icon {
        align-items: center;
        display: flex;
        @include mixins.typography-subtitle-1;
    }
}

.tx_status,
.reason_cont {
    background-color: var(--bg-light);
    padding: 4px 12px;
    margin-bottom: 6px;
}

.disabled_input {
    display: inline-block;
    border-radius: var(--border-radius-sm);
    color: gray;
    background-color: var(--bg-light);
    padding: 10px 14px;
    white-space: nowrap;
    width: 100%;
}

.disabled_input:focus-visible {
    outline: 0;
}

.input_label {
    margin-bottom: 0.5rem;
}

.amt_in {
    pointer-events: none;
}

.box_buttons_container {
    display: flex;
    gap: 0.75rem;
}

@include main.mobile-device {
    form {
        grid-template-columns: 1fr;
    }

    .dates {
        grid-template-columns: 1fr;
    }

    .amt_in {
        width: 100%;
    }

    .summary {
        border-left: none;
        border-top: 2px solid var(--bg-light);
        padding-left: 0;
        padding-top: 30px;
    }
}

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;
}

.refresh {
    width: 20px;
    height: 20px;
    .v-icon {
        color: var(--primary-color);
    }

    button {
        outline: none !important;
    }
    img {
        object-fit: contain;
        width: 100%;
    }

    .spinner {
        color: var(--primary-color) !important;
    }
}
</style>
