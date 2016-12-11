// import * as _ from 'lodash'



document.addEventListener('DOMContentLoaded', () => {
const
  DAY_MILLISECONDS = 24 * 60 * 60 * 1000,
  CAMERA_ZOOM_SPEED = 0.08*4,
  CAMERA_MAX_ZOOM = 150,
  PLANET_RADIUS_SCALE = 0.0000004,
  MESSAGE_RADIUS = 0.04,
  NODE_RADIUS = 0.05,
  ASTRONOMICAL_UNIT = 149597870.7, //km
  LIGHT_SPEED_AU = 299792.458 / ASTRONOMICAL_UNIT, /*km per sec*/
  SIM_FETCH_INTERVAL = 5000,
  // BACKEND_URL = 'http://192.168.1.147:3001'
  BACKEND_URL = 'http://192.168.2.106:3000'

let container
let camera, scene, renderer
let mouseX = 0, mouseY = 0

let windowHalfX = window.innerWidth / 2
let windowHalfY = window.innerHeight / 2

let viewState = {
  scale: 1,
  parallaxes: []
}

let state = {
  timeFactor: 1,
  d: unixTimeToDayFraction(new Date().getTime()), //time in days since January 1st, 2000
  prevRenderTime: new Date().getTime(),
  planetNodes: [
    /* id, mesh */
  ],
  msgNodes: [
    /* id, mesh */
  ],
  msgs: [
    /*
     {
       mesh: {},
       lines: [],
       lastBackendData: {
         "path": [
           {"name": "node1", "location": {"x": 1, "y": 1, "z": 1}},
           {"name": "node2", "location": {"x": 2, "y": 2, "z": 2}}
         ],
         "lastReport": {
           "name": "node1",
           "time": 12345677
         },
         "speedFactor": 1.23,
         "estimatedArrivalTime": 123456789
       }
     }
    */
  ],
  isLeftMouseButtonDown: false,
  isArrowDownDown: false
}

  /**
   * route (lista node'ow - kazdy lokalizacja),
   * id ostatniego node'a, ktory potwierdzil odbior
   * czas kiedy to potwierdzil,
   * oczekiwany czas dotarcia,
   * predkosc przelotu
   */
  //
  // let msg = {
  //   "path": [
  //     {"name": "node1", "location": {"x": 1, "y": 1, "z": 1}},
  //     {"name": "node2", "location": {"x": 2, "y": 2, "z": 2}}
  //   ],
  //   "lastReport": {
  //     "name": "node1",
  //     "time": 12345677
  //   },
  //   "speedFactor": 1.23,
  //   "estimatedArrivalTime": 123456789
  // }


let $orbitals = {
  'mercury': {
    'n' : [48.3313, 3.24587E-5],
    'i' : [7.0047, 5.00E-8],
    'w' : [29.1241, 1.01444E-5],
    'a' : [0.387098, 0],
    'e' : [0.205635, 5.59E-10],
    'm' : [168.6562, 4.0923344368]
  },
  'venus' : {
    'n' : [76.6799, 2.46590E-5],
    'i' : [3.3946, 2.75E-8],
    'w' : [54.8910, 1.38374E-5],
    'a' : [0.723330, 0],
    'e' : [0.006773, 1.302E-9],
    'm' : [48.0052, 1.6021302244]
  },
  'earth' : {
    'n' : [0.0, 0],
    'i' : [0.0, 0],
    'w' : [282.9404, 4.70935e-5],
    'a' : [1.0, 0],
    'e' : [0.016709, 1.151e-9],
    'm' : [356.0470, 0.9856002585]
  },
  'mars' : {
    'n' : [49.5574, 2.11081e-5],
    'i' : [1.8497, 1.78e-8],
    'w' : [286.5016, 2.92961e-5],
    'a' : [1.523688, 0],
    'e' : [0.093405, 2.516e-9],
    'm' : [18.6021, 0.5240207766]
  },
  'jupiter' : {
    'n' : [100.4542, 2.76854E-5],
    'i' : [1.3030, 1.557E-7],
    'w' : [273.8777, 1.64505E-5],
    'a' : [5.20256, 0],
    'e' : [0.048498, 4.469E-9],
    'm' : [ 19.8950, 0.0830853001]
  },
  'saturn' : {
    'n' : [113.6634, 2.38980E-5],
    'i' : [2.4886, 1.081E-7],
    'w' : [339.3939, 2.97661E-5],
    'a' : [9.55475, 0],
    'e' : [0.055546, 9.499E-9],
    'm' : [316.9670, 0.0334442282]
  },
  'uranus' : {
    'n' : [74.0005, 1.3978E-5],
    'i' : [0.7733, 1.9E-8],
    'w' : [96.6612, 3.0565E-5],
    'a' : [19.18171, 1.55E-8],
    'e' : [0.047318, 7.45E-9],
    'm' : [142.5905, 0.011725806]
  },
  'neptune' : {
    'n' : [131.7806, 3.0173E-5],
    'i' : [1.7700, 2.55E-7],
    'w' : [272.8461, 6.027E-6],
    'a' : [30.05826, 3.313E-8],
    'e' : [0.008606, 2.15E-9],
    'm' : [260.2471, 0.005995147]
  }
}

let textures = {}, fonts = {}

// planets: id, textureUrl, diameter (km), scale
let $planets = [
  ['mercury', "Mercury", 'Mercury.jpg', 4900, 50, 1000],
  ['venus', "Venus", 'Venus.jpg', 12100, 30, 10000],
  ['earth', "Earth", 'land_ocean_ice_cloud_2048.jpg', 12800, 30, 10000],
  ['mars', "Mars", 'Mars.jpg', 6800, 50, 10000],
  ['jupiter', "Jupilter", 'Jupiter.jpg', 143000, 10, 10000],
  ['saturn', "Saturn", 'Saturn.jpg', 125000, 40, 10800],
  ['uranus', "Uranus", 'Uranus.jpg', 51100, 40, 38200],
  ['neptune', "Neptune", 'Neptune.jpg', 49500, 40, 60000]
]

let $otherBodies = [
  ['sun', "Sun", 'Sun.jpg', 1391400, 0.37]
]

preloadAssets().then(() => {
  init()
  animate()

  setTimeout(() => {
    let earthPos = _.find(state.planetNodes, {id: 'earth'}).mesh.position
    let marsPos = _.find(state.planetNodes, {id: 'mars'}).mesh.position
    let venusPos = _.find(state.planetNodes, {id: 'venus'}).mesh.position

    let data = {
      id: "fjiof-fjioef-fejioef-fejio-fejio",
      path: [
        {name: "earth1", location: {x: earthPos.x, y: earthPos.y, z: earthPos.z}},
        {name: "mars1", location: {x: marsPos.x, y: marsPos.y, z: marsPos.z}},
        {name: "venus1", location: {x: venusPos.x, y: venusPos.y, z: venusPos.z}}
      ],
      lastReport: {
        name: 'earth1',
        time: null//to be calculated
      },
      speedFactor: 100,
      estimatedArrivalTime: 0 // to be calculated
    }

    let earthToMarsDist = distance(data.path[0].location, data.path[1].location)
    let marsToVenusDist = distance(data.path[1].location, data.path[2].location)
    let totalDist = earthToMarsDist + marsToVenusDist

    let earthToMarsTime = earthToMarsDist / (LIGHT_SPEED_AU*data.speedFactor) * 1000
    let flyTime = totalDist / LIGHT_SPEED_AU * 1000

    data.lastReport.time = (new Date().getTime())// - earthToMarsTime/2
    // lastBackendData.estimatedArrivalTime = new Date().getTime() + flyTime/2

    // onWebSocketData({
    //   message: data
    // })
  }, 1000)
})

function loadTexture(filename) {
  return new Promise((resolve, reject) => {
    let url = `assets/${filename}`
    let loader = new THREE.TextureLoader()
    loader.load(url, texture => {
      textures[filename] = texture
      resolve()
    })
  })
}

function loadFont(filename) {
  return new Promise((resolve, reject) => {
    let url = `assets/${filename}`
    let loader = new THREE.FontLoader()
    loader.load(url, font => {
      fonts[filename] = font
      resolve()
    })
  })
}

function preloadAssets() {
  let promises = []
  for (let body of $planets) {
    promises.push(loadTexture(body[2]))
  }
  promises.push(loadTexture('Sun.jpg'))
  promises.push(loadTexture('Message.jpg'))
  promises.push(loadTexture('Node.png'))

  // background
  promises.push(loadTexture('background/Space.jpg'))
  for (let i = 1; i <= 5; ++i)
    promises.push(loadTexture(`background/Layer${i}.png`))

  promises.push(loadFont('droid_sans_regular.typeface.json'))

  return Promise.all(promises)
}

function lerpPos(outPos, pos1, pos2, factor) {
  outPos.x = +pos1.x + (+pos2.x - pos1.x) * factor
  outPos.y = +pos1.y + (+pos2.y - pos1.y) * factor
  outPos.z = +pos1.z + (+pos2.z - pos1.z) * factor
}

function distance(pos1, pos2) {
  const
    dx = pos2.x - pos1.x,
    dy = pos2.y - pos1.y,
    dz = pos2.z - pos1.z

  return Math.sqrt(dx*dx + dy*dy + dz*dz)
}

function pointToVector3(p) {
  return new THREE.Vector3(p.x, p.y, p.z)
}

function init() {
  container = document.getElementById('container')

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000)
  camera.position.z = 1.5
  camera.far = 100000
  camera.near = 0.000001
  camera.updateProjectionMatrix()

  scene = new THREE.Scene()

  initBackground()

  for (let body of $planets) {
    let node = initCelestialBody(body, true)
  }

  updatePositions()

  for (let body of $otherBodies) {
    initCelestialBody(body, false)
  }

  renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true})
  renderer.setClearColor(0)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  document.addEventListener('keydown', onKeyDown, false)
  document.addEventListener('keyup', onKeyUp, false)
  document.addEventListener('mousemove', onDocumentMouseMove, false)
  document.addEventListener('mousedown', onDocumentMouseDown, false)
  document.addEventListener('mouseup', onDocumentMouseUp, false)
  document.addEventListener('mouseleave', onDocumentMouseLeave, false)
  document.addEventListener('mousewheel', onDocumentMouseWheel, false)
  window.addEventListener('resize', onWindowResize, false)

  fetch(`${BACKEND_URL}/nodes`).then(res => {
    res.json().then(json => {
      for (let node of json.nodes) {
        const loc = {
          x: node.location_x,
          y: node.location_y,
          z: node.location_z
        }

        let texture = textures["Node.png"]
        let geometry = new THREE.SphereGeometry(NODE_RADIUS, 40, 40)
        let material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 1 })
        let mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = loc.x
        mesh.position.y = loc.y
        mesh.position.z = loc.z
        scene.add(mesh)

        state.msgNodes.push({ id: node.id, mesh })
      }
    })
  })

  function fetchSimulation() {
    fetch(`${BACKEND_URL}/simulations`).then(res => {
      res.json().then(json => {
        console.log(json);
        for (let msg of json.messages) {
          onMessageUpdated({message: msg})
        }
      })
    })
  }

  fetchSimulation()
  setInterval(() => {
    fetchSimulation()
  }, SIM_FETCH_INTERVAL)
}

