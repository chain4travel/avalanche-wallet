<template>
    <div v-if="hasOffers">
        <h4 class="balance">
            {{ $t('earn.rewards.offer.balance') }}: {{ cleanAvaxBN(maxDepositAmount) }}
            {{ nativeAssetSymbol }}
            <button v-if="$data.depositOffer" @click="closeOffer" class="close_offer">
                <fa icon="times"></fa>
            </button>
        </h4>
        <transition name="fade" mode="out-in">
            <div v-if="$data.depositOffer" class="user_offers" key="offer">
                <DepositOfferCard
                    :key="'os'"
                    :offer="$data.depositOffer"
                    :maxDepositAmount="maxDepositAmount"
                    class="reward_card"
                ></DepositOfferCard>
                <DepositForm
                    :key="'of'"
                    :offer="$data.depositOffer"
                    :maxDepositAmount="maxDepositAmount"
                    @selectOffer="selectOffer"
                    class="reward_card"
                ></DepositForm>
            </div>
            <div v-else class="user_offers" key="list">
                <DepositOfferCard
                    v-for="(o, i) in platformOffers"
                    :key="'o' + i"
                    :offer="o"
                    :maxDepositAmount="maxDepositAmount"
                    @selectOffer="selectOffer"
                    class="reward_card"
                ></DepositOfferCard>
            </div>
        </transition>
    </div>
    <div v-else class="empty">No Active Saving Pool</div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Vue } from 'vue-property-decorator'

import DepositOfferCard from '@/components/wallet/earn/DepositOfferCard.vue'
import DepositForm from '@/components/wallet/earn/DepositForm.vue'
import { cleanAvaxBN } from '@/helpers/helper'

import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

@Component({
    components: {
        DepositOfferCard,
        DepositForm,
    },
    data: () => ({
        depositOffer: undefined,
    }),
})
export default class DepositOffers extends Vue {
    get platformOffers(): DepositOffer[] {
        return this.$store.getters['Platform/depositOffers'](true)
    }

    get hasOffers(): boolean {
        return this.platformOffers.length > 0
    }

    get maxDepositAmount(): BN {
        return this.$store.getters['Assets/walletPlatformBalanceUnlocked'].add(
            this.$store.getters['Assets/walletPlatformBalanceBonded']
        )
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    selectOffer(offer: DepositOffer): void {
        this.$data.depositOffer = offer
    }

    closeOffer(): void {
        this.$data.depositOffer = undefined
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.close_offer {
    float: right;
}

.balance {
    font-weight: 500;
    padding-bottom: 10px;
}

.user_offers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    grid-gap: 1rem;
    transition-duration: 0.2s;
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
