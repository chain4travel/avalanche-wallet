<template>
    <div class="create-offer__container">
        <div v-if="!pendingCreateOfferMultisigTX" class="create-offer__container__form">
            <div class="create-offer__container__form__element full-width">
                <div>
                    <label>{{ $t('earn.rewards.create.memo').toString() }}</label>
                    <cam-tooltip :content="$t('earn.rewards.descriptions.title')" placement="right">
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <cam-input
                    class="input"
                    v-model="offer.memo"
                    :placeholder="$t('earn.rewards.create.memo')"
                    :error="nameLengthError"
                    :errorMessage="$t('earn.rewards.errors.title')"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.offer_start') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.offer_start')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="defaultDuration"
                    @change_end="setStartDate"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.offer_end') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.offer_end')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="maxDuration"
                    @change_end="setEndDate"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.min_amount') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.min_amount')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <AvaxInput
                    class="input"
                    v-model="offer.minAmount"
                    :initial="offer.minAmount"
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
            <v-tabs
                class="create-offer__container__form__element tabs"
                height="38"
                :grow="true"
                :show-arrows="false"
                :centered="true"
                v-model="selectedTab"
                :mobile-breakpoint="900"
            >
                <v-tab key="max_amount">Max Amount</v-tab>
                <v-tab key="interest">Interest</v-tab>
                <v-tab-item>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.total_max_amount') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.max_amount')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <AvaxInput
                            ref="totalMaxAmount"
                            class="input"
                            v-model="offer.totalMaxAmount"
                            :initial="offer.totalMaxAmount"
                            :camInput="true"
                        ></AvaxInput>
                    </div>
                </v-tab-item>
                <v-tab-item>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.interrest_rate') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.interest_rate')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <CamInput
                            class="input"
                            v-model="interestRateNominator"
                            v-on:input="setInterestRate"
                            :placeholder="`interestRateNominator`"
                        />
                    </div>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.total_max_reward_amount') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.total_max_reward_amount')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <AvaxInput
                            ref="totalMaxAmount"
                            class="input"
                            v-model="totalMaxRewardAmount"
                            :camInput="true"
                            :readonly="sunrisePhase === 0"
                        ></AvaxInput>
                    </div>
                </v-tab-item>
            </v-tabs>

            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.min_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.minimum_duration')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput class="input" :placeholder="`minDuration`" v-model="offer.minDuration" />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.max_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.maximum_duration')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput class="input" :placeholder="`maxDuration`" v-model="offer.maxDuration" />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    {{ $t('earn.rewards.create.vesting_period') }}
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.vesting_period')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    v-model="offer.unlockPeriodDuration"
                    :placeholder="`unlockPeriodDuration`"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.no_rewards_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.period_without_rewards')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    v-model="offer.noRewardsPeriodDuration"
                    :placeholder="`noRewardsPeriodDuration`"
                />
            </div>

            <!-- <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.flags') }}
                    </label>

                </div>
                <input
                    class="input"
                    type="number"
                    :value="offer.flags.toString(10)"
                    v-on:input="setFlags"
                    min="0"
                    inputmode="numeric"
                />
            </div> -->
            <div v-if="!isMultisigWallet" class="create-offer__container__form__element full-width">
                <div class="restricted__container">
                    <v-checkbox
                        label="Restricted"
                        v-model="isRestricted"
                        class="checkbox"
                    ></v-checkbox>
                    <cam-tooltip
                        class="restricted__container__description"
                        :content="$t('earn.rewards.descriptions.restricted')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <template v-if="isRestricted">
                    <label style="margin-top: 16px">Addresses allowed to deposit</label>
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
                                <CamInput class="input" v-model="address.address" />
                            </div>
                        </div>
                    </div>
                    <button @click.prevent="addAddress" class="circle plus-button">
                        <fa icon="plus"></fa>
                    </button>
                </template>
            </div>
        </div>
        <div v-else class="create-offer__container__form">
            <div class="create-offer__container__form__element full-width">
                <div>
                    <label>{{ $t('earn.rewards.create.memo').toString() }}</label>
                    <cam-tooltip :content="$t('earn.rewards.descriptions.title')" placement="right">
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <cam-input
                    class="input"
                    v-model="pendingOffer.memo"
                    :placeholder="$t('earn.rewards.create.memo')"
                    :disabled="true"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.offer_start') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.offer_start')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="defaultDuration"
                    @change_end="setStartDate"
                    :pendingTxDate="pendingOffer.start"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.offer_end') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.offer_end')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <DateForm
                    class="input"
                    :minDurationMs="minDuration"
                    :maxDurationMs="maxDuration"
                    :defaultDurationMs="maxDuration"
                    @change_end="setEndDate"
                    :pendingTxDate="pendingOffer.end"
                ></DateForm>
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>{{ $t('earn.rewards.create.min_amount') }}</label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.min_amount')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    v-model="pendingOffer.minAmount"
                    :disabled="true"
                ></CamInput>
            </div>
            <v-tabs
                class="create-offer__container__form__element tabs"
                height="38"
                :grow="true"
                :show-arrows="false"
                :centered="true"
                v-model="selectedTab"
                :mobile-breakpoint="900"
                :disabled="true"
                :aria-disabled="true"
            >
                <v-tab :disabled="true" key="max_amount">Max Amount</v-tab>
                <v-tab :disabled="true" key="interest">Interest</v-tab>
                <v-tab-item>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.total_max_amount') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.max_amount')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <CamInput
                            class="input"
                            v-model="pendingOffer.totalMaxAmount"
                            :disabled="true"
                        ></CamInput>
                    </div>
                </v-tab-item>
                <v-tab-item>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.interrest_rate') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.interest_rate')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <CamInput
                            class="input"
                            v-model="pendingOffer.interestRateNominator"
                            :placeholder="`interestRateNominator`"
                            :disabled="true"
                        />
                    </div>
                    <div class="create-offer__container__form__element">
                        <div>
                            <label>
                                {{ $t('earn.rewards.create.total_max_reward_amount') }}
                            </label>
                            <cam-tooltip
                                :content="$t('earn.rewards.descriptions.total_max_reward_amount')"
                                placement="right"
                            >
                                <fa icon="question-circle"></fa>
                            </cam-tooltip>
                        </div>
                        <CamInput
                            class="input"
                            v-model="pendingOffer.totalMaxRewardAmount"
                            :placeholder="`totalMaxRewardAmount`"
                            :disabled="true"
                        ></CamInput>
                    </div>
                </v-tab-item>
            </v-tabs>
            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.min_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.minimum_duration')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    :placeholder="`minDuration`"
                    :disabled="true"
                    v-model="pendingOffer.minDuration"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.max_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.maximum_duration')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    :placeholder="`maxDuration`"
                    v-model="pendingOffer.maxDuration"
                    :disabled="true"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    {{ $t('earn.rewards.create.vesting_period') }}
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.vesting_period')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    v-model="pendingOffer.unlockPeriodDuration"
                    :placeholder="`unlockPeriodDuration`"
                    :disabled="true"
                />
            </div>
            <div class="create-offer__container__form__element">
                <div>
                    <label>
                        {{ $t('earn.rewards.create.no_rewards_duration') }}
                    </label>
                    <cam-tooltip
                        :content="$t('earn.rewards.descriptions.period_without_rewards')"
                        placement="right"
                    >
                        <fa icon="question-circle"></fa>
                    </cam-tooltip>
                </div>
                <CamInput
                    class="input"
                    v-model="pendingOffer.noRewardsPeriodDuration"
                    :placeholder="`noRewardsPeriodDuration`"
                    :disabled="true"
                />
            </div>
        </div>
        <div class="create-offer__container__actions">
            <div class="create-offer__container__actions__aletrs">
                <template v-if="pendingCreateOfferMultisigTX">
                    <Alert variant="info">
                        {{
                            $t('earn.validate.pending_multisig.threshold', {
                                value: sigValue,
                                threshold: pendingCreateOfferMultisigTX?.tx.threshold,
                            })
                        }}
                    </Alert>
                    <Alert v-if="SignStatus" variant="info">
                        {{ $t('earn.validate.pending_multisig.already_signed') }}
                    </Alert>
                </template>
                <Alert style="margin-top: 16px" variant="negative" v-if="validAddressError">
                    {{ $t('edit_multisig.errors.invalid_addresses') }}
                </Alert>
                <Alert v-if="hasExclusiveTotalMaxAmountOrReward" variant="negative">
                    {{ $t('earn.rewards.errors.has_exclusive_total_max_amount_or_reward') }}
                </Alert>
                <Alert v-if="isMaxRewardAmountAndInterestRateIsZero" variant="negative">
                    {{ $t('earn.rewards.errors.is_max_reward_amount_and_interest_rate_is_zero') }}
                </Alert>
                <Alert v-if="isMinDurationLessThanNoRewardsPeriod" variant="negative">
                    {{
                        $t('earn.rewards.errors.is_min_duration_less_than_no_rewards_period', {
                            minDuration: offer.minDuration,
                            noRewardsPeriodDuration: offer.noRewardsPeriodDuration,
                        })
                    }}
                </Alert>

                <Alert v-if="isMinDurationLessThanUnlockPeriod" variant="negative">
                    {{
                        $t('earn.rewards.errors.is_min_duration_less_than_unlock_period', {
                            minDuration: offer.minDuration,
                            unlockPeriodDuration: offer.unlockPeriodDuration,
                        })
                    }}
                </Alert>
                <Alert v-if="isMaxDirationLessThanMinDuration" variant="negative">
                    {{
                        $t('earn.rewards.errors.is_max_diration_less_than_min_duration', {
                            minDuration: offer.minDuration,
                            maxDuration: offer.maxDuration,
                        })
                    }}
                </Alert>
                <Alert v-if="isMinDurationEqualtoZero" variant="negative">
                    {{ $t('earn.rewards.errors.is_min_duration_equal_to_zero') }}
                </Alert>
                <Alert v-if="isStartDateGreaterThanEndDate" variant="negative">
                    {{ $t('earn.rewards.errors.is_start_date_greater_than_end_date') }}
                </Alert>
                <Alert variant="warning">
                    Creating this depositOffer will incurr a fee of
                    {{ feeAmt }} {{ nativeAssetSymbol }}
                </Alert>
            </div>
            <div class="create-offer__container__actions__buttons">
                <template v-if="!pendingCreateOfferMultisigTX">
                    <CamBtn
                        v-if="$listeners['selectOffer']"
                        variant="primary"
                        @click.prevent="submitCreateOffer"
                        :disabled="!formValid"
                    >
                        {{ $t('earn.rewards.create.submit') }}
                    </CamBtn>
                </template>
                <template v-else>
                    <CamBtn variant="negative" :onClick="openAbortModal">
                        {{ $t('transfer.multisig.abort_transaction') }}
                    </CamBtn>
                    <CamBtn
                        v-if="canExecuteMultisigTx"
                        variant="primary"
                        :onClick="issueMultisigTx"
                    >
                        {{ $t('transfer.multisig.execute_transaction') }}
                    </CamBtn>
                    <CamBtn
                        v-else
                        variant="primary"
                        :onClick="signMultisigTx"
                        :disabled="disableSignButton()"
                    >
                        {{ $t('transfer.multisig.sign_transaction') }}
                    </CamBtn>
                    <ModalAbortSigning
                        ref="modal_abort_signing"
                        :title="$t('transfer.multisig.abort_transaction')"
                        :modalText="$t('earn.rewards.abort_modal.message')"
                        @cancelTx="cancelMultisigTx"
                    />
                </template>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { ava, bintools } from '@/AVA'
