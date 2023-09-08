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
    Plane,
    Mesh,
    ExecuteCodeAction,
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
    _position = new Vector3(0,0,0)
    _pieceID
    playerVars={}

    get pieceID() {return this._pieceID}
    set pieceID(val) { this._pieceID = val}
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
        this._rotationIndex = Number(idx); 
        this.parent.rotation=rotationVector(this._rotationIndex)
    }
    get position() { return this._position }
    set position(vec) { 
        this._position = vec
        this.parent.position = vec
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
        this.mesh.metadata=this
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
        hole.parent = null
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
        }
        return true
    }
}

export class sceneBuilder {
    result
    pieces=[] // these are Ghosts
    _movePositions=[]
    _isDirty=true // means there is a change to the base solution sequence (pieces of positions changed)
    delta
    bevel
    alpha
    outline
    pieceID
    stateCallback
    worldMap
    _frame
    _animationGroup = new AnimationGroup("solutionPlayer")
    _framerate=25 // frames per second
    _moveTime=1.5 // time in seconds to make a move
    _movePause=0.5 // pause time between moves in seconds
    playerVars={myPlayMode: true}

    constructor(sc, callbackFunction, options = {}) {
        scene = sc
        this.stateCallback=callbackFunction
        const rootNode = new TransformNode("root");
        rootNode.position=new Vector3(0,0,0)
        this.result=new Ghost(new Voxel({}), 0, 0, rootNode)
        // keep track of the animation and update the frame accordingly
        scene.registerBeforeRender( () => {
            let gf = this.getFrame()
            if (gf >=0) {
                if (this.frame != gf) {
                    this.frame = gf
                }
            }
        })

        // react to mouse events
        scene.onPointerDown = (evt, result) => {
            switch (true) {
                case (result.hit && evt.button==0 && this.playerVars.myPlayMode) :
                    // calculate the pickingPlane
                    this.playerVars.pickedMesh=result.pickedMesh
                    this.playerVars.pickedPoint=result.pickedPoint
                    this.playerVars.pickedMeshStartingPosition = result.pickedMesh.parent.position
                    this.playerVars.holdingX=scene.pointerX
                    this.playerVars.holdingY=scene.pointerY
                    this.playerVars.pickingPoint=result.pickedPoint
                    this.playerVars.translationDistance = 0
                    this.playerVars.maxDistance = {}

                    let cameraNormal = scene.activeCamera.getDirection(Vector3.Forward())
                    let planeX=new Plane(1,0,0, -1*result.pickedPoint.x)
                    this.playerVars.pickingPlane = planeX
                    let dotX = Math.abs(Vector3.Dot(planeX.normal, cameraNormal))
                    let maxDot=dotX
                    let planeY=new Plane(0,1,0, -1*result.pickedPoint.y)
                    let dotY= Math.abs(Vector3.Dot(planeY.normal, cameraNormal))
                    if (dotY > maxDot) {
                        maxDot = dotY; this.playerVars.pickingPlane = planeY
                    }
                    let planeZ=new Plane(0,0,1, -1*result.pickedPoint.z)
                    let dotZ= Math.abs(Vector3.Dot(planeZ.normal, cameraNormal))
                    if (dotZ > maxDot) {
                        maxDot = dotZ; this.playerVars.pickingPlane = planeZ
                    }
                    scene.activeCamera.detachControl()
                    break       
                default:
                    this.playerVars.pickedMesh = undefined
            }
        }
        scene.onPointerMove = (evt, result) => {
            //
            // Shape Dragging logic
            //
            if (this.playerVars.myPlayMode == true && this.playerVars.pickedMesh ) {
                // calculate the translation vector
                let ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), scene.activeCamera)
                let rayDistance = ray.intersectsPlane(this.playerVars.pickingPlane)
                let pickingPoint = ray.origin.add(ray.direction.scale(rayDistance))
                let translation = pickingPoint.subtract(this.playerVars.pickedPoint)

                // Check along which axis we should be dragging.
                // Only check if we do not know this yet.
                if (!this.playerVars.draggingAxis) {
                    let vecX=new Vector3(1,0,0)
                    this.playerVars.draggingAxis = vecX
                    let dotX = Math.abs(Vector3.Dot(vecX, translation))
                    let maxDot=dotX

                    let vecY=new Vector3(0,1,0)
                    let dotY = Math.abs(Vector3.Dot(vecY, translation))
                    if (dotY > maxDot) {
                        maxDot = dotY; this.playerVars.draggingAxis=vecY
                    }

                    let vecZ=new Vector3(0,0,1)
                    let dotZ= Math.abs(Vector3.Dot(vecZ, translation))
                    if (dotZ > maxDot) {
                        maxDot = dotZ; this.playerVars.draggingAxis=vecZ
                    }
                    let draggingDistance = Vector3.Dot(this.playerVars.draggingAxis, translation)
                    if (! this.worldMap.canMove([this.playerVars.pickedMesh.metadata.pieceID], this.playerVars.draggingAxis.scale(Math.sign(draggingDistance)))) {
                        delete this.playerVars.draggingAxis
                    }                    
                }

                // translate
                if (this.playerVars.draggingAxis) {
                    let draggingDistance = Vector3.Dot(this.playerVars.draggingAxis, translation)
                    if (this.worldMap.canMove([this.playerVars.pickedMesh.metadata.pieceID], this.playerVars.draggingAxis.scale(Math.sign(draggingDistance)*Math.ceil(Math.abs(draggingDistance))))) {
                        if (this.playerVars.maxDistance[Math.sign(draggingDistance)] == undefined) this.playerVars.translationDistance = draggingDistance
                        else this.playerVars.translationDistance = Math.sign(draggingDistance)*Math.min(this.playerVars.maxDistance[Math.sign(draggingDistance)], Math.abs(draggingDistance))
                        this.playerVars.pickedMesh.parent.position = this.playerVars.pickedMeshStartingPosition.add(this.playerVars.draggingAxis.scale(this.playerVars.translationDistance))
                    } 
                    else {
                        // KG. We hit a barrier, move no further. Logic needs to be reviewed I think.
                        if (this.playerVars.maxDistance[Math.sign(draggingDistance)] == undefined) {
                            this.playerVars.maxDistance[Math.sign(draggingDistance)]=(Math.ceil(Math.abs(draggingDistance)) - 1)
                            this.playerVars.translationDistance = Math.sign(draggingDistance)*Math.min(this.playerVars.maxDistance[Math.sign(draggingDistance)], Math.abs(draggingDistance))
                            this.playerVars.pickedMesh.parent.position = this.playerVars.pickedMeshStartingPosition.add(this.playerVars.draggingAxis.scale(this.playerVars.translationDistance))
                        }
                    }
                }
            }
        }
        scene.onPointerUp = (evt, result) => {
            if (this.playerVars.draggingAxis) {
                    this.playerVars.translationDistance = Math.round(this.playerVars.translationDistance)
                    this.playerVars.pickedMesh.parent.position = this.playerVars.pickedMeshStartingPosition.add(this.playerVars.draggingAxis.scale(this.playerVars.translationDistance))
                    // update the worldmap
                    let oldMap = this.worldMap.filter(this.playerVars.pickedMesh.metadata.pieceID)
                    oldMap.translate(this.playerVars.draggingAxis.scale(this.playerVars.translationDistance))
                    this.worldMap.delete(this.playerVars.pickedMesh.metadata.pieceID)
                    this.worldMap.place(oldMap)
                // cleanup
            }
            this.playerVars={myPlayMode: true}
            scene.activeCamera.attachControl(scene.getEngine().getRenderingCanvas())
        }
    }
    get frame() {
        return this._frame
    }
    set frame(val) {
        this._frame=val
    }
    getFrame() { 
        let f = this.animationGroup.animatables[0]?.masterFrame
        if (!isNaN(f)) f = Math.floor(f + 0.001)
        return f
    }
    get move() {
        return this._frame?Math.floor(this._frame/this.frameLength):0
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
        if (this.animationGroup.uniqueId != ag.uniqueId) {
            this._animationGroup.stop()
            this._animationGroup.dispose()
            this._animationGroup = ag 
        }
    }
    get boundingInfo() {
        let min = undefined
        let max = undefined
        for(let i in this.pieces){
            this.pieces[i].mesh.computeWorldMatrix(true)
            let meshMin = this.pieces[i].mesh.getBoundingInfo().boundingBox.minimumWorld;
            let meshMax = this.pieces[i].mesh.getBoundingInfo().boundingBox.maximumWorld;
            min = Vector3.Minimize(min?min:meshMin, meshMin);
            max = Vector3.Maximize(max?max:meshMax, meshMax);
        }
        return new BoundingInfo(min,max)
    }
    buildAnimationGroup(options) {
        var { puzzle, solution, problem, delta = 0, bevel = 0, alpha = 1, outline = true } = options
        if (this.isDirty && this.movePositions) {
            let mp = this.movePositions
            let solutionAnimationGroup = new AnimationGroup("solutionPlayer")
            let positionKeyList= Array.from(Array(solution.pieceNumbers.length), () => [])
            let animationList=Array.from(Array(solution.pieceNumbers.length), (val, idx) => new Animation("pieceAnimation"+idx, "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE))
            let easingFunction = new QuadraticEase()
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT)
            // build animations
            // build the keyframe list for every piece
            for (let pieceIdx in solution.pieceNumbers) {
                // pieceIdx is sequential, need to map using solution.pieceNumbers[pieceIdx] to get the shapeID to use in this.pieces[]
                for (let moveIdx in mp) {
                    // for every move, add a frame to the piece for that move
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
                solutionAnimationGroup.addTargetedAnimation(animationList[pieceIdx], this.pieces[solution.pieceNumbers[pieceIdx]].parent)
            }
            return solutionAnimationGroup
        } 
        else return this._animationGroup
    }
    get isDirty() { return this._isDirty }
    set isDirty(b) { this._isDirty = b}
    get state() { return { stateString: this.grid.voxel.stateString, size: {x:this.grid.voxel.x,y:this.grid.voxel.y,z:this.grid.voxel.z}}}

    buildGhosts(options) {
        var { puzzle, solution, problem, delta = 0, bevel = 0, alpha = 1, outline = true } = options
        // turn the pieces (voxel data) into ghosts (3D representations)
        // rotate to the correct position
        let pieceMap = solution?solution.pieceMap:[]
        if (solution) {
            for (let idx of solution.pieceNumbers) {
                let shapeID=problem.shapeMap[idx]
                let shape=puzzle.shapes.voxel[shapeID]
                if (!this.pieces[idx]) {
                    // new piece, need to create
                    this.isDirty=true
                    let g = new Ghost(shape, delta, bevel,new TransformNode("root"))
                    g.alpha = alpha
                    g.outline = outline
                    g.pieceID = idx
                    g.rotationIndex = pieceMap[idx].rotation
                    g.position = new Vector3(pieceMap[idx].position.x, pieceMap[idx].position.y, pieceMap[idx].position.z)
                    g.render()
                    this.pieces[idx]=g
                }
                else if (shape.stateString != this.pieces[idx].voxel.stateString) {
                    this.isDirty=true
                    // different shape, delete
                    let p = this.pieces[idx].parent
                    this.pieces[idx].dispose()
                    // and replace
                    let g = new Ghost(shape, delta, bevel, p)
                    g.alpha = alpha
                    g.outline = outline
                    g.pieceID = idx
                    g.rotationIndex = pieceMap[idx].rotation
                    g.position = new Vector3(pieceMap[idx].position.x, pieceMap[idx].position.y, pieceMap[idx].position.z)
                    g.render()
                    this.pieces[idx] = g
                }
                else {
                    // same shape, same index. check and set rotation
                    let g=this.pieces[idx]
                    if (g.rotationIndex != pieceMap[idx].rotation) {
                        this.isDirty=true
                        g.pieceID = idx
                        g.position = new Vector3(pieceMap[idx].position.x, pieceMap[idx].position.y, pieceMap[idx].position.z)
                        g.rotationIndex = pieceMap[idx].rotation
                    }
                }
            }
        }
        // now delete extra pieces in old situation
        console.log(this.pieces)
        for ( let idx in this.pieces ) {
            if (  !(idx in pieceMap) ) {
                this.isDirty=true
                let p = this.pieces[idx].parent
                this.pieces[idx].dispose()
                p.dispose()
                delete this.pieces[idx]
            }
        }
    }

    execute(action, options) {
        switch (action) {
            case "pause":
                this.animationGroup.pause()
                break
            case "play":
                this.animationGroup.play(true)
                break
            case "stop":
                this.animationGroup.stop()
                break
            case "reset":
                this.animationGroup.play(true)
                this.animationGroup.goToFrame(0)
                this.animationGroup.pause()
                break
            case "move":
                this.animationGroup.play(true)
                this.animationGroup.goToFrame(options.move*this.frameLength)
                this.animationGroup.pause()
                break
            case "next":
                let p = this.animationGroup.isPlaying
                if (!p) this.animationGroup.play(true)
                if (this.move >= 0) this.animationGroup.goToFrame((this.move+1)*this.frameLength)
                if (!p) this.animationGroup.pause()
                break
            case "previous":
                let pl = this.animationGroup.isPlaying
                let targetMove = Math.floor( (this.frame-1 - this._framerate*0.5)/this.frameLength)
                if (targetMove < 0 ) targetMove=0
                if (!pl) this.animationGroup.play(true)
                this.animationGroup.goToFrame(targetMove*this.frameLength)
                if (!pl) this.animationGroup.pause()
                break
            default:
                console.log("SolutionSummary: unknown action", action)
        }
    }

    setOptions(options) {
        var { puzzle, solution, problem, pieceColors = [], delta = 0, bevel = 0, alpha = 1, outline = true } = options
        this.isDirty=false
        // Build the ghosts in this.pieces
        this.buildGhosts(options)
        // if there is no solution, there is nothing more to do. Return.
        if (!solution) return
        // Process movePositions and build the player animation
        this.movePositions = solution.separation[0]?solution.separation[0].movePositionsAll:undefined
        // Build the animation
        this.animationGroup = this.buildAnimationGroup(options)
        // Patch the colors
        // pieceColors is a sequential array [0,1,2,3]
        // this.pieces is a sparse array [(), (), ghost0, (), ghost1, (), (), (), ghost2, ...]
        // use solution.pieceNumbers[] to map sequential to sparse
        for (let idx in pieceColors) {
            this.pieces[solution.pieceNumbers[idx]].mesh.material.diffuseColor=Color3.FromHexString(pieceColors[idx].color)
        }

        // position the animation at frame of "move"
        if (this.isDirty) this.execute("move", { move: 0 })

        // Focus the camera
        if (scene.activeCamera && this.isDirty) {
            scene.activeCamera.setTarget(this.boundingInfo.boundingBox.center);
        }

        // build the worldMap
        if (this.isDirty) this.worldMap = puzzle.getWorldMap({solution: solution, problem: problem})
    }
}

/*
Requirements for interactive puzzle solver
------------------------------------------
- each mesh must be able to construct his proper worldmap.
  To do that, it must know his own:
  + pieceID (for the value in the worldmap)
  + voxel (to know the shape it occupies in the worldmap)
  + rotation (found in the ghost, based on solution assembly)
  + position (found on the ghost root, can change during gameplay)
- only the position is dynamic
- store the ghost in mesh.metadata, so babylonjs can access the above context
  + Get the worldmap from the voxel, with value of pieceID
        let g = mesh.metadata
        let map=g.voxel.getWorldMap(g.pieceID)
  + Translate and rotate it to the correct place
        map.rotate(g.rotationIndex)
        map.translate(g.position)
- We need to find a way to transform a worldmap into a "state" for comparing map identity
- The full worldmap needs to be calculated as well. Meshes do not have access to the external context
  + the scenebuilder has that visibility, so this needs to be done there.
  + put the mouse handler code not on the meshes, but on the sceneBuilder level

*/
