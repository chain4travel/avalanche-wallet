<template>
    <div class="term-of-us">
        <p>
            By using this application you agree to the
            <span class="link" @click="redirect('https://camino.network/terms/')">
                Terms of Use.
            </span>
        </p>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component({
    name: 'tos',
})
export default class ToS extends Vue {
    helpers = this.globalHelper()
    redirect(to: string) {
        window.open(to, '_blank')
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
