<template>
    <div class="container">
        <h1>{{ $t('keys.save_account.title') }}</h1>
        <div class="description">
            <p class="description">{{ $t('keys.save_account.desc') }}</p>
            <p>{{ $t('keys.save_account.info') }}</p>
        </div>

        <form @submit.prevent="submit">
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_1') }}</label>
                <input
                    v-model="accountName"
                    :name="$t('keys.save_account.placeholder_1').toString()"
                    placeholder="Account Name"
                    :disabled="existsInLocalStorage"
                />
            </div>
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_2') }}</label>
                <input
                    type="password"
                    :placeholder="$t('keys.save_account.placeholder_2').toString()"
                    v-model="password"
                />
            </div>
            <div class="container__input">
                <label>{{ $t('keys.save_account.placeholder_3') }}</label>
                <input
                    type="password"
                    :placeholder="$t('keys.save_account.placeholder_3').toString()"
                    v-model="password_confirm"
                />
            </div>
            <p class="err">{{ err }}</p>
            <p class="err small">
                {{ $t('keys.save_account.warning') }}
                <br />
                Make sure you have your
                <b>mnemonic phrase</b>
                or
                <b>private key</b>
                saved.
            </p>
            <v-btn
                class="button_primary submit"
                :disabled="!canSubmit"
                type="submit"
                :loading="isLoading"
            >
                {{ $t('keys.save_account.submit') }}
            </v-btn>
        </form>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import { SaveAccountInput } from '@/store/types'
import { iUserAccountEncrypted } from '@/store/types'
import Identicon from '@/components/misc/Identicon.vue'

@Component({
    components: {
        Identicon,
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

    get canSubmit() {
        if (this.error !== null) return false
        return true
    }

    get error() {
        if (!this.password) return this.$t('keys.password_validation')
        if (!this.password_confirm) return this.$t('keys.password_validation2')
        if (this.accountName.length < 1) return this.$t('keys.account_name_required')
        if (this.password.length < 9) return this.$t('keys.password_validation')
        if (this.password !== this.password_confirm) return this.$t('keys.password_validation2')

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
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    &__input {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 400px;
    }
    h1 {
        font-size: 48px;
        font-weight: bold;
    }
    p {
        font-size: 20px;
        font-family: 'Inter' sans-serif;
    }
}

form {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2rem 0;
    > * {
        margin: 6px 0px;
    }
}

input {
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 12px;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--bg-light);
}

.cancel_but {
    color: #999;
    font-size: 0.9rem;
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

.err {
    color: var(--warning);
}
</style>
