import { useState, useEffect } from "react";

// --- Utility Functions ---
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
const getProgress = (current: number, start: number, end: number) =>
  clamp((current - start) / (end - start), 0, 1);

// --- Data & Paths (dense, compact plant — branches close together) ---
const WHEAT_BRANCHES = [
  // Center branch continues upward from main stem end
  { id: 0, cx: 400, cy: 150, rot: 0, delay: 0.4, path: "M 400 380 C 390 300 410 220 400 150" },
  // Tight pairs — branches start close together on the stem
  { id: 1, cx: 450, cy: 210, rot: 15, delay: 0.45, path: "M 400 430 C 400 380 435 280 450 210" },
  { id: 2, cx: 350, cy: 220, rot: -15, delay: 0.48, path: "M 400 440 C 400 380 365 290 350 220" },
  { id: 3, cx: 490, cy: 310, rot: 25, delay: 0.52, path: "M 400 500 C 405 450 465 360 490 310" },
  { id: 4, cx: 310, cy: 320, rot: -25, delay: 0.55, path: "M 400 510 C 395 450 335 370 310 320" },
  { id: 5, cx: 520, cy: 400, rot: 35, delay: 0.60, path: "M 400 570 C 410 530 490 440 520 400" },
  { id: 6, cx: 280, cy: 410, rot: -35, delay: 0.63, path: "M 400 580 C 390 530 310 460 280 410" },
];

const LEAVES = [
  { id: 1, path: "M 400 680 Q 320 650 270 540 Q 340 610 398 650", delay: 0.2 },
  { id: 2, path: "M 398 600 Q 480 560 530 430 Q 460 520 398 560", delay: 0.25 },
  { id: 3, path: "M 400 530 Q 330 490 290 380 Q 350 460 400 490", delay: 0.3 },
  { id: 4, path: "M 398 470 Q 460 430 490 330 Q 430 400 398 430", delay: 0.35 },
];

// --- Sub-Components ---

/** A single realistic wheat grain with curved body and subtle awn */
function WheatGrain({
  x,
  y,
  angle,
  scale,
  opacity,
  fill,
  strokeColor,
}: {
  x: number;
  y: number;
  angle: number;
  scale: number;
  opacity: number;
  fill: string;
  strokeColor: string;
}) {
  const awnDir = angle > 0 ? 1 : -1;
  // Subtle short awn curving slightly outward
  const awnPath = `M0,-11 Q${awnDir * 3},-22 ${awnDir * 5},-32`;

  // Curved grain body — bows outward slightly for realism
  const bodyPath = awnDir > 0
    ? "M0,0 C-2,-3 -2,-10 0,-13 C3,-10 4,-5 0,0 Z"  // right grain curves right
    : "M0,0 C2,-3 2,-10 0,-13 C-3,-10 -4,-5 0,0 Z"; // left grain curves left

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${angle}) scale(${scale})`}
      opacity={opacity}
    >
      {/* Subtle Awn (Hair) */}
      <path
        d={awnPath}
        stroke={strokeColor}
        fill="none"
        strokeWidth="0.5"
        opacity={0.4}
        strokeLinecap="round"
      />
      {/* Curved grain body */}
      <path
        d={bodyPath}
        fill={fill}
      />
      {/* Inner crease */}
      <path
        d={`M0,-1 Q${awnDir * 0.5},-6 0,-12`}
        stroke={strokeColor}
        fill="none"
        strokeWidth="0.3"
        opacity={0.25}
      />
    </g>
  );
}

/** A full wheat ear — grains packed tightly along curved central rachis */
function WheatEar({
  cx,
  cy,
  rot,
  progress,
  colorProgress,
}: {
  cx: number;
  cy: number;
  rot: number;
  progress: number;
  colorProgress: number;
}) {
  const grains: JSX.Element[] = [];
  const numPairs = 20; // Very dense packing
  const earScale = getProgress(progress, 0, 0.2);

  const greenFill = "#22c55e";
  const goldFill = "#d4a017";
  const greenStroke = "#16a34a";
  const goldStroke = "#b8860b";

  for (let i = 0; i < numPairs; i++) {
    const grainY = -3 - i * 3.5; // Ultra-tight spacing
    const grainScale = 1 - i * 0.015;
    const grainGrowProgress = getProgress(progress, i * 0.006, 0.12 + i * 0.006);

    // Slight alternating offset for organic look
    const offsetX = i % 2 === 0 ? -0.3 : 0.3;

    // Very gentle outward angle: only ~1° per grain for subtle splay
    const outwardCurve = i * 1;

    // Green grains
    grains.push(
      <WheatGrain
        key={`l-${i}`}
        x={-2 + offsetX}
        y={grainY}
        angle={-20 - outwardCurve}
        scale={grainScale * grainGrowProgress}
        opacity={grainGrowProgress * (1 - colorProgress)}
        fill={greenFill}
        strokeColor={greenStroke}
      />
    );
    grains.push(
      <WheatGrain
        key={`r-${i}`}
        x={2 - offsetX}
        y={grainY}
        angle={20 + outwardCurve}
        scale={grainScale * grainGrowProgress}
        opacity={grainGrowProgress * (1 - colorProgress)}
        fill={greenFill}
        strokeColor={greenStroke}
      />
    );

    // Golden overlay grains
    grains.push(
      <WheatGrain
        key={`l-gold-${i}`}
        x={-2 + offsetX}
        y={grainY}
        angle={-20 - outwardCurve}
        scale={grainScale * grainGrowProgress}
        opacity={grainGrowProgress * colorProgress}
        fill={goldFill}
        strokeColor={goldStroke}
      />
    );
    grains.push(
      <WheatGrain
        key={`r-gold-${i}`}
        x={2 - offsetX}
        y={grainY}
        angle={20 + outwardCurve}
        scale={grainScale * grainGrowProgress}
        opacity={grainGrowProgress * colorProgress}
        fill={goldFill}
        strokeColor={goldStroke}
      />
    );
  }

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rot}) scale(${earScale})`}>
      {/* Central Rachis (curved) — shorter to match denser grain packing */}
      <path
        d="M0,0 Q-1,-30 1,-68"
        stroke="#22c55e"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity={1 - colorProgress}
      />
      <path
        d="M0,0 Q-1,-30 1,-68"
        stroke="#b8860b"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity={colorProgress}
      />
      {grains}
    </g>
  );
}

