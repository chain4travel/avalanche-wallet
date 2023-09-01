<template>
    <div v-if="!isLedger && wallet" style="width: 100%">
        <template v-if="type === 'kyc'">
            <template v-if="kycStatus && !isMultisig">
                <button class="success_button">
                    <v-icon>mdi-check-decagram</v-icon>
                    {{ $t('kyc_process.kyc_verified') }}
                </button>
            </template>
            <template v-else>
                <KycModal ref="kyc_modal"></KycModal>
                <button
                    :disabled="wallet.type === 'multisig'"
                    class="sidebar_button button_secondary"
                    @click="openKyc"
                >
                    <v-icon color="#fff">mdi-check-decagram</v-icon>
                    {{ $t('kyc_process.verify_kyc') }}
                </button>
            </template>
        </template>
        <template v-else>
            <template v-if="kybStatus && !isMultisig">
                <button class="success_button">
                    <v-icon>mdi-check-decagram</v-icon>
                    {{ $t('kyc_process.kyb_verified') }}
                </button>
            </template>
            <template v-else>
                <KybModal ref="kyb_modal"></KybModal>
                <button
                    :disabled="wallet.type === 'multisig'"
                    class="sidebar_button button_secondary"
                    @click="openKyb"
                >
                    <v-icon color="#fff">mdi-check-decagram</v-icon>
                    {{ $t('kyc_process.verify_kyb') }}
                </button>
            </template>
        </template>
    </div>
</template>
<script lang="ts">
import KybModal from '@/components/modals/KybModal.vue'
import KycModal from '@/components/modals/KycModal.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({
    components: {
        KycModal,
        KybModal,
    },
})
export default class AccountKycItem extends Vue {
    $refs!: {
        kyc_modal: KycModal
        kyb_modal: KybModal
    }
    @Prop() type!: string
    get kycStatus(): boolean {
        return this.$store.getters['Accounts/kycStatus']
    }
    get kybStatus(): boolean {
        return this.$store.getters['Accounts/kybStatus']
    }

    get wallet(): WalletType | null {
        return this.$store.state.activeWallet
    }
    get isMultisig(): boolean {
        return this.wallet instanceof MultisigWallet
    }

    get isLedger() {
        let w = this.wallet
        if (!w) return false
        return w.type === 'ledger'
    }

    openKyc() {
        this.$refs.kyc_modal.open()
    }
    openKyb() {
        this.$refs.kyb_modal.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/main';

.sidebar_button {
    width: max-content;
    border-radius: var(--border-radius-sm);
    height: 40px;
    text-align: center;
    padding: 10px 20px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    justify-content: center;
    // max-width: 163px;
    width: '100%';
}

.warning_button {
    text-align: left;
    color: var(--warning);
    svg {
        margin-right: 10px;
    }
    &:hover {
        opacity: 0.5;
    }
}

.success_button {
    color: var(--success);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
    width: 100%;
    justify-content: center;
    .v-icon {
        color: var(--success);
        margin-right: 10px;
    }
}

@include main.medium-device {
    .warning_button {
        svg {
            margin-right: 14px;
        }
    }
}
@include main.mobile-device {
    .success_button {
        .v-icon {
            font-size: 20px;
            padding-right: 4px;
        }
    }
}
</style>
