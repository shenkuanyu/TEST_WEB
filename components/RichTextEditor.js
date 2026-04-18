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
import Image from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/react';
import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Custom FontSize extension ── */
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace(/['"]+/g, '') || null,
          renderHTML: attrs => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/**
 * Word-style rich text editor for admin panel.
 */
export default function RichTextEditor({ value, onChange, placeholder, rows = 12 }) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: false }),
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

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) { isInternalUpdate.current = false; return; }
    const current = editor.getHTML();
    if (value !== current) editor.commands.setContent(value || '');
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <EditorStyles />
    </div>
  );
}

/* ── Toolbar ── */
const FONT_FAMILIES = [
  { label: '預設', value: '' },
  { label: '新細明體', value: 'PMingLiU, serif' },
  { label: '微軟正黑體', value: "'Microsoft JhengHei', sans-serif" },
  { label: '標楷體', value: 'DFKai-SB, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = [
  { label: '預設', value: '' },
  { label: '8', value: '8px' },
  { label: '9', value: '9px' },
  { label: '10', value: '10px' },
  { label: '11', value: '11px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '36', value: '36px' },
  { label: '48', value: '48px' },
  { label: '72', value: '72px' },
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#b81762', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#2980b9', '#9b59b6', '#8e44ad', '#1a5276', '#154360',
  '#7b241c', '#6c3483', '#1e8449', '#b7950b', '#d35400', '#c0392b',
];

function Toolbar({ editor }) {
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const textColorRef = useRef(null);
  const bgColorRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (textColorRef.current && !textColorRef.current.contains(e.target)) setShowTextColor(false);
      if (bgColorRef.current && !bgColorRef.current.contains(e.target)) setShowBgColor(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const sep = <span className="w-px h-5 bg-gray-300 mx-1 shrink-0" />;

  return (
    <div className="border-b bg-gray-50">
      {/* Row 1: Font family, size, color */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200">
        {/* Font Family */}
        <select
          title="字型"
          className="h-7 text-xs border border-gray-300 rounded bg-white px-1 max-w-[130px]"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          title="字體大小"
          className="h-7 text-xs border border-gray-300 rounded bg-white px-1 w-[65px]"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          {FONT_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {sep}

        {/* Text Color */}
        <div className="relative" ref={textColorRef}>
          <button
            type="button"
            title="文字顏色"
            onClick={() => { setShowTextColor(!showTextColor); setShowBgColor(false); }}
            className="flex items-center gap-0.5 px-1.5 py-1 text-sm rounded hover:bg-gray-200 text-gray-700"
          >
            <span className="text-base font-bold" style={{ color: editor.getAttributes('textStyle').color || '#000' }}>A</span>
            <span className="text-[10px]">▼</span>
          </button>
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-lg shadow-lg p-2 w-[180px]">
              <div className="text-xs text-gray-500 mb-1 px-1">文字顏色</div>
              <div className="grid grid-cols-6 gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(c).run(); setShowTextColor(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowTextColor(false); }}
                className="mt-2 text-xs text-gray-500 hover:text-brand w-full text-center"
              >
                清除顏色
              </button>
            </div>
          )}
        </div>

        {/* Background Color (Highlight) */}
        <div className="relative" ref={bgColorRef}>
          <button
            type="button"
            title="背景顏色"
            onClick={() => { setShowBgColor(!showBgColor); setShowTextColor(false); }}
            className="flex items-center gap-0.5 px-1.5 py-1 text-sm rounded hover:bg-gray-200 text-gray-700"
          >
            <span className="text-base font-bold px-0.5 rounded" style={{ backgroundColor: editor.getAttributes('highlight').color || '#f1c40f', color: '#333' }}>A</span>
            <span className="text-[10px]">▼</span>
          </button>
          {showBgColor && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-lg shadow-lg p-2 w-[180px]">
              <div className="text-xs text-gray-500 mb-1 px-1">背景顏色</div>
              <div className="grid grid-cols-6 gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowBgColor(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowBgColor(false); }}
                className="mt-2 text-xs text-gray-500 hover:text-brand w-full text-center"
              >
                清除背景色
              </button>
            </div>
          )}
        </div>

        {sep}

        {/* Bold, Italic, Underline, Strikethrough */}
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', '粗體')}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜體"
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 transition italic ${
            editor.isActive('italic') ? 'bg-gray-300 text-brand font-bold' : 'text-gray-700'
          }`}
        >I</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="底線"
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 transition underline ${
            editor.isActive('underline') ? 'bg-gray-300 text-brand font-bold' : 'text-gray-700'
          }`}
        >U</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="刪除線"
          className={`px-2 py-1 text-sm rounded hover:bg-gray-200 transition line-through ${
            editor.isActive('strike') ? 'bg-gray-300 text-brand font-bold' : 'text-gray-700'
          }`}
        >S</button>
      </div>

      {/* Row 2: Headings, Lists, Alignment, Table, Image, Undo/Redo */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        {/* Headings */}
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', '標題 1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', '標題 2')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', '標題 3')}
        {sep}

        {/* Lists */}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• 清單', '無序清單')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. 清單', '有序清單')}
        {sep}

        {/* Alignment */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} title="靠左對齊"
          className={`px-1.5 py-1 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 text-brand' : 'text-gray-700'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} title="置中對齊"
          className={`px-1.5 py-1 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 text-brand' : 'text-gray-700'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} title="靠右對齊"
          className={`px-1.5 py-1 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 text-brand' : 'text-gray-700'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M9 12h12M3 18h18" /></svg>
        </button>
        {sep}

        {/* Table */}
        <button type="button" title="插入 3×3 表格"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="px-1.5 py-1 rounded hover:bg-gray-200 text-gray-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </button>
        {editor.isActive('table') && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1 py-1 text-xs rounded hover:bg-gray-200 text-gray-600" title="右側加欄">+欄</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1 py-1 text-xs rounded hover:bg-gray-200 text-gray-600" title="下方加列">+列</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除欄">-欄</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除列">-列</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-1 py-1 text-xs rounded hover:bg-gray-200 text-red-500" title="刪除表格">刪表格</button>
          </>
        )}
        {sep}

        {/* Blockquote */}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '引用', '引用區塊')}
        {sep}

        {/* Image upload */}
        <label title="插入圖片" className="px-1.5 py-1 rounded hover:bg-gray-200 text-gray-700 cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
            const fd = new FormData(); fd.append('images', file);
            try {
              const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
              if (!res.ok) throw new Error('upload failed');
              const data = await res.json();
              if (data.url) editor.chain().focus().setImage({ src: data.url }).run();
            } catch (err) { alert('圖片上傳失敗：' + err.message); }
          }} />
        </label>
        {sep}

        {/* Undo / Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} title="復原"
          className="px-1.5 py-1 rounded hover:bg-gray-200 text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H10" /><path d="M7 6l-4 4 4 4" /></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} title="重做"
          className="px-1.5 py-1 rounded hover:bg-gray-200 text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h3" /><path d="M17 6l4 4-4 4" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Editor Styles ── */
function EditorStyles() {
  return (
    <style jsx global>{`
      .rich-editor-content {
        font-size: 14px; line-height: 1.6; color: #333;
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
      .rich-editor-content s { text-decoration: line-through; }
      .rich-editor-content mark {
        border-radius: 2px; padding: 0 2px;
      }
      .rich-editor-content table {
        border-collapse: collapse; width: 100%; margin: 0.5em 0;
      }
      .rich-editor-content th,
      .rich-editor-content td {
        border: 1px solid #ccc; padding: 6px 10px; text-align: left;
      }
      .rich-editor-content th { background: #f5f5f5; font-weight: 600; }
      .rich-editor-content img {
        max-width: 100%; height: auto; border-radius: 4px; margin: 0.5em 0;
      }
      .ProseMirror-focused { outline: none; }
      .ProseMirror { min-height: inherit; }
    `}</style>
  );
}
