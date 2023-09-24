<template>
    <div class="msig-create--container">
        <h1>{{ $t('create_multisig.title') }}</h1>
        <div class="msig-create--form">
            <div class="input-container">
                <h3>{{ $t('create_multisig.name') }}</h3>
                <div class="input-with-warning">
                    <CamInput
                        v-model="multisigName"
                        :placeholder="$t('create_multisig.name')"
                        :error="nameLengthError"
                        :errorMessage="$t('create_multisig.errors.msig_name')"
                        :disabled="showCreateButton"
                    />
                    <Alert variant="warning">
                        {{ $t('create_multisig.alert.wize_name') }}
                    </Alert>
                </div>
            </div>

            <div class="input-container">
                <h3 style="margin-top: 10px">{{ $t('create_multisig.co-owners') }}</h3>
                <div v-for="(address, index) in addresses" :key="index" class="multisig_address">
                    <div class="circle number">{{ index + 1 }}</div>
                    <div class="address-input">
                        <CamInput
                            class="full-width-input"
                            :placeholder="`Owner ${index + 1} Address`"
                            v-model="address.address"
                            :error="!isValidAddress(address.address)"
                            :disabled="showCreateButton"
                        />
                        <CamInput
                            class="msig-address-name"
                            :placeholder="`Owner ${index + 1} Name`"
                            v-model="address.name"
                            :disabled="showCreateButton"
                        />
                    </div>
                </div>

                <div class="add-new-address" v-if="addresses.length < 128 && !showCreateButton">
                    <div class="circle number">{{ addresses.length + 1 }}</div>
                    <div class="add-new-address--button">
                        <cam-tooltipe :content="$t('edit_multisig.label.add_owner')">
                            <button @click="addAddress" class="circle plus-button">
                                <fa icon="plus"></fa>
                            </button>
                        </cam-tooltipe>
                    </div>
                </div>

                <Alert variant="negative" v-if="multupleSameAddresses">
                    {{ $t('create_multisig.errors.same_address_twice') }}
                </Alert>
                <Alert variant="negative" v-if="validAddressError">
                    {{ $t('edit_multisig.errors.invalid_addresses') }}
                </Alert>
            </div>

            <div class="input-container">
                <div class="divider"></div>
                <h3>{{ $t('create_multisig.threshold') }}</h3>
                <CamInput
                    class="msig-threshold-input"
                    :placeholder="$t('create_multisig.threshold')"
                    v-model="threshold"
                    :error="thresholdError !== ''"
                    :errorMessage="getThresholdErrorMessage"
                    :disabled="showCreateButton"
                />
            </div>
        </div>

        <div class="action-buttons">
            <button
                v-if="showCreateButton === false"
                class="camino__primary--button"
                @click="showCreateButton = true"
                :disabled="disableMsigCreation"
            >
                {{ $t('create_multisig.confirm') }}
            </button>
            <div style="display: flex; gap: 1rem" v-if="showCreateButton === true">
                <CamBtn variant="primary" @click="createWallet" :disabled="disableMsigCreation">
                    {{ $t('create_multisig.create_multisig') }}
                </CamBtn>
                <CamBtn variant="transparent" @click="showCreateButton = false">
                    {{ $t('create_multisig.cancel') }}
                </CamBtn>
            </div>
            <Alert variant="warning">
                {{ $t('create_multisig.disclamer', { fee: feeAmt, symbol: nativeAssetSymbol }) }}
            </Alert>
        </div>
    </div>
</template>
<script lang="ts">
import { ava } from '@/AVA'
import Alert from '@/components/Alert.vue'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import CamTooltipe from '@/components/misc/CamTooltipe.vue'
import AvaAsset from '@/js/AvaAsset'
import { AvaNetwork } from '@/js/AvaNetwork'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { WalletType } from '@/js/wallets/types'
import { getMultisigAliasesFromTxId } from '@/utils/multisig'
import { BN } from '@c4tplatform/caminojs'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import { Component, Vue, Watch } from 'vue-property-decorator'
import { WalletHelper } from '../helpers/wallet_helper'
import { TranslateResult } from 'vue-i18n'
import { isValidPChainAddress } from '@/helpers/address_helper'

