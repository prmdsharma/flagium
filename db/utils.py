from datetime import datetime
from db.connection import get_connection

def update_job_status(job_name, status, message=None):
    """Update or insert the status of a system job."""
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    try:
        if status == "running":
            query = """
                INSERT INTO system_jobs (job_name, status, last_run_start, message)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    status = VALUES(status),
                    last_run_start = VALUES(last_run_start),
                    message = VALUES(message),
                    last_run_end = NULL
            """
            cursor.execute(query, (job_name, status, now, message))
        elif status in ["completed", "failed"]:
            query = """
                UPDATE system_jobs 
                SET status = %s, last_run_end = %s, message = %s
                WHERE job_name = %s
            """
            cursor.execute(query, (status, now, message, job_name))
        
        conn.commit()
    except Exception as e:
        print(f"❌ Error updating job status for {job_name}: {e}")
    finally:
        cursor.close()
        conn.close()
