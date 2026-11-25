window.__ModuleLoader__.load({
  id: '@pemako/dsh-notes',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const {
      useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore,
    } = React

    const NS = 'dsh-notes'
    const STORAGE_KEY = 'dsh-notes.notes.v1'
    const MIN_WIDTH = 200
    const MAX_WIDTH = 560
    const MIN_HEIGHT = 150
    const MAX_HEIGHT = 620
    const DEFAULT_WIDTH = 264
    const DEFAULT_HEIGHT = 208
    const DAY_MS = 86400000

    const en = {
      'trigger': 'Notes',
      'panel.title': 'Notes',
      'panel.search': 'Search notes',
      'panel.close': 'Close notes',
      'tab.notes': 'Notes',
      'tab.archive': 'Archive',
      'action.new': 'New note',
      'action.edit': 'Edit',
      'action.done': 'Done',
      'action.archive': 'Archive',
      'action.restore': 'Restore',
      'action.delete': 'Delete',
      'action.confirmDelete': 'Delete?',
      'action.palette': 'Urgency color',
      'action.clearSearch': 'Clear search',
      'action.resize': 'Resize note',
      'panel.tabs': 'Note filter',
      'note.untitled': 'Untitled',
      'note.empty': 'Empty note',
      'note.titlePlaceholder': 'Note title',
      'note.bodyPlaceholder': 'Write in Markdown…',
      'note.hint': 'Double-click a note to edit it',
      'note.updated': 'updated {time}',
      'empty.notes': 'No notes yet. Create one to keep a thought, a task, or a reminder.',
      'empty.archive': 'Nothing archived yet.',
      'empty.search': 'No notes match your search.',
      'group.today': 'Today',
      'group.yesterday': 'Yesterday',
      'count.group': '{count} notes',
      'count.notes': '{count} active',
      'count.archive': '{count} archived',
      'color.red': 'Urgent',
      'color.amber': 'Important',
      'color.green': 'Normal',
      'color.blue': 'Info',
      'color.gray': 'Low',
      'foot.storage': 'Saved in this browser',
      'foot.resize': 'Drag a note edge or corner to resize',
      'foot.saveError': 'Not saved — browser storage is full or unavailable',
      'announce.archived': '“{title}” archived.',
      'announce.restored': '“{title}” restored.',
      'announce.deleted': '“{title}” deleted.',
    }

    const zh = {
      'trigger': '便签',
      'panel.title': '便签',
      'panel.search': '搜索便签',
      'panel.close': '关闭便签',
      'tab.notes': '笔记',
      'tab.archive': '归档',
      'action.new': '新建便签',
      'action.edit': '编辑',
      'action.done': '完成',
      'action.archive': '归档',
      'action.restore': '恢复',
      'action.delete': '删除',
      'action.confirmDelete': '确认删除',
      'action.palette': '紧急程度颜色',
      'action.clearSearch': '清除搜索',
      'action.resize': '调整便签大小',
      'panel.tabs': '便签筛选',
      'note.untitled': '无标题',
      'note.empty': '空白便签',
      'note.titlePlaceholder': '便签标题',
      'note.bodyPlaceholder': '用 Markdown 记录…',
      'note.hint': '双击便签即可编辑',
      'note.updated': '更新于 {time}',
      'empty.notes': '还没有便签。新建一条，记录想法、任务或待办。',
      'empty.archive': '归档中还没有便签。',
      'empty.search': '没有匹配的便签。',
      'group.today': '今天',
      'group.yesterday': '昨天',
      'count.group': '{count} 条',
      'count.notes': '{count} 条笔记',
      'count.archive': '{count} 条归档',
      'color.red': '紧急',
      'color.amber': '重要',
      'color.green': '普通',
      'color.blue': '提示',
      'color.gray': '低',
      'foot.storage': '保存在当前浏览器',
      'foot.resize': '拖动便签边缘或边角调整大小',
      'foot.saveError': '未保存——浏览器存储已满或不可用',
      'announce.archived': '已归档“{title}”。',
      'announce.restored': '已恢复“{title}”。',
      'announce.deleted': '已删除“{title}”。',
    }

    const COLORS = [
      { key: 'red', token: 'var(--dsw-alias-state-error-primary)', label: 'color.red' },
      { key: 'amber', token: 'var(--dsw-alias-state-warn-primary)', label: 'color.amber' },
      { key: 'green', token: 'var(--dsw-alias-state-success-primary)', label: 'color.green' },
      { key: 'blue', token: 'var(--dsw-alias-brand-primary)', label: 'color.blue' },
      { key: 'gray', token: 'var(--dsw-alias-state-idle-primary)', label: 'color.gray' },
    ]
    const COLOR_BY_KEY = Object.fromEntries(COLORS.map(color => [color.key, color]))
    const COLOR_KEYS = COLORS.map(color => color.key)

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
    const clampNumber = (value, min, max, fallback) =>
      (typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback)

    function newId() {
      try {
        if (globalThis.crypto !== undefined && typeof globalThis.crypto.randomUUID === 'function') {
          return globalThis.crypto.randomUUID()
        }
      } catch {
        // fall through to the timestamp id
      }
      return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    }

    function normalizeNote(raw) {
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
      const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now()
      return {
        id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : newId(),
        title: typeof raw.title === 'string' ? raw.title : '',
        body: typeof raw.body === 'string' ? raw.body : '',
        color: COLOR_KEYS.includes(raw.color) ? raw.color : 'blue',
        width: clampNumber(raw.width, MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH),
        height: clampNumber(raw.height, MIN_HEIGHT, MAX_HEIGHT, DEFAULT_HEIGHT),
        createdAt,
        updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : createdAt,
        archivedAt: typeof raw.archivedAt === 'number' && Number.isFinite(raw.archivedAt) ? raw.archivedAt : null,
      }
    }

    function parseStoredNotes(raw) {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.notes) ? parsed.notes : []
      const seen = new Set()
      const notes = []
      for (const entry of list) {
        const note = normalizeNote(entry)
        if (note === undefined || seen.has(note.id)) continue
        seen.add(note.id)
        notes.push(note)
      }
      return notes
    }

    function loadNotes() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return []
        return parseStoredNotes(raw)
      } catch (error) {
        console.error('[dsh-notes] reading stored notes failed:', error)
        return []
      }
    }

    function createNotesStore() {
      let notes = loadNotes()
      let saveError = null
      let snapshot = { notes, saveError }
      const listeners = new Set()
      let timer
      let dirty = false

      const publish = () => { snapshot = { notes, saveError } }
      const saveNow = () => {
        if (!dirty) return
        try {
          const previous = localStorage.getItem(STORAGE_KEY)
          if (previous !== null) {
            try {
              JSON.parse(previous)
            } catch {
              // Preserve unreadable stored data before the first successful overwrite.
              try { localStorage.setItem(`${STORAGE_KEY}.backup`, previous) } catch { /* backup is best effort */ }
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, notes }))
          dirty = false
          if (saveError !== null) {
            saveError = null
            notify()
          }
        } catch (error) {
          console.error('[dsh-notes] saving notes failed:', error)
          if (saveError === null) {
            saveError = error instanceof Error ? error.message : String(error)
            notify()
          }
        }
      }
      const scheduleSave = () => {
        dirty = true
        if (timer !== undefined) clearTimeout(timer)
        timer = setTimeout(() => { timer = undefined; saveNow() }, 250)
      }
      const notify = () => {
        publish()
        for (const listener of [...listeners]) {
          try { listener() } catch (error) { console.error('[dsh-notes] subscriber failed:', error) }
        }
      }
      const commit = (nextNotes) => {
        notes = nextNotes
        notify()
        scheduleSave()
      }
      const indexOf = (id) => notes.findIndex(note => note.id === id)
      const patchAt = (index, patch) => {
        if (index < 0) return
        const next = [...notes]
        next[index] = { ...next[index], ...patch }
        commit(next)
      }

      return {
        subscribe: (listener) => {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        getSnapshot: () => snapshot,
        addNote(width) {
          const now = Date.now()
          const note = {
            id: newId(),
            title: '',
            body: '',
            color: 'blue',
            width: clampNumber(width, MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH),
            height: DEFAULT_HEIGHT,
            createdAt: now,
            updatedAt: now,
            archivedAt: null,
          }
          commit([note, ...notes])
          return note.id
        },
        patchNote(id, patch) {
          const index = indexOf(id)
          if (index < 0) return
          patchAt(index, { ...patch, updatedAt: Date.now() })
        },
        setColor(id, color) {
          const index = indexOf(id)
          if (index < 0 || !COLOR_KEYS.includes(color) || notes[index].color === color) return
          patchAt(index, { color })
        },
        resize(id, width, height) {
          const index = indexOf(id)
          if (index < 0) return
          const note = notes[index]
          const nextWidth = clamp(Math.round(width), MIN_WIDTH, MAX_WIDTH)
          const nextHeight = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT)
          if (note.width === nextWidth && note.height === nextHeight) return
          patchAt(index, { width: nextWidth, height: nextHeight })
        },
        archive(id) {
          const index = indexOf(id)
          if (index < 0 || notes[index].archivedAt !== null) return
          patchAt(index, { archivedAt: Date.now() })
        },
        restore(id) {
          const index = indexOf(id)
          if (index < 0 || notes[index].archivedAt === null) return
          patchAt(index, { archivedAt: null })
        },
        remove(id) {
          const index = indexOf(id)
          if (index < 0) return
          commit(notes.filter(note => note.id !== id))
        },
        find(id) {
          return notes.find(note => note.id === id)
        },
        reload() {
          let next
          try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw === null) return
            next = parseStoredNotes(raw)
          } catch (error) {
            console.error('[dsh-notes] reading stored notes failed:', error)
            return
          }
          if (JSON.stringify(next) === JSON.stringify(notes)) return
          if (!dirty) {
            notes = next
            notify()
            return
          }
          // Pending local edits: keep the union and prefer the newer copy of each
          // note. A note deleted elsewhere can reappear when this tab still holds it.
          const merged = new Map(notes.map(note => [note.id, note]))
          for (const remote of next) {
            const local = merged.get(remote.id)
            if (local === undefined || remote.updatedAt > local.updatedAt) merged.set(remote.id, remote)
          }
          notes = [...merged.values()]
          notify()
          scheduleSave()
        },
        flush() {
          if (timer !== undefined) {
            clearTimeout(timer)
            timer = undefined
          }
          saveNow()
        },
        dispose() {
          if (timer !== undefined) {
            clearTimeout(timer)
            timer = undefined
          }
          saveNow()
          listeners.clear()
        },
      }
    }

    function startOfDay(value) {
      const date = new Date(value)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    }

    function dayKey(value) {
      const date = new Date(value)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }

    function documentLang() {
      if (typeof document === 'undefined') return undefined
      const lang = document.documentElement.lang
      return typeof lang === 'string' && lang !== '' ? lang : undefined
    }

    function formatDayLabel(time) {
      const date = new Date(time)
      return new Intl.DateTimeFormat(documentLang(), { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    }

    function formatTime(time) {
      const date = new Date(time)
      const clock = new Intl.DateTimeFormat(documentLang(), { hour: '2-digit', minute: '2-digit' }).format(date)
      if (startOfDay(time) === startOfDay(Date.now())) return clock
      const day = new Intl.DateTimeFormat(documentLang(), { month: 'short', day: 'numeric' }).format(date)
      return `${day} ${clock}`
    }

    function dayHeading(time, t) {
      const diff = Math.round((startOfDay(Date.now()) - startOfDay(time)) / DAY_MS)
      if (diff === 0) return t('group.today')
      if (diff === 1) return t('group.yesterday')
      return formatDayLabel(time)
    }

    function inlineNodes(text) {
      const nodes = []
      let key = 0
      const pushText = (value) => {
        if (value === '') return
        value.split('\n').forEach((part, index) => {
          if (index > 0) nodes.push(h('br', { key: `br-${key++}` }))
          if (part !== '') nodes.push(part)
        })
      }
      const pattern = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|(?<![A-Za-z0-9_])__([^_\n]+)__(?![A-Za-z0-9_])|~~([^~\n]+)~~|\*([^*\n]+)\*|(?<![A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])|\[([^\]\n]+)\]\(([^)\s]+)\)/g
      let last = 0
      let match
      while ((match = pattern.exec(text)) !== null) {
        pushText(text.slice(last, match.index))
        if (match[1] !== undefined) {
          nodes.push(h('code', { key: `code-${key++}`, className: 'dsh-notes-inline-code' }, match[1]))
        } else if (match[2] !== undefined || match[3] !== undefined) {
          nodes.push(h('strong', { key: `strong-${key++}` }, match[2] ?? match[3]))
        } else if (match[4] !== undefined) {
          nodes.push(h('del', { key: `del-${key++}` }, match[4]))
        } else if (match[5] !== undefined || match[6] !== undefined) {
          nodes.push(h('em', { key: `em-${key++}` }, match[5] ?? match[6]))
        } else {
          const label = match[7]
          const href = match[8]
          if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
            nodes.push(h('a', {
              key: `link-${key++}`,
              href,
              target: '_blank',
              rel: 'noreferrer noopener',
            }, label))
          } else {
            nodes.push(label)
          }
        }
        last = match.index + match[0].length
      }
      pushText(text.slice(last))
      return nodes
    }

    function startsBlock(line) {
      return /^ {0,3}(?:#{1,6}\s|```|~~~|>|[-*+]\s|\d+[.)]\s)/.test(line)
        || /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)
    }

    function renderMarkdown(source, depth = 0) {
      const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let index = 0
      let key = 0
      const nextKey = () => `block-${depth}-${key++}`
      while (index < lines.length) {
        const line = lines[index]
        if (/^\s*$/.test(line)) { index += 1; continue }

        const fence = line.match(/^ {0,3}(```+|~~~+)\s*(\S*)\s*$/)
        if (fence !== null) {
          const marker = fence[1]
          const lang = fence[2]
          const body = []
          index += 1
          const closing = new RegExp(`^ {0,3}${marker[0] === '`' ? '`' : '~'}{${marker.length},}\\s*$`)
          while (index < lines.length && !closing.test(lines[index])) {
            body.push(lines[index])
            index += 1
          }
          if (index < lines.length) index += 1
          blocks.push(h('pre', {
            key: nextKey(), className: 'dsh-notes-pre', 'data-lang': lang === '' ? undefined : lang,
          }, h('code', null, body.join('\n'))))
          continue
        }

        const heading = line.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/)
        if (heading !== null) {
          const level = heading[1].length
          blocks.push(h(`h${level}`, { key: nextKey(), className: `dsh-notes-h${level}` }, inlineNodes(heading[2])))
          index += 1
          continue
        }

        if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
          blocks.push(h('hr', { key: nextKey(), className: 'dsh-notes-hr' }))
          index += 1
          continue
        }

        if (/^ {0,3}>/.test(line)) {
          const quote = []
          while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
            quote.push(lines[index].replace(/^ {0,3}>\s?/, ''))
            index += 1
          }
          blocks.push(h('blockquote', { key: nextKey(), className: 'dsh-notes-quote' },
            depth < 6 ? renderMarkdown(quote.join('\n'), depth + 1) : h('p', null, inlineNodes(quote.join('\n')))))
          continue
        }

        const item = line.match(/^ {0,3}([-*+]|\d+[.)])\s+(.*)$/)
        if (item !== null) {
          const ordered = /^\d/.test(item[1])
          const startNumber = ordered ? Number.parseInt(item[1], 10) : undefined
          const items = []
          while (index < lines.length) {
            const entry = lines[index].match(/^ {0,3}([-*+]|\d+[.)])\s+(.*)$/)
            if (entry === null || /^\d/.test(entry[1]) !== ordered) break
            items.push(entry[2])
            index += 1
          }
          const listProps = { key: nextKey(), className: 'dsh-notes-list' }
          if (ordered && startNumber !== undefined && startNumber !== 1) listProps.start = startNumber
          blocks.push(h(ordered ? 'ol' : 'ul', listProps,
            items.map((raw, itemIndex) => {
              const task = raw.match(/^\[([ xX])\]\s+(.*)$/)
              if (task !== null) {
                const done = task[1].toLowerCase() === 'x'
                return h('li', {
                  key: `item-${itemIndex}`,
                  className: `dsh-notes-task${done ? ' is-done' : ''}`,
                },
                h('span', { className: 'dsh-notes-task-box', 'aria-hidden': true }, done ? '✓' : ''),
                h('span', { className: 'dsh-notes-task-text' }, inlineNodes(task[2])))
              }
              return h('li', { key: `item-${itemIndex}` }, inlineNodes(raw))
            })))
          continue
        }

        const paragraph = [line]
        index += 1
        while (index < lines.length && !/^\s*$/.test(lines[index]) && !startsBlock(lines[index])) {
          paragraph.push(lines[index])
          index += 1
        }
        blocks.push(h('p', { key: nextKey() }, inlineNodes(paragraph.join('\n'))))
      }
      return blocks
    }

    function NoteIcon({ size = 18 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      },
      h('path', {
        d: 'M6 3.75h8.2L18.75 8.3v11.95a1.75 1.75 0 0 1-1.75 1.75H6a1.75 1.75 0 0 1-1.75-1.75V5.5A1.75 1.75 0 0 1 6 3.75Z',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M14 3.9v4.1a.5.5 0 0 0 .5.5h4.1',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M8 12h8M8 15.5h5.5',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
      }))
    }

    function PlusIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      }, h('path', {
        d: 'M12 5v14M5 12h14', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round',
      }))
    }

    function CloseIcon({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      }, h('path', {
        d: 'M6 6l12 12M18 6L6 18', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round',
      }))
    }

    function ArchiveIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      },
      h('path', {
        d: 'M4 8.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V8.5Z',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M3.5 5.5h17v3h-17v-3Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round',
      }),
      h('path', { d: 'M9.5 12.5h5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }))
    }

    function RestoreIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      },
      h('path', {
        d: 'M4 8.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V8.5Z',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M3.5 5.5h17v3h-17v-3Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M12 17.5v-6M9.5 14l2.5-2.5 2.5 2.5',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    function TrashIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      },
      h('path', {
        d: 'M5 7.5h14M9.5 7.5V5h5v2.5M7 7.5l.8 12a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-12',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }),
      h('path', { d: 'M10.5 11v6M13.5 11v6', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }))
    }

    function PencilIcon({ size = 12 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: false,
      }, h('path', {
        d: 'm4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
      }))
    }

    function Dot({ color }) {
      return h('span', { className: 'dsh-notes-dot', 'aria-hidden': true, style: { '--dsh-notes-dot': color.token } })
    }

    /** Track the phone-width breakpoint so cards fill the board there. */
    function useNarrowViewport() {
      const query = '(max-width: 640px)'
      const matches = () => typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia(query).matches
      const [narrow, setNarrow] = useState(matches)
      useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
        const media = window.matchMedia(query)
        const update = () => setNarrow(media.matches)
        update()
        if (typeof media.addEventListener === 'function') {
          media.addEventListener('change', update)
          return () => media.removeEventListener('change', update)
        }
        media.addListener(update)
        return () => media.removeListener(update)
      }, [])
      return narrow
    }

    function NoteCard({
      note, store, t, narrow, editing, paletteOpen, confirmDelete, readOnly,
      onStartEdit, onDoneEdit, onTogglePalette, onColor, onToggleArchive, onDelete,
    }) {
      const color = COLOR_BY_KEY[note.color] ?? COLOR_BY_KEY.blue
      const titleRef = useRef(null)
      const bodyRef = useRef(null)

      useEffect(() => {
        if (!editing) return
        if (note.title === '' && titleRef.current !== null) {
          titleRef.current.focus()
          return
        }
        const editor = bodyRef.current
        if (editor !== null) {
          editor.focus()
          try { editor.setSelectionRange(editor.value.length, editor.value.length) } catch { /* non-text editor */ }
        }
      }, [editing])

      const startResize = (event, axis) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const startX = event.clientX
        const startY = event.clientY
        const startWidth = note.width
        const startHeight = note.height
        const horizontal = axis !== 's' && !narrow
        const vertical = axis !== 'e'
        const move = (moveEvent) => {
          const width = horizontal ? startWidth + moveEvent.clientX - startX : startWidth
          const height = vertical ? startHeight + moveEvent.clientY - startY : startHeight
          store.resize(note.id, width, height)
        }
        const finish = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', finish)
          window.removeEventListener('pointercancel', finish)
          document.body.style.removeProperty('cursor')
          document.body.style.removeProperty('user-select')
          store.flush()
        }
        document.body.style.cursor = narrow
          ? 'ns-resize'
          : axis === 'e' ? 'ew-resize' : axis === 's' ? 'ns-resize' : 'nwse-resize'
        document.body.style.userSelect = 'none'
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
      }

      return h('article', {
        className: `dsh-notes-card${readOnly ? ' is-archived' : ''}${editing ? ' is-editing' : ''}`,
        style: {
          width: narrow ? '100%' : `${note.width}px`,
          height: `${note.height}px`,
          '--dsh-notes-accent': color.token,
        },
        'data-color': note.color,
        'data-note-id': note.id,
        'data-narrow': narrow ? '' : undefined,
      },
      h('header', { className: 'dsh-notes-card-head' },
        h('button', {
          type: 'button',
          className: 'dsh-notes-urgency',
          title: `${t('action.palette')}: ${t(color.label)}`,
          'aria-label': `${t('action.palette')}: ${t(color.label)}`,
          'aria-expanded': paletteOpen,
          onClick: onTogglePalette,
        },
        h(Dot, { color }),
        h('span', null, t(color.label))),
        h('div', { className: 'dsh-notes-card-actions' },
          h('button', {
            type: 'button',
            className: 'dsh-notes-icon-btn',
            title: readOnly ? t('action.restore') : t('action.archive'),
            'aria-label': readOnly ? t('action.restore') : t('action.archive'),
            onClick: onToggleArchive,
          }, readOnly ? h(RestoreIcon, { size: 14 }) : h(ArchiveIcon, { size: 14 })),
          h('button', {
            type: 'button',
            className: `dsh-notes-icon-btn dsh-notes-danger${confirmDelete ? ' is-armed' : ''}`,
            title: confirmDelete ? t('action.confirmDelete') : t('action.delete'),
            'aria-label': confirmDelete ? t('action.confirmDelete') : t('action.delete'),
            onClick: onDelete,
          }, confirmDelete
            ? h('span', { className: 'dsh-notes-confirm' }, t('action.confirmDelete'))
            : h(TrashIcon, { size: 14 })))),
      paletteOpen && h('div', {
        className: 'dsh-notes-palette', role: 'group', 'aria-label': t('action.palette'),
      }, COLORS.map(entry => h('button', {
        key: entry.key,
        type: 'button',
        className: 'dsh-notes-swatch',
        style: { '--dsh-notes-dot': entry.token },
        title: t(entry.label),
        'aria-label': t(entry.label),
        'aria-pressed': note.color === entry.key,
        onClick: () => onColor(entry.key),
      }, note.color === entry.key
        ? h('span', { className: 'dsh-notes-swatch-check', 'aria-hidden': true }, '✓')
        : null))),
      editing
        ? h('input', {
          ref: titleRef,
          className: 'dsh-notes-title-input',
          value: note.title,
          placeholder: t('note.titlePlaceholder'),
          'aria-label': t('note.titlePlaceholder'),
          spellCheck: false,
          onChange: event => store.patchNote(note.id, { title: event.target.value }),
          onKeyDown: (event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            if (bodyRef.current !== null) bodyRef.current.focus()
          },
        })
        : h('h3', {
          className: `dsh-notes-card-title${note.title === '' ? ' is-empty' : ''}`,
          title: note.title === '' ? undefined : note.title,
        }, note.title === '' ? t('note.untitled') : note.title),
      h('div', {
        className: 'dsh-notes-card-body',
        onDoubleClick: readOnly || editing ? undefined : onStartEdit,
      },
      editing
        ? h('textarea', {
          ref: bodyRef,
          className: 'dsh-notes-editor',
          value: note.body,
          placeholder: t('note.bodyPlaceholder'),
          'aria-label': t('note.bodyPlaceholder'),
          spellCheck: false,
          onChange: event => store.patchNote(note.id, { body: event.target.value }),
          onKeyDown: (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              onDoneEdit()
            }
          },
        })
        : h('div', { className: 'dsh-notes-preview' },
          note.body.trim() === ''
            ? h('span', { className: 'dsh-notes-empty-body' }, t('note.empty'))
            : renderMarkdown(note.body))),
      h('footer', { className: 'dsh-notes-card-foot' },
        h('span', { className: 'dsh-notes-time' }, t('note.updated', { time: formatTime(note.updatedAt) })),
        !readOnly && h('button', {
          type: 'button',
          className: 'dsh-notes-btn dsh-notes-edit-btn',
          title: t('note.hint'),
          onClick: editing ? onDoneEdit : onStartEdit,
        }, editing
          ? h('span', null, t('action.done'))
          : h(React.Fragment, null, h(PencilIcon, { size: 11 }), h('span', null, t('action.edit'))))),
      h('span', {
        className: 'dsh-notes-handle dsh-notes-handle-e',
        onPointerDown: event => startResize(event, 'e'),
        'aria-hidden': true,
      }),
      h('span', {
        className: 'dsh-notes-handle dsh-notes-handle-s',
        onPointerDown: event => startResize(event, 's'),
        'aria-hidden': true,
      }),
      h('button', {
        type: 'button',
        className: 'dsh-notes-handle dsh-notes-handle-se dsh-notes-resize',
        title: `${t('action.resize')} — ${t('foot.resize')}`,
        'aria-label': t('action.resize'),
        'aria-keyshortcuts': narrow ? 'ArrowUp ArrowDown' : 'ArrowLeft ArrowRight ArrowUp ArrowDown',
        onPointerDown: event => startResize(event, 'se'),
        onKeyDown: (event) => {
          const step = event.shiftKey ? 48 : 16
          let width = note.width
          let height = note.height
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            if (narrow) return
            width += event.key === 'ArrowRight' ? step : -step
          } else if (event.key === 'ArrowDown') {
            height += step
          } else if (event.key === 'ArrowUp') {
            height -= step
          } else {
            return
          }
          event.preventDefault()
          event.stopPropagation()
          store.resize(note.id, width, height)
          store.flush()
        },
      }))
    }

    function NotesEntry({ wide, store, t, closeMobileDrawer }) {
      const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
      const notes = snapshot.notes
      const narrow = useNarrowViewport()
      const [open, setOpen] = useState(false)
      const [tab, setTab] = useState('notes')
      const [query, setQuery] = useState('')
      const [editingId, setEditingId] = useState(undefined)
      const [paletteId, setPaletteId] = useState(undefined)
      const [confirmId, setConfirmId] = useState(undefined)
      const [anchor, setAnchor] = useState(undefined)
      const [announcement, setAnnouncement] = useState('')
      const triggerRef = useRef(null)
      const layerRef = useRef(null)
      const panelRef = useRef(null)
      const boardRef = useRef(null)
      const confirmTimer = useRef(undefined)
      const focusedRef = useRef(false)

      const activeCount = notes.filter(note => note.archivedAt === null).length
      const archivedCount = notes.length - activeCount
      const activeLabel = activeCount > 0
        ? `${t('panel.title')}, ${t('count.notes', { count: activeCount })}`
        : t('panel.title')

      const focusBoard = () => {
        requestAnimationFrame(() => {
          if (boardRef.current !== null) boardRef.current.focus({ preventScroll: true })
        })
      }

      const finishEditing = useCallback((id) => {
        const note = store.getSnapshot().notes.find(candidate => candidate.id === id)
        if (note !== undefined && note.title.trim() === '' && note.body.trim() === '') {
          store.remove(id)
        }
        setEditingId(current => (current === id ? undefined : current))
        setPaletteId(undefined)
      }, [store])

      const closePanel = useCallback(() => {
        if (editingId !== undefined) finishEditing(editingId)
        setPaletteId(undefined)
        setConfirmId(undefined)
        setOpen(false)
      }, [editingId, finishEditing])

      const togglePanel = useCallback(() => {
        if (open) {
          closePanel()
          return
        }
        setOpen(true)
        if (typeof closeMobileDrawer === 'function') closeMobileDrawer()
      }, [open, closePanel, closeMobileDrawer])

      const switchTab = useCallback((next) => {
        if (next === tab) return
        if (editingId !== undefined) finishEditing(editingId)
        setPaletteId(undefined)
        setTab(next)
      }, [tab, editingId, finishEditing])

      const addNote = useCallback(() => {
        if (editingId !== undefined) finishEditing(editingId)
        const measured = boardRef.current === null ? 0 : boardRef.current.clientWidth - 32
        const boardWidth = measured > 0 ? measured : window.innerWidth - 48
        const width = narrow ? clamp(Math.round(boardWidth), MIN_WIDTH, MAX_WIDTH) : DEFAULT_WIDTH
        const id = store.addNote(width)
        setTab('notes')
        setQuery('')
        setPaletteId(undefined)
        setEditingId(id)
        requestAnimationFrame(() => {
          if (boardRef.current !== null) boardRef.current.scrollTop = 0
        })
      }, [store, editingId, finishEditing, narrow])

      useEffect(() => {
        if (!open) {
          setAnchor(undefined)
          return undefined
        }
        const place = () => {
          const rect = triggerRef.current?.getBoundingClientRect()
          if (rect === undefined) return
          const width = Math.min(860, window.innerWidth - 24)
          const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 12))
          const bottom = Math.max(8, window.innerHeight - rect.top + 8)
          setAnchor(current => (current !== undefined && current.left === left && current.bottom === bottom
            ? current
            : { left, bottom }))
        }
        place()
        window.addEventListener('resize', place)
        let observer
        if (typeof ResizeObserver === 'function' && triggerRef.current !== null) {
          observer = new ResizeObserver(place)
          observer.observe(triggerRef.current)
        }
        return () => {
          window.removeEventListener('resize', place)
          if (observer !== undefined) observer.disconnect()
        }
      }, [open])

      useEffect(() => {
        if (!open) {
          focusedRef.current = false
          return
        }
        if (focusedRef.current || anchor === undefined) return
        if (panelRef.current !== null) {
          panelRef.current.focus({ preventScroll: true })
          focusedRef.current = true
        }
      }, [open, anchor])

      useEffect(() => {
        if (!open) return undefined
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          event.stopPropagation()
          if (paletteId !== undefined) {
            setPaletteId(undefined)
            return
          }
          if (editingId !== undefined) {
            finishEditing(editingId)
            return
          }
          if (triggerRef.current !== null) triggerRef.current.focus()
          setOpen(false)
        }
        const onPointerDown = (event) => {
          const target = event.target
          if (!(target instanceof Node)) return
          if (panelRef.current?.contains(target) === true) return
          if (layerRef.current?.contains(target) === true) return
          closePanel()
        }
        document.addEventListener('keydown', onKeyDown, true)
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => {
          document.removeEventListener('keydown', onKeyDown, true)
          document.removeEventListener('pointerdown', onPointerDown, true)
        }
      }, [open, paletteId, editingId, closePanel, finishEditing])

      useEffect(() => {
        if (confirmId === undefined) return undefined
        confirmTimer.current = setTimeout(() => {
          setConfirmId(current => (current === confirmId ? undefined : current))
        }, 3000)
        return () => {
          if (confirmTimer.current !== undefined) {
            clearTimeout(confirmTimer.current)
            confirmTimer.current = undefined
          }
        }
      }, [confirmId])

      useEffect(() => {
        if (editingId !== undefined && !notes.some(note => note.id === editingId)) setEditingId(undefined)
        if (paletteId !== undefined && !notes.some(note => note.id === paletteId)) setPaletteId(undefined)
        if (confirmId !== undefined && !notes.some(note => note.id === confirmId)) setConfirmId(undefined)
      }, [notes, editingId, paletteId, confirmId])

      const groups = useMemo(() => {
        const inTab = notes.filter(note => (tab === 'archive' ? note.archivedAt !== null : note.archivedAt === null))
        const needle = query.trim().toLowerCase()
        const filtered = needle === ''
          ? inTab
          : inTab.filter(note => `${note.title}\n${note.body}`.toLowerCase().includes(needle))
        const entries = filtered.map(note => ({ note, time: tab === 'archive' ? note.archivedAt : note.createdAt }))
        entries.sort((left, right) => right.time - left.time)
        const output = []
        for (const entry of entries) {
          const key = dayKey(entry.time)
          const last = output[output.length - 1]
          if (last === undefined || last.key !== key) {
            output.push({ key, time: entry.time, notes: [entry.note] })
          } else {
            last.notes.push(entry.note)
          }
        }
        return output
      }, [notes, tab, query])

      const requestDelete = (id) => {
        if (confirmId === id) {
          if (confirmTimer.current !== undefined) {
            clearTimeout(confirmTimer.current)
            confirmTimer.current = undefined
          }
          const note = store.getSnapshot().notes.find(candidate => candidate.id === id)
          setConfirmId(undefined)
          if (editingId === id) setEditingId(undefined)
          store.remove(id)
          if (note !== undefined) {
            setAnnouncement(t('announce.deleted', { title: note.title.trim() === '' ? t('note.untitled') : note.title }))
          }
          focusBoard()
          return
        }
        setConfirmId(id)
      }

      const archiveNote = (note) => {
        if (editingId === note.id) finishEditing(note.id)
        const wasArchived = note.archivedAt !== null
        if (wasArchived) store.restore(note.id)
        else store.archive(note.id)
        setPaletteId(undefined)
        setAnnouncement(t(wasArchived ? 'announce.restored' : 'announce.archived', {
          title: note.title.trim() === '' ? t('note.untitled') : note.title,
        }))
        focusBoard()
      }

      const panel = open && anchor !== undefined
        ? ReactDOM.createPortal(h('section', {
          ref: panelRef,
          id: 'dsh-notes-panel',
          className: 'dsh-notes-panel',
          style: { left: `${anchor.left}px`, bottom: `${anchor.bottom}px` },
          role: 'dialog',
          'aria-modal': false,
          'aria-label': t('panel.title'),
          'data-mobile-nav-dragging': '',
          tabIndex: -1,
        },
        h('header', { className: 'dsh-notes-head' },
          h('span', { className: 'dsh-notes-head-icon' }, h(NoteIcon, { size: 18 })),
          h('h2', { className: 'dsh-notes-title' }, t('panel.title')),
          h('span', { className: 'dsh-notes-count' }, t(tab === 'archive' ? 'count.archive' : 'count.notes', {
            count: tab === 'archive' ? archivedCount : activeCount,
          })),
          h('div', { className: 'dsh-notes-head-actions' },
            h('button', { type: 'button', className: 'dsh-notes-primary', onClick: addNote },
              h(PlusIcon, { size: 14 }),
              h('span', null, t('action.new'))),
            h('button', {
              type: 'button',
              className: 'dsh-notes-icon-btn',
              title: t('panel.close'),
              'aria-label': t('panel.close'),
              onClick: () => {
                if (triggerRef.current !== null) triggerRef.current.focus()
                closePanel()
              },
            }, h(CloseIcon, { size: 16 })))),
        h('div', { className: 'dsh-notes-toolbar' },
          h('div', { className: 'dsh-notes-tabs', role: 'group', 'aria-label': t('panel.tabs') },
            h('button', {
              type: 'button', className: 'dsh-notes-tab',
              'aria-pressed': tab === 'notes', onClick: () => switchTab('notes'),
            }, `${t('tab.notes')} ${activeCount}`),
            h('button', {
              type: 'button', className: 'dsh-notes-tab',
              'aria-pressed': tab === 'archive', onClick: () => switchTab('archive'),
            }, `${t('tab.archive')} ${archivedCount}`)),
          h('div', { className: 'dsh-notes-search' },
            h('input', {
              type: 'search',
              className: 'dsh-notes-search-input',
              value: query,
              placeholder: t('panel.search'),
              'aria-label': t('panel.search'),
              onChange: event => setQuery(event.target.value),
            }),
            query !== '' && h('button', {
              type: 'button',
              className: 'dsh-notes-search-clear',
              'aria-label': t('action.clearSearch'),
              title: t('action.clearSearch'),
              onClick: () => setQuery(''),
            }, '×'))),
        h('div', {
          ref: boardRef,
          className: 'dsh-notes-board',
          tabIndex: -1,
          'aria-label': t('panel.title'),
        },
          groups.length === 0
            ? h('div', { className: 'dsh-notes-empty' },
              h('span', { className: 'dsh-notes-empty-icon' }, h(NoteIcon, { size: 28 })),
              h('p', null, t(query.trim() !== '' ? 'empty.search' : tab === 'archive' ? 'empty.archive' : 'empty.notes')),
              query.trim() === '' && tab === 'notes' && h('button', {
                type: 'button', className: 'dsh-notes-primary', onClick: addNote,
              }, h(PlusIcon, { size: 14 }), h('span', null, t('action.new'))))
            : groups.map(group => h('section', { key: group.key, className: 'dsh-notes-day' },
              h('div', { className: 'dsh-notes-day-head' },
                h('span', { className: 'dsh-notes-day-label' }, dayHeading(group.time, t)),
                h('span', { className: 'dsh-notes-day-count' }, t('count.group', { count: group.notes.length }))),
              h('div', { className: 'dsh-notes-notes' }, group.notes.map(note => h(NoteCard, {
                key: note.id,
                note,
                store,
                t,
                narrow,
                editing: editingId === note.id,
                paletteOpen: paletteId === note.id,
                confirmDelete: confirmId === note.id,
                readOnly: note.archivedAt !== null,
                onStartEdit: () => {
                  if (editingId !== undefined && editingId !== note.id) finishEditing(editingId)
                  setPaletteId(undefined)
                  setEditingId(note.id)
                },
                onDoneEdit: () => finishEditing(note.id),
                onTogglePalette: () => setPaletteId(current => (current === note.id ? undefined : note.id)),
                onColor: (color) => {
                  store.setColor(note.id, color)
                  setPaletteId(undefined)
                },
                onToggleArchive: () => archiveNote(note),
                onDelete: () => requestDelete(note.id),
              })))))),
        h('footer', { className: 'dsh-notes-foot' },
          snapshot.saveError === null
            ? h('span', { className: 'dsh-notes-foot-item' }, t('foot.storage'))
            : h('span', {
              className: 'dsh-notes-foot-item dsh-notes-foot-error',
              title: snapshot.saveError,
            }, t('foot.saveError')),
          h('span', { className: 'dsh-notes-foot-sep', 'aria-hidden': true }),
          h('span', { className: 'dsh-notes-foot-item' }, t('foot.resize'))),
        h('span', {
          className: 'dsh-notes-live',
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': true,
        }, announcement)), document.body)
        : null

      return h('div', {
        ref: layerRef,
        className: `dsh-notes-layer${wide ? '' : ' is-rail'}`,
      },
      h('button', {
        ref: triggerRef,
        type: 'button',
        className: 'dsh-notes-trigger',
        'aria-label': activeLabel,
        'aria-expanded': open,
        'aria-controls': open ? 'dsh-notes-panel' : undefined,
        title: wide ? undefined : t('panel.title'),
        onClick: togglePanel,
      },
      h(NoteIcon, { size: wide ? 16 : 18 }),
      wide && h('span', { className: 'dsh-notes-trigger-label' }, t('trigger')),
      wide && activeCount > 0 && h('span', { className: 'dsh-notes-trigger-count' }, activeCount)),
      panel)
    }

    const CSS = String.raw`
.dsh-notes-layer {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 42px;
  margin: 8px 0 0;
}
/* The footer seat renders through a display:contents slot anchor, so the row
   to wrap is the grandparent. A full-width sibling action (the shipped Cordis
   footer button) would otherwise squeeze this entry to zero width. */
div:has(> .dsh-notes-layer),
div:has(> div[data-slot="sidebar.footer.action"] > .dsh-notes-layer) {
  flex-wrap: wrap;
  row-gap: 2px;
}
.dsh-notes-layer:not(.is-rail) {
  flex-basis: 100%;
}
.dsh-notes-layer.is-rail {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  margin: 0;
}
.dsh-notes-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  margin: 0;
  padding: 0 10px 0 8px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}
@media (hover: hover) {
  .dsh-notes-trigger:hover {
    background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent));
  }
}
.dsh-notes-trigger[aria-expanded='true'] {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent));
}
.dsh-notes-layer.is-rail .dsh-notes-trigger {
  justify-content: center;
  gap: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  text-align: center;
}
.dsh-notes-trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-notes-trigger-count {
  flex: none;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 17px;
  font-variant-numeric: tabular-nums;
}

