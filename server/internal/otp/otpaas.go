package otp

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// OTPaaSProvider implements [Provider] using the OTPaaS API.
type OTPaaSProvider struct {
	host         string
	appID        string
	appNamespace string
	token        string

	client *http.Client
}

// NewOTPaaSProvider creates an [OTPaaSProvider] with the given configuration.
func NewOTPaaSProvider(host, appID, appNamespace, secret string, timeout time.Duration) *OTPaaSProvider {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(appID))

	sig := hex.EncodeToString(mac.Sum(nil))

	payload := appNamespace + ":" + appID + ":" + sig
	token := base64.StdEncoding.EncodeToString([]byte(payload))

	return &OTPaaSProvider{
		host:         host,
		appID:        appID,
		appNamespace: appNamespace,
		token:        token,

		client: &http.Client{Timeout: timeout},
	}
}

// RequestOTP implements [Provider.RequestOTP].
func (s *OTPaaSProvider) RequestOTP(ctx context.Context, email string) (string, error) {
	reqBody, err := json.Marshal(struct {
		Email string `json:"email"`
	}{
		Email: email,
	})
	if err != nil {
		return "", fmt.Errorf("otpaas: failed to marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.host+"/otp", bytes.NewReader(reqBody))
	if err != nil {
		return "", fmt.Errorf("otpaas: failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("X-App-Id", s.appID)
	req.Header.Set("X-App-Namespace", s.appNamespace)

	resp, err := s.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return "", fmt.Errorf("otpaas: request timed out: %w", err)
		}
		return "", fmt.Errorf("otpaas: failed to send request: %w", err)
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("otpaas: failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var detail struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(respBody, &detail)

		switch resp.StatusCode {
		case http.StatusBadRequest:
			if detail.Code == 2008 {
				return "", fmt.Errorf("otpaas: %w", ErrRateLimited)
			}
			return "", fmt.Errorf("otpaas: bad request (code %d): %q", detail.Code, detail.Message)
		case http.StatusUnauthorized:
			return "", fmt.Errorf("otpaas: %w", ErrUnauthorized)
		case http.StatusForbidden:
			if detail.Code == 2005 {
				return "", fmt.Errorf("otpaas: %w", ErrDomainNotAllowed)
			}
			return "", fmt.Errorf("otpaas: forbidden (code %d): %q", detail.Code, detail.Message)
		default:
			return "", fmt.Errorf("otpaas: unexpected status %d (code %d): %q", resp.StatusCode, detail.Code, detail.Message)
		}
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("otpaas: failed to unmarshal response body: %w", err)
	}

	if result.ID == "" {
		return "", errors.New("otpaas: returned empty flow id")
	}

	return result.ID, nil
}

// VerifyOTP implements [Provider.VerifyOTP].
func (s *OTPaaSProvider) VerifyOTP(ctx context.Context, flowID string, pin string) error {
	reqBody, err := json.Marshal(struct {
		PIN string `json:"pin"`
	}{
		PIN: pin,
	})
	if err != nil {
		return fmt.Errorf("otpaas: failed to marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, s.host+"/otp/"+flowID, bytes.NewReader(reqBody))
	if err != nil {
		return fmt.Errorf("otpaas: failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("X-App-Id", s.appID)
	req.Header.Set("X-App-Namespace", s.appNamespace)

	resp, err := s.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return fmt.Errorf("otpaas: request timed out: %w", err)
		}
		return fmt.Errorf("otpaas: failed to send request: %w", err)
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("otpaas: failed to read response body: %w", err)
		}

		var detail struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(respBody, &detail)

		switch resp.StatusCode {
		case http.StatusUnauthorized:
			if detail.Code == 1006 {
				return ErrInvalidPIN
			}
			return ErrUnauthorized
		case http.StatusNotFound:
			return ErrFlowExpired
		default:
			return fmt.Errorf("otpaas: unexpected status %d (code %d): %q", resp.StatusCode, detail.Code, detail.Message)
		}
	}

	return nil
}
