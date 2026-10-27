import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import axiosInstance from '../api/axios'
import NeighborhoodMapPicker from '../components/NeighborhoodMapPicker'
import Avatar from '../components/Avatar'

function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useSelector(state => state.auth)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [tab, setTab] = useState('events')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', bio: '' })
  const [editMapLocation, setEditMapLocation] = useState(null)
  const [saving, setSaving] = useState(false)

  const isOwn = currentUser?._id === id

  useEffect(() => {
    loadProfile()
  }, [id])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get(`/users/${id}`)
      setProfile(res.data.user)
      setFollowing(res.data.user.followers?.includes(currentUser?._id))
      setEditForm({ name: res.data.user.name, bio: res.data.user.bio || '' })
      setEditMapLocation({
        neighborhood: res.data.user.neighborhood,
        lat: res.data.user.lat || null,
        lng: res.data.user.lng || null,
        displayName: res.data.user.neighborhood
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleFollow = async () => {
    try {
      if (following) {
        await axiosInstance.post(`/users/${id}/unfollow`)
        setFollowing(false)
        setProfile(p => ({ ...p, followers: p.followers.filter(f => f !== currentUser._id) }))
      } else {
        await axiosInstance.post(`/users/${id}/follow`)
        setFollowing(true)
        setProfile(p => ({ ...p, followers: [...(p.followers || []), currentUser._id] }))
      }
    } catch (err) { console.error(err) }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...editForm,
        neighborhood: editMapLocation?.neighborhood || editForm.neighborhood,
        lat: editMapLocation?.lat ?? null,
        lng: editMapLocation?.lng ?? null,
      }
      const res = await axiosInstance.put('/users/update', payload)
      setProfile(res.data.user)
      setEditing(false)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="loading-center"><div className="loading-spinner" /></div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="empty-state"><div className="empty-icon">👤</div><div className="empty-title">User not found</div></div>
      </div>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          {/* Profile Header */}
          <div className="profile-header-card">
            <div className="profile-cover" />
            <div className="profile-info">
              <div className="profile-avatar-wrap">
                <Avatar name={profile.name} src={profile.avatar} size="xl" style={{ fontSize: '2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
                {isOwn ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
                ) : (
                  <>
                    <button className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow}>
                      {following ? 'Unfollow' : '+ Follow'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/chat/${id}`)}>💬 Message</button>
                  </>
                )}
              </div>
              <div className="profile-name">{profile.name}</div>
              <div className="profile-neighborhood">📍 {profile.neighborhood}</div>
              {profile.bio && <div className="profile-bio">{profile.bio}</div>}
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-num">{profile.followers?.length || 0}</div>
                  <div className="profile-stat-label">Followers</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-num">{profile.following?.length || 0}</div>
                  <div className="profile-stat-label">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(false)}>
              <div className="modal">
                <div className="modal-header">
                  <span className="modal-title">Edit Profile</span>
                  <button className="modal-close" onClick={() => setEditing(false)}>✕</button>
                </div>
                <form onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Neighborhood</label>
                    <NeighborhoodMapPicker
                      value={editMapLocation}
                      onChange={setEditMapLocation}
                      height="260px"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-input" value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell your neighbors about yourself..." />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
