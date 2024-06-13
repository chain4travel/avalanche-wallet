<template>
    <div>
        <label>{{ $t('studio.mint.forms.utf8.label1') }}</label>
        <div class="input_cont">
            <CamInput
                :textArea="true"
                maxlength="1024"
                type="text"
                v-model="val"
                @input="onInput"
                class="utf8-form"
            />
            <p class="counter">{{ val.length }} / 1024</p>
        </div>
    </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { UtfFormType } from '@/components/wallet/studio/mint/types'
import CamInput from '@/components/CamInput.vue'

@Component({
    components: {
        CamInput,
    },
})
export default class Utf8Form extends Vue {
    val = ''

    get isValid(): boolean {
        if (this.val.length === 0 || this.val.length > 1024) {
            return false
        }

        return true
    }

    onInput() {
        let msg: null | UtfFormType = null

        if (this.isValid) {
            msg = {
                text: this.val,
            }
        } else {
            msg = null
        }

        this.$emit('onInput', msg)
    }
}
</script>

<style lang="scss">
.utf8-form {
    > textarea {
        height: 180px;
    }
}
</style>

<style scoped lang="scss">
@use '../../../../../styles/abstracts/mixins';

.input_cont {
    width: 100%;
}
.v-btn {
    margin-top: 14px;
}
.counter {
    text-align: right;
    @include mixins.typography-caption;
    color: var(--primary-color-light);
    padding: 2px;
}
</style>
