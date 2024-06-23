<template>
    <form class="save">
        <p>You have unsaved keys on your account.</p>
        <Alert v-if="error" class="err" variant="negative">{{ error }}</Alert>
        <CamInput :value="accountName" disabled />
        <CamInput type="password" placeholder="Password" v-model="pass" />
        <CamBtn variant="primary" :disabled="!canSubmit" :onClick="submit">Submit</CamBtn>
    </form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import AccountSettingsModal from '@/components/modals/AccountSettings/AccountSettingsModal.vue'
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
export default class SaveKeys extends Vue {
    @Prop() accountName!: string
    pass = ''
    error = ''

    $parent!: AccountSettingsModal

    get canSubmit() {
        if (this.pass.length < 1) return false
        return true
    }

    submit() {
        this.error = ''
        this.$store
            .dispatch('Accounts/saveKeys', this.pass)
            .then((res) => {
                //@ts-ignore
                let { dispatchNotification } = this.globalHelper()
                dispatchNotification({
                    message: this.$t('notifications.save_keys'),
                    type: 'success',
                })
                this.$parent.close()
            })
            .catch((err) => {
                this.error = err
            })
    }
}
</script>
<style scoped lang="scss">
@use './style';
.save {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;

    > button,
    .err,
    .cam-input {
        width: 100%;
    }

    .err {
        max-width: 100%;
    }
}
p {
    white-space: normal;
}
</style>