.dsh-notes-panel {
  position: fixed;
  z-index: 80;
  display: flex;
  flex-direction: column;
  width: min(860px, calc(100vw - 24px));
  height: min(74vh, 790px);
  max-height: calc(100vh - 24px);
  min-height: 320px;
  box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent, 0 24px 64px rgba(0, 0, 0, 0.26)), 0 2px 8px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  outline: none;
  font-size: 14px;
}
.dsh-notes-panel * {
  box-sizing: border-box;
}
.dsh-notes-head {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  row-gap: 6px;
  padding: 14px 16px 8px;
}
.dsh-notes-head-icon {
  display: inline-flex;
  color: var(--dsw-alias-brand-primary);
}
.dsh-notes-title {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dsh-notes-count {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 17px;
  font-variant-numeric: tabular-nums;
}
.dsh-notes-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.dsh-notes-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 60%, var(--dsw-alias-border-l1));
  border-radius: 9px;
  background-color: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-notes-primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, var(--dsw-alias-bg-layer-1));
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 75%, var(--dsw-alias-border-l1));
}
.dsh-notes-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.dsh-notes-icon-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent));
  color: var(--dsw-alias-label-primary);
}
.dsh-notes-danger:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dsh-notes-danger.is-armed {
  background: var(--dsw-alias-state-error-primary);
  color: #fff;
}
.dsh-notes-confirm {
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}
.dsh-notes-toolbar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 6px 16px 12px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l1);
}
.dsh-notes-tabs {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-notes-tab {
  height: 28px;
  padding: 0 11px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 28px;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-notes-tab[aria-pressed='true'] {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
}
.dsh-notes-search {
  position: relative;
  flex: 0 1 220px;
  min-width: 0;
  margin-left: auto;
}
.dsh-notes-search-input {
  width: 100%;
  height: 30px;
  padding: 0 26px 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  outline: none;
}
.dsh-notes-search-input::placeholder {
  color: var(--dsw-alias-label-secondary);
}
.dsh-notes-search-input::-webkit-search-cancel-button {
  display: none;
}
.dsh-notes-search-input:focus {
  border-color: var(--dsw-alias-brand-primary);
}
.dsh-notes-search-clear {
  position: absolute;
  top: 50%;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
  line-height: 1;
  transform: translateY(-50%);
  cursor: pointer;
}
.dsh-notes-search-clear:hover {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent));
}

