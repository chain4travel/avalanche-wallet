<template>
    <div class="offer_row">
        <h2 class="offer_title">{{ rewardTitle }}</h2>
        <div class="offer_detail">
            <div class="offer_detail_left">
                <div>
                    <label>Lock Start:</label>
                    <p class="reward">{{ startDate }}</p>
                </div>
                <div>
                    <label>Lock End:</label>
                    <p class="reward">{{ endDate }}</p>
                </div>
                <div>
                    <label>Minmum Lock:</label>
                    <p class="reward">{{ minLockAmount.toLocaleString() }} CAM</p>
                </div>
                <div>
                    <label>Rewards:</label>
                    <p class="reward">{{ rewardPercent }} %</p>
                </div>
            </div>
            <div class="offer_detail_right">
                <div>
                    <label>Locked Amount:</label>
                    <p class="reward">{{ depositAmount | cleanAvaxBN }} {{ nativeAssetSymbol }}</p>
                </div>
                <div>
                    <label>Pending Rewards:</label>
                    <p class="reward">
                        {{ pendingRewardsAmount | cleanAvaxBN }} {{ nativeAssetSymbol }}
                    </p>
                </div>
                <div>
                    <label>Already Claimed:</label>
                    <p class="reward">
                        {{ alreadyClaimedAmount | cleanAvaxBN }} {{ nativeAssetSymbol }}
                    </p>
                </div>
            </div>
        </div>
        <button class="claim_button button_primary">Claim</button>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DelegatorRaw, ValidatorRaw } from '../../misc/ValidatorList/types'
import { BN } from '@c4tplatform/caminojs'
import Big from 'big.js'
import { ONEAVAX } from '@c4tplatform/caminojs/dist/utils'
import AvaAsset from '@/js/AvaAsset'
import { ava } from '@/AVA'
import { WalletHelper } from '@/helpers/wallet_helper'

@Component({
    filters: {
        cleanAvaxBN(val: BN) {
            let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
            return big.toLocaleString()
        },
    },
})
export default class UserRewardCard extends Vue {
    now: number = Date.now()
    intervalID: any = null

    @Prop() staker!: ValidatorRaw | DelegatorRaw
    @Prop() title!: string
    @Prop() start!: BN
    @Prop() end!: BN
    @Prop() minLock!: BN
    @Prop() rewards!: string
    @Prop() lockedAmount!: string
    @Prop() pendingRewards!: string
    @Prop() alreadyClaimed!: string

    updateNow() {
        this.now = Date.now()
    }

    created() {
        this.intervalID = setInterval(() => {
            this.updateNow()
        }, 2000)
    }
    destroyed() {
        clearInterval(this.intervalID)
    }

    get rewardTitle() {
        return Buffer.from(this.title.replace('0x', ''), 'hex').toString()
    }

    get startDate() {
        const startDate = new Date(parseInt(this.start.toString()) * 1000)

        return startDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get endDate() {
        const endDate = new Date(parseInt(this.end.toString()) * 1000)

        return endDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
    }

    get minLockAmount() {
        return new Big(this.minLock.toString())
    }

    get depositAmount() {
        return new Big(this.lockedAmount.toString())
    }

    get pendingRewardsAmount() {
        return new Big(this.pendingRewards.toString())
    }

    get alreadyClaimedAmount() {
        return new Big(this.alreadyClaimed.toString())
    }

    get rewardPercent() {
        const interestRateBase = 365 * 24 * 60 * 60
        const interestRateDenominator = 1000000 * interestRateBase

        return (parseInt(this.rewards) / interestRateDenominator) * interestRateBase * 100
    }

    get ava_asset(): AvaAsset | null {
        let ava = this.$store.getters['Assets/AssetAVA']
        return ava
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    async claim() {
        const wallet = this.$store.state.activeWallet
        let pAddressStrings = wallet.getAllAddressesP()
        const pchain = ava.PChain()
        const utxoSet = (await pchain.getUTXOs(pAddressStrings)).utxos
        // const l = pchain.buildClaimTx(
        //     utxoSet,
        //     pAddressStrings,
        //     pAddressStrings,
        //     Buffer.from(''),
        //     new BN(Date.now()),
        //     1,
        //     [this.staker.id],
        //     [this.pendingRewardsAmount.toString()]
        // )

        // @param utxoset — A set of UTXOs that the transaction is built on
        // @param fromAddresses — The addresses being used to send the funds from the UTXOs https://github.com/feross/bufferBuffer
        // @param changeAddresses — The addresses that can spend the change remaining from the spent UTXOs.
        // @param memo — Optional contains arbitrary bytes, up to 256 bytes
        // @param asOf — Optional. The timestamp to verify the transaction against as a https://github.com/indutny/bn.js/BN
        // @param changeThreshold — Optional. The number of signatures required to spend the funds in the resultant change UTXO
        // @param depositTxs — The deposit transactions with which the claiblable rewards are associated
        // @param claimableOwnerIDs — The ownerIDs of the rewards to claim
        // @param claimedAmounts — The amounts of the rewards to claim
        // @param claimTo — The address to claimed rewards will be directed to
        // @param claimableSigners — The signers of the claimable rewards

        //     const l = pchain.buildClaimTx(
        //         undefined,
        //         [P(addrB)],
        //         [P(addrB)],
        //         activeOffer.id,
        //         activeOffer.minDuration,
        //         new OutputOwners([pAddresses[1]]),
        //         memo,
        //         new BN(0),
        //         activeOffer.minAmount
        //     )
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/main';

.offer_row {
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    font-size: 14px;
    background-color: var(--bg-light);
    padding: 1rem;
}

.offer_title {
    margin-bottom: 1rem;
}

.offer_detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 1.25rem;
    .offer_detail_left {
        border-right: 2px solid var(--bg-wallet-light);
    }
}

.node_id {
    word-break: break-all;
}

.top_bar {
    height: max-content;
    position: relative;
    padding: 2px 8px;
    border-bottom: 2px solid var(--bg-wallet-light);
}
.reward_row {
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    font-size: 14px;
    //border: 2px solid var(--bg-light);
    background-color: var(--bg-light);
}

.data_row {
    grid-column: 1/3;
    display: grid;
    grid-template-columns: 1fr 280px;
    align-items: center;
}

.date {
    z-index: 1;
}
.reward_bar {
    background-color: var(--success);
    position: absolute;
    opacity: 0.5;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 0;
}

.stake_info {
    padding: 6px 12px;
    display: grid;
    column-gap: 14px;
    grid-template-columns: 2fr 1fr 1fr;
    /*justify-content: space-between;*/
    /*text-align: right;*/
    text-align: left;

    > div {
        align-self: baseline;
    }
}

label {
    color: var(--primary-color-light) !important;
}

.claim_button {
    border-radius: var(--border-radius-sm);
    width: min-content;
    padding: 8px 30px;
    margin-left: auto;
}

@include main.mobile-device {
    .offer_detail {
        grid-template-columns: 1fr;
        grid-gap: 0.5rem;
        .offer_detail_left {
            border-right: none;
        }
    }
}

@include main.mobile-device {
    .stake_info {
        grid-column: 1/3;
        border-left: none;
        border-top: 3px solid var(--bg);

        > div:first-of-type {
            text-align: left;
        }
    }
}
</style>
