<template>
    <div class="dates_form">
        <div class="hover_border">
            <button class="max_but" @click="maxoutEndDate">Max</button>
            <datetime
                v-model="localEnd"
                type="datetime"
                class="date"
                :min-datetime="endDateMin"
                :max-datetime="endDateMax"
                :disabled="pendingTxDate"
            ></datetime>
        </div>
    </div>
</template>
<script lang="ts">
import { Datetime } from 'vue-datetime'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({
    components: {
        Datetime,
    },
})
export default class DateForm extends Vue {
    // timeNow = 0

    localStart = this.startDate
    localEnd = this.endDateMin

    @Prop() maxEndDate?: number
    @Prop() minDurationMs!: number
    @Prop() maxDurationMs!: number
    @Prop() defaultDurationMs!: number
    @Prop() pendingTxDate?: number
    @Prop() zeroSeconds?: boolean

    @Watch('localEnd')
    endChange(val: string) {
        this.setEndDate(val)

        let endTime = new Date(val).getTime()
        let minDateTime = new Date(this.endDateMin).getTime()

        if (endTime < minDateTime) {
            this.localEnd = this.endDateMin
        }
    }

    mounted() {
        this.localStart = this.startDate
        this.localEnd = this.defaultEndDate

        this.setEndDate(this.localEnd)
    }

    setEndDate(val: string) {
        this.$emit('change_end', val)
    }

    maxoutEndDate(ev: MouseEvent) {
        ev.preventDefault()
        this.localEnd = this.endDateMax
    }

    zeroOutSeconds(date: Date) {
        if (this.zeroSeconds) {
            date.setSeconds(0, 0)
        }
        return date
    }

    get startDate() {
        let now = Date.now() + 60
        now -= now % 60
        let date = new Date(now)
        return this.zeroOutSeconds(date).toISOString()
    }

    get endDateMin() {
        let startDate = new Date(this.localStart)
        let end = startDate.getTime() + this.minDurationMs
        let endDate = new Date(end)
        return this.zeroOutSeconds(endDate).toISOString()
    }

    get endDateMax() {
        let startDate = new Date(this.localStart)
        let end = startDate.getTime() + this.maxDurationMs
        if (this.maxEndDate && end > this.maxEndDate) end = this.maxEndDate
        let endDate = new Date(end)
        return this.zeroOutSeconds(endDate).toISOString()
    }

    get defaultEndDate() {
        let startDate = new Date(this.localStart)
        let end = startDate.getTime() + this.defaultDurationMs
        let endDate = new Date(end)
        return this.zeroOutSeconds(endDate).toISOString()
    }
}
</script>
<style lang="scss">
.hover_border {
    padding-right: 6px;
}

.dates_form {
    .date input {
        border: none !important;
        text-align: right;
        width: 100%;
    }
    .vdatetime-popup {
        border-radius: var(--border-radius-sm);
        overflow: hidden;
        background-color: var(--bg-light);
        color: var(--text-color);
        font-family: var(--primary-font);
        .vdatetime-popup__header {
            background-color: #0085ff;
        }
        .vdatetime-popup__header div {
            font-family: var(--primary-font);
        }
        .vdatetime-calendar__navigation--next svg path,
        .vdatetime-calendar__navigation--previous svg path {
            stroke: var(--text-color);
        }
        .vdatetime-calendar__navigation--next svg path:hover,
        .vdatetime-calendar__navigation--previous svg path:hover {
            opacity: 0.8;
        }
        .vdatetime-calendar__month__day:hover > span > span {
            background-color: #0085ff;
            color: #fff;
            opacity: 0.3;
        }
        .vdatetime-calendar__month__day--selected > span > span {
            background-color: #0085ff;
            color: #fff;
        }
        .vdatetime-popup__actions__button {
            color: #0085ff;
        }
    }
}
</style>
<style scoped lang="scss">
.dates_form {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 15px;
    width: 100%;
    border: 1px solid var(--camino-slate-slate-600);
    border-radius: 8px;
    > div {
        width: 100%;
        display: grid;
        grid-template-columns: max-content 1fr;
        background-color: transparent !important;
    }
    .vdatetime {
        background-color: transparent !important;
    }

    label > span {
        float: right;
        opacity: 0.4;
        cursor: pointer;
        &:hover {
            opacity: 1;
        }
    }
}

.max_but {
    padding-left: 12px;
    color: var(--primary-color-light);
    &:hover {
        color: var(--primary-color);
    }
}
</style>
