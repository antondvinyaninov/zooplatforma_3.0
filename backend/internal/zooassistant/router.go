package zooassistant

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
)

const defaultOpenAIModel = "gpt-4o-mini"
const defaultDeepSeekModel = "deepseek-chat"

var greetingResponses = []string{
	"Я — Зоопомощник. Сейчас даю базовые ответы и пока еще учусь. Уже сейчас могу помочь составить или улучшить текст объявления о животном.",
	"Я — Зоопомощник. Пока работаю в базовом режиме и не все умею, но уже хорошо помогаю с текстами объявлений о животных.",
	"Я — Зоопомощник. На старте я даю базовые подсказки. Сейчас моя главная функция — помощь с текстом объявления: написать с нуля или отредактировать ваш вариант.",
	"Я — Зоопомощник. Я пока в ранней версии: отвечаю базово и постепенно развиваюсь. Прямо сейчас могу помочь с объявлением о животном.",
	"Я — Зоопомощник. Пока что у меня ограниченный функционал, но я уже умею делать главное: помогать с текстом объявления о животном.",
	"Я — Зоопомощник. Сейчас я даю базовые ответы. Могу помочь вам быстро подготовить понятный и аккуратный текст объявления о животном.",
}

const zooAssistantSystemPrompt = `Ты — Зоопомощник платформы ZooPlatforma.

Твои роли:
1) Помощь с объявлениями о животных (структура, заголовок, ясный текст, призыв к действию).
2) Базовая зооюридическая помощь (объяснение общих шагов, какие документы проверить, как действовать безопасно).
3) Общие вопросы по животным (уход, поведение, бытовые рекомендации).

Правила:
- Отвечай на русском, дружелюбно и по делу.
- Пиши простым текстом без Markdown-разметки: не используй символы типа **, #, дефисы для оформления списков и emoji.
- Если вопрос неполный, предложи короткий список недостающих данных.
- Не выдумывай факты и нормы закона. Если данных не хватает — честно скажи, что нужна проверка.
- Не ставь диагнозы и не назначай лечение. При тревожных симптомах советуй обратиться к ветеринару.
- Для юридических вопросов добавляй дисклеймер, что это не индивидуальная юридическая консультация.
- Для запросов на объявление давай готовый текст и короткий список улучшений.
- Держи ответ компактным: 3-8 предложений, без длинных вступлений.
`

type openAIChatCompletionRequest struct {
	Model       string                     `json:"model"`
	Temperature float64                    `json:"temperature,omitempty"`
	Messages    []openAIChatMessageRequest `json:"messages"`
}

type openAIChatMessageRequest struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type aiProviderConfig struct {
	name  string
	url   string
	key   string
	model string
}

type assistantChatRequest struct {
	Message          string `json:"message"`
	Mode             string `json:"mode"`
	AnnouncementType string `json:"announcement_type"`
}

func SetupRoutes(r *gin.RouterGroup, db *sql.DB, cfg *config.Config) {
	_ = cfg

	authHandler := auth.NewHandler(db, cfg)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.GET("/me", authHandler.Me)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"service": "zooassistant",
			"status":  "ok",
		})
	})

	assistant := r.Group("/assistant")
	{
		assistant.POST("/chat", func(c *gin.Context) {
			var req assistantChatRequest

			if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error":   "message is required",
				})
				return
			}

			answer, err := generateAssistantAnswer(c.Request.Context(), req)
			if err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"success": false,
					"error":   err.Error(),
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"answer":  answer,
			})
		})
	}
}

func generateAssistantAnswer(requestCtx context.Context, chatReq assistantChatRequest) (string, error) {
	userMessage := strings.TrimSpace(chatReq.Message)

	if isGreetingMessage(userMessage) {
		return greetingResponses[rand.IntN(len(greetingResponses))], nil
	}

	provider, err := resolveAIProviderConfig()
	if err != nil {
		return "", err
	}

	systemPrompt := zooAssistantSystemPrompt
	if strings.EqualFold(strings.TrimSpace(chatReq.Mode), "announcement") {
		systemPrompt = buildAnnouncementSystemPrompt(chatReq.AnnouncementType)
	}

	reqBody := openAIChatCompletionRequest{
		Model:       provider.model,
		Temperature: 0.4,
		Messages: []openAIChatMessageRequest{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role:    "user",
				Content: userMessage,
			},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("не удалось подготовить запрос к модели")
	}

	req, err := http.NewRequestWithContext(
		requestCtx,
		http.MethodPost,
		provider.url,
		bytes.NewReader(bodyBytes),
	)
	if err != nil {
		return "", fmt.Errorf("не удалось создать запрос к модели")
	}
	req.Header.Set("Authorization", "Bearer "+provider.key)
	req.Header.Set("Content-Type", "application/json")

	httpClient := &http.Client{Timeout: 45 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ошибка запроса к AI-сервису")
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("не удалось прочитать ответ AI-сервиса")
	}

	var parsed openAIChatCompletionResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return "", fmt.Errorf("не удалось разобрать ответ AI-сервиса")
	}

	if resp.StatusCode >= 400 {
		if parsed.Error != nil && parsed.Error.Message != "" {
			return "", fmt.Errorf("ошибка %s: %s", provider.name, parsed.Error.Message)
		}
		return "", fmt.Errorf("%s вернул ошибку: HTTP %d", provider.name, resp.StatusCode)
	}

	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("AI-сервис вернул пустой ответ")
	}

	answer := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if answer == "" {
		return "", fmt.Errorf("AI-сервис вернул пустое сообщение")
	}

	return answer, nil
}

