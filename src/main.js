const THREE = require('three')
const maps = require('./maps.json')

// configurable constants
const defaultPinColor = 0x117fc6
const activePinColor = 0xde5e15
const pinSize = {
    radius: 1,
    height: 10,
}

//Setup:

//get the DOM element in which you want to attach the scene
const container = document.querySelector('#container')

//create a WebGL renderer
const renderer = new THREE.WebGLRenderer({ alpha: true })

//set the attributes of the renderer
const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

//set the renderer size
renderer.setSize(WIDTH, HEIGHT)

//Adding a Camera

//set camera attributes
const VIEW_ANGLE = 45
const ASPECT = WIDTH / HEIGHT
const NEAR = 0.1
const FAR = 10000

//create a camera
const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)

//set the camera position - x, y, z
camera.position.set(0, 0, 300)

// Create a scene
const scene = new THREE.Scene()

//set the scene background
// scene.background = new THREE.Color( 0x000000 );

//add the camera to the scene.
scene.add(camera)

// Attach the renderer to the DOM element.
container.appendChild(renderer.domElement)

//Three.js uses geometric meshes to create primitive 3D shapes like spheres, cubes, etc. I’ll be using a sphere.

// Set up the sphere attributes
const RADIUS = 100
const SEGMENTS = 50
const RINGS = 50

//Create a group (which will later include our sphere and its texture meshed together)
const globe = new THREE.Group()
//add it to the scene
scene.add(globe)

//Let's create our globe using TextureLoader

// instantiate a loader
var loader = new THREE.TextureLoader()
loader.load('8081_earthlights10k.jpg', function(texture) {
    //create the sphere
    var sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS)

    //map the texture to the material. Read more about materials in three.js docs
    var material = new THREE.MeshBasicMaterial({ map: texture })

    //create a new mesh with sphere geometry.
    var mesh = new THREE.Mesh(sphere, material)

    //rotate
    // mesh.rotateY(Math.PI)
    // mesh.rotateX(Math.PI*1.5)

    //add mesh to globe group
    globe.add(mesh)
})

// add pins
function createPin(map) {
    const phi = (90 - map.coordinates.lat) * (Math.PI / 180)
    const theta = (map.coordinates.lon + 180) * (Math.PI / 180)
    const pos = {
        x: -(RADIUS * Math.sin(phi) * Math.cos(theta)),
        y: RADIUS * Math.sin(phi) * Math.sin(theta),
        z: RADIUS * Math.cos(phi),
    }
    console.log(pos)

    const color = map.color || defaultPinColor
    var geometry = new THREE.CylinderGeometry(
        pinSize.radius,
        pinSize.radius,
        pinSize.height,
        32
    )
    var material = new THREE.MeshBasicMaterial({ color })
    var cylinder = new THREE.Mesh(geometry, material)
    globe.add(cylinder)

    var textGeo = new THREE.TextGeometry(map.name.en_US, {
        font: defaultFont,
        size: 2,
        height: 0.1,
    })
    var textMaterial = new THREE.MeshBasicMaterial(0xffffff)
    var textMesh = new THREE.Mesh(textGeo, textMaterial)
    textMesh.rotateX(Math.PI / 2)
    textMesh.rotateZ(Math.PI)
    textMesh.position.x = -2
    textMesh.position.y = -1.5
    textMesh.position.z = 1
    cylinder.add(textMesh)

    cylinder.position.x = pos.x
    cylinder.position.y = pos.z
    cylinder.position.z = pos.y
    console.log(cylinder.position)

    cylinder.lookAt(globe.position)
    cylinder.rotateX(Math.PI / 2)

    cylinder.pinData = map

    return cylinder
}
var fontLoader = new THREE.FontLoader()
var defaultFont
fontLoader.load('fonts/helvetiker_regular.typeface.json', function(font) {
    defaultFont = font
    maps.forEach((map) => {
        if (map.coordinates) {
            createPin(map)
        }
    })
})

//Lighting

//create a point light (won't make a difference here because our material isn't affected by light)
const pointLight = new THREE.PointLight(0xffffff)

//set its position
pointLight.position.x = 10
pointLight.position.y = 50
pointLight.position.z = 400

//add light to the scene
scene.add(pointLight)

//Update

//set update function to transform the scene and view
function update() {
    //render
    renderer.render(scene, camera)

    //schedule the next frame.
    requestAnimationFrame(update)
}

