<template>
    <div class="msig-edit__container">
        <h1>{{ $t('edit_multisig.title') }}</h1>
        <div class="msig-create__form">
            <div class="input-container">
                <h3>{{ $t('create_multisig.name') }}</h3>
                <div class="input-with-warning">
                    <CamInput
                        v-model="multisigName"
                        :placeholder="$t('create_multisig.name')"
                        :error="nameLengthError"
                        :errorMessage="$t('create_multisig.errors.msig_name')"
                        :disabled="mode !== 'EDIT'"
                    />
                    <Alert variant="warning" v-if="mode === 'EDIT'">
                        {{ $t('create_multisig.alert.wize_name') }}
                    </Alert>
                </div>
            </div>

            <div class="input-container">
                <h3>{{ $t('create_multisig.co-owners') }}</h3>
                <div v-for="(address, index) in addresses" :key="index" class="multisig_address">
                    <div class="circle number">{{ index + 1 }}</div>
                    <div class="address-input">
                        <CamInput
                            class="full-width-input"
                            :placeholder="`Owner ${index + 1} Address`"
                            v-model="address.address"
                            :disabled="mode !== 'EDIT'"
                        />
                        <CamInput
                            class="msig-address-name"
                            :placeholder="index === 0 ? 'My Address' : `Owner ${index + 1} Name`"
                            v-model="address.name"
                            :disabled="mode !== 'EDIT'"
                        />
                    </div>
                    <button
                        @click="removeAddress(index)"
                        class="circle delete-button"
                        v-if="mode === 'EDIT'"
                    >
                        <fa icon="minus"></fa>
                    </button>
                </div>

                <div class="add-new-address" v-if="addresses.length < 128 && mode === 'EDIT'">
                    <div class="circle number">{{ addresses.length + 1 }}</div>
                    <div class="add-new-address--button">
                        <button @click="addAddress" class="circle plus-button">
                            <fa icon="plus"></fa>
                        </button>
                    </div>
                </div>

                <Alert variant="negative" v-if="multipleSameAddresses">
                    {{ $t('create_multisig.errors.same_address_twice') }}
                </Alert>
            </div>

            <div class="divider"></div>

            <div class="input-container">
                <h3>Multisignature Threshold</h3>
                <CamInput
                    class="threshold-input"
                    placeholder="Multisignature Threshold"
                    v-model.number="threshold"
                    :disabled="mode !== 'EDIT'"
                />
            </div>
        </div>

        <div class="divider" v-if="mode === 'SIGNING_DELETE'"></div>

        <div class="delete_info" v-if="mode === 'SIGNING_DELETE'">
            <h3>Please Add P-Chain Address to send the remaining funds to:</h3>
            <CamInput
                v-model="remainingFundsAddress"
                :placeholder="`P-Chain Address`"
                class="msig-remaining-funds-input"
            />
            <span>
                2 of 3 Multisignatures co-owners have already signed this transaction. In total,
                {{ threshold }} signatures are required to enable execution of this transaction.
            </span>
            <Alert variant="info">You already signed this transaction.</Alert>
        </div>

        <div class="alert-action_buttons">
            <div class="action_buttons" v-if="needSignatures() && alreadySigned()">
                <button class="camino__negative--button" @click="abortEditMsig">Abort</button>
                <button class="camino__primary--button" @click="signEditMsig" disabled>
                    Signed {{ numberOfSignatures }} out of {{ threshold }} required signatures
                </button>
            </div>

            <div class="action_buttons" v-else-if="needSignatures() && !alreadySigned()">
                <button class="camino__negative--button" @click="abortEditMsig">Abort</button>
                <button class="camino__primary--button" @click="signMultisigTx">
                    Sign edited multisignature wallet
                </button>
            </div>

            <div class="action_buttons" v-else-if="canExecuteMultisigTx()">
                <button class="camino__negative--button" @click="abortEditMsig">Abort</button>
                <button class="camino__primary--button" @click="signEditMsig">
                    Execute transaction
                </button>
            </div>

            <div class="action_buttons" v-else-if="mode === 'VIEW'">
                <!-- <button class="camino__negative--button" @click="deleteMsig">
                    Delete multisignature wallet
                </button> -->
                <button class="camino__primary--button" @click="startEditMsig">
                    Edit multisignature wallet
                </button>
            </div>

            <div class="action_buttons" v-else-if="mode === 'EDIT'">
                <button class="camino__negative--button" @click="cancelEditMsig">Cancel</button>
                <button class="camino__primary--button" @click="saveEditMsig">
                    Save multisignature wallet
                </button>
            </div>

            <div class="action_buttons" v-else-if="mode === 'SIGNING_EDIT'">
                <button class="camino__negative--button" @click="abortEditMsig">Abort</button>
                <button class="camino__primary--button" @click="signEditMsig">
                    Sign edited multisignature wallet
                </button>
            </div>

            <!-- <div class="action_buttons" v-else-if="mode === 'SIGNING_DELETE'">
                <button class="camino__negative--button" @click="abortEditMsig">Abort</button>
                <button class="camino__primary--button" @click="signEditMsig">
                    Delete multisignature wallet (execute transaction)
                </button>
            </div> -->

            <Alert variant="warning" v-if="mode !== 'VIEW'">
                {{ $t('create_multisig.disclamer', { fee: feeAmt, symbol: nativeAssetSymbol }) }}
            </Alert>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { WalletType } from '@/js/wallets/types'
