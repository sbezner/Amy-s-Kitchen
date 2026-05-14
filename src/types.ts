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
  /** Ordered list of photo URLs. The first is the primary. */
  photos: string[]
  dietaryTags: DietaryTag[]
  createdAt: number
  createdBy?: string
  /** If set, admin has declined this meal; the reason is visible to everyone. */
  declinedReason?: string
  declinedAt?: number
  declinedBy?: string
}

export interface Serving {
  id: string
  libraryId: string
  servedDate: string // YYYY-MM-DD; also the doc id for new servings
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
