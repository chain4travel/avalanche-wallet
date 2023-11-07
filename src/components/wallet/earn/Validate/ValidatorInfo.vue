<template>
    <div class="validator_card">
        <Spinner v-if="loading" class="spinner-color"></Spinner>

        <div v-if="!loading" class="validator_child_card">
            <div class="refresh_div">
                <div class="refresh">
                    <Spinner v-if="loading" class="spinner"></Spinner>
                    <button v-else @click="refresh">
                        <v-icon>mdi-refresh</v-icon>
                    </button>
                </div>
            </div>
            <div class="validator_info">
                <div class="alt_validator_info">
                    <div class="space-div"></div>
                    <div>
                        <Tooltip
                            style="display: inline-block"
                            :text="$t('validator.info.staking_start_date')"
                        >
                            <v-icon class="icon-mdi-camino">mdi-calendar-blank</v-icon>
                            <label>{{ startTime }}</label>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip
                            style="display: inline-block"
                            :text="$t('validator.info.staking_end_date')"
                        >
                            <v-icon class="icon-mdi-camino">mdi-calendar-remove-outline</v-icon>
                            <label>{{ endTime }}</label>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip style="display: inline-block" :text="$t('validator.info.up_time')">
                            <v-icon class="icon-mdi-camino">mdi-arrow-up-bold</v-icon>
                            <label v-if="initialized">{{ upTime.toFixed() }} %</label>
                            <Spinner v-else />
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip
                            style="display: inline-block"
                            :text="$t('validator.info.remaining_validation_period')"
                        >
                            <v-icon class="icon-mdi-camino">mdi-clock-time-five-outline</v-icon>
                            <label>{{ reaminingValidation }}</label>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <br />
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
import moment from 'moment'
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

    startTime: string = ''
    endTime: string = ''
    upTime: number = 0
    reaminingValidation: string = ''
    bondedAmount: BN = new BN(0)
    txID: string = ''

    loading: boolean = true
    nodeVersion: string = ''
    initialized: boolean = false

    mounted() {
        this.getInformationValidator()

        this.$nextTick(() => {
            //@ts-ignore
            this.$refs.avax_input_bonded_amount.maxOut()
        })
    }

    get maxAmt(): BN {
        return ava.getNetwork().P.minStake
    }

    get activeNetwork(): null | AvaNetwork {
        return this.$store?.state?.Network?.selectedNetwork
    }

    async fetchNodeVersion() {
        if (this.activeNetwork && this.activeNetwork.url) {
            await axios
                .post(this.activeNetwork.url + '/ext/info', {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'info.getNodeVersion',
                })
                .then((res) => {
                    const data = res.data
                    if (data && data.result && data.result.gitVersion) {
                        this.nodeVersion = data.result.gitVersion.slice(1) // remove v
                    }
                })
                .finally(() => {
                    this.initialized = true
                })
        }
    }

    checkNodeVersionFlag(targetVersion: string): boolean {
        if (!this.initialized) {
            throw new Error('Provider not initialized yet')
        }

        if (!this.nodeVersion) {
            throw new Error('Node version not exists, function uncallable')
        }

        const versionRegex = /^\d+\.\d+\.\d+(-rc\d+)?$/
        if (!versionRegex.test(targetVersion)) {
            throw new Error(
                `Invalid version format: ${targetVersion}. Correct version is of type major.minor.path e.g 1.2.3-rc2`
            )
        }

        const [coreTargetVersion, targetVariant] = targetVersion.split('-')
        const [coreNodeVersion, nodeVariant] = this.nodeVersion.split('-')

        const [targetMajor, targetMinor, targetPatch] = coreTargetVersion.split('.').map(Number)
        const [nodeMajor, nodeMinor, nodePatch] = coreNodeVersion.split('.').map(Number)

        if (targetMajor !== nodeMajor) {
            return targetMajor < nodeMajor
        }

        if (targetMinor !== nodeMinor) {
            return targetMinor < nodeMinor
        }

        if (targetPatch !== nodePatch) {
            return targetPatch < nodePatch
        }

        if (nodeVariant) {
            return targetVariant <= nodeVariant
        }

        return true
    }

    formatUptime(uptime: string): number {
        const versionFlag = this.checkNodeVersionFlag('0.4.10-rc3')
        const value = versionFlag
            ? Math.round(parseFloat(uptime))
            : Math.round(parseFloat(uptime) * 100)

        return value
    }

    async getInformationValidator() {
        try {
            await this.fetchNodeVersion()
            this.loading = true
            let today = moment()

            this.startTime = moment(new Date(parseInt(this.nodeInfo.startTime) * 1000)).format(
                'MMMM Do YYYY, h:mm:ss a'
            )
            this.endTime = moment(new Date(parseInt(this.nodeInfo.endTime) * 1000)).format(
                'MMMM Do YYYY, h:mm:ss a'
            )
            this.upTime = this.formatUptime(this.nodeInfo.uptime)

            var reaminingValidationDuration = moment.duration(
                moment(new Date(parseInt(this.nodeInfo.endTime) * 1000)).diff(today)
            )

            let dataReaminingValdiationDuration = {
                years: reaminingValidationDuration.years(),
                months: reaminingValidationDuration.months(),
                days: reaminingValidationDuration.days().toString(),
                hours:
                    reaminingValidationDuration.hours() > 9
                        ? reaminingValidationDuration.hours().toString()
                        : `0${reaminingValidationDuration.hours().toString()}`,
                minutes:
                    reaminingValidationDuration.minutes() > 9
                        ? reaminingValidationDuration.minutes().toString()
                        : `0${reaminingValidationDuration.minutes().toString()}`,
                seconds:
                    reaminingValidationDuration.seconds() > 9
                        ? reaminingValidationDuration.seconds().toString()
                        : `0${reaminingValidationDuration.seconds().toString()}`,
            }

            let strRemainingValidation = `${dataReaminingValdiationDuration.days} Days ${dataReaminingValdiationDuration.hours}h ${dataReaminingValdiationDuration.minutes}m ${dataReaminingValdiationDuration.seconds}s`

            if (dataReaminingValdiationDuration.months > 0) {
                strRemainingValidation = `${dataReaminingValdiationDuration.months} Months ${strRemainingValidation}`
            }

            if (dataReaminingValdiationDuration.years > 0) {
                strRemainingValidation = `${dataReaminingValdiationDuration.years} Years ${strRemainingValidation}`
            }

            this.reaminingValidation = strRemainingValidation
            this.bondedAmount = new BN(parseFloat(this.nodeInfo.stakeAmount) / 1000000000)
            this.txID = this.nodeInfo.txID
        } catch (e) {
            console.error(e)
        } finally {
            this.loading = false
        }
    }

    refresh() {
        this.getInformationValidator()

        this.$nextTick(() => {
            //@ts-ignore
            this.$refs.avax_input_bonded_amount.maxOut()
        })
    }
}
</script>
<style scoped lang="scss">
@use '../../../../styles/main';

