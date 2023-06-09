<template>
    <div class="container">
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
            <button
                v-if="hasVolatile"
                @click="saveKeys"
                class="ava_button"
                style="color: var(--warning)"
            >
                <fa icon="exclamation-triangle"></fa>
                Save Keys
            </button>
            <v-btn class="button_primary" @click="changePassword">
                {{ $t('keys.change_password') }}
            </v-btn>
            <v-btn class="button_primary" @click="deleteAccount">
                {{ $t('keys.delete_account') }}
            </v-btn>
        </div>
        <template v-else>
            <component
                v-if="subComponent"
                :is="subComponent"
                v-bind="[{ accountName: account.name }]"
            ></component>
            <button @click="clear">{{ $t('access.cancel') }}</button>
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
.container {
    width: 100%;
    height: 100%;
    color: var(--primary-color);
}

.header {
    margin-bottom: 14px;
    h1 {
        font-size: 48px;
        font-weight: bold;
    }
    p {
        font-size: 20px;
        font-family: 'Inter' sans-serif;
    }
}

.options {
    display: flex;
    max-width: 450px;
    gap: 1rem;
    flex-wrap: wrap;
    .v-btn {
        max-width: fit-content;
    }
}
</style>