.dsh-notes-board {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 14px 16px 22px;
  scrollbar-width: thin;
}
.dsh-notes-day {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dsh-notes-day-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0 4px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-notes-day-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.03em;
  color: var(--dsw-alias-label-secondary);
}
.dsh-notes-day-count {
  font-size: 10.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  opacity: 0.75;
}
.dsh-notes-notes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.dsh-notes-card {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: none;
  max-width: 100%;
  padding: 9px 10px 8px 13px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-left: 3px solid var(--dsh-notes-accent);
  border-radius: 12px;
  background-color: var(--dsw-alias-bg-layer-1);
  background: color-mix(in srgb, var(--dsh-notes-accent) 9%, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  transition: border-color 120ms ease;
}
.dsh-notes-card:hover {
  border-color: color-mix(in srgb, var(--dsh-notes-accent) 45%, var(--dsw-alias-border-l1));
}
.dsh-notes-card.is-archived {
  border-left-style: dashed;
  opacity: 0.94;
}
.dsh-notes-card-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
}
.dsh-notes-urgency {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  padding: 0 7px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsh-notes-accent) 15%, transparent);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
}
.dsh-notes-urgency:hover {
  background: color-mix(in srgb, var(--dsh-notes-accent) 24%, transparent);
}
.dsh-notes-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--dsh-notes-dot, currentColor);
}
.dsh-notes-card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.dsh-notes-card-actions .dsh-notes-icon-btn {
  min-width: 26px;
  height: 26px;
  padding: 0 4px;
}
.dsh-notes-palette {
  flex: none;
  display: flex;
  gap: 7px;
  padding: 5px 2px 2px;
}
.dsh-notes-swatch {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1.5px solid transparent;
  border-radius: 50%;
  background: var(--dsh-notes-dot);
  cursor: pointer;
}
.dsh-notes-swatch[aria-pressed='true'] {
  border-color: var(--dsw-alias-label-primary);
  outline: 1.5px solid var(--dsw-alias-bg-layer-1);
  outline-offset: -3px;
}
.dsh-notes-swatch-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
}
.dsh-notes-card-title {
  flex: none;
  margin: 5px 0 3px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 19px;
  color: var(--dsw-alias-label-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-notes-card-title.is-empty {
  color: var(--dsw-alias-label-secondary);
  font-weight: 400;
}
.dsh-notes-title-input {
  flex: none;
  width: 100%;
  margin: 3px 0 2px;
  padding: 1px 0;
  border: 0;
  border-bottom: 0.5px solid color-mix(in srgb, var(--dsh-notes-accent) 40%, var(--dsw-alias-border-l2));
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 19px;
  outline: none;
}
.dsh-notes-title-input::placeholder {
  color: var(--dsw-alias-label-secondary);
  font-weight: 400;
}
.dsh-notes-card-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-size: 12.5px;
  line-height: 1.55;
  scrollbar-width: thin;
}
.dsh-notes-editor {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12.5px;
  line-height: 1.55;
  resize: none;
  outline: none;
}
.dsh-notes-editor::placeholder {
  color: var(--dsw-alias-label-secondary);
}
.dsh-notes-empty-body {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  opacity: 0.8;
}
.dsh-notes-card-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 0.5px dashed color-mix(in srgb, var(--dsh-notes-accent) 24%, transparent);
  font-size: 10.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
}
.dsh-notes-time {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-notes-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  margin-left: auto;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}
.dsh-notes-edit-btn:hover {
  background: color-mix(in srgb, var(--dsh-notes-accent) 14%, transparent);
  color: var(--dsw-alias-label-primary);
}

