package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Simple in-memory rate limiter for demonstration (not distributed).
var (
	rlStore = map[string][]time.Time{} // key -> timestamps
	rlLock  = sync.Mutex{}
)

// RateLimit returns a middleware that limits calls per key per duration.
// For simplicity key is client IP.
func RateLimit(max int, window time.Duration, handler gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()
		rlLock.Lock()
		times := rlStore[ip]
		// drop old
		var fresh []time.Time
		for _, t := range times {
			if now.Sub(t) < window {
				fresh = append(fresh, t)
			}
		}
		fresh = append(fresh, now)
		rlStore[ip] = fresh
		rlLock.Unlock()

		if len(fresh) > max {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		handler(c)
	}
}
