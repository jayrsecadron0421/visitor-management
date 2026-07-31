package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RoleMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, ok := c.Get("user_role")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "role not found"})
			return
		}
		if role.(string) != requiredRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}
		c.Next()
	}
}
