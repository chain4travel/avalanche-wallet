<template>
    <div class="container">
        <h2>{{ $t('advanced.sign.title') }}</h2>
        <p class="description">
            {{ $t('advanced.sign.desc') }}
        </p>
        <div v-if="isHD">
            <label>{{ $t('advanced.sign.label1') }}</label>
            <SearchAddress :wallet="wallet" v-model="sourceAddress"></SearchAddress>
        </div>
        <div class="message-wrapper">
            <label>{{ $t('advanced.sign.label2') }}</label>
            <p class="warn">{{ $t('advanced.sign.warn') }}</p>
            <textarea class="message" v-model="message"></textarea>
        </div>
        <p class="err">{{ error }}</p>
        <CamBtn class="primary" block small depressed @click="sign" :disabled="!canSubmit">
            {{ $t('advanced.sign.submit') }}
        </CamBtn>
        <div v-if="signed" class="result">
            <label>{{ $t('advanced.sign.label3') }}</label>
            <div class="signed">
                <p>{{ signed }}</p>
                <CopyText :tooltip="$t('top.hover3')" :value="signed" class="copy_but"></CopyText>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import CamBtn from '@/components/CamBtn.vue'
import CopyText from '@/components/misc/CopyText.vue'
import SearchAddress from '@/components/wallet/advanced/SignMessage/SearchAddress.vue'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { WalletType } from '@/js/wallets/types'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: { SearchAddress, CamBtn, CopyText },
})
export default class SignMessage extends Vue {
    sourceAddress: string | null = null
    message = ''
    signed = ''
    error = ''

    get wallet(): WalletType {
        return this.$store.state.activeWallet
    }

    async sign() {
        this.error = ''
        // Convert the message to a hashed buffer
        // let hashMsg = this.msgToHash(this.message);
        try {
            if (this.wallet.type === 'singleton') {
                this.signed = await (this.wallet as SingletonWallet).signMessage(this.message)
            } else {
                this.signed = await this.wallet.signMessage(this.message, this.sourceAddress!)
            }
        } catch (e: any) {
            this.error = e.message
        }
    }

    clear() {
        this.message = ''
        this.signed = ''
        this.error = ''
    }

    deactivated() {
        this.clear()
    }

    get isHD() {
        return this.wallet.type !== 'singleton'
    }

    get canSubmit(): boolean {
        if (!this.sourceAddress && this.isHD) return false
        if (!this.message) return false
        return true
    }
}
</script>

<style scoped lang="scss">
@use '../../../../styles/abstracts/mixins';

.container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.description {
    margin-bottom: 14px !important;
}

.message-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

select,
textarea,
.signed {
    @include mixins.typography-caption;
    background-color: var(--bg-light);
    resize: none;
    width: 100%;
    border-radius: var(--border-radius-sm);
    padding: 4px 12px;
}

.signed {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 12px 12px;
}

select {
    outline: none;
    width: 100%;
    color: var(--primary-color);
    cursor: pointer;
    @include mixins.typography-caption;

    &:hover {
        color: var(--primary-color);
    }
}

option {
    background-color: var(--bg-wallet);
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
    @include mixins.typography-caption;
    padding: 6px 12px;
    height: 80px;
}

.signed {
    word-break: break-all;
    @include mixins.typography-caption;
}

.warn {
    @include mixins.typography-caption;
    color: var(--secondary-color);
}

.err {
    color: var(--error-color);
}

.copy_but {
    color: var(--primary-color);
}
.result {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
}
</style>
