{{-- Drawer lateral (desliza da direita). Abre via $dispatch('open-drawer','<name>').
     Usado no detalhe da tarefa. <x-drawer name="tarefa"> … </x-drawer> --}}
@props(['name', 'width' => '440px'])
<div
    x-data="{ open: false }"
    x-show="open"
    x-cloak
    @open-drawer.window="if ($event.detail === '{{ $name }}') open = true"
    @keydown.escape.window="open = false"
    @click="open = false"
    class="fixed inset-0 z-40"
    style="background: var(--scrim)"
    x-transition.opacity
>
    <div
        @click.stop
        x-show="open"
        x-transition:enter="transition ease-[cubic-bezier(.32,.72,0,1)] duration-300"
        x-transition:enter-start="translate-x-full"
        x-transition:enter-end="translate-x-0"
        class="absolute top-0 right-0 bottom-0 bg-canvas overflow-y-auto max-w-full"
        style="width: {{ $width }}; box-shadow: -20px 0 50px rgba(0,0,0,.18)"
    >
        {{ $slot }}
    </div>
</div>
