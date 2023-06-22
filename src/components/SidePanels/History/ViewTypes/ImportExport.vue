<template>
    <div class="import_row" :export="isExport">
        <template v-if="isExport">
            <p>Export ({{ chainAlias }})</p>
            <p class="amt">{{ isExport ? '-' : '' }}{{ amtText }} {{ nativeAssetSymbol }}</p>
        </template>
        <template v-else>
            <p>Import ({{ chainAlias }})</p>
            <p class="amt">{{ amtText }} {{ nativeAssetSymbol }}</p>
        </template>
    </div>
</template>
<script lang="ts">
import { bintools } from '@/AVA'
import { chainIdFromAlias, bnToBig } from '@/helpers/helper'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ITransactionData } from '@/store/modules/history/types'

import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import {
    StandardAmountOutput,
    StandardAmountInput,
    StandardTransferableOutput,
} from '@c4tplatform/caminojs/dist/common'

interface ExportTx {
    getDestinationChain(): Buffer
    getExportOutputs(): StandardTransferableOutput[]
}

interface ImportTx {
    getSourceChain(): Buffer
    getImportInputs(): StandardAmountInput[]
}

@Component
export default class ImportExport extends Vue {
    @Prop() transaction!: ITransactionData

    get isExport() {
        return this.transaction.type === 'export' || this.transaction.type === 'pvm_export'
    }

    get fromChainId() {
        // Future format
        if (this.transaction.rawTx) {
            const c = this.isExport
                ? this.transaction.rawTx.getBlockchainID()
                : ((this.transaction.rawTx as unknown) as ImportTx).getSourceChain()
            return bintools.cb58Encode(c)
        }
        if (!this.transaction.inputs) return '?'
        return this.transaction.inputs[0].output.chainID
    }

    get destinationChainId() {
        if (this.transaction.rawTx) {
            const c = this.isExport
                ? ((this.transaction.rawTx as unknown) as ExportTx).getDestinationChain()
                : this.transaction.rawTx.getBlockchainID()
            return bintools.cb58Encode(c)
        }
        let outs = this.transaction.outputs

        for (var i = 0; i < outs.length; i++) {
            let out = outs[i]
            let chainId = out.chainID
            if (chainId !== this.fromChainId) {
                return chainId
            }
        }
        return this.fromChainId
    }

    get chainAlias() {
        let chainId = this.isExport ? this.fromChainId : this.destinationChainId
        return chainIdFromAlias(chainId)
    }

    get amt(): BN {
        if (this.transaction.rawTx) {
            if (this.isExport) {
                return ((this.transaction.rawTx as unknown) as ExportTx)
                    .getExportOutputs()
                    .reduce(
                        (acc, val) =>
                            acc.add((val.getOutput() as StandardAmountOutput).getAmount()),
                        new BN(0)
                    )
            } else {
                return ((this.transaction.rawTx as unknown) as ImportTx)
                    .getImportInputs()
                    .reduce(
                        (acc, val) => acc.add((val.getInput() as StandardAmountInput).getAmount()),
                        new BN(0)
                    )
            }
        }
        if (this.isExport) {
            let outs = []
            let allOuts = this.transaction.outputs

            for (var i = 0; i < allOuts.length; i++) {
                let out = allOuts[i]
                let chainId = out.chainID

                if (chainId === this.destinationChainId) {
                    outs.push(out)
                }
            }

            let sumAmt = outs.reduce((acc, val) => {
                let amt = new BN(val.amount)
                return acc.add(amt)
            }, new BN(0))
            return sumAmt
        } else {
            let ins = this.transaction.inputs || []
            let sumAmt = ins.reduce((acc, val) => {
                let amt = new BN(val.output.amount)
                return acc.add(amt)
            }, new BN(0))

            return sumAmt
        }
        return new BN(0)
    }

    get txFee() {
        return new BN(this.transaction.txFee)
    }

    get amtText() {
        let total = this.amt.add(this.txFee)

        if (!this.isExport) {
            total = this.amt.sub(this.txFee)
        }

        let big = bnToBig(total, 9)
        return big.toLocaleString()
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style scoped lang="scss">
.import_row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--primary-color-light);

    &[export] {
        .amt {
            color: #d04c4c;
        }
    }
}

.amt {
    text-align: right;
    white-space: nowrap;
    font-size: 15px;
    color: var(--success);
}
</style>
