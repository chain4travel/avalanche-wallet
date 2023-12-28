<template>
    <div class="offer_row">
        <h3 class="offer_title">{{ rewardTitle }}</h3>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposit_start') }}:</label>
                    <p class="reward">{{ startDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposit_end') }}:</label>
                    <p class="reward">{{ endDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.min_deposit') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(minLock) }} CAM</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.offer.reward') }}:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.deposited_amount') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.deposit.amount) }} {{ nativeAssetSymbol }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.pending_reward') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.amountToClaim) }} {{ nativeAssetSymbol }}
                    </p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.already_claimed') }}:</label>
                    <p class="reward">
                        {{ cleanAvaxBN(reward.deposit.claimedRewardAmount) }}
                        {{ nativeAssetSymbol }}
                    </p>
                </div>
            </div>
        </div>
        <div v-if="!isMultiSig" class="button_group">
            <CamBtn variant="primary" @click="openModal" :disabled="isClaimDisabled">
                {{ $t('earn.rewards.active_earning.claim') }}
            </CamBtn>
        </div>
        <template v-else>
            <div v-if="signatureStatus(reward.deposit.depositTxID) === 2" class="button_group">
                <CamBtn variant="primary" @click="openModal" :disabled="isClaimDisabled">
                    {{ $t('earn.rewards.active_earning.execute_claim') }}
                </CamBtn>
                <CamBtn variant="negative" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </CamBtn>
            </div>
            <div
                v-else-if="signatureStatus(reward.deposit.depositTxID) === -1 && disclamer"
                class="button_group"
            >
                <CamBtn variant="primary" @click="openModal" :disabled="isClaimDisabled">
                    {{ $t('earn.rewards.active_earning.initiate_transaction') }}
                </CamBtn>
                <CamBtn variant="transparent" @click="disclamer = false">
                    {{ $t('earn.rewards.active_earning.cancel') }}
                </CamBtn>
            </div>
            <div
                v-else-if="
                    signatureStatus(reward.deposit.depositTxID) === 1 &&
                    !alreadySigned(reward.deposit.depositTxID)
                "
                class="button_group"
            >
                <CamBtn
                    variant="transparent"
                    @click="signMultisigTx"
                    :disabled="alreadySigned(reward.deposit.depositTxID)"
                >
                    {{ $t('earn.rewards.active_earning.sign') }}
                </CamBtn>
                <CamBtn variant="negative" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </CamBtn>
            </div>
            <div
                v-else-if="
                    signatureStatus(reward.deposit.depositTxID) === 1 &&
                    alreadySigned(reward.deposit.depositTxID)
                "
                class="button_group"
            >
                <CamBtn
                    variant="transparent"
                    @click="signMultisigTx"
                    :disabled="alreadySigned(reward.deposit.depositTxID)"
                >
                    {{
                        $t('earn.rewards.active_earning.signed', {
                            nbSigners: numberOfSignatures,
                            threshold: threshold,
                        })
                    }}
                </CamBtn>
                <CamBtn variant="negative" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </CamBtn>
            </div>
            <div v-else class="button_group">
                <CamBtn
                    variant="primary"
                    @click="disclamer = true"
                    :disabled="isClaimDisabled || disallowedClaim(reward.deposit.depositTxID)"
                >
                    {{ $t('earn.rewards.active_earning.claim') }}
                </CamBtn>
            </div>
            <Alert
                v-if="disclamer && !alreadySigned(reward.deposit.depositTxID)"
                variant="warning"
                class="mt-2"
            >
                {{ $t('earn.rewards.active_earning.are_you_sure') }}
            </Alert>
        </template>
        <ModalClaimDepositReward
            ref="modal_claim_reward"
            :depositTxID="reward.deposit.depositTxID"
            :amount="reward.amountToClaim"
            :rewardOwner="reward.deposit.rewardOwner"
            :canExecuteMultisigTx="canExecuteMultisigTx"
        />
        <ModalAbortSigning
            ref="modal_abort_signing"
            :title="$t('earn.rewards.abort_modal.title')"
            :modalText="$t('earn.rewards.abort_modal.message')"
            @cancelTx="cancelMultisigTx"
        />
        <!-- <ModalClaimReward
            ref="modal_claim_reward"
            :depositTxID="reward.deposit.depositTxID"
            :amount="reward.amountToClaim"
            :rewardOwner="reward.deposit.rewardOwner"
        /> -->
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import { cleanAvaxBN } from '@/helpers/helper'
import AvaAsset from '@/js/AvaAsset'
import { PlatformRewardDeposit } from '@/store/modules/platform/types'

