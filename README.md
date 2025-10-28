# Bilibili Actor (TypeScript)

A TypeScript-based Apify Actor for scraping trending videos from Bilibili, capturing youth/fandom/meme culture trends.

## Features

- **TypeScript Support**: Full type safety and IntelliSense support
- **Stealth Scraping**: Advanced anti-detection measures
- **Concurrent Processing**: Configurable concurrency for efficient scraping
- **Rich Data Extraction**: Comprehensive video metadata including engagement metrics
- **Error Handling**: Robust error handling and retry mechanisms

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Commands

```bash
# Start development server
npm run start:dev

# Build TypeScript
npm run build

# Run production build
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format

# Run with input file
npm run scrape
```

### Project Structure

```
bilibili-actor/
├── src/
│   ├── main.ts          # Main actor logic
│   └── types.ts         # TypeScript type definitions
├── dist/                # Compiled JavaScript output
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── INPUT_SCHEMA.json    # Input schema definition
└── input.json          # Default input values
```

## Input Parameters

- `keywords` (required): Array of search keywords
- `maxResults` (optional): Maximum number of results (default: 5)
- `concurrency` (optional): Concurrent requests (default: 3)
- `requestDelayMs` (optional): Delay between requests (default: 400ms)
- `headless` (optional): Run browser headless (default: true)
- `includeComments` (optional): Include comments (default: true)

## Output

The actor outputs structured data for each video including:

- Video metadata (ID, title, description, thumbnail)
- Author information
- Content details (duration, publish time)
- Engagement metrics (views, likes, coins, favorites, shares)
- Calculated engagement rate

## TypeScript Features

- **Type Safety**: All API responses and data structures are properly typed
- **Interface Definitions**: Clear interfaces for input, output, and API responses
- **Error Handling**: Type-safe error handling throughout the codebase
- **Modern ES Modules**: Uses ES modules with proper TypeScript support
