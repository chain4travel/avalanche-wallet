import { ava, bintools } from '@/AVA'
import { Buffer } from '@c4tplatform/caminojs/dist'
import { createHash } from 'crypto'

export function getMultisigAliasesFromTxId(txId: string) {
    let hrp = ava.getHRP()

    const id = bintools.cb58Decode(txId)

    const aliasId: Buffer = Buffer.from(createHash('ripemd160').update(id).digest())

    const msigAliase = bintools.addressToString(hrp, 'P', aliasId)

    return msigAliase
}
