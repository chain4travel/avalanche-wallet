<template>
    <div class="radio_buts">
        <CamBtn
            v-for="(key, i) in keys"
            :key="key"
            @click="select(key)"
            :active="selection === key"
            variant="transparent"
        >
            {{ labels[i] }}
        </CamBtn>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator'
import CamBtn from '../CamBtn.vue'

@Component({
    name: 'radio',
    components: {
        CamBtn,
    },
})
export default class RadioButtons extends Vue {
    @Prop() labels!: string[]
    @Prop() keys!: string[]

    @Model('change', { type: String }) readonly selection!: string

    select(val: string) {
        this.$emit('change', val)
    }
}
</script>

<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.radio_buts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

button {
    &[active] {
        color: var(--white) !important;
        background-color: #0085ff;
        border: none;
    }
}
</style>
