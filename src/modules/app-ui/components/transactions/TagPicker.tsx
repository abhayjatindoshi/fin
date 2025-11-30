import { TagSchema, type Tag } from "@/modules/app/entities/Tag";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Popover, PopoverContent } from "@/modules/base-ui/components/ui/popover";
import { Sheet, SheetClose, SheetContent } from "@/modules/base-ui/components/ui/sheet";
import { useVirtualizer } from "@tanstack/react-virtual";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PropsWithChildren } from "react";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { TagIconComponent } from "../../icons/tags/TagIcons";
import { useEntity, type EnhancedTag } from "../../providers/EntityProvider";

type TagPickerProps = {
    variant: 'popup' | 'sheet';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    anchorPosition?: DOMRect;
    selectedTagId?: string | undefined;
    setSelectedTag?: (tag: Tag | null) => void;
};

const removeTag: EnhancedTag = {
    ...TagSchema.parse({
        id: 'remove-tag',
        name: 'Remove Tag',
        icon: 'bookmark-x',
        description: 'Remove tag from transaction',
    }), children: [], searchWords: []
};

export const TagPicker: React.FC<TagPickerProps> = ({ variant, open, onOpenChange, selectedTagId, setSelectedTag, anchorPosition }) => {
    const { tagMap } = useEntity();

    if (!tagMap) return null;

    const showRemoveTag = selectedTagId !== undefined && selectedTagId !== null;
    const allTags = Object.values(tagMap).filter(tag => !tag.parent);
    const [filteredTags, setFilteredTags] = useState(allTags);
    const [searchQuery, setSearchQuery] = useState("");
    const searchSubject = useMemo(() => new Subject<string>(), []);

    useEffect(() => {
        setSearchQuery("");
        setFilteredTags(allTags);
    }, [open]);

    const filterTagsByQuery = (query: string) => {
        const words = query.replaceAll(/[^\w]/g, ' ')
            .toLowerCase()
            .split(' ')
            .filter(w => w.length > 0);

        if (words.length === 0) {
            setFilteredTags(allTags);
            return;
        }

        const matchingTags = filterTagsByWords(words, allTags);
        setFilteredTags(matchingTags);
    };

    const filterTagsByWords = (words: string[], tags: EnhancedTag[]): EnhancedTag[] => {
        return tags.map(t => {
            if (t.searchWords.some(sw => words.every(w => sw.startsWith(w)))) {
                return t;
            }
            const filteredChildren = filterTagsByWords(words, t.children);
            if (filteredChildren.length > 0) {
                return { ...t, children: filteredChildren };
            }
        }).filter(t => t !== undefined);
    }

    useEffect(() => {
        const subscription = searchSubject
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(filterTagsByQuery)

        return () => subscription.unsubscribe();
    }, [searchSubject]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchSubject.next(query);
    }

    const HorizontalScrollIndicators: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {

        const scrollElementRef = useRef<HTMLDivElement | null>(null);
        const [canScrollLeft, setCanScrollLeft] = useState(false);
        const [canScrollRight, setCanScrollRight] = useState(false);

        const onScroll = () => {
            if (!scrollElementRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollElementRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
        }

        useEffect(() => {
            if (!scrollElementRef.current) return;
            onScroll();
        }, []);

        return <div
            ref={scrollElementRef}
            onScroll={onScroll}
            className={`
                overflow-y-auto [scrollbar-width:none] rounded-sm  ${className}
                ${canScrollLeft && canScrollRight ? 'bg-[linear-gradient(to_right,_var(--muted)_0%,_#0000_20%,_#0000_80%,_var(--muted)_100%)]' :
                    canScrollLeft ? 'bg-gradient-to-r from-muted to-20%' :
                        canScrollRight ? 'bg-gradient-to-l from-muted to-20%' : ''
                }
                `}>
            {children}
        </div >
    }

    const TagItem = ({ tag }: { tag: EnhancedTag }) => {
        const childTags = tag.children;

        const selectTag = (e: React.MouseEvent<HTMLElement>, tag: Tag) => {
            e.stopPropagation();
            setSelectedTag && setSelectedTag(tag.id === 'remove-tag' ? null : tag);
            onOpenChange(false);
        }

        return <div
            className={`flex flex-col gap-2 p-2 
            hover:bg-accent/50 dark:hover:bg-background 
            rounded-xl overflow-hidden cursor-pointer
            ${tag.id === 'remove-tag' && 'text-destructive'}
            ${selectedTagId === tag.id ? 'bg-accent/20 border' : ''}`}
        >
            <div className="flex flex-row gap-2 items-center" onClick={(e) => selectTag(e, tag)}>
                <TagIconComponent name={tag.icon} className="size-8" />
                <div className="flex flex-col">
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-sm text-muted-foreground">{tag.description}</span>
                </div>
            </div>
            {childTags.length > 0 && <HorizontalScrollIndicators className="flex flex-row">
                {childTags.map(childTag => (
                    <div key={childTag.id}
                        onClick={(e) => selectTag(e, childTag)}
                        className={`flex flex-row gap-1 p-2 items-center 
                        hover:bg-muted rounded-3xl cursor-pointer
                        ${selectedTagId === childTag.id ? 'bg-accent/20 border' : ''}`}
                    >
                        <TagIconComponent name={childTag.icon} />
                        <span className="text-nowrap">{childTag.name}</span>
                    </div>
                ))}
            </HorizontalScrollIndicators>}
        </div>
    }

    type TagContainerProps = {
        className?: string;
    }

    const TagsContainer: React.FC<TagContainerProps> = ({ className }) => {

        const scrollElementRef = useRef<HTMLDivElement | null>(null);

        const virtualizer = useVirtualizer({
            count: filteredTags.length + (showRemoveTag ? 1 : 0),
            getScrollElement: () => scrollElementRef.current,
            estimateSize: () => 20,
        });

        const items = virtualizer.getVirtualItems();

        return <div className={`overflow-auto relative flex flex-col gap-3 p-3 ${className}`} ref={scrollElementRef}>
            <div className='sticky top-0 z-10 rounded-t-2xl w-full flex flex-row items-center gap-1'>
                <Input autoFocus
                    className='bg-secondary/50 backdrop-blur border'
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    placeholder="Search tags..." />
                {variant === 'sheet' &&
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon-sm"><X /></Button>
                    </SheetClose>}
            </div>
            <div className='relative w-full' style={{ height: virtualizer.getTotalSize() + 'px' }}>
                <div className="absolute top-0 left-0 w-full" style={{ transform: `translateY(${items[0]?.start ?? 0}px)` }}>
                    {items.map(item => (
                        <div key={item.key} data-index={item.index} ref={virtualizer.measureElement}>
                            {showRemoveTag ?
                                item.index === 0 ?
                                    <TagItem tag={removeTag} /> :
                                    <TagItem tag={filteredTags[item.index - 1]} /> :
                                <TagItem tag={filteredTags[item.index]} />
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>;
    }

    if (variant === 'sheet') {
        return <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="[&>button]:hidden bg-popover">
                <TagsContainer className="h-96 w-full mt-2" />
            </SheetContent>
        </Sheet>
    } else {

        let position = { top: 0, left: 0 };
        if (anchorPosition) {
            const topHeight = anchorPosition.top
            const bottomHeight = window.innerHeight - anchorPosition.bottom;

            if (topHeight > bottomHeight) {
                position.top = anchorPosition.bottom - 384; // show above
            } else {
                position.top = anchorPosition.top; // show below
            }

            const leftWidth = anchorPosition.left;
            const rightWidth = window.innerWidth - anchorPosition.right;
            if (leftWidth > rightWidth) {
                position.left = anchorPosition.left - 384 - 5; // align to left
            } else {
                position.left = anchorPosition.right + 5; // align to right
            }
        }

        return <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverContent side="bottom" align="start" className="p-0 w-96 h-96 fixed" style={{ top: position?.top, left: position?.left }}>
                <TagsContainer className="w-96 h-96" />
            </PopoverContent>
        </Popover>
    }
}
