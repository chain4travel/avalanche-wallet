<template>
    <div class="manage_account--container">
        <div class="header">
            <h1>{{ selectedTitle }}</h1>
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
        </div>

        <div class="options" v-if="!subComponent">
            <button class="camino__transparent--button" @click="changePassword">
                {{ $t('keys.change_password') }}
            </button>
            <button class="camino__negative--button" @click="deleteAccount">
                {{ $t('keys.delete_account') }}
            </button>
        </div>
        <template v-else>
            <component
                class="delete-section"
                v-if="subComponent"
                :is="subComponent"
                v-bind="[{ accountName: account.name }]"
                @clear="clear"
            ></component>
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

import Modal from '@/components/modals/Modal.vue'
import Identicon from '@/components/misc/Identicon.vue'
import { iUserAccountEncrypted } from '@/store/types'
import ChangePassword from '@/components/modals/AccountSettings/ChangePassword.vue'
import DeleteAccount from '@/components/modals/AccountSettings/DeleteAccount.vue'
import SaveKeys from '@/components/modals/AccountSettings/SaveKeys.vue'
@Component({
    components: {
        ChangePassword,
        Identicon,
        Modal,
    },
})
export default class ManageAccount extends Vue {
    $refs!: {
        modal: Modal
    }
    selectedTitle: string = 'Manage Account'
    subComponent: any = null
    get account(): iUserAccountEncrypted {
        return this.$store.getters['Accounts/account']
    }
    get accountName(): string {
        return this.account?.name ?? 'New Account'
    }

    clear() {
        this.selectedTitle = 'Manage Account'
        this.subComponent = null
    }

    changePassword() {
        this.selectedTitle = 'Change Password'
        this.subComponent = ChangePassword
    }

    deleteAccount() {
        this.selectedTitle = 'Delete Account'
        this.subComponent = DeleteAccount
    }

    saveKeys() {
        this.subComponent = SaveKeys
    }

    get hasVolatile() {
        return this.$store.getters.accountChanged
    }
}
</script>
<style scoped lang="scss">
.delete-section {
    max-width: 50%;
}
.manage_account--container {
    max-width: 50%;
    margin-top: 4rem;
    height: 100%;
    color: var(--primary-color);
}

.header {
    padding: 16px 24px;
    padding-left: 0px;
    h1 {
        color: var(--primary-color);
        font-family: 'Inter';
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: 32px;
        margin-bottom: 8px;
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

.options {
    display: flex;
    max-width: 400px;
    gap: 1rem;
    flex-wrap: wrap;
    .v-btn {
        max-width: fit-content;
    }
}
.err {
    font-family: 'Inter';
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: var(--camino-warning-color);
}

@media only screen and (max-width: 600px) {
    .delete-section,
    .manage_account--container {
        max-width: 100%;
    }
}
</style>
