import React, { useEffect, useReducer, useMemo, useRef, useState } from 'react'
import { X, Trash, Edit, Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

/*
  Refactored Notes App
  - useReducer for predictable state
  - localStorage persistence
  - add / edit / delete / search
  - basic validation + character limit
  - components split inside one file for demo convenience
  - Tailwind CSS used for styling (same as your original)
*/

const LOCAL_KEY = 'notes_app_v1'

const initialState = {
  notes: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, notes: action.payload }
    case 'add':
      return { ...state, notes: [action.payload, ...state.notes] }
    case 'update':
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      }
    case 'delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) }
    default:
      return state
  }
}

function useLocalHydrate(dispatch) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) dispatch({ type: 'hydrate', payload: JSON.parse(raw) })
    } catch (e) {
      console.warn('failed to hydrate', e)
    }
  }, [dispatch])
}

function useLocalSave(state) {
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state.notes))
    } catch (e) {
      console.warn('failed to persist', e)
    }
  }, [state.notes])
}

/* ---------- Small presentational components ---------- */
const Header = ({ children }) => (
  <h1 className='text-4xl mb-2 font-bold'>{children}</h1>
)

function NoteCard({ note, onDelete, onEdit }) {
  return (
    <article className='flex flex-col justify-between p-4 w-48 h-52 rounded-xl bg-cover text-black font-mono relative' style={{ backgroundImage: `url(https://static.vecteezy.com/system/resources/thumbnails/010/793/873/small/a-lined-note-paper-covered-with-transparent-tape-on-a-yellow-background-with-a-white-checkered-pattern-free-png.png)` }}>
      <div>
        <h3 className='leading-tight text-xl font-bold line-clamp-2'>{note.title}</h3>
        <p className='mt-2 leading-tight font-medium text-gray-600 line-clamp-4'>{note.details}</p>
      </div>

      <div className='flex gap-2 mt-3 w-full'>
        <button onClick={() => onEdit(note)} className='flex-1 py-1 text-xs rounded bg-gray-800 active:scale-95 text-white flex items-center justify-center gap-2'>
          <Edit size={14} /> Edit
        </button>
        <button onClick={() => onDelete(note.id)} className='py-1 px-2 text-xs rounded bg-red-600 active:scale-95 text-white flex items-center gap-2'>
          <Trash size={14} />
        </button>
      </div>
    </article>
  )
}

function NoteForm({ onAdd, onUpdate, editing, setEditing }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const maxChars = 500
  const titleRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setDetails(editing.details)
      titleRef.current?.focus()
    } else {
      setTitle('')
      setDetails('')
    }
  }, [editing])

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Title required')
    if (details.length > maxChars) return setError(`Details max ${maxChars} chars`)

    if (editing) {
      onUpdate({ ...editing, title: title.trim(), details: details.trim() })
      setEditing(null)
    } else {
      onAdd({ id: uuidv4(), title: title.trim(), details: details.trim(), createdAt: Date.now() })
    }
    setTitle('')
    setDetails('')
  }

  return (
    <form onSubmit={submit} className='flex gap-4 lg:w-full flex-col items-start p-10'>
      <Header>Add Notes</Header>

      <input
        ref={titleRef}
        aria-label='note title'
        type='text'
        placeholder='Enter Notes Heading'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className='px-5 w-full font-medium py-2 border-2 outline-none rounded'
      />

      <textarea
        aria-label='note details'
        className='px-5 w-full font-medium h-32 py-2 border-2 outline-none rounded resize-none'
        placeholder='Write Details.'
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />

      <div className='w-full flex items-center gap-3'>
        <button type='submit' className='bg-white active:bg-gray-200 font-medium w-full outline-none rounded text-black px-5 py-2 flex items-center justify-center gap-2'>
          <Plus size={16} /> {editing ? 'Update Note' : 'Add Note'}
        </button>
        {editing && (
          <button type='button' onClick={() => setEditing(null)} className='py-2 px-4 rounded bg-gray-700 text-white'>Cancel</button>
        )}
      </div>

      <div className='w-full flex justify-between text-xs text-gray-400'>
        <div>{error}</div>
        <div>{details.length}/{maxChars}</div>
      </div>
    </form>
  )
}

/* ---------- Main App ---------- */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  useLocalHydrate(dispatch)
  useLocalSave(state)

  const addNote = (note) => dispatch({ type: 'add', payload: note })
  const updateNote = (note) => dispatch({ type: 'update', payload: note })
  const deleteNote = (id) => dispatch({ type: 'delete', payload: id })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return state.notes
    return state.notes.filter(n => n.title.toLowerCase().includes(q) || n.details.toLowerCase().includes(q))
  }, [query, state.notes])

  return (
    <div className='bg-black text-white min-h-screen lg:flex'>
      <div className='lg:w-1/2'>
        <NoteForm onAdd={addNote} onUpdate={updateNote} editing={editing} setEditing={setEditing} />
      </div>

      <div className='lg:w-1/2 lg:border-l-2 p-6'>
        <div className='flex items-center justify-between'>
          <Header>Recent Notes</Header>
          <input aria-label='search notes' placeholder='Search...' value={query} onChange={(e) => setQuery(e.target.value)} className='px-3 py-2 rounded bg-gray-900 border border-gray-700' />
        </div>

        <div className='flex flex-wrap gap-5 justify-start h-[80vh] items-start overflow-auto mt-6'>
          {filtered.length === 0 ? (
            <div className='text-gray-400'>No notes yet — add one!</div>
          ) : (
            filtered.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={(id) => deleteNote(id)} onEdit={(n) => setEditing(n)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
