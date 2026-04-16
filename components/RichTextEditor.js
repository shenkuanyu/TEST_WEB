'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useEffect, useRef } from 'react';

/**
 * Word-style rich text editor for admin panel.
 * Outputs HTML string via onChange(html).
 * Supports paste from Word / Google Docs.
 */
export default function RichTextEditor({ value, onChange, placeholder, rows = 12 }) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: `min-height: ${rows * 1.5}em; outline: none; padding: 12px;`,
      },
    },
  });

  // Sync external value changes (e.g. loading product data)
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .rich-editor-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        .rich-editor-content p { margin: 0.4em 0; }
        .rich-editor-content h1 { font-size: 1.6em; font-weight: 700; margin: 0.6em 0 0.3em; }
        .rich-editor-content h2 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0 0.3em; }
        .rich-editor-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.4em 0 0.2em; }
        .rich-editor-content ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
        .rich-editor-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        .rich-editor-content li { margin: 0.15em 0; }
        .rich-editor-content blockquote {
          border-left: 3px solid #ddd; padding-left: 1em; color: #666; margin: 0.5em 0;
        }
        .rich-editor-content strong { font-weight: 700; }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content u { text-decoration: underline; }
        .rich-editor-content table {
          border-collapse: collapse; width: 100%; margin: 0.5em 0;
        }
        .rich-editor-content th,
        .rich-editor-content td {
          border: 1px solid #ccc; padding: 6px 10px; text-align: left;
        }
        .rich-editor-content th {
          background: #f5f5f5; font-weight: 600;
        }
        .rich-editor-content .is-empty::before {
          content: attr(data-placeholder);
          color: #aaa;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror-focused { outline: none; }
        .ProseMirror { min-height: inherit; }
      `}</style>
    </div>
  );
}

function Toolbar({ editor }) {
  const btn = (active, onClick, label, title) => (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={`px-2 py-1 text-sm rounded hover:bg-gray-200 transition ${
        active ? 'bg-gray-300 text-brand font-bold' : 'text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  const sep = <span className="w-px h-5 bg-gray-300 mx-1" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b">
      {/* Headings */}
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', '標題 1')}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', '標題 2')}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', '標題 3')}
      {sep}

      {/* Formatting */}
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', '粗體')}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', '斜體')}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', '底線')}
      {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S', '刪除線')}
      {sep}

      {/* Lists */}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• 清單', '無序清單')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. 清單', '有序清單')}
      {sep}

      {/* Alignment */}
      {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '靠左')}
      {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '置中')}
      {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), '靠右')}
      {sep}

      {/* Table */}
      <button
        type="button"
        title="插入表格"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700"
      >
        表格
      </button>
      {editor.isActive('table') && (
        <>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1.5 py-1 text-xs rounded hover:bg-gray-200 text-gray-600" title="右側加欄">+欄</button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1.5 py-1 text-xs rounded hover:bg-gray-200 text-gray-600" title="下方加列">+列</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1.5 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除欄">-欄</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1.5 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除列">-列</button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-1.5 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除表格">刪表格</button>
        </>
      )}
      {sep}

      {/* Blockquote */}
      {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '引用')}

      {/* Undo / Redo */}
      {sep}
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600" title="復原">↩</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600" title="重做">↪</button>
    </div>
  );
}
