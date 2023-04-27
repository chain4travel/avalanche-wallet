<template>
    <div class="claim_row">
        <h2>{{ title }}</h2>
        <div class="claim_amount">
            <label>{{ $t('earn.rewards.active_earning.pending_reward') }}:</label>
            <p class="reward">{{ cleanAvaxBN(pendingRewards) }} {{ nativeAssetSymbol }}</p>
        </div>
        <div class="claim_button_container">
            <button
                class="claim_button button_primary"
                @click="openModal"
                :disabled="!isClaimDisabled"
            >
                {{ $t('earn.rewards.active_earning.claim') }}
            </button>
        </div>
        <ModalClaimReward
            ref="modal_claim_reward"
            :amount="pendingRewards"
            :rewardOwner="rewardOwner"
        />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { cleanAvaxBN } from '@/helpers/helper'
import ModalClaimReward from '@/components/modals/ClaimRewardModal.vue'
import { RewardOwner } from '@/components/misc/ValidatorList/types'

import { BN } from '@c4tplatform/caminojs/dist'

@Component({
    components: {
        ModalClaimReward,
    },
})
export default class ClaimableRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null
    claimDisabled: boolean = true

    @Prop() title!: string
    @Prop() pendingRewards!: BN
    @Prop() rewardOwner!: RewardOwner

    $refs!: {
        modal_claim_reward: ModalClaimReward
    }

    get nativeAssetSymbol(): string {
        const asset = this.$store.getters['Assets/AssetAVA']
        return asset?.symbol ?? ''
    }

    get isClaimDisabled() {
        return !this.pendingRewards.isZero()
    }

    cleanAvaxBN(val: BN): string {
        return cleanAvaxBN(val)
    }

    openModal() {
        this.$refs.modal_claim_reward.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';

.claim_row {
    display: flex;
    justify-content: space-between;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    font-size: 14px;
    background-color: var(--bg-light);
    padding: 1rem;
    > h2 {
        margin-bottom: 1em;
    }
    > div {
        display: flex;
    }
}

.claim_amount {
    label {
        color: var(--primary-color-light) !important;
    }
    flex-direction: column;
}

.claim_button {
    border-radius: var(--border-radius-sm);
    padding: 8px 30px;
    height: max-content;
    align-self: flex-end;
    margin-left: auto;
    &[disabled] {
        background-color: var(--primary-color) !important;
    }
}

@include mixins.mobile-device {
    .claim_row {
        flex-direction: column;
    }
}
</style>