// --- Main Component ---
export function WheatScrollAnimation() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0;
      setScrollProgress(scroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Animation Timing ---
  const seedOpacity = 1 - getProgress(scrollProgress, 0.05, 0.15);
  const stemProgress = getProgress(scrollProgress, 0.05, 0.25);
  const colorProgress = getProgress(scrollProgress, 0.6, 0.8);

  return (
    <div
      className="fixed bottom-0 right-0 pointer-events-none z-[1]"
      style={{
        transform: "rotate(-20deg) translate(15vw, 6vh)",
        transformOrigin: "bottom right",
      }}
    >
      <style>{`
        @keyframes wheat-sway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
      `}</style>
      <div className="w-[300px] h-[85vh] md:w-[420px] md:h-[90vh] lg:w-[500px] lg:h-[95vh]"
        style={{
          animation: "wheat-sway 6s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      >
        <svg
          viewBox="100 50 600 750"
          className="w-full h-full"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Ground — only appears as plant grows */}
          {stemProgress > 0 && (
            <ellipse
              cx="400"
              cy="760"
              rx="250"
              ry="16"
              fill="#3f2e1e"
              opacity={0.3 * stemProgress}
            />
          )}

          {/* The Initial Seed */}
          <g transform="translate(400, 750)" opacity={seedOpacity}>
            <ellipse cx="0" cy="0" rx="7" ry="11" fill="#d97706" />
            <path
              d="M-3,-4 Q0,-12 3,-4"
              stroke="#f59e0b"
              fill="none"
              strokeWidth="1"
            />
          </g>

          {/* Main Stem (curved, green) */}
          {stemProgress > 0 && (
            <path
              d="M 400 750 C 390 640 410 480 400 380"
              fill="none"
              stroke="#22c55e"
              strokeWidth="7"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset={100 - stemProgress * 100}
              opacity={1 - colorProgress}
            />
          )}
          {/* Main Stem (curved, golden overlay) */}
          {stemProgress > 0 && colorProgress > 0 && (
            <path
              d="M 400 750 C 390 640 410 480 400 380"
              fill="none"
              stroke="#b8860b"
              strokeWidth="7"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset={100 - stemProgress * 100}
              opacity={colorProgress}
            />
          )}

          {/* Leaves */}
          {LEAVES.map((leaf) => {
            const leafGrow = getProgress(
              scrollProgress,
              leaf.delay,
              leaf.delay + 0.15
            );
            return (
              <g key={`leaf-${leaf.id}`}>
                <path
                  d={leaf.path}
                  fill="#4ade80"
                  opacity={0.7 * (1 - colorProgress)}
                  style={{
                    transformOrigin: "400px 600px",
                    transform: `scale(${leafGrow})`,
                  }}
                />
                <path
                  d={leaf.path}
                  fill="#d4a017"
                  opacity={0.7 * colorProgress}
                  style={{
                    transformOrigin: "400px 600px",
                    transform: `scale(${leafGrow})`,
                  }}
                />
              </g>
            );
          })}

          {/* Branches & Ears */}
          {WHEAT_BRANCHES.map((branch) => {
            const branchProgress = getProgress(
              scrollProgress,
              branch.delay,
              branch.delay + 0.1
            );
            const earProgress = getProgress(
              scrollProgress,
              branch.delay + 0.1,
              branch.delay + 0.3
            );

            // Don't render anything until there's actual progress
            if (branchProgress <= 0) return null;

            return (
              <g key={`branch-${branch.id}`}>
                {/* Branch Stem Green */}
                <path
                  d={branch.path}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeLinecap="butt"
                  pathLength={100}
                  strokeDasharray="100"
                  strokeDashoffset={100 - branchProgress * 100}
                  opacity={1 - colorProgress}
                />
                {/* Branch Stem Gold */}
                {colorProgress > 0 && (
                  <path
                    d={branch.path}
                    fill="none"
                    stroke="#b8860b"
                    strokeWidth="3.5"
                    strokeLinecap="butt"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={100 - branchProgress * 100}
                    opacity={colorProgress}
                  />
                )}

                {/* Wheat Ears */}
                {branchProgress > 0.9 && (
                  <WheatEar
                    cx={branch.cx}
                    cy={branch.cy}
                    rot={branch.rot}
                    progress={earProgress}
                    colorProgress={colorProgress}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
