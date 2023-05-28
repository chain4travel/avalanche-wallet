<template>
    <div class="eps_row" @click.prevent="copyFullText" :pointer="!copy">
        <span class="eps_prefix">{{ prefix }}</span>
        <span class="eps_left">{{ left }}</span>
        <bdo class="eps_right">{{ right }}</bdo>
        <fa v-if="copy" class="eps_copy" icon="copy" @click.prevent="copyText"></fa>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Ellipsis extends Vue {
    @Prop() text!: string
    @Prop({ default: 0 }) prefixPos!: number
    @Prop() copy!: boolean

    get prefix(): string {
        return this.text.slice(0, this.prefixPos)
    }

    get left(): string {
        const count = (this.text.length - this.prefixPos) >> 1
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
        if (!this.copy) this.copyText()
    }
}
</script>

<style scoped lang="scss">
.eps_row {
    overflow-x: hidden;
    display: inline-grid;
    grid-template-columns: auto 1.1fr 0.9fr auto;

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
    text-align: right;
}

.eps_right {
    overflow: hidden;
    word-break: break-all;
    direction: rtl;
    height: 1.45em;
}

.eps_copy {
    margin-left: 4px;
    margin-top: auto;
    margin-bottom: auto;
    cursor: pointer;
}
</style>