import Alert from '@/components/Alert.vue'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { DAY_MS, ZeroBN } from '@/constants'
import { isValidPChainAddress } from '@/helpers/address_helper'
import { bnToBig } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'
import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import {
    AddDepositOfferTx,
    DepositOffer,
    Offer,
    UnsignedTx,
} from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

const MAX_TITLE_BYTE_SIZE = 256

import CamTooltip from '@/components/misc/CamTooltip.vue'
import ModalAbortSigning from '@/components/wallet/earn/ModalAbortSigning.vue'
import { WalletHelper } from '@/helpers/wallet_helper'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'
import DateForm from './DateForm.vue'

@Component({
    components: { CamInput, CamBtn, Alert, DateForm, AvaxInput, ModalAbortSigning, CamTooltip },
})
export default class CreateOfferForm extends Vue {
    @Prop() maxDepositAmount!: BN
    interestRateNominator = ZeroBN
    totalMaxRewardAmount = ZeroBN
    isRestricted = false
    pendingOffer: any = { memo: '' }
    selectedTab: number = 0
    // @ts-ignore
    helpers = this.globalHelper()
    addresses: { address: string }[] = [{ address: '' }]
    offer: DepositOffer | any = {
        upgradeVersion: 1,
        id: '',
        interestRateNominator: ZeroBN,
        start: ZeroBN,
        end: ZeroBN,
        minAmount: new BN(1000000),
        totalMaxAmount: ZeroBN,
        depositedAmount: ZeroBN,
        minDuration: 1,
        maxDuration: 2,
        unlockPeriodDuration: 0,
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
        return bytes.length > MAX_TITLE_BYTE_SIZE
    }
    get minAmountError() {
        return this.offer.minAmount.lt(new BN(1000000))
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
    get isMaxRewardAmountAndInterestRateIsZero() {
        const interestRateNominator = new BN(this.interestRateNominator)
        const totalMaxRewardAmount = new BN(this.totalMaxRewardAmount)
        if (interestRateNominator.isZero() && !totalMaxRewardAmount.isZero()) return true
        else if (!interestRateNominator.isZero() && totalMaxRewardAmount.isZero()) return true
        return false
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

    get validAddressError(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')

        for (const addressObj of filledAddresses) {
            if (!isValidPChainAddress(addressObj.address)) return true
        }

        return false
    }
    /* validation */
    get formValid(): boolean {
        if (
            this.offer.start > this.offer.end ||
            this.hasExclusiveTotalMaxAmountOrReward ||
            this.isMaxRewardAmountAndInterestRateIsZero ||
            this.isMinDurationLessThanNoRewardsPeriod ||
            this.isMinDurationLessThanUnlockPeriod ||
            this.isMaxDirationLessThanMinDuration ||
            this.isMinDurationEqualtoZero ||
            this.isStartDateGreaterThanEndDate ||
            this.minAmountError
        )
            return false
        return true
    }

    /* methods */
    async submitCreateOffer() {
        if (!this.isRestricted) this.offer.ownerAddress = undefined
        else this.offer.ownerAddress = this.wallet?.getStaticAddress('P')
        const wallet: WalletType = this.$store.state.activeWallet
        let offer = {
            ...this.offer,
            minDuration: this.offer.minDuration * 24 * 60 * 60,
            maxDuration: this.offer.maxDuration * 24 * 60 * 60,
            unlockPeriodDuration: this.offer.unlockPeriodDuration * 24 * 60 * 60,
            noRewardsPeriodDuration: this.offer.noRewardsPeriodDuration * 24 * 60 * 60,
            interestRateNominator: new BN(this.offer.interestRateNominator * 10000),
        }
        let addresses = this.addresses.filter((a) => a.address !== '')
        try {
            const result = await WalletHelper.buildAddDepositOfferTx(wallet, offer)
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
    }
    async updateMultisigTxDetails() {
        await this.$store.dispatch('Assets/updateUTXOs')
        await this.$store.dispatch('Signavault/updateTransaction')
    }
    async signMultisigTx() {
        if (!this.wallet || !(this.wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingCreateOfferMultisigTX) return console.debug('MultiSigTx::sign: Invalid Tx')
        try {
            await this.wallet.addSignatures(this.pendingCreateOfferMultisigTX?.tx)
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
        if (!this.wallet || !(this.wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingCreateOfferMultisigTX) return console.log('MultiSigTx::sign: Invalid Tx')
        try {
            let txID = await this.wallet.issueExternal(this.pendingCreateOfferMultisigTX?.tx)
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('Signavault/updateTransaction').then(() => {
                this.$store.dispatch('updateBalances')
                this.helpers.dispatchNotification({
                    message: `Create Offer Successful (TX: ${txID})`,
                    type: 'success',
                })
            })
            this.updateMultisigTxDetails()
        } catch (e: any) {
            let err = e as Error
            this.helpers.dispatchNotification({
                message: err.message,
                type: 'error',
            })
        }
    }
    async cancelMultisigTx() {
        try {
            const wallet = this.wallet as MultisigWallet
            if (this.pendingCreateOfferMultisigTX) {
                // cancel from the wallet
                await wallet.cancelExternal(this.pendingCreateOfferMultisigTX?.tx)
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
    disableSignButton(): boolean {
        let isSigned = false
        const wallet = this.wallet as MultisigWallet
        this.txOwners.forEach((owner) => {
            if (wallet.wallets.find((w) => w?.getAllAddressesP()?.[0] === owner.address)) {
                if (owner.signature) isSigned = true
            }
        })
        return isSigned
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
            this.offer.interestRateNominator = interestRateValue
        }
    }
    setFlags(ev: any) {
        this.offer.flags = new BN(ev.target.value)
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
    get pendingCreateOfferMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: SignavaultTx) =>
                item?.tx?.alias === this.wallet?.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'AddDepositOfferTx'
        )
    }
    get canExecuteMultisigTx(): boolean {
        let signers = 0
        let threshold = this.pendingCreateOfferMultisigTX?.tx?.threshold
        this.txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }
    get txOwners() {
        return this.pendingCreateOfferMultisigTX?.tx?.owners ?? []
    }
    get sigValue() {
        return this.pendingCreateOfferMultisigTX?.tx.owners?.filter((owner) => !!owner.signature)
            ?.length
    }
    get SignStatus(): boolean {
        let isSigned = false
        this.txOwners.forEach((owner) => {
            if (
                (this.wallet as MultisigWallet).wallets.find(
                    (w) => w?.getAllAddressesP()?.[0] === owner.address
                )
            ) {
                if (owner.signature) isSigned = true
            }
        })
        return isSigned
    }
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
    async mounted() {
        await this.$store.dispatch('Signavault/updateTransaction')
    }
    /* watchers */
    @Watch('interestRateNominator')
    onInterestRateNominatorChange() {
        this.offer.interestRateNominator = this.interestRateNominator
    }
    @Watch('totalMaxRewardAmount')
    onTotalMaxRewardAmountChange() {
        this.offer.totalMaxRewardAmount = new BN(this.totalMaxRewardAmount)
    }
    @Watch('selectedTab')
    onSelectedTabChange() {
        if (this.selectedTab === 0) {
            this.interestRateNominator = ZeroBN
            this.totalMaxRewardAmount = ZeroBN
        } else {
            this.$refs.totalMaxAmount?.reset()
        }
    }
    @Watch('pendingCreateOfferMultisigTX')
    getPandingCreateOfferTxData() {
        if (this.pendingCreateOfferMultisigTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(
                Buffer.from(this.pendingCreateOfferMultisigTX.tx?.unsignedTx, 'hex')
            )
            const utx = unsignedTx.getTransaction() as AddDepositOfferTx
            let offer = utx.getDepositOffer() as Offer
            this.pendingOffer = {
                interestRateNominator: bintools
                    .fromBufferToBN(offer.getInterestRateNominator())
                    .div(new BN(10000))
                    .toString(10),
                minAmount: bnToBig(bintools.fromBufferToBN(offer.getMinAmount()), 9).toString(),
                totalMaxAmount: bnToBig(
                    bintools.fromBufferToBN(offer.getTotalMaxAmount()),
                    9
                ).toString(),
                minDuration:
                    Number(bnToBig(bintools.fromBufferToBN(offer.getMinDuration()))) /
                    (24 * 60 * 60),
                maxDuration:
                    Number(bnToBig(bintools.fromBufferToBN(offer.getMaxDuration()))) /
                    (24 * 60 * 60),
                unlockPeriodDuration:
                    Number(bnToBig(bintools.fromBufferToBN(offer.getUnlockPeriodDuration()))) /
                    (24 * 60 * 60),
                noRewardsPeriodDuration:
                    Number(bnToBig(bintools.fromBufferToBN(offer.getNoRewardsPeriodDuration()))) /
                    (24 * 60 * 60),
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
            this.selectedTab = this.pendingOffer.totalMaxAmount === '0' ? 1 : 0
            if (this.pendingOffer.ownerAddress === ava.PChain().addressFromBuffer(Buffer.alloc(20)))
                this.pendingOffer.ownerAddress = ''
        }
    }
    /* refs */
    $refs!: {
        modal_abort_signing: ModalAbortSigning
        totalMaxAmount: AvaxInput
    }
    /* utiils */
    clearOffer() {
        this.offer = {
            ...this.offer,
            interestRateNominator: ZeroBN,
            minAmount: new BN(1000000),
            totalMaxAmount: ZeroBN,
            depositedAmount: ZeroBN,
            minDuration: 1,
            maxDuration: 2,
            unlockPeriodDuration: 0,
            noRewardsPeriodDuration: 0,
            memo: '',
            flags: ZeroBN,
            totalMaxRewardAmount: ZeroBN,
            rewardedAmount: ZeroBN,
            ownerAddress: '',
        }
        this.setInterestRate({ target: { value: 0 } })
        this.setFlags({ target: { value: 0 } })
    }
}
</script>
<style lang="scss">
.v-input--checkbox {
    .v-input__control {
        .v-input__slot {
            margin-bottom: 0 !important;
        }
        .v-messages {
            display: none !important;
        }
        .v-input--selection-controls__input {
            margin-right: 8px !important;
        }
    }
}
.tabs {
    width: 100%;
    .v-item-group,
    .v-slide-group,
    .v-tabs-bar {
        width: 100%;
    }
    .v-window-item {
        display: flex;
        gap: 16px;
        margin-top: 16px;
        &--active {
            display: flex;
            flex-wrap: wrap;
        }
    }
    .v-window {
        overflow: visible;
    }
}
</style>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.create-offer__container {
    width: 50%;
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
            label {
                margin-right: 4px;
            }
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
        .full-width,
        .tabs {
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
            display: flex;
            gap: 16px;
        }
    }
    .addresses_container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 16px 0;
    }
    .address_container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
    }
    .restricted__container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
        &__description {
            margin: 7px 0 0 4px;
        }
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
@include mixins.mobile-device {
    .create-offer__container {
        width: 100% !important;
    }
}
</style>
