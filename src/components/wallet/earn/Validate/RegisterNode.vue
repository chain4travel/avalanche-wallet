<template>
    <div>
        <br />
        <div class="requirements_list">
            <h4>{{ $t('earn.validate.requirements_introduction') }}</h4>
            <div class="requirement_title">
                <fa v-if="isKycVerified" class="success_status_icon" icon="check-circle"></fa>
                <fa v-else class="error_status_icon" icon="times-circle"></fa>
                <h4>
                    {{ $t('earn.validate.warns.kyc_verified') }}
                    <a
                        @click="redirect('kyc-kyb')"
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <fa icon="external-link-alt"></fa>
                    </a>
                </h4>
            </div>
            <div class="requirement_title">
                <fa v-if="isConsortiumMember" class="success_status_icon" icon="check-circle"></fa>
                <fa v-else class="error_status_icon" icon="times-circle"></fa>
                <h4>
                    {{ $t('earn.validate.warns.consortium_member_verified') }}
                    <a
                        @click="redirect('validate-c-member')"
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <fa icon="external-link-alt"></fa>
                    </a>
                </h4>
            </div>
            <div class="requirement_title">
                <fa
                    v-if="hasEnoughLockablePlatformBalance"
                    class="success_status_icon"
                    icon="check-circle"
                ></fa>
                <fa v-else class="error_status_icon" icon="times-circle"></fa>
                <h4>
                    {{
                        $t('earn.validate.warns.camino_available', [
                            cleanAvaxBN(minPlatformUnlocked),
                        ])
                    }}
                    <a
                        @click="redirect('validate-cams')"
                        href="#"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <fa icon="external-link-alt"></fa>
                    </a>
                </h4>
            </div>
            <div class="requirement_title">
                <fa class="info_status_icon" icon="info-circle"></fa>
                <h4>
                    {{ $t('earn.validate.warns.consortium_member_address_linked_to_node') }}
                    <a
                        @click="redirect('validate-reg-node')"
                        href="#"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <fa icon="external-link-alt"></fa>
                    </a>
                </h4>
            </div>
        </div>
        <div
            v-if="isKycVerified && isConsortiumMember && hasEnoughLockablePlatformBalance"
            class="input_section"
        >
            <div>
                <h4 class="input_label">{{ $t('earn.validate.label_3') }}</h4>
                <span class="disabled_input" role="textbox">
                    {{ staticAddress }}
                </span>
            </div>
            <div>
                <h4 class="input_label">{{ $t('earn.validate.label_1') }}</h4>
                <input
                    class="high_input"
                    v-model="nodePrivateKey"
                    style="width: 100%; border-radius: var(--border-radius-sm)"
                    :placeholder="$t('earn.validate.description_1').toString()"
                />
            </div>
            <Alert v-if="!isNodeRegistered" variant="warning">
                {{
                    $t('earn.validate.warns.node_registration_fee', {
                        fee: feeAmt,
                        symbol: nativeAssetSymbol,
                    })
                }}
            </Alert>
            <CamBtn
                @click="registerNode"
                :disabled="
                    !isKycVerified ||
                    !isConsortiumMember ||
                    !hasEnoughLockablePlatformBalance ||
                    !nodePrivateKey ||
                    showMultisigTransactionDisclaimer
                "
                style="margin-left: auto"
            >
                <Spinner
                    v-if="loadingRegisterNode && !showMultisigTransactionDisclaimer"
                    class="spinner"
                ></Spinner>
                <span v-else>
                    {{ $t('earn.validate.register_validator_node') }}
                </span>
            </CamBtn>
        </div>
        <div v-if="showMultisigTransactionDisclaimer" class="input_section mt2">
            <div>
                <h4 class="input_label">
                    {{ $t('earn.validate.label_4', { threshold: thresholdMultiSig - 1 }) }}
                </h4>
                <h4 class="mt2 input_label">{{ $t('earn.validate.label_5') }}</h4>
                <span class="disabled_input" role="textbox">
                    {{ nodeId }}
                </span>
            </div>
            <CamBtn @click="registerNode($event, true)" variant="primary" style="margin-left: auto">
                <Spinner v-if="loadingRegisterNode" class="spinner"></Spinner>
                <span v-else>
                    {{ $t('earn.validate.initiate_transaction') }}
                </span>
            </CamBtn>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { BN } from '@c4tplatform/caminojs/dist'
import { WalletHelper } from '@/helpers/wallet_helper'
import MnemonicWallet from '@/js/wallets/MnemonicWallet'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'
import { ava } from '@/AVA'
import { KeyPair } from '@c4tplatform/caminojs/dist/apis/avm'
import {
    bufferToNodeIDString,
    ONEAVAX,
    privateKeyStringToBuffer,
} from '@c4tplatform/caminojs/dist/utils'
import Big from 'big.js'
import Spinner from '@/components/misc/Spinner.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'
import CamBtn from '@/components/CamBtn.vue'
import Alert from '@/components/Alert.vue'
import AvaAsset from '@/js/AvaAsset'

