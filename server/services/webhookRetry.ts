import db from '../db.ts';
import { ulid } from 'ulid';

export class WebhookRetryEngine {
  
  static MAX_RETRIES = 5;

  /**
   * Enqueue a received webhook for async processing
   */
  static enqueue(gateway: string, eventType: string, payload: any) {
    db.prepare(`
      INSERT INTO webhook_dead_letter (id, gateway, event_type, payload, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `).run(ulid(), gateway, eventType, JSON.stringify(payload));
  }

  /**
   * Process pending webhooks (should be run on a cron)
   */
  static async processQueue(processorFn: (gateway: string, eventType: string, payload: any) => Promise<void>) {
    const pending = db.prepare(`
      SELECT * FROM webhook_dead_letter 
      WHERE status = 'PENDING' AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
    `).all() as any[];

    for (const job of pending) {
      try {
        await processorFn(job.gateway, job.event_type, JSON.parse(job.payload));
        
        // Success
        db.prepare(`UPDATE webhook_dead_letter SET status = 'RESOLVED' WHERE id = ?`).run(job.id);
        
        db.prepare(`
          INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(ulid(), job.id, 'WebhookProcessedSuccessfully', JSON.stringify({}), 'system');
        
      } catch (err: any) {
        const newRetryCount = job.retry_count + 1;
        
        if (newRetryCount >= this.MAX_RETRIES) {
          // Dead Letter
          db.prepare(`
            UPDATE webhook_dead_letter 
            SET retry_count = ?, error_message = ?, status = 'DEAD_LETTER', next_retry_at = NULL
            WHERE id = ?
          `).run(newRetryCount, err.message, job.id);
        } else {
          // Exponential backoff: 1min, 5min, 30min, 2hr, 12hr... 
          // For simplicity in sqlite without complex date math, we'll just add minutes: retryCount^2 * 5
          const waitMins = Math.pow(newRetryCount, 2) * 5;
          db.prepare(`
            UPDATE webhook_dead_letter 
            SET retry_count = ?, error_message = ?, next_retry_at = datetime('now', '+' || ? || ' minutes')
            WHERE id = ?
          `).run(newRetryCount, err.message, waitMins, job.id);
        }
      }
    }
  }

  static resolveDeadLetter(id: string) {
    db.prepare(`UPDATE webhook_dead_letter SET status = 'RESOLVED' WHERE id = ?`).run(id);
    db.prepare(`
      INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(ulid(), id, 'WebhookManuallyResolved', JSON.stringify({}), 'admin');
  }
}
