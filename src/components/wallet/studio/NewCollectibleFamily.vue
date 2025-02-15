<template>
    <div class="new_family">
        <p>{{ $t('studio.family.desc') }}</p>
        <form @submit.prevent="submit" v-if="!isSuccess">
            <div style="display: flex">
                <div style="flex-grow: 1">
                    <label>{{ $t('studio.family.label1') }}</label>
                    <input
                        type="text"
                        placeholder="Name"
                        v-model="name"
                        style="width: 100%"
                        maxlength="128"
                    />
                </div>
                <div class="symbol">
                    <label>{{ $t('studio.family.label2') }}</label>
                    <input type="text" placeholder="xxxx" v-model="symbol" max="4" maxlength="4" />
                </div>
            </div>

            <div>
                <label>{{ $t('studio.family.label3') }}</label>
                <input
                    type="number"
                    placeholder="Name of the Collection"
                    min="1"
                    max="1024"
                    v-model="groupNum"
                />
            </div>
            <div>
                <p>
                    {{ $t('studio.family.fee') }}: {{ txFee.toLocaleString() }}
                    {{ nativeAssetSymbol }}
                </p>
            </div>
            <p v-if="error" class="err">{{ error }}</p>
            <CamBtn :loading="isLoading" variant="accent" type="submit">
                {{ $t('studio.family.submit') }}
            </CamBtn>
        </form>
        <div class="success_cont" v-if="isSuccess">
            <Alert variant="positive">
                {{ $t('studio.family.success.desc') }}
            </Alert>
            <div class="family-info">
                <label>{{ $t('studio.family.success.label1') }}</label>
                <p style="word-break: break-all">{{ txId }}</p>
            </div>
            <div class="family-info">
                <label>{{ $t('studio.family.success.label2') }}</label>
                <p>{{ name }}</p>
            </div>
            <div class="family-info">
                <label>{{ $t('studio.family.success.label3') }}</label>
                <p>{{ symbol }}</p>
            </div>
            <div class="family-info">
                <label>{{ $t('studio.family.success.label4') }}</label>
                <p>{{ groupNum }}</p>
            </div>

            <CamBtn @click="cancel" variant="accent">
                {{ $t('studio.family.back') }}
            </CamBtn>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { ava } from '@/AVA'
import { bnToBig } from '@/helpers/helper'
import Big from 'big.js'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'

@Component({
    components: {
        CamBtn,
        Alert,
    },
})
export default class NewCollectibleFamily extends Vue {
    name: string = ''
    symbol: string = ''
    groupNum = 1
    isLoading = false
    isSuccess = false
    error = ''
    txId = ''

    @Watch('symbol')
    onSymbolChange(val: string) {
        let newVal = val.toUpperCase()
        // Remove numbers
        newVal = newVal.replace(/[0-9]/g, '')
        this.symbol = newVal
    }

    get txFee(): Big {
        return bnToBig(ava.PChain().getCreationTxFee(), 9)
    }

    validate(): boolean {
        if (this.symbol.length === 0) {
            this.error = 'You must provide a symbol.'
            return false
        } else if (this.symbol.length > 4) {
            this.error = 'Symbol must be 4 characters max.'
            return false
        } else if (this.groupNum < 1) {
            this.error = 'Number of groups must be at least 1.'
            return false
        }
        return true
    }
    async submit() {
        if (!this.validate()) {
            return
        }
        let wallet = this.$store.state.activeWallet
        if (!wallet) return

        this.error = ''
        this.isLoading = true

        let nameTrimmed = this.name.trim()
        let symbolTrimmed = this.symbol.trim()

        try {
            let txId = await wallet.createNftFamily(nameTrimmed, symbolTrimmed, this.groupNum)
            console.log(txId)
            this.onSuccess(txId)
        } catch (e) {
            this.onError(e)
        }
    }

    cancel() {
        this.$emit('cancel')
    }

    onError(e: any) {
        this.error = e
        console.error(e)
        this.isLoading = false
    }

    onSuccess(txId: string) {
        this.isLoading = false
        this.isSuccess = true
        this.txId = txId
        let { dispatchNotification } = this.globalHelper()
        dispatchNotification({
            message: this.$t('notifications.new_collectible'),
            type: 'success',
        })
        setTimeout(() => {
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
        }, 3000)
    }

    get mintUtxos() {
        // return this.$store.getters.walletNftMintUTXOs
        return this.$store.state.Assets.nftMintUTXOs
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.new_family {
    max-width: 100%;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
form > div {
    margin: 12px 0;
}

label {
    margin-top: 6px;
    color: var(--primary-color-light);
    @include mixins.typography-caption;
    margin-bottom: 3px;
}

input {
    display: block;
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 6px 14px;
    @include mixins.typography-caption;
}

.symbol {
    margin-left: 12px;
    > input {
        width: 60px;
        text-align: center;
    }
}

.groups {
    //display: grid;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    //grid-template-columns: repeat(5, 1fr);

    > div {
        margin: 4px;
        background-color: var(--bg-light);
        width: 45px;
        height: 45px;
    }
}

.success_cont {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .family-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-bottom: 5px;
        @include mixins.typography-caption;
        background-color: var(--bg-light);
        resize: none;
        width: 100%;
        border-radius: var(--border-radius-sm);
        padding: 4px 12px;
    }

    .v-btn {
        margin-top: 12px;
    }
}
</style>
