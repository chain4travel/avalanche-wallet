<template>
    <div v-if="hasRewards">
        <div class="claimables">
            <ClaimableRewardCard
                v-for="(v, i) in platformRewards.treasuryRewards"
                :key="'c' + i"
                :reward="v"
            ></ClaimableRewardCard>
        </div>
        <div class="user_offers">
            <DepositRewardCard
                v-for="(v, i) in platformRewards.depositRewards"
                :key="'u' + i"
                :reward="v"
                class="reward_card"
            ></DepositRewardCard>
        </div>
    </div>
    <div v-else class="empty">No Active Earning</div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Vue } from 'vue-property-decorator'

import ClaimableRewardCard from '@/components/wallet/earn/ClaimableRewardCard.vue'
import DepositRewardCard from '@/components/wallet/earn/DepositRewardCard.vue'
import { PlatformRewards } from '@/store/modules/platform/types'

@Component({
    components: {
        ClaimableRewardCard,
        DepositRewardCard,
    },
})
export default class UserRewards extends Vue {
    get platformRewards(): PlatformRewards {
        return this.$store.state.Platform.rewards
    }

    get hasRewards(): boolean {
        return (
            this.platformRewards.depositRewards.length > 0 ||
            this.platformRewards.treasuryRewards.length > 0
        )
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
