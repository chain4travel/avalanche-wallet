<template>
    <div class="confirmation">
        <!--        <div>-->
        <!--            <label>{{ $t('earn.delegate.confirmation.node') }}</label>-->
        <!--            <p style="word-break: break-all">{{ nodeID }}</p>-->
        <!--        </div>-->
        <div>
            <label>{{ $t('earn.delegate.confirmation.amount') }}</label>
            <p>{{ amtText }} {{ nativeAssetSymbol }}</p>
        </div>
        <div>
            <label>{{ $t('earn.delegate.confirmation.start') }}</label>
            <p>{{ $t('earn.delegate.confirmation.start_desc') }}</p>
        </div>
        <div>
            <label>{{ $t('earn.delegate.confirmation.end') }}</label>
            <p>{{ end.toLocaleString() }}</p>
        </div>
        <div>
            <label>{{ $t('earn.delegate.confirmation.reward') }} ({{ walletType }})</label>
            <p style="word-break: break-all">{{ rewardAddress }}</p>
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
    // @Prop() start!: Date
    @Prop() end!: Date
    @Prop() amount!: BN
    @Prop() rewardAddress!: string
    @Prop() rewardDestination!: string

    // get startDate(){
    //     return new Date(this.start);
    // }
    //
    // get endDate(){
    //     return new Date(this.end);
    // }

    get amtBig(): Big {
        let stakeAmt = Big(this.amount.toString()).div(Math.pow(10, 9))
        return stakeAmt
    }

    get walletType() {
        if (this.rewardDestination === 'local') {
            return 'This wallet'
        }
        return 'Custom'
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
