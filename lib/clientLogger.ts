import toast from 'react-hot-toast';

export interface ClientErrorContext {
  correlationId?: string;
  url?: string;
  method?: string;
  [key: string]: any;
}

export class ClientLogger {
  static error(message: string, context?: ClientErrorContext) {
    console.error('[ERROR]', message, context);
    
    const displayMessage = context?.correlationId
      ? `${message} (ID: ${context.correlationId.slice(0, 12)}...)`
      : message;
    
    toast.error(displayMessage, {
      duration: 5000,
      position: 'top-right',
    });
  }

  static warn(message: string, context?: ClientErrorContext) {
    console.warn('[WARN]', message, context);
  }

  static info(message: string, context?: any) {
    console.info('[INFO]', message, context);
  }

  static success(message: string) {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  }
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  correlationId?: string;
  details?: any;
}

export async function fetchWithErrorHandling<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data.error || {
        message: data.error || 'An error occurred',
        statusCode: response.status,
      };
      
      ClientLogger.error(error.message, {
        correlationId: error.correlationId,
        url,
        method: options?.method || 'GET',
        statusCode: error.statusCode,
      });
      
      throw new Error(error.message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        ClientLogger.error('Network error. Please check your connection.', { url });
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}
