const choo = require('choo')
const html = require('choo/html')

const canvas = html `<canvas id='canvas' width='500' height='500'></canvas>`
const s = new CanvasState(canvas)

const app = choo()
app.router(['/', view])
const tree = app.start()

document.body.appendChild(tree)

function Shape (x, y, w, h, fill) {
  this.x = x || 0
  this.y = y || 0
  this.w = w || 1
  this.h = h || 1
  this.fill = fill || '#AAAAAA'
}

Shape.prototype.draw = function (ctx) {
  ctx.fillStyle = this.fill
  ctx.fillRect(this.x, this.y, this.w, this.h)
}

Shape.prototype.contains = function (mx, my) {
  return (this.x <= mx) && (this.x + this.w >= mx) &&
         (this.y <= my) && (this.y + this.h >= my)
 }

const shape = new Shape()

function CanvasState (canvas) {
  this.canvas = canvas
  this.width = canvas.width
  this.height = canvas.height
  this.ctx = canvas.getContext('2d')

  const html = document.body.parentNode
  this.htmlTop = html.offsetTop
  this.htmlLeft = html.offsetLeft

  this.valid = false
  this.shapes = []
  this.dragging = false
  this.selection = null
  this.dragoffx = 0
  this.dragoffy = 0

  canvas.addEventListener('selectstart', e => {
    e.preventDefault()
    return false
  }, false)

  canvas.addEventListener('mousedown', e => {
    console.log('mousedown')
    const mouse = this.getMouse(e)
    const mx = mouse.x
    const my = mouse.y
    const shapes = this.shapes
    const l = shapes.length
    console.log(this)
    shapes.forEach(shape => {
      if (shape.contains(mx, my)) {
        this.dragoffx = mx - shape.x
        this.dragoffy = my - shape.y
        this.dragging = true
        this.selection = shape
        this.value = false
        return
      }
    })
    if (this.selection) {
      this.selection = null
      this.valid = false
    }
  }, true)

  canvas.addEventListener('mousemove', e => {
    if (this.dragging) {
      const mouse = this.getMouse(e)
      this.selection.x = mouse.x - this.dragoffx
      this.selection.y = mouse.y - this.dragoffy
      this.valid = false
    }
  }, true)

  canvas.addEventListener('mouseup', e => {
    this.dragging = false
  }, true)

  canvas.addEventListener('dblclick', e => {
    console.log('dblclick')
    const mouse = this.getMouse(e)
    this.addShape(new Shape(mouse.x - 20, mouse.y -20, 40, 40, 'red'))
  })

  this.selectionColor = '#CC0000'
  this.selectionWidth = 2
  this.interval = 30
  setInterval(() => { this.draw()}, this.interval )
}

CanvasState.prototype.addShape = function (shape) {
  this.shapes.push(shape)
  this.valid = false
}

CanvasState.prototype.draw = function () {
  if (!this.valid) {
    const ctx = this.ctx
    const shapes = this.shapes
    this.clear()

    shapes.forEach(shape => {
      const offscreen = shape.x > this.width || shape.y > this.height ||
        shape.x + shape.w < 0 || shape.y + shape.h < 0
      if (offscreen) return
      shape.draw(ctx)
    })

    this.valid = true

  }
}

CanvasState.prototype.clear = function () {
  this.ctx.clearRect(0, 0, this.width, this.height)
}

CanvasState.prototype.getMouse = function (e) {
  let element = this.canvas
  let offsetX = 0
  let offsetY = 0
  let mx, my

  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft
      offsetY += element.offsetTop
    } while ((element = element.offsetParent))
  }

  offsetX += this.htmlLeft
  offsetY += this.htmlTop

  mx = e.pageX - offsetX
  my = e.pageY - offsetY

  return {x: mx, y: my}
}



function view (state, prev, send) {
  return html `
    <div>
      ${canvas}
    </div>
  `
}
