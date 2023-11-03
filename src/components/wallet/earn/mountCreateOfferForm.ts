import router from '@/router'
import store from '@/store'
import Vue from 'vue'
import VueMeta from 'vue-meta'

import i18n from '@/plugins/i18n'
import vuetify from '@/plugins/vuetify'
import BootstrapVue from 'bootstrap-vue'
import { Datetime } from 'vue-datetime'
import 'vue-datetime/dist/vue-datetime.css'

import DepositOffer from './DepositOffers.vue'

Vue.use(VueMeta)
Vue.use(BootstrapVue)
Vue.component('datetime', Datetime)
export const mountCreateOfferForm = (el: string, props?: { isSuite: boolean }) => {
    const context = {
        props: props,
    }
    const app = new Vue({
        router,
        store,
        vuetify,
        i18n,
        data: {},
        render: (createElement) => {
            return createElement(DepositOffer, context)
        },
    })
    app.$mount(el)
}