.validator_card {
    display: grid;
    column-gap: 20px;
}

.validator_child_card {
    height: 100%;
}

h4 {
    font-weight: normal;
}

.validator_info > div {
    display: grid;
    grid-template-columns: repeat(5, max-content);
    column-gap: 0px;
    margin-top: 12px;

    > div {
        position: relative;
        padding: 0 24px;
        border-right: 2px solid var(--bg-light);

        &:first-of-type {
            padding-left: 0;
        }

        &:last-of-type {
            border: none;
        }
    }

    label {
        font-size: 18px;
        color: var(--primary-color);
    }

    .icon-mdi-camino {
        font-size: 24px;
        color: var(--primary-color);
    }
}

.disabled_input {
    display: inline-block;
    border-radius: var(--border-radius-sm);
    color: var(--primary-color-light);
    background-color: var(--bg-light);
    padding: 6px 14px;
    white-space: nowrap;
    width: 70%;
}

.disabled_input:focus-visible {
    outline: 0;
}

.input_label {
    margin-bottom: 0.5rem;
}

.amt_in {
    width: 70%;
    pointer-events: none;
}

.space-div {
    display: none;
}

@media screen and (max-width: 900px) {
    .validator_info > div {
        grid-template-columns: repeat(1, minmax(auto, auto));
        border-right: transparent;
    }

    .space-div {
        display: block;
    }

    .disabled_input {
        width: 100%;
    }
}

@media screen and (max-width: 900px) {
    .validator_info > div {
        grid-template-columns: repeat(1, minmax(auto, auto));
        border-right: transparent;
    }

    .space-div {
        display: block;
    }

    .disabled_input {
        width: 100%;
    }

    .amt_in {
        width: 100%;
    }
}

@media screen and (min-width: 720px) and (max-width: 1440px) {
    .validator_info > div {
        grid-template-columns: repeat(2, minmax(auto, auto));
        border-right: transparent;
    }

    .space-div {
        display: none;
    }

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

.refresh_div {
    position: relative;
    float: right;
    margin-top: -5%;

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
</style>
