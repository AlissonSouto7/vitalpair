{{-- Shell do app — toggle de tema claro/escuro via Alpine, persistido em localStorage.
     Turbo Drive cuida da navegação SPA-like; o x-data no <html> sobrevive porque
     persistimos a preferência e reaplicamos a classe no carregamento. --}}
<!DOCTYPE html>
<html
    lang="pt-BR"
    x-data="{ dark: (localStorage.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark' }"
    x-init="$watch('dark', v => localStorage.theme = v ? 'dark' : 'light')"
    :class="{ 'dark': dark }"
>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Flowpj' }}</title>
    @vite('resources/css/app.css')
    {{-- evita flash de tema errado antes do Alpine montar --}}
    <script>document.documentElement.classList.toggle('dark', (localStorage.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light')) === 'dark')</script>
</head>
<body class="min-h-screen bg-canvas text-ink font-sans">

    <header class="max-w-3xl mx-auto px-7 pt-8 flex items-center justify-between">
        <div class="flex items-center gap-6">
            <a href="{{ route('home') }}" class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-[9px] bg-brand text-brand-fg grid place-items-center font-display font-extrabold text-[15px]">F</span>
                <span class="font-display font-extrabold text-[17px] tracking-tight">Flowpj</span>
            </a>
            <nav class="flex gap-5 text-[13px] font-semibold text-muted">
                <a href="{{ route('home') }}" @class(['text-ink border-b-2 border-brand pb-[3px]' => request()->routeIs('home')])>Meu Espaço</a>
                <a href="{{ route('projects.index') }}">Projetos</a>
                <a href="{{ route('reports') }}">Relatórios</a>
            </nav>
        </div>
        <div class="flex items-center gap-2.5">
            {{-- toggle de tema --}}
            <button @click="dark = !dark"
                    class="w-[34px] h-[34px] rounded-[9px] border border-hair text-muted grid place-items-center cursor-pointer"
                    :aria-label="dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'">
                <span x-show="!dark">☾</span><span x-show="dark" x-cloak>☀</span>
            </button>
            {{-- criar: a 2 cliques de qualquer tela (ação criativa = teal) --}}
            <x-button variant="primary" x-data @click="$dispatch('open-modal', 'nova-tarefa')">
                <span class="text-base leading-none -mt-px">+</span>Nova tarefa
            </x-button>
        </div>
    </header>

    <main class="max-w-3xl mx-auto px-7 pb-16 pt-7">
        {{ $slot }}
    </main>
</body>
</html>
