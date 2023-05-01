<template>
    <slot></slot>
</template>

<script setup>
    import { onMounted, inject } from "@vue/runtime-core";
//    import { View } from "@babylonjs/core";

    const theEngine = inject("engine")

    const props = defineProps({ 
    })
    onMounted(() => {
    });
</script>
