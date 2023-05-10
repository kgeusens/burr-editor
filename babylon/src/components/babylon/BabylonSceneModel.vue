<template>
    <slot></slot>
</template>

<script setup>
    import { SubEmitter } from "@babylonjs/core";
import { reactive, inject, watch, onMounted } from "@vue/runtime-core";

    const theScene = inject("scene")

    const props = defineProps({ 
        model: Function, 
        detail: Object,
    })
    const emit = defineEmits(["newState"])

    const stateCallback = function(state) {
        emit("newState", state)
    }

    const myModel = new props.model(theScene, stateCallback)

    onMounted(() => {
    });

    watch(
        () => props.detail, 
        (newval,oldval) => myModel.setOptions(newval)
    )


</script>