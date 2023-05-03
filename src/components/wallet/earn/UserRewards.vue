<template>
    <div>
        <div class="refresh_div">
            <div class="refresh">
                <Spinner v-if="loadingRefreshDepositRewards" class="spinner"></Spinner>
                <button v-else @click="refresh">
                    <v-icon>mdi-refresh</v-icon>
                </button>
            </div>
        </div>
        <div class="user_offers" v-if="activeOffers.length > 0">
            <UserRewardCard
                v-for="(v, i) in activeOffers"
                :key="i"
                :depositTxID="v.depositTxID"
                :title="v.memo"
                :start="v.start"
                :duration="v.lockDuration"
                :minLock="v.minAmount"
                :rewards="v.interestRateNominator"
                :lockedAmount="v.amount"
                :alreadyClaimed="v.claimedRewardAmount"
                :pendingRewards="v.pendingRewards"
                :rewardOwner="v.rewardOwner"
                :signatureStatus="signatureStatus(v.depositTxID)"
                :alreadySigned="alreadySigned(v.depositTxID)"
                class="reward_card"
            />
        </div>
        <div v-else class="empty">No Active Earning</div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { AvaWalletCore } from '../../../js/wallets/types'
import { DelegatorRaw, ValidatorRaw } from '@/components/misc/ValidatorList/types'
import UserRewardRow from '@/components/wallet/earn/UserRewardRow.vue'
import UserRewardCard from '@/components/wallet/earn/UserRewardCard.vue'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import { BN } from '@c4tplatform/caminojs/dist'
import { bintools } from '@/AVA'
import { WalletType } from '@/js/wallets/types'
import { MultisigTx as SignavaultTx } from '@/store/modules/signavault/types'
import { WalletHelper } from '@/helpers/wallet_helper'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { UnsignedTx } from '@c4tplatform/caminojs/dist/apis/platformvm'
import { ModelMultisigTxOwner } from '@c4tplatform/signavaultjs'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { ActiveDeposit } from '@/components/misc/ValidatorList/types'

@Component({
    components: {
        UserRewardRow,
        UserRewardCard,
    },
})
export default class UserRewards extends Vue {
    @Prop() loadingRefreshDepositRewards!: boolean

    get activeOffers(): ActiveDeposit[] {
        return this.$store.state.Platform.activeDepositOffer
    }

    get userAddresses() {
        let wallet: AvaWalletCore = this.$store.state.activeWallet
        if (!wallet) return []

        return wallet.getAllAddressesP()
    }

    get validators(): ValidatorRaw[] {
        let validators: ValidatorRaw[] = this.$store.state.Platform.validators

        return this.cleanList(validators) as ValidatorRaw[]
    }

    get totLength() {
        return this.validators?.length
    }

    get totalReward() {
        let vals = this.validators?.reduce((acc, val: ValidatorRaw) => {
            return acc.add(new BN(val.potentialReward))
        }, new BN(0))

        return vals
    }

    get totalRewardBig(): Big {
        return bnToBig(this.totalReward, 9)
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }

    cleanList(list: ValidatorRaw[] | DelegatorRaw[]) {
        let res = list?.filter((val) => {
            let rewardAddrs = val.rewardOwner.addresses
            let filtered = rewardAddrs.filter((addr) => {
                return this.userAddresses.includes(addr)
            })
            return filtered.length > 0
        })

        res?.sort((a, b) => {
            let startA = parseInt(a.startTime)
            let startB = parseInt(b.startTime)
            return startA - startB
        })
        return res
    }

    get activeWallet(): WalletType {
        return this.$store.state.activeWallet
    }

    alreadySigned(depositTxID: string): boolean {
        const txOwners = this.txOwners(depositTxID)
        const walletAddresses = (this.activeWallet as MultisigWallet).wallets.map(
            (w) => w?.getAllAddressesP()?.[0]
        )

        const isSigned = txOwners.some((owner) => {
            const isOwnerSigned = owner.signature && walletAddresses.includes(owner.address)
            return isOwnerSigned
        })

        return isSigned
    }

    getPendingMultisigTx(depositTxID: string): SignavaultTx | undefined {
        const tx: SignavaultTx = this.$store.getters['Signavault/transactions'].find(
            (item: any) =>
                item?.tx?.alias === this.activeWallet.getStaticAddress('P') &&
                WalletHelper.getUnsignedTxType(item?.tx?.unsignedTx) === 'ClaimTx'
        )

        if (!tx) return undefined

        const unsignedTx = new UnsignedTx()
        unsignedTx.fromBuffer(Buffer.from(tx.tx?.unsignedTx, 'hex'))
        const utx = unsignedTx.getTransaction()
        const claimAmounts = utx.getClaimAmounts()

        const depositId = bintools.cb58Encode(claimAmounts[0].getID())

        if (depositId === depositTxID) return tx
        else return undefined
    }

    txOwners(depositTxID: string): ModelMultisigTxOwner[] | [] {
        return this.getPendingMultisigTx(depositTxID)?.tx?.owners ?? []
    }

    canExecuteMultisigTx(depositTxID: string): boolean {
        let signers = 0
        let threshold = this.getPendingMultisigTx(depositTxID)?.tx?.threshold
        const txOwners = this.txOwners(depositTxID)

        txOwners.forEach((owner) => {
            if (owner.signature) signers++
        })
        if (threshold) return signers >= threshold
        return false
    }

    signatureStatus(depositTxID: string): number {
        if (!this.getPendingMultisigTx(depositTxID)?.tx) return -1
        else if (!this.canExecuteMultisigTx(depositTxID)) return 1
        else if (this.canExecuteMultisigTx(depositTxID)) return 2

        return -1
    }

    refresh() {
        this.$store.dispatch('Platform/updateActiveDepositOffer')
        this.$store.dispatch('Signavault/updateTransaction')
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/main';
.user_offers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    grid-gap: 1rem;
}
.user_rewards {
    padding-bottom: 5vh;
}

.reward_row {
    margin-bottom: 12px;
}

h3 {
    margin: 12px 0;
    margin-top: 32px;
    font-size: 2em;
    color: var(--primary-color);
    font-weight: normal;
}

label {
    margin-top: 6px;
    color: var(--primary-color-light);
    font-size: 14px;
    margin-bottom: 3px;
}

.amt {
    font-size: 2em;
}

.refresh {
    width: 20px;
    height: 20px;
    margin-left: auto;
    .v-icon {
        color: var(--primary-color);
    }

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

.refresh_div {
    margin-bottom: 10px;
}

@include main.medium-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
@include main.mobile-device {
    .user_offers {
        display: grid;
        grid-template-rows: repeat(1, 1fr);
        grid-template-columns: auto;
        grid-gap: 1rem;
    }
}
</style>
