<template>
    <div class="utf_payload_view">
        <p>{{ text }}</p>
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { UTF8Payload } from '@c4tplatform/caminojs/dist/utils'

@Component
export default class UtfPayloadView extends Vue {
    @Prop() payload!: UTF8Payload

    get text() {
        return this.payload.getContent()
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/mixins';
p {
    height: 100%;
    @include mixins.typography-caption;
    padding: 12px 24px;
    word-break: break-word;
    overflow: scroll;
    background-color: var(--bg-light) !important;
    color: var(--primary-color) !important;
}
</style>
