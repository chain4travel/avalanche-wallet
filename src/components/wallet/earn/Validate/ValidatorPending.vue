<template>
    <div>
        <Spinner class="pending-validator" style="color: var(--primary-color)"></Spinner>
        <br />
        <p>
            <span class="text-pending-validator" v-if="!startDate">
                {{ $t('validator.pending.validator_pending') }}
            </span>
            <span class="text-pending-validator" v-else>
                {{
                    $t('validator.pending.validator_pending_with_start_date', {
                        startDate: startDateFormatted,
                    })
                }}
            </span>
            <a
                class="link-color"
                @click="redirect()"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
            >
                <fa icon="external-link-alt"></fa>
            </a>
        </p>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import Spinner from '@/components/misc/Spinner.vue'

@Component({
    name: 'validator_pending',
    components: {
        Spinner,
    },
})
export default class ValidatorPending extends Vue {
    @Prop() startDate!: number
    link = 'https://docs.camino.network/to/wallet-validate-pending'

    redirect() {
        window.open(this.link, '_blank')
    }
    get startDateFormatted() {
        return new Date(this.startDate * 1000).toLocaleString()
    }

    refresh() {
        this.$emit('refresh')
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/main';
@use '../../../../styles/abstracts/mixins';

.refresh {
    width: 20px;
    height: 20px;
    .v-icon {
        color: var(--primary-color);
    }

    button {
        outline: none !important;
    }
    img {
        object-fit: contain;
        width: 100%;
    }

    .spinner {
        color: var(--primary-color) !important;
    }
}

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;
}

.pending-validator {
    @include mixins.typography-headline-3;
    position: relative;
    left: 3%;
}

.text-pending-validator {
    color: var(--primary-color);
}

.link-color {
    color: #0085ff;
}
</style>
