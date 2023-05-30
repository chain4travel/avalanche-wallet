<template>
    <modal ref="modal" :title="title">
        <div class="abort-modal">
            <div>
                <h3 v-if="subTitle">{{ subTitle }}</h3>
                <br v-if="subTitle" />
                <p class="text-modal error" v-if="error">{{ modalText }}</p>
                <p class="text-modal warning" v-else-if="warning">{{ modalText }}</p>
                <p class="text-modal text" v-else>{{ modalText }}</p>
            </div>
            <div class="modal-buttons">
                <v-btn depressed class="button_primary" @click="close()">
                    {{ $t('earn.rewards.abort_modal.cancel') }}
                </v-btn>
                <v-btn depressed class="button_secondary" @click="abort()">
                    {{ $t('earn.rewards.abort_modal.abort') }}
                </v-btn>
            </div>
        </div>
    </modal>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '../../modals/Modal.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'

@Component({
    components: {
        Modal,
    },
})
export default class ModalAbortSigning extends Vue {
    @Prop() title!: string
    @Prop() subTitle!: string
    @Prop() modalText!: string
    @Prop() error!: boolean
    @Prop() warning!: boolean
    // @ts-ignore
    helpers = this.globalHelper()

    $refs!: {
        modal: Modal
    }

    get activeWallet(): MultisigWallet {
        return this.$store.state.activeWallet
    }

    close() {
        this.$refs.modal.close()
    }

    open() {
        this.$refs.modal.open()
    }

    async abort() {
        this.$emit('cancelTx')
        this.$refs.modal.close()
    }
}
</script>
<style scoped lang="scss">
.abort-modal {
    padding: 30px 22px;
    text-align: center;
    width: 600px;
    overflow-x: hidden;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    gap: 10px;
}

.error {
    color: var(--error);
}

.warning {
    color: var(--warning);
}

.text {
    font-size: 16px;
}

@media screen and (max-width: 720px) {
    .abort-modal {
        width: 350px;
    }
}
@media screen and (min-width: 720px) and (max-width: 1440px) {
    .abort-modal {
        width: 475px;
    }
}
</style>
