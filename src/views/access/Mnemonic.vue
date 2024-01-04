<template>
    <div class="mnemonic_auth">
        <header>
            <h1 class="text-center">{{ $t('access.mnemonic.title') }}</h1>
        </header>
        <label class="mb-2">{{ $t('access.mnemonic.subtitle') }}</label>
        <MnemonicInput
            :phrase="phrase.split(' ')"
            class="phrase_disp"
            @update="mnemonicUpdate($event)"
        />
        <div class="button_container">
            <p class="err" v-if="err">{{ err }}</p>
            <CamBtn
                variant="primary"
                @click="access"
                :loading="isLoading"
                :disabled="!canSubmit"
                data-cy="btn-submit-mnemonic-phrase"
            >
                {{ $t('access.submit') }}
            </CamBtn>
            <div @click="navigate('/login')" class="link">
                {{ $t('access.cancel') }}
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import MnemonicDisplay from '@/components/misc/MnemonicDisplay.vue'
import * as bip39 from 'bip39'
import MnemonicInput from '@/components/misc/MnemonicInput.vue'
import CamBtn from '@/components/CamBtn.vue'

@Component({
    components: {
        MnemonicInput,
        MnemonicDisplay,
        CamBtn,
    },
})
export default class Mnemonic extends Vue {
    @Prop() navigate: any
    phrase: string = ''
    isLoading: boolean = false
    err: string = ''
    helpers = this.globalHelper()
    beforeDestroy() {
        this.phrase = ''
    }

    mnemonicUpdate(ev: any) {
        if (ev.index < 0) {
            this.phrase = ev.value ?? ''
        }
        const phraseArray = this.phrase.split(' ')
        phraseArray[ev.index] = ev.value ?? ''
        this.phrase = phraseArray.join(' ')
    }

    errCheck() {
        let words = this.phrase.split(' ')

        // not a valid key phrase
        if (words.length !== 24) {
            this.err = `${this.$t('access.mnemonic.error')}`
            return false
        }

        let isValid = bip39.validateMnemonic(this.phrase)
        if (!isValid) {
            this.err = 'Invalid mnemonic phrase. Please check your phrase.'
            return false
        }

        this.err = ''
        return true
    }

    get wordCount(): number {
        return this.phrase.trim().split(' ').length
    }

    get canSubmit() {
        return this.wordCount === 24 && this.errCheck()
    }

    async access() {
        this.phrase = this.phrase.trim()
        let phrase = this.phrase

        this.isLoading = true

        if (!this.errCheck()) {
            this.isLoading = false
            return
        }

        setTimeout(async () => {
            try {
                await this.$store.dispatch('accessWallet', phrase)
                this.helpers.updateSuiteStore(this.$store.state)
                this.isLoading = false
            } catch (e) {
                this.isLoading = false
                this.err = `${this.$t('access.mnemonic.error')}`
            }
        }, 500)
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/variables';
@use '../../styles/abstracts/mixins';

.mnemonic_auth {
    background-color: var(--bg-light);
    padding: variables.$container-padding;
    max-width: 1200px;

    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 12px;
    margin-top: 15px;
    margin-bottom: 15px;
    gap: 12px;
}

h1 {
    text-align: left;
    font-size: variables.$m-size;
}

label {
    text-align: left;
    color: variables.$primary-color-light;
    @include mixins.typography-caption;
    margin-bottom: 20px;
}

textarea {
    margin: 20px 0;
    margin-bottom: variables.$vertical-padding;
    width: 100%;
    background-color: var(--bg) !important;
    resize: none;
    min-height: 120px;
    padding: 8px 16px;
    @include mixins.typography-caption;
    color: var(--primary-color);
}

.phrase_disp {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.err {
    @include mixins.typography-caption;
    color: var(--error);
    text-align: center;
    margin: 14px 0 !important;
}

.remember {
    margin-top: -20px;
    font-size: 0.75em;
}

.key_in {
    margin: 30px auto;
    margin-bottom: 6px;
    width: 100%;
    @include mixins.typography-caption;
    background-color: variables.$white;
    border-radius: var(--border-radius-sm);
}

.but_primary {
    // margin-top: 20px;
    margin-bottom: 15px;
}

.button_container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.link {
    display: flex;
    margin-bottom: 0px;
    justify-content: center;
}

@include mixins.mobile_device {
    .mnemonic_auth {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        padding: variables.$container-padding-mobile;

        .center {
            flex-direction: column;
            align-items: stretch;
            justify-content: center;
        }

        .center {
            order: 2;
        }

        .right {
            order: 1;
            margin-bottom: variables.$vertical-padding-mobile;
        }

        > * {
            width: 100%;
        }
    }

    .link {
        margin-bottom: 20px;
    }

    h1 {
        text-align: center;
        font-size: variables.$m-size-mobile;
    }

    label {
        text-align: center;
        margin-bottom: 20px;
    }

    .phrase_disp {
        width: 100%;
        max-width: 560px;
        margin-bottom: variables.$vertical-padding-mobile;
    }

    .err {
        @include mixins.typography-caption;
        margin: 14px 0 !important;
    }

    .remember {
        margin-top: -20px;
        font-size: 0.75em;
    }

    .key_in {
        margin: 30px auto;
        margin-bottom: 6px;
        width: 100%;
        @include mixins.typography-caption;
    }

    .but_primary {
        margin: 0 auto;
        display: block;
        margin-top: 20px;
        margin-bottom: 15px;
    }

    .button_container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        > button {
            padding: 0 16px !important;
        }
    }
}
</style>
