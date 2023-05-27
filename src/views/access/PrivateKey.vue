<template>
    <div class="access_card">
        <div class="content">
            <h1>Private Key</h1>
            <form @submit.prevent="access">
                <qr-input v-model="privatekey"></qr-input>
                <p class="err">{{ error }}</p>
                <v-btn
                    class="ava_button button_primary"
                    @click="access"
                    :loading="isLoading"
                    :disabled="!canSubmit"
                    depressed
                >
                    {{ $t('access.submit') }}
                </v-btn>
            </form>
            <router-link to="/access" class="link">Cancel</router-link>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
// @ts-ignore
import { QrInput } from '@c4tplatform/vue_components'

@Component({
    components: {
        QrInput,
    },
})
export default class PrivateKey extends Vue {
    privatekey: string = ''
    isLoading: boolean = false
    inputType = 'input'
    error: string = ''
    async mounted() {
        if (!(window.getComputedStyle(this.$el) as any).webkitTextSecurity) {
            this.inputType = 'password'
        }
    }
    async access() {
        if (!this.canSubmit || this.isLoading) return
        this.error = ''
        this.isLoading = true
        let key = this.privatekey

        try {
            await this.$store.dispatch('accessWalletSingleton', key)
            this.onsuccess()
        } catch (e) {
            this.onerror('Invalid Private Key.')
        }
    }
    onsuccess() {
        this.isLoading = false
        this.privatekey = ''
    }
    onerror(e: any) {
        this.error = e
        this.privatekey = ''
        this.isLoading = false
    }
    get canSubmit(): boolean {
        if (!this.privatekey) {
            return false
        }
        return true
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/variables';
.ava_button {
    width: 100%;
    margin-bottom: 22px;
}
.access_card {
    background-color: var(--bg-light);
    padding: variables.$container-padding;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
}
.content {
    width: 340px;
    max-width: 100%;
    margin: 0px auto;
}
h1 {
    font-size: variables.$m-size;
    font-weight: 400;
    margin-bottom: 30px;
}

a {
    color: variables.$primary-color-light !important;
    text-decoration: underline !important;
    margin: 10px 0 20px;
}
.link {
    color: var(--secondary-color);
}

.err {
    font-size: 13px;
    color: var(--error);
    margin: 14px 0px !important;
}

.qr_input {
    background-color: var(--bg) !important;
}

@media only screen and (max-width: variables.$mobile_width) {
    h1 {
        font-size: variables.$m-size-mobile;
    }
    .but_primary {
        width: 100%;
    }
}
</style>
