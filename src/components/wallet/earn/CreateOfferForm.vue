<template>
    <div>
        <form class="form__container">
            <div class="form__container" v-if="!pendingSendMultisigTX">
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.memo').toString() }}
                    </label>
                    <CamInput
                        v-model="offer.memo"
                        :placeholder="$t('earn.rewards.create.memo')"
                        :error="nameLengthError"
                        :errorMessage="$t('earn.rewards.errors.title')"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.offer_start') }}
                    </label>
                    <DateForm
                        class="form__container__element__date-picker"
                        :minDurationMs="minDuration"
                        :maxDurationMs="maxDuration"
                        :defaultDurationMs="defaultDuration"
                        @change_end="setStartDate"
                    ></DateForm>
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.offer_end') }}
                    </label>
                    <DateForm
                        class="form__container__element__date-picker"
                        :minDurationMs="minDuration"
                        :maxDurationMs="maxDuration"
                        :defaultDurationMs="maxDuration"
                        @change_end="setEndDate"
                    ></DateForm>
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.min_amount') }}
                    </label>
                    <AvaxInput
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
                    ></AvaxInput>
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_amount') }}
                    </label>
                    <AvaxInput
                        v-model="offer.totalMaxAmount"
                        :initial="offer.totalMaxAmount"
                        :max="maxDepositAmount"
                        :camInput="true"
                    ></AvaxInput>
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.min_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`minDuration`"
                        v-model="offer.minDuration"
                        :error="minDurationError"
                        :errorMessage="`Min duration must be greater than 0`"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.max_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`maxDuration`"
                        v-model="offer.maxDuration"
                        :error="maxDurationError"
                        :errorMessage="`Max duration must be greater than min duration`"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.unlock_duration') }}
                    </label>
                    <CamInput
                        v-model="offer.unlockPeriodDuration"
                        :placeholder="`unlockPeriodDuration`"
                        :error="unlockDurationError"
                        :errorMessage="`Unlock duration must be greater than 0`"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.interrest_rate') }}
                    </label>
                    <CamInput
                        v-model="interestRateNominator"
                        v-on:input="setInterestRate"
                        :placeholder="`interestRateNominator`"
                        :error="interestRateAndTotalMaxRewardAmountError"
                        :errorMessage="`Interest rate must be 0 if total max reward amount is 0, and vice versa`"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.no_rewards_duration') }}
                    </label>
                    <CamInput
                        v-model="offer.noRewardsPeriodDuration"
                        :placeholder="`noRewardsPeriodDuration`"
                        :error="noRewardsPeriodDurationError"
                        :errorMessage="`No rewards duration must be greater or equal to 0`"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_reward_amount') }}
                    </label>
                    <CamInput
                        v-model="totalMaxRewardAmount"
                        v-on:input="setTotalMaxRewardAmount"
                        :placeholder="`totalMaxRewardAmount`"
                        :readonly="sunrisePhase === 0"
                        :error="interestRateAndTotalMaxRewardAmountError"
                        :errorMessage="`Interest rate must be 0 if total max reward amount is 0, and vice versa`"
                    ></CamInput>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.flags') }}
                    </label>
                    <input
                        class="form__container__element__input"
                        type="number"
                        :value="offer.flags.toString(10)"
                        v-on:input="setFlags"
                        min="0"
                        inputmode="numeric"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.owner_address') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`ownerAddress`"
                        v-model.number="offer.ownerAddress"
                        :disabled="sunrisePhase === 0"
                        :error="ownerAddressCheck()"
                        :errorMessage="ownerAddressCheck()"
                    />
                    <!-- <input
                        class="form__container__element__input"
                        type="text"
                        v-model="offer.ownerAddress"
                        :disabled="sunrisePhase === 0"
                    /> -->
                </div>

                <div v-if="!isMultisigWallet" class="form__container__element">
                    <label class="form__container__element__label" style="margin-bottom: 8px">
                        Addresses allowed to deposit
                    </label>
                    <div
                        v-for="(address, index) in addresses"
                        :key="index"
                        class="form__container__element__addresses"
                    >
                        <div class="addresses_container">
                            <button @click="removeAddress(index)" class="circle delete-button">
                                <CamTooltip
                                    :content="$t('edit_multisig.label.remove_owner')"
                                    placement="left"
                                >
                                    <fa icon="minus"></fa>
                                </CamTooltip>
                            </button>
                            <!-- <div class="circle number">{{ index + 1 }}</div> -->
                            <CamInput
                                class="form__container__element__input"
                                v-model="address.address"
                            />
                        </div>
                    </div>
                    <Alert style="margin-top: 16px" variant="negative" v-if="validAddressError">
                        {{ $t('edit_multisig.errors.invalid_addresses') }}
                    </Alert>
                    <div class="form__container__element__new-addresses">
                        <button @click.prevent="addAddress" class="circle plus-button">
                            <fa icon="plus"></fa>
                        </button>
                    </div>
                </div>
            </div>
            <div class="form__container" v-else-if="pendingOffer">
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.memo').toString() }}
                    </label>
                    <input
                        class="form__container__element__input"
                        placeholder="Memo"
                        v-model="pendingOffer.memo"
                        :disabled="true"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.offer_start') }}
                    </label>
                    <DateForm
                        class="form__container__element__date-picker"
                        :minDurationMs="minDuration"
                        :maxDurationMs="maxDuration"
                        :defaultDurationMs="defaultDuration"
                        @change_end="setStartDate"
                        :pendingTxDate="pendingOffer.start"
                    ></DateForm>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.offer_end') }}
                    </label>
                    <DateForm
                        class="form__container__element__date-picker"
                        :minDurationMs="minDuration"
                        :maxDurationMs="maxDuration"
                        :defaultDurationMs="maxDuration"
                        @change_end="setEndDate"
                        :pendingTxDate="pendingOffer.end"
                    ></DateForm>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.min_amount') }}
                    </label>
                    <AvaxInput
                        v-model="pendingOffer.minAmount"
                        :initial="pendingOffer.minAmount"
                        :readonly="true"
                        :camInput="true"
                    ></AvaxInput>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_amount') }}
                    </label>
                    <AvaxInput
                        v-model="pendingOffer.totalMaxAmount"
                        :initial="pendingOffer.totalMaxAmount"
                        :readonly="true"
                        :camInput="true"
                    ></AvaxInput>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.min_duration') }}
                    </label>
                    <input
                        :disabled="true"
                        class="form__container__element__input"
                        type="number"
                        v-model="pendingOffer.minDuration"
                        inputmode="numeric"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.max_duration') }}
                    </label>
                    <input
                        :disabled="true"
                        class="form__container__element__input"
                        type="number"
                        v-model="pendingOffer.maxDuration"
                        inputmode="numeric"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.unlock_duration') }}
                    </label>
                    <input
                        :disabled="true"
                        class="form__container__element__input"
                        type="number"
                        v-model="pendingOffer.unlockPeriodDuration"
                        inputmode="numeric"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.interrest_rate') }}
                    </label>
                    <input
                        class="form__container__element__input"
                        type="number"
                        :value="pendingOffer.interestRateNominator"
                        v-on:input="setInterestRate"
                        min="0"
                        inputmode="numeric"
                        :disabled="true"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.no_rewards_duration') }}
                    </label>
                    <input
                        :disabled="true"
                        class="form__container__element__input"
                        type="number"
                        v-model="pendingOffer.noRewardsPeriodDuration"
                        inputmode="numeric"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_reward_amount') }}
                    </label>
                    <AvaxInput
                        v-model="pendingOffer.totalMaxRewardAmount"
                        :initial="pendingOffer.totalMaxRewardAmount"
                        :readonly="true"
                        :camInput="true"
                    ></AvaxInput>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.flags') }}
                    </label>
                    <input
                        :disabled="true"
                        class="form__container__element__input"
                        type="number"
                        :value="pendingOffer.flags"
                        v-on:input="setFlags"
                        min="0"
                        inputmode="numeric"
                    />
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.owner_address') }}
                    </label>
                    <input
                        class="form__container__element__input"
                        type="text"
                        v-model="pendingOffer.ownerAddress"
                        :disabled="true"
                    />
                </div>

                <div v-if="!isMultisigWallet" class="form__container__element">
                    <label class="form__container__element__label">
                        Addresses allowed to deposit
                    </label>
                    <div
                        v-for="(address, index) in addresses"
                        :key="index"
                        class="form__container__element__addresses"
                    >
                        <!-- <div class="circle number">{{ index + 1 }}</div> -->
                        <input
                            :disabled="true"
                            class="form__container__element__input"
                            v-model="address.address"
                        />
                    </div>
                </div>
            </div>
            <div class="form__container__actions">
                <div class="actions__container">
                    <Alert v-if="hasExclusiveTotalMaxAmountOrReward" variant="negative">
                        can only use either TotalMaxAmount or TotalMaxRewardAmount
                    </Alert>
                    <Alert v-if="isMinDurationLessThanNoRewardsPeriod" variant="negative">
                        deposit offer minimum duration ({{ offer.minDuration }}) is less than
                        no-rewards period duration ({{ offer.noRewardsPeriodDuration }})
                    </Alert>
                </div>
                <template v-if="!pendingSendMultisigTX">
                    <div class="actions__container">
                        <Alert variant="warning">
                            Creating this depositOffer will incurr a fee of
                            {{ feeAmt }} {{ nativeAssetSymbol }}
                        </Alert>
                        <!-- <div class="actions__container__buttons">
                            <button
                                v-if="$listeners['selectOffer']"
                                :class="[
                                    'camino__primary--button',
                                    { 'camino--button--disabled': !formValid },
                                ]"
                                @click.prevent="submitCreateOffer"
                                :disabled="!formValid"
                            >
                                {{ $t('earn.rewards.create.submit') }}
                            </button>
                        </div> -->
                        <div class="actions__container__buttons">
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
                </template>
                <template v-else>
                    <div class="actions__container">
                        <Alert v-if="pendingSendMultisigTX" variant="info" style="margin-top: 16px">
                            {{
                                $t('earn.validate.pending_multisig.threshold', {
                                    value: sigValue,
                                    threshold: pendingSendMultisigTX?.tx.threshold,
                                })
                            }}
                        </Alert>
                        <Alert style="margin-top: 16px" v-if="SignStatus" variant="info">
                            {{ $t('earn.validate.pending_multisig.already_signed') }}
                        </Alert>
                        <div class="actions__container__buttons">
                            <button
                                class="camino__negative--button"
                                @click.prevent="openAbortModal"
                            >
                                {{ $t('transfer.multisig.abort_transaction') }}
                            </button>
                            <button
                                v-if="canExecuteMultisigTx"
                                :class="['camino__primary--button']"
                                @click.prevent="issueMultisigTx"
                            >
                                {{ $t('transfer.multisig.execute_transaction') }}
                            </button>
                            <button
                                v-else
                                :class="[
                                    'camino__primary--button',
                                    { 'camino--button--disabled': disableSignButton() },
                                ]"
                                @click.prevent="signMultisigTx"
                                :disabled="disableSignButton()"
                            >
                                {{ $t('transfer.multisig.sign_transaction') }}
                            </button>
                        </div>
                    </div>
                    <ModalAbortSigning
                        ref="modal_abort_signing"
                        :title="$t('transfer.multisig.abort_transaction')"
                        :modalText="$t('earn.rewards.abort_modal.message')"
                        @cancelTx="cancelMultisigTx"
                    />
                </template>
            </div>
        </form>
    </div>