function initBackground() {
  let geometry = new THREE.SphereGeometry(4000, 160, 90);
  let uniforms = {
    texture: { type: 't', value: THREE.ImageUtils.loadTexture('assets/background/Space.jpg') }
  }

  let material = new THREE.ShaderMaterial( {
    uniforms:       uniforms,
    vertexShader:   document.getElementById('sky-vertex').textContent,
    fragmentShader: document.getElementById('sky-fragment').textContent
  })

  skyBox = new THREE.Mesh(geometry, material)
  skyBox.scale.set(-1, 0.5, 0.9)
  skyBox.eulerOrder = 'XZY'
  skyBox.renderDepth = 10000000.0
  scene.add(skyBox)

  let layers = [ //width, height, x, y, z
    [1280, 1273, 3, -12, -20],
    [1600, 1200, -9, 2, -14],
    [1600, 1200, -20, 8, -3],
    [1000, 750, 12, 3, -10],
    [1000, 713, 3, 2, -32]
  ]

  viewState.parallaxes = []

  for (let i = 0; i < 5; ++i) {
    let layer = layers[i]
    let tex = textures[`background/Layer${i+1}.png`]
    let s = 0.01
    let geometry = new THREE.PlaneGeometry(layer[0]*s, layer[1]*s)
    let material = new THREE.MeshBasicMaterial( {map: tex, side: THREE.DoubleSide, transparent: true} );
    let plane = new THREE.Mesh(geometry, material)
    plane.position.x = layer[2]
    plane.position.y = layer[3]
    plane.position.z = layer[4]
    scene.add(plane)

    viewState.parallaxes.push({
      layer: layers[i],
      plane
    })
  }
}

