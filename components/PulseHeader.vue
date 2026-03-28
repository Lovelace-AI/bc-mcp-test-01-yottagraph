<template>
    <v-app-bar app density="comfortable" class="pulse-header">
        <div class="d-flex align-center app-header-title">
            <v-icon icon="mdi-pulse" color="primary" size="32" class="mx-3" />
            <span class="app-title-text">Pulse</span>
            <span class="app-subtitle-text">Live News Intelligence</span>
        </div>

        <v-spacer />

        <v-btn to="/search" icon="mdi-magnify" variant="text" color="white" class="mr-2" />

        <v-tooltip :text="`Settings (${modKey}G)`">
            <template #activator="{ props: tooltipProps }">
                <v-btn
                    icon
                    v-bind="tooltipProps"
                    data-testid="settings-button"
                    @click="state.showSettingsDialog = true"
                    class="mr-1"
                    color="white"
                >
                    <v-icon icon="mdi-cog" color="white" />
                </v-btn>
            </template>
        </v-tooltip>

        <v-menu>
            <template #activator="{ props: menu }">
                <v-tooltip :text="userName">
                    <template #activator="{ props: tooltip }">
                        <v-btn
                            icon
                            v-bind="mergeProps(menu, tooltip)"
                            data-testid="user-menu-button"
                            class="mr-2"
                            color="white"
                        >
                            <v-avatar size="32" color="primary">
                                <img
                                    v-if="avatarUrl && !avatarHasError"
                                    :alt="userName"
                                    :src="avatarUrl"
                                    style="width: 100%; height: 100%; object-fit: cover"
                                    crossorigin="anonymous"
                                    referrerpolicy="no-referrer"
                                    @error="handleImageError"
                                    @load="handleImageLoad"
                                />
                                <span v-else class="text-h6" style="color: white">{{
                                    userInitials
                                }}</span>
                            </v-avatar>
                        </v-btn>
                    </template>
                </v-tooltip>
            </template>
            <v-list>
                <v-list-item data-testid="logout-button" @click="handleLogout">
                    <v-list-item-title>Log Out</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </v-app-bar>
</template>

<script setup lang="ts">
    import { mergeProps, watch } from 'vue';
    import { useUserState } from '~/composables/useUserState';
    import { useProxiedAvatar } from '~/composables/useProxiedAvatar';
    import { state } from '~/utils/appState';

    const { userPicture, userName } = useUserState();
    const router = useRouter();

    const { proxiedUrl: avatarUrl } = useProxiedAvatar(userPicture);

    const avatarHasError = ref(false);

    const handleLogout = () => {
        router.push('/logout');
    };

    const isMacPlatform = computed(() => {
        return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    });

    const modKey = computed(() => (isMacPlatform.value ? '⇧⌘' : 'Alt+Shift+'));

    const userInitials = computed(() => {
        if (!userName.value) return '?';
        const names = userName.value.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return userName.value.substring(0, 2).toUpperCase();
    });

    const handleImageError = (event: Event) => {
        console.error('Avatar image failed to load:', {
            originalUrl: userPicture.value,
            proxiedUrl: avatarUrl.value,
            error: event,
            type: event.type,
        });
        avatarHasError.value = true;
    };

    const handleImageLoad = () => {
        avatarHasError.value = false;
    };

    watch(avatarUrl, () => {
        avatarHasError.value = false;
    });
</script>

<style scoped>
    .pulse-header {
        background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%) !important;
        border-bottom: 1px solid rgba(29, 161, 242, 0.2);
    }

    .app-header-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .app-title-text {
        font-weight: 700;
        font-size: 1.5rem;
        letter-spacing: -0.02em;
        color: white;
    }

    .app-subtitle-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 400;
        letter-spacing: 0.05em;
        margin-left: 4px;
    }
</style>
