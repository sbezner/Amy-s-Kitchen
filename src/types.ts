export type UserRole = 'amy' | 'employee'
export type UserStatus = 'pending' | 'approved' | 'deactivated'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  status: UserStatus
  createdAt: number
}

export type DietaryTag =
  | 'dairy'
  | 'nuts'
  | 'gluten'
  | 'shellfish'
  | 'eggs'
  | 'soy'
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'

export interface MealLibraryEntry {
  id: string
  name: string
  description: string
  photoUrl?: string
  dietaryTags: DietaryTag[]
  createdAt: number
}

export interface Serving {
  id: string
  libraryId: string
  servedDate: string // YYYY-MM-DD
  notes?: string
  createdAt: number
}

export interface Rating {
  uid: string
  stars: number // 1-5
  comment?: string
  hiddenByAmy?: boolean
  updatedAt: number
}

export interface Request {
  id: string
  requestedBy: string
  requestedByName: string
  mealName: string
  notes?: string
  status: 'open' | 'scheduled' | 'made' | 'declined'
  scheduledServingId?: string
  createdAt: number
}
