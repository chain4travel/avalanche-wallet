<template>
    <div class="avax_input__container">
        <div class="avax_input">
            <div
                :class="
                    'col1'
                        .concat(readonly ? '' : ' hover_border')
                        .concat(camInput ? ' cam-input' : '')
                "
            >
                <button class="max_but" @click="maxOut" v-if="max">MAX</button>
                <BigNumInput
                    ref="amt_in"
                    class="amt_in"
                    contenteditable="amt_in"
                    :denomination="9"
                    :max="max"
                    placeholder="0.00"
                    @change="amount_in"
                    :readonly="readonly"
                    :initial="initial"
                ></BigNumInput>
            </div>
            <p :class="'ticker'.concat(camInput ? ' cam-input' : '')">{{ nativeAssetSymbol }}</p>
            <div v-if="balance" class="balance">
                <div>
                    <p>
                        <b>{{ $t('misc.balance') }}:</b>
                        {{ balanceBig }}
                    </p>
                </div>
                <div></div>
            </div>
        </div>
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
import { Big } from '@/helpers/helper'
import 'reflect-metadata'
import { Component, Model, Prop, Vue } from 'vue-property-decorator'
//@ts-ignore
import { BN } from '@c4tplatform/caminojs/dist'
import { BigNumInput } from '@c4tplatform/vue_components'
import { priceDict } from '../../store/types'

@Component({
    components: {
        BigNumInput,
    },
})
export default class AvaxInput extends Vue {
    @Model('change', { type: Object }) readonly amount!: BN
    @Prop({
        default: null,
    })
    max?: BN | null
    @Prop() initial?: BN
    @Prop() balance?: Big | null
    @Prop() alias?: string
    @Prop() readonly?: boolean
    @Prop() camInput?: boolean
    @Prop({ default: false }) error!: boolean
    @Prop({ default: '' }) errorMessage!: string

    maxOut(ev: MouseEvent) {
        ev?.preventDefault()
        ev?.stopPropagation()
        //@ts-ignore
        this.$refs.amt_in.maxout()
    }
    reset() {
        //@ts-ignore
        this.$refs.amt_in.clear()
    }
    amount_in(val: BN) {
        this.$emit('change', val)
    }

    get balanceBig(): string {
        if (!this.balance) return ''

        let fixedStr = this.balance?.toFixed(9)
        let split = fixedStr?.split('.')
        let wholeStr = parseInt(split[0])
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, '\u200A')

        if (split.length === 1) {
            return wholeStr
        } else {
            let remainderStr = split[1]

            // remove trailing 0s
            let lastChar = remainderStr.charAt(remainderStr.length - 1)
            while (lastChar === '0') {
                remainderStr = remainderStr.substring(0, remainderStr.length - 1)
                lastChar = remainderStr.charAt(remainderStr.length - 1)
            }

            let trimmed = remainderStr.substring(0, 9)
            if (!trimmed) return wholeStr
            return `${wholeStr}.${trimmed}`
        }
    }

    get priceDict(): priceDict {
        return this.$store.state.prices
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.avax_input {
    &__container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    display: grid;
    grid-template-columns: 1fr max-content;
    grid-gap: 0px 10px;
    color: var(--primary-color);
    width: 100%;

    .amt_in {
        color: var(--primary-color);
        @include mixins.typography-body-2;
        flex-grow: 1;
        flex-shrink: 1;
        display: block;
        box-sizing: content-box;
        outline: none !important;
        border: none !important;
        /* text-align: left !important; */
        &[readonly] {
            color: var(--primary-color-light);
            cursor: pointer;
        }
    }

    .ticker,
    .amt_in,
    .max_but {
        background-color: var(--bg-light);
    }
}

.balance {
    display: grid;
    column-gap: 10px;
    @include mixins.typography-body-2;
    color: var(--primary-color-light);
    padding: 2px 0px;

    > div {
        display: flex;
        justify-content: space-between;
    }

    p {
        text-align: left;
        padding: 2px 0px;
    }

    p:last-child {
        text-align: right;
    }

    span {
        font-family: var(--primary-font);
        padding-left: 14px;
    }
}

.col1 {
    border-radius: var(--border-radius-sm);
    background-color: var(--bg-light);
    display: grid;
    grid-template-columns: max-content 1fr;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    position: relative;
}

.cam-input {
    background-color: transparent !important;
    border-radius: 8px;
    border: 1px solid var(--camino-slate-slate-600);
    input,
    p {
        background-color: transparent !important;
    }
    display: flex;
    .ticker,
    .amt_in,
    .max_but {
        background-color: transparent;
    }
}
.ticker {
    border-radius: var(--border-radius-sm);
    padding: 10px 12px;
    border: 1px solid var(--camino-slate-slate-600);
    &:disabled {
        border: 1px solid var(--camino-slate-slate-600) !important;
    }
}

.max_but {
    @include mixins.typography-caption;
    opacity: 0.4;
    &:hover {
        opacity: 1;
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
        line-height: 20px;
    }
}

@include mixins.mobile-device {
    .balance {
        @include mixins.typography-caption;
    }
}
</style>
