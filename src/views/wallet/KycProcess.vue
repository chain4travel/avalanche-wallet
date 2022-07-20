<template>
    <div>
        <div class="head">
            <h1>{{ $t('kyc_process.title') }}</h1>
            <p>
                {{ $t('kyc_process.desc') }}
            </p>
        </div>
        <KycForm></KycForm>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import KycForm from '@/components/wallet/advanced/KycForm.vue'

@Component({
    name: 'kyc_process',
    components: { KycForm },
})
export default class KycProcess extends Vue {}
</script>
<style scoped lang="scss">
h1 {
    font-weight: normal;
}

.head {
    margin-bottom: 14px;
}
</style>
