<template>
    <div class="container">
        <h1>{{ $t('keys.save_account.title') }}</h1>
        <div class="description">
            <p class="description">{{ $t('keys.save_account.desc') }}</p>
            <p>{{ $t('keys.save_account.info') }}</p>
        </div>

        <form>
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_1') }}</label>
                <CamInput
                    v-model="accountName"
                    :name="$t('keys.save_account.placeholder_1').toString()"
                    placeholder="Account Name"
                    :disabled="existsInLocalStorage"
                />
            </div>
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_2') }}</label>
                <CamInput
                    type="password"
                    :placeholder="$t('keys.save_account.placeholder_2').toString()"
                    v-model="password"
                />
            </div>
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_3') }}</label>
                <CamInput
                    type="password"
                    :placeholder="$t('keys.save_account.placeholder_3').toString()"
                    v-model="password_confirm"
                />
            </div>
            <p class="err">{{ err }}</p>
            <div class="warning-container">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" fill="#E5A21F" />
                </svg>
                <p class="err small">
                    {{ $t('keys.save_account.warning') }}
                    <br />
                    Make sure you have your
                    <b>mnemonic phrase</b>
                    or
                    <b>private key</b>
                    saved.
                </p>
            </div>

            <Alert
                v-for="(error, index) in errors"
                variant="negative"
                :title="error"
                :key="index"
            ></Alert>
            <CamBtn :disabled="!canSubmit" :onClick="submit" :loading="isLoading">
                {{ $t('keys.save_account.submit') }}
            </CamBtn>
        </form>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

import Identicon from '@/components/misc/Identicon.vue'
import { SaveAccountInput, iUserAccountEncrypted } from '@/store/types'
import Alert from './Alert.vue'
import CamInput from './CamInput.vue'
import CamBtn from './CamBtn.vue'

@Component({
    components: {
        Identicon,
        Alert,
        CamInput,
        CamBtn,
    },
})
export default class SaveAccount extends Vue {
    @Prop() setAccount: any
    password: string = ''
    password_confirm: string = ''
    isLoading: boolean = false
    isDestroyed: boolean = false
    err: any = ''
    accountName = ''
    existsInLocalStorage: boolean = false
    index: number = 0
    foundAccount: iUserAccountEncrypted | null = null
    errors: string[] = []
    get canSubmit() {
        if (this.errors.length !== 0) return false
        return true
    }

    @Watch('password_confirm')
    @Watch('accountName')
    @Watch('password')
    checkError() {
        this.errors = []
        if (this.password && this.password !== this.password_confirm)
            this.errors.push(this.$t('keys.password_validation2') as string)
        if (!this.password || this.password.length < 9)
            this.errors.push(this.$t('keys.password_validation') as string)

        if (this.accountName.length < 1)
            this.errors.push(this.$t('keys.account_name_required') as string)
        return null
    }

    async submit(): Promise<void> {
        this.isLoading = true
        let pass = this.password
        let accountName = this.accountName

        let input: SaveAccountInput = {
            accountName: accountName,
            password: pass,
        }
        let notificationMessage = this.$t('notifications.save_account')
        await this.$store.dispatch('Accounts/saveAccount', input)
        this.setAccount(this.$store.getters['Accounts/account'])
        let { dispatchNotification } = this.globalHelper()
        dispatchNotification({
            message: notificationMessage,
            type: 'success',
        })
        this.isLoading = false
    }

    destroyed() {
        this.isDestroyed = true
    }

    clear() {
        this.password = ''
        this.password_confirm = ''
        this.accountName = ''
        this.err = ''
    }

    get name(): string[] {
        return this.$store.getters['Accounts/name']
    }
}
</script>
<style scoped lang="scss">
.container {
    height: 100%;
    color: var(--primary-color);
    padding: 16px 24px;
    padding-left: 0px;
    margin-top: 4rem;
    &__input {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 400px;
        align-items: flex-start;
        input {
            width: 100%;
        }
    }
    h1 {
        color: var(--primary-color);
        font-family: 'Inter';
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: 32px;
    }
    p {
        font-family: 'Inter';
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        letter-spacing: 0em;
        text-align: left;
        margin: 0 !important;
    }
}

form {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* > * {
        margin: 6px 0px;
    } */
    label {
        font-family: 'Inter';
        font-size: 14px;
        font-style: normal;
        font-weight: 600;
        line-height: 20px;
    }
}

.password {
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 6px 14px;
}

.submit {
    margin-top: 30px;
    max-width: 400px;
    width: 100%;
}

.warning-container {
    display: flex;
    max-width: fit-content;
    padding: 16px;
    align-items: flex-start;
    gap: 12px;
    border-radius: 6px;
    border: 1px solid var(--camino-warning-border);
    background: var(--camino-warning-background);
}
.err {
    color: var(--camino-warning-color);
}
</style>
