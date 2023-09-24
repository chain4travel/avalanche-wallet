import { ava, bintools } from '@/AVA'

function isValidPChainAddress(address: string): boolean {
    const hrp = ava.getHRP()

    if (!address.includes(hrp)) return false

    if (address.split('-')[0] !== 'P') return false

    try {
        bintools.stringToAddress(address)
    } catch (e) {
        return false
    }

    return true
}

export { isValidPChainAddress }
