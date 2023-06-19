<template>
    <div class="container">
        <h1>Multisignature Wallet</h1>
        <div>
            <div class="input-container">
                <h3>Multisignature Name</h3>
                <div class="input-with-warning">
                    <input
                        class="full-width-input"
                        :name="$t('keys.save_account.placeholder_1').toString()"
                        placeholder="Multisignature Name"
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
                            :name="$t('keys.save_account.placeholder_1').toString()"
                            :placeholder="`Owner ${index + 1} Address`"
                            v-model="address.address"
                        />
                        <input
                            class="msig-address-name"
                            :name="$t('keys.save_account.placeholder_1').toString()"
                            :placeholder="`MSig Address Name ${index + 1}`"
                            v-model="address.name"
                        />
                    </div>
                    <button
                        @click="removeAddress(index)"
                        class="circle delete-button"
                        v-if="mode === 'edit'"
                    >
                        <fa icon="minus"></fa>
                    </button>
                </div>
                <div class="add-new-address" v-if="mode === 'create'">
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
                    :name="$t('keys.save_account.placeholder_1').toString()"
                    placeholder="Multisignature Threshold"
                />
            </div>
        </div>
        <div class="action-buttons" v-if="isSinglton">
            <v-btn class="button_primary ava_button" @click="createWallet">
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
        <div class="action-buttons" v-if="isMultisig && mode === 'edit'">
            <v-btn class="button_primary ava_button" @click="cancelEdit">Cancel</v-btn>
            <v-btn class="button_primary ava_button" @click="saveWallet">
                Save Multisig Wallet
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
        <div class="action-buttons" v-if="isMultisig && mode !== 'edit'">
            <v-btn class="button_primary ava_button" @click="abortEdit">Abort</v-btn>
            <v-btn class="button_primary ava_button" @click="signWallet">
                Sign Edited Multisig Wallet
            </v-btn>
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
import Big from 'big.js'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'

@Component
export default class CreateMultisigWallet extends Vue {
    addresses: { address: string; name: string }[] = [{ address: '', name: '' }]
    mode: 'create' | 'edit' | 'delete' | 'view' = 'create'

    get walletType(): WalletType {
        return this.$store.state.activeWallet.type
    }

    @Watch('walletType')
    onWalletTypeChanged(newVal: WalletType) {
        console.log('walletType', newVal)
        if (newVal instanceof SingletonWallet) {
            this.mode = 'create'
        } else {
            this.mode = 'view'
        }
    }

    mounted() {
        console.log('wallet', this.multiSigAliases)
    }

    addAddress() {
        this.addresses.push({ address: '', name: '' })
    }

    removeAddress(index: number) {
        console.log('removeAddress', index)
        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) {
            this.addAddress()
        }
    }

    createWallet() {
        console.log('createWallet')
    }

    editWallet() {
        this.mode = 'edit'
    }

    deleteWallet() {
        this.mode = 'delete'
    }

    formattedAmount(val: BN): string {
        let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
        return big.toLocaleString()
    }

    cancelEdit() {
        this.mode = 'view'
    }

    saveWallet() {
        console.log('saveWallet')
    }

    abortEdit() {
        console.log('abortEdit')
    }

    signWallet() {
        console.log('signWallet')
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

    get isSinglton() {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'singleton'
    }

    get isMultisig() {
        let wallet: WalletType = this.$store.state.activeWallet
        return wallet.type === 'multisig'
    }

    get multiSigAliases(): string[] {
        return this.$store.getters.multiSigAliases
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
