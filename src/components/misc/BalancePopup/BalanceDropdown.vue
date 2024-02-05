<template>
    <div class="dropdown hover_border" :active="isPopup">
        <button @click="showPopup" :disabled="disabled">
            {{ symbol }}
        </button>
        <AvmTokenSelect
            ref="token_modal"
            @select="onselect"
            :assets="assetArray"
            :disabled-ids="disabledIds"
            :chain-id="chainId"
        ></AvmTokenSelect>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Model, Prop, Vue } from 'vue-property-decorator'

import BalancePopup from '@/components/misc/BalancePopup/BalancePopup.vue'
import AvmTokenSelect from '@/components/modals/AvmTokenSelect.vue'
import { ChainIdType } from '@/constants'
import AvaAsset from '@/js/AvaAsset'

@Component({
    components: {
        AvmTokenSelect,
        BalancePopup,
    },
})
export default class BalanceDropdown extends Vue {
    isPopup: boolean = false

    @Prop({ default: () => [] }) disabled_assets!: AvaAsset[]
    @Prop({ default: false }) disabled!: boolean
    @Model('change', { type: AvaAsset }) readonly asset!: AvaAsset
    @Prop() chainId!: ChainIdType

    get assetArray(): AvaAsset[] {
        return this.$store.getters['Assets/walletAssetsArray']
    }

    $refs!: {
        popup: BalancePopup
        token_modal: AvmTokenSelect
    }

    get disabledIds(): string[] {
        let disabledIds = this.disabled_assets.map((a) => a.id)
        return disabledIds
    }

    get symbol() {
        let sym = this.asset.symbol
        return sym
    }

    showPopup() {
        this.$refs.token_modal.open()
    }

    onclose() {}

    onselect(asset: AvaAsset) {
        this.$emit('change', asset)
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

button {
    text-align: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    @include mixins.typography-body-2;
}

.dropdown {
    position: relative;
    &:focus-within {
        outline: 1px solid var(--secondary-color);
    }
    > button {
        text-align: center;
    }
}

.dropdown[active] {
    button {
        svg {
            transform: rotateZ(180deg);
        }
    }
}
.popup {
    position: absolute;
}
</style>
