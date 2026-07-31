package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/models"
)

type VisitorsController struct {
	db *gorm.DB
}

func NewVisitorsController(db *gorm.DB) *VisitorsController {
	return &VisitorsController{db: db}
}

// CreateVisitor - NOW with auto time-in and pass assignment
func (v *VisitorsController) CreateVisitor(c *gin.Context) {

	var input struct {
		FullName     string  `json:"full_name" binding:"required"`
		Email        *string `json:"email"`
		PhoneNumber  string  `json:"phone_number" binding:"required"`
		Company      *string `json:"company"`
		Reason       string  `json:"reason" binding:"required"`
		VisitingName string  `json:"visiting_name" binding:"required"`
		IsActive     bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Get logged in receptionist/admin
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	visitor := models.Visitor{
		FullName:        input.FullName,
		Email:           input.Email,
		PhoneNumber:     input.PhoneNumber,
		Company:         input.Company,
		Reason:          input.Reason,
		VisitingName:    input.VisitingName, // 🔥 SAVE THIS
		IsActive:        input.IsActive,
		CreatedByUserID: userID.(uint),
	}

	tx := v.db.Begin()

	if err := tx.Create(&visitor).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create visitor"})
		return
	}

	// Find available pass
	var pass models.VisitorPass
	if err := tx.Where("status = ?", "available").
		Order("pass_number ASC").
		First(&pass).Error; err != nil {

		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "no available passes",
		})
		return
	}

	now := time.Now().UTC()

	visit := models.VisitLog{
		VisitorID:  visitor.ID,
		TimeIn:     now,
		HostUserID: userID.(uint), // optional: receptionist as recorder
		Status:     "inside",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := tx.Create(&visit).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create visit"})
		return
	}

	pass.Status = "borrowed"
	pass.AssignedToVisit = &visit.ID
	pass.BorrowedAt = &now

	if err := tx.Save(&pass).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign pass"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"visitor":     visitor,
		"visit":       visit,
		"pass_number": pass.PassNumber,
	})
}

// ListVisitors - existing method (no changes needed)
func (v *VisitorsController) ListVisitors(c *gin.Context) {
	var visitors []models.Visitor
	if err := v.db.Find(&visitors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch visitors"})
		return
	}
	c.JSON(http.StatusOK, visitors)
}

// GetVisitor - existing method (no changes needed)
func (v *VisitorsController) GetVisitor(c *gin.Context) {
	id := c.Param("id")
	var visitor models.Visitor
	if err := v.db.First(&visitor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "visitor not found"})
		return
	}
	c.JSON(http.StatusOK, visitor)
}

// UpdateVisitor - existing method (no changes needed)
func (v *VisitorsController) UpdateVisitor(c *gin.Context) {
	id := c.Param("id")
	var visitor models.Visitor
	if err := v.db.First(&visitor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "visitor not found"})
		return
	}

	var input struct {
		FullName    string  `json:"full_name"`
		Email       *string `json:"email"`
		PhoneNumber string  `json:"phone_number"`
		Company     *string `json:"company"`
		Reason      string  `json:"reason"`
		IsActive    bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	visitor.FullName = input.FullName
	visitor.Email = input.Email
	visitor.PhoneNumber = input.PhoneNumber
	visitor.Company = input.Company
	visitor.Reason = input.Reason
	visitor.IsActive = input.IsActive

	if err := v.db.Save(&visitor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update visitor"})
		return
	}

	c.JSON(http.StatusOK, visitor)
}

// DeleteVisitor - existing method (no changes needed)
func (v *VisitorsController) DeleteVisitor(c *gin.Context) {
	id := c.Param("id")
	if err := v.db.Delete(&models.Visitor{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete visitor"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "visitor deleted"})
}
