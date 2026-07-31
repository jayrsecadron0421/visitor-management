package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/models"
)

type AdminController struct {
	db *gorm.DB
}

func NewAdminController(db *gorm.DB) *AdminController {
	return &AdminController{db: db}
}

// ✅ THIS IS WHERE UserCount GOES
func (a *AdminController) UserCount(c *gin.Context) {
	var count int64

	if err := a.db.Model(&models.User{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to count users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total": count,
	})
}

func (a *AdminController) VisitorsToday(c *gin.Context) {
	start := time.Now().Truncate(24 * time.Hour)
	end := start.Add(24 * time.Hour)

	var count int64
	if err := a.db.Model(&models.VisitLog{}).
		Where("time_in >= ? AND time_in < ?", start, end).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count visitors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total": count})
}

func (a *AdminController) InsideNow(c *gin.Context) {
	var count int64

	if err := a.db.Model(&models.VisitLog{}).
		Where("status = ?", "inside").
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count inside visitors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total": count})
}

func (a *AdminController) UnreadAlerts(c *gin.Context) {
	var count int64

	if err := a.db.Model(&models.Notification{}).
		Where("is_read = false").
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total": count})
}

func (a *AdminController) ListUsers(c *gin.Context) {
	var users []models.User
	if err := a.db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (a *AdminController) CreateUser(c *gin.Context) {
	var input struct {
		FullName    string `json:"full_name" binding:"required"`
		Email       string `json:"email" binding:"required,email"`
		PhoneNumber string `json:"phone_number"`
		Password    string `json:"password" binding:"required,min=6"`
		Role        string `json:"role" binding:"required"`
		IsActive    bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload: " + err.Error()})
		return
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "staff": true}
	if !validRoles[strings.ToLower(input.Role)] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role. Must be: admin or staff"})
		return
	}

	// Check if email already exists
	var count int64
	if err := a.db.Model(&models.User{}).Where("email = ?", strings.ToLower(input.Email)).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check email"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		FullName:     input.FullName,
		Email:        strings.ToLower(input.Email),
		PhoneNumber:  input.PhoneNumber,
		PasswordHash: string(hashedPassword),
		Role:         strings.ToLower(input.Role),
		IsActive:     input.IsActive,
	}

	if err := a.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (a *AdminController) UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := a.db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var input struct {
		FullName    string  `json:"full_name"`
		PhoneNumber string  `json:"phone_number"`
		Password    *string `json:"password"` // Optional - only update if provided
		Role        string  `json:"role"`
		IsActive    bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Validate role if provided
	if input.Role != "" {
		validRoles := map[string]bool{"admin": true, "user": true, "staff": true}
		if !validRoles[strings.ToLower(input.Role)] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role. Must be: admin, user, or staff"})
			return
		}
		user.Role = strings.ToLower(input.Role)
	}

	// Update fields
	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.PhoneNumber != "" {
		user.PhoneNumber = input.PhoneNumber
	}
	user.IsActive = input.IsActive

	// Update password if provided
	if input.Password != nil && *input.Password != "" {
		if len(*input.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		user.PasswordHash = string(hashedPassword)
	}

	if err := a.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (a *AdminController) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	// Prevent deleting yourself (optional safety check)
	userID, exists := c.Get("user_id")
	if exists && userID.(uint) == parseUint(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete your own account"})
		return
	}

	if err := a.db.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

// Helper function to parse uint
func parseUint(s string) uint {
	var id uint
	_, _ = fmt.Sscanf(s, "%d", &id)
	return id
}

// ListAppointments returns all appointments
func (a *AdminController) ListAppointments(c *gin.Context) {
	var appointments []models.Appointment

	// Order by scheduled time descending (newest first)
	if err := a.db.Order("scheduled_time DESC").Find(&appointments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch appointments"})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

// CreateAppointment creates a new appointment
func (a *AdminController) CreateAppointment(c *gin.Context) {
	var appointment models.Appointment

	if err := c.ShouldBindJSON(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Set default status if not provided
	if appointment.Status == "" {
		appointment.Status = "pending"
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if exists {
		appointment.CreatedByID = userID.(uint)
	}

	if err := a.db.Create(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create appointment"})
		return
	}

	c.JSON(http.StatusCreated, appointment)
}

// UpdateAppointment updates an existing appointment
func (a *AdminController) UpdateAppointment(c *gin.Context) {
	id := c.Param("id")

	var appointment models.Appointment
	if err := a.db.First(&appointment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "appointment not found"})
		return
	}

	var input struct {
		VisitorName   string    `json:"visitor_name"`
		VisitorEmail  *string   `json:"visitor_email"`
		VisitorPhone  string    `json:"visitor_phone"`
		Company       *string   `json:"company"`
		ScheduledTime time.Time `json:"scheduled_time"`
		Purpose       string    `json:"purpose"`
		HostUserID    uint      `json:"host_user_id"`
		HostName      string    `json:"host_name"`
		Status        string    `json:"status"`
		Notes         *string   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Update fields
	appointment.VisitorName = input.VisitorName
	appointment.VisitorEmail = input.VisitorEmail
	appointment.VisitorPhone = input.VisitorPhone
	appointment.Company = input.Company
	appointment.ScheduledTime = input.ScheduledTime
	appointment.Purpose = input.Purpose
	appointment.HostUserID = input.HostUserID
	appointment.HostName = input.HostName
	appointment.Status = input.Status
	appointment.Notes = input.Notes

	if err := a.db.Save(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update appointment"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

// DeleteAppointment deletes an appointment
func (a *AdminController) DeleteAppointment(c *gin.Context) {
	id := c.Param("id")

	if err := a.db.Delete(&models.Appointment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete appointment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "appointment deleted"})
}

// GetAppointment returns a single appointment by ID
func (a *AdminController) GetAppointment(c *gin.Context) {
	id := c.Param("id")

	var appointment models.Appointment
	if err := a.db.First(&appointment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "appointment not found"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}
