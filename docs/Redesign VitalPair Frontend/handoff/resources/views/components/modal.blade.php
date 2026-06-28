{{-- Modal genérico (centro). Abre via $dispatch('open-modal','<name>').
     <x-modal name="nova-tarefa" title="Nova tarefa"> … rodapé com x-button … </x-modal> --}}
@props(['name', 'title' => null, 'width' => '480px'])
<div
    x-data="{ open: false }"
    x-show="open"
    x-cloak
    @open-modal.window="if ($event.detail === '{{ $name }}') open = true"
    @keydown.escape.window="open = false"
    @click="open = false"
    class="fixed inset-0 z-50 flex items-center justify-center p-6"
    style="background: var(--scrim)"
    x-transition.opacity
>
    <div
        @click.stop
        x-show="open"
        x-transition.scale.origin.center.95
        class="bg-canvas border border-hair rounded-[18px] shadow-2xl overflow-hidden max-w-full"
        style="width: {{ $width }}"
    >
        @if ($title)
            <div class="flex items-center justify-between px-6 pt-[22px]">
                <h2 class="font-display font-extrabold text-[19px] tracking-tight">{{ $title }}</h2>
                <button @click="open = false" class="w-[30px] h-[30px] rounded-lg bg-surface text-muted grid place-items-center cursor-pointer">✕</button>
            </div>
        @endif
        {{ $slot }}
    </div>
</div>
