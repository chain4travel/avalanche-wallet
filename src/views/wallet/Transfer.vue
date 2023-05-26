<template>
    <div class="transfer_card">
        <div class="header">
            <h2>{{ $t('transfer.title') }}</h2>
            <div class="tab">
                <button class="tab_btn" @click="tab = 'transfer'" :active="tab === `transfer`">
                    {{ $t('transfer.transfer') }}
                </button>
                <button class="tab_btn" @click="tab = 'airdrop'" :active="tab === `airdrop`">
                    {{ $t('transfer.airdrop') }}
                </button>
            </div>
        </div>
        <div v-if="networkStatus !== 'connected'" class="disconnected">
            <p>{{ $t('transfer.disconnected') }}</p>
        </div>
        <template v-else>
            <TransferCard v-if="tab === 'transfer'"></TransferCard>
            <BulkCard v-else></BulkCard>
        </template>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'

import BulkCard from '@/components/wallet/transfer/BulkTransfer.vue'
import TransferCard from '@/components/wallet/transfer/Transfer.vue'

@Component({
    components: {
        BulkCard,
        TransferCard,
    },
})
export default class Transfer extends Vue {
    tab: string = 'transfer'

    get networkStatus(): string {
        let stat = this.$store.state.Network.status
        return stat
    }
}
</script>

<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.header {
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: var(--primary-border);
    flex-wrap: nowrap;
    white-space: nowrap;

    h2 {
        font-weight: normal;
        margin-right: 30px;
    }

    .tab {
        display: flex;
        width: 100%;
    }

    .tab_btn {
        padding: 8px 24px;
        font-size: 14px;
        font-weight: bold;
        margin: 0px 5px;
        text-transform: uppercase;
        outline: none !important;
        color: var(--primary-color-light);

        &[active] {
            color: var(--secondary-color);
            border-bottom: 2px solid var(--secondary-color);
        }
    }
}

.disconnected {
    padding: 30px;
    text-align: center;
    background-color: var(--bg-light);
}

@include mixins.mobile-device {
    .transfer_card {
        display: block;
        grid-template-columns: none;
    }
}
</style>