import { ava, bintools } from '@/AVA'
import { BN } from '@c4tplatform/caminojs'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletHelper } from '../helpers/wallet_helper'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ModelMultisigTxOwner } from '@c4tplatform/signavaultjs'
import { MultisigAliasTx } from '@c4tplatform/caminojs/dist/apis/platformvm/multisigaliastx'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'
import { AvaNetwork } from '@/js/AvaNetwork'
import AvaAsset from '@/js/AvaAsset'
import Alert from '@/components/Alert.vue'
import CamInput from '@/components/CamInput.vue'

@Component({
    components: {
        Alert,
        CamInput,
    },
})
export default class EditMultisigWallet extends Vue {
    multisigName: string = ''
    threshold: number = 1
    addresses: { address: string; name: string }[] = []
    mode: 'EDIT' | 'DELETE' | 'VIEW' | 'SIGNING_DELETE' | 'SIGNING_EDIT' = 'VIEW'
    remainingFundsAddress: string = ''

    @Watch('activeWallet')
    async onModeChange() {
        this.mode = 'VIEW'
    }

    @Watch('activeNetwork')
    async onNetworkChange() {
        this.mode = 'VIEW'
    }

    mounted() {
        this.getAliasInfos()
    }

    updateBalance(): void {
        this.$store.dispatch('updateBalances')
    }

    get activeWallet(): SingletonWallet | MultisigWallet {
        return this.$store?.state?.activeWallet
    }

    get nameLengthError() {
        const bytes = new TextEncoder().encode(this.multisigName)
        return bytes.length > 64
    }

    get multipleSameAddresses(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')
        const uniqueAddresses = new Set(filledAddresses.map((a) => a.address))

        return uniqueAddresses.size !== filledAddresses.length
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
    }

    get walletType(): WalletType | string {
        return this.activeWallet?.type
    }

    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get ava_asset(): AvaAsset | null {
        return this.$store.getters['Assets/AssetAVA']
    }

    get numberOfSignatures(): number {
        let signers = 0
        this.txOwners().forEach((owner) => {
            if (owner.signature) signers++
        })
        return signers
    }

