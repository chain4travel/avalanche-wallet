<template>
    <div class="term-of-us">
        <p>
            By using this application you agree to the
            <a class="link" @click="redirect()" href="#" target="_blank" rel="noopener noreferrer">
                Terms of Use.
            </a>
        </p>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component({
    name: 'tos',
})
export default class ToS extends Vue {
    url: string = 'https://camino.network/terms/'
    redirect() {
        window.open(this.url, '_blank')
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';
.term-of-us {
    color: var(--primary-color-light);
    @include mixins.typography-caption;
}
.link {
    color: var(--primary-color) !important;
    cursor: pointer;
}
</style>
