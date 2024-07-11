<template>
    <div class="verify-wallet--container" v-if="shouldShowVerification">
        <div class="header">
            <h1>Verify Wallet</h1>
            <p>
                Verifying your wallet comes with many benefits on the Camino Network. Choose the
                most suitable benefits for you below. All information provided is stored and
                verified only by our third-party verification provider Sumsub, for more information
                please visit our user guides about
                <a href="https://docs.camino.network/guides/kyc" target="_blank">KYC</a>
                and
                <a href="https://docs.camino.network/guides/kyb" target="_blank">KYB</a>
                .
            </p>
        </div>

        <div class="content">
            <div v-for="(item, index) in verificationItems" :key="index" class="content-item">
                <div class="content-item-action">
                    <h2>{{ item.title }}</h2>
                    <v-icon v-if="isVerified(item.type) && !isMultisig">mdi-check-decagram</v-icon>
                    <template v-else>
                        <component
                            :is="item.modalComponent"
                            :ref="getModalRefKey(item.type, index)"
                        ></component>
                        <CamBtn
                            variant="primary"
                            :disabled="wallet?.type === 'multisig'"
                            @click="openModal(item.type, index)"
                        >
                            Start
                        </CamBtn>
                    </template>
                </div>
                <h3>{{ item.description }}</h3>

                <ul class="content-item-list">
                    <li v-for="(benefit, idx) in item.benefits" :key="idx">{{ benefit }}</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import CamBtn from '@/components/CamBtn.vue'
import KycModal from '@/components/modals/KycModal.vue'
import KybModal from '@/components/modals/KybModal.vue'
import { MultisigWallet } from '@/js/wallets/MultisigWallet'
import { WalletType } from '@/js/wallets/types'

interface VerificationItem {
    type: 'kyc' | 'kyb'
    title: string
    description: string
    benefits: string[]
    modalComponent: typeof Vue
}

@Component({
    components: { CamBtn, KycModal, KybModal },
})
export default class VerifyWalletSetting extends Vue {
    private verificationItems: VerificationItem[] = [
        {
            type: 'kyc',
            title: 'Individual Verification (KYC)',
            description: 'Includes a liveliness check and personal identity verification.',
            benefits: [
                'Deploy smart contracts on the Camino Network',
                'Interact with applications that require KYC verified wallets',
                'Get the verified status on the official wallet and block explorer (coming soon)',
            ],
            modalComponent: KycModal,
        },
        {
            type: 'kyb',
            title: 'Business Verification (KYB)',
            description:
                'Includes an in-depth verification of the company existence, ownership structure, and official representatives.',
            benefits: [
                'Deploy smart contracts on the Camino Network',
                'Interact with applications that require KYB verified wallets',
                'Get the verified status on the official wallet and block explorer (coming soon)',
            ],
            modalComponent: KybModal,
        },
    ]

    $refs!: Record<string, Vue | Vue[]>

    get isKycVerified(): boolean {
        return this.$store.getters['Accounts/kycStatus']
    }

    get isKybVerified(): boolean {
        return this.$store.getters['Accounts/kybStatus']
    }

    get wallet(): WalletType | null {
        return this.$store.state.activeWallet
    }

    get isMultisig(): boolean {
        return this.wallet instanceof MultisigWallet
    }

    get shouldShowVerification(): boolean {
        return !this.isLedger && !!this.wallet
    }

    get isLedger(): boolean {
        const w = this.wallet
        return !!w && w.type === 'ledger'
    }

    openModal(type: 'kyc' | 'kyb', index: number): void {
        this.$nextTick(() => {
            const modalRef = this.getModalRef(type, index) as KycModal | KybModal | undefined
            if (modalRef) {
                modalRef.open() // Now TypeScript knows 'open' exists on modalRef
            }
        })
    }

    getModalRef(type: 'kyc' | 'kyb', index: number): Vue | undefined {
        const refKey = this.getModalRefKey(type, index)
        const refsArray = this.$refs[refKey] as Vue[] | undefined
        return refsArray ? refsArray[0] : undefined
    }

    getModalRefKey(type: 'kyc' | 'kyb', index: number): string {
        return type === 'kyc' ? `kycModal_${index}` : `kybModal_${index}`
    }

    isVerified(type: 'kyc' | 'kyb'): boolean {
        return type === 'kyc' ? this.isKycVerified : this.isKybVerified
    }
}
</script>

<style scoped lang="scss">
@use '../styles/abstracts/mixins';

.verify-wallet--container {
    height: 100%;
    width: 100%;
    max-width: 1536px;
    margin-top: 6rem;

    h2,
    h3 {
        color: var(--primary-color);
        font-family: Inter;
        font-size: 16px;
        font-style: normal;
        font-weight: 600;
        line-height: 24px;
    }

    h2 {
        font-size: 20px;
        line-height: 32px;
    }

    .header {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 16px 24px;
        padding-left: 0px;
        margin-top: 1rem;

        h1 {
            color: var(--primary-color);
            font-family: Inter;
            font-size: 28px;
            font-style: normal;
            font-weight: 600;
            line-height: 36px;
        }
        p {
            max-width: 50%;
            font-family: Inter;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            text-align: left;
            margin: 0 !important;
        }
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 3rem;
        padding: 16px 24px;
        padding-left: 0px;

        &-item {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            &-action {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            &-list {
                padding-left: 3rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
        }
    }
}
</style>
