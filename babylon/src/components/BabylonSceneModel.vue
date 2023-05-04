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

    const myModel = new props.model(theScene)
//    console.log(myModel)

    onMounted(() => {
    });

    watch(
        () => props.detail, 
        (newval,oldval) => myModel.setOptions(newval)
    )


</script>