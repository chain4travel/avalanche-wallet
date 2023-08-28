<template>
    <p class="text">{{ version }}</p>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component({
    name: 'version',
})
export default class Version extends Vue {
    version = process.env.GIT_COMMIT_HASH
}
</script>
