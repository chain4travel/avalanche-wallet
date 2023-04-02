<template>
    <div class="reg_row">
        <template>
            <p>RegisterNode</p>
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ITransactionData } from '@/store/modules/history/types'

@Component
export default class RegisterNodeTx extends Vue {
    @Prop() transaction!: ITransactionData
}
</script>
<style scoped lang="scss">
.reg_row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--primary-color-light);
}
</style>
