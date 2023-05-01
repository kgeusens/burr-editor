<template>
    <slot></slot>
</template>

<script setup>
    import { onMounted, inject } from "@vue/runtime-core";
    
    const theCamera = inject("camera")
    console.log(theCamera)

    const props = defineProps({ 
    })
    onMounted(() => {
    });
</script>
