<template>
    <div class="tx_row" :day_change="source.isDayChange">
        <div class="tx_cols" data-cy="">
            <div class="explorer_col">
                <v-btn
                    icon
                    v-if="explorerUrl?.includes('https://')"
                    @click="openInNewTab(explorerUrl)"
                >
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-btn icon v-else-if="explorerUrl" @click="navigate(explorerUrl)">
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
            </div>
            <div class="meta_col">
                <div>
                    <label>Date</label>
                    <p class="time">
                        {{ date.toDateString() }}
                        <span>{{ date.toLocaleTimeString() }}</span>
                    </p>
                </div>
                <div v-if="memo" class="memo">
                    <label>MEMO</label>
                    <p>{{ memo }}</p>
                </div>
            </div>
            <div class="tx_detail" :data-cy="getDataCYTxDetail">
                <component :is="tx_comp" :transaction="source"></component>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Chain, ITransactionDataProcessed } from '@/store/modules/history/types'
import { AssetsDict, NftFamilyDict } from '@/store/modules/assets/types'

import StakingTx from '@/components/SidePanels/History/ViewTypes/StakingTx.vue'
import BaseTx from '@/components/SidePanels/History/ViewTypes/BaseTx.vue'
import ImportExport from '@/components/SidePanels/History/ViewTypes/ImportExport.vue'
import moment from 'moment'
import { AvaNetwork } from '@/js/AvaNetwork'
import getMemoFromByteString from '@/services/history/utils'

@Component({
    components: {
        StakingTx,
        BaseTx,
        ImportExport,
    },
})
export default class TxRow extends Vue {
    @Prop() index!: number
    @Prop() source!: ITransactionDataProcessed
    navigate(to: string) {
        window.open(to, '_blank', 'noreferrer')
    }
    openInNewTab(url: string) {
        window.open(url, '_blank', 'noreferrer')
    }

    get explorerUrl(): string {
        let network: AvaNetwork = this.$store.state.Network.selectedNetwork
        let chains = this.$store.state.History.chains
        if (network.explorerUrl && chains.length > 0) {
            let alias = chains?.find(
                (elem: Chain) => elem.chainID === this.source.chainID
            ).chainAlias
            let url = `/explorer/${network.name.toLowerCase()}/${alias}-chain/tx/${this.source.id}`
            return url
        } else return ''
    }

    get date() {
        return new Date(this.source.timestamp)
    }
    get type() {
        return this.source.type
    }

    get tx_comp() {
        switch (this.type) {
            case 'export':
            case 'import':
            case 'pvm_export':
            case 'pvm_import':
                return ImportExport
            case 'add_delegator':
            case 'add_validator':
                return StakingTx
            default:
                return BaseTx
        }
    }

    get assets(): AssetsDict {
        return this.$store.state.Assets.assetsDict
    }

    get nftFams(): NftFamilyDict {
        return this.$store.state.Assets.nftFamsDict
    }

    get memo(): string | null {
        const memo = this.source.memo
        return getMemoFromByteString(memo)
    }

    get mom() {
        return moment(this.source.timestamp)
    }
    get dayLabel() {
        return this.mom.format('dddd Do')
    }

    get monthLabel(): string {
        let month = this.mom.format('MMMM')
        return month
    }

    get yearLabel(): string {
        return this.mom.format('Y')
    }

    get getDataCYTxDetail() {
        return `tx-detail-${this.index}`
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.tx_row {
    //display: grid;
    //grid-template-columns: 1fr 1fr;
    padding: 1px 0px;
    @include mixins.typography-caption;
    //display: grid;
    //grid-template-columns: 1fr 1fr;
    margin-bottom: 0.5rem;
    &[day_change] {
        margin-top: 14px;
        padding-top: 14px;
    }
}
.tx_cols {
    display: grid;
    grid-template-columns: max-content 2fr 1fr;
    column-gap: 1rem;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: var(--spacing-space-lg);
    border-radius: var(--border-radius-xl);
}

.date {
    color: var(--primary-color);
    @include mixins.typography-caption;
    //display: flex;
    //max-width: 320px;
    //justify-content: space-between;
    padding-right: 30px;
    text-align: right;
    //padding-left: 40%;
}

.tx_detail {
    //margin-bottom: 8px;
    width: 100%;
}

.time {
    //color: var(--primary-color-light);
    @include mixins.typography-caption;

    span {
        margin-left: 12px;
    }
}
.memo {
    p {
        @include mixins.typography-caption;
    }
    overflow-wrap: break-word;
    width: 100%;
    max-width: 420px;
}

.meta_col {
    overflow: auto;
    display: grid;
    column-gap: 14px;
    grid-template-columns: max-content max-content;
}
.date_label {
    line-height: 24px;
    position: sticky;
    top: 0px;
    height: max-content;
    @include mixins.typography-subtitle-1;
    width: max-content;
    z-index: 2;
    //background-color: var(--bg);
}

.explorer_col {
    position: relative;
    .v-btn {
        color: var(--primary-color);
        opacity: 0.4;
        @include mixins.typography-caption;
        padding: 0px !important;
        & .v-icon {
            @include mixins.typography-subtitle-2;
        }

        &:hover {
            opacity: 1;
        }
    }
    *[tooltip]:hover:before {
        left: 60px;
    }
}

label {
    @include mixins.typography-caption;
    color: var(--primary-color-light);
}

@include mixins.mobile-device {
    .tx_cols {
        grid-template-columns: max-content 1fr;
    }

    .meta_col {
        border-bottom: 1px solid var(--bg);
        padding-bottom: 8px;
        margin-bottom: 8px;
    }

    .tx_detail {
        grid-column: 2/3;
        grid-row: 2;
    }
}
</style>
