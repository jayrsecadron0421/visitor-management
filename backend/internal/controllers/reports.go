package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/services"
)

type ReportsController struct {
	db *gorm.DB
}

func NewReportsController(db *gorm.DB) *ReportsController {
	return &ReportsController{db: db}
}

func (r *ReportsController) DailyReport(c *gin.Context) {
	dateStr := c.Query("date")
	var d time.Time
	var err error
	if dateStr == "" {
		d = time.Now()
	} else {
		d, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
			return
		}
	}
	rep, err := services.GenerateDailyReport(r.db, d)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rep)
}

func (r *ReportsController) WeeklyReport(c *gin.Context) {
	start := c.Query("start")
	if start == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start required"})
		return
	}
	s, err := time.Parse("2006-01-02", start)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
		return
	}
	// naive weekly aggregation: call daily multiple times or write dedicated SQL
	var totals []interface{}
	for i := 0; i < 7; i++ {
		d := s.AddDate(0, 0, i)
		rep, _ := services.GenerateDailyReport(r.db, d)
		totals = append(totals, gin.H{"date": d.Format("2006-01-02"), "report": rep})
	}
	c.JSON(http.StatusOK, totals)
}

func (r *ReportsController) MonthlyReport(c *gin.Context) {
	year := c.Query("year")
	month := c.Query("month")
	if year == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year and month required"})
		return
	}
	y, _ := strconv.Atoi(year)
	m, _ := strconv.Atoi(month)
	// iterate days in month
	var totals []interface{}
	loc := time.UTC
	first := time.Date(y, time.Month(m), 1, 0, 0, 0, 0, loc)
	for d := first; d.Month() == first.Month(); d = d.AddDate(0, 0, 1) {
		rep, _ := services.GenerateDailyReport(r.db, d)
		totals = append(totals, gin.H{"date": d.Format("2006-01-02"), "report": rep})
	}
	c.JSON(http.StatusOK, totals)
}

func (r *ReportsController) DailyReportCSV(c *gin.Context) {
	// use daily report, but return CSV format
	dateStr := c.Query("date")
	d := time.Now()
	if dateStr != "" {
		t, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			d = t
		}
	}
	rep, err := services.GenerateDailyReport(r.db, d)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=report.csv")
	csv := "metric,value\n"
	csv += "total_visitors," + fmt.Sprintf("%d", rep.TotalVisitors) + "\n"
	csv += "currently_inside," + fmt.Sprintf("%d", rep.CurrentlyInside) + "\n"
	csv += "repeat_visitors," + fmt.Sprintf("%d", rep.RepeatVisitors) + "\n"
	csv += "avg_duration," + fmt.Sprintf("%.2f", rep.AverageDurationMinutes) + "\n"
	csv += "top_reasons,\"" + strings.Join(rep.TopReasons, ";") + "\"\n"
	c.String(200, csv)
}
