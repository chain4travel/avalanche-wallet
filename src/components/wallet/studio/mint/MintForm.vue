<template>
    <div class="mint_form">
        <div class="right_col">
            <div class="preview">
                <label>{{ $t('studio.mint.preview.label1') }}</label>
                <div class="payload_view_cont" v-if="payloadPreview">
                    <NftCard :payload="payloadPreview" :group-i-d="groupId"></NftCard>
                </div>
                <div class="nft_preview preview_holder" v-else>
                    <p>{{ $t('studio.mint.preview.info1') }}</p>
                </div>
            </div>
        </div>
        <div class="cols">
            <div class="utxo_col">
                <div class="utxo">
                    <div>
                        <v-btn text @click="clearUtxo" block>
                            {{ $t('studio.mint.utxo_col.change') }}
                        </v-btn>
                        <div style="height: 110px; margin-top: 22px" v-if="groupUtxos.length > 0">
                            <NftFamilyCardsPreview
                                :utxos="groupUtxos"
                                :spread="isSuccess"
                                :max="maxPreviewUtxoLen"
                            ></NftFamilyCardsPreview>
                        </div>
                        <div v-else class="empty_card">
                            <p><fa icon="plus"></fa></p>
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>{{ $t('studio.mint.utxo_col.label1') }}</label>
                            <p>{{ family.name }}</p>
                        </div>
                        <div>
                            <label>{{ $t('studio.mint.utxo_col.label2') }}</label>
                            <p>{{ family.symbol }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="type_col">
                <div class="type_sel">
                    <label>{{ $t('studio.mint.type_col.label1') }}</label>
                    <p>{{ $t('studio.mint.type_col.desc') }}</p>
                    <div class="nft-type__contaiener">
                        <div class="nft-type__item">
                            <input
                                type="radio"
                                v-model="nftFormType"
                                value="generic"
                                :disabled="isSuccess"
                            />
                            <label>{{ $t('studio.mint.type_col.types.generic') }}</label>
                        </div>
                        <div class="nft-type__item">
                            <input
                                type="radio"
                                v-model="nftFormType"
                                value="custom"
                                :disabled="isSuccess"
                            />
                            <label>{{ $t('studio.mint.type_col.types.custom') }}</label>
                        </div>
                    </div>

                    <template v-if="nftFormType === 'custom'">
                        <label>{{ $t('studio.mint.type_col.label2') }}</label>
                        <div class="nft-type__contaiener">
                            <div class="nft-type__item">
                                <input
                                    type="radio"
                                    v-model="nftType"
                                    value="utf8"
                                    :disabled="isSuccess"
                                />
                                <label>UTF-8</label>
                            </div>
                            <div class="nft-type__item">
                                <input
                                    type="radio"
                                    v-model="nftType"
                                    value="url"
                                    :disabled="isSuccess"
                                />
                                <label>URL</label>
                            </div>
                            <div class="nft-type__item">
                                <input
                                    type="radio"
                                    v-model="nftType"
                                    value="json"
                                    :disabled="isSuccess"
                                />
                                <label>JSON</label>
                            </div>
                        </div>
                    </template>
                </div>
                <p>
                    {{ typeDescription }}
                </p>
            </div>
            <div class="form_col">
                <template>
                    <div class="form_cont">
                        <Component
                            v-if="nftFormType === 'custom'"
                            :is="formComponent"
                            @onInput="onInput"
                        ></Component>
                        <GenericForm v-else @onInput="onInput"></GenericForm>
                    </div>
                    <div>
                        <label>{{ $t('studio.mint.form_col.label1') }}</label>
                        <CamInput
                            type="number"
                            :min="minQuantity"
                            v-model="quantity"
                            style="width: 100%"
                        />
                    </div>
                    <div>
                        <label>{{ $t('studio.mint.form_col.label2') }}</label>
                        <input
                            type="text"
                            :value="addresses.join(',')"
                            @input="onAddressInput"
                            style="width: 100%"
                        />
                    </div>
                    <div class="fee">
                        <p>
                            {{ $t('studio.mint.form_col.fee') }}
                            <span>{{ txFee.toLocaleString() }} {{ nativeAssetSymbol }}</span>
                        </p>
                    </div>
                </template>
            </div>
        </div>
        <CamBtn
            :disabled="!canSubmit"
            @click="submit"
            block
            :loading="isLoading"
            variant="primary"
            v-if="!isSuccess"
        >
            {{ $t('studio.mint.form_col.submit') }}
        </CamBtn>

        <template v-if="isSuccess">
            <div class="success_cont">
                <Alert variant="positive">
                    {{ $t('studio.mint.preview.success.text2') }}
                </Alert>
                <div class="txID">
                    <label>{{ $t('studio.mint.preview.success.label1') }} :</label>
                    <p style="word-break: break-all">{{ txId }}</p>
                </div>
                <CamBtn @click="clearUtxo" variant="accent" small depressed>
                    {{ $t('studio.mint.preview.success.back') }}
                </CamBtn>
            </div>
        </template>
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

import NftPayloadView from '@/components/misc/NftPayloadView/NftPayloadView.vue'
import GenericForm from '@/components/wallet/studio/mint/forms/GenericForm.vue'
import JsonForm from '@/components/wallet/studio/mint/forms/JsonForm.vue'
import UrlForm from '@/components/wallet/studio/mint/forms/UrlForm.vue'
import Utf8Form from '@/components/wallet/studio/mint/forms/Utf8Form.vue'

import { ava, bintools } from '@/AVA'
import NftFamilyCardsPreview from '@/components/misc/NftFamilyCardsPreview.vue'
import NftCard from '@/components/wallet/portfolio/NftCard.vue'
import {
    GenericFormType,
    JsonFormType,
    NftMintFormType,
    UrlFormType,
    UtfFormType,
} from '@/components/wallet/studio/mint/types'
import { bnToBig } from '@/helpers/helper'
import { NftFamilyDict } from '@/store/modules/assets/types'
import { NFTMintOutput, NFTTransferOutput, UTXO } from '@c4tplatform/caminojs/dist/apis/avm'
import { JSONPayload, PayloadBase, URLPayload, UTF8Payload } from '@c4tplatform/caminojs/dist/utils'
import Big from 'big.js'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import Alert from '@/components/Alert.vue'

type NftType = 'utf8' | 'url' | 'json'

@Component({
    components: {
        NftCard,
        NftFamilyCardsPreview,
        GenericForm,
        UrlForm,
        NftPayloadView,
        Utf8Form,
        JsonForm,
        CamBtn,
        CamInput,
        Alert,
    },
})
export default class MintNft extends Vue {
    @Prop() mintUtxo!: UTXO

    quantity = 1
    addresses = []
    nftType: NftType = 'url'
    nftFormType = 'generic'
    payloadPreview: null | PayloadBase = null
    isSuccess = false
    isLoading = false
    txId = ''

    maxPreviewUtxoLen = 18
    get typeDescription() {
        if (this.nftFormType === 'generic') {
            return this.$t('studio.mint.type_col.typeDesc.generic')
        }

        if (this.nftType === 'url') {
            return this.$t('studio.mint.type_col.typeDesc.url')
        } else if (this.nftType === 'json') {
            return this.$t('studio.mint.type_col.typeDesc.json')
        } else {
            return this.$t('studio.mint.type_col.typeDesc.utf8')
        }
    }

    get nftFamsDict(): NftFamilyDict {
        return this.$store.state.Assets.nftFamsDict
    }

    get family() {
        let idBuff = this.mintUtxo.getAssetID()
        let id = bintools.cb58Encode(idBuff)
        return this.nftFamsDict[id]
    }

    get groupId() {
        return (this.mintUtxo.getOutput() as NFTMintOutput).getGroupID()
    }

    get formComponent() {
        switch (this.nftType) {
            case 'utf8':
                return Utf8Form
            case 'url':
                return UrlForm
            case 'json':
                return JsonForm
            default:
                return Utf8Form
        }
    }

    get payloadContent() {
        if (!this.payloadPreview) return null
        return this.payloadPreview.getContent().toString()
    }

    get nftTitle() {
        try {
            let json = JSON.parse(this.payloadContent || '')
            return json.avalanche.title
        } catch (err) {
            return ''
        }
    }

    get nftDesc() {
        try {
            let json = JSON.parse(this.payloadContent || '')
            return json.avalanche.desc
        } catch (err) {
            return ''
        }
    }

    clearUtxo() {
        this.$emit('clearUtxo')
    }

    get txFee(): Big {
        return bnToBig(ava.XChain().getTxFee(), 9)
    }

    get canSubmit(): boolean {
        return this.payloadPreview !== null && this.quantity >= this.minQuantity
    }

    get minQuantity(): number {
        return this.addresses.length || 1
    }

    onAddressInput(ev: any) {
        this.addresses = ev.target.value.trim().split(',')
    }

    onInput(form: NftMintFormType | null) {
        if (form === null) {
            this.payloadPreview = null
            return
        }

        try {
            let payload
            if (this.nftFormType === 'generic') {
                // let dataStr = JSON.stringify((form as GenericFormType).data)
                // payload = new JSONPayload(dataStr)
                payload = new JSONPayload((form as GenericFormType).data)
            } else {
                switch (this.nftType) {
                    case 'url':
                        payload = new URLPayload((form as UrlFormType).url)
                        break
                    case 'json':
                        payload = new JSONPayload((form as JsonFormType).data)
                        break
                    case 'utf8':
                        payload = new UTF8Payload((form as UtfFormType).text)
                        break
                    default:
                        payload = new UTF8Payload('hi there')
                        break
                }
            }

            this.payloadPreview = payload
        } catch (e) {
            console.error(e)
        }
    }

    get familyUtxos(): UTXO[] {
        let dict = this.$store.getters['Assets/walletNftDict']
        // return this.$store.getters.walletNftDict[this.family.id] || []
        return dict[this.family.id] || []
    }

    get groupUtxos() {
        let utxos = this.familyUtxos
        let ids: number[] = []

        let filtered = utxos.filter((utxo) => {
            let groupId = (utxo.getOutput() as NFTTransferOutput).getGroupID()

            if (ids.includes(groupId)) {
                return false
            } else {
                ids.push(groupId)
                return true
            }
        })

        // order by group id
        filtered.sort((a, b) => {
            let gA = (a.getOutput() as NFTTransferOutput).getGroupID()
            let gB = (b.getOutput() as NFTTransferOutput).getGroupID()
            return gA - gB
        })

        return filtered.slice(0, this.maxPreviewUtxoLen)
    }

    async submit() {
        let wallet = this.$store.state.activeWallet
        if (!wallet) return

        this.isLoading = true
        try {
            let txId = await wallet.mintNft(
                this.mintUtxo,
                this.payloadPreview,
                this.quantity,
                this.addresses
            )
            this.onSuccess(txId)
        } catch (e) {
            console.error(e)
        }
    }

    cancel() {
        this.$emit('cancel')
    }

    onSuccess(txId: string) {
        this.isLoading = false
        this.isSuccess = true
        this.txId = txId
        let { dispatchNotification } = this.globalHelper()
        dispatchNotification({
            message: this.$t('notifications.mint_form'),
            type: 'success',
        })
        setTimeout(() => {
            this.$store.dispatch('Assets/updateUTXOs')
            this.$store.dispatch('History/updateTransactionHistory')
        }, 2000)
    }

    onError(err: any) {
        this.isLoading = false
    }

    get nativeAssetSymbol(): string {
        return this.$store.getters['Assets/AssetAVA']?.symbol ?? ''
    }
}
</script>
<style lang="scss">
@use '../../../../styles/abstracts/mixins';
.mint_form {
    label {
        margin-top: 6px;
        color: var(--primary-color);
        @include mixins.typography-caption;
        margin-bottom: 3px;
    }

    p {
        color: var(--primary-color-light);
    }

    input,
    textarea {
        background-color: var(--bg-light);
        padding: 8px 12px;
        display: block;
        @include mixins.typography-caption;
        color: var(--primary-color);
    }

    textarea {
        resize: none;
    }

    .type_col {
        display: flex;
        flex-direction: column;

        > p {
            margin-top: 30px !important;
            @include mixins.typography-caption;
        }
    }
}
</style>
<style lang="scss" scoped>
@use '../../../../styles/abstracts/mixins';

.mint_form {
    margin-top: 1rem;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    gap: 3rem;

    > button {
        min-width: 150px;
        align-self: end;
        margin-right: 30px;
    }
}

.nft-type__contaiener {
    display: flex;
    gap: 16px;
    margin: 8px 0;
    align-items: center;
}
.nft-type__contaiener .nft-type__item {
    display: flex;
    align-items: center;
    gap: 8px;
    label {
        margin: 0;
    }
}
.options {
    display: flex;

    > div {
        //width: 130px;
        display: flex;
        flex-direction: column;
        margin-right: 12px;
        border: 2px solid var(--bg-light);
        border-radius: 14px;
        padding: 24px 12px;
        text-align: center;
        color: var(--primary-color-light);
        align-items: center;

        &[selected] {
            background-color: var(--bg-light);
        }
        .option_title {
            @include mixins.typography-caption;
            font-weight: bold;
        }
        .option_desc {
            @include mixins.typography-caption;
        }
    }
}
.utxo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    height: max-content;

    button {
        //position: absolute;
        @include mixins.typography-caption;
        //right: 12px;
        //top: 6px;
        color: var(--secondary-color);
        opacity: 0.8;

        &:hover {
            opacity: 1;
        }
    }
}

