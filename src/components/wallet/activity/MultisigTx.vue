<template>
    <div>
        <h4>
            {{ $t('activity.multisig.title') }}
            <router-link class="msig_close" to="activity">
                <fa icon="times"></fa>
            </router-link>
        </h4>
        <p v-if="txState === -1">An error occured fetching the Transaction data</p>
        <p v-else-if="txState === 0">
            Transaction is already signed by you, but not yet executable
        </p>
        <div v-else class="btn_container">
            <v-btn
                v-if="(txState & 1) !== 0"
                @click="sign"
                class="button_secondary"
                :loading="signing"
                depressed
                block
            >
                Sign Transaction
            </v-btn>
            <v-btn
                v-if="(txState & 2) !== 0"
                @click="issue"
                class="button_secondary"
                :loading="issueing"
                depressed
                block
            >
                Issue Transaction
            </v-btn>
        </div>
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

import { BN } from '@c4tplatform/caminojs/dist'
import { ava, bintools } from '@/AVA'
import { ChainIdType } from '@/constants'
import { ExtIssueResult, MultisigWallet } from '@/js/wallets/MultisigWallet'
import { platformUTXOsToEvmSet } from '@/helpers/utxo_helper'
import { TransactionType } from '@/store/modules/history/types'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'

import {
    PlatformVMConstants,
    ExportTx as PVMExportTx,
} from '@c4tplatform/caminojs/dist/apis/platformvm'
import { avaxCtoX, GasHelper } from '@c4tplatform/camino-wallet-sdk/dist'

@Component
export default class MultisigTx extends Vue {
    @Prop() txId!: string
    @Prop() type!: TransactionType
    signing = false
    issueing = false

    get tx(): SignavaultTx | undefined {
        const hexTxId = bintools.cb58Decode(this.txId).toString('hex')
        return this.$store.getters['Signavault/transaction'](hexTxId)
    }

    get txState(): number {
        return this.tx?.state ?? -1
    }

    async importFee(chain: ChainIdType): Promise<BN> {
        if (chain === 'X') {
            return ava.XChain().getTxFee()
        } else if (chain === 'P') {
            return ava.PChain().getTxFee()
        } else {
            const baseFee = await GasHelper.getBaseFeeRecommended()

            const fee = GasHelper.estimateImportGasFeeFromMockTx(1, 1)
            const totFeeWei = baseFee.mul(new BN(fee))
            return avaxCtoX(totFeeWei)
        }
    }

    async sign() {
        const wallet = this.$store.state.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')

        if (!this.tx) return console.log('MultiSigTx::sign: Invalid Tx')

        this.signing = true
        try {
            await wallet.addSignatures(this.tx?.tx)
            this.$store.dispatch('updateTransaction', {
                onlyMultisig: true,
                msgType: 'success',
                msgTitle: 'Multisignature',
                msgText: 'Signature recorded.',
            })
        } catch (e: any) {
            console.log(e.response)
            this.$store.dispatch('Notifications/add', {
                title: 'Multisignature',
                message: `Failed to record signature (${e.message})`,
                type: 'error',
            })
        }
        this.signing = false
    }

    async issue() {
        const wallet = this.$store.state.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')

        if (!this.tx) return console.log('MultiSigTx::sign: Invalid Tx')

        this.issueing = true
        try {
            const signedTx = await wallet.issueExternal(this.tx?.tx)
            await this.buildImportFromExport(wallet, signedTx)
            this.$store.dispatch('updateTransaction', {
                fullHistory: true,
                withMultisig: true,
                msgType: 'success',
                msgTitle: 'Multisignature',
                msgText: 'Transaction issued.',
            })
            this.$router.replace('activity')
        } catch (e: any) {
            console.log(e.response)
            this.$store.dispatch('Notifications/add', {
                title: 'Multisignature',
                message: `Failed to issue transaction (${e.message})`,
                type: 'error',
            })
        }
        this.issueing = false
    }

    async buildImportFromExport(wallet: MultisigWallet, txData: ExtIssueResult): Promise<boolean> {
        const utx = txData.tx.getUnsignedTx()
        const baseTx = utx.getTransaction()
        const chainID = bintools.cb58Encode(baseTx.getBlockchainID())
        const txID = bintools.cb58Decode(txData.txID)
        if (chainID === ava.PChain().getBlockchainID()) {
            if (baseTx.getTxType() === PlatformVMConstants.EXPORTTX) {
                const utxos = (baseTx as PVMExportTx).getUTXOs(txID)
                const destChainID = bintools.cb58Encode(
                    (baseTx as PVMExportTx).getDestinationChain()
                )
                if (destChainID === ava.CChain().getBlockchainID()) {
                    const evmSet = platformUTXOsToEvmSet(utxos)
                    const fee = await this.importFee('C')
                    wallet.importToCChain('P', fee, evmSet)
                } else {
                    // X-Chain
                }
                return true
            }
        }
        return false
    }
}
</script>
<style scoped lang="scss">
.msig_close {
    font-size: large;
    color: var(--fg);
    float: right;
}

.btn_container {
    margin-top: 40px;
    display: grid;
    grid-gap: 10px;
}
</style>
