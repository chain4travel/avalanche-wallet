<template>
    <form class="change_pass_form">
        <CamInput placeholder="Old Password" type="password" v-model="passOld" />
        <CamInput placeholder="New Password" type="password" v-model="pass" />
        <CamInput placeholder="Confirm Password" type="password" v-model="passConfirm" />
        <Alert variant="negative" class="err" v-if="error">{{ error }}</Alert>
        <div class="buttons_container">
            <CamBtn variant="primary" :disabled="!canSubmit" :onClick="submit">Submit</CamBtn>
            <CamBtn variant="negative" :onClick="cancel">Cancel</CamBtn>
        </div>
    </form>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import AccountSettingsModal from '@/components/modals/AccountSettings/AccountSettingsModal.vue'
import { ChangePasswordInput } from '@/store/modules/accounts/types'
import CamBtn from '@/components/CamBtn.vue'
import CamInput from '@/components/CamInput.vue'
import Alert from '@/components/Alert.vue'

@Component({
    components: {
        CamBtn,
        CamInput,
        Alert,
    },
})
export default class ChangePassword extends Vue {
    pass = ''
    passOld = ''
    passConfirm = ''
    error = ''

    $parent!: AccountSettingsModal

    errCheck() {
        if (this.pass.length < 9) {
            return 'Password must be at least 9 characters.'
        }

        if (this.pass != this.passConfirm) {
            return 'Passwords do not match.'
        }

        if (this.pass === this.passOld) {
            return 'Your new password must be different from your previous password.'
        }

        return false
    }

    get canSubmit() {
        if (this.pass.length < 1) return false
        if (this.passConfirm.length < 1) return false
        return true
    }
    cancel() {
        this.$emit('clear')
    }
    async submit() {
        this.error = ''
        let err = this.errCheck()
        if (err) {
            this.error = err
            return
        }

        let input: ChangePasswordInput = {
            passOld: this.passOld,
            passNew: this.pass,
        }

        this.$store
            .dispatch('Accounts/changePassword', input)
            .then(() => {
                let { dispatchNotification } = this.globalHelper()
                dispatchNotification({
                    message: this.$t('notifications.change_password'),
                    type: 'success',
                })
                if (this.$parent?.close) this.$parent?.close()
            })
            .catch((err) => {
                this.error = err
            })
    }
}
</script>
<style scoped lang="scss">
.buttons_container {
    display: flex;
    gap: 8px;
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
