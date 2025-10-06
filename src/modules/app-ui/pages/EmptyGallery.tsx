import { Button } from '@/modules/base-ui/components/ui/Button'
import * as React from 'react'
import { EmptyCalendar } from '../svg/EmptyCalendar'
import { EmptyCards } from '../svg/EmptyCards'
import { EmptyGraph } from '../svg/EmptyGraph'
import { EmptyLedger } from '../svg/EmptyLedger'
import { EmptyOpenBox } from '../svg/EmptyOpenBox'
import { EmptySearchCoins } from '../svg/EmptySearchCoins'
import { EmptyWallet } from '../svg/EmptyWallet'
import { EmptyIllustration } from '../svg/empty'

interface Item { key: string; label: string; Component: React.ComponentType<Record<string, unknown>>; note?: string }

const items: Item[] = [
    { key: 'ledger', label: 'Ledger Fade', Component: EmptyLedger },
    { key: 'search', label: 'Search / Coins', Component: EmptySearchCoins, note: 'Re-export of main EmptyIllustration' },
    { key: 'box', label: 'Open Box', Component: EmptyOpenBox },
    { key: 'wallet', label: 'Wallet', Component: EmptyWallet },
    { key: 'calendar', label: 'Calendar', Component: EmptyCalendar },
    { key: 'graph', label: 'Graph Placeholder', Component: EmptyGraph },
    { key: 'cards', label: 'Card Stack', Component: EmptyCards },
]

export default function EmptyGallery() {
    const [tone, setTone] = React.useState<'neutral' | 'accent'>('accent')
    const [animated, setAnimated] = React.useState(true)
    const [size, setSize] = React.useState(200)
    const [selected, setSelected] = React.useState<string>('search')

    const Active = items.find(i => i.key === selected)?.Component || EmptyIllustration

    return (
        <div className='p-6 space-y-8'>
            <div className='flex flex-wrap gap-4 items-center'>
                <div className='flex gap-2'>
                    {items.map(i => (
                        <Button key={i.key} variant={i.key === selected ? 'default' : 'outline'} size='sm' onClick={() => setSelected(i.key)}>{i.label}</Button>
                    ))}
                </div>
                <div className='flex gap-2 items-center'>
                    <Button variant={tone === 'accent' ? 'default' : 'outline'} size='sm' onClick={() => setTone(tone === 'accent' ? 'neutral' : 'accent')}>
                        Tone: {tone}
                    </Button>
                    <Button variant={animated ? 'default' : 'outline'} size='sm' onClick={() => setAnimated(a => !a)}>
                        {animated ? 'Animated' : 'Static'}
                    </Button>
                    <label className='text-sm flex items-center gap-2'>
                        Size
                        <input type='range' min={120} max={420} value={size} onChange={e => setSize(parseInt(e.target.value))} />
                    </label>
                </div>
            </div>

            <div className='grid lg:grid-cols-2 gap-10'>
                <div className='flex flex-col items-center justify-center rounded-xl border p-6 bg-background relative'>
                    <Active size={size} tone={tone} animated={animated} />
                    <div className='absolute top-2 right-3 text-xs text-muted-foreground'>{selected}</div>
                </div>
                <div className='space-y-4 text-sm leading-relaxed'>
                    <h2 className='text-xl font-semibold'>Empty illustration variants</h2>
                    <p>Select among multiple empty-state visuals. Adjust tone, animation, and size for evaluation.</p>
                    <ul className='list-disc pl-5 space-y-1'>
                        <li>All SVG based (no external assets).</li>
                        <li>Accept common props (size, animated, tone).</li>
                        <li>Accessible: supply title/desc props if semantic meaning required.</li>
                    </ul>
                    <p className='text-muted-foreground'>You can copy the component you prefer directly from the svg directory and tailor further.</p>
                </div>
            </div>
        </div>
    )
}
