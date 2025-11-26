export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0]
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidSSN(ssn: string): boolean {
  return /^\d{3}-\d{2}-\d{4}$/.test(ssn)
}

export function isValidZIP(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip)
}

