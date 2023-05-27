import {
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    TransformNode,
    ActionManager,
    InterpolateValueAction,
    SetValueAction,
    Matrix,
    Animation,
    QuadraticEase,
    EasingFunction,
    PointerDragBehavior,
    PointerEventTypes,
    HighlightLayer,
    CSG,
    VertexData,
    AnimationGroup,
    BoundingInfo,
  } from "@babylonjs/core";
import { Voxel } from "@kgeusens/burr-data"
import { rotationVector } from '../utils/rotation'
  
var scene

class Ghost {
    // dimension of grid
    _parent
    _voxel=null
    mesh={}
    outlines=[]
    delta=0
    bevel=0
    outline=true
    alpha=1
    _rotationIndex = 0

    get x() { return this.voxel.x }
    get y() { return this.voxel.y }
    get z() { return this.voxel.z }
    get voxel() {return this._voxel}
    set voxel(v) { this._voxel = v }
    get parent() { return this._parent }
    set isVisible(v) { 
        this.mesh.isVisible = v
        for (let l of this.outlines) l.isVisible=v
    }
    set outlineIsVisible(v) { 
        for (let l of this.outlines) l.isVisible=v
    }
    get rotationIndex() { return this._rotationIndex}
    set rotationIndex(idx) { 
        this.parent.rotation=rotationVector(idx)
        this._rotationIndex = idx; 
    }

    constructor(voxel = new Voxel(), deltaWidth=0, bevelWidth=0, parent = null) {
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
        this.mesh.parent = this.parent
        this.mesh.setPivotMatrix(Matrix.Translation(this.x/2 - 0.5, this.y/2 - 0.5, this.z/2 - 0.5), false);
        const shapeCSG = CSG.FromMesh(this.mesh);

        // punch holes
        hole = MeshBuilder.CreateBox("box",{size:1 + 2*this.delta}, scene)
        hole.parent = this.parent
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
        tempMesh.parent = this.parent
        const vertexData = VertexData.ExtractFromMesh(tempMesh);
        VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals )
        vertexData.applyToMesh(this.mesh)
        tempMesh.dispose()
        // apply material
        const ghostMaterial = new StandardMaterial("myMaterial", scene)
        ghostMaterial.alpha=this.alpha
        ghostMaterial.diffuseColor=new Color3(0, 1, 0)
        this.mesh.material=ghostMaterial
        this.mesh.isPickable=true
        if (this.outline) this.renderOutline()
        this.mesh.actionManager = new ActionManager(scene);
        this.mesh.actionManager
            .registerAction(
                new InterpolateValueAction(
                    ActionManager.OnPickTrigger,
                    this.mesh.material,
                    "alpha", 
                    0.4,
                    500
                )
            )
            .then(
                new InterpolateValueAction(
                    ActionManager.OnPickTrigger,
                    this.mesh.material,
                    "alpha", 
                    1,
                    500
                )
            )
        this.mesh.actionManager
            .registerAction(
                new SetValueAction(
                    ActionManager.OnPickTrigger,
                    this,
                    "outlineIsVisible", 
                    false
                )
            )
            .then(
                new SetValueAction(
                    ActionManager.OnPickTrigger,
                    this,
                    "outlineIsVisible", 
                    true
                )
            )
    }

    renderBevel(shapeCSG) {
        // create the nudge
        const dimName = {x: "width", y: "height", z: "depth"}
        const dimValue = {x: 1, y: 2, z: 4} 
        let bevelOptions = { width: 2*this.bevel, depth: 2*this.bevel, height: 2*this.bevel }
        let basePosition=null
        let nudge=MeshBuilder.CreateBox("nudge", { size: 1}, scene)
        nudge.parent=this.parent
        let nudgeCSG=CSG.FromMesh(nudge)
        let bevel=[]
        for (let d of ['x', 'y', 'z']) {
            bevelOptions = { width: 2*this.bevel, depth: 2*this.bevel, height: 2*this.bevel }
            bevelOptions[dimName[d]] = 1+2*this.delta // compensate the bevel box for the delta of the holes
            bevel[d] = MeshBuilder.CreateBox("bevel",bevelOptions)
            bevel[d].parent = this.parent
            bevel[d].rotation[d] = Math.PI / 4
            nudgeCSG.intersectInPlace(CSG.FromMesh(bevel[d]))
        }
        let tempMesh=nudgeCSG.toMesh()
        tempMesh.parent=this.parent
        let vertexData = VertexData.ExtractFromMesh(tempMesh);
        VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals )
        tempMesh.dispose()
        vertexData.applyToMesh(nudge)
        let nudgeBasePosition = new Vector3(-0.5,-0.5,-0.5)
        // initialize 3 dimensional array for the nodes (vertices)
        let node=[...Array(1*this.x + 1)].map(x => [...Array(1*this.y + 1)].map(y => [...Array(1*this.z + 1)].map(v=>0)))
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
        for (let out of this.outlines) out.parent=this.parent
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
//            console.log("intercepted", property, value)
        }
        return true
    }
}

