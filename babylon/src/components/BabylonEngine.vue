<template>
    <slot></slot>
</template>

<script setup>
    import { onMounted, provide } from "@vue/runtime-core";
    import { Engine } from "@babylonjs/core";

    const workerCanvas = document.createElement("canvas");
    const myEngine = new Engine(workerCanvas, true);

    provide("engine", myEngine)

    const props = defineProps({ 
    })

    onMounted(() => {
//    console.log(myEngine)
    });
</script>