$col_pad: 24px;

.cols {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    column-gap: $col_pad;

    .type_col {
        padding-right: 10px;
    }
    > div {
        border-right: 1px solid var(--bg-light);
        &:last-child {
            border: none !important;
        }
    }
}

.right_col {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: none !important;
}

.nft_preview {
    width: 220px;
    max-height: 320px;
    overflow: scroll;

    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
}
.preview_holder {
    border-color: var(--primary-color-light);
    min-height: 240px;
    text-align: center;
    display: flex;
    padding: 14px;
    border: 1px dashed var(--primary-color);

    p {
        align-self: center;
        @include mixins.typography-caption;
        color: var(--primary-color-light);
    }
}
.fee {
    margin-top: 14px;
    @include mixins.typography-caption;
    p > span {
        margin-left: 35px;
    }
}

.form_col {
    padding-right: 2vw;
    //border: none !important;
}

.form_cont {
    margin-bottom: 30px;
}
.success_cont {
    max-width: 100%;
    margin: 24px 0;
    text-align: center;
    width: fit-content;
    margin-right: 40px;

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    align-self: flex-end;
    gap: 0.5rem;

    .txID {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        p {
            color: var(--primary-color-light);
            @include mixins.typography-caption;
        }
    }

    > button {
        margin-top: 1rem;
    }
}

