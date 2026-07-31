package services

import (
	"fmt"
	"time"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/models"
	"gorm.io/gorm"
)

func CheckVisitAlerts(db *gorm.DB, emailSvc EmailService, cfg *config.Config) error {
	// find visits that are inside and have been inside longer than threshold
	threshold := cfg.AlertThresholdMinutes
	rows, err := db.Model(&models.VisitLog{}).
		Where("status = ?", "inside").
		Rows()
	if err != nil {
		return err
	}
	defer rows.Close()
	now := time.Now()
	for rows.Next() {
		var v models.VisitLog
		db.ScanRows(rows, &v)
		duration := now.Sub(v.TimeIn)
		if int(duration.Minutes()) > threshold {
			// create notification
			note := models.Notification{
				Type:           "duration_alert",
				Message:        fmt.Sprintf("Visitor %d has been inside for %d minutes", v.VisitorID, int(duration.Minutes())),
				RelatedVisitID: &v.ID,
				IsRead:         false,
			}
			db.Create(&note)

			// send email to admin (for demo)
			emailSvc.Send(cfg.AdminEmail, "Visitor duration alert", note.Message)
		}
	}
	return nil
}
