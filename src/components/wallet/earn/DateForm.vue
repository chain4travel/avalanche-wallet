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
            ></datetime>
        </div>
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Datetime } from 'vue-datetime'

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

    get startDate() {
        let now = Date.now() + 60
        now -= now % 60
        return new Date(now).toISOString()
    }

    get endDateMin() {
        let start = this.localStart
        let startDate = new Date(start)

        let end = startDate.getTime() + this.minDurationMs
        let endDate = new Date(end)
        return endDate.toISOString()
    }

    get endDateMax() {
        let start = this.localStart
        let startDate = new Date(start)

        let end = startDate.getTime() + this.maxDurationMs
        if (this.maxEndDate && end > this.maxEndDate) end = this.maxEndDate
        let endDate = new Date(end)

        return endDate.toISOString()
    }

    get defaultEndDate() {
        let start = this.localStart
        let startDate = new Date(start)

        let end = startDate.getTime() + this.defaultDurationMs
        let endDate = new Date(end)
        return endDate.toISOString()
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
}
</style>
<style scoped lang="scss">
.dates_form {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 15px;
    width: 100%;

    > div {
        width: 100%;
        display: grid;
        grid-template-columns: max-content 1fr;
        background-color: var(--bg-light);
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
