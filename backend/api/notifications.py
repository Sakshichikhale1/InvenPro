from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class SMSRequest(BaseModel):
    message: str
    to_number: str = None # Optional, will fallback to env var

@router.post("/send-sms")
async def send_sms(request: SMSRequest, response: Response):
    # Manually add CORS headers for maximum compatibility
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    
    # Default to sending to the admin's number if not provided
    to_number = request.to_number or os.getenv("TWILIO_TO_NUMBER")

    if not all([account_sid, auth_token, from_number, to_number]):
        # If Twilio is not configured, we just print and return success so we don't crash the frontend
        print(f"DEBUG: Twilio not fully configured. Would have sent SMS to {to_number}: {request.message}")
        return {"success": True, "message": "Twilio not configured. Message logged locally.", "delivered": False}

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=request.message,
            from_=from_number,
            to=to_number
        )
        print(f"DEBUG: Sent SMS via Twilio. SID: {message.sid}")
        return {"success": True, "message": "SMS sent successfully", "delivered": True, "sid": message.sid}
    except TwilioRestException as e:
        print(f"Twilio error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Unexpected error sending SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS notification")
