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
                            amount: formattedAmount(amt),
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
import 'reflect-metadata'

import { BN } from '@c4tplatform/caminojs'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import Big from 'big.js'
import { Component, Prop, Vue } from 'vue-property-decorator'

import { ava } from '@/AVA'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import { WalletHelper } from '@/helpers/wallet_helper'
import AvaAsset from '@/js/AvaAsset'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'

import Modal from '../../modals/Modal.vue'

@Component({
    components: {
        AvaxInput,
        Modal,
    },
})
export default class ModalUndeposit extends Vue {
    @Prop({ required: true }) depositTxID!: string
    @Prop({ required: true }) amount!: BN
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

    open() {
        this.$refs.modal.open()
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
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'UnlockDepositTx'
        )
    }

    async updateRewards() {
        await this.$store.dispatch('Assets/updateUTXOs')
        await this.$store.dispatch('History/updateTransactionHistory')
        await this.$store.dispatch('Platform/updateAllDepositOffers')
        await this.$store.dispatch('Platform/updateRewards')
    }

    async confirmClaim() {
        // @ts-ignore
        let { dispatchNotification } = this.globalHelper()

        await WalletHelper.buildUnlockDepositTx(this.$store.state.activeWallet, this.amt)
            .then(async (value) => {
                this.updateBalance()
                this.updateRewards()
                this.helpers.dispatchNotification({
                    message: `Undeposit Successful for ${this.formattedAmount(this.amt)} ${
                        this.nativeAssetSymbol
                    }`,
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
                console.log(err)
            })
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
