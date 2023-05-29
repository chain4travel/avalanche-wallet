<template>
    <div class="eps_row" @click.prevent="copyFullText" :pointer="copy === 1">
        <span class="eps_prefix">{{ prefix }}</span>
        <span class="eps_left">{{ left }}</span>
        <bdo class="eps_right">{{ right }}</bdo>
        <fa v-if="copy === 2" class="eps_copy" icon="copy" @click.prevent="copyText"></fa>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Ellipsis extends Vue {
    @Prop() text!: string
    @Prop({ default: 0 }) prefixPos!: number
    @Prop() copy!: number

    get prefix(): string {
        return this.text.slice(0, this.prefixPos)
    }

    get left(): string {
        const count = (this.text.length - this.prefixPos + 1) >> 1
        return this.text.slice(this.prefixPos, this.prefixPos + count)
    }

    get right(): string {
        const count = (this.text.length - this.prefixPos) >> 1
        return this.text
            .slice(this.prefixPos + count)
            .split('')
            .reverse()
            .join('')
    }

    copyText() {
        navigator.clipboard.writeText(this.text).then(() => {
            this.$store.dispatch('Notifications/add', {
                title: ' Copied',
                message: 'Copied to clipboard.',
            })
        })
    }

    copyFullText() {
        if (this.copy === 1) this.copyText()
    }
}
</script>

<style scoped lang="scss">
.eps_row {
    font-family: 'RobotoMono';
    overflow-x: hidden;
    display: flex;
    user-select: none;
    max-width: 100%;
    &[pointer] {
        cursor: pointer;
    }
}

.eps_prefix {
    white-space: nowrap;
}

.eps_left {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: end;
    flex-basis: 1px;
    flex-grow: 1;
    max-width: fit-content;
}

.eps_right {
    overflow: hidden;
    word-break: break-all;
    direction: rtl;
    height: 1.45em;
    flex-basis: 1px;
    flex-grow: 1;
    text-align: end;
}

.eps_copy {
    margin-left: 4px;
    margin-top: auto;
    margin-bottom: auto;
    cursor: pointer;
}
</style>
