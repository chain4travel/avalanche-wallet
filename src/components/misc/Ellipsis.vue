<template>
    <div class="eps_row" @click.prevent="copyFullText" :pointer="copy === 1">
        <span ref="display" class="eps_field">{{ shortText }}</span>
        <fa v-if="copy === 2" class="eps_copy" icon="copy" @click.prevent="copyText"></fa>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Ellipsis extends Vue {
    @Prop() text!: string
    @Prop() title!: string
    @Prop({ default: 0 }) prefixPos!: number
    @Prop() copy!: number

    shortText: string = ''
    charWidth: number = 9

    mounted() {
        this.charWidth =
            (parseInt(window.getComputedStyle(this.$refs.display as Element).fontSize) * 9) / 15
        this.calcShortText()
    }

    @Watch('text')
    calcShortText() {
        const displayW = (this.$refs.display as HTMLSpanElement).clientWidth
        const allowedChars = Math.trunc(displayW / this.charWidth)
        if (this.text.length > allowedChars) {
            const deleteChars = this.text.length - allowedChars + 2
            const deletePos =
                this.prefixPos + ((this.text.length - this.prefixPos - deleteChars) >> 1)
            this.shortText =
                this.text.slice(0, deletePos) + '..' + this.text.slice(deletePos + deleteChars)
            return
        }
        this.shortText = this.text
    }

    copyText() {
        navigator.clipboard.writeText(this.text).then(() => {
            this.$store.dispatch('Notifications/add', {
                title: this.title + ' Copied',
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
    overflow-x: hidden;
    font-family: 'RobotoMono';
    width: 100%;
    max-width: 100%;
    user-select: none;
    display: flex;
    &[pointer] {
        cursor: pointer;
    }
}

.tape {
    display: block;
    width: 10ch;
    min-width: 10ch;
    height: 0px;
}

.eps_field {
    flex-grow: 1;
    width: 100%;
}

.eps_copy {
    margin-left: 4px;
    margin-top: auto;
    margin-bottom: auto;
    cursor: pointer;
}
</style>
