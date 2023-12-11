<template>
    <div class="cam-input">
        <input
            class="full-width-input"
            :placeholder="placeholder"
            :value="value"
            @input="updateValue"
            :class="{ error: error }"
            :disabled="disabled"
        />
        <div class="validation-message" v-if="error && errorMessage">
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M10.8333 10.8333H9.16666V5.83332H10.8333M10.8333 14.1667H9.16666V12.5H10.8333M9.99999 1.66666C8.90564 1.66666 7.82201 1.8822 6.81096 2.30099C5.79991 2.71978 4.88125 3.33361 4.10743 4.10743C2.54463 5.67024 1.66666 7.78985 1.66666 9.99999C1.66666 12.2101 2.54463 14.3297 4.10743 15.8925C4.88125 16.6664 5.79991 17.2802 6.81096 17.699C7.82201 18.1178 8.90564 18.3333 9.99999 18.3333C12.2101 18.3333 14.3297 17.4553 15.8925 15.8925C17.4553 14.3297 18.3333 12.2101 18.3333 9.99999C18.3333 8.90564 18.1178 7.82201 17.699 6.81096C17.2802 5.79991 16.6664 4.88125 15.8925 4.10743C15.1187 3.33361 14.2001 2.71978 13.189 2.30099C12.178 1.8822 11.0943 1.66666 9.99999 1.66666Z"
                    fill="#E5431F"
                />
            </svg>
            <p class="err">
                {{ errorMessage }}
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class CamInput extends Vue {
    @Prop({ default: '' }) placeholder!: string
    @Prop({ default: false }) error!: boolean
    @Prop({ default: '' }) errorMessage!: string
    @Prop({ default: '' }) value!: string
    @Prop({ default: false }) disabled!: boolean
    updateValue(event: Event) {
        this.$emit('input', (event.target as HTMLInputElement).value)
    }
}
</script>
<style scoped lang="scss">
.v-application .error {
    background-color: transparent !important;
    border: 1px solid var(--camino-slate-slate-600);
    &:disabled {
        border: 1px solid var(--camino-slate-slate-600) !important;
    }
}
.cam-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--camino-slate-slate-600);
    &:disabled {
        border: 1px solid var(--camino-slate-slate-600) !important;
    }
}

.full-width-input {
    /* flex: 1; */
    &:focus {
        border-color: var(--camino-brand-too-blue-to-be-true);
        box-shadow: 0px 0px 0px 3px var(--camino-brand-too-blue-to-be-true-100);
    }
    &.error {
        border-color: var(--camino-brand-error);
    }
    &.error:focus {
        border-color: var(--camino-brand-error);
        box-shadow: 0px 0px 0px 3px var(--camino-brand-error-100);
    }
}

.validation-message {
    display: flex;
    align-items: center;
    gap: 8px;
    p {
        color: var(--camino-brand-error, #e5431f);
        font-family: Inter;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 142.857% */
    }
}
</style>
