<template>
    <div class="chain_import">
        <h2>{{ $t('advanced.import.title') }}</h2>
        <p>{{ $t('advanced.import.desc') }}</p>
        <div v-if="isSuccess" class="is_success">
            <label>Tx ID</label>
            <p class="tx_id">{{ txId }}</p>
        </div>
        <p class="err" v-else-if="err">{{ err }}</p>
        <template v-if="!isLoading">
            <div class="button-group">
                <CamBtn
                    v-for="(chain, index) in chains"
                    :key="index"
                    variant="primary"
                    style="width: 100%"
                    @click="chain.handler"
                    :loading="isLoading"
                    :disabled="isLoading"
                >
                    {{ chain.label }}
                </CamBtn>
            </div>
        </template>
        <Spinner class="spinner" v-else />
    </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'
import Spinner from '@/components/misc/Spinner.vue'
import CamBtn from '@/components/CamBtn.vue'
import { CrossChainsC, CrossChainsP, CrossChainsX } from '@/constants'
import { getBaseFeeRecommended, estimateImportGasFeeFromMockTx } from '@/helpers/gas_helper'
import { avaxCtoX } from '@/helpers/helper'
import { WalletType } from '@/js/wallets/types'
import { BN } from '@c4tplatform/caminojs/dist'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component({
    components: { Spinner, CamBtn },
})
export default class ChainImport extends Vue {
    err = ''
    isSuccess = false
    isLoading = false
    txId = ''

    get wallet(): null | WalletType {
        return this.$store.state.activeWallet
    }

    get isEVMSupported() {
        return this.wallet && !!this.wallet.ethAddress
    }

    get chains() {
        return [
            { label: 'Import X (From P)', handler: () => this.atomicImportX('P') },
            { label: 'Import X (From C)', handler: () => this.atomicImportX('C') },
            { label: 'Import P (From X)', handler: () => this.atomicImportP('X') },
            { label: 'Import P (From C)', handler: () => this.atomicImportP('C') },
            {
                label: 'Import C (from X)',
                handler: () => this.atomicImportC('X'),
                show: this.isEVMSupported,
            },
            { label: 'Import C (from P)', handler: () => this.atomicImportC('P') },
        ].filter((chain) => chain.show !== false)
    }

    async atomicImportX(sourceChain: CrossChainsX) {
        await this.handleImport(() => this.wallet?.importToXChain(sourceChain))
    }

    async atomicImportP(source: CrossChainsP) {
        await this.handleImport(() => this.wallet?.importToPlatformChain(source))
    }

    async atomicImportC(source: CrossChainsC) {
        await this.handleImport(async () => {
            if (!this.wallet) throw new Error('No wallet found')
            const utxoSet = await this.wallet.evmGetAtomicUTXOs(source)
            const utxos = utxoSet.getAllUTXOs()
            if (utxos.length === 0) throw new Error('Nothing to import.')
            const numSigs = utxos.reduce(
                (acc, utxo) => acc + utxo.getOutput().getAddresses().length,
                0
            )
            const gas = estimateImportGasFeeFromMockTx(utxos.length, numSigs)
            const totFee = (await getBaseFeeRecommended()).mul(new BN(gas))
            return this.wallet.importToCChain(source, avaxCtoX(totFee))
        })
    }

    async handleImport(importFn: () => Promise<string | undefined>) {
        this.beforeSubmit()
        try {
            const txId = await importFn()
            if (txId) this.onSuccess(txId)
        } catch (e) {
            this.onError(e as Error)
        }
    }

    deactivated() {
        this.resetState()
    }

    beforeSubmit() {
        this.isLoading = true
        this.resetState()
    }

    resetState() {
        this.err = ''
        this.isSuccess = false
        this.txId = ''
    }

    onSuccess(txId: string) {
        this.isLoading = false
        this.isSuccess = true
        this.txId = txId
        this.notifySuccess()
        setTimeout(() => {
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
        }, 3000)
    }

    onError(err: Error) {
        this.isLoading = false
        this.err = err.message.includes('No atomic') ? 'Nothing found to import.' : err.message
    }

    notifySuccess() {
        const { dispatchNotification } = this.globalHelper()
        dispatchNotification({
            message: this.$t('notifications.chain_import'),
            type: 'success',
        })
    }
}
</script>

<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.chain_import {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 8px; /* Adjust the gap value as needed */
}

.is_success {
    label {
        color: var(--primary-color-light);
    }
}

.spinner {
    color: var(--primary-color) !important;
    margin: 14px auto !important;
}

.tx_id {
    @include mixins.typography-caption;
    word-break: break-all;
}
</style>
