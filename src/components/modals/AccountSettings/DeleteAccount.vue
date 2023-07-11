<template>
    <form @submit.prevent="submit">
        <input class="camino--input" type="password" v-model="pass" placeholder="Password" />
        <p class="err">{{ error }}</p>
        <div class="buttons_container">
            <button
                :class="['camino__transparent--button', { 'camino--button--disabled': !canSubmit }]"
                :disabled="!canSubmit"
                depressed
                block
                small
                type="submit"
            >
                Delete
            </button>
            <button class="camino__negative--button" small block depressed @click="cancel">
                Cancel
            </button>
        </div>
    </form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import AccountSettingsModal from '@/components/modals/AccountSettings/AccountSettingsModal.vue'

@Component
export default class DeleteAccount extends Vue {
    @Prop() setAccount: any
    pass = ''
    error = ''
    $parent!: AccountSettingsModal

    get canSubmit() {
        if (this.pass.length < 1) return false
        return true
    }
    cancel() {
        this.$emit('clear')
    }
    async submit() {
        this.error = ''
        try {
            let notificationMessage = this.$t('notifications.delete_account')
            await this.$store.dispatch('Accounts/deleteAccount', this.pass)
            let { dispatchNotification, setAccount } = this.globalHelper()
            setAccount(null)
            dispatchNotification({
                message: notificationMessage,
                type: 'success',
            })
            if (this.$parent?.close) this.$parent?.close()
        } catch (err: any) {
            console.error(err)
            this.error = err.message
        }
    }
}
</script>
<style scoped lang="scss">
.buttons_container {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}
input {
    width: 100%;
    max-width: 300px;
}
</style>
