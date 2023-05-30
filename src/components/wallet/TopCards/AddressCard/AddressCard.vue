<template>
    <div class="addr_card">
        <q-r-modal ref="qr_modal" :address="activeAddress"></q-r-modal>
        <paper-wallet
            ref="print_modal"
            v-if="walletType === 'mnemonic'"
            :wallet="activeWallet"
        ></paper-wallet>
        <p class="addr_info">{{ addressMsg }}</p>
        <div class="bottom">
            <div class="bottom_rest">
                <p class="subtitle">{{ addressLabel }}</p>
                <ellipsis
                    title="Address"
                    :prefixPos="prefixPos"
                    :text="activeAddress"
                    class="addr_text"
                    data-cy="wallet_address"
                />
                <div class="buts">
                    <button :tooltip="$t('top.hover1')" @click="viewQRModal" class="qr_but">
                        <v-icon>mdi-qrcode</v-icon>
                    </button>
                    <button
                        v-if="walletType === 'mnemonic'"
                        :tooltip="$t('top.hover2')"
                        @click="viewPrintModal"
                        class="print_but"
                    >
                        <v-icon>mdi-water-outline</v-icon>
                    </button>
                    <button
                        v-if="walletType === 'ledger'"
                        :tooltip="$t('create.verify')"
                        @click="verifyLedgerAddress"
                        class="ledger_but"
                    >
                        <v-icon>mdi-usb-flash-drive-outline</v-icon>
                    </button>
                    <CopyText
                        :tooltip="$t('top.hover3')"
                        :value="activeAddress"
                        class="copy_but"
                    ></CopyText>
                </div>
            </div>
        </div>
        <div class="bottom_tabs">
            <ChainSelect v-model="chainNow"></ChainSelect>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component } from 'vue-property-decorator'

import CopyText from '@/components/misc/CopyText.vue'
import QRModal from '@/components/modals/QRModal.vue'
import PaperWallet from '@/components/modals/PaperWallet/PaperWallet.vue'
import { WalletType, WalletNameType } from '@/js/wallets/types'
import Ellipsis from '@/components/misc/Ellipsis.vue'

import MnemonicWallet, {
    AVA_ACCOUNT_PATH,
    LEDGER_ETH_ACCOUNT_PATH,
} from '@/js/wallets/MnemonicWallet'
import { LedgerWallet } from '@/js/wallets/LedgerWallet'

import ChainSelect from '@/components/wallet/TopCards/AddressCard/ChainSelect.vue'
import { ChainIdType } from '@/constants'
import { ava } from '@/AVA'
import { SingletonWallet } from '@/js/wallets/SingletonWallet'

@Component({
    components: {
        CopyText,
        Ellipsis,
        PaperWallet,
        QRModal,
        ChainSelect,
    },
})
export default class AddressCard extends Vue {
    chainNow: ChainIdType = 'X'

    $refs!: {
        qr_modal: QRModal
        print_modal: PaperWallet
        qr: HTMLCanvasElement
    }

    get addressLabel(): string {
        switch (this.chainNow) {
            default:
                return this.$t('top.address.title_x') as string
            case 'P':
                return this.$t('top.address.title_p') as string
            case 'C':
                return this.$t('top.address.title_c') as string
        }
    }

    get addressMsg(): string {
        switch (this.chainNow) {
            default:
                return this.getAddressMsgX()
            case 'P':
                return this.$t('top.address.desc_p') as string
            case 'C':
                return this.$t('top.address.desc_c') as string
        }
    }

    getAddressMsgX() {
        return this.$t('top.address.desc_x') as string
    }

    get prefixPos(): number {
        if (this.chainNow === 'C') return 0
        return ava.getHRP().length + 3
    }

    get walletType(): WalletNameType {
        let wallet = this.activeWallet
        if (
            !wallet ||
            (wallet.type === 'singleton' && (wallet as SingletonWallet).getMnemonic() !== '')
        )
            return 'mnemonic'
        return wallet.type
    }

    get activeWallet(): WalletType | null {
        return this.$store.state.activeWallet
    }
    get address() {
        let wallet = this.activeWallet
        if (!wallet) {
            return '-'
        }
        return wallet.getCurrentAddressAvm()
    }

    get addressPVM() {
        let wallet = this.activeWallet
        if (!wallet) {
            return '-'
        }

        return wallet.getCurrentAddressPlatform()
    }

    get addressEVM() {
        let wallet = this.activeWallet
        if (!wallet) {
            return '-'
        }

        return '0x' + wallet.getEvmAddress()
    }

    get activeAddress(): string {
        switch (this.chainNow) {
            case 'X':
                return this.address
            case 'P':
                return this.addressPVM
            case 'C':
                return this.addressEVM
        }
        return this.address
    }

    get activeIdx(): number {
        const wallet = this.activeWallet as MnemonicWallet
        const walletType = wallet.type

        if (walletType === 'singleton') return 0

        switch (this.chainNow) {
            case 'X':
                return wallet.getExternalActiveIndex()
            case 'P':
                return wallet.getPlatformActiveIndex()
            default:
                return 0
        }
    }

    viewQRModal() {
        // @ts-ignore
        this.$refs.qr_modal.open()
    }
    viewPrintModal() {
        let modal = this.$refs.print_modal
        // @ts-ignore
        modal.open()
    }

    async verifyLedgerAddress() {
        const wallet = this.activeWallet as LedgerWallet

        let hrp = ava.getHRP()

        switch (this.chainNow) {
            case 'X':
            case 'P':
                wallet.app.getWalletAddress(`${AVA_ACCOUNT_PATH}/0/${this.activeIdx}`, hrp)
                break
            case 'C':
                wallet.ethApp.getAddress(`${LEDGER_ETH_ACCOUNT_PATH}`)
        }
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/abstracts/variables';
@use '../../../../styles/abstracts/mixins';

.addr_card {
    display: flex;
    flex-direction: column;
    padding: 0 !important;
}
.buts {
    width: 100%;
    display: flex;
    align-items: center;
    color: var(--secondary-color);
    justify-content: flex-end;

    > * {
        font-size: 16px;
        margin-left: 14px;
        position: relative;
        outline: none;
        opacity: 0.6;

        background-size: contain;
        background-position: center;
        &:hover {
            opacity: 1;
        }
    }
    .v-icon {
        color: var(--primary-color);
        width: 18px;
        height: 18px;
        font-size: 22px;
    }
}

.copy_but {
    color: var(--primary-color);
}

.col_qr {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.addr_info {
    margin: 19px !important;
    margin-bottom: 0 !important;
    background-color: var(--bg-light);
    font-size: 13px;
    font-weight: bold;
    text-align: center;
    padding: 12px 16px;
    border-radius: var(--border-radius-sm);
}

.bottom {
    display: flex;
    padding-right: 18px;
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 8px;
    flex-grow: 1;

    .bottom_rest {
        padding-top: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
}

.subtitle {
    font-size: 0.7rem;
    color: var(--primary-color-light);
}

.addr_text {
    font-size: 15px;
    color: var(--primary-color);
    min-height: 36px;
}
</style>
