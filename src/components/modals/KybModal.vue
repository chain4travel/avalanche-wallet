<template>
    <div>
        <Modal
            :isKybModal="true"
            ref="modal"
            :title="$t('kyc_process.title-kyb')"
            class="modal_main"
            @beforeClose="beforeClose"
            :canCloseKybModal="canCloseModal"
        >
            <div v-if="!userDataSubmitted" class="KYCform">
                <div class="request-text">
                    {{ $t('kyc_process.info_explanation_kyb_p1') }}
                    <a
                        @click="redirect('documentation')"
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{ $t('kyc_process.link_to_documentation') }}
                    </a>
                </div>
                <div class="container-kyb">
                    <div class="text">
                        {{ $t('kyc_process.info_explanation_kyb_p2') }}
                    </div>
                    <form @submit.prevent="submitUserData">
                        <div>
                            <label>{{ $t('kyc_process.your_email_address') }}</label>
                            <input
                                type="text"
                                :placeholder="$t('kyc_process.email_address')"
                                v-model="userData.email"
                            />
                        </div>
                        <div>
                            <label>{{ $t('kyc_process.your_phone_number') }}</label>
                            <input
                                type="tel"
                                :placeholder="$t('kyc_process.phone_number')"
                                v-model="userData.phone"
                            />
                        </div>
                        <v-btn
                            type="submit"
                            :disabled="submitUserDataDisabled"
                            :loading="isLoading"
                            class="button_submit_form submit"
                        >
                            {{ $t('kyc_process.submit') }}
                        </v-btn>
                    </form>
                </div>
                <p>
                    {{ $t('kyc_process.provider') }}
                    <a
                        @click="redirect('provider')"
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Sumsub Privacy Notice.
                    </a>
                </p>
            </div>
            <div id="sumsub-websdk-container"></div>
            <div v-if="verficationCompleted" class="kyc_action">
                <v-btn type="cancel" @click="close" class="outlined_button">Close</v-btn>
            </div>
        </Modal>
        <Disclaimer ref="disclaimer" @change="updateCloseState" />
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Modal from '@/components/modals/Modal.vue'
import { generateToken } from '@/kyc_api'
import snsWebSdk from '@sumsub/websdk'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import { WalletType, WalletNameType } from '@/js/wallets/types'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { KYC_VARIANT, kycStyleDay, kycStyleNight } from '@/constants'
import Disclaimer from './DisclaimerModal.vue'
interface UserData {
    email: string
    phone: string
}

@Component({
    components: {
        Modal,
        Disclaimer,
    },
})
export default class KybModal extends Vue {
    @Prop() walle!: WalletType
    $refs!: {
        modal: Modal
        disclaimer: Disclaimer
    }
    /**/
    canCloseModal = false
    modalLight: string = '#FFF'
    modalDark: string = '#242729'
    background: string = 'body {background-color: red !important;}'
    verficationCompleted: boolean = false
    /**/
    userDataSubmitted: boolean = false
    isLoading: boolean = false
    userData: UserData = {
        email: '',
        phone: '',
    }
    @Watch('themeSelected', { immediate: true })
    onthemechange(val: string) {
        if (val === 'dark') {
            this.background = kycStyleNight
        } else {
            this.background = kycStyleDay
        }
    }
    get walletType(): WalletNameType {
        return this.wallet.type
    }
    get themeSelected(): string {
        return this.$store.state.theme
    }
    get privateKeyC(): string | null {
        if (this.walletType === 'ledger') return null
        let wallet = this.wallet as SingletonWallet | MnemonicWallet
        return wallet.ethKey
    }
    get submitUserDataDisabled() {
        return !this.userData.email || !this.userData.phone || this.isLoading
    }

    launchWebSdk(accessToken: string, applicantEmail: any, applicantPhone: any) {
        let snsWebSdkInstance = snsWebSdk
            .init(accessToken, () => this.getNewAccessToken())
            .withConf({
                email: applicantEmail,
                phone: applicantPhone,
            })
            .withOptions({ addViewportTag: false, adaptIframeHeight: true })
            .on('idCheck.applicantStatus', async (applicantStatus) => {
                await this.$store.dispatch('Accounts/updateKycStatus')
                if (applicantStatus.reviewStatus === 'completed') {
                    this.verficationCompleted = true
                }
            })
            .build()
        snsWebSdkInstance.launch('#sumsub-websdk-container')
    }

    async getNewAccessToken() {
        if (this.privateKeyC) {
            const result = await generateToken(this.privateKeyC, KYC_VARIANT.KYB_BASIC)
            return result.access_token
        }
        return ''
    }

