<template>
    <div class="camino__card">
        <h3 class="camino__card--title" v-if="title">{{ title }}</h3>
        <slot />
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class CamCard extends Vue {
    @Prop() title!: string
}
</script>
<style scoped lang="scss">
@use '../styles/abstracts/mixins';

.camino__card {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    font-size: 14px;
    padding: 1rem;
    border: 2px solid var(--border-color);
    &--title {
        margin-bottom: 1rem;
        text-transform: capitalize;
        @include mixins.typography-subtitle-2;
    }
}
</style>
