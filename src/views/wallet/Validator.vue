<template>
    <div class="earn_page">
        <div class="header">
            <h2 :class="depositAndBond ? '' : 'wrong_network'">{{ $t('earn.subtitle1') }}</h2>
        </div>
        <transition name="fade" mode="out-in">
            <div>
                <p v-if="loading !== 0">Loading...</p>
                <p v-else-if="!depositAndBond" class="wrong_network">{{ $t('earn.warning_3') }}</p>
                <p v-else-if="!hasValidator && !canValidate" class="no_balance">
                    {{ $t('earn.warning_1', [minStakeAmt.toLocaleString()]) }}
                </p>
                <p v-else-if="!hasRegisteredNodeID" class="no_balance">
                    <register-node
                        :isKycVerified="isKycVerified"
                        :isConsortiumMember="isConsortiumMember"
                        :minPlatformUnlocked="minPlatformUnlocked"
                        :hasEnoughLockablePlatformBalance="hasEnoughLockablePlatformBalance"
                        @registered="nodeRegistered"
                    ></register-node>
                </p>
                <p v-else-if="isSuspended" class="wrong_network">
                    {{ $t('earn.validate.errs.suspended') }}
                </p>
                <p v-else-if="hasValidator" class="wrong_network">
                    {{ $t('earn.validate.errs.validating', { nodeID: registeredNodeID }) }}
                </p>
                <template v-else>
                    <add-validator :nodeID="registeredNodeID"></add-validator>
                </template>
            </div>
        </transition>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Watch } from 'vue-property-decorator'
import AddValidator from '@/components/wallet/earn/Validate/AddValidator.vue'
import { BN } from '@c4tplatform/caminojs/dist'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import { WalletHelper } from '@/helpers/wallet_helper'
import RegisterNode from '@/components/wallet/earn/Validate/RegisterNode.vue'
import {
    ADDRESSSTATECONSORTIUM,
    ADDRESSSTATEDEFERRED,
    ADDRESSSTATEKYCVERIFIED,
} from '@c4tplatform/caminojs/dist/apis/platformvm/addressstatetx'
import { WalletCore } from '@/js/wallets/WalletCore'
import { ava } from '@/AVA'
import { AvaNetwork } from '@/js/AvaNetwork'

@Component({
    name: 'validator',
    components: {
        RegisterNode,
        AddValidator,
    },
})
export default class Validator extends Vue {
    isKycVerified = false
    isConsortiumMember = false
    isSuspended = false
    registeredNodeID = ''
    intervalID: any = null
    loading = 0

    async updateValidators() {
        await this.$store.dispatch('Platform/updateValidators')
    }

    activated() {
        this.loading = 1
        this.updateValidators().then(() => this.evaluateCanRegisterNode())
    }

    deactivated() {
        clearInterval(this.intervalID)
    }

    nodeRegistered(nodeId: string) {
        this.registeredNodeID = nodeId
    }

    @Watch('$store.state.network')
    @Watch('$store.state.activeWallet')
    evaluateCanRegisterNode() {
        const BN_ONE = new BN(1)
        const p1 = WalletHelper.getAddressState(this.staticAddress).then((result) => {
            this.isKycVerified = !result.and(BN_ONE.shln(ADDRESSSTATEKYCVERIFIED)).isZero()
            this.isConsortiumMember = !result.and(BN_ONE.shln(ADDRESSSTATECONSORTIUM)).isZero()
            this.isSuspended = !result.and(BN_ONE.shln(ADDRESSSTATEDEFERRED)).isZero()
        })
        const p2 = WalletHelper.getRegisteredNode(this.staticAddress).then(
            (nodeID) => (this.registeredNodeID = nodeID),
            () => (this.registeredNodeID = '')
        )
        Promise.all([p1, p2]).then(
            () => (this.loading &= ~1),
            () => (this.loading &= ~1)
        )
    }

    @Watch('network')
    onInitNetworkChange() {
        this.loading = 3
    }

    @Watch('assetLoading')
    onAssetLoading(current: boolean) {
        if (!current) setTimeout(() => (this.loading &= ~2), 500)
    }

    get hasEnoughLockablePlatformBalance(): boolean {
        return this.totBal.gte(this.minPlatformUnlocked)
    }

    get staticAddress() {
        return (this.$store.state.activeWallet as WalletCore).getStaticAddress('P')
    }

    get platformUnlocked(): BN {
        if (this.depositAndBond) return this.$store.getters['Assets/walletPlatformBalanceUnlocked']
        else return this.$store.getters['Assets/walletPlatformBalance']
    }

    get minPlatformUnlocked(): BN {
        return ava.getNetwork().P.minStake
    }

    get depositAndBond(): boolean {
        return this.$store.getters['Network/depositAndBond']
    }

    get platformLockedStakeable(): BN {
        if (this.depositAndBond) return this.$store.getters['Assets/walletPlatformBalanceDeposited']
        return this.$store.getters['Assets/walletPlatformBalanceLockedStakeable']
    }

    get totBal(): BN {
        return this.platformUnlocked.add(this.platformLockedStakeable)
    }

    get pNoBalance() {
        return this.totBal.isZero()
    }

    get canValidate(): boolean {
        return this.totBal.gte(ava.getNetwork().P.minStake)
    }

    get minStakeAmt(): Big {
        return bnToBig(ava.getNetwork().P.minStake, 9)
    }

    get hasValidator(): boolean {
        return this.registeredNodeID === ''
            ? false
            : this.$store.getters['Platform/isValidator'](this.registeredNodeID)
    }

    get hasRegisteredNodeID(): boolean {
        return this.registeredNodeID !== ''
    }

    get network(): AvaNetwork {
        return this.$store.state.Network.selectedNetwork
    }

    get assetLoading(): boolean {
        return this.$store.state.Assets.balanceLoading
    }
}
</script>
<style scoped lang="scss">
.earn_page {
    display: grid;
    grid-template-rows: max-content 1fr;
}

.header {
    margin-bottom: 1rem;

    h2 {
        font-weight: normal;
    }

    display: flex;
    align-items: center;
}

.wrong_network {
    color: var(--primary-color-light);
}
</style>
