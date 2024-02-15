<template>
    <div>
        <modal ref="modal" :title="title">
            <div class="modal__body">
                <div class="offer_row">
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
                </div>
                <template v-if="!isWhiteListing">
                    <div>
                        <form class="deposit_row">
                            <div class="deposit_inputs">
                                <div class="deposit_inputs__element">
                                    <label>Deposit duration</label>
                                    <DateForm
                                        v-if="!pendingDepositTX"
                                        @change_end="setEndDate"
                                        :maxEndDate="maxEndDate"
                                        :minDurationMs="minDuration"
                                        :maxDurationMs="maxDuration"
                                        :defaultDurationMs="maxDuration"
                                    ></DateForm>
                                    <span v-if="!pendingTxduration" class="deposit_duration">
                                        {{ formatDuration(duration) }}
                                    </span>
                                    <span v-else class="deposit_duration">
                                        {{ formatDuration(pendingTxduration) }}
                                    </span>
                                </div>
                                <!-- <span v-if="rewardOwner">{{ rewardOwner }}</span> -->
                                <!-- <div class="deposit_inputs__element">
                                    <label>Reward Owner</label>
                                    <CamInput
                                        :placeholder="`Rewrad Owner`"
                                        v-model="rewardOwner"
                                        class="reward-input"
                                        :error="rewardOwnerError"
                                        :errorMessage="rewardOwnerError"
                                        style="flex: 1"
                                    />
                                </div> -->
                                <div class="deposit_inputs__element">
                                    <label>Deposit Owner</label>
                                    <CamInput
                                        :placeholder="`Deposit Owner`"
                                        v-model="depositOwner"
                                        class="reward-input"
                                        :error="depositOwnerError"
                                        :errorMessage="depositOwnerError"
                                        style="flex: 1"
                                    />
                                </div>
                                <!-- <label style="margin-top: 16px">Deposit Owner</label>
                                <CamInput
                                    :placeholder="`Deposit Owner`"
                                    v-model="depositOwner"
                                    class="reward-input"
                                /> -->
                                <div class="deposit_inputs__element">
                                    <label>
                                        {{ $t('earn.rewards.active_earning.deposit_amount') }}
                                    </label>
                                    <AvaxInput
                                        v-if="pendingTxamount"
                                        :max="maxDepositAmount"
                                        v-model="amt"
                                        :initial="pendingTxamount * 1000000000"
                                        :readonly="pendingDepositTX"
                                    ></AvaxInput>
                                    <AvaxInput
                                        v-else
                                        :max="maxDepositAmount"
                                        v-model="amt"
                                    ></AvaxInput>
                                </div>
                                <Alert v-if="pendingDepositTX" variant="info">
                                    {{
                                        $t('earn.validate.pending_multisig.threshold', {
                                            value: sigValue,
                                            threshold: pendingDepositTX?.tx.threshold,
                                        })
                                    }}
                                </Alert>
                                <Alert v-if="SignStatus" variant="info">
                                    {{ $t('earn.validate.pending_multisig.already_signed') }}
                                </Alert>
                            </div>
                            <div class="submit_box">
                                <template v-if="pendingDepositTX">
                                    <div class="multi-sig__container">
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
                                                { 'camino--button--disabled': disableSignButton },
                                            ]"
                                            @click.prevent="signMultisigTx"
                                            :disabled="disableSignButton"
                                        >
                                            {{ $t('transfer.multisig.sign_transaction') }}
                                        </button>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="button--container">
                                        <button
                                            class="camino__negative--button"
                                            @click.prevent="cancelDeposit"
                                        >
                                            {{ $t('earn.validate.cancel') }}
                                        </button>
                                        <button
                                            v-if="$listeners['selectOffer']"
                                            :class="[
                                                'camino__primary--button',
                                                { 'camino--button--disabled': isDepositDisabled },
                                            ]"
                                            @click.prevent="submitDeposit"
                                            :disabled="isDepositDisabled"
                                        >
                                            {{ $t('earn.rewards.offer.deposit') }}
                                        </button>
                                    </div>
                                    <Alert variant="warning">
                                        Creating this depositOffer will incurr a fee of
                                        {{ feeAmt }} {{ nativeAssetSymbol }}
                                    </Alert>
                                </template>
                            </div>
                        </form>
                    </div>
                </template>
                <template v-else>
                    <div class="whitelisting__container">
                        <label style="margin-top: 16px">Add new addresses</label>
                        <div class="addresses_container input">
                            <div v-for="(address, index) in addresses" :key="index">
                                <div class="address_container">
                                    <button
                                        @click="removeAddress(index)"
                                        class="circle delete-button"
                                    >
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
                            <button @click.prevent="addAddress" class="circle plus-button">
                                <fa icon="plus"></fa>
                            </button>
                        </div>
                        <CamBtn class="button-submit" variant="primary" :onClick="addNewAddresses">
                            submit
                        </CamBtn>
                    </div>
                </template>
            </div>
        </modal>

        <ModalAbortSigning
            ref="modal_abort_signing"
            :title="$t('transfer.multisig.abort_transaction')"
            :modalText="$t('earn.rewards.abort_modal.message')"
            @cancelTx="cancelMultisigTx"
        />
    </div>
