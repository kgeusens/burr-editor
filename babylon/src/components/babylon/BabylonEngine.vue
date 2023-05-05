<template>
    <slot></slot>
</template>

<script setup>
    import { onMounted, provide } from "@vue/runtime-core";
    import { Engine } from "@babylonjs/core";

    const workerCanvas = document.createElement("canvas");
    const myEngine = new Engine(workerCanvas, true);
    provide("engine", myEngine)

    myEngine.runRenderLoop(() => {
        if (myEngine.activeView.camera) {
            myEngine.activeView.camera.getScene().render()
        };
    });

    const props = defineProps({ 
    })

    onMounted(() => {
    });
</script>
