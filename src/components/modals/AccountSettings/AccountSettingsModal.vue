<template>
    <modal ref="modal" title="Account Settings" class="modal_main" @beforeClose="clear">
        <div class="modal_body">
            <div class="header">
                <Identicon :value="accountName"></Identicon>
                <p style="text-align: center">{{ accountName }}</p>
                <p class="err small" style="text-align: center">
                    Clearing your browser cache will remove this account. Make sure you have your
                    <b>mnemonic phrase</b>
                    or
                    <b>private key</b>
                    saved.
                </p>
            </div>

            <div class="options" v-if="!subComponent">
                <CamBtn
                    v-if="hasVolatile"
                    @click="saveKeys"
                    variant="transparent"
                    style="color: var(--warning) !important"
                >
                    <fa icon="exclamation-triangle"></fa>
                    Save Keys
                </CamBtn>
                <CamBtn @click="changePassword" variant="transparent">Change Password</CamBtn>
                <CamBtn @click="deleteAccount" variant="negative">Delete Account</CamBtn>
            </div>
            <template v-else>
                <component
                    v-if="subComponent"
                    :is="subComponent"
                    v-bind="[{ accountName: account.name }]"
                    @clear="clear"
                ></component>
                <CamBtn :onClick="clear" variant="transparent" class="cancel" v-if="isSaveKeys">
                    {{ $t('access.cancel') }}
                </CamBtn>
            </template>
        </div>
    </modal>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

import Modal from '@/components/modals/Modal.vue'
import Identicon from '@/components/misc/Identicon.vue'
import { iUserAccountEncrypted } from '@/store/types'
import ChangePassword from '@/components/modals/AccountSettings/ChangePassword.vue'
import DeleteAccount from '@/components/modals/AccountSettings/DeleteAccount.vue'
import SaveKeys from '@/components/modals/AccountSettings/SaveKeys.vue'
import CamBtn from '@/components/CamBtn.vue'
@Component({
    components: {
        ChangePassword,
        Identicon,
        Modal,
        CamBtn,
    },
})
export default class AccountSettingsModal extends Vue {
    $refs!: {
        modal: Modal
    }
    isSaveKeys: boolean = false

    subComponent: any = null

    get account(): iUserAccountEncrypted {
        return this.$store.getters['Accounts/account']
    }
    get accountName(): string {
        return this.account?.name ?? 'New Account'
    }
    open() {
        this.$refs.modal.open()
    }

    close() {
        this.$refs.modal.close()
    }

    clear() {
        this.subComponent = null
        this.isSaveKeys = false
    }

    changePassword() {
        this.subComponent = ChangePassword
        this.isSaveKeys = false
    }

    deleteAccount() {
        this.subComponent = DeleteAccount
        this.isSaveKeys = false
    }

    saveKeys() {
        this.subComponent = SaveKeys
        this.isSaveKeys = true
    }

    get hasVolatile() {
        return this.$store.getters.accountChanged
    }
}
</script>
<style scoped lang="scss">
.modal_body {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 320px;
    max-width: 100%;
    padding: 20px 30px;
    color: var(--primary-color);
}

.header {
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.options {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    > button {
        width: 100%;
        padding: 1.5rem;
    }

    .camino__transparent--button {
        border: none;
    }
}

.cancel {
    margin-top: 0.2rem;
    width: 100%;
}
</style>
