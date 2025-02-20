// mockup-server.ts
import express from 'express';
import cors from 'cors';
import http from 'http';

interface MockupServer {
  url: string;
  close: () => Promise<void>;
}

export async function startMockupServer(): Promise<MockupServer> {
  // Sample responses
  const mockResponses: Record<string, (req: any) => any> = {
    '/kzchatbot/v0/question': (req) => {
      return {
        conversationId: 'mock-conv-' + Date.now(),
        llmResult: 'This is a mock response from the chatbot API.',
        docs: [
          { url: 'https://example.com/doc1', title: 'Example Document 1' },
          { url: 'https://example.com/doc2', title: 'Example Document 2' }
        ]
      };
    },
    '/kzchatbot/v0/rate': () => {
      return {
        success: true,
        message: 'Rating received successfully'
      };
    }
  };

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Log all requests to help with debugging
  app.use((req, res, next) => {
    console.log(`🔶 [Mockup Server] ${req.method} ${req.url}`);
    next();
  });

  // Add route handlers for mock endpoints with rest.php prefix
  Object.keys(mockResponses).forEach(endpoint => {
    // Handle both with and without rest.php prefix
    const routes = [
      `/rest.php${endpoint}`,  // With prefix
      endpoint                 // Without prefix
    ];
    
    routes.forEach(route => {
      app.post(route, (req, res) => {
        try {
          console.log(`🔶 [Mockup Server] Handling request to ${route}`);
          console.log(`🔶 [Mockup Server] Request body:`, req.body);
          
          const response = mockResponses[endpoint](req.body);
          
          // Add artificial delay to simulate network request
          setTimeout(() => {
            res.status(200).json(response);
          }, 600);
        } catch (err) {
          console.error(`🔶 [Mockup Server] Error:`, err);
          res.status(500).json({ error: 'Server error' });
        }
      });
    });
  });

  // Create HTTP server
  const server = http.createServer(app);
  
  // Start server on a free port
  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      const port = address && typeof address !== 'string' ? address.port : 3001;
      const url = `http://localhost:${port}`;
      
      console.log(`🔶 Mockup server running at ${url}`);
      console.log(`🔶 Routes available:`);
      Object.keys(mockResponses).forEach(endpoint => {
        console.log(`🔶   - POST ${url}/rest.php${endpoint}`);
        console.log(`🔶   - POST ${url}${endpoint}`);
      });
      
      resolve({
        url,
        close: async () => {
          return new Promise((resolve, reject) => {
            server.close((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
      });
    });
  });
}
