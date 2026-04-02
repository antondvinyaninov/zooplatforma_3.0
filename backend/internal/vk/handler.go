package vk

import (
    "io"
    "net/http"
    "net/url"
    "strings"
    "github.com/gin-gonic/gin"
)

// ProxyVKRequest forwards requests to VK ID service and returns the response.
// It is used to bypass CORS restrictions when the frontend runs on a different origin.
func ProxyVKRequest(c *gin.Context) {
    // Build target URL from the original request path and query.
    targetBase := "https://id.vk.ru"
    // Preserve the original request path after /api/vk/proxy
    // Example: /api/vk/proxy/vkid_sdk_get_config?app_id=123
    proxyPath := strings.TrimPrefix(c.Request.URL.Path, "/api/vk/proxy")
    targetURL, err := url.Parse(targetBase + proxyPath)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid proxy path"})
        return
    }
    // Preserve query parameters
    targetURL.RawQuery = c.Request.URL.RawQuery

    // Create new request to VK service
    req, err := http.NewRequest(c.Request.Method, targetURL.String(), c.Request.Body)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
        return
    }
    // Copy headers (except Host)
    for k, v := range c.Request.Header {
        if strings.ToLower(k) == "host" {
            continue
        }
        for _, vv := range v {
            req.Header.Add(k, vv)
        }
    }

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach VK service"})
        return
    }
    defer resp.Body.Close()

    // Copy status code
    c.Status(resp.StatusCode)
    // Copy response headers (excluding hop-by-hop headers)
    for k, v := range resp.Header {
        for _, vv := range v {
            c.Writer.Header().Add(k, vv)
        }
    }
    // Ensure CORS headers are present for our frontend
    origin := c.GetHeader("Origin")
    if origin != "" {
        c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
    }

    // Stream body to client
    io.Copy(c.Writer, resp.Body)
}
