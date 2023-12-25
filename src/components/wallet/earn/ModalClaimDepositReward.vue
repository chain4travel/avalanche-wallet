<template>
    <modal ref="modal" title="Claim Reward" @beforeClose="beforeClose">
        <div class="claim-reward-modal">
            <div v-if="claimed === 0">
                <div v-if="canExecuteMultisigTx">
                    <h3>
                        {{
                            $t('earn.rewards.claim_modal.are_you_sure', {
                                amount: claimableAmount,
                                symbol: nativeAssetSymbol,
                            })
                        }}
                    </h3>
                </div>
                <div v-if="!canExecuteMultisigTx">
                    <AvaxInput v-model="amt" :max="amount" :initial="amount"></AvaxInput>
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
                    <v-btn depressed class="button_secondary btn-claim" @click="confirmClaim()">
                        {{ $t('earn.rewards.claim_modal.confirm') }}
                    </v-btn>
                    <v-btn depressed class="button_primary" @click="close()">
                        {{ $t('earn.rewards.claim_modal.cancel') }}
                    </v-btn>
                </div>
            </div>
            <div class="confirmed-claimed" v-else-if="claimed === 1">
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
            <div class="confirmed-claimed" v-else>
                <br />
                <h2>{{ $t('earn.rewards.claim_modal.signature_collected') }}</h2>
                <br />
            </div>
        </div>
    </modal>
</template>
<script lang="ts">
import { ava, bintools } from '@/AVA'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { RewardOwner } from '@/components/misc/ValidatorList/types'
import { bnToBig } from '@/helpers/helper'
import { WalletHelper } from '@/helpers/wallet_helper'
import AvaAsset from '@/js/AvaAsset'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { BN, Buffer } from '@c4tplatform/caminojs'
import { UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ClaimTx } from '@c4tplatform/caminojs/dist/apis/platformvm/claimtx'
import { OutputOwners } from '@c4tplatform/caminojs/dist/common'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import Big from 'big.js'
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import Modal from '../../modals/Modal.vue'

@Component({
    components: {
        AvaxInput,
        Modal,
    },
})
export default class ModalClaimDepositReward extends Vue {
    @Prop({ required: true }) depositTxID!: string
    @Prop({ required: true }) amount!: BN
    @Prop({ required: true }) rewardOwner!: RewardOwner
    @Prop() validatorClaim!: boolean
    @Prop() canExecuteMultisigTx!: boolean

    claimed: number = 0 // 0:false, 1:true, 2:pending
    confiremedClaimedAmount: string = ''
    amt: BN = this.amount

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
        this.claimed = 0
    }

    updateBalance(): void {
        this.$store.dispatch('updateBalances')
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

    async updateRewards() {
        await this.$store.dispatch('Assets/updateUTXOs')
        await this.$store.dispatch('History/updateTransactionHistory')
        await this.$store.dispatch('Platform/updateAllDepositOffers')
        await this.$store.dispatch('Platform/updateRewards')
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
                this.amount,
                this.validatorClaim
            )
                .then(async (value) => {
                    if (!value) {
                        // multisg flow
                        this.$store.dispatch('Signavault/updateTransaction')
                        dispatchNotification({
                            message: this.$t('notifications.transfer_success_msg'),
                            type: 'success',
                        })
                        this.claimed = 2
                        return this.updateMultisigTxDetails()
                    }

                    this.confiremedClaimedAmount = this.formattedAmount(this.amount)
                    this.updateBalance()
                    this.updateMultisigTxDetails()
                    this.updateRewards()
                    this.helpers.dispatchNotification({
                        message: `Claim Successful (TX: ${value})`,
                        type: 'success',
                    })

                    this.claimed = 1
                })
                .catch((err) => {
                    dispatchNotification({
                        message: this.$t('notifications.something_went_wrong'),
                        type: 'error',
                    })
                    this.claimed = 0
                })
        } else {
            this.issueMultisigTx()
            this.updateBalance()
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
            this.updateBalance()
            this.updateRewards()
            this.$store.dispatch('Platform/updateActiveDepositOffer')
            this.$store.dispatch('Signavault/updateTransaction')
            this.claimed = 1
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
        if (this.pendingSendMultisigTX) {
            let unsignedTx = new UnsignedTx()
            unsignedTx.fromBuffer(Buffer.from(this.pendingSendMultisigTX.tx?.unsignedTx, 'hex'))
            const utx = unsignedTx.getTransaction() as ClaimTx
            const claimAmounts = utx.getClaimAmounts()

            const amount = claimAmounts[0].getAmount()
            this.confiremedClaimedAmount = bnToBig(new BN(amount), 9)?.toLocaleString()
        } else this.confiremedClaimedAmount = this.formattedAmount(this.amount)
    }
}
</script>
<style scoped lang="scss">
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
    color: var(--warning);
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