export class sceneBuilder {
    result
    pieces=[] // these are Ghosts
    _movePositions=[]
    _isDirty=true // means there is a change to the base solution sequence (pieces of positions changed)
    move
    delta
    bevel
    alpha
    outline
    stateCallback
    _animationGroup = new AnimationGroup("solutionPlayer")
    _framerate=25 // frames per second
    _moveTime=1.5 // time in seconds to make a move
    _movePause=0.5 // pause time between moves in seconds
    constructor(sc, callbackFunction, options = {}) {
        scene = sc
        this.stateCallback=callbackFunction
        const rootNode = new TransformNode("root");
        rootNode.position=new Vector3(0,0,0)
        this.result=new Ghost(new Voxel({}), 0, 0, rootNode)
    }

    get frameLength() { return this._framerate * (this._moveTime + this._movePause) }
    get movePositions() { return this._movePositions }
    set movePositions(mp) {
        let oldState=JSON.stringify(this._movePositions)
        let newState=JSON.stringify(mp)
        if (oldState != newState) {
            this.isDirty = true
            this._movePositions=mp
        }
    }
    get animationGroup() { return this._animationGroup }
    set animationGroup(ag) { 
        this._animationGroup.dispose()
        this._animationGroup = ag 
    }
    get boundingInfo() {
        this.pieces[0].mesh.computeWorldMatrix(true)
        let min = this.pieces[0].mesh.getBoundingInfo().boundingBox.minimumWorld;
        let max = this.pieces[0].mesh.getBoundingInfo().boundingBox.maximumWorld;
        for(let i=0; i<this.pieces.length; i++){
            this.pieces[i].mesh.computeWorldMatrix(true)
            let meshMin = this.pieces[i].mesh.getBoundingInfo().boundingBox.minimumWorld;
            let meshMax = this.pieces[i].mesh.getBoundingInfo().boundingBox.maximumWorld;
            min = Vector3.Minimize(min, meshMin);
            max = Vector3.Maximize(max, meshMax);
        }
        return new BoundingInfo(min,max)
    }
    buildAnimationGroup() {
        let mp = this.movePositions
        let solutionAnimationGroup = this.animationGroup.clone()
        if (this.isDirty) {
            let positionKeyList= Array.from(Array(this.pieces.length), () => [])
            let animationList=Array.from(Array(this.pieces.length), () => new Animation("pieceAnimation", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE))
            let easingFunction = new QuadraticEase()
            solutionAnimationGroup = new AnimationGroup("solutionPlayer")
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT)
            // build animations
            // build the keyframe list for every piece
            for (let pieceIdx in this.pieces) {
                // for every piece
                for (let moveIdx in mp) {
                    // for every move and every piece, add a frame to the piece for that move
                    if (mp[moveIdx][pieceIdx]) {
                        positionKeyList[pieceIdx].push({
                            frame: moveIdx * this.frameLength, 
                            value: new Vector3(Number(mp[moveIdx][pieceIdx].x), Number(mp[moveIdx][pieceIdx].y), Number(mp[moveIdx][pieceIdx].z))
                        })
                    } else {
                        // repeat the position of the previous keyFrame
                        positionKeyList[pieceIdx].push({
                            frame: moveIdx * this.frameLength, 
                            value: positionKeyList[pieceIdx][moveIdx - 1].value
                        })

                    }
                }
                animationList[pieceIdx].setKeys(positionKeyList[pieceIdx])
                animationList[pieceIdx].setEasingFunction(easingFunction)
                solutionAnimationGroup.addTargetedAnimation(animationList[pieceIdx], this.pieces[pieceIdx].parent)
            }
        } 
        return solutionAnimationGroup
    }
    get isDirty() { return this._isDirty }
    set isDirty(b) { this._isDirty = b}
    get state() { return { stateString: this.grid.voxel.stateString, size: {x:this.grid.voxel.x,y:this.grid.voxel.y,z:this.grid.voxel.z}}}

    buildGhosts(options) {
        var { pieces = [], movePositions = [], move=0, delta = 0, bevel = 0, alpha = 1, outline = true } = options
        // turn the pieces (voxel data) into ghosts (3D representations)
        // rotate to the correct position
        for (let idx in pieces) {
            if (!this.pieces[idx]) {
                // new piece, need to create
                this.isDirty=true
                let g = new Ghost(pieces[idx].shape, delta, bevel,new TransformNode("root"))
                g.alpha = alpha
                g.outline = outline
                g.parent.rotation=rotationVector(pieces[idx].rotationIndex)
                g.render()
                this.pieces.push(g)
            }
            else if (pieces[idx].shape.stateString != this.pieces[idx].voxel.stateString) {
                this.isDirty=true
                // different shape, delete
                let p = this.pieces[idx].parent
                this.pieces[idx].dispose()
                // and replace
                let g = new Ghost(pieces[idx].shape, delta, bevel, p)
                g.alpha = alpha
                g.outline = outline
                g.parent.rotation=rotationVector(pieces[idx].rotationIndex)
                g.render()
                this.pieces[idx] = g
            }
            else {
                // same shape, same index. check and set rotation
                let g=this.pieces[idx]
                if (g.rotationIndex != pieces[idx].rotationIndex) {
                    this.isDirty=true
                    g.rotationIndex = pieces[idx].rotationIndex
                }
            }
        }
        // now delete extra pieces in old situation
        for (let i = pieces.length; i<this.pieces.length; i++) {
            this.isDirty=true
            let p = this.pieces[i].parent
            this.pieces[i].dispose()
            p.dispose()
        }
        // and trim the cache to the correct length
        this.pieces.length = pieces.length
    }

    setOptions(options) {
        // Performance : only process changes
        var { pieces = [], pieceColors = [], movePositions = [], move=0, delta = 0, bevel = 0, alpha = 1, outline = true } = options
        this.isDirty=false
        // Build the ghosts in this.pieces
        this.buildGhosts(options)
        // Process movePositions and build the player animation
        this.movePositions = movePositions
        // Build the animation
        this.animationGroup = this.buildAnimationGroup()
        // Patch the colors
        for (let idx in this.pieces) {
            this.pieces[idx].mesh.material.diffuseColor=Color3.FromHexString(pieceColors[idx])
        }

        // position the animation at frame of "move"
        this.animationGroup.play(true)
        this.animationGroup.goToFrame(move*this.frameLength)
        this.animationGroup.pause()

        // Focus the camera
        if (scene.activeCamera && this.isDirty) {
            scene.activeCamera.setTarget(this.boundingInfo.boundingBox.center);
        }
    }
}