func buildAnnouncementSystemPrompt(announcementType string) string {
	typeName := strings.TrimSpace(strings.ToLower(announcementType))
	if typeName == "" {
		typeName = "не указан"
	}

	return fmt.Sprintf(`Ты — Зоопомощник ZooPlatforma в режиме подготовки объявления.

Тип объявления: %s

Твоя задача:
1) Составить объявление о животном максимально понятно и по делу.
2) Если данных мало, не останавливайся: сделай черновик и отдельно перечисли, что уточнить.

Формат ответа строго такой:
ЗАГОЛОВОК:
<1 строка>

ТЕКСТ ОБЪЯВЛЕНИЯ:
<5-10 предложений, готово к публикации>

КОРОТКАЯ ВЕРСИЯ:
<2-3 предложения для соцсетей>

ЧТО ЕЩЕ УТОЧНИТЬ:
<краткий список недостающих данных>

Правила:
- Пиши на русском, без markdown-разметки.
- Без эмодзи и без лишней воды.
- Не выдумывай факты, которых нет во входных данных.
- Добавь четкий призыв к действию (куда писать/звонить).`, typeName)
}

func isGreetingMessage(text string) bool {
	clean := strings.ToLower(strings.TrimSpace(text))
	if clean == "" {
		return false
	}

	greetings := []string{
		"привет",
		"здравствуй",
		"здравствуйте",
		"добрый день",
		"добрый вечер",
		"доброе утро",
		"hello",
		"hi",
	}

	for _, greeting := range greetings {
		if strings.Contains(clean, greeting) {
			return true
		}
	}

	return false
}

func resolveAIProviderConfig() (*aiProviderConfig, error) {
	provider := strings.ToLower(strings.TrimSpace(os.Getenv("AI_PROVIDER")))
	if provider == "" {
		provider = "auto"
	}

	openAIKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	deepSeekKey := strings.TrimSpace(os.Getenv("DEEPSEEK_API_KEY"))

	switch provider {
	case "deepseek":
		if deepSeekKey == "" {
			return nil, fmt.Errorf("AI_PROVIDER=deepseek, но DEEPSEEK_API_KEY не задан")
		}
		model := strings.TrimSpace(os.Getenv("DEEPSEEK_MODEL"))
		if model == "" {
			model = defaultDeepSeekModel
		}
		return &aiProviderConfig{
			name:  "DeepSeek",
			url:   "https://api.deepseek.com/chat/completions",
			key:   deepSeekKey,
			model: model,
		}, nil

	case "openai":
		if openAIKey == "" {
			return nil, fmt.Errorf("AI_PROVIDER=openai, но OPENAI_API_KEY не задан")
		}
		model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
		if model == "" {
			model = defaultOpenAIModel
		}
		baseURL := strings.TrimSpace(os.Getenv("OPENAI_BASE_URL"))
		if baseURL == "" {
			baseURL = "https://api.openai.com/v1/chat/completions"
		}
		return &aiProviderConfig{
			name:  "OpenAI",
			url:   baseURL,
			key:   openAIKey,
			model: model,
		}, nil

	case "auto":
		// Приоритет: DeepSeek (если ключ есть), иначе OpenAI.
		if deepSeekKey != "" {
			model := strings.TrimSpace(os.Getenv("DEEPSEEK_MODEL"))
			if model == "" {
				model = defaultDeepSeekModel
			}
			return &aiProviderConfig{
				name:  "DeepSeek",
				url:   "https://api.deepseek.com/chat/completions",
				key:   deepSeekKey,
				model: model,
			}, nil
		}
		if openAIKey != "" {
			model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
			if model == "" {
				model = defaultOpenAIModel
			}
			baseURL := strings.TrimSpace(os.Getenv("OPENAI_BASE_URL"))
			if baseURL == "" {
				baseURL = "https://api.openai.com/v1/chat/completions"
			}
			return &aiProviderConfig{
				name:  "OpenAI",
				url:   baseURL,
				key:   openAIKey,
				model: model,
			}, nil
		}
		return nil, fmt.Errorf("не найден ключ AI. Укажите DEEPSEEK_API_KEY или OPENAI_API_KEY в backend/.env")

	default:
		return nil, fmt.Errorf("неизвестный AI_PROVIDER=%q. Используйте: auto, deepseek, openai", provider)
	}
}
