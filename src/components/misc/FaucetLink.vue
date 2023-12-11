<template>
    <div class="faucet">
        <p class="drop"><fa icon="tint"></fa></p>
        <p>{{ $t('transfer.faucet') }}</p>
        <a
            @click="redirect()"
            href="#"
            target="_blank"
            class="but_primary"
            rel="noopener noreferrer"
        >
            Go to faucet
        </a>
    </div>
</template>
<script>
export default {
    computed: {
        faucetLink() {
            let link = process.env.VUE_APP_FAUCET_LINK
            if (link) return link
            return null
        },
        selectedAddress() {
            return this.$store.state.address
        },
    },
    methods: {
        redirect() {
            let link = this.faucetLink + `?address=${this.selectedAddress}`
            window.open(link, '_blank')
        },
    },
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';
.faucet {
    background-color: #e4f1fb;
    border-radius: 8px;
    width: 140px;
    padding: 6px 14px;
    border: 1px solid #aaa;
    @include mixins.typography-caption;
    justify-self: center;
    text-align: center;

    p {
        margin: 10px 0px !important;
    }

    .drop {
        @include mixins.typography-headline-2;
    }

    a {
        box-sizing: border-box;
        width: 100%;
        display: block;
        white-space: nowrap;
    }
}
</style>
