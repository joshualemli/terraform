
// terraform v0.2
// Joshua A. Lemli
// 2018

"use strict";

/////////////// START
(function(){ // START
/////////////// START


/* - - - - STATE - - - - */

var state = {
    menuActive: false,
    gamePaused: false,
    entityIdSeed: 0
}



/* - - - - USER INPUT HANDLER - - - - */

const UserInput = (function(){
    var keystate = {}
    document.addEventListener("keydown", event => keystate[event.key] = true)
    document.addEventListener("keyup", event => keystate[event.key] = false)
    return {
        keystate: k => keystate[k] || false
    }
})()
window.uit =UserInput


/* - - - - CANVAS SUB-API - - - - */

const CanvasArtist = (function(){
    
    var canvas,context
    
    function resizeCanvas() {
        context.canvas.width = canvas.offsetWidth
        context.canvas.height = canvas.offsetHeight
    }
    
    function init(event) {
        if (canvas) throw new Error("CanvasArtist module already initialized")
        canvas = document.getElementById("canvas")
        context = canvas.getContext("2d")
        resizeCanvas()
        window.addEventListener("resize",resizeCanvas)
    }

    const reset = () => {
        context.setTransform(1,0,0,1,0,0)
        context.clearRect(0,0,context.canvas.width,context.canvas.height)
        context.setTransform(1,0,0,-1,0,context.canvas.height)
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
    const drawImage = (x,y,scale,image) => {
        context.drawImage(image, x, y)
    }
    
    return {
        init:init,
        reset:reset,
        fillRectangle:fillRect,
        outlineRectangle:strokeRect,
        fillCircle:fillCircle,
        drawImage:drawImage
    }
    
})()

/* - - - - ENTITIES - - - - */

const entities = new Map()

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

const Dungeon = (function(){
    // -- id generator
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

    // -- abilities: traits (properties) and behaviors (methods)

    function enable_movement() {
        if (this.prototype) {
            this.prototype.move = function() {
                this.x += this.dx
                this.y += this.dy
            }
        }
        else {
            this.dx = 0
            this.dy = 0
        }
    }

    // -- base classes

    function Entity(x,y) {
        this.x = x
        this.y = y
    }
    Entity.prototype.perish = function() {
        console.log("DYING")
    }



    // -- specialized classes

    function SpaceMite(x,y) {
        Entity.call(this,x,y)
        this.r = 4
        enable_movement.call(this)
    }
    enable_movement.call(SpaceMite)
    Object.assign(SpaceMite.prototype,Entity.prototype)
    SpaceMite.prototype.step = function() {
        if (Math.random() > 0.95) {
            this.dx = Math.random()*2 - 1
            this.dy = Math.random()*2 - 1
        }
        this.move()
    }




    // -- module accessors
    return {
        spawn: (type,x,y) => {
            var entity = null
            switch(type.toLowerCase()) {
                case "spacemite": entity = new SpaceMite(x,y)
            }
            state.entityIdSeed += 1
            entity.id = _base10Int_to_base62String(state.entityIdSeed)
            SpatialHash.add(entity.id,entity.x,entity.y)
            return entity
        },
        initAsync: new Promise( (resolve,reject) => {
            // ** ASYNC IMAGE LOADING
            fetch("https://raw.githubusercontent.com/joshualemli/terraform/master/images/SpaceMite.png")
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(imageBitmap => {
                    SpaceMite.prototype.image = imageBitmap
                    console.log(imageBitmap)
                    resolve()
                });
        })
    }

})()




/* - - - - GAMEPLAY - - - - */

const play = (performanceTime) => {
    entities.forEach( entity => entity.step() )
    CanvasArtist.reset()
    entities.forEach( entity => {
        //if (Math.random() > 0.95) console.log(entity)
        //CanvasArtist.fillCircle(entity.x,entity.y,entity.r,"#FF0000")
        CanvasArtist.drawImage(entity.x,entity.y,0,entity.image)
    } )
    window.requestAnimationFrame(play)
}



/* - - - - MENU - - - - */

const menu = () => {}



/* - - - - INITIALIZATION - - - - */

const init = () => {
    window.removeEventListener("load",init)

    Dungeon.initAsync.then( () => {
        var foo = Dungeon.spawn("spaceMite",200,210)
        console.log(foo)
        entities.set(foo.id,foo)
    
        CanvasArtist.init()
    
        console.log("init :: starting gameplay")
        play()

    })

}
window.addEventListener("load",init)





/////// END
})() // END
/////// END
