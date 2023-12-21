<template>
    <div>
        <pending-multisig
            v-if="pendingTx !== undefined && pendingTx !== null"
            :multisigTx="pendingTx"
            @issued="issued"
            @refresh="refreshMultisignTx"
            :nodeId="nodeId"
            :nodeInfo="nodeInfo"
        ></pending-multisig>
        <div v-else>
            <div class="rewards-div">
                <div class="info_div">
                    <h4>{{ $t('validator.rewards.claim.claimable_validation') }}</h4>
                    <h1>{{ pRewardAmountText }} {{ symbol }}</h1>
                </div>
                <br />
                <div>
                    <h4 class="input_label">
                        {{ $t('validator.rewards.claim.reward_owner') }}
                    </h4>
                    <span class="disabled_input" role="textbox">
                        {{ rewardOwner }}
                    </span>
                </div>
                <br />
                <CamBtn
                    variant="primary"
                    @click="openModalClaimReward"
                    :disabled="disabledButtonRewards"
                    style="margin-left: auto"
                >
                    {{ $t('validator.rewards.claim.claim_rewards') }}
                </CamBtn>
            </div>
            <ModalClaimReward
                ref="modal_claim_reward"
                :amountText="pRewardAmountText"
                :symbol="symbol"
                :amount="rewardAmount"
                @beforeCloseModal="beforeCloseModal"
                :rewardOwner="rewardOwner"
                :pChainddress="pChainddress"
                :isMultisignTx="isMultisignTx"
            ></ModalClaimReward>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ModalClaimReward from './ModalClaimReward.vue'
import { ValidatorRaw } from '@/components/misc/ValidatorList/types'
import { BN } from '@c4tplatform/caminojs'
import AvaAsset from '@/js/AvaAsset'
import Big from 'big.js'
import PendingMultisig from './PendingMultisig.vue'
import Spinner from '@/components/misc/Spinner.vue'
import { ava } from '@/AVA'
import { bnToBigAvaxX } from '@/helpers/helper'
import CamBtn from '@/components/CamBtn.vue'

@Component({
    components: {
        ModalClaimReward,
        PendingMultisig,
        Spinner,
        CamBtn,
    },
})
export default class ClaimRewards extends Vue {
    @Prop() nodeId!: string
    @Prop() nodeInfo!: ValidatorRaw
    @Prop() rewardAmount: BN = new BN(0)
    @Prop() pChainddress: string = ''
    @Prop() isMultisignTx: boolean = false

    loading: boolean = false
    pendingTx: any = undefined

    get symbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    $refs!: {
        modal_claim_reward: ModalClaimReward
    }

    mounted() {
        this.refresh()
    }

    refresh() {
        this.$emit('refresh')
    }

    beforeCloseModal(claimed: boolean) {
        if (claimed) {
            this.getClaimableReward()
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
        } else if (this.isMultisignTx) {
            this.loading = true
            this.$store.dispatch('Signavault/updateTransaction')
            setTimeout(() => {
                this.getPendingTransaction()
                this.loading = false
            }, 100)
        }
    }

    openModalClaimReward() {
        this.$refs.modal_claim_reward.open()
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get pRewardAmountText() {
        if (!this.ava_asset) return '--'

        let denom = this.ava_asset.denomination
        let bal = this.rewardAmount
        let bigBal = Big(bal.toString())
        bigBal = bigBal.div(Math.pow(10, denom))

        if (bigBal.lt(Big('1'))) {
            return bigBal.toLocaleString(9)
        } else {
            return bigBal.toLocaleString(3)
        }
    }

    get disabledButtonRewards() {
        let rewardAmountInCam = parseFloat(bnToBigAvaxX(this.rewardAmount).toString())
        if (rewardAmountInCam <= parseFloat(this.feeTx.toString())) {
            return true
        } else {
            return false
        }
    }

    get rewardOwner() {
        if (this.nodeInfo != null && this.nodeInfo != undefined) {
            return this.nodeInfo.rewardOwner.addresses[0].toString()
        } else {
            return null
        }
    }

    async refreshMultisignTx() {
        await this.$store.dispatch('Signavault/updateTransaction')
        this.loading = true
        setTimeout(async () => {
            await this.getPendingTransaction()
            this.loading = false
        }, 100)
    }

    async issued() {
        this.loading = true
        await this.$store.dispatch('Signavault/updateTransaction')

        setTimeout(async () => {
            await this.getClaimableReward()
            await this.$store.dispatch('Assets/updateUTXOs')
            await this.$store.dispatch('History/updateTransactionHistory')
            this.pendingTx = undefined
            this.loading = false
        }, 100)
    }

    get feeTx() {
        return bnToBigAvaxX(ava.PChain().getTxFee())
    }

    getClaimableReward() {
        this.$emit('getClaimableReward')
    }

    getPendingTransaction() {
        this.$emit('getPendingTransaction')
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/main';

.rewards-div {
    margin-top: 1rem;
}

h4 {
    font-weight: normal;
}

.info_div {
    display: flex;
    flex-direction: column;
    min-height: 80px;
    padding: var(--spacing-space-md) var(--spacing-space-base);
    gap: var(--spacing-space-base);
    border: 1px solid var(--tailwind-slate-slate-600);
    border-radius: var(--border-radius-lg);
    width: 100%;
}

.input_label {
    margin-bottom: 0.5rem;
}

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;

    width: 20px;
    height: 20px;

    button {
        outline: none !important;
    }
    img {
        object-fit: contain;
        width: 100%;
    }

    .spinner {
        color: var(--primary-color) !important;
    }
}
</style>
