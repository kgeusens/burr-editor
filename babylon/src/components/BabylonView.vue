<template>
    <slot></slot>
    <canvas style="display:block" ref="bjsCanvas" width="100" height="100" />
</template>

<script setup>
    import { ref, inject, watch, onMounted } from "@vue/runtime-core";
//    import { createScene, setShape } from "../scenes/MyFirstScene";

    const theCamera = inject("camera")
    const theEngine = inject("engine")
    const theScene = inject("scene")

    const props = defineProps({ 
        shape: Object, 
        height: { type: String, default: "150"}, 
        width: { type: String, default: "150" } 
    })
    const bjsCanvas = ref(null);
    const parentWidth = ref(0);
    const parentHeight = ref(0);

    const ro = new ResizeObserver( entry => { 
    if (bjsCanvas.value && bjsCanvas.value.parentElement) {
        let cr = bjsCanvas.value.parentElement.getBoundingClientRect()
        parentHeight.value=props.height == "parent"?cr.height - bjsCanvas.value.offsetTop:props.height
        parentWidth.value=props.width == "parent"?cr.width:props.width
    }
    })

    onMounted(() => {
    if (bjsCanvas.value) {
        ro.observe(bjsCanvas.value.parentElement)
        theEngine.registerView(bjsCanvas.value, theCamera)
            theCamera.attachControl(bjsCanvas.value, true)
            theScene.detachControl();
            theEngine.inputElement = bjsCanvas.value;
            theScene.attachControl();
    }
    });

    watch(parentWidth, (newv, oldv) => {bjsCanvas.value.width = newv} )
    watch(parentHeight, (newv, oldv) => {bjsCanvas.value.height = newv} )
</script>