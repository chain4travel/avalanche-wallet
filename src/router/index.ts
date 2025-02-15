import Create from '@/views/Create.vue'
import Wallet from '@/views/Wallet.vue'
import Activity from '@/views/wallet/Activity.vue'
import Advanced from '@/views/wallet/Advanced.vue'
import Export from '@/views/wallet/CrossChain.vue'
import Earn from '@/views/wallet/Earn.vue'
import Launch from '@/views/wallet/Launch.vue'
import ManageKeys from '@/views/wallet/ManageKeys.vue'
import WalletHome from '@/views/wallet/Portfolio.vue'
import Studio from '@/views/wallet/Studio.vue'
import Transfer from '@/views/wallet/Transfer.vue'
import Validator from '@/views/wallet/Validator.vue'
import Vue from 'vue'
import VueRouter, { Route } from 'vue-router'
import store from '../store/index'

Vue.use(VueRouter)

const ifNotAuthenticated = (to: Route, from: Route, next: Function) => {
    if (!store.state.isAuth) {
        next()
        return
    }
    next('/login')
}

const ifAuthenticated = (to: Route, from: Route, next: Function) => {
    if (store.state.isAuth) {
        next()
        return
    }
    next('/wallet')
}

const routes = [
    {
        path: '/wallet/create',
        name: 'create',
        component: Create,
        beforeEnter: ifNotAuthenticated,
    },
    {
        path: '/wallet',
        children: [
            {
                path: '/',
                name: 'wallet',
                component: WalletHome,
            },
            {
                path: 'transfer',
                component: Transfer,
            },
            {
                path: 'cross_chain',
                component: Export,
            },
            {
                path: 'keys',
                component: ManageKeys,
            },
            {
                path: 'earn',
                component: Earn,
            },
            {
                path: 'studio',
                component: Studio,
            },
            {
                path: 'advanced',
                component: Advanced,
            },
            {
                path: 'activity',
                component: Activity,
            },
            {
                path: 'launch',
                component: Launch,
            },
            {
                path: 'validator',
                component: Validator,
            },
        ],
        component: Wallet,
        beforeEnter: ifAuthenticated,
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
})

export default router