//schedule the first frame.
requestAnimationFrame(update)

//Rotate on Arrow Key Press

//setting up our rotation based on arrow key
function animationBuilder(direction) {
    return function animateRotate() {
        //based on key pressed, rotate +-x or +-y
        switch (direction) {
            case 'up':
                globe.rotation.x -= 0.02
                break
            case 'down':
                globe.rotation.x += 0.02
                break
            case 'left':
                globe.rotation.y -= 0.02
                break
            case 'right':
                globe.rotation.y += 0.02
                break
            default:
                break
        }
    }
}

//store animation call in directions object
var animateDirection = {
    up: animationBuilder('up'),
    down: animationBuilder('down'),
    left: animationBuilder('left'),
    right: animationBuilder('right'),
}

//callback function for key press event listener
function checkKey(e) {
    e = e || window.event

    e.preventDefault()

    //based on keycode, trigger appropriate animation
    if (e.keyCode == '38') {
        animateDirection.up()
    } else if (e.keyCode == '40') {
        animateDirection.down()
    } else if (e.keyCode == '37') {
        animateDirection.left()
    } else if (e.keyCode == '39') {
        animateDirection.right()
    }
}

//on key down, call checkKey
document.onkeydown = checkKey

//Rotate on Mouse Move

//store our previous mouse move; start value is at center
var lastMove = [window.innerWidth / 2, window.innerHeight / 2]

// check mouse down
let mouseDown = false
document.body.style.cursor = 'grab'
window.addEventListener('mousedown', () => {
    mouseDown = true
    if (!pin) {
        document.body.style.cursor = 'grabbing'
    }
})
window.addEventListener('mouseup', () => {
    mouseDown = false
    if (!pin) {
        document.body.style.cursor = 'grab'
    }
})

//callback function for mouse move event listener
function rotateOnMouseMove(e) {
    e = e || window.event

    //calculate difference between current and last mouse position
    const moveX = e.clientX - lastMove[0]
    const moveY = e.clientY - lastMove[1]

    if (mouseDown) {
        //rotate the globe based on distance of mouse moves (x and y)
        globe.rotation.y += moveX * 0.003
        globe.rotation.x += moveY * 0.003
    }

    //store new position in lastMove
    lastMove[0] = e.clientX
    lastMove[1] = e.clientY
}

//on mousemove, call rotateOnMouseMove
document.addEventListener('mousemove', rotateOnMouseMove)

// camera zoom
window.addEventListener('mousewheel', (e) => {
    camera.position.z += e.wheelDelta * -0.1
})

var mouse = new THREE.Vector2()
var raycaster = new THREE.Raycaster()
var pin
var mapDetailsContainer = document.getElementById('mapDetails')
window.addEventListener('mousemove', checkPinIntersection)
window.addEventListener('click', (event) => {
    console.log(pin)
    // closeMapDetails()
    if (pin && mouse) {
        globe.children.forEach((o) => {
            if (o.selected) {
                o.material.color.setHex(defaultPinColor)
            }
        })
        pin.object.selected = true
        pin.object.material.color.setHex(activePinColor)
        openMapDetails(mouse.raw, pin.object.pinData)
    }
})

function checkPinIntersection(event) {
    mouse.raw = {
        x: event.clientX,
        y: event.clientY,
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(globe.children)

    pin = intersects.find((o) => o.object.pinData)
    if (pin) {
        document.body.style.cursor = 'pointer'
    } else {
        document.body.style.cursor = mouseDown ? 'grabbing' : 'grab'
    }
}

function closeMapDetails() {
    mapDetailsContainer.style.display = 'none'
}

function openMapDetails(pos, pin) {
    console.log('pos', pos, 'pin', pin)
    document.body.style.backgroundImage = `url('${pin.background}')`
    mapDetailsContainer.style.display = 'block'
    mapDetailsContainer.innerHTML = `
        <img src="${pin.thumbnail}" />
        <h1>${pin.name.en_US}</h1>
        <p>${pin.description || ''}</p>
        ${pin.homeTo ? `<p><b>Home To:</b> ${pin.homeTo}</p>` : ''}
        ${pin.events ? `<p><b>Events:</b> ${pin.events}</p>` : ''}
        ${
            pin.youtube
                ? `<iframe width="380px" height="214px" src="${pin.youtube}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                : ''
        }
    `
}
