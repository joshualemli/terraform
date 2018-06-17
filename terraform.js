
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
const hitTest = (xa,ya,xb,yb,D) => {
    let dx = xa-xb
    let dy = ya-yb
    return Math.sqrt(dx*dx+dy*dy) < D
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
            // case "q": toggleMenu()
            //     break
            case " ": State.gamePaused = !State.gamePaused
                break
        }
    })
    const init = () => {
        // keys
        document.addEventListener("keydown", event => keystate[event.key] = true )
        document.addEventListener("keyup", event => keystate[event.key] = false )
        // mouse/touch
        document.addEventListener("mousemove", event => {
            let viewInfo = CanvasArtist.currentViewInfo()
            mouseX = viewInfo.xPos - (viewInfo.xDim / 2) + (event.clientX / viewInfo.m)
            mouseY = viewInfo.yPos + (viewInfo.yDim / 2) - (event.clientY / viewInfo.m)
        })
        document.addEventListener("contextmenu", function(event) {
            event.preventDefault();
            return false;
        }, false);
        document.getElementById("canvas").addEventListener("mousedown", event => keystate[`mouse${event.which}`] = true )
        document.getElementById("canvas").addEventListener("mouseup", event => keystate[`mouse${event.which}`] = false )
    }
    // public accessor
    return {
        init:init,
        keystate: k => keystate[k] || false,
        mouse: () => new Object({x:mouseX,y:mouseY})
    }
})()


/* - - - - PLAYER PANEL - - - - */

