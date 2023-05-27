<template>
    <div class="bulk_card">
        <div>
            <label>{{ $t('transfer.receivers') }}</label>
            <input
                type="text"
                v-model="orderString"
                class="hover_border"
                placeholder="X-[...];1.5,X-[...];10"
            />
            <span class="bulk_info bulk_error" v-if="error !== ''">Error: {{ error }}</span>
            <span class="bulk_info" v-else>
                Addresses: {{ orders.length }}, Amount: {{ totalBig.toLocaleString() }}
                {{ asset.symbol }}
            </span>
        </div>
        <div class="checkout">
            <p>
                <label>{{ $t('transfer.memo').toString() }}</label>
                <textarea class="memo" maxlength="256" placeholder="Memo" v-model="memo"></textarea>
            </p>
            <v-btn
                id="submit"
                depressed
                class="button_primary"
                :loading="processing"
                :ripple="false"
                @click="submit"
                :disabled="!canSend"
                block
            >
                {{ $t('transfer.send') }}
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

import { ava, bintools } from '@/AVA'
import { TxState } from '../ChainTransfer/types'
import { BulkOrder } from './types'
import { Big } from '@/helpers/helper'
import { WalletHelper } from '@/helpers/wallet_helper'
import AvaAsset from '@/js/AvaAsset'
import { WalletType } from '@/js/wallets/types'

import { BN, Buffer } from '@c4tplatform/camino-wallet-sdk'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component
export default class BulkTransfer extends Vue {
    orderString: string = ''
    memo: string = ''
    orders: BulkOrder[] = []
    totalBig: Big = Big(0)

    error: string = ''

    txState: TxState = TxState.waiting

    @Watch('orderString')
    onUpdateOrderString(o: string, n: string) {
        const pairs = this.orderString.trim().split(',') as string[]
        const denom = this.asset.denomination

        const orders: BulkOrder[] = []
        var totalBig = Big(0)
        const hrp = ava.getHRP()

        try {
            pairs.forEach((p, index) => {
                const parts = p.split(';')
                if (parts.length === 2) {
                    const addr = bintools.parseAddress(parts[0], 'X', hrp)
                    if (!addr) throw new Error(`Pair ${index}: Invalid Address`)
                    try {
                        const big = Big(parts[1])
                        orders.push({
                            address: parts[0],
                            amount: new BN(big.mul(Math.pow(10, denom)).toString()),
                        })
                        totalBig = totalBig.add(big)
                    } catch (e: unknown) {
                        throw new Error(`Pair ${index}: Cannot parse amount`)
                    }
                }
            })
        } catch (e: any) {
            this.error = e.message
            this.orders = []
            this.totalBig = Big(0)
            return
        }
        this.orders = orders
        this.totalBig = totalBig
        this.error = ''
    }

    get asset(): AvaAsset {
        return this.$store.getters['Assets/AssetAVA']
    }

    get processing(): boolean {
        return this.txState === TxState.started
    }

    get canSend(): boolean {
        return this.txState !== TxState.started && this.orders.length > 0
    }

    async submit() {
        const wallet: WalletType = this.$store.state.activeWallet
        try {
            this.txState = TxState.started
            const txId = await WalletHelper.issueBulkTx(
                wallet,
                this.asset,
                this.orders,
                Buffer.from(this.memo)
            )
            this.waitTxConfirm(txId)
        } catch (error) {
            if (error instanceof SignatureError) {
                this.txState = TxState.success
                this.orderString = ''
                this.$store.dispatch('updateTransaction', {
                    onlyMultisig: true,
                    msgType: 'success',
                    msgTitle: 'Airdrop Transaction',
                    msgText: 'Transaction Recorded.',
                })
            } else {
                this.txState = TxState.failed
                console.error(error)
                this.$store.dispatch('Notifications/add', {
                    type: 'error',
                    title: 'Airdrop Failed',
                    message: error,
                })
                return
            }
        }
    }

    async waitTxConfirm(txId: string) {
        const status = await ava.XChain().getTxStatus(txId)

        if (status === 'Unknown' || status === 'Processing') {
            // if not confirmed ask again
            setTimeout(() => {
                this.waitTxConfirm(txId)
            }, 500)
            return false
        } else if (status === 'Dropped') {
            // If dropped stop the process
            this.txState = TxState.failed
            return false
        } else {
            // If success display success page
            this.txState = TxState.success
            this.orderString = ''

            this.$store.dispatch('updateTransaction', {
                withDeposit: true,
                msgType: 'success',
                msgTitle: 'Airdrop Transaction',
                msgText: `Success (TX: ${txId})`,
            })
        }
    }
}
</script>

<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.bulk_card {
    label {
        margin-top: 6px;
        color: var(--primary-color);
        font-size: 14px;
        margin-bottom: 3px;
    }

    input {
        background-color: var(--bg-light);
        padding: 8px 12px;
        display: block;
        font-size: 14px;
        color: var(--primary-color);
        margin-top: 10px;
        width: 100%;
    }

    .bulk_info {
        font-size: small;
        color: var(--primary-color-light);
    }

    .bulk_error {
        color: var(--error);
    }

    .checkout {
        display: grid;
        margin-top: 16px;
        grid-template-columns: auto 200px;
        gap: 16px;
        align-items: end;
    }
    .memo {
        display: block;
        font-size: 14px;
        background-color: var(--bg-light);
        resize: none;
        width: 100%;
        height: 52px;
        border-radius: var(--border-radius-sm);
        padding: 4px 12px;
        margin-top: 10px;
    }

    @include mixins.mobile-device {
        .checkout {
            grid-template-columns: auto;
        }
    }
}
</style>