.dsh-notes-handle {
  position: absolute;
  z-index: 3;
  touch-action: none;
  opacity: 0;
}
.dsh-notes-handle-e {
  top: 12px;
  right: -4px;
  bottom: 12px;
  width: 9px;
  cursor: ew-resize;
}
/* Phone width: cards fill the board, so only height resizing applies. */
.dsh-notes-card[data-narrow] .dsh-notes-handle-e {
  display: none;
}
.dsh-notes-card[data-narrow] .dsh-notes-handle-se {
  cursor: ns-resize;
}
.dsh-notes-handle-s {
  left: 12px;
  right: 12px;
  bottom: -4px;
  height: 9px;
  cursor: ns-resize;
}
.dsh-notes-handle-se {
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: nwse-resize;
  opacity: 0.7;
}
.dsh-notes-handle-se::after {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--dsh-notes-accent);
  border-bottom: 2px solid var(--dsh-notes-accent);
  border-bottom-right-radius: 2px;
  content: '';
}
.dsh-notes-handle-se:hover,
.dsh-notes-handle-se:focus-visible {
  opacity: 1;
}

.dsh-notes-preview {
  overflow-wrap: anywhere;
}
.dsh-notes-preview p {
  margin: 0 0 6px;
}
.dsh-notes-preview p:last-child {
  margin-bottom: 0;
}
.dsh-notes-preview h1,
.dsh-notes-preview h2,
.dsh-notes-preview h3,
.dsh-notes-preview h4,
.dsh-notes-preview h5,
.dsh-notes-preview h6 {
  margin: 8px 0 4px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--dsw-alias-label-primary);
}
.dsh-notes-preview h1 { font-size: 16px; }
.dsh-notes-preview h2 { font-size: 15px; }
.dsh-notes-preview h3 { font-size: 14px; }
.dsh-notes-preview h4,
.dsh-notes-preview h5,
.dsh-notes-preview h6 { font-size: 12.5px; }
.dsh-notes-preview h1:first-child,
.dsh-notes-preview h2:first-child,
.dsh-notes-preview h3:first-child,
.dsh-notes-preview h4:first-child {
  margin-top: 0;
}
.dsh-notes-preview ul,
.dsh-notes-preview ol {
  margin: 0 0 6px;
  padding-left: 18px;
}
.dsh-notes-preview li {
  margin: 1px 0;
}
.dsh-notes-preview .dsh-notes-task {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-left: -14px;
  list-style: none;
}
.dsh-notes-task-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 3px;
  font-size: 9px;
  line-height: 1;
}
.dsh-notes-task.is-done .dsh-notes-task-box {
  border-color: transparent;
  background: var(--dsw-alias-state-success-primary);
  color: #fff;
}
.dsh-notes-task.is-done .dsh-notes-task-text {
  color: var(--dsw-alias-label-secondary);
  text-decoration: line-through;
}
.dsh-notes-inline-code {
  padding: 1px 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
}
.dsh-notes-pre {
  margin: 0 0 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  overflow: auto;
}
.dsh-notes-pre code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre;
}
.dsh-notes-quote {
  margin: 0 0 6px;
  padding: 1px 0 1px 9px;
  border-left: 2px solid color-mix(in srgb, var(--dsh-notes-accent) 55%, transparent);
  color: var(--dsw-alias-label-secondary);
}
.dsh-notes-quote > :last-child {
  margin-bottom: 0;
}
.dsh-notes-hr {
  height: 0;
  margin: 9px 0;
  border: 0;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.dsh-notes-preview a {
  color: var(--dsw-alias-brand-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.dsh-notes-preview del {
  color: var(--dsw-alias-label-secondary);
}

.dsh-notes-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 44px 24px;
  color: var(--dsw-alias-label-secondary);
  text-align: center;
}
.dsh-notes-empty-icon {
  opacity: 0.55;
}
.dsh-notes-empty p {
  max-width: 340px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
}
.dsh-notes-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  font-size: 10.5px;
  line-height: 16px;
}
.dsh-notes-foot-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}
.dsh-notes-foot-error {
  color: var(--dsw-alias-state-error-primary);
}
.dsh-notes-live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.dsh-notes-panel button:focus-visible,
.dsh-notes-panel input:focus-visible,
.dsh-notes-panel textarea:focus-visible,
.dsh-notes-trigger:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}

