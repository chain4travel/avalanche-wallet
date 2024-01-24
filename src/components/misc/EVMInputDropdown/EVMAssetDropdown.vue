<template>
    <div class="evm_dropdown hover_border" :active="isPopup" :disabled="disabled">
        <button @click="showPopup" :disabled="disabled">
            {{ symbol }}
        </button>
        <EVMTokenSelectModal
            ref="select_modal"
            @select="select"
            @selectCollectible="selectERCNft"
        ></EVMTokenSelectModal>
    </div>
</template>
<script lang="ts">
import Erc20Token from '@/js/Erc20Token'
import { WalletType } from '@/js/wallets/types'
import { Component, Prop, Vue } from 'vue-property-decorator'

import { iERCNftSelectInput } from '@/components/misc/EVMInputDropdown/types'
import EVMTokenSelectModal from '@/components/modals/EvmTokenSelect/EVMTokenSelectModal.vue'
import { bnToBig } from '@/helpers/helper'
import ERCNftToken from '@/js/ERCNftToken'
import Big from 'big.js'
@Component({
    components: { EVMTokenSelectModal },
})
export default class EVMAssetDropdown extends Vue {
    isPopup = false
    selected: Erc20Token | ERCNftToken | 'native' = 'native'

    @Prop({ default: false }) disabled!: boolean

    $refs!: {
        select_modal: EVMTokenSelectModal
    }

    get symbol() {
        if (this.selected === 'native') return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
        else return this.selected.data.symbol ?? this.selected.data.name
    }

    showPopup() {
        this.$refs.select_modal.open()
    }

    get avaxBalance(): Big {
        let w: WalletType | null = this.$store.state.activeWallet
        if (!w) return Big(0)
        let balBN = w.ethBalance
        return bnToBig(balBN, 18)
    }

    select(token: Erc20Token | 'native') {
        this.selected = token
        this.$emit('change', token)
    }

    clear() {
        this.select('native')
    }

    selectERCNft(val: iERCNftSelectInput) {
        this.selected = val.token
        this.$emit('changeCollectible', val)
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.evm_dropdown {
    position: relative;
}

button {
    text-align: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    @include mixins.typography-body-2;
}

.list {
    position: absolute;
    top: 0;
    left: 100%;
    width: 260px;
    max-height: 0px;
    z-index: 2;
    border-radius: var(--border-radius-sm);
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
    background-color: var(--bg);
}

.token_row {
    @include mixins.typography-caption;
    padding: 8px 18px;
    display: grid;
    grid-template-columns: max-content max-content 1fr;
    column-gap: 12px;
    cursor: pointer;
    user-select: none;

    > * {
        align-self: center;
    }

    img {
        height: 24px;
        object-fit: contain;
    }

    &:hover {
        //background-color: rgba(var(--bg-1), 0.5);
        background-color: var(--bg-light);
    }
}

.evm_dropdown[active] {
    .list {
        max-height: 240px;
    }
}

.col_bal {
    text-align: right;
}

@include mixins.mobile-device {
    .list {
        border-top-right-radius: 14px;
        border-top-left-radius: 14px;
        position: fixed;
        width: 100%;
        bottom: 0;
        left: 0;
        top: unset;
        height: 40vh;
    }

    .token_row {
        @include mixins.typography-body-2;
        border-bottom: 1px solid var(--bg-light);
        padding-top: 14px;
        padding-bottom: 14px;
        img {
            height: 30px;
        }
    }
}
</style>
