# Sportswriter AI

A Next.js application for collecting sports articles, fine-tuning AI models, and generating sports content.

## Features

- **Article Extraction**: Paste article URLs to automatically extract title, body, author, and publish date
- **Training Data Management**: Save extracted articles for model training
- **Fine-Tuning**: Format training samples into JSONL for OpenAI fine-tuning
- **Content Generation**: Generate sports articles using your fine-tuned model

## Technology Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **OpenAI API** for content generation
- **Pino** for structured logging
- **React Hot Toast** for user notifications
- **Axios & Cheerio** for web scraping

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- OpenAI API key
- (Optional) Fine-tuned OpenAI model

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment configuration:

```bash
cp .env.example .env
```

4. Configure your `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_FINETUNED_MODEL=ft:gpt-3.5-turbo:yourname:sportswriter:abc123
LOG_LEVEL=info
NODE_ENV=development
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Application Structure

```
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with error boundaries
│   ├── page.tsx                 # Article extraction page
│   ├── generate/                # Content generation page
│   ├── upload/                  # Training data upload page
│   ├── error.tsx                # Page-level error handler
│   ├── global-error.tsx         # Global error handler
│   ├── EnhancedErrorBoundary.tsx # React error boundary
│   ├── ToastProvider.tsx        # Toast notification provider
│   └── MonitoringProvider.tsx   # Monitoring initialization
├── pages/api/                   # API routes
│   ├── extract-article.ts       # Article scraping endpoint
│   ├── save-article.ts          # Save to training data
│   ├── fine-tune.ts             # Format training samples
│   ├── generate.ts              # Generate content with AI
│   └── health.ts                # Health check endpoint
├── lib/                         # Shared utilities
│   ├── logger.ts                # Structured logging with Pino
│   ├── errors.ts                # Error classes and handlers
│   ├── apiMiddleware.ts         # API route middleware
│   ├── correlation.ts           # Correlation ID utilities
│   ├── clientLogger.ts          # Client-side logging and toasts
│   ├── monitoring.ts            # Monitoring integration
│   ├── openai.ts                # OpenAI client configuration
│   └── formatSamples.ts         # Training data formatter
└── training-data.json           # Stored training articles
```

## Logging & Observability

This application includes comprehensive logging and error handling. See [LOGGING.md](./LOGGING.md) for detailed documentation.

### Key Features

- **Structured Logging**: JSON logs in production, pretty-printed in development
- **Correlation IDs**: Track requests across the entire system
- **Error Boundaries**: Graceful error handling with user-friendly UI
- **Toast Notifications**: Automatic user feedback for API calls
- **Monitoring Ready**: Placeholder integration for Sentry, DataDog, etc.

### Quick Examples

#### Server-Side Logging

```typescript
import { withApiMiddleware } from '@/lib/apiMiddleware';

export default withApiMiddleware(async (req, res, context) => {
  const { logger, correlationId } = context;
  
  logger.info({ userId: req.body.userId }, 'Processing request');
  
  // Your logic here
  
  res.status(200).json({ success: true });
});
```

#### Client-Side Error Handling

```typescript
import { fetchWithErrorHandling, ClientLogger } from '@/lib/clientLogger';

try {
  const data = await fetchWithErrorHandling('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  ClientLogger.success('Operation completed!');
} catch (error) {
  // Error toast shown automatically
}
```

## API Endpoints

### POST `/api/extract-article`

Extract article content from a URL.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "title": "Article Title",
  "body": "Article content...",
  "author": "Author Name",
  "publishDate": "2024-01-01"
}
```

### POST `/api/save-article`

Save an article to the training data.

**Request:**
```json
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "body": "Article content...",
  "author": "Author Name",
  "publishDate": "2024-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "totalEntries": 42
}
```

### POST `/api/fine-tune`

Format training samples into JSONL.

**Request:**
```json
{
  "samples": [
    {
      "prompt": "Write about Duke vs UNC",
      "response": "Duke defeated UNC..."
    }
  ]
}
```

**Response:**
```json
{
  "message": "Training data formatted successfully",
  "path": "/path/to/training.jsonl",
  "sampleCount": 1
}
```

### POST `/api/generate`

Generate content using the fine-tuned model.

**Request:**
```json
{
  "prompt": "Write a recap of the Lakers game"
}
```

**Response:**
```json
{
  "content": "The Los Angeles Lakers...",
  "metadata": {
    "model": "ft:gpt-3.5-turbo:...",
    "tokensUsed": 245,
    "duration": 1234
  }
}
```

### GET `/api/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "correlationId": "req_1234567890_abc123"
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "correlationId": "req_1234567890_abc123"
  }
}
```

Error codes include:
- `VALIDATION_ERROR` - Invalid input (400)
- `UNAUTHORIZED` - Authentication required (401)
- `NOT_FOUND` - Resource not found (404)
- `EXTERNAL_SERVICE_ERROR` - Third-party service failure (502)
- `INTERNAL_ERROR` - Unexpected server error (500)

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `OPENAI_FINETUNED_MODEL` | Fine-tuned model ID | No | `ft:gpt-3.5-turbo:yourname:sportswriter:abc123` |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No | `info` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `MONITORING_DSN` | Server-side monitoring DSN | No | - |
| `NEXT_PUBLIC_MONITORING_DSN` | Client-side monitoring DSN | No | - |

## Monitoring Integration

To integrate with external monitoring services (Sentry, DataDog, LogRocket, etc.):

1. Set the `MONITORING_DSN` environment variable
2. Implement the monitoring service SDK in `lib/monitoring.ts`
3. Errors will automatically be captured and sent to your monitoring service

Example with Sentry:

```bash
npm install @sentry/node @sentry/nextjs
```

Then configure in `lib/monitoring.ts`.

## Development Tips

### Viewing Logs

Development logs are pretty-printed to the console. Production logs are JSON for easy parsing.

To change log level:
```bash
LOG_LEVEL=debug npm run dev
```

### Testing Error Handling

Visit these pages to test error boundaries:
- Page errors: Throw an error in a component
- API errors: Send invalid data to any endpoint
- Network errors: Disconnect internet while making requests

### Adding New API Routes

Always use the middleware wrapper:

```typescript
import { withApiMiddleware } from '@/lib/apiMiddleware';
import { ValidationError } from '@/lib/errors';

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;
  
  if (!req.body.field) {
    throw new ValidationError('Field is required');
  }
  
  logger.info('Processing request');
  
  // Your logic
  
  res.status(200).json({ success: true });
});
```

## License

ISC

## Contributing

Contributions are welcome! Please ensure your code:
- Passes TypeScript checks (`npm run build`)
- Uses the structured logging system
- Includes proper error handling
- Has correlation IDs in logs
