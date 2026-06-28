{{-- Avatar e pilha de avatares (cor por pessoa).
     <x-avatar initials="AC" />
     <x-avatar-stack :people="[['AC'],['JM'],['RS']]" :extra="3" />  (ver partial abaixo)
     As cores de pessoa são dessaturadas de propósito p/ não competir com a cor funcional. --}}
@props([
    'initials' => '',
    'size'     => 32,        // px
    'tone'     => 'teal',     // teal | indigo | amber | neutral
])
@php
    $tones = [
        'teal'    => 'background:#cfe6e0;color:#1f4f48',
        'indigo'  => 'background:#d9d6f5;color:#3a3370',
        'amber'   => 'background:#f0dcc0;color:#6b4a1c',
        'neutral' => 'background:var(--canvas);color:var(--muted)',
    ];
@endphp
<span
    {{ $attributes->merge(['class' => 'inline-flex items-center justify-center rounded-full font-bold shrink-0']) }}
    style="width:{{ $size }}px;height:{{ $size }}px;font-size:{{ round($size * .34) }}px;{{ $tones[$tone] ?? $tones['teal'] }}"
>{{ $initials }}</span>
