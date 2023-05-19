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
                return NETWORK_ALIAS.CUSTOM
        }
    }
    return ''
}
