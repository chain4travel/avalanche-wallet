<template>
    <div v-if="!isLedger && wallet" class="settings__container">
        <template v-if="account">
            <ManageAccount />
        </template>
        <template v-else><SaveAccount :setAccount="setAccount" /></template>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { iUserAccountEncrypted } from '@/store/types'
import { WalletType } from '@/js/wallets/types'
import SaveAccount from '@/components/SaveAccount.vue'
import ManageAccount from '@/components/ManageAccount.vue'
@Component({
    components: {
        SaveAccount,
        ManageAccount,
    },
})
export default class Settings extends Vue {
    @Prop() setAccount: any
    get wallet(): WalletType | null {
        return this.$store.state.activeWallet
    }
    get account(): iUserAccountEncrypted | null {
        return this.$store.getters['Accounts/account']
    }
    get isLedger() {
        let w = this.wallet
        if (!w) return false
        return w.type === 'ledger'
    }
}
</script>
<style scoped lang="scss">
.settings__container {
    height: 100%;
    width: 100%;
    padding: 4rem 0;
    max-width: 1536px;
}
</style>
