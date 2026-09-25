import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import { createAppRouter } from './router'
import AppLayout from './ui/AppLayout.vue'
import './styles/main.css'

// Os dados são somente leitura e não mudam durante a sessão (ADR 0014). Sem novas
// tentativas automáticas: o visitante tem "Tentar de novo" em cada erro.
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
    },
})

createApp(AppLayout).use(createAppRouter()).use(VueQueryPlugin, { queryClient }).mount('#app')
