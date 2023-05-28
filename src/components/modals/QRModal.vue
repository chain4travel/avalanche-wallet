<template>
    <modal ref="modal" :title="$t('modal.qr.title')">
        <div class="qr_body">
            <canvas ref="qr"></canvas>
            <p>{{ address }}</p>
            <CopyText :value="address" class="copyBut">{{ $t('modal.qr.copy') }}</CopyText>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import Modal from './Modal.vue'
import CopyText from '../misc/CopyText.vue'
import QRCode from 'qrcode'

@Component({
    components: {
        Modal,
        CopyText,
    },
})
export default class QRModal extends Vue {
    @Prop({ default: '-' }) address!: string

    @Watch('address', { immediate: true })
    onaddrchange(val: string) {
        if (val) {
            this.updateQR()
        }
    }

    open() {
        // @ts-ignore
        this.$refs.modal.open()

        Vue.nextTick(() => {
            this.updateQR()
        })
    }
    updateQR() {
        if (!this.address) return
        let canvas = this.$refs.qr
        QRCode.toCanvas(
            canvas,
            this.address,
            {
                scale: 6,
                color: {
                    dark: '#242729',
                    light: '#FFFD',
                },
            },
            function (error) {
                if (error) console.error(error)
            }
        )
    }
}
</script>
<style scoped lang="scss">
.qr_body {
    padding: 30px;
    text-align: center;

    canvas {
        border-radius: var(--border-radius-sm);
    }
}

.qr_body p {
    word-break: break-all;
    text-align: center;
}
canvas {
    width: 220px;
    height: 220px;
}

.copyBut {
    /*width: 20px;*/
    /*height: 20px;*/
    margin: 15px auto;
    margin-bottom: 0;
    opacity: 0.6;

    &:hover {
        opacity: 1;
    }
    /*display: block;*/
    /*margin: 0px auto;*/
}
</style>
