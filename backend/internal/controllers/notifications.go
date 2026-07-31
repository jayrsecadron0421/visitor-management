package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/models"
)

type NotificationsController struct {
	db *gorm.DB
}

func NewNotificationsController(db *gorm.DB) *NotificationsController {
	return &NotificationsController{db: db}
}

func (n *NotificationsController) ListNotifications(c *gin.Context) {
	uidAny, _ := c.Get("user_id")
	uid := uidAny.(uint)
	var notes []models.Notification
	n.db.Where("target_user_id IS NULL OR target_user_id = ?", uid).Order("created_at desc").Find(&notes)
	c.JSON(http.StatusOK, notes)
}

type markReadRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

func (n *NotificationsController) MarkRead(c *gin.Context) {
	var req markReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	now := time.Now()
	n.db.Model(&models.Notification{}).Where("id IN ?", req.IDs).Updates(map[string]interface{}{"is_read": true, "updated_at": now})
	c.JSON(http.StatusOK, gin.H{"message": "marked"})
}
