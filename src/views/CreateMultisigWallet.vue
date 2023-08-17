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
                        <input
                            class="full-width-input"
                            :placeholder="`Owner ${index + 1} Address`"
                            v-model="address.address"
                        />
                        <input
                            class="msig-address-name"
                            :placeholder="index === 0 ? 'My Address' : `Owner ${index + 1} Name`"
                            v-model="address.name"
                        />
                    </div>
                </div>

                <div class="add-new-address" v-if="addresses.length < 128">
                    <div class="circle number">{{ addresses.length + 1 }}</div>
                    <div class="add-new-address--button">
                        <button @click="addAddress" class="circle plus-button">
                            <fa icon="plus"></fa>
                        </button>
                    </div>
                </div>

                <Alert variant="negative" v-if="multupleSameAddresses">
                    {{ $t('create_multisig.errors.same_address_twice') }}
                </Alert>
            </div>

            <div class="input-container">
                <div class="divider"></div>
                <h3>{{ $t('create_multisig.threshold') }}</h3>
                <CamInput
                    v-model.number="threshold"
                    :placeholder="$t('create_multisig.threshold')"
                    :error="thresholdError"
                    :errorMessage="$t('create_multisig.errors.threshold_exceeds_owners')"
                    class="msig-threshold-input"
                />
            </div>
        </div>

        <div class="action-buttons">
            <button
                :class="[
                    'camino__primary--button',
                    { 'camino--button--disabled': disableMsigCreation },
                ]"
                @click="createWallet"
                :disabled="disableMsigCreation"
            >
                {{ $t('create_multisig.create_multisig') }}
            </button>
            <Alert variant="warning">
                {{ $t('create_multisig.disclamer', { fee: feeAmt, symbol: nativeAssetSymbol }) }}
            </Alert>
        </div>
    </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { WalletType } from '@/js/wallets/types'
import { ava } from '@/AVA'
import { BN } from '@c4tplatform/caminojs'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import AvaAsset from '@/js/AvaAsset'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { AvaNetwork } from '@/js/AvaNetwork'
import { WalletHelper } from '../helpers/wallet_helper'
import Alert from '@/components/Alert.vue'
import CamInput from '@/components/CamInput.vue'
import { getMultisigAliasesFromTxId } from '@/utils/multisig'

@Component({
    components: {
        Alert,
        CamInput,
    },
})
export default class CreateMultisigWallet extends Vue {
    multisigName: string = ''
    addresses: { address: string; name: string }[] = [
        { address: this.getStaticPAddress(), name: 'My Address' },
        { address: '', name: '' },
    ]
    threshold: number = 1

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
            this.thresholdError ||
            this.nameLengthError
        )
    }

    get thresholdError() {
        return this.threshold > this.addresses.length
    }

    get nameLengthError() {
        const bytes = new TextEncoder().encode(this.multisigName)
        return bytes.length > 64
    }

    get multupleSameAddresses(): boolean {
        const filledAddresses = this.addresses.filter((a) => a.address !== '')
        const uniqueAddresses = new Set(filledAddresses.map((a) => a.address))

        return uniqueAddresses.size !== filledAddresses.length
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
        if (this.addresses.length >= 128) return
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
        // @ts-ignore
        let { dispatchNotification, updateShowAlias } = this.globalHelper()
        const filteredAddresses = this.addresses
            .filter((address) => address.address !== '')
            .map((address) => address.address)

        try {
            const result = await WalletHelper.sendMultisigAliasTxCreate(
                this.activeWallet,
                filteredAddresses,
                this.multisigName,
                Number(this.threshold)
            )

            if (result) {
                await this.addMultisigAccountToLocalStorage(result)
                setTimeout(() => {
                    updateShowAlias()
                }, 3000)
                this.resetForm()

                dispatchNotification({
                    message: this.$t('notifications.msig_creation_success'),
                    type: 'success',
                })
            } else {
                dispatchNotification({
                    message: this.$t('notifications.msig_creation_failed'),
                    type: 'error',
                })
            }
        } catch (e) {
            console.error(e)
            dispatchNotification({
                message: this.$t('notifications.msig_creation_failed'),
                type: 'error',
            })
            return
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
