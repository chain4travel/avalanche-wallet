<template>
    <div class="container">
        <h1>Multisignature Wallet</h1>
        <div>
            <div class="input-container">
                <h3>Multisignature Name</h3>
                <div class="input-with-warning">
                    <input
                        class="full-width-input"
                        placeholder="Multisignature Name"
                        v-model="multisigName"
                    />
                    <span class="warning">
                        Please note thiscription will be public on the Camino Network. Choose wisely
                    </span>
                </div>
            </div>

            <div class="input-container">
                <h3>Multisignature Co-Owners</h3>
                <div v-for="(address, index) in addresses" :key="index" class="multisig_address">
                    <div class="circle number">{{ index + 1 }}</div>
                    <div class="address-input">
                        <input
                            class="full-width-input"
                            :placeholder="`Owner ${index + 1} Address`"
                            v-model="address.address"
                            :disabled="index === 0"
                        />
                        <input
                            class="msig-address-name"
                            :placeholder="index === 0 ? 'My Address' : `Owner ${index + 1} Name`"
                            v-model="address.name"
                        />
                    </div>
                </div>
                <div class="add-new-address" v-if="mode === 'create' && addresses.length < 128">
                    <button @click="addAddress" class="circle plus-button">
                        <fa icon="plus"></fa>
                    </button>
                </div>
            </div>

            <div class="divider"></div>

            <div class="input-container">
                <h3>Multisignature Threshold</h3>
                <input
                    class="threshold-input"
                    placeholder="Multisignature Threshold"
                    v-model.number="threshold"
                />
            </div>
        </div>
        <div class="action-buttons" v-if="isSingleton">
            <v-btn
                class="button_primary ava_button"
                @click="createWallet"
                :disabled="disableMsigCreation"
            >
                Create Multisignature Wallet
            </v-btn>
            <span class="warning">
                {{
                    $t('create_multisig.disclamer', {
                        fee: feeAmt,
                        symbol: nativeAssetSymbol,
                    })
                }}
            </span>
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
import { AvaNetwork } from '@/js/AvaNetwork'
import { WalletHelper } from '../helpers/wallet_helper'

@Component
export default class CreateMultisigWallet extends Vue {
    multisigName: string = ''
    addresses: { address: string; name: string }[] = [
        { address: this.getStaticPAddress(), name: 'My Address' },
        { address: '', name: '' },
    ]
    threshold: number = 1
    mode: 'create' | 'edit' | 'delete' | 'view' = 'create'

    get walletType(): WalletType {
        return this.$store.state.activeWallet.type
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store.state.Network.selectedNetwork
    }

    get disableMsigCreation(): boolean {
        return (
            !this.multisigName ||
            !this.threshold ||
            this.addresses.length === 0 ||
            // this.addresses.some((address) => address.address === '') ||
            // this.addresses.some((address) => address.name === '') ||
            this.threshold > this.addresses.length ||
            this.threshold < 1
        )
    }

    updateFirstAddress(): void {
        const newPAddress = this.getStaticPAddress()
        this.addresses = [{ address: newPAddress, name: 'My Address' }, ...this.addresses.slice(1)]
    }

    @Watch('activeNetwork')
    onActiveNetworkChanged(): void {
        this.updateFirstAddress()
    }

    @Watch('walletType')
    onWalletTypeChanged(newVal: WalletType): void {
        if (newVal instanceof SingletonWallet) {
            this.mode = 'create'
        } else {
            this.mode = 'view'
        }
    }

    getStaticPAddress(): string {
        const wallet = this.$store.state.activeWallet as WalletType
        return wallet.getStaticAddress('P')
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

    resetForm(): void {
        this.multisigName = ''
        this.addresses = [
            { address: this.getStaticPAddress(), name: 'My Address' },
            { address: '', name: '' },
        ]
        this.threshold = 1
    }

    async createWallet(): Promise<void> {
        const wallet = this.$store.state.activeWallet as WalletType
        const newMemo = this.multisigName
        // @ts-ignore
        let { dispatchNotification } = this.globalHelper()

        try {
            const result = await WalletHelper.sendMultisigAliasTxCreate(
                wallet,
                this.addresses,
                newMemo
            )
            // const localStorageAccounIndex = this.$store.state.Accounts.accountIndex

            if (result) {
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

    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
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

    get isSingleton(): boolean {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'singleton'
    }
}
</script>

<style scoped lang="scss">
@use '../styles/abstracts/mixins';
.container {
    border: var(--primary-border);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--box-shadow);
    padding: 22px 20px;
    background-color: var(--bg-wallet-light);
    flex: 1;
    height: 100%;
}

form {
    display: flex;
    flex-direction: column;

    > * {
        margin: 6px 0px;
    }
}

input {
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 12px;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--bg-light);
}

.cancel_but {
    color: #999;
    font-size: 0.9rem;
}

.password {
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 6px 14px;
}

.err {
    color: var(--error);
}

.input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

.address-input {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 1rem;
    width: 100%;
}

.full-width-input {
    flex: 1;
}

.threshold-input {
    width: 100%;
    max-width: 250px;
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

.plus-button,
.delete-button {
    font-size: 10px;
    width: 40px !important;
    height: 40px !important;
}

.add-new-address {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.divider {
    margin-top: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--bg-light);
}

.action-buttons {
    display: flex;
    flex-flow: column wrap;
    align-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
}

.create-wallet {
    display: flex;
    flex-flow: column wrap;
    align-content: flex-end;
    gap: 0.5rem;
}

.edit-wallet {
    display: flex;
    flex-flow: column wrap;
    align-content: flex-end;
    gap: 0.5rem;
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
