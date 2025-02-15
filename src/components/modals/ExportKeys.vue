<template>
    <modal ref="modal" :title="title" @beforeClose="beforeClose">
        <div class="export_body">
            <p class="selection_num">
                {{ $t('keys.export_key_info', [wallets.length]) }}
            </p>
            <export-wallet
                @success="handleExportSuccess"
                :wallets="wallets"
                ref="export"
            ></export-wallet>
        </div>
    </modal>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '@/components/modals/Modal.vue'
import ExportWallet from '@/components/wallet/manage/ExportWallet.vue'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'

@Component({
    components: {
        Modal,
        ExportWallet,
    },
})
export default class ExportKeys extends Vue {
    isActive: boolean = false
    title: string = 'Export Keys'

    $refs!: {
        modal: Modal
        export: ExportWallet
    }

    @Prop() wallets!: MnemonicWallet[]

    beforeClose() {
        this.$refs.export.clear()
    }

    open() {
        this.$refs.modal.open()
    }

    close() {
        this.isActive = false
    }

    handleExportSuccess() {
        // @ts-ignore
        this.$refs.modal.close()
        this.close()
    }
}
</script>

<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.export_body {
    padding: 30px;
    width: 100%;
    max-width: 450px;
    min-height: 315px;
}

.selection_num {
    color: var(--primary-color);
    text-align: center;
    font-weight: bold;
    @include mixins.typography-caption;
    padding-bottom: 14px;
}

.explain {
    text-align: center;
}

@include mixins.mobile-device {
    .export_body {
        max-width: 100%;
    }
}
</style>

<style lang="scss">
@use '../../styles/abstracts/variables';

.v-tab.v-tab {
    font-weight: 700;
}

.v-tabs-slider-wrapper {
    color: variables.$secondary-color;
    caret-color: variables.$secondary-color;
    height: 3px !important;
}
</style>
