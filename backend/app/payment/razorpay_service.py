import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

class RazorpayService:
    def __init__(self):
        self.client = razorpay.Client(
            auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
        )

    def create_order(self, amount, currency="INR"):
        data = {
            "amount": int(amount * 100), # Amount in paise
            "currency": currency,
            "payment_capture": "1"
        }
        order = self.client.order.create(data=data)
        return order

    def verify_payment(self, payment_id, order_id, signature):
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        try:
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception:
            return False
