
// terraform
// Joshua A. Lemli
// 2018

"use strict";

/////////////// START
(function(){ // START
/////////////// START

console.log("terraform v0.3.1 by Joshua A. Lemli 2018")

// 2d vectors only
const normalizeVector = (v,m) => {
    let vm0 = Math.sqrt(v[0]*v[0]+v[1]*v[1])
    if (vm0 > m) {
        let a = m/vm0
        return [v[0]*a,v[1]*a]
    }
    else return v
}
// id generating functions
const _transmogrify = (digitInt) => {
    if (digitInt < 10) return digitInt.toString()
    if (digitInt < 36) return String.fromCharCode(digitInt + 87) // - 10 + 97
    return String.fromCharCode(digitInt + 29) // - 36 + 65
}
const _base10Int_to_base62String = (n) => {
    var exp = 0
    var strChars = []
    do {
        var div = Math.pow(62,exp)
        var curVal = n % (div*62)
        var digitInt = curVal / div
        strChars.push( _transmogrify(digitInt) )
        n -= curVal
        exp += 1
    } while (n > 0)
    var str = ""
    for (var i = strChars.length; i--;) str += strChars[i]
    return str
}

/* - - - - STATE - - - - */

var State = {
    gameLoopIteration: 0,
    gamePaused: false,
    menuActive: false,
    playerPanelActive: true,
    entityIdSeed: 0,
    itemIdSeed: 0,
    spriteIdSeed: 0
}

const togglePlayerPanel = (forceShow = null) => {
    let e = document.getElementById("playerInfo")
    State.playerPanelActive = forceShow !== null ? forceShow : !State.playerPanelActive
    e.style.display = State.playerPanelActive ? "flex" : "none"
}

const toggleMenu = (forceShow = null) => {
    let e = document.getElementById("menu")
    State.menuActive = forceShow !== null ? forceShow : !State.menuActive
    e.style.display = State.menuActive ? "flex" : "none"
}

/* - - - - USER INPUT HANDLER - - - - */

const UserInput = (function(){
    var keystate = {}
    var mouseX = 0, mouseY = 0
    document.addEventListener("keypress", event => {
        switch(event.key) {
            case "q": toggleMenu()
                break
            case " ": State.gamePaused = !State.gamePaused
                break
        }
    })
    document.addEventListener("keydown", event => keystate[event.key] = true)
    document.addEventListener("keyup", event => keystate[event.key] = false)
    document.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        return false;
    }, false);
    document.addEventListener("mousedown", event => keystate[`mouse${event.which}`] = true)
    document.addEventListener("mouseup", event => keystate[`mouse${event.which}`] = false)
    document.addEventListener("mousemove", event => {
        let viewInfo = CanvasArtist.currentViewInfo()
        mouseX = viewInfo.xPos - (viewInfo.xDim / 2) + (event.clientX / viewInfo.m)
        mouseY = viewInfo.yPos + (viewInfo.yDim / 2) - (event.clientY / viewInfo.m)
        if (keystate["m"]) console.log(mouseX,mouseY)
    })
    return {
        keystate: k => keystate[k] || false,
        mouse: () => new Object({x:mouseX,y:mouseY})
    }
})()


/* - - - - PLAYER PANEL - - - - */

const PlayerPanel = (function(){

    var itemElements = new Map()
    const addItemElement = (item) => {
        let container = document.createElement("div")

    }

    return {
        addItem: (item) => {

        }
    }
})()


/* - - - - CANVAS SUB-API - - - - */

