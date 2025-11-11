import { SystemSubtags, SystemTags } from "@/modules/app/common/SystemTags";
import EmptyGraph from "@/modules/base-ui/components/illustrations/EmptyGraph";
import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import EmptySearch from "@/modules/base-ui/components/illustrations/EmptySearch";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { CircleX } from "lucide-react";
import React, { useState } from "react";
import PageLayout from "../components/layouts/PageLayout";
import TagIcons from "../icons/tags/TagIcons";

interface Item { key: string; label: string; Component: React.ComponentType<Record<string, unknown>>; note?: string }

const items: Item[] = [
    { key: 'search', label: 'Search / Coins', Component: EmptySearch, note: 'Re-export of main EmptyIllustration' },
    { key: 'box', label: 'Open Box', Component: EmptyOpenBox },
    { key: 'graph', label: 'Graph Placeholder', Component: EmptyGraph },
]

const EmptyGallery: React.FC = () => {
    const [tone, setTone] = React.useState<'neutral' | 'accent'>('accent')
    const [animated, setAnimated] = React.useState(true)
    const [size, setSize] = React.useState(200)
    const [selected, setSelected] = React.useState<string>('search')

    const Active = items.find(i => i.key === selected)?.Component || EmptySearch

    return (
        <div className='p-6 space-y-8'>
            <div className='flex flex-wrap gap-4 items-center'>
                <div className='flex flex-wrap gap-2'>
                    {items.map(i => (
                        <Button key={i.key} variant={i.key === selected ? 'default' : 'outline'} size='sm' onClick={() => setSelected(i.key)}>{i.label}</Button>
                    ))}
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
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

const Dashboard: React.FC = () => {

    const [searchText, setSearchText] = useState<string | null>(null);

    const search = (text: string) => {
        setSearchText(text);
    }

    //     className=" glass h-40 w-120 rounded-lg flex items-center justify-center "> // 
    const Block = () => {
        return <div
            className="glass h-10 w-40 bg-secondary rounded-lg flex items-center justify-center ">
            Block
        </div>
    }

    const TagIcon = (icon: string, parent: boolean) => {
        const IconComponent = TagIcons[icon];
        const classes = icon === 'binary' ? 'text-red-500' : 'text-foreground';
        if (IconComponent) {
            if (parent) return <IconComponent className={`w-12 h-12 p-3 rounded-lg hover:bg-gradient-to-br bg-gradient-to-tl from-accent/30 to-muted/30 ${classes}`} />;
            return <IconComponent className={`w-6 h-6 ${classes}`} />;
        }
        return <CircleX className={`w-6 h-6 ${classes}`} />;
    }

    return <PageLayout onSearch={search} className="flex flex-col">
        <div className="p-4">Dashboard Page {searchText}</div>
        <div className="flex flex-row justify-center gap-4 flex-wrap">
            <Block />
            <Block />
            <Block />
            <Block />
        </div>
        <EmptyGallery />
        <div className="flex flex-col flex-wrap gap-4">
            {Object.values(SystemTags).map(tag => (
                <div key={tag.id} className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                        {TagIcon(tag.icon, true)}
                        <div className="flex flex-col">
                            <span>{tag.name}</span>
                            <span className="text-muted-foreground">{tag.description}</span>
                        </div>
                    </div>
                    {tag.id && <div className="ml-8 flex flex-row flex-wrap items-center gap-4">
                        {Object.values(SystemSubtags)
                            .filter(subtag => subtag.tagIds.includes(tag.id!))
                            .map(subtag => (
                                <div key={subtag.id} className="flex flex-row items-center gap-2">
                                    {TagIcon(subtag.icon, false)}
                                    <span>{subtag.name}</span>
                                </div>
                            ))}
                    </div>}
                    <Separator />
                </div>
            ))}
        </div>
    </PageLayout>
};

export default Dashboard;