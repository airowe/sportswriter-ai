export const CONTENT_QUEUE_NAME = 'content-jobs';
export const FINE_TUNE_EXPORT_JOB = 'fine_tune_export';

export type FineTuneSample = {
  prompt: string;
  response: string;
};

export type FineTuneExportJobData = {
  jobId: string;
  samples: FineTuneSample[];
};
