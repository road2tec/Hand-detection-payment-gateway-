import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    def create_payment_intent(self, amount, currency="inr"):
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100), # Amount in paise/cents
                currency=currency,
                metadata={'integration_check': 'hand_geometry_biometrics'}
            )
            return intent
        except Exception as e:
            print(f"Error creating PaymentIntent: {e}")
            return None

    def verify_payment(self, payment_intent_id):
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == 'succeeded':
                return True
            return False
        except Exception as e:
            print(f"Error verifying PaymentIntent: {e}")
            return False