.empty_card {
    width: 50px;
    height: 70px;
    margin: 12px auto;
    background-color: transparent;
    display: flex;
    justify-self: center;
    align-items: center;
    justify-content: center;
    color: var(--primary-color-light);
    border: 2px dashed var(--primary-color-light);
}

.payload_view_cont {
    min-height: 260px;
    width: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

@include mixins.medium-device {
    .mint_form {
        padding: 24px;
    }
    .cols {
        grid-template-columns: 1fr 1fr;
        row-gap: 24px;
        > div {
            &:nth-child(2) {
                border-right: none;
            }
            &:last-child {
                grid-column-end: span 2;
            }
        }
    }

    .utxo {
        display: grid;
        column-gap: 22px;
        grid-template-columns: max-content 1fr;
    }
}

@include mixins.mobile-device {
    .mint_form {
        > button {
            width: 100%;
            margin: 0;
        }
    }
    .success_cont {
        .txID {
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
        }
    }
    .cols {
        grid-template-columns: 1fr;
        row-gap: 24px;
        > div {
            padding: 24px;
            border-right: none;
            border-bottom: 1px solid var(--bg-light);

            &:first-child {
                border-top: 1px solid var(--bg-light);
            }

            &:last-child {
                border: none !important;
            }
        }
    }
}
</style>
