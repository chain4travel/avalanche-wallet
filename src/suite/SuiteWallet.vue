<template>
    <div id="suite_wallet" class="v-application">
        <Wallet />
    </div>
</template>

<script lang="ts">
import Wallet from '@/views/Wallet.vue'

import vuetify from '@/plugins/vuetify_suite'
import i18n from '@/plugins/i18n'
import router from '@/router'
import store from '@/store'

export default {
    name: 'Suite-Wallet',
    i18n,
    router,
    store,
    vuetify,
    components: {
        Wallet,
    },
}
</script>
<style lang="scss">
@import '../styles/main_suite';
@import '~vuetify/src/styles/generic/reset';

#suite_wallet {
    min-height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: left;
    color: var(--primary-color);
    background-color: var(--bg) !important;
    font-family: 'Inter', sans-serif;
    transition-duration: 0.2s;
    --bg: #f1f5f9;
    --bg-1: 255, 255, 255;
    --bg-light: #e2e8f0;
    --bg-light-1: 245, 246, 250;
    --primary-color: #0f172a;
    --primary-color-light: #757575;
    --selection-color: #6a91d8;
    --link-secondary: #6e7479;
    --error: #c23f38;
    --success: #6bc688;
    --info: #2c7490;
    --info-1: 44, 116, 144;
    --bg-wallet: #f5f6fa;
    --warning: #f19d38;
    --bg-wallet-light: #ffffff;
    --primary-border-color: rgba(203, 213, 225, 0.12);
    --secondary-border-color: #e2e8f0;
    --disabled-color: #e2e8f0;
    --primary-contrast-text: #0f172a;
    --secondary-contrast-text: #ffffff;
    --sidebar-links: #64748b;
    --sidebar-background: #fff;
    --icon-color: #0f172a;
    --icon-color-light: #334155;
}
</style>