const CanvasArtist = (function(){
    var canvas,context, magnification = 1, xPos = 0, yPos = 0, xDimPx = 0, yDimPx = 0
    function resizeCanvas() {
        context.canvas.width = xDimPx = canvas.offsetWidth
        context.canvas.height = yDimPx = canvas.offsetHeight
    }
    function init(event) {
        if (canvas) throw new Error("CanvasArtist module already initialized")
        canvas = document.getElementById("canvas")
        context = canvas.getContext("2d")
        resizeCanvas()
        window.addEventListener("resize",resizeCanvas)
    }
    const worldTransform = useWorld => {
        if (useWorld) context.setTransform(magnification,0,0,-magnification, xDimPx/2 - xPos*magnification, yPos*magnification + yDimPx/2)
        else context.setTransform(1,0,0,1,0,0)
    }
    const reset = () => {
        context.setTransform(1,0,0,1,0,0)
        context.clearRect(0,0,xDimPx,yDimPx)
        worldTransform(true)
    }
    const fillRect = (x,y,X,Y,fillStyle) => {
        context.fillStyle = fillStyle
        context.fillRect(x,y,X,Y)
    }
    const strokeRect = (x,y,X,Y,strokeStyle,lineWidth = 1) => {
        context.strokeStyle = strokeStyle
        context.lineWidth = lineWidth
        context.strokeRect(x,y,X,Y)
    }
    const fillCircle = (x,y,r,fillStyle) => {
        context.fillStyle = fillStyle
        context.beginPath()
        context.arc(x,y,r,0,Math.PI * 2,true)
        context.fill()
    }
    const strokeLine = (x0,y0,x1,y1,thickness,strokeStyle) => {
        context.strokeStyle = strokeStyle
        context.lineWidth = thickness
        context.beginPath()
        context.moveTo(x0,y0)
        context.lineTo(x1,y1)
        context.stroke()
    }
    const drawImage = (image,x,y,r) => {
        let L = r*2
        // context.drawImage(image, x-r, y-r, L, L)
        context.fillStyle = "#FFFFFF"
        context.fillRect(x-r,y-r,L,L)
    }
    return {
        init:init,
        reset:reset,
        worldTransform:worldTransform,
        panX: (dx) => xPos += 5 * dx,
        panY: (dy) => yPos += 5 * dy,
        zoom: (multiplier) => magnification *= multiplier,
        currentViewInfo: () => new Object({
            xDim: xDimPx/magnification,
            yDim: yDimPx/magnification,
            m: magnification,
            xPos: xPos,
            yPos: yPos,
            xDimPx: xDimPx,
            yDimPx: yDimPx
        }),
        fillRectangle:fillRect,
        outlineRectangle:strokeRect,
        fillCircle:fillCircle,
        drawImage:drawImage,
        line:strokeLine
    }
})()



/* - - - -  - - - - */

const Entities = new Map()
const Sprites = new Map()

const SpatialHash = (function(){
    const Table = new Map() // int : Map( int : Set() )
    const Ids = new Map() // id : [ xHash , yHash ]
    const CELL_SIZE = 100
    const hash = (n) => Math.floor(n/CELL_SIZE)
    const unhash = (N) => new Object({
        min: N * CELL_SIZE,
        max: N * CELL_SIZE,
        cellSize: CELL_SIZE
    })
    const add = (id,x,y) => {
        let X = hash(x)
        let Y = hash(y)
        if (!Table.has(X)) Table.set(X,new Map())
        let xRow = Table.get(X)
        if (!xRow.has(Y)) xRow.set(Y,new Set())
        let idSet = xRow.get(Y)
        idSet.add(id)
        Ids.set(id,[X,Y])
    }
    const remove = (id) => {
        let XY = Ids.get(id)
        let xRow = Table.get(XY[0])
        let idSet = xRow.get(XY[1])
        idSet.delete(id)
        Ids.delete(id)
    }
    const move = (id,x,y) => {
        let prevXY = Ids.get(id)
        let X = hash(x)
        let Y = hash(y)
        if (X !== prevXY[0] || Y !== prevXY[1]) {
            remove(id)
            add(id,x,y)
        }
    }
    const getSet = (X,Y) => {
        if (Table.has(X)) {
            let xRow = Table.get(X)
            if (xRow.has(Y)) return xRow.get(Y)
        }
        return null
    }
    const getNeighborsSimple = (x,y) => {
        let splitSize = CELL_SIZE / 2
        let xAdd = (x % CELL_SIZE > splitSize) ? 1 : -1
        let yAdd = (y % CELL_SIZE > splitSize) ? 1 : -1
        let idsArr = []
        let X = hash(x)
        let Y = hash(y)
        new Array( [X,Y], [X+xAdd,Y], [X,Y+yAdd], [X+xAdd,Y+yAdd]).forEach( XY => {
            var set = getSet(XY[0],XY[1])
            if (set) idsArr.push(...set.values())
        })
        return idsArr
    }
    return {
        add:add,
        remove:remove,
        move:move,
        getNeighbors:getNeighborsSimple,
        _hash:hash,
        _unhash:unhash
    }
})()