    get pendingSendMultisigTX(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.activeWallet.getAllAddressesP()[0] &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'MultisigAliasTx'
        )
    }

    @Watch('activeWallet')
    async getAliasInfos() {
        if (this.pendingSendMultisigTX) this.setAliasInfoFromPendingTx()
        else await this.setAliasInfoFromActiveWallet()

        await this.assignSavedAddressNames()
    }

    async setAliasInfoFromPendingTx() {
        const hrp = ava.getHRP()
        let unsignedTx = new UnsignedTx()
        unsignedTx.fromBuffer(Buffer.from(this.pendingSendMultisigTX.tx?.unsignedTx, 'hex'))

        const utx = unsignedTx.getTransaction() as MultisigAliasTx
        const alias = utx.getMultisigAlias()

        this.multisigName = alias.getMemo().toString()
        this.threshold = alias.getOwners().getThreshold()
        this.addresses = alias
            .getOwners()
            .getOutput()
            .getAddresses()
            .map((address) => {
                return { address: bintools.addressToString(hrp, 'P', address), name: '' }
            })
    }

    async setAliasInfoFromActiveWallet() {
        const msigAlias = this.activeWallet.getStaticAddress('P')
        const msigData = await ava.PChain().getMultisigAlias(msigAlias)

        this.multisigName = Buffer.from(msigData.memo.replace('0x', ''), 'hex').toString()
        this.threshold = msigData.threshold
        this.addresses = msigData.addresses.map((address) => ({
            address,
            name: '',
        }))
    }

    async assignSavedAddressNames() {
        const savedAddresses = await this.getSavedMultisignatureAddresses()
        this.addresses = this.addresses.map((address) => {
            const savedAddress = savedAddresses.find((a) => a.address === address.address)
            if (savedAddress) {
                address.name = savedAddress.name
            }
            return address
        })
    }

    async getSavedMultisignatureAddresses() {
        const localStorageAccountIndex = this.$store.state.Accounts.accountIndex
        let accounts = JSON.parse(localStorage.getItem('accounts') || '[]')

        // Check if the account and multisignature property exist.
        if (
            accounts[localStorageAccountIndex] &&
            accounts[localStorageAccountIndex].multisignatures
        ) {
            const lastMultisignature = accounts[localStorageAccountIndex].multisignatures.slice(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                -1
            )[0]

            const msigAlias = this.activeWallet.getStaticAddress('P')
            const msigData = await ava.PChain().getMultisigAlias(msigAlias)

            // console.log('addressesInfo', msigData)
            if (lastMultisignature) return lastMultisignature.addresses
        }

        return []
    }

    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }

    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '', name: '' })
    }

    removeAddress(index: number): void {
        if (index === 0) return

        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) {
            this.addAddress()
        }
    }

    deleteMsig(): void {
        this.mode = 'SIGNING_DELETE'
        console.log('deleteMsig')
    }

    startEditMsig(): void {
        this.mode = 'EDIT'
        console.log('startEditMsig')
    }

    txOwners(): ModelMultisigTxOwner[] | [] {
        return this.pendingSendMultisigTX?.tx?.owners ?? []
    }

    canExecuteMultisigTx(): boolean {
        let signers = 0
        let threshold = this.pendingSendMultisigTX?.tx?.threshold
        const txOwners = this.txOwners()

        txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }

    needSignatures(): boolean {
        let threshold = this.pendingSendMultisigTX?.tx?.threshold
        let numberOfSignatures = this.numberOfSignatures

        if (threshold && numberOfSignatures < threshold) return true
        return false
    }

    alreadySigned(): boolean {
        const txOwners = this.txOwners()
        if (!txOwners || txOwners.length === 0) return false

        const walletAddresses = (this.activeWallet as MultisigWallet)?.wallets?.map(
            (w) => w?.getAllAddressesP()?.[0]
        )
        if (!walletAddresses) return false

        const isSigned = txOwners.some((owner) => {
            if (!owner) return false
            const isOwnerSigned = owner.signature && walletAddresses.includes(owner.address)
            return isOwnerSigned
        })

        return isSigned
    }

    async saveEditMsig() {
        // @ts-ignore
        const { dispatchNotification } = this.globalHelper()
        const filteredAddresses = this.addresses
            .filter((address) => address.address !== '')
            .map((address) => address.address)

        const alias = this.activeWallet.getStaticAddress('P')

        if (!this.pendingSendMultisigTX) {
            try {
                const result = await WalletHelper.sendMultisigAliasTxUpdate(
                    this.activeWallet as MultisigWallet,
                    filteredAddresses,
                    this.multisigName,
                    this.threshold,
                    alias
                )
                console.log('pendingSendMultisigTX', this.pendingSendMultisigTX)
                console.log('result', result)

                if (!result) {
                    // multisig workflow
                    await this.$store.dispatch('Signavault/updateTransaction')
                    dispatchNotification({
                        message: this.$t('notifications.transfer_success_msg'),
                        type: 'success',
                    })
                    return this.updateMultisigTxDetails()
                }

                this.updateBalance()
                this.updateMultisigTxDetails()
                await this.$store.dispatch('Signavault/updateTransaction')
                dispatchNotification({
                    message: this.$t('notifications.transfer_success_msg'),
                    type: 'success',
                })
            } catch (err) {
                if (err instanceof SignatureError) {
                    this.$store.dispatch('Signavault/updateTransaction')
                } else {
                    console.error('Error sending multisig:', err)
                    dispatchNotification({
                        message: this.$t('notifications.something_went_wrong'),
                        type: 'error',
                    })
                }
            }
        } else {
            await this.issueMultisigTx()
            await this.getAliasInfos()
            console.log('issueMultisigTx')
            console.log('pendingSendMultisigTX', this.pendingSendMultisigTX)
        }
    }

    async cancelEditMsig() {
        await this.getAliasInfos()
        this.mode = 'VIEW'
    }

    async abortEditMsig() {
        try {
            const wallet = this.activeWallet as MultisigWallet
            if (this.pendingSendMultisigTX) {
                await wallet.cancelExternal(this.pendingSendMultisigTX?.tx)
                await this.$store.dispatch('Signavault/updateTransaction')
                this.getAliasInfos()
                this.mode = 'VIEW'
            }
        } catch (err) {
            console.error(err)
        }
    }

    async signEditMsig() {
        await this.saveEditMsig()
        this.mode = 'VIEW'
    }

    async signMultisigTx() {
        // @ts-ignore
        const helpers = this.globalHelper()
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.debug('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.debug('MultiSigTx::sign: Invalid Tx')
        try {
            await wallet.addSignatures(this.pendingSendMultisigTX?.tx)
            helpers.dispatchNotification({
                message: this.$t('notifications.multisig_transaction_saved'),
                type: 'success',
            })
            this.$store.dispatch('Signavault/updateTransaction')
        } catch (e: any) {
            helpers.dispatchNotification({
                message: this.$t('multisig_transaction_not_saved'),
                type: 'error',
            })
        }
    }

    async issueMultisigTx() {
        // @ts-ignore
        let { dispatchNotification } = this.globalHelper()
        const wallet = this.activeWallet
        if (!wallet || !(wallet instanceof MultisigWallet))
            return console.error('MultiSigTx::sign: Invalid wallet')
        if (!this.pendingSendMultisigTX) return console.error('MultiSigTx::sign: Invalid Tx')
        try {
            await this.updateMultisigTxDetails()
            await wallet.issueExternal(this.pendingSendMultisigTX?.tx)
            this.$store.dispatch('Signavault/updateTransaction')
            dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_success'),
                type: 'success',
            })
        } catch (e: any) {
            console.error('MultiSigTx::sign: Error', e)
            dispatchNotification({
                message: this.$t('notifications.execute_multisig_transaction_error'),
                type: 'error',
            })
            throw e
        }
    }

    async updateMultisigTxDetails() {
        const msigAlias = this.activeWallet.getStaticAddress('P')
        const msigData = await ava.PChain().getMultisigAlias(msigAlias)

        this.multisigName = Buffer.from(msigData.memo.replace('0x', ''), 'hex').toString()
        this.threshold = msigData.threshold
        this.addresses = msigData.addresses.map((address) => {
            return { address, name: '' }
        })

        const savedAddresses = await this.getSavedMultisignatureAddresses()
        this.addresses = this.addresses.map((address) => {
            const savedAddress = savedAddresses.find(
                (a: { address: string; name: string }) => a.address === address.address
            )
            if (savedAddress) {
                address.name = savedAddress.name
            }
            return address
        })
    }
}
</script>

