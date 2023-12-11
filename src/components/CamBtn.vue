<template>
    <button :class="buttonClass" :disabled="disabled || loading" @click="handleClick">
        <Spinner v-if="loading" />
        <div v-else>
            <slot></slot>
        </div>
    </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Spinner from '@/components/misc/Spinner.vue'

@Component({
    components: { Spinner },
})
export default class CamBtn extends Vue {
    @Prop({ default: 'primary' }) readonly variant!:
        | 'primary'
        | 'transparent'
        | 'negative'
        | 'accent'
    @Prop({ default: false }) readonly disabled!: boolean
    @Prop({ default: false }) readonly loading!: boolean
    @Prop({ default: () => {} }) readonly onClick!: Function

    get buttonClass() {
        return `camino__${this.variant}--button`
    }

    handleClick(event: Event) {
        if (this.disabled || this.loading) return
        if (this.onClick) this.onClick(event)
        this.$emit('click', event)
    }
}
</script>
