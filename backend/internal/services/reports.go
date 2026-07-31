package services

import (
	"fmt"
	"time"

	"github.com/jayrsecadron0421/visitor-management/internal/models"
	"gorm.io/gorm"
)

// ReportSummary - simplified report structure
type ReportSummary struct {
	TotalVisitors          int64
	CurrentlyInside        int64
	RepeatVisitors         int64
	AverageDurationMinutes float64
	TopReasons             []string
}

// A simple reports generator using GORM queries.
// For heavier reporting use SQL analytics queries (see README for sample SQL).
func GenerateDailyReport(db *gorm.DB, date time.Time) (*ReportSummary, error) {
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	var total int64
	if err := db.Model(&models.VisitLog{}).
		Where("time_in >= ? AND time_in < ?", start, end).
		Count(&total).Error; err != nil {
		return nil, err
	}

	var inside int64
	if err := db.Model(&models.VisitLog{}).
		Where("time_in >= ? AND time_in < ? AND status = ?", start, end, "inside").
		Count(&inside).Error; err != nil {
		return nil, err
	}

	// repeat visitors (by email)
	// naive approach: join visitors and count emails appearing >1
	var repeat int64
	if err := db.Raw(`
        SELECT COUNT(*) FROM (
            SELECT v.email, COUNT(*) c FROM visit_logs vl
            JOIN visitors v ON v.id = vl.visitor_id
            WHERE vl.time_in >= ? AND vl.time_in < ? AND v.email IS NOT NULL
            GROUP BY v.email HAVING COUNT(*) > 1
        ) t
    `, start, end).Scan(&repeat).Error; err != nil {
		return nil, err
	}

	// average duration across timed-out visits in period
	var avg float64
	if err := db.Raw(`
		SELECT COALESCE(AVG(duration_mins), 0)
		FROM visit_logs
		WHERE time_out IS NOT NULL AND time_in >= ? AND time_in < ?
	`, start, end).Scan(&avg).Error; err != nil {
		return nil, err
	}

	// top reasons (by visitors.reason)
	rows, err := db.Raw(`
        SELECT reason, COUNT(*) as c FROM visitors v
        JOIN visit_logs vl ON vl.visitor_id = v.id
        WHERE vl.time_in >= ? AND vl.time_in < ?
        GROUP BY reason ORDER BY c DESC LIMIT 5
    `, start, end).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var reasons []string
	for rows.Next() {
		var reason string
		var c int
		rows.Scan(&reason, &c)
		reasons = append(reasons, fmt.Sprintf("%s (%d)", reason, c))
	}

	return &ReportSummary{
		TotalVisitors:          total,
		CurrentlyInside:        inside,
		RepeatVisitors:         repeat,
		AverageDurationMinutes: avg,
		TopReasons:             reasons,
	}, nil
}
