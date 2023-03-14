import { ava, bintools } from '@/AVA'
import { AvaWalletCore, WalletNameType } from './types'
import { WalletCore } from './WalletCore'
import { BN, Buffer } from '@c4tplatform/caminojs/dist'
import { PayloadBase } from '@c4tplatform/caminojs/dist/utils'
import {
    KeyChain,
    Tx as AVMTx,
    UnsignedTx as AVMUnsignedTx,
    UTXO as AVMUTXO,
    UTXOSet as AVMUTXOSet,
} from '@c4tplatform/caminojs/dist/apis/avm'
import {
    Owner,
    Tx as PlatformTx,
    UnsignedTx as PlatformUnsignedTx,
    UTXO as PlatformUTXO,
    UTXOSet as PlatformUTXOSet,
} from '@c4tplatform/caminojs/dist/apis/platformvm'
import {
    MultisigAliasSet,
    OutputOwners,
    SECP256k1KeyPair,
    SignerKeyPair,
    SignerKeyChain,
    SignatureError,
    StandardBaseTx,
    StandardTx,
    StandardUnsignedTx,
} from '@c4tplatform/caminojs/dist/common'

import { Tx as EVMTx, UnsignedTx as EVMUnsignedTx } from '@c4tplatform/caminojs/dist/apis/evm'
import Erc20Token from '@/js/Erc20Token'
import { Transaction } from '@ethereumjs/tx'
import { ITransaction } from '@/components/wallet/transfer/types'
import { buildUnsignedTransaction } from '../TxHelper'

const NotImplementedError = new Error('Not implemented in MultisigWwallet')

interface KeyData {
    alias: Buffer
    memo: string
    owner: Owner
}

type AbstractUnsignedTx = StandardUnsignedTx<
    SignerKeyPair,
    SignerKeyChain,
    StandardBaseTx<SignerKeyPair, SignerKeyChain>
>

type AbstractTx = StandardTx<SignerKeyPair, SignerKeyChain, AbstractUnsignedTx>

class MultisigWallet extends WalletCore implements AvaWalletCore {
    type: WalletNameType = 'multisig'
    chainId = ava.XChain().getBlockchainAlias()
    pchainId = ava.PChain().getBlockchainAlias()
    ethAddress = ''
    ethBalance = new BN(0)

    keyData: KeyData
    wallets: WalletCore[] = []
    unlinkedOwners: string[] = []

    constructor(alias?: Buffer, memo?: string, owner?: Owner) {
        super()
        this.name = 'Multisig Wallet'
        this.keyData = {
            alias: alias ?? Buffer.alloc(0),
            memo: memo ?? '',
            owner: owner ?? ({ addresses: [], threshold: 0, locktime: '0' } as Owner),
        }
        this.ethAddress = this.keyData.alias.toString('hex')
        this.isInit = true
    }

    getKey(): string {
        return JSON.stringify(this.keyData)
    }

    setKey(key: string): void {
        this.keyData = JSON.parse(key)
        // The JSON buffer is not our "AvalancheBuffer"
        this.keyData.alias = Buffer.from(this.keyData.alias)
        this.ethAddress = this.keyData.alias.toString('hex')
    }

    outputOwners(): OutputOwners {
        return new OutputOwners(
            this.keyData.owner.addresses.map((a) => bintools.parseAddress(a, '')),
            new BN(this.keyData.owner.locktime),
            this.keyData.owner.threshold
        )
    }

    alias(): Buffer {
        return this.keyData.alias
    }

    updateWallets(wallets: WalletCore[]) {
        this.wallets = []
        this.unlinkedOwners = []
        const lookup = new Set()
        for (const wallet of wallets) {
            const staticKey = wallet.getStaticAddress('P')
            if (this.keyData.owner.addresses.includes(staticKey)) {
                this.wallets.push(wallet)
                lookup.add(staticKey)
            }
        }
        for (const key of this.keyData.owner.addresses) {
            if (!lookup.has(key)) this.unlinkedOwners.push(key)
        }
    }

    onnetworkchange(): void {
        this.chainId = ava.XChain().getBlockchainAlias()
        this.pchainId = ava.PChain().getBlockchainAlias()
    }

    async updateUTXOsX(): Promise<AVMUTXOSet> {
        const response = await ava.XChain().getUTXOs([this._aliasAddress(this.chainId)])
        this.utxoset = response.utxos
        return this.utxoset
    }

    async updateUTXOsP(): Promise<PlatformUTXOSet> {
        const response = await ava.PChain().getUTXOs([this._aliasAddress(this.pchainId)])
        this.platformUtxoset = response.utxos
        return this.platformUtxoset
    }

    async getUTXOs(): Promise<void> {
        this.isFetchUtxos = true

        await this.updateUTXOsX()
        await this.updateUTXOsP()

        await this.getStake()
        await this.getEthBalance()

        this.isFetchUtxos = false

        return
    }

    async getStake(): Promise<BN> {
        return this.stakeAmount
    }

    getPlatformUTXOSet(): PlatformUTXOSet {
        return this.platformUtxoset
    }

    async createNftFamily(name: string, symbol: string, groupNum: number): Promise<string> {
        throw NotImplementedError
    }

