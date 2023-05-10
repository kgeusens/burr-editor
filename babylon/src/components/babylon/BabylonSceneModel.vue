<template>
    <slot></slot>
</template>

<script setup>
    import { reactive, inject, watch, onMounted } from "@vue/runtime-core";

    const theScene = inject("scene")

    const props = defineProps({ 
        model: Function, 
        detail: Object,
    })

    const myModel = new props.model(theScene)

    onMounted(() => {
    });

    watch(
        () => props.detail, 
        (newval,oldval) => myModel.setOptions(newval)
    )


</script>