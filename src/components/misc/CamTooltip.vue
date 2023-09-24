<template>
    <div class="tooltip" :placement="placement">
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
        placement: {
            type: String,
            default: 'top',
            validator: (value) => ['top', 'right', 'bottom', 'left'].includes(value),
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
    bottom: 150%;
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

.tooltip[placement='right'] .tooltip-content {
    top: 50%;
    left: 240%;
    transform: translateY(-50%);
    white-space: nowrap;
    bottom: auto;
}

.tooltip[placement='right'] .tooltip-content:after {
    content: '';
    position: absolute;
    top: 65%;
    left: -5px;
    margin-top: -5px;
    transform: translateY(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent rgba(97, 97, 97, 0.9) transparent transparent;
}

.tooltip[placement='bottom'] .tooltip-content {
    top: 180%;
    left: 50%;
    transform: translateX(-50%);
    bottom: auto;
}

.tooltip[placement='bottom'] .tooltip-content:after {
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent rgba(97, 97, 97, 0.9) transparent;
    top: auto;
}

.tooltip[placement='left'] .tooltip-content {
    right: 250%;
    left: auto;
    top: 50%;
    transform: translateY(-50%);
    bottom: auto;
}

.tooltip[placement='left'] .tooltip-content:after {
    top: 50%;
    right: -8%;
    left: auto;
    transform: translateY(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent rgba(97, 97, 97, 0.9);
}
</style>
