import { defineStore } from 'pinia'
import type { User } from '~/types'
import { dummyUser } from '~/data/dummy'

export const useAuthStore = defineStore('auth', () => {
  // In MVP: use dummy data. Replace with real API when auth PRD is implemented.
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  function mockLogin() {
    user.value = dummyUser
  }

  function mockLogout() {
    user.value = null
  }

  return { user, isAuthenticated, mockLogin, mockLogout }
})
