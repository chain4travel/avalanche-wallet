<template>
    <div class="tooltip">
        <slot></slot>
        <div v-if="showTooltip" class="tooltip-content">
            {{ content }}
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            showTooltip: true,
        }
    },
    props: {
        content: {
            type: String,
            required: true,
        },
    },
}
</script>

<style scoped>
.tooltip {
    position: relative;
    display: inline-block;
    cursor: pointer;
}

.tooltip-content {
    position: absolute;
    background: rgba(97, 97, 97, 0.9);
    color: #ffffff;
    padding: 5px 16px;
    border-radius: 4px;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    display: none;
    font-size: 14px;
    line-height: 22px;
}

.tooltip-content:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(97, 97, 97, 0.9) transparent transparent transparent;
}

.tooltip:hover .tooltip-content {
    display: block;
}
</style>
