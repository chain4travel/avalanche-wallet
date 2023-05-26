import AvaAsset from '@/js/AvaAsset'

import { BN } from '@c4tplatform/caminojs/dist'

export interface ITransaction {
    uuid: string
    asset: AvaAsset
    amount: BN
}

export interface INftTransaction {}

export interface ICurrencyInputDropdownValue {
    asset: AvaAsset | null
    amount: BN
}

export interface BulkOrder {
    address: string
    amount: BN
}
