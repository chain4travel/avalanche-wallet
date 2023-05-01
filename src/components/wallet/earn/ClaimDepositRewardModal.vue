<template>
    <modal ref="modal" title="Claim Reward" @beforeClose="beforeClose">
        <div class="claim-reward-modal">
            <div v-if="!claimed">
                <div>
                    <h3>
                        {{
                            $t('earn.rewards.claim_modal.are_you_sure', {
                                amount: claimableAmount,
                                symbol: nativeAssetSymbol,
                            })
                        }}
                    </h3>
                    <br />
                    <p class="text-modal">
                        {{
                            $t('earn.rewards.claim_modal.note_message', {
                                fee: feeAmt,
                                symbol: nativeAssetSymbol,
                            })
                        }}
                    </p>
                </div>
                <div class="modal-buttons">
                    <v-btn depressed class="button_primary" @click="close()">
                        {{ $t('earn.rewards.claim_modal.cancel') }}
                    </v-btn>
                    <v-btn depressed class="button_secondary btn-claim" @click="confirmClaim()">
                        {{ $t('earn.rewards.claim_modal.confirm') }}
                    </v-btn>
                </div>
            </div>
            <div class="confirmed-claimed" v-else>
                <br />
                <h2>
                    {{
                        $t('earn.rewards.claim_modal.confirmation_message', {
                            amount: confiremedClaimedAmount,
                            symbol: nativeAssetSymbol,
                        })
                    }}
                </h2>
                <br />
            </div>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '../../modals/Modal.vue'
import { BN } from '@c4tplatform/caminojs'
import Big from 'big.js'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { WalletHelper } from '@/helpers/wallet_helper'
import { ava, bintools } from '@/AVA'
import AvaAsset from '@/js/AvaAsset'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { SignatureError, OutputOwners } from '@c4tplatform/caminojs/dist/common'
import { RewardOwner } from '@/components/misc/ValidatorList/types'
import { UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { bnToBig } from '@/helpers/helper'

@Component({
    components: {
        Modal,
    },
})
export default class ModalClaimDepositReward extends Vue {
    @Prop({ required: true }) depositTxID!: string
    @Prop({ required: true }) amount!: BN
    @Prop({ required: true }) rewardOwner!: RewardOwner
    claimed: boolean = false
    confiremedClaimedAmount: string = ''

    // @ts-ignore
    helpers = this.globalHelper()

    $refs!: {
        modal: Modal
    }

    mounted() {
        this.updateMultisigTxDetails()
    }

    open() {
        this.$refs.modal.open()
        this.updateMultisigTxDetails()
    }

    close() {
        this.$refs.modal.close()
    }

    beforeClose() {
        this.confiremedClaimedAmount = ''
        this.$emit('beforeCloseModal', this.claimed)
        this.claimed = false
    }

    updateBalance(): void {
        this.$store.dispatch('Assets/updateUTXOs')
        this.$store.dispatch('History/updateTransactionHistory')
    }

    formattedAmount(val: BN): string {
        let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
        return big.toLocaleString()
    }

    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
    }

    get isMultiSig(): boolean {
        return this.activeWallet.type === 'multisig'
    }

    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }

    get claimableAmount(): string {
        if (!this.isMultiSig) this.formattedAmount(this.amount)

        return this.confiremedClaimedAmount.toLocaleString()
    }

    get ava_asset(): AvaAsset | null {
        return this.$store.getters['Assets/AssetAVA']
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get pendingSendMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.activeWallet.getAllAddressesP()[0] &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'ClaimTx'
        )
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
            // Initiate multisig transaction
            WalletHelper.buildDepositClaimTx(wallet, this.depositTxID, rewardOwner, this.amount)
                .then(() => {
                    this.confiremedClaimedAmount = this.formattedAmount(this.amount)
                    this.updateBalance()
                    this.$store.dispatch('Platform/updateActiveDepositOffer')
                    this.claimed = true
                })
                .catch((err) => {
                    if (err instanceof SignatureError) {
                        dispatchNotification({
                            message: this.$t('notifications.claim_success_msg'),
                            type: 'success',
                        })
                        setTimeout(() => {
                            this.$store.dispatch('Assets/updateUTXOs')
                            this.$store.dispatch('Signavault/updateTransaction').then(() => {
                                this.$store.dispatch('History/updateMultisigTransactionHistory')
                            })
                        }, 1000)
                    }
                    console.error(err)
                    this.claimed = false
                })
        } else {
            try {
                await this.issueMultisigTx()
                this.updateBalance()
                this.claimed = true
            } catch (err) {
                console.error('Error confirming claim:', err)
                this.claimed = false
            }
        }
    }

    async issueMultisigTx() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.error('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.error('MultiSigTx::sign: Invalid Tx')
        try {
            await this.updateMultisigTxDetails()
            await wallet.issueExternal(this.pendingSendMultisigTX?.tx)
            this.helpers.dispatchNotification({
                message: 'Your Transaction sent successfully.',
                type: 'success',
            })
            this.$store.dispatch('Platform/updateActiveDepositOffer')
            this.$store.dispatch('Signavault/updateTransaction')
        } catch (e: any) {
            console.error('MultiSigTx::sign: Error', e)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error'),
                type: 'error',
            })
            throw e
        }
    }

    async updateMultisigTxDetails() {
        await this.$store.dispatch('Assets/updateUTXOs')
        await this.$store.dispatch('Signavault/updateTransaction')

        if (!this.isMultiSig)
            return (this.confiremedClaimedAmount = this.formattedAmount(this.amount))
        if (this.pendingSendMultisigTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingSendMultisigTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction()
            const claimAmounts = utx.getClaimAmounts()

            const amount = claimAmounts[0].getAmount()
            this.confiremedClaimedAmount = bnToBig(new BN(amount), 9)?.toString()
        } else this.confiremedClaimedAmount = ''
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/main';
.claim-reward-modal {
    padding: 30px 22px;
    text-align: center;
    width: 600px;
    overflow-x: hidden;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    gap: 10px;
}

.text-modal {
    text-align: left;
    color: var(--error);
}

@media screen and (max-width: 720px) {
    .claim-reward-modal {
        width: 350px;
    }
}
@media screen and (min-width: 720px) and (max-width: 1440px) {
    .claim-reward-modal {
        width: 475px;
    }
}
</style>
