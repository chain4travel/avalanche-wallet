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
import { Vue, Component, Prop } from 'vue-property-decorator'
import Erc20Token from '@/js/Erc20Token'
import { WalletType } from '@/js/wallets/types'

import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import EVMTokenSelectModal from '@/components/modals/EvmTokenSelect/EVMTokenSelectModal.vue'
import { iERCNftSelectInput } from '@/components/misc/EVMInputDropdown/types'
import ERCNftToken from '@/js/ERCNftToken'
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
        else return this.selected.data.symbol
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
.evm_dropdown {
    button {
        text-align: center;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }
}
</style>
