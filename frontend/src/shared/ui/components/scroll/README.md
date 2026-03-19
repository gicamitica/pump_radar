# Scroll Fade System

A standardized, reusable system for adding fade effects to scrollable content across the Katalyst application.

## 📋 Overview

The scroll fade system provides visual affordances (gradient overlays) that indicate when content is scrollable. It automatically shows/hides fades based on scroll position, works with multiple scroll libraries, and maintains consistent styling across the app.

## 🎯 Features

- ✅ **Universal Compatibility**: Works with SimpleBar, ScrollArea (Radix), and native overflow
- ✅ **Smart Detection**: Automatically shows/hides fades based on scroll position
- ✅ **Performance Optimized**: Uses ResizeObserver and debouncing
- ✅ **Theme Aware**: Uses CSS variables for consistent theming
- ✅ **TypeScript**: Fully typed for better DX
- ✅ **Accessible**: Doesn't interfere with keyboard navigation

## 📦 Components

### 1. `useScrollFade` Hook

Low-level hook for scroll detection.

```tsx
import { useScrollFade } from '@/shared/ui/components/scroll';

const containerRef = useRef<HTMLDivElement>(null);
const { showTop, showBottom, isScrollable } = useScrollFade(containerRef, {
  threshold: 10,    // Pixels from edge to trigger fade
  debounce: 50,     // Debounce delay for performance
  debug: false,     // Enable console logging
});
```

**Returns:**
- `showTop`: boolean - Show top fade (user has scrolled down)
- `showBottom`: boolean - Show bottom fade (more content below)
- `isScrollable`: boolean - Whether content is scrollable

### 2. `ScrollFade` Component

Visual fade overlay component.

```tsx
import { ScrollFade } from '@/shared/ui/components/scroll';

<ScrollFade 
  position="bottom"  // 'top' | 'bottom'
  size="md"          // 'sm' | 'md' | 'lg'
  visible={showBottom}
  zIndex={10}
/>
```

**Sizes:**
- `sm`: 4px (h-4) - Subtle hint
- `md`: 8px (h-8) - Standard
- `lg`: 12px (h-12) - Prominent

### 3. `ScrollFadeContainer` Component

All-in-one wrapper (recommended for most use cases).

```tsx
import { ScrollFadeContainer } from '@/shared/ui/components/scroll';

<ScrollFadeContainer 
  fades="both"       // 'top' | 'bottom' | 'both'
  fadeSize="md"      // 'sm' | 'md' | 'lg'
>
  <ScrollArea className="h-[400px]">
    {content}
  </ScrollArea>
</ScrollFadeContainer>
```

## 🚀 Usage Examples

### Example 1: SimpleBar (Kanban Columns)

```tsx
import { useScrollFade, ScrollFade } from '@/shared/ui/components/scroll';
import SimpleBar from 'simplebar-react';

function KanbanColumn() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { showBottom } = useScrollFade(scrollContainerRef);

  return (
    <div className="relative">
      <div ref={scrollContainerRef} className="h-full">
        <SimpleBar className="h-full">
          {cards.map(card => <Card key={card.id} {...card} />)}
        </SimpleBar>
      </div>
      <ScrollFade position="bottom" size="lg" visible={showBottom} />
    </div>
  );
}
```

### Example 2: ScrollArea with Both Fades

```tsx
import { ScrollFadeContainer } from '@/shared/ui/components/scroll';
import { ScrollArea } from '@/shadcn/components/ui/scroll-area';

function NotificationPanel() {
  return (
    <ScrollFadeContainer fades="both" fadeSize="sm" className="h-[300px]">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          {notifications.map(n => <Notification key={n.id} {...n} />)}
        </div>
      </ScrollArea>
    </ScrollFadeContainer>
  );
}
```

### Example 3: Native Overflow

```tsx
import { ScrollFadeContainer } from '@/shared/ui/components/scroll';

function ContentCard() {
  return (
    <Card>
      <CardContent>
        <ScrollFadeContainer fadeSize="md" className="max-h-[200px] overflow-y-auto">
          <p>{longContent}</p>
        </ScrollFadeContainer>
      </CardContent>
    </Card>
  );
}
```

### Example 4: Leaderboard Table

