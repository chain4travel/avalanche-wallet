import Vue from 'vue'
import Version from './Version.vue'

export const mountVersionComponent = (el: string) => {
    const app = new Vue({
        render: (createElement) => {
            return createElement(Version)
        },
    })
    app.$mount(el)
}