const SpriteFactory = (function(){
    function ShatterBeam(x0,y0,x1,y1,color) {
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
        this.color = color
    }
    ShatterBeam.prototype.draw = function() {
        let i = Math.floor(Math.random()*4)
        for (i; i--;) CanvasArtist.line(
            this.x0,
            this.y0,
            this.x1-4+Math.random()*8,
            this.y1-4+Math.random()*8,
            1,
            `rgba(${ this.color.join(",") })`
        )
        Sprites.delete(this.id)
    }
    return {
        spawn: (type,props) => {
            let sprite = null
            switch(type.toLowerCase()) {
                case "shatterbeam":
                    sprite = new ShatterBeam(props.x0,props.y0,props.x1,props.y1,props.color)
                    break
            }
            State.spriteIdSeed += 1
            sprite.id = _base10Int_to_base62String(State.spriteIdSeed)
            Sprites.set(sprite.id,sprite)
            return sprite
        }
    }
})()

const ItemFactory = (function(){

    // * * * weapon * * *
    //  prop:owner
    //  func:fire
    //  func:step
    //  func:stats - allows update of modifiable stats for GUI
    //  func:report - allows update of firing status (temperature,ammo,charge, etc)

    function ShatterRay() {
        this.range = 100
        this.cooldownRate = 0.5
        this.heatupRate = 1
        this.t = 0 // "temperature"
        this.tSafe = 55
        this.tMax = 90
        this.firing = false
        this.owner = null
    }
    ShatterRay.prototype.report = function() {
        let tPerc = this.t/this.tMax
        let values = []
        let tSafePerc = this.tSafe/this.tMax
        if (tPerc < tSafePerc) {
            if (tPerc == 0) values.push(["#00FF00",0,tSafePerc])
            else {
                values.push(["#0000FF",0,tPerc])
                values.push(["#00FF00",tPerc,tSafePerc])
            }
            values.push(["#FFFF00",tSafePerc,1])
        }
        else {
            values.push(["#0000FF",0,tPerc])
            values.push(["#FF0000",tPerc,1])
        }
        return values
    }
    ShatterRay.prototype.stats = function(update) {
        return [
            {name:"Range",key:"range",value:this.range},
            {name:"Heat Dissipation",key:"cooldownRate",value:this.range},
            {name:"Heat Generation",key:"heatupRate",value:this.range},
            {name:"Safe Ignition Temperature",key:"tSafe",value:this.range},
            {name:"Max Sustained Firing Temperature",key:"tMax",value:this.range},
        ]
    }
    ShatterRay.prototype.fire = function(x,y) {
        if ((this.firing && this.t < this.tMax) || this.t < this.tSafe) {
            this.firing = true
            this.t += this.heatupRate
            let beamProps = {
                x0:this.owner.x, y0:this.owner.y,
                x1:x, y1:y,
                color: [255,0,0,1]
            }
            let dD = [beamProps.x1-beamProps.x0, beamProps.y1-beamProps.y0]
            dD = normalizeVector(dD,this.range)
            beamProps.x1 = beamProps.x0 + dD[0]
            beamProps.y1 = beamProps.y0 + dD[1]
            SpriteFactory.spawn("ShatterBeam",beamProps)
        }
        else this.firing = false
    }
    ShatterRay.prototype.step = function() {
        if (!this.firing) {
            if (this.t > 0) {
                this.t -= this.cooldownRate
                if (this.t < 0) this.t = 0
            }
        }
        else if (!UserInput.keystate("mouse1")) this.firing = false
    }
    ShatterRay.prototype.category = "weapon"
    
    function ReactiveShield() {}
    ReactiveShield.prototype.category = "shield"


    return {
        spawn: (type) => {
            let item = null
            switch(type.toLowerCase()) {
                case "shatterray":
                    item = new ShatterRay()
                    break
            }
            State.itemIdSeed += 1
            item.id = _base10Int_to_base62String(State.itemIdSeed)
            return item
        }
    }
})()

