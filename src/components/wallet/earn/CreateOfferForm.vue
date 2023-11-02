<template>
    <div>
        <form class="form__container">
            <div class="form__container" v-if="!pendingSendMultisigTX">
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.memo').toString() }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`Memo`"
                        v-model="offer.memo"
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
                        :camInput="true"
                    ></AvaxInput>
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_amount') }}
                    </label>
                    <AvaxInput v-model="offer.totalMaxAmount" :camInput="true"></AvaxInput>
                </div>

                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.min_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`minDuration`"
                        v-model.number="offer.minDuration"
                    />
                    <!-- <input
                        class="form__container__element__input"
                        type="number"
                        v-model="offer.minDuration"
                        inputmode="numeric"
                    /> -->
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.max_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`maxDuration`"
                        v-model.number="offer.maxDuration"
                    />
                    <!-- <input
                        class="form__container__element__input"
                        type="number"
                        v-model="offer.maxDuration"
                        inputmode="numeric"
                    /> -->
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.unlock_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`unlockPeriodDuration`"
                        v-model.number="offer.unlockPeriodDuration"
                    />
                    <!-- <input
                        class="form__container__element__input"
                        type="number"
                        v-model="offer.unlockPeriodDuration"
                        inputmode="numeric"
                    /> -->
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.interrest_rate') }}
                    </label>
                    <input
                        class="form__container__element__input"
                        type="number"
                        :value="offer.interestRateNominator.toString(10)"
                        v-on:input="setInterestRate"
                        min="0"
                        inputmode="numeric"
                    />
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.no_rewards_duration') }}
                    </label>
                    <CamInput
                        class="form__container__element__input"
                        :placeholder="`noRewardsPeriodDuration`"
                        v-model.number="offer.noRewardsPeriodDuration"
                    />
                    <!-- <input
                        class="form__container__element__input"
                        type="number"
                        v-model="offer.noRewardsPeriodDuration"
                        inputmode="numeric"
                    /> -->
                </div>
                <div class="form__container__element">
                    <label class="form__container__element__label">
                        {{ $t('earn.rewards.create.total_max_reward_amount') }}
                    </label>
                    <AvaxInput
                        v-model="offer.totalMaxRewardAmount"
                        :readonly="sunrisePhase === 0"
                        :camInput="true"
                    ></AvaxInput>
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
                        <!-- <div class="circle number">{{ index + 1 }}</div> -->
                        <input
                            class="form__container__element__input"
                            v-model="address.address"
                            style="margin-bottom: 8px"
                        />
                    </div>
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
                <template v-if="!pendingSendMultisigTX">
                    <div class="actions__container">
                        <div class="actions__container__buttons">
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
                        </div>
                        <Alert variant="warning">
                            Creating this depositOffer will incurr a fee of
                            {{ feeAmt }} {{ nativeAssetSymbol }}
                        </Alert>
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
import CamInput from '@/components/CamInput.vue'
import ModalAbortSigning from '@/components/wallet/earn/ModalAbortSigning.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { AddDepositOfferTx, Offer, UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
@Component({
    components: {
        DateForm,
        AvaxInput,
        ModalAbortSigning,
        Alert,
        CamInput,
    },
})
export default class CreateOfferForm extends Vue {
    @Prop() isSuite!: boolean
    addresses: { address: string }[] = [{ address: '' }]
    helpers = this.globalHelper()
    offer: DepositOffer = {
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
    pendingOffer: any = null
    $refs!: {
        modal_abort_signing: ModalAbortSigning
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
        if (this.offer.minDuration > this.offer.maxDuration) return false
        if (this.offer.maxDuration <= 0) return false
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
    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '' })
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
        this.offer.interestRateNominator = new BN(ev.target.value)
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
        gap: 4px;
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
</style>
