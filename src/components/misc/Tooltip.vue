<template>
    <div>
        <v-tooltip bottom :content-class="contentClass">
            <template v-slot:activator="{ on, attrs }">
                <button v-bind="attrs" v-on="on">
                    <slot></slot>
                </button>
            </template>
            <span>{{ text }}</span>
        </v-tooltip>
    </div>
</template>
<script>
export default {
    props: {
        text: String,
        contentClass: String,
    },
}
</script>
<style scoped lang="scss">
button {
    width: fit-content;
    height: fit-content;
}
</style>
