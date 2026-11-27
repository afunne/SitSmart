import { useState, type ReactNode } from 'react'
import { Flex, Text } from '@radix-ui/themes'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type PieSectorShapeProps,
} from 'recharts'
import type { EventStatsDto } from '../../api/types.ts'
import { formatPercent } from '../../utils/format.ts'
import './StatsCharts.css'

/** A color token from theme.css as a hex string; SVG attributes can't use var(). */
function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** The theme colors the charts use, read once per chart. */
function useChartColors() {
  const [colors] = useState(() => ({
    surface: cssColor('--plum'),
    hoverBackground: cssColor('--plum-raised'),
    grid: cssColor('--royal'),
    text: cssColor('--off-white'),
    bar: cssColor('--ruby'),
    barHover: cssColor('--rose'),
    sold: cssColor('--seat-sold-chart'),
    reserved: cssColor('--seat-reserved'),
    free: cssColor('--seat-free'),
  }))
  return colors
}

/** Dark tooltip: the value first and strong, the name after it. */
function ChartTooltip({ value, label, color }: { value: ReactNode; label: string; color: string }) {
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-key" style={{ backgroundColor: color }} aria-hidden="true" />
      <strong className="tabular">{value}</strong> {label}
    </div>
  )
}

// ---- Donut: how one event's seats split ----

interface SeatShare {
  key: 'sold' | 'reserved' | 'free'
  label: string
  value: number
}

/**
 * Sold / reserved / free seats of one event as a donut, the fill % in the middle, and a legend
 * that also gives the numbers as text.
 */
export function SeatSplitDonut({ stats }: { stats: EventStatsDto }) {
  const colors = useChartColors()
  const shares: SeatShare[] = [
    { key: 'sold', label: 'Müüdud', value: stats.sold },
    { key: 'reserved', label: 'Broneeritud', value: stats.reserved },
    { key: 'free', label: 'Vabu', value: stats.free },
  ]
  // A part at zero draws nothing (and no gap of its own). Each sector takes its fill from its entry.
  const drawn = shares.filter(s => s.value > 0).map(s => ({ ...s, fill: colors[s.key] }))
  const summary = shares.map(s => `${s.label.toLowerCase()} ${s.value}`).join(', ')

  return (
    <figure className="chart-figure">
      <figcaption>
        <Text size="2" weight="medium">Kohtade jaotus</Text>
      </figcaption>
      <div className="donut">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart title={`Kohtade jaotus: ${summary}. Täituvus ${formatPercent(stats.fillPercent)}.`}>
            <Pie
              data={drawn}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              // The 2px gap between segments, in the card's own color.
              stroke={colors.surface}
              strokeWidth={2}
              shape={(props: PieSectorShapeProps) => (
                <Sector {...props} outerRadius={props.isActive ? props.outerRadius + 4 : props.outerRadius} />
              )}
            />
            <Tooltip
              content={({ active, payload }) => {
                const item = payload?.[0]
                if (!active || !item) return null
                const share = item.payload as SeatShare
                return <ChartTooltip value={share.value} label={share.label} color={colors[share.key]} />
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* The same figure is in the card's list below, so screen readers skip this one. */}
        <div className="donut-center" aria-hidden="true">
          <span className="donut-center-value">{formatPercent(stats.fillPercent)}</span>
          <span className="donut-center-label">täis</span>
        </div>
      </div>
      <Flex asChild direction="column" gap="1" mt="2">
        <ul className="chart-legend">
          {shares.map(s => (
            <li key={s.key}>
              <span className="chart-legend-swatch" style={{ backgroundColor: colors[s.key] }} aria-hidden="true" />
              <Text size="2">{s.label}</Text>
              <Text size="2" weight="medium" className="tabular chart-legend-value">{s.value}</Text>
            </li>
          ))}
        </ul>
      </Flex>
    </figure>
  )
}

// ---- Bars: fill % of every event ----

const ROW_HEIGHT = 32
const AXIS_HEIGHT = 32
const MAX_LABEL_LENGTH = 18

/** Long event names are cut on the axis; the tooltip and the table show them in full. */
const shortName = (name: string) =>
  name.length > MAX_LABEL_LENGTH ? `${name.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…` : name

interface FillPercentBarsProps {
  stats: EventStatsDto[]
  onSelect: (eventId: number) => void
}

/** Fill % per event as horizontal bars, in the table's order. Clicking a bar selects the event. */
export function FillPercentBars({ stats, onSelect }: FillPercentBarsProps) {
  const colors = useChartColors()
  const tick = { fill: colors.text, fontSize: 12 }

  return (
    <figure className="chart-figure">
      <figcaption>
        <Text size="2" weight="medium">Täituvus ürituste kaupa</Text>
        <Text size="1" color="gray" as="div">Täpsed arvud on tabelis.</Text>
      </figcaption>
      <ResponsiveContainer width="100%" height={stats.length * ROW_HEIGHT + AXIS_HEIGHT}>
        <BarChart
          data={stats}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
          title="Täituvus ürituste kaupa, protsentides"
        >
          <CartesianGrid horizontal={false} stroke={colors.grid} strokeWidth={1} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={tick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickFormatter={shortName}
            tick={tick}
            axisLine={{ stroke: colors.grid }}
            tickLine={false}
          />
          <Tooltip
            // Recharts draws the hover band with a #ccc outline by default.
            cursor={{ fill: colors.hoverBackground, stroke: 'none' }}
            content={({ active, payload }) => {
              const item = payload?.[0]
              if (!active || !item) return null
              const event = item.payload as EventStatsDto
              return <ChartTooltip value={formatPercent(event.fillPercent)} label={event.name} color={colors.bar} />
            }}
          />
          <Bar
            dataKey="fillPercent"
            name="Täituvus"
            fill={colors.bar}
            activeBar={{ fill: colors.barHover }}
            barSize={16}
            // 4px rounded at the data end, square at the baseline.
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(data) => onSelect((data.payload as EventStatsDto).eventId)}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