```tsx
import { ScrollArea } from '@/shadcn/components/ui/scroll-area';
import { ScrollFadeContainer } from '@/shared/ui/components/scroll';

function LeaderboardTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollFadeContainer className="h-[400px]">
          <ScrollArea className="h-full">
            <SimpleSortableTable data={data} columns={columns} />
          </ScrollArea>
        </ScrollFadeContainer>
      </CardContent>
    </Card>
  );
}
```

## 🎨 Customization

### Custom Fade Colors

The fade uses CSS variables for theming. To customize for specific contexts:

```tsx
<ScrollFade 
  position="bottom"
  className="bg-gradient-to-t from-card via-card/80 to-transparent"
/>
```

### Custom Threshold

Adjust when fades appear:

```tsx
const { showBottom } = useScrollFade(ref, { 
  threshold: 20  // Show fade when 20px from edge
});
```

### Debug Mode

Enable logging to troubleshoot:

```tsx
const { showTop, showBottom } = useScrollFade(ref, { 
  debug: true 
});
```

## 🔧 Migration Guide

### From Manual Implementation

**Before:**
```tsx
const [showGradient, setShowGradient] = useState(false);

useEffect(() => {
  const checkScroll = () => {
    const el = ref.current?.querySelector('.simplebar-content-wrapper');
    if (el) {
      const hasScroll = el.scrollHeight > el.clientHeight;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      setShowGradient(hasScroll && !isAtBottom);
    }
  };
  
  const timer = setTimeout(checkScroll, 100);
  const el = ref.current?.querySelector('.simplebar-content-wrapper');
  el?.addEventListener('scroll', checkScroll);
  
  return () => {
    clearTimeout(timer);
    el?.removeEventListener('scroll', checkScroll);
  };
}, [dependencies]);

return (
  <div className="relative">
    <SimpleBar>{content}</SimpleBar>
    <div className={cn(
      'absolute bottom-0 left-0 right-0 h-12',
      'bg-gradient-to-t from-background to-transparent',
      showGradient ? 'opacity-100' : 'opacity-0'
    )} />
  </div>
);
```

**After:**
```tsx
const scrollRef = useRef<HTMLDivElement>(null);
const { showBottom } = useScrollFade(scrollRef);

return (
  <div className="relative">
    <div ref={scrollRef}>
      <SimpleBar>{content}</SimpleBar>
    </div>
    <ScrollFade position="bottom" size="lg" visible={showBottom} />
  </div>
);
```

Or even simpler with the container:

```tsx
return (
  <ScrollFadeContainer>
    <SimpleBar className="h-[400px]">{content}</SimpleBar>
  </ScrollFadeContainer>
);
```

## ⚡ Performance

- **Debounced scroll events**: Prevents excessive re-renders
- **ResizeObserver**: Efficiently detects content changes
- **Passive event listeners**: Improves scroll performance
- **Minimal re-renders**: Only updates when visibility changes

## 🐛 Troubleshooting

### Fade not appearing

1. **Check container has `position: relative`**: Fades use absolute positioning
2. **Verify scroll element exists**: Use `debug: true` option
3. **Check height constraints**: Ensure container has fixed height

### Fade showing when it shouldn't

1. **Adjust threshold**: Increase threshold value
2. **Check for dynamic content**: Ensure ResizeObserver is working
3. **Verify scroll library**: Confirm SimpleBar/ScrollArea is initialized

### Performance issues

1. **Increase debounce**: Set higher debounce value (e.g., 100ms)
2. **Reduce threshold checks**: Use larger threshold value
3. **Limit scroll listeners**: Ensure only one instance per container

## 📝 Best Practices

1. **Use `ScrollFadeContainer` when possible**: Simplest API
2. **Match fade size to content**: Use `lg` for large lists, `sm` for compact panels
3. **Consider both fades for long lists**: Use `fades="both"` for better UX
4. **Test with dynamic content**: Ensure fades update when content changes
5. **Respect theme colors**: Use default gradients for consistency

## 🔗 Related Components

- `SimpleSortableTable` - Often used with scroll fades
- `ScrollArea` (Radix) - Primary scroll component
- `SimpleBar` - Alternative scroll library
- `LeaderboardTable` - Uses scroll fades by default

## 📚 References

- [Radix ScrollArea](https://www.radix-ui.com/primitives/docs/components/scroll-area)
- [SimpleBar](https://github.com/Grsmto/simplebar)
- [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
