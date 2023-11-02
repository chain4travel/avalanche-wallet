<template>
    <div v-if="hasOffers">
        <h1 class="create-offer-header" v-if="isSuite">Create new DepositOffer</h1>
        <h4 class="balance">
            {{ $t('earn.offer.balance') }}: {{ cleanAvaxBN(maxDepositAmount) }}
            {{ nativeAssetSymbol }}
        </h4>
        <transition name="fade" mode="out-in">
            <CreateOfferForm
                :isSuite="isSuite"
                v-if="$data.createOffer"
                key="create"
                @selectOffer="selectOffer"
            ></CreateOfferForm>
            <div class="user_offers" key="list">
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
import { Component, Prop, Vue } from 'vue-property-decorator'

import CreateOfferForm from '@/components/wallet/earn/CreateOfferForm.vue'
import DepositForm from '@/components/wallet/earn/DepositForm.vue'
import DepositOfferCard from '@/components/wallet/earn/DepositOfferCard.vue'
import { cleanAvaxBN } from '@/helpers/helper'

import ModalAbortSigning from '@/components/wallet/earn/ModalAbortSigning.vue'
import { BN } from '@c4tplatform/caminojs/dist'
import { DepositOffer } from '@c4tplatform/caminojs/dist/apis/platformvm/interfaces'

@Component({
    components: {
        CreateOfferForm,
        DepositOfferCard,
        DepositForm,
        ModalAbortSigning,
    },
    data: () => ({
        depositOffer: undefined,
        createOffer: false,
    }),
})
export default class DepositOffers extends Vue {
    @Prop() isSuite?: boolean
    helpers = this.globalHelper()
    async beforeMount() {
        if (this.isSuite) {
            this.addOffer()
        }
    }

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

    get canAddOffers(): boolean {
        return this.$store.getters['Platform/isOfferCreator']
    }
    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    selectOffer(offer: DepositOffer): void {
        this.$data.depositOffer = offer
        if (offer === undefined && !this.isSuite) this.$data.createOffer = false
    }
    addOffer(): void {
        this.$data.createOffer = true
    }

    closeOffer(): void {
        this.$data.depositOffer = undefined
        this.$data.createOffer = false
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.close_offer {
    float: right;
}

.balance {
    color: var(--primary-color);
    font-family: 'Inter';
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
    line-height: 32px;
    margin-bottom: 20px;
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

.create-offer-header {
    color: var(--primary-color);
    font-family: 'Inter';
    font-size: 28px;
    font-style: normal;
    font-weight: 600;
    line-height: 36px;
    margin-bottom: 24px;
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
