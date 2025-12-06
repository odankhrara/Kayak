import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, Star, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { creditCardService, CreditCard as CardType, AddCardInput } from '../../services/creditCard.service'
import { useAuthStore } from '../../store/authStore'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'

const CARD_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳'
}

const CARD_COLORS: Record<string, string> = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-orange-500 to-red-600',
  amex: 'from-green-600 to-teal-700',
  discover: 'from-orange-400 to-orange-600'
}

export default function PaymentMethods() {
  const { user } = useAuthStore()
  const [cards, setCards] = useState<CardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (user) loadCards()
  }, [user])

  const loadCards = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await creditCardService.getCards(user.userId)
      setCards(data)
    } catch (error) {
      console.error('Failed to load cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCardNumber('')
    setCardHolder('')
    setExpiryMonth('')
    setExpiryYear('')
    setCvv('')
    setIsDefault(false)
    setShowAddForm(false)
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Basic validation
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      toast.error('Please fill in all fields')
      return
    }

    setIsAdding(true)
    try {
      const input: AddCardInput = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardHolderName: cardHolder,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        cvv,
        isDefault
      }
      
      await creditCardService.addCard(user.userId, input)
      toast.success('Card added successfully!')
      resetForm()
      loadCards()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add card')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    if (!user) return
    if (!confirm('Are you sure you want to remove this card?')) return

    setDeletingId(cardId)
    try {
      await creditCardService.deleteCard(user.userId, cardId)
      toast.success('Card removed')
      loadCards()
    } catch (error) {
      toast.error('Failed to remove card')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (cardId: number) => {
    if (!user) return
    try {
      await creditCardService.setDefaultCard(user.userId, cardId)
      toast.success('Default card updated')
      loadCards()
    } catch (error) {
      toast.error('Failed to update default card')
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards List */}
      {cards.length === 0 && !showAddForm ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <CreditCard className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            No payment methods saved
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Add a credit card for faster checkout
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className={`relative rounded-xl p-5 text-white bg-gradient-to-br ${CARD_COLORS[card.cardType] || 'from-slate-600 to-slate-800'} shadow-lg`}
              >
                {card.isDefault && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </div>
                )}
                
                <div className="text-xs opacity-75 uppercase tracking-wider mb-4">
                  {card.cardType}
                </div>
                
                <div className="text-xl font-mono tracking-widest mb-4">
                  •••• •••• •••• {card.cardNumberLast4}
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs opacity-75">Card Holder</div>
                    <div className="font-medium">{card.cardHolderName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75">Expires</div>
                    <div className="font-medium">
                      {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  {!card.isDefault && (
                    <button
                      onClick={() => handleSetDefault(card.cardId)}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.cardId)}
                    disabled={deletingId === card.cardId}
                    className="p-1.5 bg-white/20 hover:bg-red-500 rounded-lg transition-colors"
                    title="Remove card"
                  >
                    {deletingId === card.cardId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showAddForm && (
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Another Card
            </Button>
          )}
        </>
      )}

      {/* Add Card Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add New Card
          </h3>
          
          <form onSubmit={handleAddCard} className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              required
            />

            <Input
              label="Cardholder Name"
              placeholder="John Doe"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Month"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                maxLength={2}
                required
              />
              <Input
                label="Year"
                placeholder="YYYY"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
              <Input
                label="CVV"
                placeholder="123"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Set as default payment method
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Card'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

