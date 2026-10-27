import React from 'react'

function Avatar({ name, src, size = '', className = '', style, onClick, title }) {
  const initial = name?.trim()?.charAt(0)?.toLocaleUpperCase() || 'U'
  const classes = ['avatar', size && `avatar-${size}`, !src && 'avatar-placeholder', className]
    .filter(Boolean)
    .join(' ')

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile` : 'Profile'}
        className={classes}
        style={style}
        onClick={onClick}
        title={title || name}
      />
    )
  }

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      title={title || name}
      role="img"
      aria-label={`${name || 'User'}'s profile avatar`}
    >
      {initial}
    </div>
  )
}

export default Avatar
