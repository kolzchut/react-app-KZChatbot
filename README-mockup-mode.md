# Mockup Mode

This project includes a mockup mode that simulates API responses during development and testing. This is useful when:

- The backend API is unavailable
- You want to develop the UI without making actual API calls
- You need consistent responses for testing

## How It Works

When mockup mode is enabled, the application starts a local server that intercepts API requests and returns predefined mock responses. The client code doesn't need to be aware of this - all API calls work as they normally would, but the responses come from the mock server instead of the real backend.

## Using Mockup Mode

### Development

To start the development server in mockup mode:

```bash
npm run dev:mock
# or
yarn dev:mock
```

### Preview Build

To preview the production build with mockup mode:

```bash
npm run preview:mock
# or
yarn preview:mock
```

### Building with Mockup Mode

If you need to build the application with mockup mode enabled:

```bash
npm run build:mock
# or
yarn build:mock
```

## Configuration

You can enable mockup mode by setting the `VITE_MODE` environment variable to `mockup`. This can be done:

1. In your `.env` file:
   ```
   VITE_MODE=mockup
   ```

2. Or directly when running a command:
   ```bash
   VITE_MODE=mockup npm run dev
   ```

## Customizing Mock Responses

The mock responses are defined in `mockup-server.js`. You can customize them to match your specific needs:

```javascript
// Example of customizing mock responses
const mockResponses = {
  '/kzchatbot/v0/question': (req) => {
    // You can use the request data to generate different responses
    const { text } = req;
    
    return {
      conversationId: 'mock-conv-' + Date.now(),
      llmResult: `You asked: "${text}". Here is a mock response.`,
      docs: [
        { url: 'https://example.com/doc1', title: 'Example Document 1' },
        { url: 'https://example.com/doc2', title: 'Example Document 2' }
      ]
    };
  },
  // Add more endpoints as needed
};
```

## Debugging

When mockup mode is active, you'll see console messages in the terminal indicating that the mockup server is running. In the browser's developer console, you'll see a message indicating that mockup mode is active.
