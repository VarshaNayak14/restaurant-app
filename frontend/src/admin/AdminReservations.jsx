import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Users, Mail, Phone, Clock, CheckCircle, XCircle,
  Loader2, Trash2, ChevronDown, Search, RefreshCw, MessageSquare,
  CalendarCheck, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'

const STATUS = {
  pending:   { label: 'Pending',   bg: '#dbeafe', color: '#1e40af', icon: <Clock size={13} /> },
  confirmed: { label: 'Confirmed', bg: '#d1fae5', color: '#065f46', icon: <CheckCircle size={13} /> },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={13} /> },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      fontSize: '.72rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
    }}>
      {s.icon} {s.label}
    </span>
  )
}

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return str }
}

export default function AdminReservations() {
  const { getToken } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [total, setTotal]     = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [noteMap, setNoteMap] = useState({})   // id -> draft note
  const [saving, setSaving]   = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const q    = filter !== 'all' ? `?status=${filter}` : ''
      const res  = await fetch(`${API_BASE}/contact/reservations${q}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) { setItems(data.data); setTotal(data.total) }
    } catch { }
    finally { setLoading(false) }
  }, [filter, getToken])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateStatus(id, status) {
    setSaving(s => ({ ...s, [id]: true }))
    try {
      const res  = await fetch(`${API_BASE}/contact/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status, adminNote: noteMap[id] || '' }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(prev => prev.map(it => it._id === id ? data.data : it))
        setExpandedId(null)
      }
    } catch { }
    finally { setSaving(s => ({ ...s, [id]: false })) }
  }

  async function deleteItem(id, name) {
    if (!confirm(`Delete reservation by "${name}"?`)) return
    try {
      await fetch(`${API_BASE}/contact/reservations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      setItems(prev => prev.filter(it => it._id !== id))
      setTotal(t => t - 1)
    } catch { }
  }

  const filtered = items.filter(it =>
    search === '' ||
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.email.toLowerCase().includes(search.toLowerCase()) ||
    (it.phone || '').includes(search)
  )

  const counts = { all: items.length, pending: 0, confirmed: 0, cancelled: 0 }
  items.forEach(it => { if (counts[it.status] !== undefined) counts[it.status]++ })

  return (
    <div className="admin-home-page">
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Reservations</h1>
          <p className="dash-sub">Manage table reservation requests from guests.</p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8,
            cursor: 'pointer', fontSize: '.84rem', fontWeight: 600, color: '#374151'
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { key: 'all',       label: 'Total',     icon: <CalendarCheck size={20} />, color: '#C9952A' },
          { key: 'pending',   label: 'Pending',   icon: <Clock size={20} />,         color: '#1e40af' },
          { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle size={20} />,   color: '#065f46' },
          { key: 'cancelled', label: 'Cancelled', icon: <XCircle size={20} />,       color: '#991b1b' },
        ].map(s => (
          <div key={s.key} style={{
            background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', outline: filter === s.key ? `2px solid ${s.color}` : 'none',
          }}
            onClick={() => setFilter(s.key)}
          >
            <div style={{ color: s.color, background: `${s.color}18`, borderRadius: 8, padding: 8, display: 'flex' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f1923' }}>{counts[s.key]}</div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{
          flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
          border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', background: '#fff'
        }}>
          <Search size={15} style={{ color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '.87rem', background: 'transparent' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
              borderColor: filter === s ? '#C9952A' : '#e5e7eb',
              background: filter === s ? 'rgba(201,149,42,.1)' : '#fff',
              color: filter === s ? '#92650a' : '#6b7280',
              fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><Loader2 size={30} className="spin-icon" /><p>Loading reservations…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={36} />
            <p>{search ? 'No results for your search.' : 'No reservations found.'}</p>
            <span>{search ? 'Try different keywords.' : 'Guest reservations will appear here.'}</span>
          </div>
        ) : (
          <>
            <div className="home-table-wrap">
              <table className="home-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Contact</th>
                    <th>Date & Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <React.Fragment key={item._id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{item.name}</div>
                          {item.message && (
                            <div style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: 2 }}>
                              <MessageSquare size={10} style={{ verticalAlign: '-1px' }} /> Has note
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '.82rem', color: '#374151' }}>{item.email}</div>
                          {item.phone && <div style={{ fontSize: '.78rem', color: '#6b7280' }}>{item.phone}</div>}
                        </td>
                        <td style={{ fontWeight: 600, color: '#C9952A', whiteSpace: 'nowrap' }}>
                          {formatDate(item.date)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} style={{ color: '#9ca3af' }} /> {item.guests}
                          </div>
                        </td>
                        <td><StatusBadge status={item.status} /></td>
                        <td style={{ fontSize: '.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="action-btns">
                            <button
                              className="row-delete-btn"
                              onClick={() => deleteItem(item._id, item.name)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb',
                              background: '#f9fafb', fontSize: '.75rem', fontWeight: 600,
                              cursor: 'pointer', color: '#374151'
                            }}
                              onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                            >
                              Manage <ChevronDown size={13} style={{ transform: expandedId === item._id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedId === item._id && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: '#fafafa' }}>
                            <div style={{ padding: '18px 20px', borderTop: '1.5px solid #f0f1f4', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                              {/* Details */}
                              <div style={{ flex: '1 1 260px' }}>
                                <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: 10 }}>RESERVATION DETAILS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '.85rem' }}>
                                  <div><span style={{ color: '#9ca3af', minWidth: 90, display: 'inline-block' }}>Name:</span> <strong>{item.name}</strong></div>
                                  <div><span style={{ color: '#9ca3af', minWidth: 90, display: 'inline-block' }}>Email:</span> {item.email}</div>
                                  <div><span style={{ color: '#9ca3af', minWidth: 90, display: 'inline-block' }}>Phone:</span> {item.phone || '—'}</div>
                                  <div><span style={{ color: '#9ca3af', minWidth: 90, display: 'inline-block' }}>Guests:</span> {item.guests}</div>
                                  <div><span style={{ color: '#9ca3af', minWidth: 90, display: 'inline-block' }}>Date:</span> <strong style={{ color: '#C9952A' }}>{formatDate(item.date)}</strong></div>
                                  {item.message && (
                                    <div style={{ marginTop: 6, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                                      <div style={{ fontSize: '.74rem', color: '#9ca3af', fontWeight: 700, marginBottom: 4 }}>GUEST MESSAGE</div>
                                      <div style={{ color: '#374151' }}>{item.message}</div>
                                    </div>
                                  )}
                                  {item.adminNote && (
                                    <div style={{ marginTop: 6, background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 8, padding: 10 }}>
                                      <div style={{ fontSize: '.74rem', color: '#92400e', fontWeight: 700, marginBottom: 4 }}>ADMIN NOTE</div>
                                      <div style={{ color: '#78350f', fontSize: '.85rem' }}>{item.adminNote}</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div style={{ flex: '1 1 260px' }}>
                                <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: 10 }}>UPDATE STATUS</div>
                                <textarea
                                  rows={3}
                                  placeholder="Add a note for the guest (optional)…"
                                  value={noteMap[item._id] || ''}
                                  onChange={e => setNoteMap(n => ({ ...n, [item._id]: e.target.value }))}
                                  style={{
                                    width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8,
                                    padding: '8px 12px', fontSize: '.85rem', fontFamily: 'inherit',
                                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                    marginBottom: 10, background: '#fff'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => updateStatus(item._id, 'confirmed')}
                                    disabled={item.status === 'confirmed' || saving[item._id]}
                                    style={{
                                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                      padding: '9px 12px', borderRadius: 8, border: 'none', cursor: item.status === 'confirmed' ? 'default' : 'pointer',
                                      background: item.status === 'confirmed' ? '#d1fae5' : 'linear-gradient(135deg,#059669,#10b981)',
                                      color: item.status === 'confirmed' ? '#065f46' : '#fff',
                                      fontWeight: 700, fontSize: '.85rem', opacity: saving[item._id] ? .7 : 1,
                                    }}
                                  >
                                    {saving[item._id] ? <Loader2 size={13} className="spin-icon" /> : <CheckCircle size={14} />}
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => updateStatus(item._id, 'cancelled')}
                                    disabled={item.status === 'cancelled' || saving[item._id]}
                                    style={{
                                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                      padding: '9px 12px', borderRadius: 8, border: 'none', cursor: item.status === 'cancelled' ? 'default' : 'pointer',
                                      background: item.status === 'cancelled' ? '#fee2e2' : '#b91c1c',
                                      color: item.status === 'cancelled' ? '#991b1b' : '#fff',
                                      fontWeight: 700, fontSize: '.85rem', opacity: saving[item._id] ? .7 : 1,
                                    }}
                                  >
                                    {saving[item._id] ? <Loader2 size={13} className="spin-icon" /> : <XCircle size={14} />}
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => updateStatus(item._id, 'pending')}
                                    disabled={item.status === 'pending' || saving[item._id]}
                                    style={{
                                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                      padding: '9px 12px', borderRadius: 8,
                                      border: '1.5px solid #e5e7eb', cursor: item.status === 'pending' ? 'default' : 'pointer',
                                      background: item.status === 'pending' ? '#dbeafe' : '#f9fafb',
                                      color: item.status === 'pending' ? '#1e40af' : '#374151',
                                      fontWeight: 700, fontSize: '.85rem', opacity: saving[item._id] ? .7 : 1,
                                    }}
                                  >
                                    <Clock size={14} /> Mark Pending
                                  </button>
                                </div>
                                <p style={{ fontSize: '.74rem', color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
                                  Guest will receive an email notification on confirm or cancel.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f0f1f4', fontSize: '.8rem', color: '#9ca3af' }}>
              Showing {filtered.length} of {total} reservations
            </div>
          </>
        )}
      </div>
    </div>
  )
}