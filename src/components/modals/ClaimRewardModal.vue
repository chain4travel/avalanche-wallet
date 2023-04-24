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
import Big from 'big.js'

import { ava, bintools } from '@/AVA'
import { ZeroBN } from '@/constants'
import AvaAsset from '@/js/AvaAsset'
import Modal from './Modal.vue'
import { WalletHelper } from '@/helpers/wallet_helper'
import { WalletType } from '@/js/wallets/types'

import { BN } from '@c4tplatform/caminojs/dist'
import { OutputOwners } from '@c4tplatform/caminojs/dist/common'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component({
    filters: {
        cleanAvaxBN(val: BN) {
            let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
            return big.toLocaleString()
        },
    },
    components: {
        Modal,
    },
})
export default class ModalClaimReward extends Vue {
    @Prop() depositTxID!: string
    @Prop() amount!: BN
    claimed: boolean = false
    confiremedClaimedAmount: string = ''

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
        this.claimed = false
    }

    formattedAmount(val: BN): string {
        let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
        return big.toLocaleString()
    }

    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }

    get claimableAmount(): string {
        return this.formattedAmount(this.amount)
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    async confirmClaim() {
        const wallet: WalletType = this.$store.state.activeWallet
        // TODO: RewardOwner must be passed (inside Deposit)
        const rewardOwner = new OutputOwners(
            [bintools.parseAddress(wallet.getStaticAddress('P'), 'P')],
            ZeroBN,
            1
        )

        try {
            const result = await WalletHelper.buildDepositClaimTx(
                wallet,
                this.depositTxID,
                rewardOwner,
                this.amount
            )
            this.$store.dispatch('updateTransaction', {
                withDeposit: true,
                msgType: 'success',
                msgTitle: 'Transaction',
                msgText: `Claim Successful (TX: ${result})`,
            })
        } catch (error) {
            if (error instanceof SignatureError) {
                this.$store.dispatch('updateTransaction', {
                    onlyMultisig: true,
                    msgType: 'success',
                    msgTitle: 'Multisignature',
                    msgText: 'Transaction Recorded.',
                })
            } else {
                console.error(error)
                this.$store.dispatch('Notifications/add', {
                    type: 'error',
                    title: 'Claim Failed',
                    message: error,
                })
                this.claimed = false
                return
            }
        }
        this.claimed = true
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
