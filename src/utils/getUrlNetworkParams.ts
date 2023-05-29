import { AvaNetwork } from '@/js/AvaNetwork'

export const NETWORK_ALIAS = {
    CAMINO: 'camino',
    COLUMBUS: 'columbus',
    KOPERNIKUS: 'kopernikus',
    CUSTOM: 'custom',
}

export function getNetworkFromUrl() {
    if (window.location.pathname.split('/')[1] === 'explorer') {
        switch (window.location.pathname.split('/')[2]) {
            case NETWORK_ALIAS.CAMINO:
                return NETWORK_ALIAS.CAMINO
            case NETWORK_ALIAS.COLUMBUS:
                return NETWORK_ALIAS.COLUMBUS
            case NETWORK_ALIAS.KOPERNIKUS:
                return NETWORK_ALIAS.KOPERNIKUS
            default:
                return window.location.pathname.split('/')[2]
        }
    }
    return ''
}

export function getCustomNetworks(): AvaNetwork[] {
    try {
        let storageNetwork = localStorage.getItem('networks')

        if (storageNetwork !== null && storageNetwork !== undefined) {
            let customNetworks = JSON.parse(storageNetwork)
            return customNetworks
        } else {
            return []
        }
    } catch (e) {
        return []
    }
}

export function compareCustomNetwork(customNetworks: AvaNetwork[], urlParamNetwork: string) {
    let network = customNetworks.find(
        (net) => net.name.toLowerCase() === urlParamNetwork.toLowerCase()
    )
    return network
}
