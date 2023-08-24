<template>
    <div class="offer_row">
        <h2 class="offer_title">{{ rewardTitle }}</h2>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.lock_start') }}:</label>
                    <p class="reward">{{ startDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.lock_end') }}:</label>
                    <p class="reward">{{ endDate }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.min_lock') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(minLock) }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.reward') }}:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>{{ $t('earn.rewards.active_earning.locked_amount') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(lockedAmount) }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.pending_reward') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(pendingRewards) }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>{{ $t('earn.rewards.active_earning.already_claimed') }}:</label>
                    <p class="reward">{{ cleanAvaxBN(alreadyClaimed) }} {{ nativeAssetSymbol }}</p>
                </div>
            </div>
        </div>
        <div v-if="!isMultiSig" class="button_group">
            <v-btn class="claim_button button_primary" @click="openModal" :disabled="!canClaim">
                {{ $t('earn.rewards.active_earning.claim') }}
            </v-btn>
        </div>
        <template v-else>
            <div v-if="signatureStatus === 2" class="button_group">
                <v-btn
                    class="claim_button button_secondary"
                    @click="openModal"
                    :disabled="!canClaim"
                >
                    {{ $t('earn.rewards.active_earning.execute_claim') }}
                </v-btn>
                <v-btn class="claim_button button_primary" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </v-btn>
            </div>
            <div v-else-if="signatureStatus === -1 && disclamer" class="button_group">
                <v-btn
                    class="claim_button bordered_button"
                    @click="openModal"
                    :disabled="!canClaim"
                >
                    {{ $t('earn.rewards.active_earning.initiate_transaction') }}
                </v-btn>
                <v-btn class="claim_button button_primary" @click="disclamer = false">
                    {{ $t('earn.rewards.active_earning.cancel') }}
                </v-btn>
            </div>
            <div v-else-if="signatureStatus === 1 && !alreadySigned" class="button_group">
                <v-btn
                    class="claim_button bordered_button"
                    @click="signMultisigTx"
                    :disabled="alreadySigned"
                >
                    {{ $t('earn.rewards.active_earning.sign') }}
                </v-btn>
                <v-btn class="claim_button button_primary" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </v-btn>
            </div>
            <div v-else-if="signatureStatus === 1 && alreadySigned" class="button_group">
                <v-btn
                    class="claim_button bordered_button"
                    @click="signMultisigTx"
                    :disabled="alreadySigned"
                >
                    {{
                        $t('earn.rewards.active_earning.signed', {
                            nbSigners: numberOfSignatures,
                            threshold: threshold,
                        })
                    }}
                </v-btn>
                <v-btn class="claim_button button_primary" @click="openAbortModal">
                    {{ $t('earn.rewards.active_earning.abort') }}
                </v-btn>
            </div>
            <div v-else class="button_group">
                <v-btn
                    class="claim_button button_primary"
                    @click="disclamer = true"
                    :disabled="!canClaim || disallowedClaim"
                >
                    {{ $t('earn.rewards.active_earning.claim') }}
                </v-btn>
            </div>
            <div v-if="disclamer && !alreadySigned" class="err">
                {{ $t('earn.rewards.active_earning.are_you_sure') }}
            </div>
        </template>
        <ModalClaimDepositReward
            ref="modal_claim_reward"
            :depositTxID="depositTxID"
            :amount="pendingRewards"
            :rewardOwner="rewardOwner"
            :canExecuteMultisigTx="canExecuteMultisigTx"
        />
        <ModalAbortSigning
            ref="modal_abort_signing"
            :title="$t('earn.rewards.abort_modal.title')"
            :modalText="$t('earn.rewards.abort_modal.message')"
            @cancelTx="cancelMultisigTx"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { BN } from '@c4tplatform/caminojs'
import Big from 'big.js'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import AvaAsset from '@/js/AvaAsset'
import ModalClaimDepositReward from './ModalClaimDepositReward.vue'
import ModalAbortSigning from './ModalAbortSigning.vue'
import { WalletHelper } from '@/helpers/wallet_helper'

import { WalletType } from '@/js/wallets/types'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { ModelMultisigTxOwner } from '@c4tplatform/signavaultjs'
import { OutputOwners } from '@c4tplatform/caminojs/dist/common'
import { RewardOwner } from '@/components/misc/ValidatorList/types'
import { ava, bintools } from '@/AVA'

import { cleanAvaxBN } from '@/helpers/helper'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ClaimTx } from '@c4tplatform/caminojs/dist/apis/platformvm/claimtx'