function initCelestialBody(params, isMsgNode = false) {
  const [id, name, textureFilename, diameter, scale, orbDays] = params
  let texture = textures[textureFilename]
  let geometry = new THREE.SphereGeometry(PLANET_RADIUS_SCALE * diameter * scale, 20, 20)
  let material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 1 })
  let mesh = new THREE.Mesh(geometry, material)
/*
  let textGeo = new THREE.TextGeometry(name, {
    font: fonts['droid_sans_regular.typeface.json'],
    size: 1,
    height: 1,
    curveSegments: 1,
    bevelThickness: 0,
    bevelSize: 1.5,
    bevelEnabled: false,
    material: 0,
    extrudeMaterial: 1
  })
  textGeo.computeBoundingBox()
  textGeo.computeVertexNormals()

  let textMesh = new THREE.Mesh(textGeo, material)
  let centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)

  setTimeout(() => {
    textMesh.position.x = mesh.position.x + centerOffset
    textMesh.position.y = mesh.position.y
    textMesh.position.z = mesh.position.z + -30
    console.log(textMesh.position);

  }, 0)

  scene.add(textMesh)*/

  let node = null

  if (isMsgNode) {
    // orb
    const D = 1
    geometry = new THREE.Geometry()
    material = new THREE.LineBasicMaterial({ color: 0xFFFFFF })
    for (let d = 0, i = 0; d < orbDays; d += D, i += 3) {
      let pos = {x: 0, y: 0, z: 0}
      calcNodePosition(pos, id, d)
      geometry.vertices.push(new THREE.Vector3(pos.x, pos.y, pos.z))
    }
    scene.add(new THREE.Line(geometry, material))

    // save node
    node = {id, mesh}
    state.planetNodes.push(node)
  }

  scene.add(mesh)

  return node
}