const MAX_ADDRESS_COUNT = 128
const UPDATE_ALIAS_TIMEOUT = 3000
const MAX_NAME_BYTE_SIZE = 64

@Component({
    components: {
        Alert,
        CamInput,
        CamBtn,
        CamTooltipe,
    },
})
export default class CreateMultisigWallet extends Vue {
    multisigName: string = ''
    addresses: { address: string; name: string }[] = [
        { address: this.getStaticPAddress(), name: 'My Address' },
        { address: '', name: '' },
    ]
    threshold: number = 1
    showCreateButton: boolean = false

    get activeWallet(): SingletonWallet | MultisigWallet {
        return this.$store?.state?.activeWallet
    }

    get walletType(): WalletType | string {
        return this.activeWallet?.type
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
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

    get multiSigAliases(): string[] {
        return this.$store.getters.multiSigAliases
    }

    get disableMsigCreation(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')
        const uniqueAddresses = new Set(filledAddresses.map((a) => a.address))

        return (
            !this.threshold ||
            filledAddresses.length === 0 ||
            uniqueAddresses.size !== filledAddresses.length ||
            this.thresholdError !== '' ||
            this.nameLengthError ||
            this.validAddressError
        )
    }

    get thresholdError() {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')
        const uniqueAddresses = new Set(filledAddresses.map((a) => a.address))
        const thresholdString = String(this.threshold)

        if (isNaN(this.threshold) || /[a-zA-Z]/.test(thresholdString)) return 'invalid'
        if (this.threshold <= 0) return 'nonpositive'

        return this.threshold > uniqueAddresses.size ? 'exceeds' : ''
    }

    get getThresholdErrorMessage(): TranslateResult {
        if (this.thresholdError === 'invalid') {
            return this.$t('edit_multisig.errors.invalid_threshold')
        }
        if (this.thresholdError === 'nonpositive') {
            return this.$t('edit_multisig.errors.non_positive_threshold')
        }
        return this.$t('edit_multisig.errors.threshold_exceeds_owners')
    }

    get nameLengthError() {
        const bytes = new TextEncoder().encode(this.multisigName)
        return bytes.length > MAX_NAME_BYTE_SIZE
    }

    get multupleSameAddresses(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')
        const uniqueAddresses = new Set(filledAddresses.map((a) => a.address))

        return uniqueAddresses.size !== filledAddresses.length
    }

    get validAddressError(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')

        for (const addressObj of filledAddresses) {
            if (!isValidPChainAddress(addressObj.address)) return true
        }

        return false
    }

    isValidAddress(address: string): boolean {
        if (!address) return true

        return isValidPChainAddress(address)
    }

    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }

    updateFirstAddress(): void {
        const newPAddress = this.getStaticPAddress()
        this.addresses = [{ address: newPAddress, name: 'My Address' }, ...this.addresses.slice(1)]
    }

    @Watch('activeNetwork')
    onActiveNetworkChanged(): void {
        this.updateFirstAddress()
    }

    getStaticPAddress(): string {
        const wallet = this.$store.state.activeWallet as WalletType
        return wallet.getStaticAddress('P')
    }

    addAddress(): void {
        if (this.addresses.length >= MAX_ADDRESS_COUNT) return
        this.addresses.push({ address: '', name: '' })
    }

    resetForm(): void {
        this.multisigName = ''
        this.addresses = [
            { address: this.getStaticPAddress(), name: 'My Address' },
            { address: '', name: '' },
        ]
        this.threshold = 1
    }

