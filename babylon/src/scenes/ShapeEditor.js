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
  HighlightLayer
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";
import { Voxel } from "@kgeusens/burr-data"

var scene
var BoxMaterials
var ControlMaterials
var advancedTexture

class Box {
    //position
    _parentGrid={}
    _position={x:0, y:0, z:0}
    _isActive=true // is it pickable/editable?
    _isHighlighted=false // is it highlighted?
    _isVisible=true // is it Visible?
    _mesh=null
    _readOnly=false
    _offset=0
    get materials() { return BoxMaterials }
    get x() { return this._position.x }
    get y() { return this._position.y }
    get z() { return this._position.z }
    get readOnly() { return this._readOnly}
    set readOnly(b) { this._readOnly = b }
    get state() {
        let vp = this._parentGrid.voxel.getVoxelPosition(this.x, this.y, this.z)
        return vp ? vp.state : 0
    }
    set state(s) {
        s%=3;
        this._parentGrid.voxel.getVoxelPosition(this.x, this.y, this.z).state = s
        return s
    }
    constructor(x=0,y=0,z=0,parentGrid, parent) {
        this._parentGrid=parentGrid
        this._position = {x:x, y:y, z:z}
        this._mesh=MeshBuilder.CreateBox("box", {size:1-2*this._offset}, scene)
        if (parent) this._mesh.parent=parent
        this._mesh.position=new Vector3(x, y, z)

        this._mesh.actionManager = new ActionManager(scene);
        this._mesh.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnLeftPickTrigger, (evt) => {
                    if (this.readOnly) return
                    x=evt.source.position.x
                    y=evt.source.position.y
                    z=evt.source.position.z
                    this.state+=1;
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
    render(readOnly=this.readOnly) {
        this.readOnly=readOnly
        let type=readOnly?"RO":"RW"
        let m=this.materials[type][this.state].material
        this._mesh.isVisible=this._isVisible
        this._mesh.material=m
        this._mesh.isPickable=(this._isActive && !readOnly) || (readOnly && m.alpha == 1)
        if (readOnly) {
            this._mesh.disableEdgesRendering()
        } else {
            if (this._isActive) {
                this._mesh.enableEdgesRendering()
            } else { 
                this._mesh.material=this.materials["HIDDEN"][this.state].material
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
} // end of class Box

class Grid {
    // dimension of grid
    _dimensions={x:0, y:0, z:0}
    _voxel=null
    _boxes=[] // will become a 3 dimensional array [x][y][z]
    _layerIsActive={x:[false], y:[false], z:[false]}
    _readOnly=true
    _parent=null
    _controls=null
    get x() { return this._dimensions.x }
    set x(v) { this._dimensions.x = v}
    get y() { return this._dimensions.y }
    set y(v) { this._dimensions.y = v}
    get z() { return this._dimensions.z }
    set z(v) { this._dimensions.z = v}
    get dimensions() { return this._dimensions }
    set dimensions(obj) { this._dimensions = obj }
    get parent() { return this._parent }
    set parent(p) { this._parent = p}
    get readOnly() { return this._readOnly }
    set readOnly(b) { this._readOnly = b; this.render() }

    constructor(voxel, parent=null) {
        this.parent=parent
        this._voxel=voxel
        this._controls = new GridControls(this)
    }
    set voxel(voxel) {
        this._voxel=voxel
        this.setSize(voxel.x, voxel.y, voxel.z)
        this.render()
        this._controls.setSize(voxel.x, voxel.y, voxel.z)
        this._controls.render()
    }
    get voxel() { return this._voxel }
    setSize(x, y, z) {
        this.x=x*1; this.y=y*1; this.z=z*1
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
                        this._boxes[x][y][z]=new Box(x,y,z,this, this.parent)
                    }
                }
            }
        }
        if (scene.activeCamera) scene.activeCamera.setTarget(new Vector3((this.x-1)/2, (this.y-1)/2, (this.z-1)/2));
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
                        this._boxes[x][y][z].render(this.readOnly)
                    }
                }
            }
        }
//            this._controls.render()
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
                    this._boxes[x][y][z].state=state
                } 
            }
        }
    }
} // end of class Grid

