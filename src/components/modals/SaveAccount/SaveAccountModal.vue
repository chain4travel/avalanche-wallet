<template>
    <div>
        <Modal ref="modal" :title="$t('keys.save_account.title')">
            <div class="remember_modal">
                <form>
                    <div class="flex-row" style="justify-content: center">
                        <Identicon :value="name"></Identicon>
                    </div>
                    <p>{{ $t('keys.save_account.desc') }}</p>

                    <CamInput
                        v-model="accountName"
                        :name="$t('keys.save_account.placeholder_1').toString()"
                        placeholder="Account Name"
                        :disabled="existsInLocalStorage"
                    />
                    <CamInput
                        type="password"
                        :placeholder="$t('keys.save_account.placeholder_2').toString()"
                        v-model="password"
                    />
                    <CamInput
                        type="password"
                        :placeholder="$t('keys.save_account.placeholder_3').toString()"
                        v-model="password_confirm"
                    />
                    <Alert variant="negative" v-if="err" class="err">{{ err }}</Alert>
                    <p class="err small" style="text-align: center">
                        Clearing your browser cache will remove this account. Make sure you have
                        your
                        <b>mnemonic phrase</b>
                        or
                        <b>private key</b>
                        saved.
                    </p>
                    <Alert
                        v-for="(error, index) in errors"
                        variant="negative"
                        :title="error"
                        :key="index"
                    ></Alert>
                    <CamBtn
                        variant="primary"
                        :disabled="!canSubmit"
                        :onClick="submit"
                        :loading="isLoading"
                    >
                        {{ $t('keys.save_account.submit') }}
                    </CamBtn>
                </form>
            </div>
        </Modal>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import Modal from '../Modal.vue'
import { SaveAccountInput } from '@/store/types'
import { iUserAccountEncrypted } from '@/store/types'
import Identicon from '@/components/misc/Identicon.vue'
import CamInput from '@/components/CamInput.vue'
import Alert from '@/components/Alert.vue'
import CamBtn from '@/components/CamBtn.vue'

@Component({
    components: {
        Identicon,
        Modal,
        CamInput,
        Alert,
        CamBtn,
    },
})
export default class SaveAccountModal extends Vue {
    @Prop() setAccount: any
    password: string = ''
    password_confirm: string = ''
    isLoading: boolean = false
    isDestroyed: boolean = false
    err: any = ''
    accountName = ''
    existsInLocalStorage: boolean = false
    index: number = 0
    errors: string[] = []
    foundAccount: iUserAccountEncrypted | null = null
    $refs!: {
        modal: Modal
    }

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
        this.onsuccess()
    }

    destroyed() {
        this.isDestroyed = true
    }

    onsuccess() {
        this.close()
    }

    clear() {
        this.password = ''
        this.password_confirm = ''
        this.accountName = ''
        this.err = ''
    }
    close() {
        this.clear()
        if (!this.isDestroyed) this.$refs.modal.close()
    }

    open() {
        this.$refs.modal.open()
    }

    get name(): string[] {
        return this.$store.getters['Accounts/name']
    }
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
.remember_modal {
    width: 320px;
    max-width: 100%;
    padding: 12px 30px;
}

form {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    > button {
        width: 100%;
    }

    > * {
        margin: 6px 0px;
    }
}

.cancel_but {
    color: #999;
    @include mixins.typography-caption;
}

.password {
    background-color: var(--bg-light);
    color: var(--primary-color);
    padding: 6px 14px;
}

.submit {
    margin-top: 30px;
}

.err {
    width: 100%;
    max-width: 100%;
}
</style>
