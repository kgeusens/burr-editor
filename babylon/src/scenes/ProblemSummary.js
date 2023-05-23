import {
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Color4,
    TransformNode,
    Mesh,
    AbstractMesh,
    Space,
    ActionManager,
    ExecuteCodeAction,
    Matrix,
    PointerDragBehavior,
    PointerEventTypes,
    HighlightLayer,
    CSG,
    VertexData,
  } from "@babylonjs/core";
import { Voxel } from "@kgeusens/burr-data"
import { rotationVector } from '../utils/rotation'
  
var scene

class Ghost {
    // dimension of grid
    _parent
    _voxel=null
    mesh=new AbstractMesh("mesh", scene)
    outlines=[]
    delta=0
    bevel=0
    outline=true
    alpha=1

    get x() { return this.voxel.x }
    get y() { return this.voxel.y }
    get z() { return this.voxel.z }
    get voxel() {return this._voxel}
    set voxel(v) { this._voxel = v }
    get parent() { return this._parent }

    constructor(voxel = new Voxel(), deltaWidth=0, bevelWidth=0, parent = null) {
        this._parent=parent
        this._voxel=voxel
        this.delta=deltaWidth
        this.bevel=bevelWidth
    }

    render() {
        this.dispose()
        if (!this.voxel.stateString.includes('#')) { this.dispose(); return }
        let meshArray=[]
        for (let dx=0; dx < this.x; dx++) {
            for (let dy=0; dy < this.y; dy++) {
                for (let dz=0; dz < this.z; dz++) {
                    if (this.voxel.getVoxelState(dx, dy, dz) !=0 ) {
                        let m = MeshBuilder.CreateBox("voxel",{size:1-2*this.delta}, scene)
                        m.position=new Vector3(dx,dy,dz)
                        meshArray.push(m)
                    }
                }
            }
        }
        this.mesh = Mesh.MergeMeshes(meshArray)
        this.mesh.parent = this.parent
        // apply material
        const ghostMaterial = new StandardMaterial("myMaterial", scene)
        ghostMaterial.alpha=this.alpha
        ghostMaterial.diffuseColor=new Color3(0, 1, 0)
        this.mesh.material=ghostMaterial
        this.mesh.isPickable=true
        if (this.outline) { 
            this.mesh.edgesWidth=3
            this.mesh.edgesColor = new Color4(1,1,1,1)
            this.mesh.enableEdgesRendering() 
        }
    }
    dispose() {
        if (this.mesh.dispose) this.mesh.dispose()
        for (let line of this.outlines) { line.dispose()}
        this.mesh=new AbstractMesh("mesh", scene)
        this.outlines=[]
    }
    attach() {
    }
} // end of class Ghost

const handler = {
    get(target, property) {
        if (typeof target[property] == "function") {
            return function(...args) {
                let res = target[property].apply(target,args)
                if (property == "setVoxelState") target["callback"](target)
                if (property == "setSize") target["callback"](target)
                return res
            }
        }
        else return target[property];
    },
    set(target, property, value) {
        target[property] = value
        if (property == "state") {
            console.log("intercepted", property, value)
        }
        return true
    }
}

export class sceneBuilder {
    result
    pieces=[]
    stateCallback
    constructor(sc, callbackFunction, options = {}) {
        scene = sc
        this.stateCallback=callbackFunction
        const rootNode = new TransformNode("root");
        rootNode.position=new Vector3(0,0,0)
        this.result=new Ghost(new Voxel({}), 0, 0, rootNode)
    }
    get state() { return { stateString: this.grid.voxel.stateString, size: {x:this.grid.voxel.x,y:this.grid.voxel.y,z:this.grid.voxel.z}}}
    setOptions(options) {
        var { shape, pieces = [], delta = 0, bevel = 0, alpha = 1, outline = true } = options

        let vox=new Voxel(shape)
        vox.callback = this.stateCallback
        this.result.voxel = new Proxy(vox,handler)
        this.result.delta=delta
        this.result.bevel=bevel
        this.result.alpha=alpha
        this.result.outline=outline
        this.result.render()

        for (let piece of this.pieces) { 
            let p = piece.parent
            piece.dispose()
            p.dispose()
         }
        this.pieces=[]
        let radius = shape?Math.max(shape.x, shape.y):1
        for (let idx in pieces) {
            let angle = (idx*Math.PI*2)/pieces.length
            let p = new Ghost(pieces[idx], delta, bevel, new TransformNode("subRoot"))
            p.alpha = alpha
            p.outline = outline
            this.pieces.push(p)
            p.parent.position.x=Math.cos(angle)*radius*Math.sqrt(2)
            p.parent.position.y=Math.sin(angle)*radius*Math.sqrt(2)
            p.render()
            p.parent.computeWorldMatrix(true)
            p.mesh.computeWorldMatrix(true)
        }

        if (scene.activeCamera) { 
            scene.activeCamera.useFramingBehavior = true
            scene.activeCamera.framingBehavior.radiusScale = 3
            scene.activeCamera.setTarget(this.result.mesh);
}
    }
}