@Component({
    components: {
        ModalClaimDepositReward,
        ModalAbortSigning,
    },
})
export default class UserRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true
    claimed: boolean = false
    confiremedClaimedAmount: string = ''
    disclamer: boolean = false
    signedDepositID: string = ''
    // @ts-ignore
    helpers = this.globalHelper()

    @Prop() depositTxID!: string
    @Prop() title!: string
    @Prop() start!: BN
    @Prop() duration!: BN
    @Prop() minLock!: BN
    @Prop() rewards!: string
    @Prop() lockedAmount!: BN
    @Prop() pendingRewards!: BN
    @Prop() alreadyClaimed!: BN
    @Prop() rewardOwner!: RewardOwner
    @Prop() signatureStatus!: number
    @Prop() alreadySigned!: boolean
    @Prop() disallowedClaim!: boolean
    @Prop() canExecuteMultisigTx!: boolean
    @Prop() validatorClaim!: boolean

    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
    }

    get avaAsset(): AvaAsset | null {
        return this.$store.getters['Assets/AssetAVA']
    }

    get nativeAssetSymbol(): string {
        return this.avaAsset?.symbol ?? ''
    }

    get canClaim(): boolean {
        return parseInt(this.pendingRewards.toString()) > 0
    }

    private get pendingSendMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.activeWallet.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'ClaimTx'
        )
    }

    private get txOwners(): ModelMultisigTxOwner[] | [] {
        return this.pendingSendMultisigTX?.tx?.owners ?? []
    }

    get numberOfSignatures(): number {
        let signers = 0
        this.txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        return signers
    }

    get threshold(): number {
        return this.pendingSendMultisigTX?.tx?.threshold ?? 0
    }

    get rewardTitle(): string {
        return Buffer.from(this.title.replace('0x', ''), 'hex').toString()
    }

    private getFormattedDate(timestamp: number): string {
        const date = new Date(timestamp * 1000)

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get startDate(): string {
        return this.getFormattedDate(parseInt(this.start.toString()))
    }

    get endDate(): string {
        const endTimestamp = parseInt(this.start.toString()) + parseInt(this.duration.toString())
        return this.getFormattedDate(endTimestamp)
    }

    get rewardPercent(): number {
        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (parseInt(this.rewards) / interestRateDenominator) * interestRateBase * 100
    }

    get isMultiSig(): boolean {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'multisig'
    }

    private formattedAmount(val: BN): string {
        let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
        return big.toLocaleString()
    }

    updateBalance(): void {
        this.$store.dispatch('updateBalances')
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    openModal() {
        this.disclamer = false
        this.$refs.modal_claim_reward.open()
    }

    openAbortModal() {
        this.$refs.modal_abort_signing.open()
    }

    $refs!: {
        modal_claim_reward: ModalClaimDepositReward
        modal_abort_signing: ModalAbortSigning
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

    async confirmClaim() {
        const wallet = this.$store.state.activeWallet
        // @ts-ignore
        let { dispatchNotification } = this.globalHelper()
        const hrp = ava.getHRP()
        const rewardOwner = new OutputOwners(
            this.rewardOwner.addresses.map((a) => bintools.stringToAddress(a, hrp)),
            this.rewardOwner.locktime,
            this.rewardOwner.threshold
        )

        if (!this.pendingSendMultisigTX) {
            WalletHelper.buildDepositClaimTx(
                wallet,
                this.depositTxID,
                rewardOwner,
                this.pendingRewards,
                this.validatorClaim
            )
                .then((value) => {
                    if (!value) {
                        // multisg flow
                        dispatchNotification({
                            message: this.$t('notifications.transfer_success_msg'),
                            type: 'success',
                        })
                        this.updateBalance()
                        this.$store.dispatch('Platform/updateActiveDepositOffer')
                        this.$store.dispatch('History/updateMultisigTransactionHistory')
                        this.disclamer = false
                        return this.updateMultisigTxDetails()
                    }

                    this.confiremedClaimedAmount = this.formattedAmount(this.pendingRewards)
                    setTimeout(() => this.updateBalance(), 500)
                    this.$store.dispatch('Platform/updateActiveDepositOffer')
                    this.updateMultisigTxDetails()
                    dispatchNotification({
                        message: this.$t('notifications.transfer_success_msg'),
                        type: 'success',
                    })
                    this.claimed = true
                    this.disclamer = false
                })
                .catch((err) => {
                    dispatchNotification({
                        message: this.$t('notifications.something_went_wrong'),
                        type: 'error',
                    })
                    this.claimed = false
                })
        } else {
            this.issueMultisigTx()
            this.updateBalance()
        }
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
            this.$store.dispatch('Platform/updateActiveDepositOffer')
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

            this.signedDepositID = bintools.cb58Encode(claimAmounts[0].getID())
        } else this.signedDepositID = ''
    }
}
</script>
<style scoped lang="scss">
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

.v-btn {
    margin-top: 0.5rem;
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
</style>
