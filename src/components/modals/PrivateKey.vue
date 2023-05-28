<template>
    <modal ref="modal" :title="$t('modal.priv_key.info')" class="modal_main">
        <div class="singleton_modal_body">
            <div class="key_container">
                <div class="key_raw">
                    <span class="key_raw_title">{{ $t('modal.priv_key.title') }}</span>
                    <br />
                    {{ privateKey }}
                </div>
                <div class="col_qr">
                    <canvas ref="qr"></canvas>
                </div>
            </div>
            <p class="warning_text">
                Warning: Never disclose this key. Anyone with your private keys can steal any assets
                held in your wallet.
            </p>
            <template v-if="publicKey">
                <div class="key_raw">
                    <span class="key_raw_title">Public Key</span>
                    <br />
                    {{ publicKey }}
                </div>
                <div class="key_raw">
                    <span class="key_raw_title">Compressed Public Key</span>
                    <br />
                    {{ compressedPublicKey }}
                </div>
            </template>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import QRCode from 'qrcode'
import Modal from '@/components/modals/Modal.vue'

const ecdsa = require('elliptic').ec
const ec = new ecdsa('secp256k1')

@Component({
    components: {
        Modal,
    },
})
export default class PrivateKey extends Vue {
    @Prop({ default: '' }) privateKey!: string
    @Prop({ default: '' }) publicKey!: string

    open(): void {
        let modal = this.$refs.modal as Modal
        modal.open()

        Vue.nextTick(() => {
            this.updateQR()
        })
    }

    get compressedPublicKey(): string {
        return Buffer.from(
            ec
                .keyFromPublic(Buffer.from(this.publicKey, 'hex'))
                .getPublic(true, 'hex')
                .padStart(66, '0'),
            'hex'
        ).toString('hex')
    }

    updateQR() {
        let canvas = this.$refs.qr as HTMLCanvasElement
        if (!canvas) return

        let size = canvas.clientWidth
        QRCode.toCanvas(
            canvas,
            this.privateKey,
            {
                scale: 6,
                color: {
                    dark: '#242729',
                    light: '#FFFD',
                },
                width: size,
            },
            function (error: any) {
                if (error) console.error(error)
            }
        )
    }
}
</script>
<style scoped lang="scss">
.singleton_modal_body {
    width: 520px;
    max-width: 100%;
    padding: 10px 20px;
}

.col_qr {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 12px;

    canvas {
        border-radius: var(--border-radius-sm);
    }
}

.key_container {
    display: grid;
    grid-template-columns: auto 142px;
    gap: 6px;
}

.key_raw_title {
    font-size: larger;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 6px;
}

.key_raw {
    text-align: center;
    word-break: break-all;
    background-color: var(--bg);
    border-radius: 2px;
    margin: 12px 0px !important;
}

.warning_text {
    background-color: var(--secondary-color);
    color: #fff;
    padding: 4px 14px;
    border-radius: 3px;
}
</style>
