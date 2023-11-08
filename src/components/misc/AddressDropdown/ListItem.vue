<template>
    <li>
        <input type="checkbox" />
        <div>
            <p class="add_title">Address {{ index }}</p>
            <p class="add_val">{{ value }}</p>
        </div>
    </li>
</template>
<script>
export default {
    props: {
        index: Number,
        value: {
            required: true,
            type: String,
        },
    },
}
</script>
<style scoped lang="scss">
@use '../../../styles/abstracts/mixins';
li p {
    margin: 0;
    padding-left: 10px;
}

.add_title {
    @include mixins.typography-caption;
}
.add_val {
    @include mixins.typography-caption;
}
</style>
