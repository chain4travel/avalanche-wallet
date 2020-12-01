// Manages BigNumber and Ava conversion and arithmetic
import BN from 'bn.js'
import Big from 'big.js'

class AvaAsset {
    id: string
    name: string
    symbol: string
    denomination: number
    amount: BN
    amountLocked: BN
    private readonly pow: Big
    constructor(
        id: string,
        name: string,
        symbol: string,
        denomination: number
    ) {
        this.id = id
        this.name = name
        this.symbol = symbol
        this.denomination = denomination
        this.amount = new BN(0, 10)
        this.amountLocked = new BN(0, 10)
        this.pow = Big(10).pow(denomination)
    }

    addBalance(val: BN): void {
        this.amount = this.amount.add(val)
    }

    addBalanceLocked(val: BN): void {
        this.amountLocked = this.amountLocked.add(val)
    }

    resetBalance() {
        this.amount = new BN(0, 10)
        this.amountLocked = new BN(0, 10)
    }

    toString() {
        let big: Big = Big(this.amount.toString(10)).div(this.pow)
        return big.toLocaleString(this.denomination)
        // if(big.lt(Big('0.001'))){
        //     return big.toLocaleString(this.denomination);
        // }else{
        //     let min = Math.min(this.denomination, 2);
        //     return big.toLocaleString(min);
        // }
    }

    getAmount(locked: boolean = false): Big {
        if (!locked) {
            return Big(this.amount.toString(10)).div(this.pow)
        } else {
            return Big(this.amountLocked.toString(10)).div(this.pow)
        }
    }

    getAmountBN(locked: boolean = false): BN {
        if (!locked) {
            return this.amount
        } else {
            return this.amountLocked
        }
    }
}

export default AvaAsset
