<template>
    <div class="earn_page">
        <div class="header">
            <h1 :class="depositAndBond ? '' : 'wrong_network'" v-if="validatorIsSuspended">
                {{ $t('validator.suspended.title') }}
            </h1>
            <div v-else-if="(nodeInfo === undefined || nodeInfo === null) && !validatorIsSuspended">
                <h1 v-if="!!multisigPendingNodeTx && !isNodeRegistered">
                    {{ $t('earn.subtitle5') }}
                </h1>
                <h1 v-else>{{ $t('earn.subtitle1') }}</h1>
            </div>
            <h1 v-else :class="depositAndBond ? '' : 'wrong_network'">
                {{ $t('validator.info.validator_running') }}
            </h1>
        </div>
        <transition name="fade" mode="out-in">
            <div>
                <div class="tab-nav">
                    <div>
                        <button @click="tab = 'opt-validator'" :active="tab === `opt-validator`">
                            {{ $t('validator.rewards.tab.node') }}
                        </button>
                        <button @click="tab = 'opt-rewards'" :active="tab === `opt-rewards`">
                            {{ $t('validator.rewards.tab.rewards') }}
                        </button>
                    </div>
                </div>

                <div v-if="tab == 'opt-validator'">
                    <p v-if="!depositAndBond" class="wrong_network">{{ $t('earn.warning_3') }}</p>
                    <div v-else-if="!isNodeRegistered" class="no_balance">
                        <pending-multisig
                            v-if="!!multisigPendingNodeTx"
                            :multisigTx="multisigPendingNodeTx"
                            @issued="onNodeRegistered"
                            @refresh="handlePendingMultisigRefresh"
                        ></pending-multisig>
                        <register-node
                            v-else
                            :isKycVerified="isKycVerified"
                            :isConsortiumMember="isConsortiumMember"
                            :minPlatformUnlocked="minPlatformUnlocked"
                            :hasEnoughLockablePlatformBalance="hasEnoughLockablePlatformBalance"
                            :isNodeRegistered="isNodeRegistered"
                            @registered="onNodeRegistered"
                            :loadingRefreshRegisterNode="loadingRefreshRegisterNode"
                            @refresh="refresh()"
                        ></register-node>
                    </div>
                    <template v-else-if="!!pendingValidator">
                        <div class="pending-validator-div">
                            <validator-pending
                                :startDate="pendingValidator.startTime"
                                @refresh="refresh"
                            ></validator-pending>
                        </div>
                    </template>
                    <template
                        v-else-if="
                            (nodeInfo === undefined || nodeInfo === null) &&
                            !validatorIsSuspended &&
                            !pendingValidator
                        "
                    >
                        <pending-multisig
                            v-if="!!multisigPendingNodeTx"
                            :nodeId="nodeId"
                            :multisigTx="multisigPendingNodeTx"
                            @issued="onAddValidatorIssued"
                            @refresh="handlePendingMultisigRefresh"
                        ></pending-multisig>
                        <add-validator
                            v-else
                            :nodeId="nodeId"
                            @validatorReady="verifyValidatorIsReady"
                            @initiated="onAddValidatorInitiated"
                            @refresh="refresh()"
                        ></add-validator>
                    </template>
                    <div v-else-if="validatorIsSuspended">
                        <validator-suspended :nodeId="nodeId"></validator-suspended>
                    </div>
                    <div v-else>
                        <validator-info :nodeId="nodeId" :nodeInfo="nodeInfo"></validator-info>
                    </div>
                </div>
                <div v-if="tab == 'opt-rewards'">
                    <div v-if="nodeInfo">
                        <ClaimRewards :nodeId="nodeId" :nodeInfo="nodeInfo" />
                    </div>
                    <div v-else>
                        <div class="rewards-not-available">
                            <RewardsNotAvailable />
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
<script lang="ts">
import { ValidatorRaw } from '@/components/misc/ValidatorList/types'
import RewardsNotAvailable from '@/components/wallet/earn/RewardsNotAvailable.vue'
import AddValidator from '@/components/wallet/earn/Validate/AddValidator.vue'
import ClaimRewards from '@/components/wallet/earn/Validate/ClaimRewards.vue'
import PendingMultisig from '@/components/wallet/earn/Validate/PendingMultisig.vue'
import RegisterNode from '@/components/wallet/earn/Validate/RegisterNode.vue'
import ValidatorInfo from '@/components/wallet/earn/Validate/ValidatorInfo.vue'
import ValidatorPending from '@/components/wallet/earn/Validate/ValidatorPending.vue'
import ValidatorSuspended from '@/components/wallet/earn/Validate/ValidatorSuspended.vue'
import { bnToBig } from '@/helpers/helper'
import { WalletHelper } from '@/helpers/wallet_helper'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import { WalletCore } from '@/js/wallets/WalletCore'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { BN } from '@c4tplatform/caminojs/dist'
import { AddressState } from '@c4tplatform/caminojs/dist/apis/platformvm'
import Big from 'big.js'
import 'reflect-metadata'
import { Component, Vue, Watch } from 'vue-property-decorator'
import { AvaNetwork } from '@/js/AvaNetwork'

@Component({
    name: 'validator',
    components: {
        RegisterNode,
        AddValidator,
        ValidatorInfo,
        ValidatorSuspended,
        ClaimRewards,
        PendingMultisig,
        ValidatorPending,
        RewardsNotAvailable,
    },
})
export default class Validator extends Vue {
    isKycVerified = false
    isConsortiumMember = false
    isNodeRegistered = false
    isSuspended = false
    registeredNodeID = ''
    intervalID: any = null
    nodeId = ''
    nodeInfo: ValidatorRaw | null = null
    validatorIsSuspended: boolean = false
    loadingRefreshRegisterNode: boolean = false
    tab: string = 'opt-validator'
    pendingValidator: ValidatorRaw | null = null

