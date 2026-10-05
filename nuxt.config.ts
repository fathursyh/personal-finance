// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    'nuxt-typed-router',
    '@sidebase/nuxt-auth'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  runtimeConfig: {
    public: {
      appVersion: import.meta.env.PUBLIC_APP_VERSION
    }
  },

  // No database yet: users and sessions are persisted as files in ./.data (gitignored).
  nitro: {
    storage: {
      users: { driver: 'fs', base: './.data/users' },
      sessions: { driver: 'fs', base: './.data/sessions' }
    }
  },

  auth: {
    baseURL: '/api/auth',
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/login', method: 'post' },
        signOut: { path: '/logout', method: 'post' },
        signUp: { path: '/register', method: 'post' },
        getSession: { path: '/session', method: 'get' }
      },
      pages: {
        login: '/login'
      },
      session: {
        dataType: { id: 'string', name: 'string', email: 'string' }
      },
      token: {
        signInResponseTokenPointer: '/token',
        type: 'Token',
        cookieName: 'auth.token',
        headerName: 'Authorization',
        maxAgeInSeconds: 1800,
        sameSiteAttribute: 'lax',
        secureCookieAttribute: false,
        httpOnlyCookieAttribute: false
      }
    },
    globalAppMiddleware: true
  }
})
