import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../store/useStore'
import { billingApi } from '../api/billingApi'
import './PaymentsPage.css'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const { currentBooking, user, setError, setStatusMessage, setLoading } = useStore()
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'paypal'>('credit_card')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: '',
  })

  if (!currentBooking || !user) {
    navigate('/search')
    return null
  }

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      await billingApi.createPayment({
        bookingId: currentBooking.id!,
        amount: currentBooking.totalPrice,
        paymentMethod,
        ...(paymentMethod !== 'paypal' && cardDetails),
      })
      setStatusMessage('Payment successful! Your booking is confirmed.')
      setTimeout(() => {
        navigate('/my-trips')
      }, 2000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payments-page">
      <h2>Payment</h2>
      
      <div className="payment-details">
        <div className="payment-summary">
          <h3>Booking Summary</h3>
          <p><strong>Booking ID:</strong> #{currentBooking.id}</p>
          <p><strong>Total Amount:</strong> ${currentBooking.totalPrice.toFixed(2)}</p>
        </div>

        <div className="payment-form">
          <h3>Payment Method</h3>
          
          <div className="payment-methods">
            <label className="payment-method-option">
              <input
                type="radio"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              />
              Credit Card
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                value="debit_card"
                checked={paymentMethod === 'debit_card'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              />
              Debit Card
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              />
              PayPal
            </label>
          </div>

          {paymentMethod !== 'paypal' && (
            <>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                  maxLength={19}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    maxLength={5}
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                />
              </div>
            </>
          )}

          <button onClick={handlePayment} className="btn-primary btn-large">
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  )
}