    async addMultisigAccountToLocalStorage(TxId: string) {
        try {
            const msigAlias = await getMultisigAliasesFromTxId(TxId)
            const localStorageAccountIndex = this.$store.state.Accounts.accountIndex

            if (localStorageAccountIndex === null || localStorageAccountIndex === undefined) {
                throw new Error('account is not set in local storage')
            }

            let accounts = JSON.parse(localStorage.getItem('accounts') || '[]')

            if (accounts[localStorageAccountIndex]) {
                if (!accounts[localStorageAccountIndex].multisignatures)
                    accounts[localStorageAccountIndex].multisignatures = []

                // Filter out empty addresses
                const filteredAddresses = this.addresses.filter(
                    (addressObj) => addressObj.address.trim() !== ''
                )

                const multisignature = {
                    alias: msigAlias,
                    addresses: filteredAddresses,
                }

                accounts[localStorageAccountIndex].multisignatures.push(multisignature)
                localStorage.setItem('accounts', JSON.stringify(accounts))
            } else {
                console.error(`Account with index ${localStorageAccountIndex} does not exist.`)
            }
        } catch (error) {
            console.error(
                'An error occurred while adding multisig account to local storage: ',
                error
            )
        }
    }

    async createWallet(): Promise<void> {
        try {
            // @ts-ignore
            const { updateShowAlias } = this.globalHelper()

            // Filter and format addresses
            const filteredAddresses = this.getFilteredAddresses()

            // Send multisig alias creation transaction
            const transactionResult = await this.sendMultisigAliasTxCreate(filteredAddresses)

            // Handle transaction result
            if (transactionResult) {
                await this.fetchMultisigAliases(transactionResult)
                setTimeout(() => updateShowAlias(), UPDATE_ALIAS_TIMEOUT)
                this.showSuccessNotification(transactionResult)
            } else this.showErrorNotification()

            this.resetForm()
        } catch (e: any) {
            console.error(e)
            this.showErrorNotification(e)
        }
    }

    getFilteredAddresses(): string[] {
        return this.addresses
            .filter((address) => address.address !== '')
            .map((address) => address.address)
    }

    async sendMultisigAliasTxCreate(filteredAddresses: string[]): Promise<any> {
        return WalletHelper.sendMultisigAliasTxCreate(
            this.activeWallet,
            filteredAddresses,
            this.multisigName,
            Number(this.threshold)
        )
    }

    async fetchMultisigAliases(transactionResult: any): Promise<void> {
        await this.addMultisigAccountToLocalStorage(transactionResult)

        // Fetch multisig aliases after a delay
        setTimeout(async () => {
            const aliasesResponse = await this.$store.dispatch('fetchMultiSigAliases', {
                disable: false,
            })
            const aliases = aliasesResponse.map((alias: string): string => 'P-' + alias)

            await this.$store.dispatch('addWalletsMultisig', { keys: aliases })
        }, UPDATE_ALIAS_TIMEOUT)
    }

    showSuccessNotification(transactionResult: any): void {
        // @ts-ignore
        const { dispatchNotification } = this.globalHelper()
        const msigAlias = getMultisigAliasesFromTxId(transactionResult)
        dispatchNotification({
            message: this.$t('notifications.msig_creation_success', { address: msigAlias }),
            type: 'success',
        })
    }

    showErrorNotification(e?: any): void {
        // @ts-ignore
        const { dispatchNotification } = this.globalHelper()
        if (e?.message.includes('insufficient balance')) {
            dispatchNotification({
                message: this.$t('notifications.insufficient_funds_add'),
                type: 'error',
            })
        } else {
            dispatchNotification({
                message: this.$t('notifications.msig_creation_failed'),
                type: 'error',
            })
        }
    }
}
</script>

<style scoped lang="scss">
@use '../styles/abstracts/mixins';
.msig-create {
    &--container {
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
    &--form {
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
    border: 2px solid var(--camino-slate-slate-600);
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 100%;
    padding: 10px;
}

.number {
    width: 35px !important;
    height: 35px !important;
}

.plus-button {
    border: 2px solid var(--camino-success-color);
    font-size: 10px;
    width: 40px !important;
    height: 40px !important;
    svg {
        color: var(--camino-success-color);
    }
}

.add-new-address {
    display: flex;
    align-items: center;
    gap: 1rem;
    &--button {
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
    flex-direction: column;
    align-items: flex-end;
    max-width: fit-content;
    margin-top: 1rem;
    gap: 0.5rem;
    width: auto;
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
.msig-threshold-input {
    width: 100%;
    input {
        max-width: 250px;
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