const PlayerPanel = (function(){

    // var itemElements = new Map()
    // const addItemElement = (item) => {
    //     let container = document.createElement("div")

    // }

    return function(show) {

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
    const strokePolyline = (points,thickness,strokeStyle) => {
        context.strokeStyle = strokeStyle
        context.lineWidth = thickness
        context.beginPath()
        context.moveTo(points[0][0],points[0][1])
        let arrLen = points.length
        for (var i = 1; i < points.length; i += 1) context.lineTo(points[i][0],points[i][1])
        context.stroke()
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
        context.drawImage(image, x-r, y-r, L, L)
        // context.fillStyle = "#FFFFFF"
        // context.fillRect(x-r,y-r,L,L)
    }
    return {
        init:init,
        reset:reset,
        worldTransform:worldTransform,
        panX: (dx) => xPos += dx / magnification,
        panY: (dy) => yPos += dy / magnification,
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
        polyline:strokePolyline,
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
        let xAdd = (x % CELL_SIZE > Math.sign(x)*splitSize) ? 1 : -1
        let yAdd = (y % CELL_SIZE > Math.sign(y)*splitSize) ? 1 : -1
        let idsArr = []
        let X = hash(x)
        let Y = hash(y)
        new Array( [X,Y], [X+xAdd,Y], [X,Y+yAdd], [X+xAdd,Y+yAdd]).forEach( XY => {
            var set = getSet(XY[0],XY[1])
            if (set) set.forEach( v => idsArr.push(v) )
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
    function ShatterBeam(props) {
        this.x0 = props.x0
        this.y0 = props.y0
        this.x1 = props.x1
        this.y1 = props.y1
        this.strColor = props.color.join(",")
        this.arrColorAddSafe = props.color.map(n=>n>155?155:(n<100?100:n))
        this.beamRadius = props.radius
    }
    ShatterBeam.prototype.draw = function() {
        var i
        for (i = Math.floor(Math.random()*4); i--;) CanvasArtist.line(
            this.x0,
            this.y0,
            this.x1 - (Math.random() - 0.5) * this.beamRadius*2,
            this.y1 - (Math.random() - 0.5) * this.beamRadius*2,
            1,
            `rgba(${this.strColor},${Math.round(5+Math.random()*5)/10})`
        )
        let dx = (this.x1-this.x0)/10
        let dy = (this.y1-this.y0)/10
        let devMult = Math.sqrt(dx*dx+dy*dy)
        let devAdd = devMult / 2
        let points = [[this.x0,this.y0]]
        for (i = 1; i < 11; i++) points.push([this.x0 + i*dx + (Math.random()*devMult-devAdd), this.y0 + i*dy + (Math.random()*devMult-devAdd)])
        CanvasArtist.polyline(points,1,`rgb(${this.arrColorAddSafe.map(n=>n+Math.floor(Math.random()*200-100)).join(",")})`)

        // CanvasArtist.fillCircle(
        //     this.x1, this.y1,
        //     this.beamRadius * (Math.random()*0.4+0.7),
        //     `rgba(${this.spotColor.map(n=> n + Math.floor(Math.random()*110 - 55) ).join(",")},${Math.floor(Math.random()*3)/10})`
        // )
        Sprites.delete(this.id)
    }
    return {
        spawn: (type,props) => {
            let sprite = null
            switch(type.toLowerCase()) {
                case "shatterbeam":
                    sprite = new ShatterBeam(props)
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
        this.range = 200
        this.hitRadius = 8
        this.cooldownRate = 0.5
        this.heatupRate = 1
        this.t = 0 // "temperature"
        this.tSafe = 300
        this.tMax = 310
        this.firing = false
        this.damagePerHit = 0.05
        this.owner = null
    }
    ShatterRay.prototype.report = function(viewInfo) {
        let tPerc = this.t/this.tMax
        let values = []
        let tSafePerc = this.tSafe/this.tMax
        let barXDimPx = viewInfo.xDimPx / 5 + 8
        let barYPosPx = viewInfo.yDimPx-32
        if (tPerc < tSafePerc) {
            if (tPerc == 0) CanvasArtist.fillRectangle(8, barYPosPx, tSafePerc*barXDimPx, 3, "#00FF00")
            else {
                CanvasArtist.fillRectangle(8, barYPosPx, tPerc*barXDimPx, 3, "#0000FF")
                CanvasArtist.fillRectangle(tPerc*barXDimPx+8, barYPosPx, (tSafePerc-tPerc)*barXDimPx, 3,"#00FF00")
            }
            CanvasArtist.fillRectangle( tSafePerc*barXDimPx+8, barYPosPx, (1-tSafePerc)*barXDimPx, 3, "#FFFF00")
        }
        else {
            CanvasArtist.fillRectangle( 8, barYPosPx, tPerc*barXDimPx, 3, "#0000FF")
            CanvasArtist.fillRectangle( tPerc*barXDimPx+8, barYPosPx, (1-tPerc)*barXDimPx, 3, "#FF0000")
        }
    }
    ShatterRay.prototype.stats = function(update) {
        return [
            {name:"Range",key:"range",value:this.range},
            {name:"Damange Rate",key:"damagePerHit",value:this.damagePerHit},
            {name:"Heat Dissipation",key:"cooldownRate",value:cooldownRate},
            {name:"Heat Generation",key:"heatupRate",value:this.heatupRate},
            {name:"Safe Ignition Temperature",key:"tSafe",value:this.tSafe},
            {name:"Max Sustained Firing Temperature",key:"tMax",value:this.tMax},
        ]
    }
    ShatterRay.prototype.fire = function(x,y) {
        let killExperience = 0
        // fire!
        if ((this.firing && this.t < this.tMax) || this.t < this.tSafe) {
            this.firing = true
            this.t += this.heatupRate
            let beamProps = {
                x0:this.owner.x, y0:this.owner.y,
                x1:x, y1:y,
                color: [0,255,0],
                radius: this.hitRadius
            }
            let dD = [beamProps.x1-beamProps.x0, beamProps.y1-beamProps.y0]
            dD = normalizeVector(dD,this.range)
            beamProps.x1 = beamProps.x0 + dD[0]
            beamProps.y1 = beamProps.y0 + dD[1]
            SpriteFactory.spawn("ShatterBeam",beamProps)
            // hit test
            SpatialHash.getNeighbors(beamProps.x1,beamProps.y1).forEach( eid => {
                if (eid === this.owner.id) return
                var entity = Entities.get(eid)
                if (hitTest(entity.x,entity.y,beamProps.x1,beamProps.y1,entity.r+this.hitRadius)) {
                    killExperience += entity.takeDamage(this.damagePerHit)
                }
            })
        }
        // temperature is too high
        else this.firing = false
        return killExperience
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

    function Entity(x,y,r) {
        this.x = x
        this.y = y
        this.r = r
    }
    Entity.prototype.perish = function() {
        Entities.delete(this.id)
        SpatialHash.remove(this.id)
        if (!Mortuary[this.name]) Mortuary[this.name] = 1
        else Mortuary[this.name] += 1
        console.log(`AAAAAaaarrbllchfff...gasp!  Entity id:${this.id} perished.`)
        return Math.round(Math.sqrt(this.r+1)*10)/10
    }

    // -- specialized classes
    //     - takeDamage: returns xp for kill if entity perishes

    function SpaceMite(x,y) {
        Entity.call(this,x,y,4)
        enable_movement.call(this)
        this.target = null
    }
    Object.assign(SpaceMite.prototype,Entity.prototype)
    enable_movement.call(SpaceMite)
    SpaceMite.prototype.name = "SpaceMite"
    SpaceMite.prototype.neuronCount = 100
    SpaceMite.prototype.step = function() {
        // if (this.target == null && Math.random()
        let eids = SpatialHash.getNeighbors(this.x,this.y)
        for (var i = eids.length; i--;) {
            var eid = eids[i]
            if (eid === this.id) continue
            var entity = Entities.get(eid)
            //console.log(entity.x,entity.y, this.x, this.y, this.r + entity.r)
            if (hitTest(entity.x,entity.y, this.x, this.y, this.r + entity.r)) {
                this.target = entity
                break
            }
        }
        if (Math.random() > 0.99) {
            this.dx = Math.random()*0.5 - 0.25
            this.dy = Math.random()*0.5 - 0.25
        }
        this.move()
    }
    SpaceMite.prototype.takeDamage = function(sqUnits) {
        this.r = Math.sqrt( ((Math.PI * this.r * this.r) - sqUnits*10) / Math.PI )
        if (this.r < 2) return this.perish()
        return 0
    }
    SpaceMite.prototype._imageBitmapPath = "https://raw.githubusercontent.com/joshualemli/terraform/master/images/SpaceMite.png"



    function Player() {
        Entity.call(this,0,0,5)
        this.dx = 0
        this.dy = 0
        this.brakingForce = 0.96
        this.dDdtMax = 0.1
        this.experience = 0
        this.rank = 1
        enable_inventory.call(this,2)
        enable_movement.call(this)
    }
    Object.assign(Player.prototype,Entity.prototype)
    enable_inventory.call(Player)
    enable_movement.call(Player)
    Player.prototype.step = function() {
        this.move()
        this.userInput()
        this.items.forEach( item => item.step() )
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
            // else {
            //     if (UserInput.keystate("w")) {
            //         accel[1] += this.dDdtMax
            //     }
            //     else if (UserInput.keystate("s")) {
            //         accel[1] -= this.dDdtMax
            //     }
            //     if (UserInput.keystate("d")) {
            //         accel[0] += this.dDdtMax
            //     }
            //     if (UserInput.keystate("a")) {
            //         accel[0] -= this.dDdtMax
            //     }
            // }
            accel = normalizeVector(accel,this.dDdtMax)
            this.dx += accel[0]
            this.dy += accel[1]
        }
        // - - - ITEM USE - - -
        if (UserInput.keystate("mouse1")) {
            this.items.forEach( item => {
                if (item.category === "weapon") this.experience += item.fire(mouse.x,mouse.y)
            })
        }
    }
    Player.prototype._imageBitmapPath = "https://raw.githubusercontent.com/joshualemli/terraform/master/images/Player_v1.png"


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
    if (UserInput.keystate("e")) CanvasArtist.zoom(1.02)
    else if (UserInput.keystate("q")) CanvasArtist.zoom(0.98)
    if (UserInput.keystate("w")) CanvasArtist.panY(10)
    else if (UserInput.keystate("s")) CanvasArtist.panY(-10)
    if (UserInput.keystate("d")) CanvasArtist.panX(10)
    else if (UserInput.keystate("a")) CanvasArtist.panX(-10)

    // step
    State.gameLoopIteration += 1
    Entities.forEach( entity => entity.step() )

    // draw
    CanvasArtist.reset()
    let viewInfo = CanvasArtist.currentViewInfo()
    Entities.forEach( entity => {
        if (
            entity.x+entity.r > viewInfo.xPos-viewInfo.xDim/2 && entity.x-entity.r < viewInfo.xPos+viewInfo.xDim/2 &&
            entity.y+entity.r > viewInfo.yPos-viewInfo.yDim/2 && entity.y-entity.r < viewInfo.yPos+viewInfo.yDim/2
        ) CanvasArtist.drawImage(entity.image,entity.x,entity.y,entity.r)
    })
    Sprites.forEach( sprite => sprite.draw() )
    CanvasArtist.worldTransform(false)
    Entities.get(State.playerId).items.forEach( (item) => item.report(viewInfo) )

    if (State.gameLoopIteration % 128 === 0) {
        console.log(performance.now()-performanceTime)
        if (Math.random() > 0.9) console.clear()
    }

    // loop
    if (!State.gamePaused) window.requestAnimationFrame(play)
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

        UserInput.init()
        CanvasArtist.init()

        // *** spawn player ***
        var player = Dungeon.spawn("player")
        State.playerId = player.id
        player.pickupItem( ItemFactory.spawn("ShatterRay") )
        window.player = player

        for (var nm = 20; nm--;) Dungeon.spawn("spaceMite",(Math.random()-0.5)*1000,(Math.random()-0.5)*1000)

        play()

    })

}
window.addEventListener("load",init)





/////// END
})() // END
/////// END