</template>
<script lang="ts">
import Alert from '@/components/Alert.vue'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { MINUTE_MS } from '@/constants'
import { cleanAvaxBN, formatDuration } from '@/helpers/helper'
import { WalletHelper } from '@/helpers/wallet_helper'
import AvaAsset from '@/js/AvaAsset'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { BN } from '@c4tplatform/caminojs'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { SignatureError, ZeroBN } from '@c4tplatform/caminojs/dist/common'
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Modal from '../../modals/Modal.vue'

import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'

import { ava, bintools } from '@/AVA'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import CamTooltip from '@/components/misc/CamTooltip.vue'
import ModalAbortSigning from '@/components/wallet/earn/ModalAbortSigning.vue'
import { isValidPChainAddress } from '@/helpers/address_helper'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { DepositTx, UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import DateForm from './DateForm.vue'

@Component({
    components: {
        Modal,
        DateForm,
        AvaxInput,
        ModalAbortSigning,
        Alert,
        CamInput,
        CamTooltip,
        CamBtn,
    },
})
export default class ModalDepositFunds extends Vue {
    @Prop() offer!: DepositOffer
    @Prop() title!: string
    @Prop() error!: boolean
    @Prop() warning!: boolean
    @Prop() isDepositDisabled!: boolean
    @Prop() maxDepositAmount!: BN
    @Prop() isWhiteListing?: boolean
    addresses: { address: string }[] = [{ address: '' }]
    // @ts-ignore
    helpers = this.globalHelper()
    amt: BN = ZeroBN
    ini: BN = new BN(5000000000)
    endDate: string = ''
    rewardOwner: string = ''
    depositOwner: string = ''
    rewardOwnerError: string = ''
    depositOwnerError: string = ''

    $refs!: {
        modal: Modal
        modal_abort_signing: ModalAbortSigning
    }

    @Watch('depositOwner')
    onDepositOwnerChange() {
        this.depositOwnerError = isValidPChainAddress(this.depositOwner) ? '' : 'Invalid address'
    }
    removeAddress(index: number): void {
        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) this.addAddress()
    }
    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '' })
    }
    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
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
    get pendingTxduration() {
        if (this.pendingDepositTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingDepositTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction() as DepositTx
            return parseInt(bintools.fromBufferToBN(utx.getDepositDuration()).toString())
        }
        return undefined
    }
    get pendingTxamount() {
        if (this.pendingDepositTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingDepositTX.tx?.unsignedTx, 'hex'))
            return WalletHelper.getTotalAmountFromUtxTest(unsignedTx)
        }
        return undefined
    }
    get txOwners() {
        return this.pendingDepositTX?.tx?.owners ?? []
    }
    // get rewardOwner() {
    //     if (this.pendingDepositTX) {
    //         let unsignedTx = new UnsignedTx()
    //         unsignedTx.fromBuffer(Buffer.from(this.pendingDepositTX.tx?.unsignedTx, 'hex'))
    //         const utx = unsignedTx.getTransaction() as DepositTx
    //         return bintools.addressToString(
    //             ava.getHRP(),
    //             'P',
    //             utx.getRewardsOwner().getAddresses()[0]
    //         )
    //     }
    //     return undefined
    // }
    get sigValue() {
        return this.pendingDepositTX?.tx.owners?.filter((owner) => !!owner.signature)?.length
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
    get canExecuteMultisigTx(): boolean {
        let signers = 0
        let threshold = this.pendingDepositTX?.tx?.threshold
        this.txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }
    get disableSignButton(): boolean {
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
    get maxEndDate() {
        return this.offer.end.toNumber() * 1000
    }

    get minDuration() {
        return this.offer.minDuration * 1000
    }

    get maxDuration() {
        return this.offer.maxDuration * 1000 - 15 * MINUTE_MS
    }
    get rewardPercent() {
        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (
            (this.offer.interestRateNominator.toNumber() * interestRateBase * 100) /
            interestRateDenominator
        )
    }
    get progressText(): string {
        const amt = this.amountLimit
        return amt.amount.isZero()
            ? 'No Limit'
            : this.progress + '(' + cleanAvaxBN(amt.amount) + this.nativeAssetSymbol + ')'
    }
    get amountLimit(): { nominator: BN; amount: BN } {
        return this.offer.upgradeVersion === 0 || !this.offer.totalMaxAmount.isZero()
            ? { nominator: this.offer.depositedAmount, amount: this.offer.totalMaxAmount }
            : { nominator: this.offer.rewardedAmount, amount: this.offer.totalMaxRewardAmount }
    }
    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }
    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get progress(): string {
        const amt = this.amountLimit
        return amt.amount.isZero()
            ? '0px'
            : amt.nominator.div(amt.amount).mul(new BN(100)).toString() + '%'
    }

    get duration() {
        const endDate = new Date(this.endDate).getTime()
        return Math.floor((endDate - Date.now()) / 1000)
    }

    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }
    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }
    async addNewAddresses(): Promise<void> {
        try {
            let result = await this.$store.dispatch('Platform/addAllowedAddresses', {
                depositOfferID: this.offer.id,
                allowedAddresses: this.addresses,
                timestamp: this.offer.start.toNumber(),
            })
            this.helpers.dispatchNotification({
                message: `success`,
                type: 'success',
            })
        } catch (e) {
            this.helpers.dispatchNotification({
                message: `Duplicate entry`,
                type: 'error',
            })
        }
    }
    async submitDeposit(): Promise<void> {
        if (this.depositOwner && !isValidPChainAddress(this.depositOwner)) {
            this.depositOwnerError = 'Invalid address'
            return
        } else this.depositOwnerError = ''
        const wallet: WalletType = this.$store.state.activeWallet
        try {
            const result = await WalletHelper.buildDepositTx(
                wallet,
                this.offer.id,
                this.duration,
                this.amt,
                this.$store.getters['Platform/isDepositOfferRestricted'](this.offer.id),
                this.offer.ownerAddress,
                this.depositOwner,
                this.rewardOwner
            )
            let { dispatchNotification } = this.helpers
            await this.$store.dispatch('Assets/updateUTXOs')
            await this.$store.dispatch('Platform/update')
            dispatchNotification({
                message: `Deposit Successful (TX: ${result})`,
                type: 'success',
            })
            if (!(wallet instanceof MultisigWallet)) this.cancelDeposit()
        } catch (error) {
            if (error instanceof SignatureError) {
                this.$store.dispatch('Assets/updateUTXOs')
                this.$store.dispatch('Signavault/updateTransaction').then(() => {
                    this.$store.dispatch('updateBalances')
                    this.helpers.dispatchNotification({
                        message: this.$t('notifications.transfer_success_msg'),
                        type: 'success',
                    })
                })
            } else {
                let err = error as Error
                this.helpers.dispatchNotification({
                    message: err.message,
                    type: 'error',
                })
            }
        }
    }
    async signMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingDepositTX) return console.debug('MultiSigTx::sign: Invalid Tx')
        try {
            await wallet.addSignatures(this.pendingDepositTX?.tx)
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
        if (!this.pendingDepositTX) return console.log('MultiSigTx::sign: Invalid Tx')
        try {
            let txID = await wallet.issueExternal(this.pendingDepositTX?.tx)
            let { dispatchNotification } = this.helpers
            await this.$store.dispatch('Assets/updateUTXOs')
            await this.$store.dispatch('Platform/update')
            dispatchNotification({
                message: `Deposit Successful (TX: ${txID})`,
                type: 'success',
            })
            await this.$store.dispatch('Signavault/updateTransaction')
            this.cancelDeposit()
        } catch (e: any) {
            this.helpers.dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error'),
                type: 'error',
            })
        }
    }
    async cancelMultisigTx() {
        try {
            const wallet = this.activeWallet as MultisigWallet
            if (this.pendingDepositTX) {
                await wallet.cancelExternal(this.pendingDepositTX?.tx)
                this.helpers.dispatchNotification({
                    message: this.$t('transfer.multisig.transaction_aborted'),
                    type: 'success',
                })
                await this.$store.dispatch('Assets/updateUTXOs')
                await this.$store.dispatch('Signavault/updateTransaction')
                this.cancelDeposit()
            }
        } catch (err) {
            this.helpers.dispatchNotification({
                message: this.$t('transfer.multisig.cancel_transaction_failed'),
                type: 'error',
            })
        }
    }
    cancelDeposit() {
        this.$emit('closeDepositFundsModal')
        this.depositOwner = ''
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
    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }
    close() {
        this.$refs.modal.close()
    }

    open() {
        this.$refs.modal.open()
    }
    setEndDate(val: string) {
        this.endDate = val
    }
    openAbortModal() {
        this.$refs.modal_abort_signing.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.reward-input {
    height: 35px !important;
    width: 100%;
    input {
        width: 100%;
        padding: 6px 10px !important;
        border-radius: 6px !important;
        height: 35px !important;
    }
}
.modal__body {
    padding: 30px 22px;
    text-align: center;
    width: 600px;
    overflow-x: hidden;
}
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
    gap: 16px;
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
    .offer_detail_left,
    .offer_detail_right {
        div {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
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

.deposit_row {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    margin-top: 16px;
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
    &__element {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: baseline;
    }
    span {
        text-align: start;
        width: 100%;
    }
    gap: 16px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: start;
}

.deposit_duration {
    font-size: 13px;
    padding-right: 12px;
    float: right;
}
.multi-sig__container {
    display: flex;
    flex-direction: row;
    gap: 16px;
}
.submit_box {
    margin-top: auto;
    margin-left: auto;
    display: flex;
    gap: 16px;
    flex-direction: column;
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

.whitelisting__container {
    display: flex;
    flex-direction: column;
    align-items: start;
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
.input {
    width: 100%;
}
.button-submit {
    align-self: flex-end;
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
    width: 40px !important;
    height: 40px !important;
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
