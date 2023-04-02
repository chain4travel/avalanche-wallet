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
import { bintools } from '@/AVA'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'

@Component
export default class MultisigTx extends Vue {
    @Prop() txId!: string
    signing = false
    issueing = false

    get tx(): SignavaultTx | undefined {
        const hexTxId = bintools.cb58Decode(this.txId).toString('hex')
        return this.$store.getters['Signavault/transaction'](hexTxId)
    }

    get txState(): number {
        return this.tx?.state ?? -1
    }

    async sign() {
        const wallet = this.$store.state.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')

        if (!this.tx) return console.log('MultiSigTx::sign: Invalid Tx')

        this.signing = true
        try {
            await wallet.addSignatures(this.tx?.tx)
            this.$store.dispatch('Notifications/add', {
                title: 'Multisignature',
                message: 'Signature recorded.',
            })
            setTimeout(() => {
                this.$store
                    .dispatch('Signavault/updateTransaction')
                    .then(() => this.$store.dispatch('History/updateMultisigTransactionHistory'))
            }, 3000)
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
            await wallet.issueExternal(this.tx?.tx)
            this.$store.dispatch('Notifications/add', {
                title: 'Multisignature',
                message: 'Transaction issued.',
            })
            setTimeout(() => {
                this.$store
                    .dispatch('Signavault/updateTransaction')
                    .then(() => this.$store.dispatch('History/updateTransactionHistory'))
            }, 3000)
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
