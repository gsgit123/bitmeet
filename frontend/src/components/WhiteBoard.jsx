import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000");


const WhiteBoard = ({ meetId }) => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        socket.emit("join-board", meetId);
        socket.on("stroke", (stroke) => {
            drawStroke(ctx, stroke);
        });

        return () => {
            socket.off("stroke");
        };


    }, [meetId]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    };

    const drawStroke = (ctx, stroke) => {
        ctx.beginPath();
        stroke.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    };

    const startDraw = (e) => {
        setDrawing(true);
        const point = getPos(e);
        setCurrentStroke([point]);
    };

    const draw = (e) => {
        if (!drawing) return;
        const point = getPos(e);

        setCurrentStroke((prev) => {
            const updated = [...prev, point];
            const ctx = canvasRef.current.getContext("2d");
            drawStroke(ctx, { points: updated });
            return updated;
        });
    };

    const endDraw = () => {
        setDrawing(false);
        socket.emit("stroke", {
            meetId,
            stroke: { points: currentStroke },
        });
        setCurrentStroke([]);
    };


    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full bg-white cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
        />
    )
}

export default WhiteBoard