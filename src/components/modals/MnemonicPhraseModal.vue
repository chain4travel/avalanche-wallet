<template>
    <modal ref="modal" :title="$t('modal.mnemonic.title')" class="modal_main">
        <div class="mnemonic_modal_body">
            <canvas ref="qr"></canvas>
            <p class="phrase_raw">{{ phrase.getValue() }}</p>
            <p class="warning_text">
                Warning: Never disclose this mnemonic phrase. Anyone with your phrase can steal any
                assets held in your wallet.
            </p>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import Modal from '@/components/modals/Modal.vue'
import MnemonicPhrase from '@/js/wallets/MnemonicPhrase'
import QRCode from 'qrcode'

@Component({
    components: {
        Modal,
    },
})
export default class MnemonicPhraseModal extends Vue {
    @Prop({ default: '' }) phrase!: MnemonicPhrase

    open(): void {
        let modal = this.$refs.modal as Modal
        modal.open()

        Vue.nextTick(() => {
            this.updateQR()
        })
    }

    updateQR() {
        let canvas = this.$refs.qr as HTMLCanvasElement
        let size = canvas.clientWidth
        QRCode.toCanvas(
            canvas,
            this.phrase.getValue(),
            {
                scale: 6,
                color: {
                    dark: '#242729',
                    light: '#FFFD',
                },
                width: size,
            },
            function (error) {
                if (error) console.error(error)
            }
        )
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.mnemonic_modal_body {
    display: flex;
    align-items: center;
    flex-direction: column;
    max-width: 400px;
    width: 100%;
    padding: 30px;
    background-color: var(--bg-light);

    canvas {
        max-width: 256px;
        width: 100%;
        border-radius: var(--border-radius-sm);
    }
}

.phrase_raw {
    background-color: var(--bg);
    margin: 15px 0px !important;
    border-radius: 2px;
    padding: 6px 12px;
}

.warning_text {
    background-color: var(--secondary-color);
    color: #fff;
    padding: 4px 14px;
    border-radius: 3px;
}

@include mixins.mobile-device {
    .mnemonic_modal_body {
        max-width: 100%;
    }
}
</style>
