<template>
    <div>
        <div v-if="!userDataSubmitted" class="card">
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
                    <label>{{ `Your Phone Number` }}</label>
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
                    class="button_primary"
                >
                    {{ $t('kyc_process.submit') }}
                </v-btn>
            </form>
        </div>
        <div id="sumsub-websdk-container"></div>
    </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import snsWebSdk from '@sumsub/websdk'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import { checkVerificationStatus, generateToken, kyc_api } from '@/kyc_api'

interface UserData {
    email: string
    phone: string
}

//TODO: Delete console logs in this components
@Component({})
export default class ChainImport extends Vue {
    userData: UserData = {
        email: '',
        phone: '',
    }
    userDataSubmitted: boolean = false
    isLoading: boolean = false

    async mounted() {
        const evmAddress = '0x' + this.wallet.getEvmAddress()
        console.log('getNewAccessToken', evmAddress)
        const result = await checkVerificationStatus(evmAddress)
        console.log(result)
    }

    get submitUserDataDisabled() {
        return !this.userData.email || !this.userData.phone
    }

    launchWebSdk(accessToken: string, applicantEmail: any, applicantPhone: any) {
        let snsWebSdkInstance = snsWebSdk
            .init(accessToken, () => this.getNewAccessToken())
            .withConf({
                lang: 'en',
                email: applicantEmail,
                phone: applicantPhone,
                i18n: {
                    document: {
                        subTitles: { IDENTITY: 'Upload a document that proves your identity' },
                    },
                },
                uiConf: {
                    customCssStr:
                        ':root {\n  --black: #000000;\n   --grey: #F5F5F5;\n  --grey-darker: #B2B2B2;\n  --border-color: #DBDBDB;\n}\n\np {\n  color: var(--black);\n  font-size: 16px;\n  line-height: 24px;\n}\n\nsection {\n  margin: 40px auto;\n}\n\ninput {\n  color: var(--black);\n  font-weight: 600;\n  outline: none;\n}\n\nsection.content {\n  background-color: var(--grey);\n  color: var(--black);\n  padding: 40px 40px 16px;\n  box-shadow: none;\n  border-radius: 6px;\n}\n\nbutton.submit,\nbutton.back {\n  text-transform: capitalize;\n  border-radius: 6px;\n  height: 48px;\n  padding: 0 30px;\n  font-size: 16px;\n  background-image: none !important;\n  transform: none !important;\n  box-shadow: none !important;\n  transition: all 0.2s linear;\n}\n\nbutton.submit {\n  min-width: 132px;\n  background: none;\n  background-color: var(--black);\n}\n\n.round-icon {\n  background-color: var(--black) !important;\n  background-image: none !important;\n}',
                },
            })
            .withOptions({ addViewportTag: false, adaptIframeHeight: true })
            .onMessage((type, payload) => {
                console.log('onMessage', type, payload)
            })
            .on('idCheck.moduleResultPresented', async (data: any) => {
                console.log('idCheck.moduleResultPresented', data)
                await this.$store.dispatch('Accounts/updateKycStatus')
            })
            .build()
        snsWebSdkInstance.launch('#sumsub-websdk-container')
    }

    async getNewAccessToken() {
        const evmAddress = '0x' + this.wallet.getEvmAddress()
        console.log('getNewAccessToken', evmAddress)
        const result = await generateToken(evmAddress)
        console.log(result)
        return result.token
    }

    get wallet() {
        let wallet: MnemonicWallet = this.$store.state.activeWallet
        return wallet
    }

    async submitUserData() {
        console.log('submitUserData', this.userData)
        if (!this.userData.email || !this.userData.phone) return
        this.isLoading = true
        const accessToken = await this.getNewAccessToken()
        console.log('accessToken', accessToken)
        this.launchWebSdk(accessToken, this.userData.email, this.userData.phone)
        this.userDataSubmitted = true
        this.isLoading = false
    }

    @Watch('$route')
    route(to: { path: string }) {
        if (to.path === '/wallet/kyc_process') {
            this.userDataSubmitted = false
        }
    }
}
</script>
<style scoped lang="scss">
h1 {
    font-weight: normal;
}

.head {
    margin-bottom: 14px;
}

.something {
    display: block;
    text-align: left;
    color: var(--primary-color-light);
    font-size: 12px;
    margin-bottom: 20px;
    margin-top: 6px;
}

.card {
    padding: 20px;
    border-radius: 4px;
    overflow: auto;
}

form {
    margin-top: 12px;

    label {
        font-size: 12px;
    }

    > div {
        display: flex;
        flex-direction: column;
        margin-bottom: 5px;
    }
}

input {
    color: var(--primary-color);
    background-color: var(--bg-light);
    border-radius: 4px;
    padding: 6px 6px;
    font-size: 13px;
    outline: none;
}
</style>