class GridControls {
    _grid=null
//        _dimensions={x:0, y:0, z:0}
    _controlSize=0.3
    _offsetControls=0.3/2 + 0.5
    _controls={x:[], y:[], z:[], origin:null, scalers:{x:null, y:null, z:null}, axis:{x:null, y:null, z:null}, scalerLabels:{x:null, y:null, z:null}}
    get dimensions() { return this._grid.dimensions }
    set dimensions(obj) { this._grid.dimensions = obj}
    get materials() { return ControlMaterials }
    get x() { return this.dimensions.x }
    set x(val) { this.dimensions.x=val }
    get y() { return this.dimensions.y }
    get z() { return this.dimensions.z }
    get parent() { return this._grid.parent }
    get readOnly() { return this._grid.readOnly}
    set readOnly(b) { this._grid.readOnly = b; this.render()}
    reSize(axisName, newSize) { 
        this.dimensions[axisName]=newSize
        this._grid.setSize(this.x, this.y, this.z)
        this.setSize(this.x, this.y, this.z)
    } 
    setSize(x, y, z) {
        for (let axis of ["x","y","z"]) {
            for (let idx=0; idx < this.dimensions[axis];idx++) {
                // create the layer selectors (only) if needed
                if (this._controls[axis][idx] == undefined) { 
                    this._controls[axis][idx]=MeshBuilder.CreateBox("box", {width:this._controlSize, height:0.1, depth:this._controlSize}, scene)
                    this._controls[axis][idx].parent=this.parent
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
                                this._grid.render()
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
        // The layer selectors (created in setSize)
//            this.setSize(grid.x, grid.y, grid.z)
        // The Origin
        this._controls.origin=MeshBuilder.CreateSphere("origin", {diameter:this._controlSize} , scene)
        this._controls.origin.parent=this.parent
        let m=this.materials.origin.material
        this._controls.origin.material=m
        this._controls.origin.position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
        this._controls.origin.actionManager = new ActionManager(scene);
        this._controls.origin.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnLeftPickTrigger, (evt) => {
                    if (scene.activeCamera) scene.activeCamera.setTarget(new Vector3(this.parent.position.x+(this.x-1)/2, this.parent.position.y+(this.y-1)/2, this.parent.position.z+(this.z-1)/2));
                }
            )
        )
        this._controls.origin.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnRightPickTrigger, (evt) => {
                    this.readOnly=!this.readOnly
                }
            )
        )
        // The Axis
        for (let axis of ["x","y","z"]) {
            this._controls.axis[axis]=MeshBuilder.CreateCylinder("axis_"+axis, {diameter:this._controlSize/5, height:1}, scene)
            this._controls.axis[axis].parent=this.parent
            this._controls.axis[axis].material = this.materials[axis].material
            this._controls.axis[axis].setPivotMatrix(Matrix.Translation(0,0.5,0), false);
            this._controls.axis[axis].position=new Vector3(-this._offsetControls, -this._offsetControls, -this._offsetControls)
            this._controls.axis[axis].rotation = this.materials[axis].rotation
            this._controls.axis[axis].scaling = new Vector3(1,this.dimensions[axis]+this._offsetControls,1)
        }
        // The Scalers
        for (let axis of ["x","y","z"]) {
            this._controls.scalers[axis]=MeshBuilder.CreateCylinder("scaler_"+axis, {diameterBottom:this._controlSize, diameterTop:0, height:0.5}, scene)
            this._controls.scalers[axis].parent=this.parent
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
                    this._grid.render()
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
    }
    setLabel(axis, text) {
        let l=this._controls.scalerLabels[axis].getChildByName("label")
        l.text=axis+ " : " + text
    }
    render() {
        for (let axis of ["x","y","z"]) {
            // resize the axis
            let scale = 0 + this.dimensions[axis] + this._offsetControls
            this._controls.axis[axis].scaling = new Vector3(1,scale,1)
            // move the scalers to the end of the axis
            let p=this._controls.scalers[axis].getPositionExpressedInLocalSpace()
            this._controls.scalers[axis].setPositionWithLocalVector(new Vector3(p.x, this.dimensions[axis], p.z))
            this._controls.scalers[axis].isVisible=!this.readOnly
            // show/hide the layer selectors
            for (let idx=0;idx<this._controls[axis].length;idx++) {
                this._controls[axis][idx].isVisible=(idx < this.dimensions[axis] && !this.readOnly)
                if (this._grid._layerIsActive[axis][idx]) {
                    this._controls[axis][idx].material = this.materials.layerSelected.material
                } else {
                    this._controls[axis][idx].material = this.materials[axis].material
                }
            }
        }
    }
} // end of class GridControls


export class sceneBuilder {
    grid
//    scene
//    rootNode
    constructor(sc, options = {}) {
        scene = sc
        BoxMaterials={
            RW: 
            [   
                {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)}, // empty
                {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(0, 1, 0)}, // filled
                {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(1, 1, 0)}, // variable
            ],  
            RO: 
            [   
                {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)},
                {material: new StandardMaterial("myMaterial", scene), alpha: 1, color: new Color3(0, 1, 0)},
                {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 1, 0)},
            ],
            HIDDEN: 
            [   
                {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 0, 0)},
                {material: new StandardMaterial("myMaterial", scene), alpha: 0.2, color: new Color3(0, 1, 0)},
                {material: new StandardMaterial("myMaterial", scene), alpha: 0, color: new Color3(1, 1, 0)},
            ]
        };
        for (let i=0; i<3;i++) {
            for (let type in BoxMaterials) {
                BoxMaterials[type][i].material.diffuseColor = BoxMaterials[type][i].color
                BoxMaterials[type][i].material.alpha = BoxMaterials[type][i].alpha
            }
        }
        advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("BurrUI");
        advancedTexture.layer.layerMask=1
        ControlMaterials={ x: {material: new StandardMaterial("xMaterial", scene), alpha: 1, color: new Color3(1, 0, 0), rotation: new Vector3(0,0,-Math.PI/2)},
                        y: {material: new StandardMaterial("yMaterial", scene), alpha: 1, color: new Color3(0, 1, 0), rotation: new Vector3(0,0,0)},
                        z: {material: new StandardMaterial("zMaterial", scene), alpha: 1, color: new Color3(0, 0, 1), rotation: new Vector3(Math.PI/2,0,0)},
                        origin: {material: new StandardMaterial("originMaterial", scene), alpha: 1, color: new Color3(1, 1, 1)},
                        layerSelected: {material: new StandardMaterial("originMaterial", scene), alpha: 1, color: new Color3(1, 1, 0)},
                    };
        for (let i in ControlMaterials) {
                ControlMaterials[i].material.diffuseColor = ControlMaterials[i].color
        }
        const rootNode = new TransformNode("root");
        rootNode.position=new Vector3(0,0,0)
        this.grid=new Grid(new Voxel({}), rootNode)
        this.setOptions(options)
    }
    setOptions(options) {
        this.grid.voxel = new Voxel(options.shape);
        this.grid.render()
    }
}