    get multisigPendingNodeTx(): SignavaultTx | undefined {
        return this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.addresses[0] &&
                ['CaminoAddValidatorTx', 'RegisterNodeTx'].includes(
                    WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx)
                )
        )
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
    }

    verifyValidatorIsReady(val: ValidatorRaw) {
        this.nodeInfo = val
    }

    updateValidators() {
        this.$store.dispatch('Platform/updateValidators')
    }

    activated() {
        this.evaluateCanRegisterNode()
        this.updateValidators()
        this.intervalID = setInterval(() => {
            this.updateValidators()
        }, 15000)
    }

    async handlePendingMultisigRefresh() {
        await this.$store.dispatch('Signavault/updateTransaction')
        this.evaluateCanRegisterNode()
    }

    deactivated() {
        clearInterval(this.intervalID)
    }

    @Watch('activeNetwork')
    @Watch('$store.state.networkName')
    @Watch('$store.state.activeWallet')
    async evaluateCanRegisterNode() {
        const BN_ONE = new BN(1)
        const result = await WalletHelper.getAddressState(this.addresses[0])
        this.isKycVerified = !result.and(BN_ONE.shln(AddressState.KYC_VERIFIED)).isZero()
        this.isConsortiumMember = !result.and(BN_ONE.shln(AddressState.CONSORTIUM)).isZero()
        this.validatorIsSuspended = !result.and(BN_ONE.shln(AddressState.NODE_DEFERRED)).isZero()

        try {
            this.nodeId = await WalletHelper.getRegisteredNode(this.addresses[0])
            this.isNodeRegistered = !!this.nodeId

            if (this.nodeId) {
                // node is registered, check if is pending
                const val = await WalletHelper.findPendingValidator(this.nodeId)
                this.pendingValidator = val
            }
        } catch (e) {
            this.isNodeRegistered = false
            this.pendingValidator = null
        }
    }

    async onNodeRegistered(status: 'issued' | 'pending') {
        if (status === 'issued') {
            try {
                this.nodeId = await WalletHelper.getRegisteredNode(this.addresses[0])
                this.isNodeRegistered = !!this.nodeId
            } catch (e) {
                this.isNodeRegistered = false
            }
        } else {
            await this.$store.dispatch('Signavault/updateTransaction')
            this.evaluateCanRegisterNode()
        }
    }

    async onAddValidatorInitiated() {
        //  Multisig flow, tx is saved to signavault
        await this.$store.dispatch('Signavault/updateTransaction')
        this.evaluateCanRegisterNode()
    }

    async onAddValidatorIssued() {
        //  Multisig flow, tx handled by signavault
        await this.$store.dispatch('Signavault/updateTransaction')
        this.evaluateCanRegisterNode()
    }

    get hasEnoughLockablePlatformBalance(): boolean {
        return this.platformStakeable.gte(this.minPlatformUnlocked)
    }

    get platformStakeable(): BN {
        return this.platformUnlocked.add(this.platformLockedStakeable)
    }

    get staticAddress() {
        return (this.$store.state.activeWallet as WalletCore).getStaticAddress('P')
    }

    get addresses() {
        let wallet: MnemonicWallet = this.$store.state.activeWallet
        return wallet.getAllAddressesP()
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

    get platformTotalLocked(): BN {
        return this.$store.getters['Assets/walletPlatformBalanceTotalLocked']
    }

    get totBal(): BN {
        if (this.depositAndBond) {
            return this.platformUnlocked.add(this.platformTotalLocked)
        }
        return this.platformUnlocked.add(this.platformLockedStakeable)
    }

    get pNoBalance() {
        if (this.depositAndBond) return this.platformUnlocked.add(this.platformTotalLocked).isZero()
        return this.platformUnlocked.add(this.platformLockedStakeable).isZero()
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

    async refresh() {
        this.loadingRefreshRegisterNode = true
        await this.evaluateCanRegisterNode()
        await this.updateValidators()
        await this.$store.dispatch('Signavault/updateTransaction')
        this.loadingRefreshRegisterNode = false
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
        color: var(--primary-color-light);
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
    @include mixins.typography-caption;
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

    .tab-nav {
        button {
            font-size: 13px;

            &[active] {
                border-bottom-width: 2px;
            }
        }
    }
}

@include mixins.mobile-device {
    .options {
        grid-template-columns: none;
        grid-row-gap: 15px;
    }

    .tab-nav {
        display: block;

        > div {
            overflow: hidden;
            display: flex;
        }
        button {
            flex-grow: 1;
            border-radius: 0px;
            margin: 0;
            font-size: 12px;
        }
    }
}

.tab-nav {
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    flex-wrap: nowrap;
    white-space: nowrap;

    h1 {
        font-weight: normal;
        margin-right: 30px;
    }

    button {
        padding: 8px 24px;
        font-size: 14px;
        font-weight: bold;
        margin: 0px 5px;
        text-transform: uppercase;
        outline: none !important;
        color: var(--primary-color-light);

        &[active] {
            color: var(--secondary-color);
            border-bottom: 2px solid var(--secondary-color);
        }
    }
}

.pending-validator-div {
    position: relative;
    top: 35px;
}

.rewards-not-available {
    position: relative;
    top: 15px;
}
</style>
