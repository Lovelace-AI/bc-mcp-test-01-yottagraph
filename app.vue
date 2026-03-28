<template>
    <v-app class="theme-brand pulse-app">
        <template v-if="showAppFramework">
            <PulseHeader />

            <v-main class="fill-height pulse-main">
                <ServerStatus />
                <NuxtPage />
            </v-main>

            <!-- Global Dialogs -->
            <v-dialog v-model="state.showSettingsDialog" max-width="600">
                <SettingsDialog />
            </v-dialog>

            <!-- Global Notifications -->
            <NotificationContainer />

            <!-- Server Status Footer -->
            <ServerStatusFooter />
        </template>
        <template v-else>
            <NuxtPage />
        </template>
    </v-app>
</template>

<script setup lang="ts">
    import { state } from './utils/appState';

    const route = useRoute();
    const { userName } = useUserState();

    const noFrameworkRoutes = ['/login', '/a0callback', '/logout', '/pending'];

    const showAppFramework = computed(() => {
        if (noFrameworkRoutes.includes(route.path)) {
            return false;
        }
        if (!userName.value) {
            return false;
        }
        return true;
    });
</script>

<style>
    .pulse-app {
        background: #0f1419 !important;
    }

    .pulse-main {
        background: #0f1419 !important;
    }
</style>
