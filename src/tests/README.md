# Analytics Testing Suite

This directory contains comprehensive tests for the enhanced analytics functionality using the **co-located testing pattern** (industry best practice).

## Overview

The analytics system now tracks user interactions with granular source information to differentiate between:
- **embed** - On-page widget interactions
- **popup** - Main chatbot interface interactions  
- **button** - Chat opened via button click
- **auto-opened** - Chat auto-opened on page load

## Test Structure (Co-located Pattern)

### ✅ Core Analytics Tests (Co-located)
- **`src/lib/__tests__/analytics.test.ts`** - Unit tests for the `pushAnalyticsEvent` function
- **`src/components/chatButton/__tests__/ChatButton.analytics.test.tsx`** - Button analytics tests
- **`src/components/chatArea/__tests__/ChatArea.analytics.test.tsx`** - Embed widget analytics tests  
- **`src/components/chatbot/__tests__/Chatbot.analytics.test.tsx`** - Main chatbot analytics tests

### ✅ Integration Tests (Centralized)
- **`src/tests/__tests__/analytics-simple.test.ts`** - Simple verification of all requirements
- **`src/tests/__tests__/analytics-demo.test.ts`** - Complete user journey demonstrations
- **`src/tests/__tests__/analytics-integration.test.tsx`** - End-to-end integration tests

## Best Practice: Co-located vs Centralized

**Co-located tests** (`__tests__` folders) are used for:
- ✅ Unit tests that belong to specific components/modules
- ✅ Tests that move with the code when refactoring
- ✅ Component-specific analytics behavior

**Centralized tests** (`src/tests/`) are used for:
- ✅ Integration tests that span multiple components
- ✅ Demo and verification tests
- ✅ Cross-cutting concerns testing

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --run src/test/analytics-simple.test.ts

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test
```

## Analytics Events Tracked

### `opened` Event
Tracks when the chatbot is opened with source information:
- `source: "button"` - Opened via chat button
- `source: "embed"` - Opened via embed widget submission
- `source: "auto-opened"` - Auto-opened on page load

### `question_asked` Event  
Tracks when questions are submitted with source information:
- `source: "popup"` - Question from main chatbot interface
- `source: "embed"` - Question from embed widget

### `closed_unused` Event
Tracks when chatbot is closed without any questions being asked.
No source parameter as this is a behavioral event.

### Other Events
- `answer_received` - When successful response is received
- `error_received` - When API errors occur (includes error details)

## Test Configuration

### Setup Files
- **`setup.ts`** - Global test setup with mocks and environment configuration
- **`vitest.config.ts`** - Vitest configuration with path aliases

### Key Features
- Global window.dataLayer mock
- KZChatbotConfig mock with realistic data  
- Fetch API mocking for testing API interactions
- React Testing Library integration
- Component mocking for isolation

## Example Usage

```typescript
// Track button click
pushAnalyticsEvent('opened', null, 'button')

// Track embed widget question
pushAnalyticsEvent('question_asked', null, 'embed')

// Track unused closure
pushAnalyticsEvent('closed_unused')

// Verify events in tests
expect(window.dataLayer).toContainEqual({
  event: 'chatbot',
  event_action: 'opened',
  event_label: null,
  source: 'button'
})
```

## Backward Compatibility

All existing analytics calls continue to work without modification:
```typescript
pushAnalyticsEvent('custom_event') // Works as before
pushAnalyticsEvent('custom_event', 'label') // Works as before
pushAnalyticsEvent('custom_event', 'label', 'source') // New feature
```

## Debugging

To see analytics events in tests, check `window.dataLayer`:
```typescript
console.log('Analytics events:', window.dataLayer)
```

The demo test (`analytics-demo.test.ts`) provides detailed output showing exactly what events are tracked for different user journeys.