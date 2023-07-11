<template>
    <div class="manage_account--container">
        <div class="header">
            <h1>{{ selectedTitle }}</h1>
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
.manage_account--container {
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
    }
    p {
        font-family: 'Inter';
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        letter-spacing: 0em;
        text-align: left;
    }
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
    color: #e5a21f;
}
</style>
