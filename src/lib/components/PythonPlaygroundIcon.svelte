<script lang="ts">
    import { page } from '$app/state';
</script>

<a 
    href="/playground" 
    class="flex items-center justify-center p-3 rounded-lg transition-all duration-300 hover:bg-indigo-50 hover:shadow-md {(page.url.pathname === '/playground' ? 'bg-indigo-50 shadow-md' : '')}"
    title="Python Playground"
>
    <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        class="text-indigo-600"
    >
        <!-- Python logo base -->
        <path 
            d="M16 2C8.27 2 2 8.27 2 16C2 23.73 8.27 30 16 30C23.73 30 30 23.73 30 16C30 8.27 23.73 2 16 2Z" 
            fill="#3776AB"
        />
        <!-- Python snake body -->
        <path 
            d="M16 8C13.24 8 11 10.24 11 13V19C11 21.76 13.24 24 16 24C18.76 24 21 21.76 21 19V13C21 10.24 18.76 8 16 8Z" 
            fill="#FFD43B"
        />
        <!-- Playground elements -->
        <path 
            d="M9 13C9 11.34 10.34 10 12 10H20C21.66 10 23 11.34 23 13V19C23 20.66 21.66 22 20 22H12C10.34 22 9 20.66 9 19V13Z" 
            fill="none" 
            stroke="#FFD43B" 
            stroke-width="2"
        />
        <!-- Playground details -->
        <path 
            d="M12 13H20M12 16H20M12 19H20" 
            stroke="#3776AB" 
            stroke-width="2" 
            stroke-linecap="round"
        />
        <!-- Python eyes -->
        <circle cx="14" cy="13" r="1" fill="#3776AB"/>
        <circle cx="18" cy="13" r="1" fill="#3776AB"/>
        <!-- Playground slide -->
        <path 
            d="M9 19L12 16L15 19" 
            stroke="#FFD43B" 
            stroke-width="2" 
            stroke-linecap="round"
        />
    </svg>
</a>

<style>
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
        100% { transform: translateY(0px); }
    }

    @keyframes slide {
        0% { transform: translateX(0); }
        50% { transform: translateX(3px); }
        100% { transform: translateX(0); }
    }

    a:hover svg {
        animation: pulse 1s infinite, float 2s infinite;
    }

    a:hover svg path:last-child {
        animation: slide 1s infinite;
    }

    a {
        border: 1px solid rgba(79, 70, 229, 0.1);
    }
</style> 
