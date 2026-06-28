{{-- <x-button variant="primary|secondary|icon|danger" :loading="false"> --}}
@props([
    'variant' => 'primary',
    'type'    => 'button',
    'loading' => false,
])
@php
    $base = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm cursor-pointer transition select-none disabled:opacity-60';
    $variants = [
        'primary'   => 'bg-brand text-brand-fg px-[18px] py-3 hover:brightness-105',
        'secondary' => 'border border-hair text-ink bg-transparent px-[18px] py-3 hover:bg-surface',
        'icon'      => 'w-10 h-10 border border-hair text-ink bg-transparent',
        'danger'    => 'bg-danger text-white px-[18px] py-3 hover:brightness-105',
    ];
@endphp
<button
    type="{{ $type }}"
    @disabled($loading)
    {{ $attributes->merge(['class' => $base . ' ' . ($variants[$variant] ?? $variants['primary'])]) }}
>
    @if ($loading)
        <span class="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
    @endif
    {{ $slot }}
</button>
