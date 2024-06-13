<template>
    <div>
        <h1>{{ $t('advanced.title') }}</h1>
        <TokenListModal ref="token_list"></TokenListModal>
        <div class="grids">
            <ChainImport class="grid_box"></ChainImport>
            <SignMessage class="grid_box"></SignMessage>
            <VerifyMessage class="grid_box"></VerifyMessage>
            <ConsolidateFunds v-if="canConsolidate" class="grid_box"></ConsolidateFunds>
        </div>
    </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'

import ChainImport from '@/components/wallet/advanced/ChainImport.vue'
import SignMessage from '@/components/wallet/advanced/SignMessage/SignMessage.vue'
import VerifyMessage from '@/components/wallet/advanced/VerifyMessage.vue'
import TokenListModal from '@/components/modals/TokenList/TokenListModal.vue'
import ConsolidateFunds from '@/components/wallet/advanced/ConsolidateFunds.vue'

@Component({
    name: 'advanced',
    components: {
        TokenListModal,
        ChainImport,
        SignMessage,
        VerifyMessage,
        ConsolidateFunds,
    },
})
export default class Advanced extends Vue {
    $refs!: {
        token_list: TokenListModal
    }

    get canConsolidate(): boolean {
        try {
            return this.activeWallet?.getMnemonic() && this.activeWallet?.getMnemonic() !== ''
        } catch (err) {
            return false
        }
    }

    get activeWallet() {
        return this.$store.state.activeWallet
    }

    openTokenlist() {
        this.$refs.token_list.open()
    }
}
</script>

<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

h1 {
    font-weight: normal;
    margin-bottom: var(--spacing-space-xl);
}

.grids {
    display: grid;
    column-gap: 14px;
    row-gap: 14px;
    grid-template-columns: repeat(2, 1fr);

    @include mixins.mobile-device {
        grid-template-columns: 1fr;
    }

    @include mixins.medium-device {
        grid-template-columns: 1fr;
    }
}

.grid_box {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: var(--spacing-space-xl);
    border-radius: var(--border-radius-xl);
    overflow: auto;
}
</style>
