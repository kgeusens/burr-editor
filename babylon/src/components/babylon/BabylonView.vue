<template>
    <slot></slot>
</template>

<script setup>
    import { EngineView } from "@babylonjs/core";
    import { ref, inject, watch, onMounted } from "@vue/runtime-core";
//    import { createScene, setShape } from "../scenes/MyFirstScene";
    const theView = ref(null)

    const theCamera = inject("camera")
    const theEngine = inject("engine")
    const theScene = inject("scene")
    const theCanvas = inject("canvas")

    const props = defineProps({ 
        enabled: {type: Boolean}, 
    });

    function register(canvas) {
        let newView = new EngineView();
        newView.camera = theCamera
        newView.target = canvas
        newView.enabled = props.enabled
        newView.id = (Math.random() * 100000).toFixed()
        theEngine.views.push(newView)
        theView.value = newView
        if (props.enabled) theCamera.attachControl(canvas, true)
    };

    watch(theCanvas, (newv, oldv) => {if (newv) register(newv)} )
    watch(() => props.enabled, (newval) => { 
        theView.value.enabled = newval;
        if (newval) theCamera.attachControl()
        else theCamera.detachControl()
    } )

</script>