@media (max-width: 640px) {
  .dsh-notes-panel {
    width: calc(100vw - 16px);
    height: min(80vh, 720px);
  }
  .dsh-notes-search {
    flex: 1 1 100%;
    margin-left: 0;
  }
  .dsh-notes-foot-item:last-child { display: none; }
  .dsh-notes-foot-sep { display: none; }
}

/* dsh-web-mobile raises its drawer to z 1300 and its full-screen close
   catcher to z 1250. This sheet must stay above both so it remains usable
   while the drawer is open/closing; mobile modal sheets sit at 1400, so the
   sheet stays below them. It is also pinned to the viewport instead of the
   drawer's footer trigger, so closing the drawer cannot drag its anchor away. */
@media (max-width: 1023px) and (pointer: coarse) {
  .dsh-notes-panel {
    left: 8px !important;
    right: 8px !important;
    bottom: calc(8px + env(safe-area-inset-bottom, 0px)) !important;
    width: auto !important;
    max-width: none !important;
    z-index: 1350;
  }
}
`

    function apply(ctx) {
      /**
       * On phone layouts the sidebar is a drawer managed by dsh-web-mobile.
       * Close it when the notes sheet opens so the sheet is the top surface
       * instead of sitting behind the drawer and its full-screen close catcher.
       * No-op on desktop and when no drawer is open.
       */
      const closeMobileDrawer = () => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
        if (!window.matchMedia('(max-width: 1023px) and (pointer: coarse)').matches) return
        const frame = document.querySelector('[data-mobile-nav="frame"]')
        if (frame === null || frame.hasAttribute('data-sidebar-collapsed')) return
        if (typeof ctx.get !== 'function') return
        const layout = ctx.get('layout')
        if (layout === undefined || typeof layout.toggleSidebar !== 'function') return
        try {
          layout.toggleSidebar()
        } catch (error) {
          console.error('[dsh-notes] closing the mobile sidebar failed:', error)
        }
      }

      ctx.effect(() => {
        const disposeZh = ctx.locale.register(NS, 'zh', zh)
        const disposeEn = ctx.locale.register(NS, 'en', en)
        return () => {
          disposeZh()
          disposeEn()
        }
      }, 'dsh-notes: locale dictionaries')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.setAttribute('data-plugin', '@pemako/dsh-notes')
        style.setAttribute('data-dsh-notes', '')
        style.textContent = CSS
        document.head.append(style)
        return () => { style.remove() }
      }, 'dsh-notes: styles')

      const store = createNotesStore()
      ctx.effect(() => {
        const flush = () => store.flush()
        const onStorage = (event) => {
          if (event.key === STORAGE_KEY) store.reload()
        }
        window.addEventListener('pagehide', flush)
        window.addEventListener('beforeunload', flush)
        window.addEventListener('storage', onStorage)
        return () => {
          window.removeEventListener('pagehide', flush)
          window.removeEventListener('beforeunload', flush)
          window.removeEventListener('storage', onStorage)
          store.dispose()
        }
      }, 'dsh-notes: persistence')

      ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'dsh-notes',
        order: 10,
        locale: NS,
        inject: () => ({ store, closeMobileDrawer }),
      }, NotesEntry))
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    }
  },
})