package models

import (
	"time"
)

// User represents account in the system.
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	FullName     string    `gorm:"size:255;not null" json:"full_name"`
	Email        string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	PhoneNumber  string    `gorm:"size:30" json:"phone_number"`
	Birthday     time.Time `json:"birthday"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         string    `gorm:"size:50;not null;default:user" json:"role"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Visitor represents a visitor record.
type Visitor struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	FullName        string    `gorm:"size:255;not null" json:"full_name"`
	Email           *string   `gorm:"size:255" json:"email,omitempty"`
	PhoneNumber     string    `gorm:"size:30" json:"phone_number"`
	Company         *string   `gorm:"size:255" json:"company,omitempty"`
	Reason          string    `gorm:"size:1024" json:"reason"`
	VisitingName    string    `gorm:"size:255;not null" json:"visiting_name"`
	CreatedByUserID uint      `json:"created_by_user_id"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// VisitLog tracks time-in/out
type VisitLog struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	VisitorID    uint       `json:"visitor_id"`
	Visitor      Visitor    `gorm:"foreignKey:VisitorID" json:"visitor"`
	TimeIn       time.Time  `json:"time_in"`
	TimeOut      *time.Time `json:"time_out,omitempty"`
	DurationMins *int64     `json:"duration_minutes,omitempty"`
	HostUserID   uint       `json:"host_user_id"`
	Status       string     `gorm:"size:50;default:'inside'" json:"status"` // inside, exited
	Notes        *string    `gorm:"size:1024" json:"notes,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Notification is an in-system notification
type Notification struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Type           string    `gorm:"size:100" json:"type"`
	Message        string    `gorm:"size:1024" json:"message"`
	TargetUserID   *uint     `json:"target_user_id,omitempty"` // nil => admin broadcast
	RelatedVisitID *uint     `json:"related_visit_id,omitempty"`
	IsRead         bool      `gorm:"default:false" json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// PasswordResetCode - stores 6-digit code for forgot password flow
type PasswordResetCode struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"size:255;index;not null"`
	Code      string    `gorm:"size:10;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	Used      bool      `gorm:"default:false"`
	CreatedAt time.Time
}

// Appointment represents a scheduled visitor appointment
type Appointment struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	VisitorID     uint      `json:"visitor_id"`
	VisitorName   string    `gorm:"size:255;not null" json:"visitor_name"`
	VisitorEmail  *string   `gorm:"size:255" json:"visitor_email,omitempty"`
	VisitorPhone  string    `gorm:"size:30" json:"visitor_phone"`
	Company       *string   `gorm:"size:255" json:"company,omitempty"`
	ScheduledTime time.Time `gorm:"not null" json:"scheduled_time"`
	Purpose       string    `gorm:"size:1024;not null" json:"purpose"`
	HostUserID    uint      `json:"host_user_id"`
	HostName      string    `gorm:"size:255" json:"host_name"`
	Status        string    `gorm:"size:50;not null;default:'pending'" json:"status"` // pending, confirmed, cancelled, completed
	Notes         *string   `gorm:"size:1024" json:"notes,omitempty"`
	CreatedByID   uint      `json:"created_by_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// VisitorPass represents a physical visitor pass (1-1000)
type VisitorPass struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	PassNumber      int        `gorm:"uniqueIndex;not null" json:"pass_number"`
	Status          string     `gorm:"size:50;not null;default:'available'" json:"status"`
	AssignedToVisit *uint      `gorm:"index" json:"assigned_to_visit,omitempty"`
	BorrowedAt      *time.Time `json:"borrowed_at,omitempty"`
	ReturnedAt      *time.Time `json:"returned_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
