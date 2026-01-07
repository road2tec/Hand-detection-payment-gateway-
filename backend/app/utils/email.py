import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_otp_email(to_email: str, otp: str):
    """
    Sends an OTP email to the user using SMTP.
    Gmail SMTP server: smtp.gmail.com
    Port: 465 (SSL)
    """
    if not EMAIL_USER or not EMAIL_PASS:
        print("ERROR: Email credentials not found in environment variables.")
        return False

    msg = EmailMessage()
    msg['Subject'] = '🔒 Secure Transaction OTP'
    msg['From'] = f"Secure Pay <{EMAIL_USER}>"
    msg['To'] = to_email
    
    msg.set_content(f"""
    Hello,
    
    A high-value payment (over ₹20,000) was initiated from your account.
    
    Your Secure OTP is: {otp}
    
    This OTP is valid for 5 minutes and can only be used once.
    If you did not initiate this transaction, please secure your account immediately.
    
    Stay Secure,
    Secure Pay Team
    """)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"FAILED TO SEND EMAIL: {str(e)}")
        return False
