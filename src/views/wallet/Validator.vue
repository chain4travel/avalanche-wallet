<template>
    <div class="earn_page">
        <div class="header">
            <h1 :class="depositAndBond ? '' : 'wrong_network'">{{ $t('earn.subtitle1') }}</h1>
        </div>
        <transition name="fade" mode="out-in">
            <div>
                <p v-if="!depositAndBond" class="wrong_network">{{ $t('earn.warning_3') }}</p>
                <p v-else-if="!canValidate" class="no_balance">
                    {{ $t('earn.warning_1', [minStakeAmt.toLocaleString()]) }}
                </p>
                <p v-else-if="registeredNodeID === ''" class="no_balance">
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

    updateValidators() {
        this.$store.dispatch('Platform/update')
    }

    async created() {
        await this.evaluateCanRegisterNode()
        this.updateValidators()
        this.intervalID = setInterval(() => {
            this.updateValidators()
        }, 15000)
    }

    destroyed() {
        clearInterval(this.intervalID)
    }

    nodeRegistered(nodeId: string) {
        this.registeredNodeID = nodeId
    }

    @Watch('$store.state.networkName')
    @Watch('$store.state.activeWallet')
    evaluateCanRegisterNode() {
        const BN_ONE = new BN(1)
        WalletHelper.getAddressState(this.staticAddress).then((result) => {
            this.isKycVerified = !result.and(BN_ONE.shln(ADDRESSSTATEKYCVERIFIED)).isZero()
            this.isConsortiumMember = !result.and(BN_ONE.shln(ADDRESSSTATECONSORTIUM)).isZero()
            this.isSuspended = !result.and(BN_ONE.shln(ADDRESSSTATEDEFERRED)).isZero()
        })
        WalletHelper.getRegisteredNode(this.staticAddress).then(
            (nodeID) => (this.registeredNodeID = nodeID),
            () => (this.registeredNodeID = '')
        )
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
        return this.$store.state.Platform.minStake
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
        let bn = this.$store.state.Platform.minStake
        if (this.totBal.lt(bn)) {
            return false
        }
        return true
    }

    get minStakeAmt(): Big {
        let bn = this.$store.state.Platform.minStake
        return bnToBig(bn, 9)
    }

    get minDelegationAmt(): Big {
        let bn = this.$store.state.Platform.minStakeDelegation
        return bnToBig(bn, 9)
    }

    get hasValidator(): boolean {
        return this.$store.getters['Platform/isValidator'](this.registeredNodeID)
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

/* body {
    height: auto;
    overflow: auto !important;
} */
.earn_page {
    display: grid;
    grid-template-rows: max-content 1fr;
}

.header {
    margin-bottom: 1rem;

    h1 {
        font-weight: normal;
    }

    display: flex;
    /*justify-content: space-between;*/
    /*align-items: center;*/
    align-items: center;

    .subtitle {
        margin-left: 0.5em;
        /*font-size: 20px;*/
        color: var(--primary-color-light);
        font-weight: lighter;
    }

    span {
        margin-left: 1em;

        &:hover {
            color: var(--primary-color);
            cursor: pointer;
        }
    }
}

.wrong_network {
    color: var(--primary-color-light);
}

.options {
    margin: 30px 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 14px;
    //display: flex;
    //justify-content: space-evenly;
    //padding: 60px;

    > div {
        width: 100%;
        justify-self: center;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        //max-width: 260px;
        padding: 30px;
        border-radius: var(--border-radius-sm);
        background-color: var(--bg-light);
    }

    h4 {
        font-size: 32px !important;
        font-weight: lighter;
        color: var(--primary-color-light);
    }

    p {
        /*color: var(--primary-color-light);*/
        margin: 14px 0 !important;
    }

    .no_balance {
        color: var(--secondary-color);
    }

    .v-btn {
        margin-top: 14px;
    }
}

span {
    color: var(--primary-color-light);
    opacity: 0.5;
    float: right;
    font-weight: lighter;
}

.cancel {
    font-size: 13px;
    color: var(--secondary-color);
    justify-self: flex-end;
}

.comp {
    margin-top: 14px;
}

@include mixins.medium-device {
    .options {
        grid-template-columns: 1fr 1fr;
    }
}

@include mixins.mobile-device {
    .options {
        grid-template-columns: none;
        grid-row-gap: 15px;
    }
}
</style>
