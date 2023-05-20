import {
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
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

var scene

class Ghost {
    // dimension of grid
    _parent=null
    _voxel=null
    mesh={}
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

    constructor(voxel = new Voxel(), deltaWidth=0, bevelWidth=0, parent) {
        this._parent=parent
        this._voxel=voxel
        this.delta=deltaWidth
        this.bevel=bevelWidth
    }

    render() {
        this.dispose()
        if (!this.voxel.stateString.includes('#')) { this.dispose(); return }
        let hole=null
        let bevel = {}
        // create the bounding box
        this.mesh = MeshBuilder.CreateBox("voxel",{width:this.x - 2*this.delta, depth:this.z - 2*this.delta, height:this.y - 2*this.delta}, scene)
        this.mesh.setPivotMatrix(Matrix.Translation(this.x/2 - 0.5, this.y/2 - 0.5, this.z/2 - 0.5), false);
        const shapeCSG = CSG.FromMesh(this.mesh);

        // punch holes
        hole = MeshBuilder.CreateBox("box",{size:1 + 2*this.delta}, scene)
        hole.isVisible = false
        for (let dx=0; dx < this.x; dx++) {
            for (let dy=0; dy < this.y; dy++) {
                for (let dz=0; dz < this.z; dz++) {
                    if (!this.voxel.getVoxelState(dx, dy, dz)) {
                        hole.position=new Vector3(dx,dy,dz)
                        shapeCSG.subtractInPlace(CSG.FromMesh(hole))
                    }
                }
            }
        }
        hole.dispose
        // create bevel if needed
        if (this.bevel >0) this.renderBevel(shapeCSG)
        // compute the normals
        const tempMesh=shapeCSG.toMesh()
        const vertexData = VertexData.ExtractFromMesh(tempMesh);
         VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals )
         vertexData.applyToMesh(this.mesh)
        tempMesh.dispose()
        // apply material
        const ghostMaterial = new StandardMaterial("myMaterial", scene)
        ghostMaterial.alpha=this.alpha
        ghostMaterial.emissiveColor=new Color3(0, 1, 0)
        this.mesh.material=ghostMaterial
        this.mesh.isPickable=false
        if (this.outline) this.renderOutline()
    }
    renderBevel(shapeCSG) {
        // create the nudge
        const dimName = {x: "width", y: "height", z: "depth"}
        const dimValue = {x: 1, y: 2, z: 4} 
        let bevelOptions = { width: 2*this.bevel, depth: 2*this.bevel, height: 2*this.bevel }
        let basePosition=null
        let nudge=MeshBuilder.CreateBox("nudge", { size: 1}, scene)
        let nudgeCSG=CSG.FromMesh(nudge)
        let bevel=[]
        for (let d of ['x', 'y', 'z']) {
            bevelOptions = { width: 2*this.bevel, depth: 2*this.bevel, height: 2*this.bevel }
            bevelOptions[dimName[d]] = 1+2*this.delta // compensate the bevel box for the delta of the holes
            bevel[d] = MeshBuilder.CreateBox("bevel",bevelOptions)
            bevel[d].rotation[d] = Math.PI / 4
            nudgeCSG.intersectInPlace(CSG.FromMesh(bevel[d]))
        }
        let tempMesh=nudgeCSG.toMesh()
        let vertexData = VertexData.ExtractFromMesh(tempMesh);
        VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals )
        tempMesh.dispose()
        vertexData.applyToMesh(nudge)
        let nudgeBasePosition = new Vector3(-0.5,-0.5,-0.5)
        // initialize 3 dimensional array for the nodes (vertices)
        let node=[...Array(this.x + 1)].map(x => [...Array(this.y + 1)].map(y => [...Array(this.z + 1)].map(v=>0)))

        // first bevel, and update the node matrix to keep track how many bevels join together at the node
        for (let d of ['x', 'y', 'z']) {
            bevelOptions = { width: 2*this.bevel, depth: 2*this.bevel, height: 2*this.bevel }
            bevelOptions[dimName[d]] = 1+2*this.delta // compensate the bevel box for the delta of the holes
            basePosition = new Vector3(-0.5,-0.5,-0.5)
            basePosition[d]=0
            for (let dx=0; dx <= this.x; dx++) {
                for (let dy=0; dy <= this.y; dy++) {
                    for (let dz=0; dz <= this.z; dz++) {
                        let count = 0
                        for (let i=0; i<2; i++) {
                            for (let j=0; j<2; j++) {
                                switch (d) {
                                    case ('x'):
                                        if (this.voxel.getVoxelState(dx,dy-i,dz-j)) count+=1
                                        break
                                    case ('y'):
                                        if (this.voxel.getVoxelState(dx-i,dy,dz-j)) count+=1
                                        break
                                    case ('z'):
                                        if (this.voxel.getVoxelState(dx-i,dy-j,dz)) count+=1
                                        break
                                }
                            }
                        }
                        if (count == 1 || count == 3) {
                            if (count == 1) {
                                bevel[d].position = basePosition.add(new Vector3(dx, dy, dz))
                                shapeCSG.subtractInPlace(CSG.FromMesh(bevel[d]))
                                node[dx][dy][dz] |= dimValue[d]
                            }
                            switch(d) {
                                case 'x':
                                    if (count == 1 ) node[dx+1][dy][dz] |= dimValue[d]
                                    break
                                case 'y':
                                    if (count == 1 ) node[dx][dy+1][dz] |= dimValue[d]
                                    break
                                case 'z':
                                    if (count == 1 ) node[dx][dy][dz+1] |= dimValue[d]
                                    break
                            }
                        }
                    }
                }
            }
            bevel[d].dispose()
        }
        // now clean up the joints where multiple bevels join
        for (let dx=0; dx <= this.x; dx++) {
            for (let dy=0; dy <= this.y; dy++) {
                for (let dz=0; dz <= this.z; dz++) {
                    switch(node[dx][dy][dz]) {
                        case 3:
                        case 5:
                        case 6:
                        case 7:
                            nudge.position = nudgeBasePosition.add(new Vector3(dx,dy,dz))
                            shapeCSG.subtractInPlace(CSG.FromMesh(nudge))

                    }
                }
            }
        }
        nudge.dispose()
    }
    renderOutline() {
        for (let d of ['x', 'y', 'z']) {
            for (let dx=0; dx <= this.x; dx++) {
                for (let dy=0; dy <= this.y; dy++) {
                    for (let dz=0; dz <= this.z; dz++) {
                        let count = 0
                        for (let i=0; i<2; i++) {
                            for (let j=0; j<2; j++) {
                                switch (d) {
                                    case ('x'):
                                        if (this.voxel.getVoxelState(dx,dy-i,dz-j)) count+=1
                                        break
                                    case ('y'):
                                        if (this.voxel.getVoxelState(dx-i,dy,dz-j)) count+=1
                                        break
                                    case ('z'):
                                        if (this.voxel.getVoxelState(dx-i,dy-j,dz)) count+=1
                                        break
                                }
                            }
                        }
                        let options={}
                        let lines=null
                        if (count == 1 || count == 3) {
                            switch(d) {
                                case 'x':
                                    options = {
                                    points: [new Vector3(dx-0.5, dy-0.5, dz-0.5),new Vector3(dx+0.5, dy-0.5, dz-0.5)], //vec3 array,
                                    };
                                    this.outlines.push(MeshBuilder.CreateLines("lines", options, scene)); //scene is optional
                                    break
                                case 'y':
                                    options = {
                                    points: [new Vector3(dx-0.5, dy-0.5, dz-0.5),new Vector3(dx-0.5, dy+0.5, dz-0.5)], //vec3 array,
                                    };
                                    this.outlines.push(MeshBuilder.CreateLines("lines", options, scene)); //scene is optional
                                    break
                                case 'z':
                                    options = {
                                    points: [new Vector3(dx-0.5, dy-0.5, dz-0.5),new Vector3(dx-0.5, dy-0.5, dz+0.5)], //vec3 array,
                                    };
                                    this.outlines.push(lines = MeshBuilder.CreateLines("lines", options, scene)); //scene is optional
                                    break
                            }
                        }
                    }
                }
            }
        }
    }
    dispose() {
        if (this.mesh.dispose) this.mesh.dispose()
        for (let line of this.outlines) { line.dispose()}
        this.mesh={}
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
    piece
    stateCallback
    constructor(sc, callbackFunction, options = {}) {
        scene = sc
        this.stateCallback=callbackFunction
        const rootNode = new TransformNode("root");
        rootNode.position=new Vector3(0,0,0)
        this.piece=new Ghost(new Voxel({}), 0, 0, rootNode)
        this.setOptions(options)
    }
    get state() { return { stateString: this.grid.voxel.stateString, size: {x:this.grid.voxel.x,y:this.grid.voxel.y,z:this.grid.voxel.z}}}
    setOptions(options) {
        var { shape, delta = 0, bevel = 0, alpha = 1, outline = true } = options
        let vox=new Voxel(shape)
        vox.callback = this.stateCallback
        this.piece.voxel = new Proxy(vox,handler)
        this.piece.delta=delta
        this.piece.bevel=bevel
        this.piece.alpha=alpha
        this.piece.outline=outline
        this.piece.render()
    }
}
