<template>
    <CamOfferCard :title="rewardTitle" type="reward" :reward="reward">
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
            @updatePendingDepositClaim="updatePendingDepositClaim"
        />
        <ModalAbortSigning
            ref="modal_abort_signing"
            :title="$t('earn.rewards.abort_modal.title')"
            :modalText="$t('earn.rewards.abort_modal.message')"
            @cancelTx="cancelMultisigTx"
        />
    </CamOfferCard>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import { cleanAvaxBN } from '@/helpers/helper'
import { PlatformRewardDeposit } from '@/store/modules/platform/types'

import { bintools } from '@/AVA'
import Alert from '@/components/Alert.vue'
import CamBtn from '@/components/CamBtn.vue'
import CamOfferCard from '@/components/CamOfferCard.vue'
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

@Component({
    components: {
        ModalClaimReward,
        ModalClaimDepositReward,
        ModalAbortSigning,
        CamBtn,
        Alert,
        CamOfferCard,
    },
})
export default class DepositRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true
    disclamer: boolean = false
    // @ts-ignore
    helpers = this.globalHelper()
    signedclaimedAmount: BN = new BN(0)
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

    mounted() {
        this.updateMultisigTxDetails()
    }

    get activeWallet(): WalletType {
        return this.$store.state.activeWallet
    }

    get pendingSendMultisigTX(): SignavaultTx | undefined {
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
                this.updatePendingDepositClaim(false)
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

            const amount = claimAmounts[0].getAmount()
            this.signedclaimedAmount = new BN(amount)
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
        const depositId = this.signedDepositID()
        if (depositId === depositTxID) this.updatePendingDepositClaim(true)
        if (!this.getPendingMultisigTx(depositTxID)?.tx) return -1
        else if (!this.canExecuteMultisigTx(depositTxID)) return 1
        else if (this.canExecuteMultisigTx(depositTxID)) return 2

        return -1
    }

    updatePendingDepositClaim(status: boolean) {
        this.$emit('updatePendingDepositClaim', status)
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

.mt-2 {
    margin-top: 0.5rem;
}

.button_group {
    display: flex;
    margin-left: auto;
    gap: 0.5rem;
    justify-content: end;
    margin-top: 0.6rem;
}
</style>
