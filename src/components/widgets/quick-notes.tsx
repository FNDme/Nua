import { ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { QUICK_NOTE_KEY, QUICK_TODOS_KEY } from "~/constants"
import {
  useUserPreferences,
  type NotesTab
} from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: number
}

// Local area: sync storage caps items at 8KB, too small for a long note
const localStorageArea = new Storage({ area: "local" })

const TABS: { value: NotesTab; label: string }[] = [
  { value: "todo", label: "To-do" },
  { value: "note", label: "Notes" }
]

const NOTE_SAVE_DELAY = 400

function TodoList() {
  const [todos, setTodos] = useStorage<Todo[]>(
    { key: QUICK_TODOS_KEY, instance: localStorageArea },
    (v) => v ?? []
  )
  const [text, setText] = useState("")
  const list = todos ?? []
  const doneCount = list.filter((t) => t.done).length

  const add = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setTodos((prev = []) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: value,
        done: false,
        createdAt: Date.now()
      }
    ])
    setText("")
  }

  const toggle = (id: string) =>
    setTodos((prev = []) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  const remove = (id: string) =>
    setTodos((prev = []) => prev.filter((t) => t.id !== id))
  const clearDone = () => setTodos((prev = []) => prev.filter((t) => !t.done))

  // Open items first, each group in the order they were added
  const sorted = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)]

  return (
    <div className="space-y-2">
      <form onSubmit={add} className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          aria-label="New task"
          maxLength={200}
          className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-400 focus:bg-white/15"
        />
        <button
          type="submit"
          aria-label="Add task"
          disabled={!text.trim()}
          className="rounded-md bg-white/10 px-2 hover:bg-white/20 disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-1 text-sm text-gray-400">Nothing to do.</p>
      ) : (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {sorted.map((todo) => (
            <li key={todo.id} className="group flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggle(todo.id)}
                aria-label={`Mark "${todo.text}" as ${todo.done ? "not done" : "done"}`}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-rose-400"
              />
              <span
                className={cn(
                  "min-w-0 flex-1 break-words leading-5",
                  todo.done && "text-gray-400 line-through"
                )}>
                {todo.text}
              </span>
              <button
                type="button"
                aria-label={`Delete "${todo.text}"`}
                onClick={() => remove(todo.id)}
                className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 hover:bg-white/10 hover:text-gray-100 focus:opacity-100 group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {list.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {list.length - doneCount} open · {doneCount} done
          </span>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={clearDone}
              className="hover:text-gray-100 hover:underline">
              Clear done
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function QuickNote() {
  const [stored, setStored] = useStorage<string>(
    { key: QUICK_NOTE_KEY, instance: localStorageArea },
    (v) => v ?? ""
  )
  // Typed text is kept locally and saved shortly after typing stops, so
  // other open tabs don't re-render on every keystroke.
  const [text, setText] = useState<string | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const pending = useRef<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const flush = () => {
    clearTimeout(timeout.current)
    if (pending.current !== null) {
      setStored(pending.current)
      pending.current = null
    }
  }

  // Save on the way out (tab closed or widget collapsed)
  useEffect(() => {
    window.addEventListener("beforeunload", flush)
    return () => {
      window.removeEventListener("beforeunload", flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Follow saved changes (ours or another tab's) unless typing here
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) setText(null)
  }, [stored])

  const value = text ?? stored ?? ""

  return (
    <div className="space-y-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setText(e.target.value)
          pending.current = e.target.value
          clearTimeout(timeout.current)
          timeout.current = setTimeout(flush, NOTE_SAVE_DELAY)
        }}
        onBlur={flush}
        placeholder="Jot something down..."
        aria-label="Quick note"
        rows={7}
        className="w-full resize-none rounded-md bg-white/10 p-2 text-sm leading-5 text-gray-100 outline-none [scrollbar-width:thin] placeholder:text-gray-400 focus:bg-white/15"
      />
      <div className="text-right text-xs text-gray-400">
        {value.length} characters
      </div>
    </div>
  )
}

function QuickNotes() {
  const {
    preferences: { notes },
    updateNotes
  } = useUserPreferences()
  const tab = notes?.tab ?? "todo"
  const collapsed = !!notes?.collapsed

  return (
    <div className="w-72 rounded-2xl bg-black/20 p-3 text-gray-200 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div
        className={cn(
          "flex items-center justify-between",
          !collapsed && "mb-2"
        )}>
        <div role="tablist" aria-label="Notes" className="flex gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={t.value === tab}
              onClick={() => updateNotes({ tab: t.value, collapsed: false })}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs text-gray-400 transition-colors hover:text-gray-100",
                t.value === tab &&
                  !collapsed &&
                  "bg-white/10 font-medium text-gray-100"
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={collapsed ? "Expand" : "Collapse"}
          aria-expanded={!collapsed}
          onClick={() => updateNotes({ collapsed: !collapsed })}
          className="rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-gray-100">
          {collapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {!collapsed && (
        <div role="tabpanel">
          {tab === "todo" ? <TodoList /> : <QuickNote />}
        </div>
      )}
    </div>
  )
}

export default QuickNotes
