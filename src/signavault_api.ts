import { Buffer } from '@c4tplatform/caminojs/dist'
import { SignerKeyPair } from '@c4tplatform/caminojs/dist/common'
import {
    Configuration,
    DepositOfferApi,
    ModelMultisigTx,
    ModelMultisigTxOwner,
    MultisigApi,
} from '@c4tplatform/signavaultjs'
import createHash from 'create-hash'
import store from './store/index'

const defaultConfig: Configuration = new Configuration({
    basePath: 'http://127.0.0.1:8081/v1',
})

const defaultVersion = '/v1'

function SignaVault(): MultisigApi {
    let config = defaultConfig
    const activeNetwork = store.state.network

    const versioRegex = /\/v\d+$/
    const signavaultUrl =
        activeNetwork?.signavaultUrl && versioRegex.test(activeNetwork.signavaultUrl)
            ? activeNetwork.signavaultUrl
            : activeNetwork.signavaultUrl + defaultVersion

    if (activeNetwork.signavaultUrl) {
        config = new Configuration({
            basePath: signavaultUrl,
        })
    }
    return new MultisigApi(config)
}

function SignaVaultDepositOfferApi(): DepositOfferApi {
    let config = defaultConfig
    const activeNetwork = store.state.network

    const versioRegex = /\/v\d+$/
    const signavaultUrl =
        activeNetwork?.signavaultUrl && versioRegex.test(activeNetwork.signavaultUrl)
            ? activeNetwork.signavaultUrl
            : activeNetwork.signavaultUrl + defaultVersion

    if (activeNetwork.signavaultUrl) {
        config = new Configuration({
            basePath: signavaultUrl,
        })
    }
    return new DepositOfferApi(config)
}

async function SignaVaultTx(alias: string, signer: SignerKeyPair): Promise<ModelMultisigTx[]> {
    const sv = SignaVault()

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signatureAliasTimestamp = signer
        .sign(
            Buffer.from(
                createHash('sha256')
                    .update(Buffer.from(alias + timestamp))
                    .digest()
            )
        )
        .toString('hex')

    const res = await sv.getAllMultisigTxForAlias(alias, signatureAliasTimestamp, timestamp)
    return res.data
}

export { SignaVault, SignaVaultDepositOfferApi, SignaVaultTx }
export type { ModelMultisigTx, ModelMultisigTxOwner }
