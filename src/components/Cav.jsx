import React, { useImperativeHandle, useState, useEffect, useRef } from 'react'
import { forwardRef } from 'react'
import styles from './css/cav.module.less'
import Ctrl from './Ctrl'
import Draggable from 'react-draggable'
import Utils from './Utils'
import { EventEmitter } from 'events'

import Painter from './Painter'


let useArr = [true, false, false, false, false, false,false, false]

let selectArr = []

export default function Cav(props) {
    const [style, setstyle] = useState({})
    const [width, setwidth] = useState('')
    const [height, setheight] = useState('')
    const [keydown, setkeydown] = useState(false)
    const [num, setnum] = useState(0)
    const [imgsize, setimgsize] = useState(100)
    const [drag, setdrag] = useState(true)

    function setUseArr(arr) {
        useArr = arr
    }

    //监听鼠标位置
    const [mouse, setmouse] = useState({x: 0, y: 0})
    useEffect(() => {
        document.onmousemove = (e) => {
            let x = e.offsetX
            let y = e.offsetY
            setmouse({'x': x, 'y': y})
        }
    }, [mouse])

    function getMouse() {
        let e = window.event
        return {'x': e.offsetX, 'y': e.offsetY}
    }

    const cav = useRef(null)
    const out = useRef(null)

    //控制器
    const [ctx, setctx] = useState(null)
    useEffect(() => {
        setctx(cav.current.getContext('2d'))
    }, [cav])

    const [reset, setreset] = useState([])


    

    //画布移动控制
    useEffect(() => {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') setdrag(true)
        })
        let down = cav.current.onmousedown
        let move = cav.current.onmousemove
        let up = cav.current.onmouseup
        document.onkeydown = function(e) {
            if (e.key === 'Alt') {
                cav.current.onmousedown = null
                cav.current.onmousemove = null
                cav.current.onmouseup = null
                setdrag(false)
            }
        }
        document.onkeyup = function(e) {
            if (e.key === 'Alt') {
                setdrag(true)
                cav.current.onmousedown = down
                cav.current.onmousemove = move
                cav.current.onmouseup = up
            }
        }
    }, [cav])

    //初始化画布
    useEffect(() => {
        setcav(props.url)
    }, [ctx, props.url, width, height])

    function setcav(url) {
        const img = new Image()
        img.src = url
        //if (!img.width) return 
        img.onload = () => {
            let style = {
                transform: 'scale(100%)',
                transition: '0.3s'
            }
            setwidth(img.width + 'px')
            setheight(img.height + 'px')
            setstyle(style)
                
            setTimeout(() => {
                let ctx = cav.current.getContext('2d')
                ctx.drawImage(img, 0, 0)
                let arr = [...reset]
                arr.push(ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1))
                setreset(arr)
                let tmp = new Array(height.slice(0, -2) * 1).fill().map(() => {
                    return new Array(width.slice(0, -2) * 1).fill(false)
                })
            }, 0)
        }
    }

    function setSize(i) {
        let n = cav.current.style.transform.slice(6, -1) * 100
        i === 0 ? n -= 5 : n += 5
        setimgsize(n)
        cav.current.style.transform = `scale(${Math.round(n)}%)`
    }

    //绘制完成压栈
    const [resetS, setresetS] = useState(0)
    function onreset(ctx/* , reset, resetS, setreset, setresetS, width, height */) {
        let arr = [...reset]
        if (resetS !== arr.length - 1) {
            arr = arr.slice(0, resetS + 1)
        }
        setresetS(resetS + 1)
        arr.push(ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1))
        setreset(arr)
    }

    //撤销
    function reback() {
        if (resetS === 0) return
        setresetS(resetS - 1)
        ctx.putImageData(reset[resetS - 1], 0, 0)
    }
    //重做
    function redo() {
        if (resetS === reset.length - 1) return
        setresetS(resetS + 1)
        ctx.putImageData(reset[resetS + 1], 0, 0)
    }

    //鼠标函数
    function mouseUtil() {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
    }

    //画笔参数
    const [color, setcolor] = useState({r: 0, g: 0, b: 0, a: 1})
    const [lineWidth, setlineWidth] = useState(3)

    //draw函数
    const [ismove, setismove] = useState(false)
    function draw(/* color, lineWidth, ismove, reset, resetS, setreset, setresetS */) {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
        let ctx = cav.current.getContext('2d')
        let mouse
        cav.current.onmousedown = (e) => {
            ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`
            ctx.lineWidth = lineWidth
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.beginPath()
            mouse = getMouse()
            ctx.moveTo(mouse.x, mouse.y)
            setismove(true)
            //ismove = true
        }
        cav.current.onmousemove = (e) => {
            if (ismove) {
                mouse = getMouse()
                ctx.lineTo(mouse.x, mouse.y)
                ctx.stroke()
            }
        }
        cav.current.onmouseup = (e) => {
            setismove(false)
            //ismove = false
            onreset(ctx/* , reset, resetS, setreset, setresetS, width, height */)
        }
    }

    //绘制矩形
    const [rectarr, setrectarr] = useState([])
    const [imgdata, setimgdata] = useState(null)
    const [isFull, setisFull] = useState(false)
    function rect(/* color, lineWidth, width, height, ismove, reset, resetS, setreset, setresetS */) {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
        let ctx = cav.current.getContext('2d')
        let mouse
        //let imgdata
        //let arr = []
        cav.current.onmousedown = (e) => {
            ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`
            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`
            ctx.lineWidth = lineWidth
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            mouse = getMouse()
            let arr = [...rectarr]
            arr[0] = mouse.x
            arr[1] = mouse.y
            setrectarr(arr)
            setismove(true)
            //ismove = true
            setimgdata(ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1))
            //imgdata = ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1)
        }
        cav.current.onmousemove = (e) => {
            if (ismove) {
                ctx.putImageData(imgdata, 0, 0)
                let arr = [...rectarr]
                mouse = getMouse()
                arr[2] = mouse.x
                arr[3] = mouse.y
                setrectarr(arr)
                if (isFull) {
                    ctx.fillRect(arr[0], arr[1], arr[2] - arr[0], arr[3] - arr[1])
                } else {
                    ctx.strokeRect(arr[0], arr[1], arr[2] - arr[0], arr[3] - arr[1])
                }
                
            }
        }
        cav.current.onmouseup = (e) => {
            setrectarr([])
            //arr = []
            setismove(false)
            //ismove = false
            onreset(ctx/* , reset, resetS, setreset, setresetS, width, height */)
        }
    }

    //吸管
    function straw() {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
        let ctx = cav.current.getContext('2d')
        let mouse
        cav.current.onmousedown = () => {
            mouse = getMouse()
            let onePx = ctx.getImageData(mouse.x, mouse.y, 1, 1).data
            let obj = {...color}
            obj.r = onePx[0]
            obj.g = onePx[1]
            obj.b = onePx[2]
            obj.a = onePx[3] / 255
            setcolor(obj)
        }
    }

    //魔棒
    const [mLimit, setmLimit] = useState(50)
    const [mColor, setmColor] = useState({r: 0, g: 0, b: 0})
    function magic() {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
        let ctx = cav.current.getContext('2d')
        let mouse
        let onePx
        let allImageData = ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1)
        let allData1 = ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1).data
        cav.current.onmousedown = () => {
            mouse = getMouse()
            onePx = ctx.getImageData(mouse.x, mouse.y, 1, 1).data
            let l = 0, r = width.slice(0, -2) * 1, up = 0, down = height.slice(0, -2) * 1
            if (selectArr.length > 0) {
                l = selectArr[0]
                r = selectArr[2] - l
                up = selectArr[1]
                down = selectArr[3] - up
            }
            /* for (let i = l; i < r; i++) {
                for (let j = up; j < down; j++) {
                    let thisData = ctx.getImageData(i, j, 1, 1).data
                    let s2 = Math.pow((onePx[0] - thisData[0]), 2) + Math.pow((onePx[1] - thisData[1]), 2) + Math.pow((onePx[2] - thisData[2]), 2)
                    if (s2 / 3 <= mLimit) {
                        thisData[0] = thisData[0] + mColor.r
                        thisData[1] = thisData[1] + mColor.g
                        thisData[2] = thisData[2] + mColor.b
                    }
                }
            } */
            for (let i = 0; i < allImageData.data.length; i += 4) {
                let allData = allImageData.data
                let s2 = Math.pow((onePx[0] - allData[i]), 2) + Math.pow((onePx[1] - allData[i + 1]), 2) + Math.pow((onePx[2] - allData[i + 2]), 2)
                if (s2 / 3 <= mLimit) {
                    allData[i] = allData1[i] + mColor.r
                    allData[i + 1] = allData1[i + 1] + mColor.g
                    allData[i + 2] = allData1[i + 2] + mColor.b
                }
            }
            ctx.putImageData(allImageData, 0, 0)
            onreset(ctx)
        }
    }

    //选区
    //const [start, setstart] = useState([])
    function select() {
        cav.current.onmousedown = null
        cav.current.onmousemove = null
        cav.current.onmouseup = null
        let ctx = cav.current.getContext('2d')
        let mouse
        //let imgdata
        //let arr = []
        cav.current.onmousedown = (e) => {
            ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`
            ctx.lineWidth = lineWidth
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            mouse = getMouse()
            let arr = [...rectarr]
            arr[0] = mouse.x
            arr[1] = mouse.y
            setrectarr(arr)
            setismove(true)
            //ismove = true
            setimgdata(ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1))
            //imgdata = ctx.getImageData(0, 0, width.slice(0, -2) * 1, height.slice(0, -2) * 1)
        }
        cav.current.onmousemove = (e) => {
            if (ismove) {
                ctx.putImageData(imgdata, 0, 0)
                let arr = [...rectarr]
                mouse = getMouse()
                arr[2] = mouse.x
                arr[3] = mouse.y
                setrectarr(arr)
                ctx.strokeRect(arr[0], arr[1], arr[2] - arr[0], arr[3] - arr[1])
            }
        }
        cav.current.onmouseup = (e) => {
            selectArr = rectarr
            setrectarr([])
            //arr = []
            setismove(false)
            //ismove = false
            //onreset(ctx/* , reset, resetS, setreset, setresetS, width, height */)
        }
    }

    /* useEffect(() => {
        select()
    }, [mouse]) */


    //工具栏
    useEffect(() => {
        if (useArr[0]) {
            mouseUtil()
        }
        if (useArr[1]) {
            draw()
        }
        if (useArr[2]) {
            magic()
        }
        if (useArr[3]) {
            straw()
        }
        if (useArr[4]) {
            rect()
        }
/*         if (useArr[5]) {
            select()
        } */
    }, [mouse, ctx, rectarr, mLimit, mColor, isFull])

    return (
        <div className=''>
            <div className={styles.bg}>
                <Draggable disabled={drag}>
                    <div className="cavbox" ref={out}>
                        <div className={style.cav}>
                            <canvas width={width} height={height} style={style} ref={cav} className="cav"></canvas>
                        </div>
                    </div>
                </Draggable>
            </div>
            {/* <button onClick={() => useArr[5] = !useArr[5]}>选区</button> */}
            {props.vis && <Painter 
                setC={setcolor}
                setlineWidth={setlineWidth} 
                color={color} mLimit={mLimit} 
                setmLimit={setmLimit}
                mColor={mColor}
                setmColor={setmColor}
                useArr={useArr}
                reset={reset}
                resetS={resetS}
                setisFull={setisFull}></Painter>}
            {props.vis && <Ctrl imgsize={imgsize} setSize={setSize}></Ctrl>}
            <Utils useArr={useArr} setUseArr={setUseArr} reback={reback} redo={redo}></Utils>
        </div>
    )
}

