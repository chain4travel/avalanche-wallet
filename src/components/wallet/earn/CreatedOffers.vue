<template>
    <div>
        <h1 class="create-offer-header" v-if="isSuite">Manage Whitelisting</h1>
        <div class="cards__container">
            <DepositOfferCard
                v-for="(o, i) in platformOffers"
                :key="'o' + i"
                :offer="o"
                :maxDepositAmount="maxDepositAmount"
                @selectOffer="() => {}"
                class="reward_card"
                :isWhiteListing="true"
            ></DepositOfferCard>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

import CamInput from '@/components/CamInput.vue'
import CamTooltip from '@/components/misc/CamTooltip.vue'
import DepositOfferCard from '@/components/wallet/earn/DepositOfferCard.vue'
import { BN } from '@c4tplatform/caminojs'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'
@Component({
    components: {
        CamInput,
        CamTooltip,
        DepositOfferCard,
    },
    data: () => ({
        createOffer: false,
    }),
})
export default class CreatedOffers extends Vue {
    @Prop() isSuite?: boolean
    @Prop() navigate?: (path: string) => void
    addresses: { address: string; depositOfferID: string }[] = [{ address: '', depositOfferID: '' }]

    // @ts-ignore
    helpers = this.globalHelper()

    get platformOffers(): DepositOffer[] {
        return this.$store.getters['Platform/CreatedDepositOffer'](true)
    }
    get maxDepositAmount(): BN {
        return this.$store.getters['Assets/walletPlatformBalanceUnlocked'].add(
            this.$store.getters['Assets/walletPlatformBalanceBonded']
        )
    }
    removeAddress(index: number): void {
        this.addresses.splice(index, 1)
        if (this.addresses.length === 0) this.addAddress()
    }
    addAddress(): void {
        if (this.addresses.length >= 128) return
        this.addresses.push({ address: '', depositOfferID: '' })
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.create-offer-header {
    color: var(--primary-color);
    font-family: 'Inter';
    font-size: 28px;
    font-style: normal;
    font-weight: 600;
    line-height: 36px;
    margin-bottom: 24px;
}
.cards__container {
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