const Dungeon = (function(){

    var Mortuary = {}


    // -- abilities: traits (properties) and behaviors (methods)

    function enable_inventory(maxItems) {
        if (this.prototype) {
            this.prototype.pickupItem = function(item) {
                if (this.items.size < this.maxItems) {
                    this.items.set(item.id,item)
                    item.owner = this
                }
            }
            this.prototype.dropItems = function(itemsArr) {

                // drop item(s) should drop an item beacon with contents = item(s)

            }
        }
        else {
            this.items = new Map()
            this.maxItems = maxItems || 1
        }
    }

    function enable_movement() {
        if (this.prototype) {
            this.prototype.move = function() {
                this.x += this.dx
                this.y += this.dy
                SpatialHash.move(this.id,this.x,this.y)
            }
        }
        else {
            this.dx = 0
            this.dy = 0
        }
    }

    // -- base classes

    function Entity(x,y,r,rMax) {
        this.x = x
        this.y = y
        this.r = r
        this.rMax = rMax
    }
    Entity.prototype.grow = function(sqUnits) {
        this.rMax = Math.sqrt( ((Math.PI * this.rMax * this.rMax) + sqUnits) / Math.PI )
    }
    Entity.prototype.heal = function(sqUnits) {
        this.r = Math.sqrt( ((Math.PI * this.r * this.r) + sqUnits) / Math.PI )
        if (this.r > this.rMax) this.r = this.rMax
    }
    Entity.prototype.takeDamage = function(sqUnits) {
        this.r = Math.sqrt( ((Math.PI * this.r * this.r) - sqUnits) / Math.PI )
        if (this.r < 1) this.perish()
    }
    Entity.prototype.perish = function() {
        Entities.delete(id)
        SpatialHash.remove(this.id)
        if (!Mortuary[this.name]) Mortuary[this.name] = 1
        else Mortuary[this.name] += 1
        console.log(`AAAAAaaarrbllchfff...gasp!  Entity id:${this.id} perished.`)
    }

    // -- specialized classes

    function SpaceMite(x,y) {
        Entity.call(this,x,y,4)
        enable_movement.call(this)
    }
    Object.assign(SpaceMite.prototype,Entity.prototype)
    enable_movement.call(SpaceMite)
    SpaceMite.prototype.name = "SpaceMite"
    SpaceMite.prototype.step = function() {
        if (Math.random() > 0.95) {
            // this.dx = Math.random()*2 - 1
            // this.dy = Math.random()*2 - 1
        }
        this.move()
    }
    SpaceMite.prototype._imageBitmapPath = "https://raw.githubusercontent.com/joshualemli/terraform/master/images/SpaceMite.png"



    function Player() {
        Entity.call(this,0,0,5)
        this.dx = 0
        this.dy = 0
        this.brakingForce = 0.96
        this.dDdtMax = 0.1
        enable_inventory.call(this,2)
    }
    Object.assign(Player.prototype,Entity.prototype)
    enable_inventory.call(Player)
    Player.prototype.step = function() {
        this.move()
        this.userInput()
        this.items.forEach( item => item.step() )
    }
    Player.prototype.move = function() {
        this.x += this.dx
        this.y += this.dy
    }
    Player.prototype.userInput = function() {
        let mouse = UserInput.mouse()
        // - - - MOVEMENT - - -
        // braking
        if (UserInput.keystate("b")) {
            if (this.dx*this.dx + this.dy*this.dy < this.brakingForce) this.dx = this.dy = 0
            else {
                this.dx *= this.brakingForce
                this.dy *= this.brakingForce
            }
        }
        // check for mouse or key acceleration input
        else {
            let accel = [0,0]
            // mouse
            if (UserInput.keystate("mouse3")) {
                accel = [mouse.x - this.x, mouse.y - this.y]
            }
            // keys
            else {
                if (UserInput.keystate("w")) {
                    accel[1] += this.dDdtMax
                }
                else if (UserInput.keystate("s")) {
                    accel[1] -= this.dDdtMax
                }
                if (UserInput.keystate("d")) {
                    accel[0] += this.dDdtMax
                }
                if (UserInput.keystate("a")) {
                    accel[0] -= this.dDdtMax
                }
            }
            accel = normalizeVector(accel,this.dDdtMax)
            this.dx += accel[0]
            this.dy += accel[1]
        }
        // - - - ITEM USE - - -
        if (UserInput.keystate("mouse1")) {
            this.items.forEach( item => {
                if (item.category === "weapon") item.fire(mouse.x,mouse.y)
            })
        }
    }
    Player.prototype._imageBitmapPath = "https://raw.githubusercontent.com/joshualemli/terraform/master/images/SpaceMite.png"


    // -- module accessors
    return {
        // adds the entity to the world and spatial hash with next available entityIdSeed
        spawn: (type,x,y) => {
            var entity = null
            switch(type.toLowerCase()) {
                case "player":
                    entity = new Player()
                    break
                case "spacemite":
                    entity = new SpaceMite(x,y)
                    break
                default: throw new Error("type not found")
            }
            State.entityIdSeed += 1
            entity.id = _base10Int_to_base62String(State.entityIdSeed)
            Entities.set(entity.id,entity)
            SpatialHash.add(entity.id,entity.x,entity.y)
            return entity
        },
        initAsync: Promise.all(
            [Player,SpaceMite].map( proto => new Promise( (resolve,reject) => {
                let exampleProto = new proto()
                fetch( exampleProto._imageBitmapPath )
                .then( response => response.blob() )
                .then( blob => createImageBitmap(blob) )
                .then( imageBitmap => {
                    proto.prototype.image = imageBitmap
                    resolve()
                })
            }))
        )
    }

})()



