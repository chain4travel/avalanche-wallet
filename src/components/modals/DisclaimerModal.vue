<template>
    <modal :title="$t('kyc_process.title-disclaimer-modal')" ref="modal">
        <div class="modal__body">
            <p class="modal__body--text">
                {{ $t('kyc_process.disclaimer-modal') }}
            </p>
            <div class="modal__body--buttons">
                <button class="camino__primary--button" @click="close(false)">
                    {{ $t('kyc_process.disclaimer-modal-continue') }}
                </button>
                <button class="camino__negative--button" @click="close(true)">
                    {{ $t('kyc_process.disclaimer-modal-close') }}
                </button>
            </div>
        </div>
    </modal>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Modal from '@/components/modals/Modal.vue'

@Component({
    components: { Modal },
})
export default class Disclaimer extends Vue {
    $refs!: {
        modal: Modal
    }

    open() {
        this.$refs.modal.open()
    }
    close(value: boolean) {
        if (value) {
            this.$emit('change')
        }
        this.$refs.modal.close()
    }
}
</script>
<style scoped lang="scss">
.modal__body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    &--text {
        padding: 2rem;
        border: var(--primary-border);
        text-align: center;
        color: var(--primary-contrast-text);
        border-radius: var(--border-radius-sm);
        box-shadow: var(--box-shadow);
        background-color: var(--bg-light);
        font-size: 1.1rem;
    }
    button {
        font-family: 'Inter';
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        letter-spacing: 0em;
        text-align: left;
        margin: 0 !important;
    }
    &--buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
    }
}
</style>
