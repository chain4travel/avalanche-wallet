import { expect } from 'chai'
import { accessWallet, changeNetwork, addKopernikusNetwork } from '../utils/utils'

describe('access wallet', () => {
    before(() => {
        cy.visit('/')
    })
    it.skip('Wallet access private key ', () => {
        //changeNetwork(cy);
        addKopernikusNetwork(cy)
        accessWallet(cy, 'privateKey')
    })
})
