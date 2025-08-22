import React, { useEffect, useRef, useState } from "react";

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 10;

export default function BreakoutGame() {
  const [paddleX, setPaddleX] = useState(WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState({ x: WIDTH / 2, y: HEIGHT - 50, dx: 3, dy: -3 });
  const [bricks, setBricks] = useState([]);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState({ left: false, right: false });

  const frameRef = useRef(null);

  const initRow = () => {
    const cols = 8;
    const brickW = 60;
    const brickH = 20;
    let arr = [];
    for (let c = 0; c < cols; c++) {
      arr.push({ x: 20 + c * (brickW + 10), y: 30, w: brickW, h: brickH, hit: false });
    }
    setBricks(arr);
  };

  const startGame = () => {
    setPaddleX(WIDTH / 2 - PADDLE_WIDTH / 2);
    setBall({ x: WIDTH / 2, y: HEIGHT - 50, dx: 3, dy: -3 });
    setScore(0);
    setLevel(1);
    initRow();
    setRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: true }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: true }));
    };
    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: false }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: false }));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 🟢 Touchsteuerung fürs iPhone
  const handleTouch = (e) => {
    if (!running) return;
    const touchX = e.touches[0].clientX;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = touchX - rect.left;
    if (relativeX < WIDTH / 2) {
      setKeys({ left: true, right: false });
    } else {
      setKeys({ left: false, right: true });
    }
  };

  const handleTouchEnd = () => {
    setKeys({ left: false, right: false });
  };

  useEffect(() => {
    if (!running) return;

    const update = () => {
      // Paddle Bewegung
      setPaddleX((x) => {
        let newX = x;
        if (keys.left) newX = Math.max(0, x - 6);
        if (keys.right) newX = Math.min(WIDTH - PADDLE_WIDTH, x + 6);
        return newX;
      });

      // Ball Bewegung
      setBall((b) => {
        let { x, y, dx, dy } = b;
        x += dx;
        y += dy;

        // Wände
        if (x <= 0 || x + BALL_SIZE >= WIDTH) dx = -dx;
        if (y <= 0) dy = -dy;

        // Paddle
        if (y + BALL_SIZE >= HEIGHT - PADDLE_HEIGHT && x >= paddleX && x <= paddleX + PADDLE_WIDTH) {
          dy = -Math.abs(dy);
        }

        // Bricks
        let newBricks = bricks.map((br) => {
          if (!br.hit && x < br.x + br.w && x + BALL_SIZE > br.x && y < br.y + br.h && y + BALL_SIZE > br.y) {
            dy = -dy;
            setScore((s) => s + 10);
            return { ...br, hit: true };
          }
          return br;
        });
        setBricks(newBricks);

        // Check: sind alle zerstört?
        if (newBricks.length > 0 && newBricks.every((br) => br.hit)) {
          setLevel((l) => l + 1);
          initRow();
          dx = Math.max(-4, Math.min(4, dx > 0 ? dx + 0.2 : dx - 0.2));
          dy = Math.max(-4, Math.min(4, dy > 0 ? dy + 0.2 : dy - 0.2));
        }

        // Game Over
        if (y > HEIGHT) {
          setRunning(false);
        }

        // verhindern, dass dy zu klein wird
        if (Math.abs(dy) < 1.5) {
          dy = dy < 0 ? -1.5 : 1.5;
        }

        return { x, y, dx, dy };
      });

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [running, paddleX, keys, bricks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Breakout</h1>
      <div
        className="relative bg-gray-900 rounded-xl overflow-hidden touch-none"
        style={{ width: WIDTH, height: HEIGHT }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
      >
        {/* Paddle */}
        <div className="absolute bg-green-400 rounded" style={{ left: paddleX, bottom: 0, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }} />

        {/* Ball */}
        <div className="absolute bg-yellow-300 rounded-full" style={{ left: ball.x, top: ball.y, width: BALL_SIZE, height: BALL_SIZE }} />

        {/* Bricks */}
        {bricks.map((br, i) => (
          !br.hit && <div key={i} className="absolute bg-red-500 rounded" style={{ left: br.x, top: br.y, width: br.w, height: br.h }} />
        ))}

        {/* Overlay */}
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            {score > 0 && <p className="mb-2">Game Over! Score: {score}</p>}
            <button onClick={startGame} className="px-4 py-2 bg-emerald-400 text-black rounded-lg font-semibold shadow">Starten</button>
          </div>
        )}
      </div>
      <div className="mt-4 text-lg">Score: {score} | Level: {level}</div>
    </div>
  );
}
