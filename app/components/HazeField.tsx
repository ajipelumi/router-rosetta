'use client'

import {useEffect, useRef, useState} from 'react'

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `precision mediump float;
uniform vec2 u_res;
uniform float u_t;
uniform vec2 u_ptr;
uniform vec3 u_ink;
uniform float u_dark;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}

float fbm(vec2 p){
  float v=0., a=.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; }
  return v;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);
  vec2 drift=vec2(cos(u_t*.05),sin(u_t*.04))*.35;
  vec2 q=uv*1.6+drift+u_ptr*.12;

  float f=fbm(q+fbm(q*1.4+u_t*.02));
  float haze=smoothstep(.35,.95,f);

  float vignette=1.-smoothstep(.15,1.05,length(uv));
  float top=1.-smoothstep(-.1,.85,uv.y);
  float a=haze*vignette*top*(u_dark>.5?.62:.5);

  gl_FragColor=vec4(u_ink,a);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)
  if (!s) return null
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

export function HazeField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let gl: WebGLRenderingContext | null = null
    try {
      gl = (canvas.getContext('webgl', {alpha: true, antialias: false, depth: false}) ||
        canvas.getContext('experimental-webgl', {alpha: true})) as WebGLRenderingContext | null
    } catch {
      gl = null
    }
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) {
      setFailed(true)
      return
    }
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uT = gl.getUniformLocation(prog, 'u_t')
    const uPtr = gl.getUniformLocation(prog, 'u_ptr')
    const uInk = gl.getUniformLocation(prog, 'u_ink')
    const uDark = gl.getUniformLocation(prog, 'u_dark')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const ptr = {x: 0, y: 0}
    const target = {x: 0, y: 0}

    function readTheme() {
      const dark = document.documentElement.dataset.theme === 'dark'
      return dark ? {ink: [0.98, 0.55, 0.25], dark: 1} : {ink: [0.92, 0.35, 0.05], dark: 0}
    }

    function resize() {
      const c = canvasRef.current
      if (!c || !gl) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.floor(c.clientWidth * dpr)
      const h = Math.floor(c.clientHeight * dpr)
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    function onMove(e: PointerEvent) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
    }

    window.addEventListener('pointermove', onMove, {passive: true})
    window.addEventListener('resize', resize)
    resize()

    let raf = 0
    const start = performance.now()

    function frame(now: number) {
      if (!gl) return
      resize()
      ptr.x += (target.x - ptr.x) * 0.03
      ptr.y += (target.y - ptr.y) * 0.03

      const theme = readTheme()
      const t = reduce ? 0 : (now - start) / 1000

      gl.uniform2f(uRes, canvas!.width, canvas!.height)
      gl.uniform1f(uT, t)
      gl.uniform2f(uPtr, ptr.x, ptr.y)
      gl.uniform3f(uInk, theme.ink[0], theme.ink[1], theme.ink[2])
      gl.uniform1f(uDark, theme.dark)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (!reduce) raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  if (failed) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%)',
        }}
      />
    )
  }

  return (
    <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
  )
}