    async mintNft(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number): Promise<string> {
        throw NotImplementedError
    }

    async getEthBalance(): Promise<BN> {
        return new BN(0)
    }

    async sendEth(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string> {
        throw NotImplementedError
    }

    async sendERC20(
        to: string,
        amount: BN,
        gasPrice: BN,
        gasLimit: number,
        token: Erc20Token
    ): Promise<string> {
        throw NotImplementedError
    }

    async estimateGas(to: string, amount: BN, token: Erc20Token): Promise<number> {
        throw NotImplementedError
    }

    async signX(unsignedTx: AVMUnsignedTx): Promise<AVMTx> {
        throw NotImplementedError
    }

    async signP(unsignedTx: PlatformUnsignedTx): Promise<PlatformTx> {
        return this._sign(unsignedTx) as PlatformTx
    }

    async signC(unsignedTx: EVMUnsignedTx): Promise<EVMTx> {
        throw NotImplementedError
    }

    async signEvm(tx: Transaction): Promise<Transaction> {
        throw NotImplementedError
    }

    async validate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        delegationFee: number,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        throw NotImplementedError
    }

    async delegate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        throw NotImplementedError
    }

    async issueBatchTx(
        orders: (AVMUTXO | ITransaction)[],
        addr: string,
        memo?: Buffer
    ): Promise<string> {
        throw NotImplementedError
    }

    async buildUnsignedTransaction(
        orders: (ITransaction | AVMUTXO)[],
        addr: string,
        memo?: Buffer
    ) {
        const changeAddress = this.getChangeAddressAvm()
        const derivedAddresses = this.getDerivedAddresses()
        const utxoset = this.getUTXOSet() as AVMUTXOSet

        return buildUnsignedTransaction(
            orders,
            addr,
            derivedAddresses,
            utxoset,
            changeAddress,
            memo
        )
    }

    async signMessage(msg: string, address: string): Promise<string> {
        throw NotImplementedError
    }

    getCurrentAddressAvm(): string {
        return this._aliasAddress(this.chainId)
    }

    getCurrentAddressPlatform(): string {
        return this._aliasAddress(this.pchainId)
    }

    getStaticKeyPair(): SECP256k1KeyPair | undefined {
        return undefined
    }

    getDerivedAddresses(): string[] {
        return this.getAllAddressesX()
    }

    getDerivedAddressesP(): string[] {
        return this.getAllAddressesP()
    }

    getAllDerivedExternalAddresses(): string[] {
        return []
    }

    getAllAddressesX(): string[] {
        return [this._aliasAddress(this.chainId)]
    }
    getAllAddressesP(): string[] {
        return [this._aliasAddress(this.pchainId)]
    }

    getChangeAddressAvm(): string {
        return this.getCurrentAddressAvm()
    }

    getChangeAddressPlatform(): string {
        return this.getCurrentAddressPlatform()
    }

    getHistoryAddresses(): string[] {
        return this.getAllAddressesX()
    }

    getPlatformRewardAddress(): string {
        return this.getCurrentAddressPlatform()
    }

    getBaseAddress(): string {
        return this.getCurrentAddressAvm()
    }

    getEvmAddress(): string {
        return this.ethAddress
    }

    getEvmAddressBech(): string {
        return ''
    }

    getFirstAvailableAddressPlatform(): string {
        return this.getCurrentAddressPlatform()
    }

    /******************** INTERNAL *******************************/

    _aliasAddress(chainID: string) {
        const hrp = ava.getHRP()
        return bintools.addressToString(hrp, chainID, this.keyData.alias)
    }

    _sign(utx: AbstractUnsignedTx): AbstractTx {
        // create a keychain from the wallets
        const kc = new KeyChain('', '')
        this.wallets.forEach((w) => {
            const key = w.getStaticKeyPair()
            if (key) kc.addKey(key)
        })

        // Check if we are able to send this TX directly
        const resolver = new MultisigAliasSet(
            new Map([[this.keyData.alias.toString('hex'), this.outputOwners()]]),
            new Set(kc.getAddresses().map((a) => a.toString('hex')))
        )
        resolver.dryRun(true)
        try {
            utx.getTransaction().resolveMultisigIndices(resolver)
            // If the resolving step succeeds, we can fire the TX
            resolver.dryRun(false)
            // resolve all sigIdxs so they are ready to sign
            utx.getTransaction().resolveMultisigIndices(resolver)
            // sign the TX and return it for issueing
            return utx.sign(kc)
        } catch (e: any) {
            if (!(e instanceof SignatureError)) throw e
        }
        // Resolver we not get all signatures -> signaVault

        // Force resolver to create wildcard sigIdx by removing addresses
        resolver.clearAddresses()
        // Switch off dry run to let resolver create wildcard sig indices
        resolver.dryRun(false)
        // resolve all sigIdxs so they are ready to sign
        utx.getTransaction().resolveMultisigIndices(resolver)
        //TODO:
        // - Collect everything required for signaVault
        // - Send the Tx to signavault
        // - Trigger refresh of multisigTx List

        // Throw to supress issueTx
        throw new SignatureError('Transaction added into signavault')
    }
}

export { MultisigWallet }
