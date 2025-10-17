export interface TrainingSample {
  id: string;
  prompt: string;
  response: string;
  sport?: string;
  contentType?: string;
  status: 'draft' | 'approved' | 'published';
  source: 'imported' | 'generated';
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FineTuneMetadata {
  lastFineTuneDate?: string;
  totalSamples: number;
  samplesBySport: Record<string, number>;
  samplesByContentType: Record<string, number>;
  samplesByStatus: Record<string, number>;
}
