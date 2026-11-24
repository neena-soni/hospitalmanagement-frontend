const WIDTH = 1000
const HEIGHT = 320
const MID = HEIGHT / 2
const AMPLITUDE = 100
const TURNS = 3.5
const STEP = 5
const RUNGS = 30

const CLAY = '#BF512C'
const BRASS = '#957445'

const angleAt = (x) => (x / WIDTH) * TURNS * 2 * Math.PI

function buildStrand(phase) {
  let front = ''
  let back = ''
  let previous = null

  for (let x = 0; x <= WIDTH; x += STEP) {
    const t = angleAt(x) + phase
    const point = {
      x,
      y: MID + AMPLITUDE * Math.sin(t),
      isFront: Math.cos(t) > 0,
    }
    const here = `${point.x} ${point.y.toFixed(1)}`

    let piece
    if (!previous) {
      piece = ` M${here}`
    } else if (previous.isFront === point.isFront) {
      piece = ` L${here}`
    } else {
      piece = ` M${previous.x} ${previous.y.toFixed(1)} L${here}`
    }

    if (point.isFront) front += piece
    else back += piece
    previous = point
  }

  return { front, back }
}

const strandA = buildStrand(0)
const strandB = buildStrand(Math.PI)

const rungs = Array.from({ length: RUNGS + 1 }, (_, k) => {
  const x = (k / RUNGS) * WIDTH
  const offset = AMPLITUDE * Math.sin(angleAt(x))
  return {
    x,
    y1: MID + offset,
    y2: MID - offset,
    strength: Math.abs(Math.sin(angleAt(x))),
  }
})

export default function DnaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -right-48 -top-20 -z-10 w-[760px] -rotate-[18deg] opacity-50 [mask-image:linear-gradient(to_right,transparent,black_35%)] md:w-[1100px]"
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} fill="none">
        <defs>
          <linearGradient id="dna-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={BRASS} />
            <stop offset="100%" stopColor={CLAY} />
          </linearGradient>
        </defs>

        <g stroke="url(#dna-gradient)" strokeWidth="3" opacity="0.35" strokeLinecap="round">
          <path d={strandA.back} />
          <path d={strandB.back} />
        </g>

        {rungs.map((rung) =>
          rung.strength < 0.12 ? null : (
            <g key={rung.x}>
              <line
                x1={rung.x}
                y1={rung.y1}
                x2={rung.x}
                y2={rung.y2}
                stroke={BRASS}
                strokeWidth="2"
                opacity={0.15 + 0.45 * rung.strength}
              />
              <circle cx={rung.x} cy={rung.y1} r="3.5" fill={BRASS} opacity={0.25 + 0.45 * rung.strength} />
              <circle cx={rung.x} cy={rung.y2} r="3.5" fill={CLAY} opacity={0.25 + 0.45 * rung.strength} />
            </g>
          ),
        )}

        <g stroke="url(#dna-gradient)" strokeWidth="5" strokeLinecap="round" opacity="0.8">
          <path d={strandA.front} />
          <path d={strandB.front} />
        </g>
      </svg>
    </div>
  )
}