<template>
    <div class="container">
        <ConsolidateFundsModal
            ref="modal"
            @ctaClick="consolidateFunds"
            :balances="balances"
            :loading="isProcessing"
            :totalFee="totalFeeAmount"
        />
        <h2>{{ $t('advanced.consolidate_funds.title') }}</h2>
        <p class="description">
            {{ $t('advanced.consolidate_funds.desc') }}
        </p>
        <CamBtn class="primary" :loading="isScanning" @click="scanForFunds" block small depressed>
            {{ $t('advanced.consolidate_funds.cta') }}
        </CamBtn>
    </div>
</template>

<script lang="ts">
import CamBtn from '@/components/CamBtn.vue'
import { Component, Vue } from 'vue-property-decorator'
import ConsolidateFundsModal from '@/components/modals/ConsolidateFundsModal.vue'
import { WalletHelper } from '@/helpers/wallet_helper'
import { UTXO as PlatformUTXO } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { AmountOutput, UTXO as AVMUTXO } from '@c4tplatform/caminojs/dist/apis/avm'
import { ava, bintools } from '@/AVA'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import AvaAsset from '@/js/AvaAsset'
import { ITransaction } from '@/components/wallet/transfer/types'
import { BN } from '@c4tplatform/caminojs/dist'
import { ChainIdType } from '@/constants'

const uuidv1 = require('uuid/v1')

@Component({
    components: { ConsolidateFundsModal, CamBtn },
})
export default class ConsolidateFunds extends Vue {
    isScanning = false
    isProcessing = false
    balances: Array<{ addresses: string[]; amount: Big; chainID: 'X' | 'P' }> = []
    tempMnemonicWallet: MnemonicWallet | undefined
    asset: any = null

    helpers = this.globalHelper()

    $refs!: {
        modal: ConsolidateFundsModal
    }

    get walletAssetsArray(): AvaAsset[] {
        return this.$store.getters['Assets/walletAssetsArray']
    }

    get wallet() {
        return this.$store.state.activeWallet
    }

    get totalFeeAmount() {
        const feeP = bnToBig(ava.PChain().getTxFee(), 9)
        const feeX = bnToBig(ava.XChain().getTxFee(), 9)
        const total = feeP.plus(feeX)
        return total.toLocaleString()
    }

    private bigToBN(val: Big, denomination: number) {
        return new BN(val.mul(Math.pow(10, denomination)).toString())
    }

    private utxoToAddressBalances(utxo: AVMUTXO | PlatformUTXO, chainID: 'X' | 'P') {
        const out = utxo.getOutput() as AmountOutput
        const addrs = out.getAddresses()
        const hrp = ava.getHRP()
        const id = chainID
        const addrsClean = addrs.map((addr) => bintools.addressToString(hrp, id, addr))

        const assetID = utxo.getAssetID()
        const idClean = bintools.cb58Encode(assetID)
        const asset =
            this.$store.state.Assets.assetsDict[idClean] ||
            this.$store.state.Assets.nftFamsDict[idClean]

        this.asset = asset

        const denom = asset.denomination
        const bn = out.getAmount()
        const amount = bnToBig(bn, denom)

        return {
            chainID,
            addresses: addrsClean,
            amount,
        }
    }

    public async scanForFunds() {
        this.tempMnemonicWallet = undefined
        this.balances = []
        this.asset = null
        this.isScanning = true
        const result = await WalletHelper.scanForHdFunds(this.wallet)
        this.isScanning = false

        if (result?.UTXOs?.length) {
            for (const utxo of result.UTXOs) {
                this.balances.push(this.utxoToAddressBalances(utxo, 'X'))
            }
        }

        if (result?.platformUTXOs?.length) {
            for (const utxo of result.platformUTXOs) {
                this.balances.push(this.utxoToAddressBalances(utxo, 'P'))
            }
        }

        this.tempMnemonicWallet = result?.wallet
        this.$refs.modal.open()
    }

    public async consolidateFunds() {
        try {
            const txIds = []
            for (const chainId of ['P', 'X']) {
                const fee = bnToBig(
                    chainId === 'P' ? ava.PChain().getTxFee() : ava.XChain().getTxFee(),
                    this.asset?.denomination
                )
                const toAddress =
                    chainId === 'P'
                        ? this.wallet.getCurrentAddressPlatform()
                        : this.wallet.getCurrentAddressAvm()

                const chainBalances = this.balances.filter((bal) => bal.chainID === chainId)
                let total = new Big(0)
                for (const bal of chainBalances) {
                    total = total.plus(bal.amount)
                }

                // If less than fee then skip
                if (Number(total?.toPrecision()) <= Number(fee.toPrecision())) {
                    continue
                }
                // Remove the fee
                total = total.minus(fee)

                const transaction: ITransaction = {
                    uuid: uuidv1(),
                    amount: this.bigToBN(total, this.asset?.denomination),
                    asset: this.asset,
                }

                const id = await WalletHelper.issueBatchTx(
                    this.tempMnemonicWallet as MnemonicWallet,
                    chainId as ChainIdType,
                    [transaction],
                    toAddress,
                    Buffer.from('consolidate funds')
                )
                txIds.push({ id, chainId })
            }

            const lastTx = txIds[txIds.length - 1]
            this.waitTxConfirm(lastTx.id, lastTx.chainId as any)
            this.isProcessing = true
        } catch (err) {
            console.error(err)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.consolidate_funds_error'),
                type: 'error',
            })
            this.isProcessing = false
            this.$refs.modal.close()
        }
    }

    async waitTxConfirm(txId: string, chainId: 'X' | 'P') {
        let status =
            chainId === 'P'
                ? await ava.PChain().getTxStatus(txId)
                : await ava.XChain().getTxStatus(txId)

        if (status === 'Unknown' || status === 'Processing') {
            // if not confirmed ask again
            setTimeout(() => {
                this.waitTxConfirm(txId, chainId)
            }, 500)
        } else if (status === 'Dropped') {
            // If dropped stop the process
            this.helpers.dispatchNotification({
                message: this.$t('notifications.consolidate_funds_error'),
                type: 'error',
            })
            this.isProcessing = false
            this.$refs.modal.close()
        } else {
            // Success case
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
            this.$store.dispatch('updateBalances')

            this.helpers.dispatchNotification({
                message: this.$t('notifications.consolidate_funds_success'),
                type: 'success',
            })
            this.isProcessing = false
            this.$refs.modal.close()
        }
    }
}
</script>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.description {
    margin-bottom: 14px !important;
}
</style>
