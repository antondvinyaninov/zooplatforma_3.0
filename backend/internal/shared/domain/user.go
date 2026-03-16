package domain

import "time"

type User struct {
	ID                int        `json:"id"`
	Name              string     `json:"name"`
	LastName          *string    `json:"last_name,omitempty"`
	Email             string     `json:"email"`
	PasswordHash      string     `json:"-"`
	Bio               *string    `json:"bio,omitempty"`
	Phone             *string    `json:"phone,omitempty"`
	Location          *string    `json:"location,omitempty"`
	Avatar            *string    `json:"avatar,omitempty"`
	CoverPhoto        *string    `json:"cover_photo,omitempty"`
	ProfileVisibility string     `json:"profile_visibility"`
	ShowPhone         string     `json:"show_phone"`
	ShowEmail         string     `json:"show_email"`
	AllowMessages     string     `json:"allow_messages"`
	ShowOnline        string     `json:"show_online"`
	Verified          bool       `json:"verified"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	LastSeen          *time.Time `json:"last_seen,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}
