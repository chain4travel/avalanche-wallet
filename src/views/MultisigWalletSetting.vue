<template>
    <div class="settings__container">
        <CreateMultisigWallet v-if="isSingleton()" />
        <!-- <EditMultisigWallet v-else /> -->
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { WalletType } from '@/js/wallets/types'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
// import EditMultisigWallet from './EditMultisigWallet.vue'
import CreateMultisigWallet from './CreateMultisigWallet.vue'

@Component({
    components: {
        CreateMultisigWallet,
        // EditMultisigWallet,
    },
})
export default class MultisigWalletSetting extends Vue {
    get activeWallet(): SingletonWallet | MultisigWallet {
        return this.$store?.state?.activeWallet
    }

    get walletType(): WalletType | string {
        return this.activeWallet?.type
    }

    @Watch('walletType')
    isSingleton(): boolean {
        return this.activeWallet?.type === 'singleton'
    }

    @Watch('walletType')
    isMultisig(): boolean {
        return this.activeWallet?.type === 'multisig'
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
