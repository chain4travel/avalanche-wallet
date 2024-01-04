<template>
    <div class="access_card">
        <div class="content">
            <Identicon :value="account.name"></Identicon>
            <h1>{{ account.name }}</h1>
            <form @submit.prevent="access">
                <cam-input class="pass_name" :value="account.name" />
                <cam-input
                    class="pass"
                    type="password"
                    :placeholder="Password"
                    v-model="password"
                />
                <p class="err">{{ error }}</p>
                <CamBtn
                    variant="primary"
                    style="width: 100%"
                    @click="access"
                    :loading="isLoading"
                    :disabled="!canSubmit"
                >
                    {{ $t('access.submit') }}
                </CamBtn>
                <small>{{ $t('keys.account_slow_warning') }}</small>
            </form>
            <div @click="returnToLogin" class="link">{{ $t('access.cancel') }}</div>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ImportKeyfileInput } from '@/store/types'
import Identicon from '@/components/misc/Identicon.vue'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'

@Component({
    components: { Identicon, CamBtn, CamInput },
})
export default class Account extends Vue {
    @Prop() index: string
    @Prop() navigate: any
    helpers = this.globalHelper()
    password: string = ''
    isLoading: boolean = false
    error: string = ''

    get accounts() {
        let accountsRaw = localStorage.getItem('accounts') || '{}'
        return JSON.parse(accountsRaw) || []
    }

    get account() {
        return this.accounts[this.index]
    }

    created() {
        if (!this.account) {
            this.navigate('/login')
            return
        }
    }

    returnToLogin() {
        this.navigate(`/login`)
    }

    async access() {
        const { account } = this
        if (!this.canSubmit || this.isLoading) return
        if (account == null) return
        let parent = this
        this.error = ''
        this.isLoading = true

        let data: ImportKeyfileInput = {
            password: this.password,
            data: account.wallet,
        }
        setTimeout(() => {
            this.$store
                .dispatch('Accounts/accessAccount', {
                    index: parseInt(this.index),
                    pass: this.password,
                })
                .then(() => {
                    parent.helpers.updateSuiteStore(this.$store.state)
                    parent.helpers.setAccount(this.$store.getters['Accounts/account'])
                    parent.isLoading = false
                })
                .catch((err) => {
                    if (err === 'INVALID_PASS') {
                        parent.error = this.$t('access.password_error').toString()
                    } else if (err === 'INVALID_VERSION') {
                        parent.error = this.$t('access.keystore_error').toString()
                    } else {
                        parent.error = err.message
                    }
                    parent.isLoading = false
                })
        }, 200)
    }
    onsuccess() {
        this.isLoading = false
        this.password = ''
    }
    onerror(e: any) {
        this.error = e
        this.password = ''
        this.isLoading = false
    }
    get canSubmit(): boolean {
        if (!this.password) {
            return false
        }
        return true
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/main';
@use '../../styles/abstracts/variables';
@use '../../styles/abstracts/mixins';
.pass {
    text-align: center;
    background-color: var(--bg-wallet-light) !important;
    border-radius: 8px;
}

.ava_button {
    width: 100%;
    margin-bottom: 22px;
    height: 40px !important;
}
.access_card {
    /*max-width: 80vw;*/
    //background-color: var(--bg-light);
    //padding: variables.$container-padding;
    width: 100%;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
}
.content {
    text-align: center;
    max-width: 420px;
    background-color: var(--bg-light);
    padding: 40px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
}
h1 {
    font-size: variables.$m-size;
    font-weight: 400;
}

form {
    margin-bottom: 20px;
}
.file_in {
    margin: 30px auto 10px;
    @include mixins.typography-caption;
    border: none !important;
    background-color: var(--bg-light) !important;
    /*min-width: 200px*/
}
a {
    color: variables.$primary-color-light !important;
    text-decoration: underline !important;
    margin: 10px 0 20px;
}
.link {
    color: var(--secondary-color);
}
.remember {
    margin: 12px 0;
}
.err {
    @include mixins.typography-caption;
    color: var(--error);
    margin: 14px 0px !important;
}
@media only screen and (max-width: variables.$mobile_width) {
    h1 {
        font-size: variables.$m-size-mobile;
    }
    .but_primary {
        width: 100%;
    }
}
@media only screen and (max-width: variables.$mobile_width) {
    .access_card {
        padding: main.$container-padding-mobile;
    }
}
</style>
