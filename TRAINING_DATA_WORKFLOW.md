# Training Data Management & Continuous Learning Workflow

## Overview

The enhanced training data management system allows you to:
- Import and categorize training samples
- Review and approve generated content
- Filter training data by sport, content type, status, and source
- Generate fine-tuning datasets with specific criteria
- Track analytics and fine-tuning history

## Components

### 1. Training Data Page (`/training-data`)

The central hub for managing all training samples with features:

- **Analytics Dashboard**: View total samples, approved count, drafts, and last fine-tune date
- **Advanced Filtering**: Filter by sport, content type, status (draft/approved/published), and source (imported/generated)
- **Batch Operations**: Select multiple samples and update their categories in bulk
- **Individual Actions**: Edit, approve, or delete individual samples
- **JSONL Generation**: Create training files with filtered subsets of data

### 2. Import Articles (`/`)

The home page allows importing articles from URLs:
- Articles are automatically converted to training samples
- Stored as "draft" status with "imported" source
- Can be categorized later in the Training Data page

### 3. Upload Training Data (`/upload`)

Manually add prompt/response pairs:
- Add multiple samples at once
- Optionally specify sport and content type during upload
- All samples start as drafts for review

### 4. Generate Content (`/generate`)

Create articles using the fine-tuned model:
- Specify sport and content type for generated content
- **Save as Draft**: Store for later review
- **Approve & Save**: Mark as approved for immediate inclusion in training
- Generated content is marked with "generated" source

## Data Structure

### TrainingSample

```typescript
{
  id: string;
  prompt: string;           // Training prompt
  response: string;         // Expected article text
  sport?: string;           // e.g., "Football", "Basketball"
  contentType?: string;     // e.g., "Recap", "Preview", "Recruiting"
  status: 'draft' | 'approved' | 'published';
  source: 'imported' | 'generated';
  url?: string;             // Original URL if imported
  createdAt: string;
  updatedAt: string;
}
```

## Workflow

### Continuous Learning Cycle

1. **Import Content**
   - Scrape articles from URLs → Draft samples
   - Upload manual prompt/response pairs → Draft samples

2. **Categorize & Review**
   - Navigate to `/training-data`
   - Use batch operations to categorize by sport/content type
   - Review individual samples
   - Approve quality samples

3. **Generate New Content**
   - Use fine-tuned model to generate articles
   - Review generated content
   - Approve good outputs to feed back into training

4. **Create Fine-Tuning Dataset**
   - Click "Generate Training JSONL" button
   - Select filters (e.g., only "approved" + "Football" + "Recap")
   - System generates `public/training.jsonl`
   - Use this file to create new fine-tuned model

5. **Iterate**
   - Use new fine-tuned model in `/generate`
   - Continue improving with approved outputs

## API Routes

- `GET /api/training-samples?sport=X&contentType=Y&status=Z&source=W` - List filtered samples
- `POST /api/training-samples` - Create new sample
- `PATCH /api/training-samples/[id]` - Update sample
- `DELETE /api/training-samples/[id]` - Delete sample
- `POST /api/categorize` - Batch update multiple samples
- `GET /api/analytics` - Get analytics and metadata
- `POST /api/fine-tune` - Generate JSONL with filters

### Fine-Tune API Usage

**Legacy mode (direct samples):**
```javascript
POST /api/fine-tune
{
  "samples": [
    { "prompt": "...", "response": "..." }
  ]
}
```

**New filtered mode:**
```javascript
POST /api/fine-tune
{
  "useFilters": true,
  "sport": "Football",        // or "all"
  "contentType": "Recap",     // or "all"
  "status": "approved"        // or "all"
}
```

## Migration

Existing `training-data.json` files can be migrated:

```bash
node scripts/migrate-training-data.js
```

This converts old article format to new TrainingSample format.

## Best Practices

1. **Start with Drafts**: Import all content as drafts first
2. **Review Before Approval**: Ensure quality before marking as approved
3. **Use Categories**: Consistently categorize by sport and content type
4. **Approve Generated Content**: Feed high-quality AI outputs back into training
5. **Filter Fine-Tuning**: Create specialized models by filtering to specific categories
6. **Track Analytics**: Monitor sample distribution and fine-tuning frequency

## Example Workflows

### Create Football Recap Specialist

1. Import/generate multiple football game recaps
2. Categorize all as sport="Football", contentType="Recap"
3. Review and approve quality samples
4. Generate JSONL with filters: Football + Recap + Approved
5. Fine-tune specialized model

### Multi-Sport General Model

1. Import articles across multiple sports
2. Categorize by sport and content type
3. Approve diverse, high-quality samples
4. Generate JSONL with status="approved", sport="all", contentType="all"
5. Fine-tune general-purpose model

## Files

- `training-samples.json` - All training samples (gitignored)
- `fine-tune-metadata.json` - Analytics and last fine-tune date (gitignored)
- `public/training.jsonl` - Generated fine-tuning file (gitignored)
- `training-data.json` - Legacy format, maintained for backward compatibility (gitignored)