/* - - - - GAMEPLAY - - - - */

const play = (performanceTime) => {

    // pan and zoom
    if (UserInput.keystate("=")) CanvasArtist.zoom(1.02)
    else if (UserInput.keystate("-")) CanvasArtist.zoom(0.98)
    if (UserInput.keystate("ArrowUp")) CanvasArtist.panY(1)
    else if (UserInput.keystate("ArrowDown")) CanvasArtist.panY(-1)
    if (UserInput.keystate("ArrowRight")) CanvasArtist.panX(1)
    else if (UserInput.keystate("ArrowLeft")) CanvasArtist.panX(-1)

    // step
    if (!State.gamePaused) {
        State.gameLoopIteration += 1
        Entities.forEach( entity => entity.step() )
    }        

    // draw
    CanvasArtist.reset()
    let viewInfo = CanvasArtist.currentViewInfo()
    // TO DO: implement spatial culling
    Entities.forEach( entity => CanvasArtist.drawImage(entity.image,entity.x,entity.y,entity.r) )
    Sprites.forEach( sprite => sprite.draw() )
    CanvasArtist.worldTransform(false)
    Entities.get(State.playerId).items.forEach( (item,index) => {
        item.report().forEach( (colorBreaksArr) => {
            // if (Math.random()>0.95) console.log(viewInfo)
            CanvasArtist.fillRectangle(
                colorBreaksArr[1] * viewInfo.xDimPx / 10,
                viewInfo.yDimPx - 4 * index,
                (colorBreaksArr[2]-colorBreaksArr[1]) * viewInfo.xDimPx / 10,
                3,
                colorBreaksArr[0]
            )
        })
    } )

    // loop
    if (UserInput.keystate("t")) console.log(performance.now() - performanceTime)
    window.requestAnimationFrame(play)
}



/* - - - - MENU - - - - */

const menu = () => {}


/* - - - - INITIALIZATION - - - - */

const init = () => {
    window.removeEventListener("load",init)

    // wait for async init tasks
    Promise.all([
        Dungeon.initAsync
    ]).then( () => {

        CanvasArtist.init()

        // *** spawn player ***
        var player = Dungeon.spawn("player")
        State.playerId = player.id
        player.pickupItem( ItemFactory.spawn("ShatterRay") )
        // player.pickupItem( ItemFactory.spawn("ShatterRay") )
        console.log(player)

        
        var foo = Dungeon.spawn("spaceMite",200,200)
        var foo = Dungeon.spawn("spaceMite",-200,200)
        var foo = Dungeon.spawn("spaceMite",200,-200)
        var foo = Dungeon.spawn("spaceMite",-200,-200)
    
    
        console.log("init :: starting gameplay")
        play()

    })

}
window.addEventListener("load",init)





/////// END
})() // END
/////// END
