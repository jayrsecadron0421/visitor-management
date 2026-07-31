package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/models"
)

type PassController struct {
	db *gorm.DB
}

func NewPassController(db *gorm.DB) *PassController {
	return &PassController{db: db}
}

// InitializePasses creates passes 1-1000 if they don't exist
func (p *PassController) InitializePasses(c *gin.Context) {
	var count int64
	if err := p.db.Model(&models.VisitorPass{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check passes"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusOK, gin.H{"message": "passes already initialized", "count": count})
		return
	}

	// Create passes 1-1000
	passes := make([]models.VisitorPass, 1000)
	for i := 0; i < 1000; i++ {
		passes[i] = models.VisitorPass{
			PassNumber: i + 1,
			Status:     "available",
		}
	}

	if err := p.db.Create(&passes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create passes"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "initialized 1000 passes successfully"})
}

// ListPasses returns all passes with their status
func (p *PassController) ListPasses(c *gin.Context) {
	status := c.Query("status") // Filter by status if provided

	q := p.db.Model(&models.VisitorPass{}).Order("pass_number ASC")

	if status != "" {
		q = q.Where("status = ?", status)
	}

	var passes []models.VisitorPass
	if err := q.Find(&passes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch passes"})
		return
	}

	c.JSON(http.StatusOK, passes)
}

// GetPassStats returns statistics about passes
func (p *PassController) GetPassStats(c *gin.Context) {
	var total, available, borrowed int64

	p.db.Model(&models.VisitorPass{}).Count(&total)
	p.db.Model(&models.VisitorPass{}).Where("status = ?", "available").Count(&available)
	p.db.Model(&models.VisitorPass{}).Where("status = ?", "borrowed").Count(&borrowed)

	c.JSON(http.StatusOK, gin.H{
		"total":     total,
		"available": available,
		"borrowed":  borrowed,
	})
}

// CreatePass manually creates a new pass (for adding specific numbers outside 1-1000)
func (p *PassController) CreatePass(c *gin.Context) {
	var input struct {
		PassNumber int `json:"pass_number" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Check if pass number already exists
	var existing models.VisitorPass
	if err := p.db.Where("pass_number = ?", input.PassNumber).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "pass number already exists"})
		return
	}

	pass := models.VisitorPass{
		PassNumber: input.PassNumber,
		Status:     "available",
	}

	if err := p.db.Create(&pass).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create pass"})
		return
	}

	c.JSON(http.StatusCreated, pass)
}

// DeletePass removes a pass (only if available)
func (p *PassController) DeletePass(c *gin.Context) {
	id := c.Param("id")

	var pass models.VisitorPass
	if err := p.db.First(&pass, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pass not found"})
		return
	}

	if pass.Status == "borrowed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete borrowed pass"})
		return
	}

	if err := p.db.Delete(&pass).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete pass"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "pass deleted"})
}

// ResetPass manually marks a pass as available (admin override)
func (p *PassController) ResetPass(c *gin.Context) {
	id := c.Param("id")

	var pass models.VisitorPass
	if err := p.db.First(&pass, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pass not found"})
		return
	}

	pass.Status = "available"
	pass.AssignedToVisit = nil
	pass.BorrowedAt = nil

	if err := p.db.Save(&pass).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reset pass"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "pass reset to available", "pass": pass})
}
