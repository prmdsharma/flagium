import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_verification_email(to_email, token):
    """
    Sends a verification email with a link.
    If SMTP env vars are missing, it prints to console for debugging.
    """
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    
    # Construction of verification URL
    # In production, this should be the domain or Public IP
    base_url = os.getenv("FRONTEND_URL", "http://80.225.201.34")
    verify_url = f"{base_url}/verify/{token}"
    
    subject = "Verify your Flagium Account"
    body = f"""
    Hello,
    
    Thank you for registering with Flagium. Please click the link below to verify your email address:
    
    {verify_url}
    
    If you did not create an account, please ignore this email.
    """
    
    if not smtp_user or not smtp_pass:
        print("\n" + "="*50)
        print("⚠️  SMTP NOT CONFIGURED. SIMULATING EMAIL SEND.")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"VERIFY LINK: {verify_url}")
        print("="*50 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

def send_reset_password_email(to_email, token):
    """
    Sends a password reset email with a link.
    If SMTP env vars are missing, it prints to console for debugging.
    """
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    
    # Construction of reset URL
    base_url = os.getenv("FRONTEND_URL", "http://80.225.201.34")
    reset_url = f"{base_url}/reset-password/{token}"
    
    subject = "Reset your Flagium Password"
    body = f"""
    Hello,
    
    We received a request to reset your password. Please click the link below to set a new password:
    
    {reset_url}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email.
    """
    
    if not smtp_user or not smtp_pass:
        print("\n" + "="*50)
        print("⚠️  SMTP NOT CONFIGURED. SIMULATING RESET EMAIL SEND.")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"RESET LINK: {reset_url}")
        print("="*50 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Failed to send reset email: {e}")
        return False
