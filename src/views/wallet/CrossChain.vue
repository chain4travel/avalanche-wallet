<template>
    <div>
        <div class="head">
            <h2>{{ $t('cross_chain.title') }}</h2>
            <p>
                {{ $t('cross_chain.desc') }}
            </p>
        </div>
        <ChainTransfer></ChainTransfer>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

import ChainTransfer from '@/components/wallet/ChainTransfer/ChainTransfer.vue'
@Component({
    name: 'cross_chain',
    components: {
        ChainTransfer,
    },
})
export default class CrossChain extends Vue {}
</script>
<style scoped lang="scss">
h2 {
    font-weight: normal;
}
.head {
    margin-bottom: 14px;
}
</style>
