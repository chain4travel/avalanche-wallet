<template>
    <div class="tx_out">
        <div class="addresses">
            <p v-for="addr in summary.addresses" :key="addr">
                {{ direction }} {{ chainPrefix + addr }}
            </p>
        </div>
        <p :class="'amount ' + colorClass">
            {{ amtText }}
            <template v-if="assetDetail">
                {{ assetDetail.symbol }}
            </template>
        </p>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { BaseTxAssetSummary } from '@/helpers/history_helper'
import AvaAsset from '@/js/AvaAsset'
import { bnToBig } from '@/helpers/helper'
import { BN } from '@c4tplatform/caminojs/dist'

@Component
export default class BaseTxOutput extends Vue {
    @Prop() assetID!: string
    @Prop() summary!: BaseTxAssetSummary
    @Prop() isDeposit!: string
    @Prop() chainPrefix!: string

    get assetDetail(): AvaAsset {
        return (
            this.$store.state.Assets.assetsDict[this.assetID] ||
            this.$store.state.Assets.nftFamsDict[this.assetID]
        )
    }

    get payload() {
        return this.summary.payload
    }

    get isProfit() {
        return this.isDeposit || this.summary.amount.gte(new BN(0))
    }

    get actionText() {
        if (this.isProfit) {
            return 'Receive'
        } else {
            return 'Send'
        }
    }

    get colorClass(): string {
        return this.isDeposit ? 'deposit' : this.isProfit ? 'profit' : ''
    }

    get direction() {
        if (this.isProfit) {
            return 'from'
        } else {
            return 'to'
        }
    }
    get amtText() {
        let big = bnToBig(
            this.isDeposit ? this.summary.deposited : this.summary.amount,
            this.assetDetail?.denomination || 0
        )
        return big.toLocaleString()
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/mixins';

.tx_out {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 12px;
}
.amount {
    text-align: right;
    white-space: nowrap;
    @include mixins.typography-body-2;
    color: #d04c4c;

    &.profit {
        color: var(--success);
    }

    &.deposit {
        color: var(--info);
    }
}

.addresses {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-self: center;
    p {
        overflow: hidden;
        color: var(--primary-color-light);
        white-space: nowrap;
        @include mixins.typography-caption;
        text-overflow: ellipsis;
    }

    label {
        line-height: 12px;
    }
}
label {
    @include mixins.typography-caption;
    color: var(--primary-color-light);
}

@include mixins.medium-device {
    .amount {
        @include mixins.typography-caption;
    }
}
</style>
