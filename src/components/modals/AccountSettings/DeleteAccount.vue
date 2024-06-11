<template>
    <form>
        <CamInput type="password" v-model="pass" placeholder="Password" />
        <Alert variant="negative" class="err" v-if="error">{{ error }}</Alert>
        <div class="buttons_container">
            <CamBtn variant="primary" :disabled="!canSubmit" :onClick="submit">Delete</CamBtn>
            <CamBtn :onClick="cancel" variant="negative">Cancel</CamBtn>
        </div>
    </form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import AccountSettingsModal from '@/components/modals/AccountSettings/AccountSettingsModal.vue'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'
import CamInput from '@/components/CamInput.vue'

@Component({
    components: {
        CamBtn,
        Alert,
        CamInput,
    },
})
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
    margin-top: 16px;

    > button {
        width: 100%;
    }
}

form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;

    > input,
    .buttons_container {
        width: 100%;
    }
}
</style>
