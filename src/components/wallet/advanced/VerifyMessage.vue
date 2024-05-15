<template>
    <div class="container">
        <h2>{{ $t('advanced.verify.title') }}</h2>
        <p class="description">
            {{ $t('advanced.verify.desc') }}
        </p>
        <div>
            <label>{{ $t('advanced.verify.label1') }}</label>
            <textarea v-model="message"></textarea>
        </div>
        <div>
            <label>{{ $t('advanced.verify.label2') }}</label>
            <textarea v-model="signature"></textarea>
        </div>
        <p class="err">{{ error }}</p>
        <CamBtn class="primary" block small depressed @click="submit" :disabled="!canSubmit">
            {{ $t('advanced.verify.submit') }}
        </CamBtn>
        <div v-if="addressX" class="result">
            <label>{{ $t('advanced.verify.label3') }}</label>
            <p class="address">{{ addressX }}</p>
            <p class="address">{{ addressP }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { KeyPair } from '@c4tplatform/caminojs/dist/apis/avm'
import { ava, bintools } from '@/AVA'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { digestMessage } from '@/helpers/helper'
import CamBtn from '@/components/CamBtn.vue'

@Component({
    components: { CamBtn },
})
export default class VerifyMessage extends Vue {
    message: string = ''
    addressX: string = ''
    addressP: string = ''
    signature: string = ''
    error: string = ''

    submit() {
        this.addressX = ''
        this.addressP = ''
        this.error = ''
        try {
            this.verify()
        } catch (e: any) {
            this.error = e.message
        }
    }

    verify() {
        const digest = digestMessage(this.message)
        const digestBuff = Buffer.from(digest.toString('hex'), 'hex')
        const hrp = ava.getHRP()
        const keypair = new KeyPair(hrp, 'X')
        const signedBuff = bintools.cb58Decode(this.signature)
        const pubKey = keypair.recover(digestBuff, signedBuff)
        const addressBuff = KeyPair.addressFromPublicKey(pubKey)
        this.addressX = bintools.addressToString(hrp, 'X', addressBuff)
        this.addressP = bintools.addressToString(hrp, 'P', addressBuff)
    }

    clear() {
        this.message = ''
        this.signature = ''
        this.addressX = ''
        this.addressP = ''
        this.error = ''
    }

    deactivated() {
        this.clear()
    }

    get canSubmit() {
        return this.message && this.signature
    }
}
</script>

<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.description {
    margin-bottom: 14px !important;
}

textarea,
input,
.address {
    @include mixins.typography-caption;
    background-color: var(--bg-light);
    resize: none;
    width: 100%;
    border-radius: var(--border-radius-sm);
    padding: 4px 12px;
}

label {
    display: block;
    text-align: left;
    color: var(--primary-color-light);
    @include mixins.typography-caption;
    margin-bottom: 20px;
    margin-top: 6px;
}

textarea {
    width: 100%;
    resize: none;
    padding: 6px 12px;
    height: 80px;
}

.result {
    margin-top: 6px;
}

.address {
    margin-bottom: 1px !important;
    word-break: break-all;
}

.err {
    color: var(--error-color);
}
</style>
