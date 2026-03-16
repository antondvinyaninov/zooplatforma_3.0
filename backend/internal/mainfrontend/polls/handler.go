package polls

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetPollByPostID - получить опрос для поста
func (h *Handler) GetPollByPostID(c *gin.Context) {
	postID := c.Param("post_id")

	// Получаем текущего пользователя
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	poll, err := h.getPollByPostID(postID, currentUserID)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Poll not found"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": poll})
}

// VotePoll - проголосовать в опросе
func (h *Handler) VotePoll(c *gin.Context) {
	pollID := c.Param("id")

userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		OptionIDs []int `json:"option_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	if len(req.OptionIDs) == 0 {
		c.JSON(400, gin.H{"success": false, "error": "option_ids cannot be empty"})
		return
	}

	// Получаем информацию об опросе
	var postID int
	var expiresAt sql.NullTime
	var multipleChoice bool
	var allowVoteChanges bool

	err := h.db.QueryRow(`
		SELECT post_id, expires_at, 
		       COALESCE(multiple_choice, false), 
		       COALESCE(allow_vote_changes, true)
		FROM polls 
		WHERE id = $1
	`, pollID).Scan(&postID, &expiresAt, &multipleChoice, &allowVoteChanges)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Poll not found"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Проверка что опрос не истек
	if expiresAt.Valid && expiresAt.Time.Before(time.Now()) {
		c.JSON(400, gin.H{"success": false, "error": "Poll has expired"})
		return
	}

	// Проверка множественного выбора
	if !multipleChoice && len(req.OptionIDs) > 1 {
		c.JSON(400, gin.H{"success": false, "error": "Multiple choice is not allowed"})
		return
	}

	// Проверка что пользователь еще не голосовал
	if !allowVoteChanges {
		var hasVoted bool
		h.db.QueryRow(`
			SELECT EXISTS(SELECT 1 FROM poll_votes WHERE poll_id = $1 AND user_id = $2)
		`, pollID, currentUserID).Scan(&hasVoted)

		if hasVoted {
			c.JSON(400, gin.H{"success": false, "error": "You have already voted"})
			return
		}
	}

	// Начинаем транзакцию
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer tx.Rollback()

	// Удаляем предыдущие голоса
	tx.Exec(`DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2`, pollID, currentUserID)

	// Создаем новые голоса
	for _, optionID := range req.OptionIDs {
		_, err = tx.Exec(`
			INSERT INTO poll_votes (poll_id, option_id, user_id, created_at)
			VALUES ($1, $2, $3, NOW())
		`, pollID, optionID, currentUserID)

		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create vote"})
			return
		}
	}

	// Обновляем счетчики
	tx.Exec(`
		UPDATE poll_options 
		SET votes_count = (SELECT COUNT(*) FROM poll_votes WHERE option_id = poll_options.id)
		WHERE poll_id = $1
	`, pollID)

	if err = tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	// Возвращаем обновленный опрос
	poll, err := h.getPollByPostID(strconv.Itoa(postID), currentUserID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to get updated poll"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": poll})
}

// DeleteVote - удалить голос
func (h *Handler) DeleteVote(c *gin.Context) {
	pollID := c.Param("id")

userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	// Получаем post_id
	var postID int
	err := h.db.QueryRow(`SELECT post_id FROM polls WHERE id = $1`, pollID).Scan(&postID)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Poll not found"})
		return
	}

	// Начинаем транзакцию
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer tx.Rollback()

	// Удаляем голос
	result, err := tx.Exec(`DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2`, pollID, currentUserID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Vote not found"})
		return
	}

	// Обновляем счетчики
	tx.Exec(`
		UPDATE poll_options 
		SET votes_count = (SELECT COUNT(*) FROM poll_votes WHERE option_id = poll_options.id)
		WHERE poll_id = $1
	`, pollID)

	if err = tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	// Возвращаем обновленный опрос
	poll, err := h.getPollByPostID(strconv.Itoa(postID), currentUserID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to get updated poll"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": poll})
}

func (h *Handler) getPollByPostID(postID string, userID int) (map[string]interface{}, error) {
	var pollID int
	var question string
	var multipleChoice, allowVoteChanges, isAnonymous bool
	var expiresAt sql.NullTime

	err := h.db.QueryRow(`
		SELECT id, question, 
		       COALESCE(multiple_choice, false),
		       COALESCE(allow_vote_changes, true),
		       COALESCE(is_anonymous, false),
		       expires_at
		FROM polls WHERE post_id = $1
	`, postID).Scan(&pollID, &question, &multipleChoice, &allowVoteChanges, &isAnonymous, &expiresAt)

	if err != nil {
		return nil, err
	}

	// Получаем варианты ответа
	rows, err := h.db.Query(`
		SELECT id, option_text, COALESCE(votes_count, 0)
		FROM poll_options WHERE poll_id = $1 ORDER BY id
	`, pollID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	options := []map[string]interface{}{}
	totalVotes := 0

	for rows.Next() {
		var optionID, votesCount int
		var optionText string
		rows.Scan(&optionID, &optionText, &votesCount)

		totalVotes += votesCount
		options = append(options, map[string]interface{}{
			"id":          optionID,
			"option_text": optionText,
			"votes_count": votesCount,
		})
	}

	// Подсчитываем проценты
	for i := range options {
		votesCount := options[i]["votes_count"].(int)
		if totalVotes > 0 {
			options[i]["percentage"] = float64(votesCount) / float64(totalVotes) * 100
		} else {
			options[i]["percentage"] = 0.0
		}
	}

	// Проверяем голосовал ли пользователь
	var userVoted bool
	h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM poll_votes WHERE poll_id = $1 AND user_id = $2)
	`, pollID, userID).Scan(&userVoted)

	// Получаем голоса пользователя
	userVotes := []int{}
	if userVoted {
		voteRows, _ := h.db.Query(`
			SELECT option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2
		`, pollID, userID)
		defer voteRows.Close()

		for voteRows.Next() {
			var optionID int
			voteRows.Scan(&optionID)
			userVotes = append(userVotes, optionID)
		}
	}

	// Подсчитываем уникальных проголосовавших
	var totalVoters int
	h.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = $1
	`, pollID).Scan(&totalVoters)

	poll := map[string]interface{}{
		"id":                 pollID,
		"post_id":            postID,
		"question":           question,
		"options":            options,
		"multiple_choice":    multipleChoice,
		"allow_vote_changes": allowVoteChanges,
		"is_anonymous":       isAnonymous,
		"total_voters":       totalVoters,
		"user_voted":         userVoted,
		"user_votes":         userVotes,
		"is_expired":         expiresAt.Valid && expiresAt.Time.Before(time.Now()),
	}

	if expiresAt.Valid {
		poll["expires_at"] = expiresAt.Time
	}

	return poll, nil
}
