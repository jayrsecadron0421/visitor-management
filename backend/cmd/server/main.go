package main

// Entry point for the Visitor Management API.
// Uses Gin, GORM (Postgres), environment configuration, runs SQL migrations, seeds admin,
// and starts HTTP server with routes and middleware.

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/controllers"
	"github.com/jayrsecadron0421/visitor-management/internal/middleware"
	"github.com/jayrsecadron0421/visitor-management/internal/services"
	"github.com/jayrsecadron0421/visitor-management/internal/store"
)

func main() {
	// Load .env (if present)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or could not load (that's fine for env-based config).")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load: %v", err)
	}

	// Connect to DB
	db, err := store.NewGormDB(cfg)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}

	//sqlDB, err := db.DB()
	//if err != nil {
	//	log.Fatalf("failed to get sql.DB: %v", err)
	//}

	//if err := migrations.RunMigrations(sqlDB, "./internal/models/migrations"); err != nil {
	//	log.Fatalf("migrations failed: %v", err)
	//}
	log.Println("✅ Skipping migrations (already run manually)")

	// Seed admin account (using env or fallback)
	if err := services.SeedAdmin(db, cfg); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	// Setup services
	jwtSvc := services.NewJWTService(cfg)
	emailSvc := services.NewEmailService(cfg)

	// Setup controllers (pass DB & services)
	authCtrl := controllers.NewAuthController(db, jwtSvc, emailSvc, cfg)
	visitorsCtrl := controllers.NewVisitorsController(db)
	visitsCtrl := controllers.NewVisitsController(db, emailSvc, cfg)
	reportsCtrl := controllers.NewReportsController(db)
	notifCtrl := controllers.NewNotificationsController(db)
	adminCtrl := controllers.NewAdminController(db)
	passCtrl := controllers.NewPassController(db)

	r := gin.Default()

	// CORS (open for dev; tighten in production)
	r.Use(middleware.CORSMiddleware())

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now()}) })

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Visitor Management API is running",
		})
	})

	// Public auth routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/register", authCtrl.Register)
		v1.POST("/auth/login", authCtrl.Login)
		v1.POST("/auth/forgot-password", middleware.RateLimit(5, time.Minute, authCtrl.ForgotPassword)) // example rate limit
		v1.POST("/auth/reset-password", authCtrl.ResetPassword)                                         // includes verify code
	}

	// Protected routes
	auth := v1.Group("/")
	auth.Use(middleware.AuthMiddleware(jwtSvc))
	{
		auth.GET("/users", adminCtrl.ListUsers)

		auth.GET("/me", authCtrl.Me)
		// Visitors
		auth.POST("/visitors", visitorsCtrl.CreateVisitor)
		auth.GET("/visitors", visitorsCtrl.ListVisitors)
		auth.GET("/visitors/:id", visitorsCtrl.GetVisitor)
		auth.PUT("/visitors/:id", visitorsCtrl.UpdateVisitor)

		// Admin-only delete
		auth.DELETE("/visitors/:id", middleware.RoleMiddleware("admin"), visitorsCtrl.DeleteVisitor)

		// Visits (time in/out)
		auth.POST("/visits/visitor/:visitor_id/timein", visitsCtrl.TimeIn)
		auth.POST("/visits/log/:visit_id/timeout", visitsCtrl.TimeOut)
		auth.GET("/visits", visitsCtrl.ListVisits)

		// 🔥 PASS ROUTES FOR STAFF (READ ONLY)
		auth.GET("/passes", passCtrl.ListPasses)
		auth.GET("/passes/stats", passCtrl.GetPassStats)

		// Reports
		auth.GET("/reports/daily", reportsCtrl.DailyReport)
		auth.GET("/reports/weekly", reportsCtrl.WeeklyReport)
		auth.GET("/reports/monthly", reportsCtrl.MonthlyReport)
		auth.GET("/reports/daily.csv", reportsCtrl.DailyReportCSV)

		// Notifications
		auth.GET("/notifications", notifCtrl.ListNotifications)
		auth.POST("/notifications/mark-read", notifCtrl.MarkRead)

		// Admin-only routes
		admin := auth.Group("/admin")
		admin.Use(middleware.RoleMiddleware("admin"))
		{
			// 🔹 USER MANAGEMENT (CRUD)
			admin.GET("/users", adminCtrl.ListUsers)
			admin.POST("/users", adminCtrl.CreateUser)
			admin.PUT("/users/:id", adminCtrl.UpdateUser)
			admin.DELETE("/users/:id", adminCtrl.DeleteUser)

			// 🔹 DASHBOARD STATS
			admin.GET("/users/count", adminCtrl.UserCount)
			admin.GET("/stats/visitors-today", adminCtrl.VisitorsToday)
			admin.GET("/stats/inside-now", adminCtrl.InsideNow)
			admin.GET("/stats/unread-alerts", adminCtrl.UnreadAlerts)

			// 🔹 APPOINTMENT MANAGEMENT (CRUD)
			admin.GET("/appointments", adminCtrl.ListAppointments)
			admin.POST("/appointments", adminCtrl.CreateAppointment)
			admin.GET("/appointments/:id", adminCtrl.GetAppointment)
			admin.PUT("/appointments/:id", adminCtrl.UpdateAppointment)
			admin.DELETE("/appointments/:id", adminCtrl.DeleteAppointment)

			// 🔥 NEW: Visitor Pass Management
			admin.POST("/passes/initialize", passCtrl.InitializePasses)
			admin.GET("/passes", passCtrl.ListPasses)
			admin.GET("/passes/stats", passCtrl.GetPassStats)
			admin.POST("/passes", passCtrl.CreatePass)
			admin.DELETE("/passes/:id", passCtrl.DeletePass)
			admin.POST("/passes/:id/reset", passCtrl.ResetPass)
		}
	}

	// Background goroutine: periodic checks for alerts
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for {
			<-ticker.C
			if err := services.CheckVisitAlerts(db, emailSvc, cfg); err != nil {
				log.Println("alert check error:", err)
			}
		}
	}()

	addr := fmt.Sprintf(":%d", cfg.AppPort)
	log.Printf("Starting server on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server run: %v", err)
	}
}
