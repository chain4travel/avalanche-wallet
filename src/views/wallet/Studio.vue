<template>
    <div class="container">
        <span v-if="pageNow" @click="cancel" class="close"><fa icon="times"></fa></span>
        <div class="header">
            <h1>{{ $t('studio.title') }}</h1>
            <h1 class="subtitle" v-if="pageNow">/ {{ subtitle }}</h1>
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
                            <CamBtn @click="goMint" variant="accent" :disabled="!canMint">
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
        MintNft,
        CamBtn,
    },
})
export default class Studio extends Vue {
    pageNow: any = null
    subtitle: string = ''

    get nftMintDict(): IWalletNftMintDict {
        return this.$store.getters['Assets/nftMintDict']
    }

    get canMint(): boolean {
        return Object.keys(this.nftMintDict).length > 0
    }

    goNewNftFamily() {
        this.pageNow = NewCollectibleFamily
        this.subtitle = 'New Collectible Family'
    }

    goMint() {
        this.pageNow = MintNft
        this.subtitle = 'Mint Collectible'
    }

    deactivated() {
        this.clearPage()
    }

    activated() {
        if (this.$route.query.utxo) {
            this.goMint()
        }
    }

    clearUrl() {
        if (this.$route.query.utxo) {
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
@use '../../styles/abstracts/mixins';
.container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .close {
        position: absolute;
        font-size: 2rem;
        color: var(--primary-color-light);
        top: 1.5rem;
        right: 1.5rem;

        &:hover {
            color: var(--primary-color);
            cursor: pointer;
        }
        @media (max-width: 600px) {
            margin-left: 0.5em;
        }
    }
}
.header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    h1 {
        font-weight: normal;
    }
    .subtitle {
        margin-left: 0.5em;
        color: var(--primary-color-light);
        font-weight: lighter;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        @media (max-width: 600px) {
            font-size: 1.5rem;
            margin-left: 0.2em;
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

@include mixins.mobile-device {
    .container {
        gap: 0.5rem;

        .header {
            gap: 0;
        }
    }
}
</style>
