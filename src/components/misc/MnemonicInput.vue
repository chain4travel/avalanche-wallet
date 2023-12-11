<template>
    <div>
        <div class="mnemonic_input">
            <div v-for="i in wordNum" :key="i" class="word">
                <p class="index">{{ i }}.</p>
                <input
                    :id="'i' + i"
                    autocapitalize="off"
                    spellcheck="false"
                    :type="isHidden && password ? 'password' : 'text'"
                    :class="getClass(phrase[i - 1])"
                    v-model="phrase[i - 1]"
                    @input="onChange(i - 1)"
                    :data-cy="getDataCY(i)"
                />
            </div>
        </div>
        <div class="show-hide-wrapper">
            <button @click="isHidden = !isHidden" class="hidden-toggle">
                <fa v-if="isHidden" icon="eye-slash"></fa>
                <fa v-else icon="eye"></fa>
            </button>
            <label>
                {{
                    isHidden
                        ? $t('access.mnemonic.showKeyPhrase')
                        : $t('access.mnemonic.hideKeyPhrase')
                }}
            </label>
        </div>
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { wordlists } from 'bip39'

@Component
export default class MnemonicDisplay extends Vue {
    @Prop() phrase!: string[]

    isHidden: boolean = true
    wordNum: number = 24
    password: boolean = false

    async mounted() {
        if (!(window.getComputedStyle(this.$el) as any).webkitTextSecurity) {
            this.password = true
        }
    }

    onQRChange(val: string) {
        this.$emit('replace', { value: val })
    }

    getClass(word: string): string {
        let ret = 'phrase_word'
        if (!(wordlists.EN.includes(word) || !word)) ret = ret + ' invalid_input'
        if (!this.password && this.isHidden) ret = ret + ' pass'
        return ret
    }

    onChange(i: number) {
        const next = this.phrase[i].at(-1) === ' '
        const corrected = this.phrase[i].trim().toLowerCase()
        const a = corrected.split(' ')
        if (a.length === 24) {
            this.$emit('update', { value: corrected, index: -1 })
            this.phrase = a
        } else {
            this.$emit('update', { value: a[0], index: i })
            if (next) {
                let next = document.getElementById('i' + (i + 2)) as HTMLInputElement
                if (next && next.focus) {
                    next.focus()
                    next.select()
                }
            }
            this.phrase[i] = a[0]
            this.phrase = this.phrase.map((v) => v)
        }
    }

    //Id for Cypress Test
    getDataCY(pos: number) {
        return `mnemonic-field-${pos}`
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/variables';
@use '../../styles/abstracts/mixins';

.mnemonic_input {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 6px;
    row-gap: 6px;
    @include mixins.typography-caption;
}

.word {
    display: flex;
    overflow: hidden;
    font-weight: 700;

    background-color: var(--bg);

    > * {
        padding: 16px 6px;
    }
}

.index {
    width: 22px;
    box-sizing: content-box;
    text-align: center;
    user-select: none;
    color: var(--primary-color);
    font-weight: 400;
    border-right: 2px solid var(--bg-light);
}

.phrase_word {
    text-align: center;
    overflow: scroll;
    white-space: nowrap;
    flex-grow: 1;
    color: var(--primary-color);
    max-width: 125px;
}

.invalid_input {
    border: #ff2115 1px solid;
}

p {
    text-align: left;
}

span {
    text-align: center;
}

.invalid_input {
    border: #ff2115 1px solid;
}
p {
    text-align: left;
}
span {
    text-align: center;
}
label {
    text-align: left;
    color: variables.$primary-color-light;
    @include mixins.typography-caption;
    margin-bottom: 20px;
}

.hidden-toggle {
    display: flex;
    align-items: flex-start;
    max-height: 1.25em;
    min-width: 1.25em;
}

.show-hide-wrapper {
    display: flex;
    gap: 4px;
    margin: 16px 0;
}

@include mixins.mobile-device {
    .word {
        * {
            padding: 4px 2px;
        }
    }

    .mnemonic_input {
        grid-template-columns: repeat(1, 1fr);
    }
}

@include mixins.medium-device {
    .mnemonic_input {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
