<template>
    <div class="validator_card">
        <Spinner v-if="loading" class="spinner-color"></Spinner>

        <div v-if="!loading" class="validator_child_card">
            <br />
            <div class="validator_info">
                <div class="alt_validator_info">
                    <div class="info_div">
                        <v-icon class="icon-mdi-camino">mdi-calendar-blank</v-icon>
                        <div class="infos">
                            <label>{{ $t('validator.info.staking_start_date') }}</label>
                            <span>{{ startTime }}</span>
                        </div>
                    </div>
                    <div class="info_div">
                        <v-icon class="icon-mdi-camino">mdi-calendar-remove</v-icon>
                        <div class="infos">
                            <label>{{ $t('validator.info.staking_end_date') }}</label>
                            <span>{{ endTime }}</span>
                        </div>
                    </div>
                    <div class="info_div">
                        <v-icon class="icon-mdi-camino">mdi-clock-time-three</v-icon>
                        <div class="infos">
                            <label>
                                {{ $t('validator.info.remaining_validation_period') }}
                            </label>
                            <span>{{ reaminingValidation }}</span>
                        </div>
                    </div>
                    <div class="info_div">
                        <v-icon class="icon-mdi-camino">mdi-percent</v-icon>
                        <div class="infos">
                            <label>
                                {{ $t('validator.info.up_time') }}
                            </label>
                            <span v-if="initialized">{{ upTime.toFixed() }} %</span>
                            <Spinner v-else />
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h4 class="input_label">{{ $t('earn.validate.nodeId') }}</h4>
                <span class="disabled_input" role="textbox">
                    {{ nodeId }}
                </span>
            </div>
            <div>
                <h4 class="input_label">{{ $t('validator.info.bonded_amount') }}</h4>
                <AvaxInput
                    v-model="bondedAmount"
                    :max="maxAmt"
                    ref="avax_input_bonded_amount"
                    :readonly="true"
                    class="amt_in"
                ></AvaxInput>
            </div>
            <div>
                <h4 class="input_label">{{ $t('validator.info.tx_id') }}</h4>
                <span class="disabled_input" role="textbox">
                    {{ txID }}
                </span>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Spinner from '@/components/misc/Spinner.vue'
import { ava } from '@/AVA'
import { BN } from '@c4tplatform/caminojs'
import AvaxInput from '@/components/misc/AvaxInput.vue'
import Tooltip from '@/components/misc/Tooltip.vue'
import { ValidatorRaw } from '@/components/misc/ValidatorList/types'
import { AvaNetwork } from '@/js/AvaNetwork'
import axios from 'axios'

@Component({
    name: 'validator_info',
    components: {
        Spinner,
        AvaxInput,
        Tooltip,
    },
})
export default class ValidatorInfo extends Vue {
    @Prop() nodeId!: string
    @Prop() nodeInfo!: ValidatorRaw
    @Prop() startTime!: string
    @Prop() endTime!: string
    @Prop() upTime!: number
    @Prop() reaminingValidation!: string
    @Prop() bondedAmount!: BN
    @Prop() txID!: string
    @Prop() loading!: boolean
    @Prop() nodeVersion!: string
    @Prop() initialized!: boolean

    async mounted() {
        this.$emit('getValidatorInfo')
        this.initializeInputMaxAmount()
    }

    get maxAmt(): BN {
        return ava.getNetwork().P.minStake
    }

    @Watch('bondedAmount')
    bondedAmountWatcher() {
        this.initializeInputMaxAmount()
    }

    initializeInputMaxAmount() {
        this.$nextTick(() => {
            if (this.$refs.avax_input_bonded_amount) {
                // @ts-ignore
                this.$refs.avax_input_bonded_amount.maxOut()
            }
        })
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/main';
@use '../../../../styles/abstracts/mixins';
.validator_card {
    display: grid;
    column-gap: 20px;
}

.validator_child_card {
    gap: 1rem;
    display: flex;
    flex-direction: column;
}

h4 {
    font-weight: normal;
}

.validator_info {
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--tailwind-slate-slate-600);
    background: var(--tailwind-slate-slate-900);
}

.v-icon {
    @include mixins.typography-subtitle-1;
    color: var(--tailwind-slate-slate-200);
    margin-right: var(--spacing-space-base);
}

.info_div {
    width: 100%;
    min-height: 80px;

    display: flex;
    padding: var(--spacing-space-md) var(--spacing-space-base);
    align-items: center;
    gap: var(--spacing-space-base);
    border-right: none;
    border-top: 1px solid var(--tailwind-slate-slate-600);

    &:first-of-type {
        border-top: none;
    }

    .infos {
        display: flex;
        flex-direction: column;
        flex: 1;
        // justify-content: space-between;
        height: 100%;
        gap: 0.5rem;

        label {
            @include mixins.typography-caption;
            font-weight: 400;
            color: var(--tailwind-slate-slate-200);
        }

        span {
            @include mixins.typography-body-2;
            font-weight: 600;
            color: var(--tailwind-slate-white);
        }
    }
}

@media screen and (min-width: 900px) and (max-width: 1000px) {
    .info_div {
        width: 100%;
    }
}

@media screen and (min-width: 750px) and (max-width: 900px),
    screen and (min-width: 1001px) and (max-width: 1550px) {
    .info_div {
        width: 50%;
        border-right: 1px solid var(--tailwind-slate-slate-600);
        border-top: none;

        &:nth-child(3),
        &:nth-child(4) {
            border-top: 1px solid var(--tailwind-slate-slate-600);
        }

        &:nth-child(2),
        &:nth-child(4) {
            border-right: none;
        }
    }
}

@media screen and (min-width: 1551px) {
    .info_div {
        width: 25%;
        border-right: 1px solid var(--tailwind-slate-slate-600);
        border-top: none;

        &:last-of-type {
            border-right: none;
        }
    }
}

.alt_validator_info {
    display: flex;
    flex-wrap: wrap;
}

.disabled_input {
    display: inline-block;
    border-radius: var(--border-radius-sm);
    color: var(--primary-color-light);
    background-color: var(--bg-light);
    padding: 10px 14px;
    white-space: nowrap;
    width: 100%;
}

.disabled_input:focus-visible {
    outline: 0;
}

.input_label {
    margin-bottom: 0.5rem;
}

.amt_in {
    pointer-events: none;
}

@media screen and (max-width: 900px) {
    .disabled_input {
        width: 100%;
    }
}

@media screen and (max-width: 900px) {
    .disabled_input {
        width: 100%;
    }

    .amt_in {
        width: 100%;
    }
}

@media screen and (min-width: 720px) and (max-width: 1440px) {
    .disabled_input {
        width: 100%;
    }

    .amt_in {
        width: 100%;
    }
}

.spinner-color {
    color: var(--primary-color);
}
</style>
