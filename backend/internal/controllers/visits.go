package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/models"
	"github.com/jayrsecadron0421/visitor-management/internal/services"
)

type VisitsController struct {
	db    *gorm.DB
	email services.EmailService
	cfg   *config.Config
}

func NewVisitsController(db *gorm.DB, email services.EmailService, cfg *config.Config) *VisitsController {
	return &VisitsController{db: db, email: email, cfg: cfg}
}

// TimeIn - creates a new visit_log for visitor
func (v *VisitsController) TimeIn(c *gin.Context) {
	visitorIDStr := c.Param("visitor_id")
	visitorID, err := strconv.Atoi(visitorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid visitor id"})
		return
	}
	// Prevent double time-in: check if there is an 'inside' visit for same visitor
	var existing models.VisitLog
	if err := v.db.Where("visitor_id = ? AND status = ?", visitorID, "inside").First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "visitor already timed in"})
		return
	}

	hostAny, _ := c.Get("user_id")
	hostID := hostAny.(uint)

	// Use UTC for consistent database storage
	now := time.Now().UTC()

	visit := models.VisitLog{
		VisitorID:  uint(visitorID),
		TimeIn:     now,
		HostUserID: hostID,
		Status:     "inside",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := v.db.Create(&visit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create visit log"})
		return
	}
	c.JSON(http.StatusCreated, visit)
}

func (v *VisitsController) ListVisits(c *gin.Context) {

	start := c.Query("start")
	end := c.Query("end")
	visitor := c.Query("visitor")
	status := c.Query("status")
	limitStr := c.Query("limit")

	q := v.db.Model(&models.VisitLog{}).Preload("Visitor")

	if start != "" && end != "" {
		s, err1 := time.Parse("2006-01-02", start)
		e, err2 := time.Parse("2006-01-02", end)
		if err1 == nil && err2 == nil {
			q = q.Where("time_in >= ? AND time_in <= ?", s, e.Add(24*time.Hour))
		}
	}

	if visitor != "" {
		q = q.Where("visitor_id = ?", visitor)
	}

	if status != "" {
		q = q.Where("status = ?", status)
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			q = q.Limit(l)
		}
	}

	var visits []models.VisitLog
	if err := q.Order("created_at DESC").Find(&visits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch visits"})
		return
	}

	c.JSON(http.StatusOK, visits)
}

func (v *VisitsController) TimeOut(c *gin.Context) {
	visitID := c.Param("visit_id")

	// Start transaction
	tx := v.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var visit models.VisitLog
	if err := tx.First(&visit, visitID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "visit not found"})
		return
	}

	if visit.Status != "inside" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "visitor already checked out"})
		return
	}

	// Get current time in UTC
	now := time.Now().UTC()
	visit.TimeOut = &now
	visit.Status = "exited"

	// Calculate duration
	timeIn := visit.TimeIn.UTC()
	timeOut := now.UTC()
	diffSeconds := timeOut.Unix() - timeIn.Unix()

	var duration int64
	if diffSeconds <= 0 {
		duration = 1
	} else if diffSeconds < 60 {
		duration = 1
	} else {
		duration = diffSeconds / 60
	}
	visit.DurationMins = &duration

	// Save visit
	if err := tx.Save(&visit).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update visit"})
		return
	}

	// 🔥 NEW: Return the pass
	var pass models.VisitorPass
	if err := tx.Where("assigned_to_visit = ?", visit.ID).First(&pass).Error; err == nil {
		// Pass found - return it
		pass.Status = "available"
		pass.AssignedToVisit = nil
		pass.ReturnedAt = &now

		if err := tx.Save(&pass).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to return pass"})
			return
		}
	}
	// If no pass found, continue anyway (backward compatibility)

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to complete checkout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "checkout successful",
		"visitor_id":    visit.VisitorID,
		"duration_mins": duration,
		"pass_returned": pass.PassNumber,
	})
}
