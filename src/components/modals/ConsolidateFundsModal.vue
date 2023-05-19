<template>
    <modal ref="modal" :title="$t('advanced.consolidate_funds.modal.title')">
        <div class="modal_body">
            <p>
                {{
                    balances?.length
                        ? $t('advanced.consolidate_funds.modal.body')
                        : $t('advanced.consolidate_funds.modal.no_utxos')
                }}
            </p>

            <div class="balance_list" v-if="balances?.length">
                <div class="balance_list_row">
                    <div class="balance_list_item">
                        <h3>{{ $t('advanced.consolidate_funds.modal.derived_addresses') }}</h3>
                    </div>
                    <div class="balance_list_item">
                        <h3>CAM</h3>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="balance_list_row" v-for="(balance, i) in balances" :key="i">
                    <div class="balance_list_item">
                        <p>{{ balance.addresses?.[0] }}</p>
                    </div>
                    <div class="balance_list_item">
                        <p>{{ balance.amount?.toLocaleString() }}</p>
                    </div>
                </div>
            </div>
            <div class="modal_actions">
                <v-btn @click="close" plain small>
                    {{
                        balances?.length
                            ? $t('advanced.consolidate_funds.modal.cancel')
                            : $t('advanced.consolidate_funds.modal.discard')
                    }}
                </v-btn>
                <v-btn
                    v-if="balances?.length"
                    @click="ctaClick"
                    class="button_primary"
                    small
                    depressed
                    :loading="loading"
                >
                    {{ $t('advanced.consolidate_funds.modal.title') }}
                </v-btn>
            </div>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import Big from 'big.js'

import Modal from './Modal.vue'
@Component({
    components: {
        Modal,
    },
})
export default class ConsolidateFundsModal extends Vue {
    @Prop() balances!: Array<{ addresses: string[]; amount: Big }>
    @Prop() loading!: boolean

    ctaClick() {
        this.$emit('ctaClick')
    }

    open() {
        // @ts-ignore
        this.$refs.modal.open()
    }

    close() {
        // @ts-ignore
        this.$refs.modal.close()
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.modal_body {
    width: 650px;
    max-width: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.divider {
    margin-top: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--bg-light);
}

.balance_list {
    margin-top: 24px;
}

.balance_list_row {
    display: flex;
}

.balance_list_item {
    flex-grow: 1;
    flex-shrink: 1;
}

.balance_list_item:first-child {
    flex-basis: 75%;
}

.modal_actions {
    margin-top: 32px;
    display: flex;
    justify-content: end;
}

@include mixins.mobile-device {
    .modal_body {
        width: 100%;
    }
}
</style>
