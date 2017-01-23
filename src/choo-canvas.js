const choo = require('choo')
const html = require('choo/html')

const canvas = html `<canvas id='canvas' width='500' height='500'></canvas>`
const s = new CanvasState(canvas)
const html = document.body.parentNode

const app = choo()
app.model({
  state: {
    canvas: canvas,
    width: canvas.width,
    height: canvas.height,
    ctx: canvas.getContext('2d'),

    htmlTop: html.offsetTop,
    htmlLeft: html.offsetLeft,

    valid: false,
    shapes: [],
    dragging: false,
    selection: null,
    dragoffx: 0,
    dragoffy: 0,
    selectionColor: '#CC0000',
    selectionWidth: 2
  },
  reducers: {
    update: (state, data, send, done) => data,
    addShape: (state, shape, send, done) => {
      return {
        shapes: shapes.concat(shape)
      }
    }
  },
  effects: {
    clear: () => {
      ctx.clearRect(0, 0, state.width, state.height)
    }
  },
  subscriptions: {
    onload: () => {
      canvas.addEventListener('selectstart', e => {
        e.preventDefault()
        return false
      }, false)

      canvas.addEventListener('mousedown', e => {
        const mouse = this.getMouse(canvas, e)
        const mx = mouse.x
        const my = mouse.y
        const shapes = this.shapes
        const l = shapes.length

        shapes.forEach(shape => {
          if (contains(mx, my, shape)) {
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
          const mouse = this.getMouse(canvas, e)
          this.selection.x = mouse.x - this.dragoffx
          this.selection.y = mouse.y - this.dragoffy
          this.valid = false
        }
      }, true)

      canvas.addEventListener('mouseup', e => {
        this.dragging = false
      }, true)

      canvas.addEventListener('dblclick', e => {
        const mouse = this.getMouse(e)
        send('addShape', newShape(mouse.x - 20, mouse.y -20, 40, 40, 'red'))
      })
    }
  }
})

app.router(['/', view])

function view (state, prev, send) {
  if (!state.valid) {
    ctx.clearRect(0, 0, state.width, state.height)

    state.shapes.forEach(shape => {
      const offscreen = shape.x > state.width || shape.y > state.height ||
        shape.x + shape.w < 0 || shape.y + shape.h < 0

      if (offscreen) return

      ctx.fillStyle = shape.fill
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h)
    })
  }

  return canvas
}

const tree = app.start()

document.body.appendChild(tree)

function getMouse (canvas, e) {
  let offsetX = 0
  let offsetY = 0
  let mx, my

  if (canvas.offsetParent !== undefined) {
    do {
      offsetX += canvas.offsetLeft
      offsetY += canvas.offsetTop
    } while ((canvas = canvas.offsetParent))
  }

  offsetX += state.htmlLeft
  offsetY += state.htmlTop

  mx = e.pageX - offsetX
  my = e.pageY - offsetY

  return {
    x: mx,
    y: my
  }
}

function newShape (x=0, y=0, w=1, h=1, fill='#AAAAAA') {
  return { x, y w, h, fill }
}

function contains (mx, my, shape) {
  return (shape.x <= mx) && (shape.x + shape.w >= mx) &&
         (shape.y <= my) && (shape.y + shape.h >= my)
}