<style scoped lang="scss">
@use '../styles/abstracts/mixins';
.msig-edit {
    &__container {
        margin-top: 4rem;
        margin-bottom: 4rem;
        height: 100%;
        color: var(--primary-color);
        gap: 1rem;
        h1 {
            color: var(--camino-slate-slate-white);
            font-family: Inter;
            font-size: 28px;
            font-style: normal;
            font-weight: 600;
            line-height: 36px;
            margin-bottom: 20px;
            padding: 16px 0px 0px 0px;
        }
    }
    &__form {
        gap: 16px;
        display: flex;
        flex-direction: column;
    }
}

.input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    h3 {
        color: var(--camino-slate-slate-white);
        font-family: Inter;
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: 32px;
    }
}

input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--camino-slate-slate-600, #475569);
    &:focus {
        border-color: var(--camino-brand-too-blue-to-be-true);
        box-shadow: 0px 0px 0px 3px var(--camino-brand-too-blue-to-be-true-100);
    }
}

.full-width-input {
    flex: 1;
}

.input-with-warning {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.warning {
    color: var(--warning);
    font-size: 13px;
}

.error-message {
    color: var(--error);
}

.address-input {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 1rem;
    width: calc(100% - 51px);
}

.msig-address-name {
    width: 100%;
    max-width: 250px;
}

.multisig_address {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.circle {
    border: var(--primary-border);
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 100%;
    border-width: 2px;
    padding: 10px;
}

.number {
    width: 35px !important;
    height: 35px !important;
    cursor: default;
}

.plus-button {
    font-size: 10px;
    width: 40px !important;
    height: 40px !important;
}

.add-new-address {
    display: flex;
    align-items: center;
    gap: 1rem;
    &__button {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }
}

.divider {
    margin-top: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--bg-light);
}

.action-buttons {
    margin-left: auto;
    flex-direction: column;
    justify-content: flex-end;
    display: flex;
    // flex-direction: column;
    flex-direction: row;
    align-items: flex-end;
    max-width: fit-content;
    margin-top: 1rem;
    gap: 0.5rem;
    width: auto;
}

.alert-action_buttons {
    display: flex;
    flex-direction: column;
    margin: 0.5rem 0rem 0.5rem 0rem;
    gap: 0.5rem;

    & > * {
        margin-left: auto;
        justify-content: flex-end;
    }
}

.action_buttons {
    display: flex;
    gap: 0.5rem;
    margin: 0.5rem 0rem 0.5rem 0rem;
}

.delete_info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

[data-theme='day'] {
    h1,
    h3 {
        color: var(--camino-slate-slate-950, #020617);
    }
}

@include mixins.mobile-device {
    .address-input {
        flex-direction: column;
    }

    .msig-address-name {
        width: 100%;
        max-width: 100%;
    }
}
</style>
<style lang="scss">
@use '../styles/abstracts/mixins';
.msig-threshold-input,
.msig-remaining-funds-input {
    width: 100%;
    input {
        max-width: 900px;
    }
}

@include mixins.mobile-device {
    .msig-threshold-input {
        width: 100%;
        input {
            max-width: 100%;
        }
    }
}
</style>
