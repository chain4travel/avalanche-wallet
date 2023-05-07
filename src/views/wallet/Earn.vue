<template>
    <div class="earn_page">
        <div class="header">
            <h1>{{ $t('earn.title') }}</h1>
            <div>
                <button @click="tab = 'earn_now'" :active="tab === `earn_now`">
                    {{ $t('earn.rewards.earn_now.title') }}
                </button>
                <button @click="tab = 'actine_earning'" :active="tab === `actine_earning`">
                    {{ $t('earn.rewards.active_earning.title') }}
                </button>
            </div>
            <div class="refresh">
                <Spinner v-if="loadingRefreshDepositRewards" class="spinner"></Spinner>
                <button v-else @click="refresh">
                    <v-icon>mdi-refresh</v-icon>
                </button>
            </div>
        </div>
        <div class="pages">
            <transition name="fade" mode="out-in">
                <DepositOffers v-if="tab === `earn_now`" key="earn_now" />
                <UserRewards
                    v-else-if="tab === `actine_earning`"
                    key="actine_earning"
                ></UserRewards>
            </transition>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'

import { BN } from '@c4tplatform/caminojs/dist'
import DepositOffers from '@/components/wallet/earn/DepositOffers.vue'
import UserRewards from '@/components/wallet/earn/UserRewards.vue'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'

@Component({
    name: 'earn',
    components: {
        UserRewards,
        DepositOffers,
    },
})
export default class Earn extends Vue {
    pageNow: any = null
    subtitle: string = ''
    intervalID: any = null
    tab: string = 'actine_earning'
    loadingRefreshDepositRewards: boolean = false

    transfer() {
        this.$router.replace('/wallet/cross_chain')
    }

    viewRewards() {
        this.pageNow = UserRewards
        this.subtitle = this.$t('earn.subtitle4') as string
    }
    cancel() {
        this.pageNow = null
        this.subtitle = ''
    }

    deactivated() {
        this.cancel()
    }

    destroyed() {
        clearInterval(this.intervalID)
    }

    get platformUnlocked(): BN {
        return this.$store.getters['Assets/walletPlatformBalance']
    }

    get platformLockedStakeable(): BN {
        // return this.$store.getters.walletPlatformBalanceLockedStakeable
        return this.$store.getters['Assets/walletPlatformBalanceLockedStakeable']
    }

    get totBal(): BN {
        return this.platformUnlocked.add(this.platformLockedStakeable)
    }

    get pNoBalance() {
        return this.platformUnlocked.add(this.platformLockedStakeable).isZero()
    }

    get minStakeAmt(): Big {
        let bn = this.$store.state.Platform.minStake
        return bnToBig(bn, 9)
    }

    async refresh() {
        try {
            this.loadingRefreshDepositRewards = true
            await Promise.all([
                this.$store.dispatch('Platform/updateActiveDepositOffer'),
                this.$store.dispatch('Signavault/updateTransaction'),
            ])
        } catch (error) {
            console.error('Error refreshing deposit rewards:', error)
        } finally {
            this.loadingRefreshDepositRewards = false
        }
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.earn_page {
    display: grid;
    grid-template-rows: max-content 1fr;
}

.refresh {
    max-width: 30px;
    max-width: 30px;
    margin-left: auto;
    position: absolute;
    top: 11px;
    right: 0;
    .v-icon {
        color: var(--primary-color);
    }

    button {
        padding: 0 !important;
        margin: 0 !important;
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

.header {
    position: relative;
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

.pages {
    margin-top: 1rem;
}

@include mixins.mobile-device {
    .header {
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

@include mixins.medium-device {
    .header {
        button {
            font-size: 13px;

            &[active] {
                border-bottom-width: 2px;
            }
        }
    }
}
</style>