    get wallet() {
        let wallet: MnemonicWallet = this.$store.state.activeWallet
        return wallet
    }

    async submitUserData() {
        if (!this.userData.email || !this.userData.phone) return
        try {
            this.isLoading = true
            const accessToken = await this.getNewAccessToken()
            this.launchWebSdk(accessToken, this.userData.email, this.userData.phone)
            this.userDataSubmitted = true
        } finally {
            this.isLoading = false
        }
    }
    redirect(type: string) {
        switch (type) {
            case 'documentation':
                window.open(
                    ' https://docs.camino.network/validator-guides/add-validator-with-curl/#know-your-customer--know-your-business-verification',
                    '_blank'
                )
                break
            case 'provider':
                window.open('https://sumsub.com/privacy-notice-service/', '_blank')
                break
        }
    }
    async open() {
        this.canCloseModal = false
        this.$refs.modal.open()
    }

    async close() {
        await this.$store.dispatch('Accounts/updateKycStatus')
        this.$refs.modal.close()
        this.userDataSubmitted = false
        this.userData = {
            email: '',
            phone: '',
        }
    }
    updateCloseState() {
        this.canCloseModal = true
        this.close()
    }
    beforeClose() {
        if (!this.canCloseModal) this.$refs.disclaimer.open()
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.modal_main::v-deep {
    .modal_body {
        width: 70%;
        max-width: 750px;
        height: min-content !important;
        /* min-height: 450px !important; */
        border-radius: var(--border-radius-sm) !important;
        overflow: auto;
        min-height: 200px;
        cursor: auto;
        @include mixins.mobile-device {
            max-height: 90vh;
            max-width: none;
            width: 80%;
            min-height: fit-content;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
    }
    .submit {
        justify-self: end;
    }
    .modal_bg {
        width: 100vw !important;
        position: fixed;
    }
}

h1 {
    font-weight: normal;
}

.outlined_button {
    border-width: 1px;
    border-style: solid;
    border-radius: var(--border-radius-sm);
    padding: 10px 24px;
    border-color: var(--primary-btn-border-color);
    color: var(--primary-btn-border-color);
    background-color: var(--bg) !important;
    height: auto;
}

.kyc_action {
    display: flex;
    background-color: var(--bg);
    border-bottom: var(--bg);
    color: var(--primary-color);
    border-top: 2px solid var(--bg-light);
    position: relative;
    padding: 16px 22px;
}
.container-kyb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: 1rem 0;
    justify-content: space-between;
    gap: 1rem;
    .text,
    form {
        flex: 1 0 46%;
    }
    .text {
        padding: 1rem;
        flex-grow: 1;
        text-align: center;
        color: var(--primary-contrast-text);
        border-radius: var(--border-radius-sm);
        box-shadow: var(--box-shadow);
        background-color: var(--bg-light);
    }
}
.KYCform {
    padding: 20px;
    border-radius: var(--border-radius-sm);
    overflow: auto;
    .request-text {
        padding: 1rem;
        /* border: var(--primary-border); */
        text-align: center;
        color: var(--primary-contrast-text);
        border-radius: var(--border-radius-sm);
        box-shadow: var(--box-shadow);
        background-color: var(--bg-light);
    }
    a {
        color: var(--secondary-color);
        cursor: pointer;
        text-decoration: underline;
    }
    form {
        flex: 0 0 50%;
        display: grid;
        gap: 10px;
        label {
            font-size: 14px;
            margin-bottom: 10px !important;
            color: var(--primary-contrast-text);
        }
        > div {
            display: flex;
            flex-direction: column;
            margin-bottom: 5px;
        }
    }
    p {
        text-align: center;
        padding: 1rem;
    }
}

.popup {
    background: #1e293b;
}
.popup .message-content p {
    color: #f5f5f5;
}

.step.active.pending .bullet:before {
    background-color: var(--orange-color);
}
.line-form .line-form-item > .phone-input,
.line-form .line-form-item > input {
    color: red;
}
.line-form .line-form-item > span {
    border-bottom: none;
}

button {
    border-radius: 12px;
    background-color: transparent;
    font-weight: 600;
    text-align: center;
    color: #7c8ab5;
    border: 1px solid #149ded;
}
input {
    color: var(--primary-color);
    background-color: var(--bg-light);
    border-radius: var(--border-radius-sm);
    padding: 10px 10px;
    font-size: 13px;
    outline: none;
}
</style>
