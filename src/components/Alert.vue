<template>
    <div class="camino-alert" :class="['camino-alert__' + variant]">
        <template v-if="variant === 'default'">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22ZM11 7H13V9H11V7ZM14 17H10V15H11V13H10V11H13V15H14V17Z"
                    fill="#334155"
                />
            </svg>
        </template>
        <template v-else-if="variant === 'info'">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22ZM11 7H13V9H11V7ZM14 17H10V15H11V13H10V11H13V15H14V17Z"
                    fill="#0085FF"
                />
            </svg>
        </template>
        <template v-else-if="variant === 'positive'">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                    fill="#18B728"
                />
            </svg>
        </template>
        <template v-else-if="variant === 'warning'">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" fill="#E5A21F" />
            </svg>
        </template>
        <template v-else-if="variant === 'negative'">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 2C17.53 2 22 6.47 22 12C22 17.53 17.53 22 12 22C6.47 22 2 17.53 2 12C2 6.47 6.47 2 12 2ZM15.59 7L12 10.59L8.41 7L7 8.41L10.59 12L7 15.59L8.41 17L12 13.41L15.59 17L17 15.59L13.41 12L17 8.41L15.59 7Z"
                    fill="#E5431F"
                />
            </svg>
        </template>
        <div class="camino-alert--content">
            <div v-if="title" class="camino__alert--title">{{ title }}</div>
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Alert extends Vue {
    @Prop({ default: 'default' }) variant!: 'default' | 'info' | 'positive' | 'warning' | 'negative'
    @Prop({ default: '' }) title!: string
}
</script>

<style lang="scss" scoped>
.camino-alert {
    display: flex;
    max-width: fit-content;
    padding: 16px;
    align-items: flex-start;
    gap: 12px;
    border-radius: 6px;
    font-family: Inter;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;

    &--content {
        color: var(--camino-slate-slate-300);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        flex: 1 0 0;
        text-align: initial;
    }

    &__title {
        color: var(--camino-slate-white);
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
    }

    &__default {
        border: 1px solid var(--camino-slate-slate-300, #cbd4e2);
        background: var(--camino-slate-slate-100, #f1f5f9);
    }

    &__info {
        border: 1px solid rgba(0, 133, 255, 0.5);
        background: rgba(0, 133, 255, 0.05);
    }

    &__positive {
        border: 1px solid rgba(9, 222, 107, 0.5);
        background: rgba(9, 222, 107, 0.05);
    }

    &__warning {
        border: 1px solid var(--camino-warning-border);
        background: var(--camino-warning-background);
    }

    &__negative {
        border: 1px solid rgba(229, 67, 31, 0.5);
        background: rgba(229, 67, 31, 0.05);
    }

    svg {
        min-width: 20px;
    }
}

[data-theme='day'] {
    .camino-alert {
        &__content {
            color: var(--camino-slate-slate-700);
        }

        &__title {
            color: var(--camino-slate-slate-800);
        }
    }
}
</style>