function onMessageUpdated(evt) {
  let msg = _.find(state.msgs, {id: evt.message.id})
  let isNewMsg = !msg

  if (isNewMsg) {
    msg = evt.message

    let texture = textures["Message.jpg"]
    let geometry = new THREE.SphereGeometry(MESSAGE_RADIUS, 40, 40)
    let material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 1 })
    let mesh = new THREE.Mesh(geometry, material)

    scene.add(mesh)

    // now render lines!!111111 elo 3 2 0
    let lines = []
    for (let nodeIndex = 0; nodeIndex < msg.path.length-1; ++nodeIndex) {
      let curNode = msg.path[nodeIndex]
      let nextNode = msg.path[nodeIndex+1]

      geometry = new THREE.Geometry()
      geometry.vertices.push(
        pointToVector3(curNode.location),
        pointToVector3(nextNode.location)
      )
      geometry.colors = [new THREE.Color( 0x999999 ), new THREE.Color( 0x00ff11 )]
      material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 2, vertexColors: THREE.VertexColors } );
      let line = new THREE.Line(geometry, material)
      scene.add(line)
      lines.push(line)
    }

    state.msgs.push({
      id: msg.id,
      mesh,
      lines,
      lastBackendData: msg
    })
  }
  else {
    // TODO update msg!
  }
}

