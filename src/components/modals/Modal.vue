<template>
    <transition name="fade">
        <div class="modal_main" v-if="isActive">
            <div class="modal_bg" @click="bgclick" :icy="icy"></div>
            <div class="modal_container">
                <div class="modal_body">
                    <div class="modal_topbar">
                        <div class="modal_title">
                            <h4>{{ title }}</h4>
                            <p v-if="subtitle" class="modal_subtitle">{{ subtitle }}</p>
                        </div>
                        <button class="modalClose" @click="close" v-if="can_close">
                            <fa icon="times"></fa>
                        </button>
                    </div>
                    <slot></slot>
                </div>
            </div>
        </div>
    </transition>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Modal extends Vue {
    @Prop({ default: 'Modal Title' }) title!: string
    @Prop({ default: '' }) subtitle!: string
    @Prop({ default: true }) can_close!: boolean
    @Prop({ default: false }) icy!: boolean

    isActive: boolean = false

    public open() {
        this.isActive = true
    }

    bgclick() {
        if (this.can_close) {
            this.close()
        }
    }

    public close() {
        this.$emit('beforeClose')
        this.isActive = false
    }
}
</script>
<style scoped lang="scss">
@use '../../styles/abstracts/mixins';

.modal_topbar {
    background-color: var(--bg);
    border-bottom: var(--bg);
    color: var(--primary-color);
    border-bottom: 2px solid var(--bg-light);
    position: relative;
    margin: 0px 8px;
    padding: 10px 12px;
    display: flex;
}

.modal_title {
    font-size: 22px;
    text-align: left;
    flex-grow: 1;
    margin: 0;
    font-weight: lighter;
}

.modal_subtitle {
    font-size: 14px;
}

.modalClose {
    font-size: 22px;
    font-weight: lighter;
    opacity: 0.5;
    &:hover {
        opacity: 1;
    }
}

.modal_main {
    z-index: 3;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    display: flex;
    overflow-y: hidden;
}
.modal_bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    vertical-align: center;
    align-items: center;

    &[icy] {
        backdrop-filter: blur(4px);
    }
}

.modal_body {
    width: max-content;
    max-width: 90%;
    min-height: 30px;
    background-color: var(--bg);
    margin: auto;
    z-index: 2;
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
    border-radius: var(--border-radius-lg);
    border: var(--primary-border-2);
    overflow: hidden;
    max-height: 90%;
}

@include mixins.mobile-device {
    .modal_body {
        position: absolute;
        width: max-content;
        margin: 0;
        padding-bottom: 20px;
        max-width: 100%;
        border-radius: var(--border-radius-lg);
    }
}
</style>