@Component({
    components: {
        Spinner,
        CamBtn,
        Alert,
    },
})
export default class RegisterNode extends Vue {
    @Prop() isKycVerified!: boolean
    @Prop() isConsortiumMember!: boolean
    @Prop() minPlatformUnlocked!: BN
    @Prop() hasEnoughLockablePlatformBalance!: boolean
    @Prop() isNodeRegistered!: boolean
    @Prop() loadingRefreshRegisterNode!: boolean

    // @ts-ignore
    helpers = this.globalHelper()
    nodePrivateKey = ''
    loadingRegisterNode: boolean = false
    nodeId = ''
    showMultisigTransactionDisclaimer = false

    redirect(type: string) {
        switch (type) {
            case 'kyc-kyb':
                window.open('https://docs.camino.network/to/wallet-validate-kyc-kyb', '_blank')
                break
            case 'validate-c-member':
                window.open('https://docs.camino.network/to/wallet-validate-c-member', '_blank')
                break
            case 'validate-cams':
                window.open('https://docs.camino.network/to/wallet-validate-cams', '_blank')
                break
            case 'validate-reg-node':
                window.open('https://docs.camino.network/to/wallet-validate-reg-node', '_blank')
                break
        }
    }
    cleanAvaxBN(val: BN) {
        let big = Big(val.toString()).div(Big(ONEAVAX.toString()))
        return big.toLocaleString()
    }

    formattedAmount(val: BN): string {
        return `${(Number(val.toString()) / Number(ONEAVAX.toString())).toLocaleString()}`
    }

    get feeAmt(): string {
        return this.formattedAmount(ava.PChain().getTxFee())
    }

    get nativeAssetSymbol(): string {
        return this.ava_asset?.symbol ?? ''
    }

    get ava_asset(): AvaAsset | null {
        return this.$store.getters['Assets/AssetAVA']
    }

    get addresses() {
        let wallet: MnemonicWallet = this.$store.state.activeWallet
        return wallet.getAllAddressesP()
    }

    get wallet() {
        let wallet: SingletonWallet = this.$store.state.activeWallet
        return wallet
    }

    get thresholdMultiSig(): number {
        let wallet: WalletType = this.$store.state.activeWallet
        return (wallet as MultisigWallet)?.keyData?.owner?.threshold
    }

    get staticAddress() {
        return this.wallet.getStaticAddress('P')
    }

    async registerNode(ev: PointerEvent, bypassMultisig = false) {
        this.loadingRegisterNode = true
        try {
            let hrp = ava.getHRP()
            let keypair = new KeyPair(hrp, 'P')
            keypair.importKey(privateKeyStringToBuffer(this.nodePrivateKey.trim()))
            const nodeId = bufferToNodeIDString(keypair.getAddress())
            const nodeAddress = keypair.getAddressString()
            this.nodeId = nodeId

            if (this.wallet?.type === 'multisig' && !bypassMultisig) {
                // Multisig wallet active, show disaclaimer
                this.showMultisigTransactionDisclaimer = true
                return
            }
            const result = await WalletHelper.registerNodeTx(
                this.wallet,
                this.nodePrivateKey.trim(),
                undefined,
                nodeId,
                this.staticAddress,
                nodeAddress
            )
            this.$emit('registered', result ? 'issued' : 'pending')
            this.helpers.dispatchNotification({
                message: result
                    ? this.$t('notifications.register_node_success')
                    : this.$t('notifications.register_node_initiated'),
                type: 'success',
            })
            this.refresh()
        } catch (error) {
            console.error(error)
            this.helpers.dispatchNotification({
                message: this.$t('notifications.register_node_failed'),
                type: 'error',
            })
        } finally {
            this.loadingRegisterNode = false
        }
    }

    refresh() {
        this.$emit('refresh')
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/variables';

.success_status_icon {
    color: var(--success);
}

.info_status_icon {
    color: gray;
}

.error_status_icon {
    color: var(--error);
}

input {
    color: var(--primary-color);
    background-color: var(--bg-light);
    padding: 10px 14px;
}

.disabled_input {
    display: inline-block;
    border-radius: var(--border-radius-sm);
    color: gray;
    background-color: var(--bg-light);
    padding: 10px 14px;
    width: 100%;
}

.disabled_input:focus-visible {
    outline: 0;
}

a {
    color: #0085ff !important;
}

.input_label {
    margin-bottom: 0.5rem;
}

.requirements_list {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.requirement_title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input_section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

input::placeholder {
    white-space: pre-line;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
}

@media only screen and (max-width: variables.$mobile_width) {
    .high_input {
        line-height: 4;
    }
}

.refresh {
    width: 20px;
    height: 20px;

    .v-icon {
        color: var(--primary-color);
    }

    button {
        outline: none !important;
    }

    img {
        object-fit: contain;
        width: 100%;
    }

    .spinner {
        color: var(--primary-color) !important;
    }
}

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;
}

.mt2 {
    margin-top: 1rem;
}
</style>
