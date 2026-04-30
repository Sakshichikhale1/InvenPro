import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
from_number = os.getenv("TWILIO_FROM_NUMBER")
to_number = os.getenv("TWILIO_TO_NUMBER")

print("Testing Twilio with the following settings:")
print(f"From: {from_number}")
print(f"To: {to_number}")

try:
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body="InvenPro Alert: This is a test message to verify Twilio is working perfectly!",
        from_=from_number,
        to=to_number
    )
    print(f"SUCCESS! Message sent. SID: {message.sid}")
except Exception as e:
    print(f"FAILED to send message: {e}")
