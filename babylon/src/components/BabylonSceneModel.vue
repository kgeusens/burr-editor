<template>
    <slot></slot>
</template>

<script setup>
    import { reactive, inject, watch, onMounted } from "@vue/runtime-core";
//    import { createScene, setShape } from "../scenes/MyFirstScene";

    const theScene = inject("scene")

    const props = defineProps({ 
        model: Function, 
        detail: Object, 
    })

    const test = new props.model(theScene)
    console.log(test)

    onMounted(() => {
    });

</script>