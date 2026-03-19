import { forwardRef } from 'react';
import { Undo2, Redo2, Bold, Italic, Underline } from 'lucide-react';
import {
  MDXEditor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin
} from '@mdxeditor/editor';
import type { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { cn } from '@/shadcn/lib/utils';

// We import styles for the editor but also apply our own theme-driven styles
import './MarkdownEditor.css';

interface MarkdownEditorProps extends MDXEditorProps {
  className?: string;
  minHeight?: string;
  renderExtraToolbarContent?: () => React.ReactNode;
}

export const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ className, minHeight = '150px', renderExtraToolbarContent, ...props }, ref) => {
    return (
      <div className={cn("markdown-editor-wrapper", className)} style={{ minHeight }}>
        <MDXEditor
          ref={ref}
          {...props}
          iconComponentFor={(name) => {
            switch (name) {
              case 'undo': return <Undo2 className="size-4" />;
              case 'redo': return <Redo2 className="size-4" />;
              case 'format_bold': return <Bold className="size-4" />;
              case 'format_italic': return <Italic className="size-4" />;
              case 'format_underlined': return <Underline className="size-4" />;
              default: return <></>;
            }
          }}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                  </div>
                  {renderExtraToolbarContent && (
                    <div className="flex items-center pr-2">
                       {renderExtraToolbarContent()}
                    </div>
                  )}
                </div>
              )
            })
          ]}
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';
