<template>
    <div>
        <div class="header">
            <h1>{{ $t('studio.title') }}</h1>
            <h1 class="subtitle" v-if="pageNow">
                / {{ subtitle }}
                <span @click="cancel"><fa icon="times"></fa></span>
            </h1>
        </div>
        <template v-if="!pageNow">
            <p>{{ $t('studio.desc') }}</p>
            <div class="menu">
                <h2>{{ $t('studio.collectibles') }}</h2>
                <div class="options">
                    <div>
                        <h4 class="title">{{ $t('studio.menu1.title') }}</h4>
                        <p>{{ $t('studio.menu1.desc') }}</p>
                        <CamBtn variant="accent" @click="goNewNftFamily">
                            {{ $t('studio.menu1.submit') }}
                        </CamBtn>
                    </div>
                    <div>
                        <h4 class="title">{{ $t('studio.menu2.title') }}</h4>
                        <p>{{ $t('studio.menu2.desc') }}</p>
                        <div>
                            <p v-if="!canMint" class="err">
                                {{ $t('studio.menu2.empty') }}
                            </p>
                            <CamBtn @click="goMint" class="accent" :disabled="!canMint">
                                {{ $t('studio.menu2.submit') }}
                            </CamBtn>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <Component v-else :is="pageNow" @cancel="cancel"></Component>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NewCollectibleFamily from '@/components/wallet/studio/NewCollectibleFamily.vue'
import MintNft from '@/components/wallet/studio/mint/MintNft.vue'
import { IWalletNftMintDict } from '@/store/types'
import CamBtn from '@/components/CamBtn.vue'
@Component({
    name: 'studio',
    components: {
        NewCollectibleFamily,
        CamBtn,
    },
})
export default class Studio extends Vue {
    pageNow: any = null
    subtitle: string = ''

    goNewNftFamily() {
        this.pageNow = NewCollectibleFamily
        this.subtitle = 'New Collectible Family'
    }

    goMint() {
        this.pageNow = MintNft
        this.subtitle = 'Mint Collectible'
    }

    get nftMintDict(): IWalletNftMintDict {
        // return this.$store.getters.walletNftMintDict
        return this.$store.getters['Assets/nftMintDict']
    }

    get canMint(): boolean {
        const keys = Object.keys(this.nftMintDict)
        if (keys.length > 0) return true
        return false
    }

    deactivated() {
        this.clearPage()
    }

    activated() {
        let utxoId = this.$route.query.utxo

        if (utxoId) {
            this.goMint()
        }
    }

    // If url has a utxo id, clears it
    clearUrl() {
        let utxoId = this.$route.query.utxo

        if (utxoId) {
            //@ts-ignore
            this.$router.replace({ query: null })
        }
    }

    clearPage() {
        this.pageNow = null
        this.subtitle = ''
    }

    cancel() {
        this.clearUrl()
        this.clearPage()
    }
}
</script>
<style scoped lang="scss">
.header {
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

.menu {
    h2 {
        margin: 20px 0;
        color: var(--primary-color-light);
        font-weight: normal;
        font-size: 2em;
    }
}

.options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    column-gap: 14px;
    row-gap: 14px;
    > div {
        background-color: var(--bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        padding: 30px;
        // display: flex;
        // flex-direction: column;
    }

    p {
        flex-grow: 1;
        margin: 12px 0 !important;
    }

    h4 {
        font-size: 32px !important;
        font-weight: lighter;
        color: var(--primary-color-light);
    }

    .v-btn {
        width: max-content;
    }
}
</style>
