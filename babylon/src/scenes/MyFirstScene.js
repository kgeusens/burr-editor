import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  HemisphericLight,
  TransformNode,
  ActionManager,
  ExecuteCodeAction,
  Matrix,
  PointerDragBehavior,
  PointerEventTypes,
  HighlightLayer
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";
import { Voxel } from "@kgeusens/burr-data"

var grid
export function setShape(s) { grid.voxel = new Voxel(s);grid.render() }
export function getShape() { return grid }
export const createScene = (canvas) => {
  const engine = new Engine(canvas);
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new ArcRotateCamera("camera1", 0, 0, 15, new Vector3(0,0,0), scene);
    camera.layerMask=1

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // 
    var light = new HemisphericLight("light", new Vector3(0, 0, 1), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

// Fix for conversion to rightHanded. Swap axis, and change up position
    scene.useRightHandedSystem = true
    camera.upVector=Vector3.Forward()
    camera.setPosition(new Vector3(0, -15, 15))
    camera.wheelPrecision=40

// From here on we have the visual representation using Babylonjs.
// Box maps to the voxels. Clicking the box changes the state (empty->filled->variable->empty...)
    const BoxMaterials={RW: [   {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)}, // empty
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(0, 1, 0)}, // filled
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(1, 1, 0)}, // variable
                                ],  
                        RO: [ {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)},
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(0, 1, 0)},
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 1, 0)},
                        ],
                        HIDDEN: [   {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)},
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 0.2, color: new Color3(0, 1, 0)},
                                    {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 1, 0)},
                ]};
    for (let i=0; i<3;i++) {
        for (let type in BoxMaterials) {
            BoxMaterials[type][i].material.diffuseColor = BoxMaterials[type][i].color
            BoxMaterials[type][i].material.alpha = BoxMaterials[type][i].alpha
        }
    }
    class Box {
        //position
        _position={x:0, y:0, z:0}
        _isActive=true // is it pickable/editable?
        _isHighlighted=false // is it highlighted?
        _isVisible=true // is it Visible?
        _mesh=null
        _stateObject=null
        _readOnly=false
        _offset=0
        get materials() { return BoxMaterials }
        get x() { return this._position.x }
        get y() { return this._position.y }
        get z() { return this._position.z }
        constructor(x=0,y=0,z=0,state, parent) {
            this._position = {x:x, y:y, z:z}
            this._stateObject=state
            this._mesh=MeshBuilder.CreateBox("box", {size:1-2*this._offset}, scene)
            if (parent) this._mesh.parent=parent
            this._mesh.position=new Vector3(x, y, z)

            this._mesh.actionManager = new ActionManager(scene);
            this._mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnLeftPickTrigger, (evt) => {
                        if (this._readOnly) return
                        x=evt.source.position.x
                        y=evt.source.position.y
                        z=evt.source.position.z
                        this._stateObject.state+=1;
                        this._stateObject.state%=3;
                        this.render()
                    }
                )
            )
            this._mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPointerOverTrigger, (evt) => {
                            this.highlight("highlightBox", true)
                    }
                )
            )
            this._mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPointerOutTrigger, (evt) => {
                            this.highlight("highlightBox", false)
                    }
                )
            )
        }
        render(readOnly=this._readOnly) {
            this._readOnly=readOnly
            let type=readOnly?"RO":"RW"
            let m=this.materials[type][this._stateObject.state].material
            this._mesh.isVisible=this._isVisible
            this._mesh.material=m
            this._mesh.isPickable=(this._isActive && !readOnly) || (readOnly && m.alpha == 1)
            if (readOnly) {
                this._mesh.disableEdgesRendering()
            } else {
                if (this._isActive) {
                    this._mesh.enableEdgesRendering()
                } else { 
                    this._mesh.material=this.materials["HIDDEN"][this._stateObject.state].material
                    this._mesh.disableEdgesRendering()
                }
            }
        }
        highlight(layerName, state) {
            let hl=null
            try { hl=scene.getHighlightLayerByName(layerName)} catch {}
            if ( hl == undefined ) {hl = new HighlightLayer(layerName, scene);hl.layerMask=1}
            if (state)
                hl.addMesh(this._mesh, Color3.White(), true)
            else
                hl.removeMesh(this._mesh)
        }
        setState(val) {
            this._stateObject.state=val;
            this._stateObject.state%=3;
        }
    }

    class Grid {
        // dimension of grid
        _dimensions={x:0, y:0, z:0}
        _voxel=null
        _boxes=[] // will become a 3 dimensional array [x][y][z]
        _layerIsActive={x:[false], y:[false], z:[false]}
        _readOnly=true
        _parent=null
        get x() { return this._dimensions.x }
        get y() { return this._dimensions.y }
        get z() { return this._dimensions.z }
        constructor(voxel = { "@attributes" : {x: 1, y: 1, z: 1}} , parent=null) {
            this._parent=parent
            this.voxel =voxel
        }
        set voxel(voxel) {
            this._voxel=voxel
            this.setSize(voxel.x, voxel.y, voxel.z)
            this.render()
        }
        setSize(x, y, z) {
            this._dimensions = {x:x, y:y, z:z}
            this._voxel.setSize(this.x,this.y,this.z)
            for (let x=0;x<=this.x-1;x++) {
                this._layerIsActive.x[x]=false
                if (this._boxes[x] == undefined) this._boxes[x]=[];
                for (let y=0;y<=this.y-1;y++) {
                this._layerIsActive.y[y]=false
                    if (this._boxes[x][y] == undefined) this._boxes[x][y]=[];
                    for (let z=0;z<=this.z-1;z++) {
                        this._layerIsActive.z[z]=true
                        if (this._boxes[x][y][z] == undefined) { 
                            this._boxes[x][y][z]=new Box(x,y,z,this._voxel.getVoxelPosition(x,y,z), this._parent)
                        }
                    }
                }
            }
        }
        render() {
            let cx=this._layerIsActive.x.length;
            let cy=this._layerIsActive.y.length;
            let cz=this._layerIsActive.z.length
            for (let x=0;x<cx;x++) {
                for (let y=0;y<cy;y++) {
                    for (let z=0;z<cz;z++) {
                        if ( this._boxes[x] !== undefined && this._boxes[x][y] !== undefined && this._boxes[x][y][z] !== undefined) {
                            this._boxes[x][y][z]._isVisible=( x < this.x && y < this.y && z < this.z )
                            this._boxes[x][y][z]._isActive= ( this._layerIsActive.x[x] || this._layerIsActive.y[y] || this._layerIsActive.z[z])
                            this._boxes[x][y][z].render(this._readOnly)
                        }
                    }
                }
            }
        }
        highlight(layerName, layerNumber=0, state=false) {
            // if layerName is not either "x" or "y" or "z" the highlight will apply to the full grid
            let xmin=(layerName=="x")?layerNumber:0;
            let ymin=(layerName=="y")?layerNumber:0;
            let zmin=(layerName=="z")?layerNumber:0
            let xmax=(layerName=="x")?layerNumber:this.x-1
            let ymax=(layerName=="y")?layerNumber:this.y-1
            let zmax=(layerName=="z")?layerNumber:this.z-1
            for (let x=xmin;x<=xmax;x++) {
                for (let y=ymin;y<=ymax;y++) {
                    for (let z=zmin;z<=zmax;z++) {
                        this._boxes[x][y][z].highlight("highlightGrid", state)
                    } 
                }
            }
        }
        setLayerState(layerName, layerNumber=0, state=0) {
            // if layerName is not either "x" or "y" or "z" the state will apply to the full grid
            let xmin=(layerName=="x")?layerNumber:0;
            let ymin=(layerName=="y")?layerNumber:0;
            let zmin=(layerName=="z")?layerNumber:0
            let xmax=(layerName=="x")?layerNumber:this.x-1
            let ymax=(layerName=="y")?layerNumber:this.y-1
            let zmax=(layerName=="z")?layerNumber:this.z-1
            for (let x=xmin;x<=xmax;x++) {
                for (let y=ymin;y<=ymax;y++) {
                    for (let z=zmin;z<=zmax;z++) {
                        this._boxes[x][y][z].setState(state)
                    } 
                }
            }
        }
    } // end of class Grid

    var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("BurrUI");
    advancedTexture.layer.layerMask=1
    const ControlMaterials={ x: {material: new StandardMaterial("xMaterial", scene), alpha: 1, color: new Color3(1, 0, 0), rotation: new Vector3(0,0,-Math.PI/2)},
                    y: {material: new StandardMaterial("yMaterial", scene), alpha: 1, color: new Color3(0, 1, 0), rotation: new Vector3(0,0,0)},
                    z: {material: new StandardMaterial("zMaterial", scene), alpha: 1, color: new Color3(0, 0, 1), rotation: new Vector3(Math.PI/2,0,0)},
                    origin: {material: new StandardMaterial("originMaterial", scene), alpha: 1, color: new Color3(1, 1, 1)},
                    layerSelected: {material: new StandardMaterial("originMaterial", scene), alpha: 1, color: new Color3(1, 1, 0)},
                };
    for (let i in ControlMaterials) {
            ControlMaterials[i].material.diffuseColor = ControlMaterials[i].color
    }
    class GridControls {
        _grid=null
        _dimensions={x:0, y:0, z:0}
        _controlSize=0.3
        _offsetControls=0.3/2 + 0.5
        _controls={x:[], y:[], z:[], origin:null, scalers:{x:null, y:null, z:null}, axis:{x:null, y:null, z:null}, scalerLabels:{x:null, y:null, z:null}}
        _readOnly=false
        _parent=null
        get dimensions() { return this._dimensions }
        get materials() { return ControlMaterials }
        get x() { return this._dimensions.x }
        set x(val) { this._dimensions.x=val }
        get y() { return this._dimensions.y }
        get z() { return this._dimensions.z }
        reSize(axisName, newSize) { 
            this._dimensions[axisName]=newSize
            this.setSize(this.x, this.y, this.z)
        } 
        setSize(x, y, z) {
            this._dimensions={x:x, y:y, z:z}
            this._grid.setSize(x,y,z)
            for (let axis of ["x","y","z"]) {
                for (let idx=0; idx < this.dimensions[axis];idx++) {
                    // create the layer selectors (only) if needed
                    if (this._controls[axis][idx] == undefined) { 
                        this._controls[axis][idx]=MeshBuilder.CreateBox("box", {width:this._controlSize, height:0.1, depth:this._controlSize}, scene)
                        this._controls[axis][idx].parent=this._parent
                        this._controls[axis][idx].material = this.materials[axis].material
                        this._controls[axis][idx].rotation = this.materials[axis].rotation
                        this._controls[axis][idx].position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
                        this._controls[axis][idx].locallyTranslate(new Vector3(0, idx+this._offsetControls, 0))
                        this._controls[axis][idx].actionManager = new ActionManager(scene);
                        this._controls[axis][idx].actionManager.registerAction(
                            new ExecuteCodeAction(
                                ActionManager.OnLeftPickTrigger, (evt) => {
                                    this._grid._layerIsActive[axis][idx]=!this._grid._layerIsActive[axis][idx]
                                    this.render()
                                }
                            )
                        )
                        this._controls[axis][idx].actionManager.registerAction(
                            new ExecuteCodeAction(
                                ActionManager.OnPointerOverTrigger, (evt) => {
                                    this._grid.highlight(axis,idx,true)
                                }
                            )
                        )
                        this._controls[axis][idx].actionManager.registerAction(
                            new ExecuteCodeAction(
                                ActionManager.OnPointerOutTrigger, (evt) => {
                                    this._grid.highlight(axis,idx,false)
                                }
                            )
                        )
                    }
                }
            }
        }
        constructor(grid){
            this._grid=grid;
            this._readOnly=grid._readOnly
            this._parent=grid._parent
            // The layer selectors (created in setSize)
            this.setSize(grid.x, grid.y, grid.z)
            scene.activeCamera.setTarget(new Vector3((this.x-1)/2, (this.y-1)/2, (this.z-1)/2));
            // The Origin
            this._controls.origin=MeshBuilder.CreateSphere("origin", {diameter:this._controlSize} , scene)
            this._controls.origin.parent=this._parent
            let m=this.materials.origin.material
            this._controls.origin.material=m
            this._controls.origin.position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
            this._controls.origin.actionManager = new ActionManager(scene);
            this._controls.origin.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnLeftPickTrigger, (evt) => {
                        scene.activeCamera.setTarget(new Vector3(this._parent.position.x+(this.x-1)/2, this._parent.position.y+(this.y-1)/2, this._parent.position.z+(this.z-1)/2));
                    }
                )
            )
            this._controls.origin.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnRightPickTrigger, (evt) => {
                        this._readOnly=!this._readOnly
                        this._grid._readOnly=this._readOnly
                        this.render()
                    }
                )
            )
            // The Axis
            for (let axis of ["x","y","z"]) {
                this._controls.axis[axis]=MeshBuilder.CreateCylinder("axis_"+axis, {diameter:this._controlSize/5, height:1}, scene)
                this._controls.axis[axis].parent=this._parent
                this._controls.axis[axis].material = this.materials[axis].material
                this._controls.axis[axis].setPivotMatrix(Matrix.Translation(0,0.5,0), false);
                this._controls.axis[axis].position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
                this._controls.axis[axis].rotation = this.materials[axis].rotation
                this._controls.axis[axis].scaling = new Vector3(1,this.dimensions[axis]+this._offsetControls,1)
            }
            // The Scalers
            for (let axis of ["x","y","z"]) {
                this._controls.scalers[axis]=MeshBuilder.CreateCylinder("scaler_"+axis, {diameterBottom:this._controlSize, diameterTop:0, height:0.5}, scene)
                this._controls.scalers[axis].parent=this._parent
                this._controls.scalers[axis].material = this.materials[axis].material
                this._controls.scalers[axis].rotation = this.materials[axis].rotation
                this._controls.scalers[axis].position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
                this._controls.scalers[axis].locallyTranslate(new Vector3(0, this.dimensions[axis]+this._offsetControls, 0))
                var fullDistance=0; var targetP=0; var startP=0; 
                var drag = new PointerDragBehavior({dragAxis: Vector3.Up()});
                drag.validateDrag = function(pos){return false}
                drag.onDragStartObservable.add((e)=>{
                    startP=Math.round(this._controls.scalers[axis].position[axis]);
                    targetP=startP;fullDistance=0;
                    this._controls.scalerLabels[axis].isVisible=true;
                    this.setLabel(axis,targetP.toString())
                })
                drag.onDragObservable.add((e) => {
                    fullDistance+=e.dragDistance;
                    let ot=targetP;
                    targetP=(Math.max(startP+Math.sign(fullDistance)*Math.floor(Math.abs(fullDistance)),1));
                    if (ot != targetP) {
                        this.setLabel(axis,targetP.toString());
                        this.reSize(axis,targetP); 
                        this.render();
                    }
                })
                drag.onDragEndObservable.add((e)=>{
                    this.render(); 
                    this._controls.scalerLabels[axis].isVisible=false;
                    this.setLabel(axis,axis)
                })
                this._controls.scalers[axis].addBehavior(drag)
                this._controls.scalers[axis].actionManager = new ActionManager(scene);
                this._controls.scalers[axis].actionManager.registerAction(
                    new ExecuteCodeAction(
                        ActionManager.OnPointerOverTrigger, (evt) => {
//                            this._controls.scalerLabels[axis].isVisible=true;
                        }
                    )
                )
            }
            // The Scaler Labels
            for (let axis of ["x","y","z"]) {
                let lr = new Rectangle();
                let l = new TextBlock("label",axis);
                advancedTexture.addControl(lr);
                lr.linkWithMesh(this._controls.scalers[axis]);
                lr.addControl(l);
                lr.width = 0.08;
                lr.height = "40px";
                lr.cornerRadius = 20;
                lr.color = "Orange";
                lr.thickness = 4;
                lr.background = "green";
                lr.linkOffsetX = -50;
                lr.linkOffsetY = 50;
                lr.isVisible=false
                this._controls.scalerLabels[axis] = lr
            }
            this.render()
        }
        setLabel(axis, text) {
            let l=this._controls.scalerLabels[axis].getChildByName("label")
            l.text=axis+ " : " + text
        }
        render() {
            for (let axis of ["x","y","z"]) {
                // resize the axis
                this._controls.axis[axis].scaling = new Vector3(1,this.dimensions[axis]+this._offsetControls,1)
                // move the scalers to the end of the axis
                let p=this._controls.scalers[axis].getPositionExpressedInLocalSpace()
                this._controls.scalers[axis].setPositionWithLocalVector(new Vector3(p.x, this.dimensions[axis], p.z))
                this._controls.scalers[axis].isVisible=!this._readOnly
                // show/hide the layer selectors
                for (let idx=0;idx<this._controls[axis].length;idx++) {
                    this._controls[axis][idx].isVisible=(idx < this.dimensions[axis] && !this._readOnly)
                    if (this._grid._layerIsActive[axis][idx]) {
                        this._controls[axis][idx].material = this.materials.layerSelected.material
                    } else {
                        this._controls[axis][idx].material = this.materials[axis].material
                    }
                }
            }
            // render the child grid
            this._grid.render()
        }
    } // end of class GridControls

    const rootNode = new TransformNode("root");
    rootNode.position=new Vector3(0,0,0)
    grid=new Grid(new Voxel({}), rootNode)
    var controls=new GridControls(grid)
    setShape({ "@attributes" : {x: 1, y: 2, z: 3}})

    engine.runRenderLoop(() => {
    scene.render();
  });
};

// export { createScene };
