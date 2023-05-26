<template>
    <div>
        <div class="requirements_list">
            <h4>{{ $t('earn.validate.requirements_introduction') }}</h4>
            <div class="requirement_title">
                <fa v-if="isKycVerified" class="success_status_icon" icon="check-circle"></fa>
                <fa v-else class="error_status_icon" icon="times-circle"></fa>
                <h4>
                    {{ $t('earn.validate.warns.kyc_verified') }}
                    <a
                        href="https://docs.camino.network/to/wallet-validate-kyc-kyb"
                        target="_blank"
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
                        href="https://docs.camino.network/to/wallet-validate-c-member"
                        target="_blank"
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
                    <a href="https://docs.camino.network/to/wallet-validate-cams" target="_blank">
                        <fa icon="external-link-alt"></fa>
                    </a>
                </h4>
            </div>
            <div class="requirement_title">
                <fa class="error_status_icon" icon="times-circle"></fa>
                <h4>
                    {{ $t('earn.validate.warns.consortium_member_address_linked_to_node') }}
                    <a
                        href="https://docs.camino.network/to/wallet-validate-reg-node"
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
            <v-btn
                @click="registerNode"
                class="button_secondary"
                depressed
                :disabled="
                    !isKycVerified ||
                    !isConsortiumMember ||
                    !hasEnoughLockablePlatformBalance ||
                    !nodePrivateKey
                "
                block
            >
                {{ $t('earn.validate.register_validator_node') }}
            </v-btn>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

import { ava } from '@/AVA'
import { cleanAvaxBN } from '@/helpers/helper'
import { WalletHelper } from '@/helpers/wallet_helper'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'

import { BN } from '@c4tplatform/caminojs/dist'
import { KeyPair } from '@c4tplatform/caminojs/dist/apis/avm'
import { bufferToNodeIDString, privateKeyStringToBuffer } from '@c4tplatform/caminojs/dist/utils'
import { SignatureError } from '@c4tplatform/caminojs/dist/common'

@Component
export default class RegisterNode extends Vue {
    @Prop() isKycVerified!: boolean
    @Prop() isConsortiumMember!: boolean
    @Prop() minPlatformUnlocked!: BN
    @Prop() hasEnoughLockablePlatformBalance!: boolean

    nodePrivateKey = ''

    cleanAvaxBN(val: BN) {
        return cleanAvaxBN(val)
    }

    get wallet() {
        let wallet: SingletonWallet = this.$store.state.activeWallet
        return wallet
    }

    get staticAddress() {
        return this.wallet.getStaticAddress('P')
    }

    async registerNode() {
        try {
            let hrp = ava.getHRP()
            let keypair = new KeyPair(hrp, 'P')
            keypair.importKey(privateKeyStringToBuffer(this.nodePrivateKey.trim()))
            let nodeId = bufferToNodeIDString(keypair.getAddress())
            console.log(nodeId)
            const result = await WalletHelper.registerNodeTx(
                this.wallet,
                this.nodePrivateKey.trim(),
                undefined,
                nodeId,
                this.staticAddress
            )
            console.log(result)
            this.$emit('registered', nodeId)
            this.$store.dispatch('updateTransaction', {
                msgType: 'success',
                msgTitle: 'Transaction',
                msgText: 'Register Node Successful.',
            })
        } catch (error) {
            if (error instanceof SignatureError) {
                this.$store.dispatch('updateTransaction', {
                    onlyMultisig: true,
                    msgType: 'success',
                    msgTitle: 'Multisignature',
                    msgText: 'Transaction Recorded.',
                })
            } else {
                console.error(error)
                this.$store.dispatch('Notifications/add', {
                    type: 'error',
                    title: 'Registering Node Failed',
                    message: error,
                })
                return
            }
        }
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/variables';

.success_status_icon {
    color: var(--success);
}

.error_status_icon {
    color: var(--error);
}

input {
    color: var(--primary-color);
    background-color: var(--bg-light);
    padding: 6px 14px;
}

.disabled_input {
    display: inline-block;
    border-radius: var(--border-radius-sm);
    color: gray;
    background-color: var(--bg-light);
    padding: 6px 14px;
}

.disabled_input:focus-visible {
    outline: 0;
}

a {
    color: #0085ff !important;
}

h4 {
    font-weight: normal;
}

.input_label {
    margin-bottom: 0.5rem;
}

.requirements_list {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
</style>