import { bintools } from '@/AVA'
import { ZeroBN } from '@/constants'
import { WalletHelper } from '@/helpers/wallet_helper'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import { ClaimTx, UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
import { ModelMultisigTxOwner } from '@c4tplatform/signavaultjs'
import ModalAbortSigning from './ModalAbortSigning.vue'
import ModalClaimDepositReward from './ModalClaimDepositReward.vue'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'

@Component({
    components: {
        ModalClaimReward,
        ModalClaimDepositReward,
        ModalAbortSigning,
        CamBtn,
        Alert,
    },
})
export default class DepositRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true
    disclamer: boolean = false
    // @ts-ignore
    helpers = this.globalHelper()
    // signedDepositID: string = ''
    @Prop() reward!: PlatformRewardDeposit

    $refs!: {
        // modal_claim_reward: ModalClaimReward
        modal_claim_reward: ModalClaimDepositReward
        modal_abort_signing: ModalAbortSigning
    }

    openAbortModal() {
        this.$refs.modal_abort_signing.open()
    }
    updateNow() {
        this.now = Date.now()
    }

    created() {
        this.intervalID = setInterval(() => {
            this.updateNow()
        }, 2000)
    }
    destroyed() {
        clearInterval(this.intervalID)
    }

    get activeWallet(): WalletType {
        return this.$store.state.activeWallet
    }
    private get pendingSendMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.activeWallet.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'ClaimTx'
        )
    }
    async signMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.debug('MultiSigTx::sign: Invalid Tx')
        try {
            await wallet.addSignatures(this.pendingSendMultisigTX?.tx)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.multisig_transaction_saved'),
                type: 'success',
            })
            this.$store.dispatch('Signavault/updateTransaction')
        } catch (e: any) {
            this.helpers.dispatchNotification({
                message: this.$t('multisig_transaction_not_saved'),
                type: 'error',
            })
            this.disclamer = false
        }
    }
    private async issueMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.error('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.error('MultiSigTx::sign: Invalid Tx')
        try {
            await wallet.issueExternal(this.pendingSendMultisigTX?.tx)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.transfer_success_msg'),
                type: 'success',
            })
            this.updateMultisigTxDetails()
            this.$store.dispatch('Signavault/updateTransaction')
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
            if (this.pendingSendMultisigTX) {
                // cancel from the wallet
                await wallet.cancelExternal(this.pendingSendMultisigTX?.tx)
                await this.$store.dispatch('Signavault/updateTransaction')
                this.helpers.dispatchNotification({
                    message: this.$t('transfer.multisig.transaction_aborted'),
                    type: 'success',
                })
            }
        } catch (err) {
            console.log(err)
            this.helpers.dispatchNotification({
                message: this.$t('transfer.multisig.cancel_transaction_failed'),
                type: 'error',
            })
        }
    }
    private async updateMultisigTxDetails() {
        if (this.pendingSendMultisigTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingSendMultisigTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction() as ClaimTx
            const claimAmounts = utx.getClaimAmounts()
        }
    }
    get numberOfSignatures(): number {
        let signers = 0
        this.txOwners(this.reward.deposit.depositTxID).forEach((owner) => {
            if (owner.signature) signers++
        })
        return signers
    }

    get threshold(): number {
        return this.pendingSendMultisigTX?.tx?.threshold ?? 0
    }

    getPendingMultisigTx(depositTxID: string): SignavaultTx | undefined {
        const tx = this.pendingSendMultisigTX
        if (!tx) return undefined

        const depositId = this.signedDepositID()
        if (depositId === depositTxID) return tx
        else return undefined
    }
    signedDepositID() {
        const tx = this.pendingSendMultisigTX

        if (!tx) return undefined

        const unsignedTx = new UnsignedTx()
        unsignedTx.fromBuffer(Buffer.from(tx.tx?.unsignedTx, 'hex'))
        const utx = unsignedTx.getTransaction() as ClaimTx
        const claimAmounts = utx.getClaimAmounts()

        return bintools.cb58Encode(claimAmounts[0].getID())
    }
    txOwners(depositTxID: string): ModelMultisigTxOwner[] | [] {
        return this.getPendingMultisigTx(depositTxID)?.tx?.owners ?? []
    }
    signatureStatus(depositTxID: string): number {
        if (!this.getPendingMultisigTx(depositTxID)?.tx) return -1
        else if (!this.canExecuteMultisigTx(depositTxID)) return 1
        else if (this.canExecuteMultisigTx(depositTxID)) return 2

        return -1
    }
    canExecuteMultisigTx(depositTxID: string): boolean {
        let signers = 0
        let threshold = this.getPendingMultisigTx(depositTxID)?.tx?.threshold
        const txOwners = this.txOwners(depositTxID)

        txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }

    alreadySigned(depositTxID: string): boolean {
        const txOwners = this.txOwners(depositTxID)
        if (!txOwners) return false

        const walletAddresses = (this.activeWallet as MultisigWallet)?.wallets?.map(
            (w) => w?.getAllAddressesP()?.[0]
        )
        if (!walletAddresses) return false

        const isSigned = txOwners.some((owner) => {
            if (!owner) return false
            const isOwnerSigned = owner.signature && walletAddresses.includes(owner.address)
            return isOwnerSigned
        })

        return isSigned
    }
    disallowedClaim(depositTxID: string): boolean {
        if (!this.pendingSendMultisigTX) return false
        else {
            if (!this.signedDepositID() || this.signedDepositID() === depositTxID) return false
            else return true
        }
    }
    get isMultiSig(): boolean {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'multisig'
    }

    get depositOffer(): DepositOffer | undefined {
        return this.$store.getters['Platform/depositOffer'](this.reward.deposit.depositOfferID)
    }

    get rewardTitle() {
        return this.depositOffer
            ? Buffer.from(this.depositOffer.memo.replace('0x', ''), 'hex').toString()
            : 'Unknown'
    }

    get startDate() {
        const startDate = new Date(parseInt(this.reward.deposit.start.toString()) * 1000)

        return startDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get endDate() {
        const endDate = new Date(
            (this.reward.deposit.start.toNumber() + this.reward.deposit.duration) * 1000
        )

        return endDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get rewardPercent() {
        if (!this.depositOffer) return 0

        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (
            (this.depositOffer.interestRateNominator.toNumber() * interestRateBase * 100) /
            interestRateDenominator
        )
    }

    get minLock() {
        return this.depositOffer?.minAmount ?? ZeroBN
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get isClaimDisabled() {
        return this.reward.amountToClaim.isZero()
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    openModal() {
        this.disclamer = false
        this.$refs.modal_claim_reward.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
@use '../../../styles/main';

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

.mt-2 {
    margin-top: 0.5rem;
}

.offer_detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 1.25rem;
    .offer_detail_left {
        border-right: 2px solid var(--bg-wallet-light);
    }
}

label {
    color: var(--primary-color-light) !important;
}

.claim_button {
    border-radius: var(--border-radius-sm);
    padding: 8px 30px;
    margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
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

.offer_detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 1.25rem;
    .offer_detail_left {
        border-right: 2px solid var(--bg-wallet-light);
    }
}

.node_id {
    word-break: break-all;
}

.top_bar {
    height: max-content;
    position: relative;
    padding: 2px 8px;
    border-bottom: 2px solid var(--bg-wallet-light);
}
.reward_row {
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    font-size: 14px;
    //border: 2px solid var(--bg-light);
    background-color: var(--bg-light);
}

.data_row {
    grid-column: 1/3;
    display: grid;
    grid-template-columns: 1fr 280px;
    align-items: center;
}

.date {
    z-index: 1;
}
.reward_bar {
    background-color: var(--success);
    position: absolute;
    opacity: 0.5;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 0;
}

.stake_info {
    padding: 6px 12px;
    display: grid;
    column-gap: 14px;
    grid-template-columns: 2fr 1fr 1fr;
    /*justify-content: space-between;*/
    /*text-align: right;*/
    text-align: left;

    > div {
        align-self: baseline;
    }
}

.bordered_button {
    border-width: 1px;
    border-style: solid;
    border-radius: var(--border-radius-lg);
    padding: 8px 24px;
    border-color: var(--primary-btn-border-color);
    color: var(--primary-btn-border-color);
    background-color: transparent !important;
    &:hover {
        opacity: 0.6;
    }
    &[disabled] {
        background: var(--bg-light);
        border: var(--primary-border);
        color: var(--primary-color-light);
        border: var(--primary-border);
        opacity: 0.3;
        cursor: not-allowed;
    }
}

label {
    color: var(--primary-color-light) !important;
}

.claim_button {
    border-radius: var(--border-radius-sm);
    width: min-content;
    padding: 8px 30px;
    // margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
}

.button_group {
    display: flex;
    margin-left: auto;
    gap: 0.5rem;
    justify-content: end;
}

.err {
    text-align: left;
    color: var(--error);
    font-size: 0.8rem;
    margin-top: 10px;
}

@include main.mobile-device {
    .offer_detail {
        grid-template-columns: 1fr;
        grid-gap: 0.5rem;
        .offer_detail_left {
            border-right: none;
        }
    }
}

@include main.mobile-device {
    .stake_info {
        grid-column: 1/3;
        border-left: none;
        border-top: 3px solid var(--bg);

        > div:first-of-type {
            text-align: left;
        }
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
