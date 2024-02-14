import axios, { AxiosInstance } from 'axios'
import sha3 from 'js-sha3'
import { ava } from './AVA'
import { KYC_VARIANT } from './constants'
let elliptic = require('elliptic')
let ec = new elliptic.ec('secp256k1')
export interface AccessToken {
    access_token: string
}
interface GetNonceType {
    nonce: string
}

type variantType = {
    kycStatus: boolean
    kybStatus: boolean
}

const BASE_URL = 'https://api.kyc.camino.network/v3'

const kyc_api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    },
})

async function getNonce(): Promise<GetNonceType> {
    let res = await kyc_api.get('/nonce')
    return res.data
}

export function getPublicKey(privateKey: string): string | null {
    let keyPair = ec.keyFromPrivate(privateKey)
    let pubKey = keyPair.getPublic()
    return pubKey.encode('hex', false)
}

async function generateToken(privateKey: string, kyc_variant: KYC_VARIANT): Promise<AccessToken> {
    let keyPair = ec.keyFromPrivate(privateKey)
    let privKey = keyPair.getPrivate('hex')
    let pubKey = keyPair.getPublic()
    let { nonce } = await getNonce()
    let msgHash = sha3.keccak256(Buffer.from(nonce, 'hex'))
    let signature = ec.sign(msgHash, privKey, 'hex', { canonical: true })
    try {
        let req = {
            nonce: nonce,
            signature: Buffer.concat([
                signature.r.toArrayLike(Buffer, 'be', 32),
                signature.s.toArrayLike(Buffer, 'be', 32),
                Buffer.from([signature.recoveryParam]),
            ]).toString('hex'),
            public_key: pubKey.encode('hex', false),
            requested_kyc_variant: kyc_variant,
        }
        let res = await kyc_api.post('/accessToken', req)
        return res.data
    } catch (e) {
        throw e
    }
}

async function checkVerificationStatus(privateKey: string): Promise<variantType> {
    let keyPair = ec.keyFromPrivate(privateKey)
    let pubKey = keyPair.getPublic()
    let url = `/verified/${ava.getHRP()}/${pubKey.encode('hex', false)}`
    try {
        let res = await kyc_api.get(url)
        let kycStatus: boolean = res.data.variants[KYC_VARIANT.KYC_BASIC]
        let kybStatus: boolean = res.data.variants[KYC_VARIANT.KYB_BASIC]
        return { kycStatus, kybStatus }
    } catch (e) {
        throw e
    }
}

export { checkVerificationStatus, generateToken, kyc_api }
