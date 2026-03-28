<template>
    <v-tabs v-model="activeTab" color="primary" align-tabs="start" class="category-tabs mb-4">
        <v-tab v-for="category in categories" :key="category" :value="category">
            {{ category }}
        </v-tab>
    </v-tabs>
</template>

<script setup lang="ts">
    const props = defineProps<{
        modelValue: string;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const categories = ['All', 'Markets', 'Tech', 'Politics', 'Science', 'Crypto'];

    const activeTab = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    });
</script>

<style scoped>
    .category-tabs {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
</style>