function render() {
  const curTime = new Date().getTime()
  const prevTime = state.prevRenderTime
  let deltaTime = (curTime - prevTime)/1000/60/60/24

  if (curTime - prevTime > 500) {
    deltaTime = 0.015/60/60/24 //15 ms
  }

  state.d += (state.timeFactor * deltaTime)
  state.prevRenderTime = curTime

  updatePositions()

  if (state.isLeftMouseButtonDown) {
    camera.position.x -= (mouseX - camera.position.x) * 0.0001
    camera.position.y += (mouseY - camera.position.y) * 0.0001

    if (state.isArrowDownDown)
      camera.lookAt(scene.position)

    camera.updateProjectionMatrix()
  }

  renderer.render(scene, camera)
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2
  windowHalfY = window.innerHeight / 2

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onKeyDown(evt) {
  if (evt.key == 'o') {
    state.timeFactor /= 10
  }
  else if (evt.key == 'p') {
    state.timeFactor *= 10
  }
  else if (evt.key == 's') {
    viewState.enablePlanetScaling = !viewState.enablePlanetScaling
  }
  else if (evt.keyCode === 40/*arrow down*/) {
    state.isArrowDownDown = true
  }

  state.timeFactor = Math.max(1, state.timeFactor)
}

function onKeyUp(evt) {
  if (evt.keyCode === 40/*arrow down*/) {
    state.isArrowDownDown = false
  }
}

function onDocumentMouseMove(evt) {
  mouseX = (evt.clientX - windowHalfX)
  mouseY = (evt.clientY - windowHalfY)
}

function onDocumentMouseDown(evt) {
  state.isLeftMouseButtonDown = true
}

function onDocumentMouseUp(evt) {
  state.isLeftMouseButtonDown = false
}

function onDocumentMouseLeave(evt) {
  state.isLeftMouseButtonDown = false
}

function onDocumentMouseWheel(evt) {
  let z = camera.position.z + CAMERA_ZOOM_SPEED * Math.sign(evt.deltaY)

  // if (z < CAMERA_MAX_ZOOM) {
  //   z = CAMERA_MAX_ZOOM
  // }

  camera.position.z = z
  camera.updateProjectionMatrix()
}

function animate() {
  requestAnimationFrame(animate)
  render()
}

function updatePositions() {
  for (let node of state.planetNodes) {
    updateNodePosition(node)
  }

  let indicesToRemove = []
  for (let i = 0, n = state.msgs.length; i < n; ++i) {
    let msg = state.msgs[i]
    if (updateMessagePosition(msg))
      indicesToRemove.push(i)
  }
  for (let i = indicesToRemove.length-1; i >= 0; --i) {
    let msg = state.msgs[i]
    scene.remove(msg.mesh)
    for (let line of msg.lines)
      scene.remove(line)

    state.msgs.splice(i, 1)
  }
}

function updateNodePosition(node) {
  let {mesh, id} = node
  calcNodePosition(mesh.position, id, state.d)

  let scale = viewState.scale

  mesh.position.x *= scale
  mesh.position.y *= scale
  mesh.position.z *= scale
}

function calcNodePosition(outPos, id, d) {
  let orbs = getOrbitals(id, d)

  let
    {n,i,w,a,e,m} = orbs,
    e2 = m + e * Math.sin(m) * (1.0 + e * Math.cos(m))

  let
    xv = a * (Math.cos(e2) - e),
    yv = a * (Math.sqrt(1.0 - e*e) * Math.sin(e2)),
    v = Math.atan2(yv, xv),
    r = Math.sqrt(xv*xv + yv*yv)

  let
    xh = r * ( Math.cos(n) * Math.cos(v+w) - Math.sin(n) * Math.sin(v+w) * Math.cos(i)),
    yh = r * ( Math.sin(n) * Math.cos(v+w) + Math.cos(n) * Math.sin(v+w) * Math.cos(i)),
    zh = r * ( Math.sin(v+w) * Math.sin(i) )

  outPos.x = xh
  outPos.y = yh
  outPos.z = zh
}

/**
 * @returns `true` if message has been delivered
 * @param msg
 */
function updateMessagePosition(msg) {
  let {mesh, lastBackendData} = msg
  const data = lastBackendData
  let curTime = dayFractionToUnixTime(state.d)

  let lastReportNodeIndex = _.findIndex(data.path, {name: data.lastReport.name})
  let wasDelivered = lastReportNodeIndex >= data.path.length - 1

  let curNode, nextNode

  if (wasDelivered) {
    return true
  }

  let lastReportTime = data.lastReport.time
  let curNodeIndex = lastReportNodeIndex

  let distSinceLastReport = (curTime - lastReportTime)/1000 * lastBackendData.speedFactor * LIGHT_SPEED_AU
  let distSinceProbableLastNode = distSinceLastReport
  let distBetweenNodes = null

  while (curNodeIndex < data.path.length-1) {
    curNode = data.path[curNodeIndex]
    nextNode = data.path[curNodeIndex+1]
    distBetweenNodes = distance(curNode.location, nextNode.location)

    if (distSinceProbableLastNode < distBetweenNodes) {
      // `curNode` is the last node which should have been visited already now
      break
    }
    else {
      distSinceProbableLastNode -= distBetweenNodes
      ++curNodeIndex
    }
  }

  if (distBetweenNodes === 0) {
    return true
  }

  let factorBetweenNodes = distSinceProbableLastNode / distBetweenNodes

  if (factorBetweenNodes >= 1 || curNodeIndex === data.path.length-1) {
    return true
  }

  lerpPos(mesh.position, curNode.location, nextNode.location, factorBetweenNodes)

  return false
}

/** integer division */
function intDiv(a, b) {
  return Math.floor(a / b)
}

/**
 * @param u in milliseconds since 1 January 1970
 * @returns `d`
 */
function unixTimeToDayFraction(u) {
  let t = moment(u)
  let y = t.year(), m = t.month()+1, D = t.date()
  let d = 367 * y - intDiv(7 * ( y + intDiv(m+9,12) ), 4) + intDiv(275*m, 9) + D - 730530
  let dayMs = t.milliseconds() + 1000*(t.seconds() + 60*(t.minutes() + 60*(t.hours())))
  let dayFraction = dayMs / DAY_MILLISECONDS
  return d + dayFraction
}

const DIFF_2000_1970 = moment('2000-01-01').diff('1970-01-01', 'ms') - 3600000 - 86400000
function dayFractionToUnixTime(d) {
  return Math.floor(d * DAY_MILLISECONDS + DIFF_2000_1970)
}

function getOrbitals(planet, d) {
  const o = $orbitals[planet]
  return {
    n: (o['n'][0] + o['n'][1] * d) * Math.PI / 180.0,
    i: (o['i'][0] + o['i'][1] * d) * Math.PI / 180.0,
    w: (o['w'][0] + o['w'][1] * d) * Math.PI / 180.0,
    a: o['a'][0] + o['a'][1] * d,
    e: (o['e'][0] + o['e'][1] * d) * Math.PI / 180.0,
    m: (o['m'][0] + o['m'][1] * d) * Math.PI / 180.0
  }
}

function genCoordinate(planet, max_day) {
  /*let points = (0..max_day).collect do |d|
    n,i,w,a,e,m = get_orbitals(planet,d)
    e2 = m + e * Math.sin(m) * (1.0 + e * Math.cos(m))

    xv = a * (Math.cos(e2) - e)
    yv = a * (Math.sqrt(1.0 - e*e) * Math.sin(e2))
    v = Math.atan2(yv, xv)
    r = Math.sqrt(xv*xv + yv*yv)

    xh = r * ( Math.cos(n) * Math.cos(v+w) - Math.sin(n) * Math.sin(v+w) * Math.cos(i))
    yh = r * ( Math.sin(n) * Math.cos(v+w) + Math.cos(n) * Math.sin(v+w) * Math.cos(i))
    zh = r * ( Math.sin(v+w) * Math.sin(i) )

    return [xh, yh, zh]
  }

  points.transpose*/
  }

})