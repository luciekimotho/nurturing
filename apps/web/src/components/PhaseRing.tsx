import type { CyclePhase } from '@nurturing/core'
import MenstrualDropletIcon from './MenstrualDropletIcon'
import OvulatorySparkIcon from './OvulatorySparkIcon'

const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '',
  follicular: '🌱',
  ovulatory: '',
  luteal: '🍂',
}

type PhaseRingProps = {
  topText: string
  phase: CyclePhase | null
  topTextClassName: string
  unknownLabel?: string
}

function toPhaseLabel(phase: CyclePhase): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1)
}

export default function PhaseRing({
  topText,
  phase,
  topTextClassName,
  unknownLabel = 'Unknown',
}: PhaseRingProps) {
  return (
    <div className="phase-ring-stack">
      <p className={topTextClassName}>{topText}</p>
      <p className="text-3xl font-semibold capitalize [font-family:var(--heading-font)] leading-none">
        {phase ? toPhaseLabel(phase) : unknownLabel}
      </p>
      <div className="phase-ring-icon-row">
        {phase === 'menstrual' ? (
          <MenstrualDropletIcon className="h-10 w-10 text-[#a83050] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
        ) : phase === 'ovulatory' ? (
          <OvulatorySparkIcon className="h-10 w-10 text-[#c89020] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
        ) : (
          <p className="text-3xl leading-none">{phase ? phaseEmoji[phase] : '•'}</p>
        )}
      </div>
    </div>
  )
}