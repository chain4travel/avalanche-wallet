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
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
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
import { WalletHelper } from '@/helpers/wallet_helper'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import { AvaNetwork } from '@/js/AvaNetwork'

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

    loading: boolean = false
    pChainddress: string = ''
    isMultisignTx: boolean = false
    @Prop() pendingTx: any = undefined

    get symbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    $refs!: {
        modal_claim_reward: ModalClaimReward
    }

    mounted() {
        this.getClaimableReward()
        this.getPChainAddress()
        this.getPendingTransaction()
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

    get rewardOwner() {
        if (this.nodeInfo != null && this.nodeInfo != undefined) {
            return this.nodeInfo.rewardOwner.addresses[0].toString()
        } else {
            return null
        }
    }

    async getClaimableReward() {
        let responseClaimable = await WalletHelper.getClaimables(
            this.nodeInfo.rewardOwner.addresses[0].toString(),
            this.nodeInfo.txID
        )

        if (responseClaimable != null && responseClaimable != undefined) {
            this.rewardAmount = responseClaimable.validatorRewards
        } else {
            this.rewardAmount = new BN(0)
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

    async getPChainAddress() {
        try {
            if (this.$store.state.activeWallet instanceof MultisigWallet) {
                let activeWallet: MultisigWallet = this.$store.state.activeWallet
                let address = activeWallet.getCurrentAddressPlatform()
                this.pChainddress = address
                this.isMultisignTx = true
            } else {
                let activeWallet: WalletType = this.$store.state.activeWallet
                let address = await activeWallet.getAllAddressesP()
                this.pChainddress = address[0]
                this.isMultisignTx = false
            }
        } catch (e) {
            console.error(e)
        }
    }

    async getPendingTransaction() {
        if (this.isMultisignTx) {
            let txClaim = this.$store.getters['Signavault/transactions'].find(
                (item: any) =>
                    item?.tx?.alias === this.pChainddress &&
                    WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'ClaimTx'
            )
            this.pendingTx = txClaim
        } else {
            this.pendingTx = undefined
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

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
    }

    @Watch('pendingTx')
    async refresh() {
        this.loading = true
        await this.getClaimableReward()
        await this.getPChainAddress()
        await this.getPendingTransaction()
        this.loading = false
    }

    get feeTx() {
        return bnToBigAvaxX(ava.PChain().getTxFee())
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
