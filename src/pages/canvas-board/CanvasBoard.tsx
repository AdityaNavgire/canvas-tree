import { useEffect, useRef, useState } from "react";

interface User {
  id: string;
  name: string;
  parentId?: string;
}

const USERS: User[] = [
  { id: "1", name: "Parent" },
  { id: "2", name: "Child 1", parentId: "1" },
  { id: "3", name: "Child 2", parentId: "1" },
  { id: "4", name: "Child 3", parentId: "1" },
];

const NODE_WIDTH = 160;
const NODE_HEIGHT = 70;
const VERTICAL_GAP = 120;
const HORIZONTAL_GAP = 220;

const CanvasBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  /* ---------- Resize ---------- */
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------- Draw ---------- */
  useEffect(() => {
    draw();
  }, [scale, offset, size]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    ctx.clearRect(-offset.x, -offset.y, size.width, size.height);

    drawTree(ctx);
  };

  /* ---------- Tree Layout ---------- */
  const drawTree = (ctx: CanvasRenderingContext2D) => {
    const parent = USERS.find(u => !u.parentId);
    if (!parent) return;

    const children = USERS.filter(u => u.parentId === parent.id);

    const centerX = size.width / 2 - NODE_WIDTH / 2;
    const parentY = 100;

    drawUser(ctx, parent, centerX, parentY);

    const startX =
      centerX -
      ((children.length - 1) * HORIZONTAL_GAP) / 2;

    children.forEach((child, index) => {
      const x = startX + index * HORIZONTAL_GAP;
      const y = parentY + VERTICAL_GAP;

      drawUser(ctx, child, x, y);

      drawLine(
        ctx,
        centerX + NODE_WIDTH / 2,
        parentY + NODE_HEIGHT,
        x + NODE_WIDTH / 2,
        y
      );
    });
  };

  /* ---------- Interactions ---------- */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.shiftKey) {
      setOffset(prev => ({ x: prev.x - e.deltaY, y: prev.y }));
      return;
    }

    const zoomSpeed = 0.001;
    setScale(prev =>
      Math.min(4, Math.max(0.25, prev - e.deltaY * zoomSpeed))
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;

    lastPosRef.current = { x: e.clientX, y: e.clientY };

    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      style={{
        display: "block",
        background: "#f8fafc",
        cursor: isDraggingRef.current ? "grabbing" : "grab",
      }}
    />
  );
};

export default CanvasBoard;

/* ---------- Drawing Helpers ---------- */

function drawUser(
  ctx: CanvasRenderingContext2D,
  user: User,
  x: number,
  y: number
) {
  ctx.fillStyle = "#4f46e5";
  ctx.fillRect(x, y, NODE_WIDTH, NODE_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    user.name,
    x + NODE_WIDTH / 2,
    y + NODE_HEIGHT / 2
  );
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
