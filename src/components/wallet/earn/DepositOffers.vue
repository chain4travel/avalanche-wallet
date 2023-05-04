<template>
    <div v-if="hasOffers">
        <div class="user_offers">
            <DepositOfferCard
                v-for="(o, i) in platformOffers"
                :key="'o' + i"
                :offer="o"
                :maxDepositAmount="maxDepositAmount"
                class="reward_card"
            ></DepositOfferCard>
        </div>
    </div>
    <div v-else class="empty">No Active Saving Pool</div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Vue } from 'vue-property-decorator'

import { ZeroBN } from '@/constants'
import DepositOfferCard from '@/components/wallet/earn/DepositOfferCard.vue'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

@Component({
    components: {
        DepositOfferCard,
    },
})
export default class DepositOffers extends Vue {
    get platformOffers(): DepositOffer[] {
        return this.$store.getters['Platform/depositOffers'](true)
    }

    get hasOffers(): boolean {
        return this.platformOffers.length > 0
    }

    get maxDepositAmount(): BN {
        return ZeroBN
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.user_offers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    grid-gap: 1rem;
}

.claimables {
    margin-bottom: 10px;
}

@include mixins.medium-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
@include mixins.mobile-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
</style>
