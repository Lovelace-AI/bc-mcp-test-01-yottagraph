<template>
    <v-chip
        :to="`/entity/${neid}`"
        :color="chipColor"
        size="small"
        variant="outlined"
        class="entity-chip"
    >
        {{ name }}
    </v-chip>
</template>

<script setup lang="ts">
    const props = defineProps<{
        neid: string;
        name: string;
        sentiment?: number;
    }>();

    const chipColor = computed(() => {
        if (props.sentiment === undefined) return 'grey';
        if (props.sentiment > 0.1) return '#1DA1F2';
        if (props.sentiment < -0.1) return '#E0245E';
        return '#8899A6';
    });
</script>

<style scoped>
    .entity-chip {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .entity-chip:hover {
        opacity: 0.8;
        box-shadow: 0 0 8px currentColor;
    }
</style>