</template>
<script lang="ts">
import Alert from '@/components/Alert.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { DAY_MS, ZeroBN } from '@/constants'
import { bnToBig, cleanAvaxBN, formatDuration } from '@/helpers/helper'
import { DepositOffer, WalletHelper } from '@/helpers/wallet_helper'
import AvaAsset from '@/js/AvaAsset'
import { WalletType } from '@/js/wallets/types'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DateForm from './DateForm.vue'

import { ava, bintools } from '@/AVA'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import ModalAbortSigning from '@/components/wallet/earn/ModalAbortSigning.vue'
import { isValidPChainAddress } from '@/helpers/address_helper'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { AddDepositOfferTx, Offer, UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'

const MAX_NAME_BYTE_SIZE = 64

@Component({
    components: {
        DateForm,
        AvaxInput,
        ModalAbortSigning,
        Alert,
        CamInput,
        CamBtn,
    },
})
export default class CreateOfferForm extends Vue {
    @Prop() isSuite!: boolean
    @Prop() maxDepositAmount!: BN

    addresses: { address: string }[] = [{ address: '' }]
    // @ts-ignore
    helpers = this.globalHelper()
    interestRateNominator = ZeroBN
    totalMaxRewardAmount = ZeroBN
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
    pendingOffer: any = null
    $refs!: {
        modal_abort_signing: ModalAbortSigning
    }
    @Watch('interestRateNominator')
    onInterestRateNominatorChange() {
        this.offer.interestRateNominator = new BN(this.interestRateNominator)
    }
    @Watch('totalMaxRewardAmount')
    onTotalMaxRewardAmountChange() {
        this.offer.totalMaxRewardAmount = new BN(this.totalMaxRewardAmount)
    }
    ownerAddressCheck() {
        if (!this.offer.ownerAddress) return ''
        return !isValidPChainAddress(this.offer.ownerAddress as string) ||
            this.offer.ownerAddress != this.wallet?.getStaticAddress('P')
            ? 'Invalid address'
            : ''
    }

    get hasExclusiveTotalMaxAmountOrReward() {
        const hasTotalMaxAmount =
            BN.isBN(this.offer.totalMaxAmount) && !this.offer.totalMaxAmount.isZero()
        const hasTotalMaxRewardAmount =
            BN.isBN(this.offer.totalMaxRewardAmount) && !this.offer.totalMaxRewardAmount.isZero()

        return hasTotalMaxAmount && hasTotalMaxRewardAmount
    }

    get isMinDurationLessThanNoRewardsPeriod() {
        return Number(this.offer.unlockPeriodDuration) < Number(this.offer.noRewardsPeriodDuration)
    }

    get nameLengthError() {
        const bytes = new TextEncoder().encode(this.offer.memo)
        return bytes.length > MAX_NAME_BYTE_SIZE || bytes.length === 0
    }
    get minAmountError() {
        if (/[a-zA-Z]/.test(this.offer.minAmount.toString())) return true
        return this.offer.minAmount.lt(new BN(1000000))
    }

    get maxAmountError() {
        if (/[a-zA-Z]/.test(this.offer.totalMaxAmount.toString())) return true
        return this.offer.totalMaxAmount.lt(this.offer.minAmount)
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

    get totalMaxRewardAmountError() {
        if (!BN.isBN(this.offer.totalMaxRewardAmount)) {
            try {
                this.offer.totalMaxRewardAmount = new BN(this.offer.totalMaxRewardAmount)
            } catch (e) {
                console.error('totalMaxRewardAmount is not a valid BN object:', e)
                return true
            }
        }

        if (/[a-zA-Z]/.test(this.offer.totalMaxRewardAmount.toString())) return true
        return this.offer.totalMaxRewardAmount.lt(ZeroBN)
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

    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
    }
    get sigValue() {
        return this.pendingSendMultisigTX?.tx.owners?.filter((owner) => !!owner.signature)?.length
    }
    get SignStatus(): boolean {
        let isSigned = false
        this.txOwners.forEach((owner) => {
            if (
                this.activeWallet.wallets.find((w) => w?.getAllAddressesP()?.[0] === owner.address)
            ) {
                if (owner.signature) isSigned = true
            }
        })
        return isSigned
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

    get isMultisigWallet(): boolean {
        return this.activeWallet instanceof MultisigWallet
    }

    get formValid(): boolean {
        if (
            this.nameLengthError ||
            this.minAmountError ||
            this.minDurationError ||
            this.maxDurationError ||
            this.unlockDurationError ||
            this.noRewardsPeriodDurationError ||
            this.hasExclusiveTotalMaxAmountOrReward ||
            this.isMinDurationLessThanNoRewardsPeriod
        )
            return false
        if (this.offer.start > this.offer.end) return false
        return true
    }
    get wallet(): WalletType {
        return this.$store.state.activeWallet
    }
    get pendingSendMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: SignavaultTx) =>
                item?.tx?.alias === this.wallet?.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'AddDepositOfferTx'
        )
    }
    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }
    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }
    async mounted() {
        await this.$store.dispatch('Signavault/updateTransaction')
    }
    @Watch('pendingSendMultisigTX')
    upd() {
        if (this.pendingSendMultisigTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingSendMultisigTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction() as AddDepositOfferTx
            let offer = utx.getDepositOffer() as Offer
            this.pendingOffer = {
                interestRateNominator: bintools
                    .fromBufferToBN(offer.getInterestRateNominator())
                    .toString(10),
                minAmount: bintools.fromBufferToBN(offer.getMinAmount()),
                totalMaxAmount: bintools.fromBufferToBN(offer.getTotalMaxAmount()),
                minDuration: Number(bnToBig(bintools.fromBufferToBN(offer.getMinDuration()))),
                maxDuration: Number(bnToBig(bintools.fromBufferToBN(offer.getMaxDuration()))),
                unlockPeriodDuration: Number(
                    bnToBig(bintools.fromBufferToBN(offer.getUnlockPeriodDuration()))
                ),
                noRewardsPeriodDuration: Number(
                    bnToBig(bintools.fromBufferToBN(offer.getNoRewardsPeriodDuration()))
                ),
                flags: bintools.fromBufferToBN(offer.getFlags()).toString(10),
                totalMaxRewardAmount: bintools.fromBufferToBN(offer.getTotalMaxRewardAmount()),
                memo: offer.getMemo().toString(),
                ownerAddress: bintools.addressToString(ava.getHRP(), 'P', offer.getOwnerAddress()),
                start: new Date(
                    Number(bnToBig(bintools.fromBufferToBN(offer.getStart()))) * 1000
                ).toISOString(),
                end: new Date(
                    Number(bnToBig(bintools.fromBufferToBN(offer.getEnd()))) * 1000
                ).toISOString(),
            }
            if (this.pendingOffer.ownerAddress === ava.PChain().addressFromBuffer(Buffer.alloc(20)))
                this.pendingOffer.ownerAddress = ''
        }
    }
    async submitCreateOffer(): Promise<void> {
        if (this.offer.ownerAddress === '') this.offer.ownerAddress = undefined
        const wallet: WalletType = this.$store.state.activeWallet
        try {
            const result = await WalletHelper.buildAddDepositOfferTx(wallet, this.offer)
            this.offer = {
                upgradeVersion: 1,
                id: '',
                interestRateNominator: ZeroBN,
                start: ZeroBN,
                end: ZeroBN,
                minAmount: new BN(1000000000),
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
            this.$store.dispatch('Platform/addAllowedAddresses', {
                depositOfferID: result,
                allowedAddresses: this.addresses,
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
    }
    get validAddressError(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')

        for (const addressObj of filledAddresses) {
            if (!isValidPChainAddress(addressObj.address)) return true
        }

        return false
    }
    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '' })
    }
    removeAddress(index: number): void {
        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) this.addAddress()
    }
    async updateMultisigTxDetails() {
        await this.$store.dispatch('Assets/updateUTXOs')
        await this.$store.dispatch('Signavault/updateTransaction')
    }
    async signMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.debug('MultiSigTx::sign: Invalid Tx')
        try {
            await wallet.addSignatures(this.pendingSendMultisigTX?.tx)
            this.helpers.dispatchNotification({
                message: 'Your signature saved successfully!',
                type: 'success',
            })
            this.$store.dispatch('Signavault/updateTransaction')
        } catch (e: any) {
            this.helpers.dispatchNotification({
                message: 'Your signature is not saved.',
                type: 'error',
            })
        }
    }
    async issueMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.log('MultiSigTx::sign: Invalid Tx')
        try {
            let txID = await wallet.issueExternal(this.pendingSendMultisigTX?.tx)
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('Signavault/updateTransaction').then(() => {
                this.$store.dispatch('updateBalances')
                this.helpers.dispatchNotification({
                    message: this.$t('notifications.transfer_success_msg'),
                    type: 'success',
                })
            })
            this.updateMultisigTxDetails()
        } catch (e: any) {
            this.helpers.dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error'),
                type: 'error',
            })
        }
    }
    get txOwners() {
        return this.pendingSendMultisigTX?.tx?.owners ?? []
    }
    disableSignButton(): boolean {
        let isSigned = false
        this.txOwners.forEach((owner) => {
            if (
                this.activeWallet.wallets.find((w) => w?.getAllAddressesP()?.[0] === owner.address)
            ) {
                if (owner.signature) isSigned = true
            }
        })
        return isSigned
    }
    get canExecuteMultisigTx(): boolean {
        let signers = 0
        let threshold = this.pendingSendMultisigTX?.tx?.threshold
        this.txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }
    async cancelMultisigTx() {
        try {
            const wallet = this.wallet as MultisigWallet
            if (this.pendingSendMultisigTX) {
                // cancel from the wallet
                await wallet.cancelExternal(this.pendingSendMultisigTX?.tx)
                this.helpers.dispatchNotification({
                    message: this.$t('transfer.multisig.transaction_aborted'),
                    type: 'success',
                })
                this.updateMultisigTxDetails()
            }
        } catch (err) {
            console.log(err)
            this.helpers.dispatchNotification({
                message: this.$t('transfer.multisig.cancel_transaction_failed'),
                type: 'error',
            })
        }
    }
    openAbortModal() {
        this.$refs.modal_abort_signing.open()
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
        if (ev && ev.target) {
            const interestRateValue = ev.target.value
            this.offer.interestRateNominator = new BN(interestRateValue)
        }
    }

    setTotalMaxRewardAmount(ev: any) {
        if (ev && ev.target) {
            const totalMaxRewardAmountValue = ev.target.value
            this.offer.totalMaxRewardAmount = new BN(totalMaxRewardAmountValue)
        }
    }

    setFlags(ev: any) {
        this.offer.flags = new BN(ev.target.value)
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.multisig_address {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.add-new-address {
    display: flex;
    align-items: center;
    gap: 1rem;
    &--button {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }
}
.actions__container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    &__buttons {
        display: flex;
        gap: 16px;
    }
}
.circle {
    border: var(--primary-border);
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 100%;
    border-width: 2px;
    padding: 10px;
}
input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--camino-slate-slate-600);
    &:disabled {
        border: 1px solid var(--camino-slate-slate-600) !important;
    }
}
.form__container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    color: var(--primary-color);

    &__element {
        width: 450px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1.25rem;
        align-self: stretch;
        &__label {
            color: var(--primary-color);
            font-family: 'Inter';
            font-size: 14px;
            font-style: normal;
            font-weight: 600;
            line-height: 20px;
        }
        &__input {
            width: 450px !important;
        }
        &__addresses {
            width: 100%;
        }
        &__new-addresses {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
    &__actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }
}
.cam-input {
    width: 100%;
}

.addresses_container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 1rem;
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

.number {
    width: 35px !important;
    height: 35px !important;
    cursor: default;
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
</style>
