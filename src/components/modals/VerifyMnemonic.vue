<template>
    <modal ref="modal" :title="title" class="modal_parent" icy>
        <div class="mnemonic_body">
            <h3>{{ $t('create.verify_desc') }}</h3>
            <div class="words">
                <div v-for="i in 24" :key="i" class="mnemonic_in" tabindex="-1">
                    <p>{{ i }}.</p>
                    <input
                        type="text"
                        v-model="keysIn[i - 1]"
                        :disabled="!hiddenIndices.includes(i - 1)"
                        :data-cy="getDataCY(i)"
                    />
                </div>
            </div>
            <Alert variant="negative" v-if="err">{{ err }}</Alert>
            <div class="modal_btns">
                <CamBtn
                    data-cy="btn-confirm-verify-new-mnemonic-phrase"
                    variant="transparent"
                    @click="cancel"
                >
                    Cancel
                </CamBtn>
                <CamBtn
                    data-cy="btn-confirm-verify-new-mnemonic-phrase"
                    variant="primary"
                    @click="verify"
                >
                    Verify
                </CamBtn>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import Modal from '@/components/modals/Modal.vue'
import MnemonicPhrase from '@/js/wallets/MnemonicPhrase'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'

@Component({
    components: {
        Modal,
        CamBtn,
        Alert,
    },
})
export default class VerifyMnemonic extends Vue {
    isActive: boolean = false
    keysIn: string[] = []
    hiddenIndices: number[] = []
    err: string = ''
    title: string = ''

    @Prop() mnemonic?: MnemonicPhrase

    @Watch('mnemonic')
    onmnemonicchange(val: string) {
        this.init()
    }
    created() {
        this.init()
        this.title = `${this.$t('create.verifytitle')}`
    }

    init() {
        const wordsLen = 24
        this.keysIn = Array(wordsLen).join('.').split('.')

        // Hide 4 words
        let hideNum = 4
        let hidden: number[] = []

        while (hidden.length < hideNum) {
            let hideIndex = Math.floor(Math.random() * wordsLen)
            if (!hidden.includes(hideIndex)) {
                hidden.push(hideIndex)
            }
        }

        this.words.forEach((word, i) => {
            if (!hidden.includes(i)) {
                this.keysIn[i] = word
            }
        })

        this.hiddenIndices = hidden
    }

    get words() {
        return this.mnemonic ? this.mnemonic.getValue().split(' ') : []
    }

    open() {
        this.isActive = true
        // @ts-ignore
        this.$refs.modal.open()
    }

    close() {
        this.isActive = false
    }

    formCheck() {
        this.err = ''
        let userWords = this.keysIn

        for (var i = 0; i < userWords.length; i++) {
            let userWord = userWords[i].trim()
            let trueWord = this.words[i].trim()

            if (userWord.length === 0) {
                this.err = `Oops, looks like you forgot to fill number ${i + 1}`
                return false
            }

            if (userWord !== trueWord) {
                this.err = `The mnemonic phrase you entered for word ${
                    i + 1
                } not match the actual phrase.`
                return false
            }
        }

        return true
    }

    verify() {
        if (!this.formCheck()) return
        // @ts-ignore
        this.$refs.modal.close()
        this.$emit('complete')
    }

    cancel() {
        // @ts-ignore
        this.$refs.modal.close()
        this.$emit('cancel')
    }

    getDataCY(pos: number) {
        return `mnemonic-in-${pos}`
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/variables';
@use '../../styles/abstracts/mixins';

.mnemonic_body {
    display: flex;
    flex-direction: column;
    padding: 30px;
    text-align: center;
    max-width: 100%;
    width: 450px;
    gap: var(--spacing-space-base);
}

.verify {
    position: fixed;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 99;
    display: flex;
    justify-content: center;
    align-items: center;
}

.bg {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
}

.content {
    position: relative;
    background-color: #fff;
    padding: 40px 30px;
    max-width: 100%;
    width: 700px;
    z-index: 1;
    border-radius: 14px;
}

.words {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 20px;
    @include mixins.typography-body-2;
    margin-top: var(--spacing-space-base);
}

.mnemonic_in {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid variables.$primary-color-light;
    outline: none;

    p {
        margin: 0 5px 0 0 !important;
        color: variables.$primary-color-light;
    }

    input {
        color: var(--primary-color);
        background-color: transparent;
        font-weight: 700;
        margin: 0;
        border: none;
        width: 40px;
        flex-grow: 1;

        &[disabled] {
            outline: none;
            pointer-events: none;
            opacity: 0.6;
        }
    }
}

.modal_btns {
    display: flex;
    justify-content: space-between;
}

.but_primary {
    width: 80%;
    margin: 0px auto;
    padding: 8px 30px;
}

.err {
    height: 60px;
    margin: 0px auto;
    text-align: left;
    color: var(--error);
}

@include mixins.mobile-device {
    .mnemonic_body {
        padding: 15px 30px;
        width: 100%;
        overflow-y: scroll;
        position: relative;
        height: 60vh;
    }

    .words {
        @include mixins.typography-caption;
        grid-gap: 14px;
    }
}
</style>
