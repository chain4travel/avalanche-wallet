<template>
    <div style="word-break: break-all">
        <br />
        <div class="container">
            <div v-if="!!claimTxDetails" class="transaction_details">
                <h4>{{ $t('validator.transaction_reward.title') }}</h4>
                <div v-if="claimTxDetails?.nodeId">
                    <label>{{ $t('earn.validate.confirmation.id') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.nodeId }}</p>
                </div>
                <div v-if="claimTxDetails?.from">
                    <label>{{ $t('validator.transaction_reward.from') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.from }}</p>
                </div>
                <div v-if="claimTxDetails?.rewardAddress">
                    <label>{{ $t('validator.transaction_reward.reward_address') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.rewardAddress }}</p>
                </div>
                <div v-if="claimTxDetails?.startDate">
                    <label>{{ $t('validator.transaction_reward.start_date') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.startDate }}</p>
                </div>
                <div v-if="claimTxDetails?.endDate">
                    <label>{{ $t('validator.transaction_reward.end_date') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.endDate }}</p>
                </div>
                <div v-if="claimTxDetails?.stakeAmount">
                    <label>{{ $t('validator.transaction_reward.stake_amount') }}</label>
                    <p style="word-break: break-all">{{ claimTxDetails?.stakeAmount }}</p>
                </div>
            </div>
            <div v-if="!!txDetails" class="transaction_details">
                <h4>{{ $t('validator.transaction_reward.title') }}</h4>
                <div v-if="txDetails?.nodeId">
                    <label>{{ $t('earn.validate.confirmation.id') }}</label>
                    <p style="word-break: break-all">{{ txDetails?.nodeId }}</p>
                </div>
                <div v-if="txDetails?.amount">
                    <label>{{ $t('earn.validate.confirmation.amount') }}</label>
                    <p>{{ txDetails?.amount }} {{ nativeAssetSymbol }}</p>
                </div>
                <div v-if="txDetails?.expirationDate">
                    <label>{{ $t('earn.validate.confirmation.start') }}</label>
                    <p>{{ txDetails?.expirationDate }}</p>
                </div>
                <div v-if="txDetails?.endDate">
                    <label>{{ $t('earn.validate.confirmation.end') }}</label>
                    <p>{{ txDetails?.endDate }}</p>
                </div>
                <div v-if="txDetails?.expirationDate">
                    <label>{{ $t('earn.validate.confirmation.transaction_end') }}</label>
                    <p>{{ txDetails?.expirationDate }}</p>
                </div>
            </div>
            <div class="signatures">
                <div class="signatures_container">
                    <div class="signer_row" v-for="owner in txOwners" :key="owner.address">
                        <fa
                            v-if="!!owner.signature"
                            class="success_status"
                            icon="check-circle"
                        ></fa>
                        <div v-else class="dashed_circle"></div>
                        <div>
                            <p class="body_text">{{ owner.address }}</p>
                            <p v-if="!!owner.signature" class="success_status">
                                ({{ $t('earn.validate.pending_multisig.signed') }})
                            </p>
                            <p v-else class="pending_status">
                                ({{ $t('earn.validate.pending_multisig.pending') }})
                            </p>
                        </div>

                        <CamBtn
                            v-if="!Boolean(owner?.signature) && isMyWallet(owner?.address)"
                            class="button_secondary"
                            @click="sign"
                            :loading="loadingSigning"
                            depressed
                            variant="accent"
                            style="margin-left: auto"
                        >
                            {{ $t('earn.validate.pending_multisig.sign') }}
                        </CamBtn>
                    </div>

                    <h4 class="mt2" style="word-break: break-word">
                        {{
                            $t('earn.validate.pending_multisig.threshold', {
                                value: sigValue,
                                threshold: multisigTx?.tx.threshold,
                            })
                        }}
                    </h4>
                    <Alert v-if="SignStatus" variant="positive">
                        {{ $t('earn.validate.pending_multisig.already_signed') }}
                    </Alert>
                    <Alert v-else variant="warning">
                        {{ $t('earn.validate.pending_multisig.sign_transaction') }}
                    </Alert>
                </div>
                <div class="signatures_buttons">
                    <CamBtn @click="abort" variant="negative">
                        <Spinner v-if="loadingIssue" class="spinner"></Spinner>
                        <span v-else>
                            {{ $t('earn.rewards.abort_modal.abort') }}
                        </span>
                    </CamBtn>
                    <CamBtn @click="issue" variant="primary" :disabled="!canExecuteMultisigTx">
                        <Spinner v-if="loadingIssue" class="spinner"></Spinner>
                        <span v-else>
                            {{ $t('earn.validate.pending_multisig.execute_transaction') }}
                        </span>
                    </CamBtn>
                </div>
            </div>
        </div>
        <ModalAbortSigning
            ref="modal_abort_signing"
            :title="$t('validator.abort_transaction.title')"
            :modalText="$t('earn.rewards.abort_modal.message')"
            @cancelTx="cancelMultisigTx"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import Spinner from '@/components/misc/Spinner.vue'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { UnsignedTx, AddValidatorTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import Big from 'big.js'
import { ValidatorRaw } from '@/components/misc/ValidatorList/types'
import moment from 'moment'
import ModalAbortSigning from '../ModalAbortSigning.vue'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'

@Component({
    components: {
        Spinner,
        ModalAbortSigning,
        CamBtn,
        Alert,
    },
})
export default class PendingMultisig extends Vue {
    @Prop() multisigTx!: SignavaultTx
    @Prop() nodeId!: string
    @Prop() nodeInfo!: ValidatorRaw
    @Prop() successMessageForIssue!: string

    $refs!: {
        modal_abort_signing: ModalAbortSigning
    }

    // @ts-ignore
    helpers = this.globalHelper()
    loading = false
    loadingSigning = false
    loadingIssue = false

    get sigValue() {
        return this.multisigTx?.tx.owners?.filter((owner) => !!owner.signature)?.length
    }

    get txOwners() {
        return this.multisigTx?.tx?.owners ?? []
    }

    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
    }

    get txState(): number {
        return this.multisigTx?.state ?? -1
    }

    get SignStatus(): boolean {
        let isSigned = false
        this.txOwners.forEach((owner) => {
            if (
                this.activeWallet.wallets.find((w) => w?.getAllAddressesP()?.[0] === owner.address)
            ) {
                if (owner.signature) isSigned = true
            }
        })
        return isSigned
    }
    get canExecuteMultisigTx(): boolean {
        let signers = 0
        let threshold = this.multisigTx?.tx?.threshold
        this.txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }
    get txDetails() {
        let unsignedTx = new UnsignedTx()
        unsignedTx.fromBuffer(Buffer.from(this.multisigTx?.tx?.unsignedTx, 'hex'))
        const utx = unsignedTx.getTransaction()
        if (utx?.getTypeName() === 'CaminoAddValidatorTx') {
            const tx = utx as AddValidatorTx

            return {
                nodeId: this.nodeId,
                endDate: new Date(tx?.getEndTime()?.toNumber() * 1000).toLocaleString(),
                expirationDate: new Date(String(this.multisigTx.tx.expiration)).toLocaleString(),
                amount: Big(tx.getStakeAmount()?.toString()).div(Math.pow(10, 9)),
            }
        }

        return undefined
    }

    get claimTxDetails() {
        let unsignedTx = new UnsignedTx()
        unsignedTx.fromBuffer(Buffer.from(this.multisigTx?.tx?.unsignedTx, 'hex'))
        const utx = unsignedTx.getTransaction()
        if (
            utx?.getTypeName() === 'ClaimTx' &&
            this.nodeInfo !== undefined &&
            this.nodeInfo !== null
        ) {
            let startDate =
                this.multisigTx.tx.timestamp != undefined ? this.multisigTx.tx.timestamp : ''
            let endDate: string =
                this.multisigTx.tx.expiration != undefined ? this.multisigTx.tx.expiration : ''

            let dateTimeStart =
                startDate != ''
                    ? moment(new Date(this.multisigTx.tx.timestamp)).format('DD/MM/YYYY')
                    : ''
            let dateTimeEnd =
                endDate != ''
                    ? moment(new Date(this.multisigTx.tx.timestamp)).format('DD/MM/YYYY')
                    : ''

            return {
                nodeId: this.nodeId,
                from: this.nodeInfo.rewardOwner.addresses[0],
                rewardAddress: this.multisigTx.tx.alias,
                startDate: dateTimeStart,
                endDate: dateTimeEnd,
                stakeAmount: parseFloat(this.nodeInfo.stakeAmount) / 1000000000,
            }
        }

        return undefined
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    async sign() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.multisigTx) return console.debug('MultiSigTx::sign: Invalid Tx')
        this.loadingSigning = true
        try {
            await wallet.addSignatures(this.multisigTx?.tx)
            this.helpers.dispatchNotification({
                message: 'Your signature saved successfully!',
                type: 'success',
            })
            this.$store.dispatch('Signavault/updateTransaction')

            try {
                if (this.claimTxDetails) {
                    this.refresh()
                }
            } catch (e) {
                console.error(e)
            }
        } catch (e: any) {
            this.helpers.dispatchNotification({
                message: 'Your signature is not saved.',
                type: 'error',
            })
        } finally {
            this.loadingSigning = false
        }
    }

    async issue() {
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.log('MultiSigTx::sign: Invalid wallet')
        if (!this.multisigTx) return console.log('MultiSigTx::sign: Invalid Tx')
        this.loadingIssue = true
        try {
            await wallet.issueExternal(this.multisigTx?.tx)

            if (this.claimTxDetails) {
                this.helpers.dispatchNotification({
                    message: this.$t('validator.transaction_reward.claimed_tx_issued', {
                        symbol: this.nativeAssetSymbol,
                    }),
                    type: 'success',
                })
            } else {
                this.helpers.dispatchNotification({
                    message: this.$t('notifications.register_node_success'),
                    type: 'success',
                })
            }

            this.$store.dispatch('Signavault/updateTransaction')
            this.$emit('issued', 'issued')
        } catch (e: any) {
            console.log(e)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error', {
                    error: `:` + e?.response?.data?.error?.split(':')[2] ?? '',
                }),
                type: 'error',
            })
        }
        this.loadingIssue = false
    }

    isMyWallet(pAddress: string): boolean {
        return !!this.activeWallet.wallets.find((w) => w?.getAllAddressesP()?.[0] === pAddress)
    }

    refresh() {
        this.$emit('refresh')
    }

    async abort() {
        this.$refs.modal_abort_signing.open()
    }

    async cancelMultisigTx() {
        let messageCancelled = this.$t('validator.abort_transaction.cancelled').toString()
        let messageFailed = this.$t('validator.abort_transaction.failed').toString()
        try {
            const wallet = this.activeWallet as MultisigWallet

            if (this.multisigTx) {
                // cancel from the wallet
                await wallet.cancelExternal(this.multisigTx?.tx)
                await this.$store.dispatch('Signavault/updateTransaction')

                this.helpers.dispatchNotification({
                    message: messageCancelled,
                    type: 'success',
                })
                this.refresh()
            }
        } catch (err) {
            console.log(err)
            this.helpers.dispatchNotification({
                message: messageFailed,
                type: 'error',
            })
        }
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/variables';

.container {
    display: flex;
    gap: 2rem;
}

.signatures {
    // flex-basis: 65%;
    order: 1;
}

.signatures_buttons {
    display: flex;
    margin-left: auto;
    width: fit-content;
    gap: 1rem;
    margin-top: 1.5rem;
}

.transaction_details {
    width: 600px;
    order: 2;

    > div {
        background-color: var(--bg-light);
        margin: 14px 0;
        padding: 6px 14px;
        border-radius: var(--border-radius-sm);

        label {
            font-size: 14px;
            color: var(--primary-color-light);
        }

        p {
            font-size: 16px;
        }
    }

    .err {
        font-size: 14px;
    }
}

.dashed_circle {
    min-height: 20px;
    min-width: 20px;
    background-color: transparent;
    border-radius: 50%;
    border: 3px dashed;
    border-color: var(--warning);
}

.signer_row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.success_status {
    color: var(--success);
}

.pending_status {
    color: var(--warning);
}

.refresh {
    width: 20px;
    height: 20px;

    .v-icon {
        color: var(--primary-color);
    }

    button {
        outline: none !important;
    }

    img {
        object-fit: contain;
        width: 100%;
    }

    .spinner {
        color: var(--primary-color) !important;
    }
}

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;
}

.body_text {
    word-break: break-all;
}

.mt2 {
    margin: 2rem 0 1rem 0;
}

@media screen and (max-width: 1200px) {
    .container {
        flex-direction: column;
        gap: 1rem;
    }

    .signatures {
        order: 2;
    }

    .transaction_details {
        width: 100%;
        order: 1;
    }
}
</style>
