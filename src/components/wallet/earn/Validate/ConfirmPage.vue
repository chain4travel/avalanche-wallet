<template>
    <div class="confirmation">
        <div>
            <label>{{ $t('earn.validate.confirmation.id') }}</label>
            <p style="word-break: break-all">{{ nodeID }}</p>
        </div>
        <div>
            <label>{{ $t('earn.validate.confirmation.amount') }}</label>
            <p>{{ amtText }} {{ nativeAssetSymbol }}</p>
        </div>
        <div>
            <label>{{ $t('earn.validate.confirmation.start') }}</label>
            <p v-if="isMultisig && txEnd">{{ txEnd.toLocaleString() }}</p>
            <p v-else>{{ $t('earn.validate.confirmation.start_desc', { time: timeSpan }) }}</p>
        </div>
        <div>
            <label>{{ $t('earn.validate.confirmation.end') }}</label>
            <p>{{ end.toLocaleString() }}</p>
        </div>
        <div v-if="txEnd && isMultisig">
            <label>{{ $t('earn.validate.confirmation.transaction_end') }}</label>
            <p>{{ txEnd.toLocaleString() }}</p>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { BN } from '@c4tplatform/caminojs/dist'
import Big from 'big.js'

@Component
export default class ConfirmPage extends Vue {
    @Prop() nodeID!: string
    @Prop() end!: Date
    @Prop() txEnd?: Date
    // @Prop() delegationFee!: number
    @Prop() amount!: BN
    @Prop() rewardAddress!: string
    @Prop() rewardDestination!: string
    @Prop() isMultisig!: boolean
    @Prop() timeSpan!: number

    get amtBig(): Big {
        let stakeAmt = Big(this.amount.toString()).div(Math.pow(10, 9))
        return stakeAmt
    }

    get walletType() {
        if (this.rewardDestination === 'local') {
            return this.$t('earn.validate.confirmation.type_local')
        }
        return this.$t('earn.validate.confirmation.type_custom')
    }

    get amtText(): string {
        let amt = this.amtBig
        return amt.toLocaleString(9)
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/mixins';
.confirmation {
    > div {
        background-color: var(--bg-light);
        margin: 14px 0;
        padding: 6px 14px;
        border-radius: var(--border-radius-sm);

        label {
            @include mixins.typography-caption;
            color: var(--primary-color-light);
        }
        p {
            @include mixins.typography-body-1;
        }
    }

    .err {
        @include mixins.typography-caption;
    }
}
</style>
