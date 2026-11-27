'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const dbCategories = {
  Date: 'date',
  Activity: 'activity',
  Vacation: 'vacation',
  Project: 'project',
  Misc: 'misc'
}

const singularCategories = Object.keys(dbCategories) as (keyof typeof dbCategories)[]

function getGroupName(type: string | null | undefined): string {
  if (!type) return 'Other'
  const t = type.toLowerCase()
  if (t === 'date') return 'Dates'
  if (t === 'activity') return 'Activities'
  if (t === 'vacation') return 'Vacations'
  if (t === 'project') return 'Projects'
  if (t === 'misc' || t === 'other') return 'Misc'
  return 'Other'
}

export default function IdeasPage() {
  const supabase = createClient()
  const [ideas, setIdeas] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Activity',
    target_date: '',
    location: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setIdeas(data || [])
  }

  function openAddForm() {
    setEditingId(null)
    setForm({
      title: '',
      description: '',
      type: 'Activity',
      target_date: '',
      location: '',
      priority: 'medium'
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEdit(idea: any) {
    setEditingId(idea.id)
    let displayType = 'Activity'
    if (idea.type === 'date') displayType = 'Date'
    else if (idea.type === 'vacation') displayType = 'Vacation'
    else if (idea.type === 'project') displayType = 'Project'
    else if (idea.type === 'misc' || idea.type === 'other') displayType = 'Misc'

    setForm({
      title: idea.title || '',
      description: idea.description || '',
      type: displayType,
      target_date: idea.target_date || '',
      location: idea.location || '',
      priority: idea.priority || 'medium'
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setShowForm(false)
    setForm({
      title: '',
      description: '',
      type: 'Activity',
      target_date: '',
      location: '',
      priority: 'medium'
    })
  }

  async function saveIdea() {
    if (!form.title) return
    const { data: { user } } = await supabase.auth.getUser()
    const dbType = dbCategories[form.type as keyof typeof dbCategories] || 'misc'

    if (editingId) {
      await supabase.from('ideas').update({
        title: form.title,
        description: form.description,
        type: dbType,
        target_date: form.target_date || null,
        location: form.location,
        priority: form.priority
      }).eq('id', editingId)
    } else {
      await supabase.from('ideas').insert({
        title: form.title,
        description: form.description,
        type: dbType,
        target_date: form.target_date || null,
        location: form.location,
        priority: form.priority,
        created_by: user?.id,
        completed: false
      })
    }

    cancelEdit()
    fetchIdeas()
  }

  async function markCompleted(id: number, completed: boolean) {
    await supabase.from('ideas').update({ completed }).eq('id', id)
    fetchIdeas()
  }

  async function deleteIdea(id: number) {
    if (!confirm('Delete this idea forever?')) return
    await supabase.from('ideas').delete().eq('id', id)
    fetchIdeas()
  }

  function priorityColor(priority: string) {
    if (priority === 'high') return 'bg-pink-200 text-pink-900'
    if (priority === 'medium') return 'bg-purple-200 text-purple-900'
    return 'bg-green-200 text-green-900'
  }

  const activeIdeas = ideas.filter((idea) => !idea.completed)
  const completedIdeas = ideas.filter((idea) => idea.completed)

  const grouped: Record<string, any[]> = {}
  activeIdeas.forEach((idea) => {
    const group = getGroupName(idea.type)
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(idea)
  })

  const groupOrder = ['Dates', 'Activities', 'Vacations', 'Projects', 'Misc', 'Other']

  const catEmoji: Record<string, string> = {
    Dates: '💕',
    Activities: '🐾',
    Vacations: '🏝️',
    Projects: '📝',
    Misc: '🐱',
    Other: '😺'
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-pink-200">
            🐱 Ideas Dashboard 🐾
          </h1>
          {!showForm && (
            <button
              onClick={openAddForm}
              className="px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-medium shadow"
            >
              + Add Idea
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-8 space-y-3 border border-pink-300/30 p-4 rounded-2xl bg-gray-800/80">
            <h2 className="font-semibold text-pink-200">
              {editingId ? '✏️ Edit Idea' : '✨ Add New Idea'}
            </h2>
            <input
              type="text"
              placeholder="Idea title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border p-2 w-full rounded-lg text-gray-900 bg-white"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border p-2 w-full rounded-lg text-gray-900 bg-white"
              rows={2}
            />

            <div>
              <p className="text-sm font-medium mb-2 text-pink-100">Category</p>
              <div className="flex flex-wrap gap-2">
                {singularCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, type: cat })}
                    className={`px-3 py-1.5 rounded-full border text-sm text-gray-900 bg-white hover:bg-pink-100 ${
                      form.type === cat ? 'ring-2 ring-pink-500 font-semibold' : ''
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="border p-2 rounded-lg text-gray-900 bg-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="border p-2 rounded-lg text-gray-900 bg-white"
              />
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="border p-2 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveIdea}
                className="px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-medium"
              >
                {editingId ? 'Update Idea' : 'Add Idea'}
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {groupOrder.map((plural) => {
            const items = grouped[plural] || []
            if (items.length === 0) return null
            return (
              <div key={plural}>
                <h2 className="text-xl font-semibold mb-3 text-pink-200">
                  {catEmoji[plural] || '🐱'} {plural}
                </h2>
                <div className="space-y-4">
                  {items.map((idea) => (
                    <div key={idea.id} className="border border-pink-300/20 p-4 rounded-2xl shadow-sm bg-gray-800/70">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{idea.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(idea.priority)}`}>
                          {idea.priority}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-gray-400">
                        {idea.location && `${idea.location} `}
                        {idea.target_date && `• ${idea.target_date}`}
                      </p>
                      {idea.description && <p className="mt-2">{idea.description}</p>}
                      <div className="mt-3 flex gap-3 text-sm">
                        <button onClick={() => startEdit(idea)} className="text-pink-300 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => markCompleted(idea.id, true)} className="text-green-300 hover:underline">
                          Complete
                        </button>
                        <button onClick={() => deleteIdea(idea.id)} className="text-red-400 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Completed bin */}
        <div className="mt-12">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-lg font-semibold text-pink-200 hover:underline"
          >
            {showCompleted ? '▼' : '▶'} Completed ({completedIdeas.length})
          </button>
          {showCompleted && (
            <div className="mt-4 space-y-4">
              {completedIdeas.map((idea) => (
                <div key={idea.id} className="border border-gray-700 p-4 rounded-2xl bg-gray-800/40 opacity-80">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold line-through">{idea.title}</h3>
                    <span className="text-xs text-gray-500">{idea.type}</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-sm">
                    <button onClick={() => markCompleted(idea.id, false)} className="text-blue-300 hover:underline">
                      Restore
                    </button>
                    <button onClick={() => deleteIdea(idea.id)} className="text-red-400 hover:underline">
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
              {completedIdeas.length === 0 && <p className="text-gray-500">No completed ideas yet.</p>}
            </div>
          )}
        </div>

        {ideas.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            No ideas yet... add one and the cats will help you remember! 🐱
          </p>
        )}
      </div>
    </div>
  )
}