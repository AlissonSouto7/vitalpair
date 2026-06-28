{{-- Cronômetro — 3 estados. Só este componente usa âmbar + pulsa.
     <x-timer />                          começar  (teal — ação criativa)
     <x-timer state="running" time="00:42:18" />  rodando (âmbar, pulsando)
     <x-timer state="paused"  time="00:42:18" />  pausado (neutro) --}}
@props([
    'state' => 'idle',   // idle | running | paused
    'time'  => '00:00:00',
])

@if ($state === 'running')
    <button {{ $attributes->merge(['class' => 'is-running inline-flex items-center gap-2 rounded-xl px-[15px] py-[10px] bg-amber text-white font-bold text-[12.5px] font-mono cursor-pointer']) }}>
        <span class="w-2 h-2 rounded-full bg-white"></span>{{ $time }}
    </button>
@elseif ($state === 'paused')
    <button {{ $attributes->merge(['class' => 'inline-flex items-center gap-2 rounded-xl px-[15px] py-[10px] border border-hair text-muted font-bold text-[12.5px] font-mono cursor-pointer']) }}>
        <span class="w-2 h-2 rounded-[2px] bg-muted"></span>{{ $time }}
    </button>
@else
    <button {{ $attributes->merge(['class' => 'inline-flex items-center gap-2 rounded-xl px-[15px] py-[10px] bg-brand text-brand-fg font-bold text-[12.5px] cursor-pointer']) }}>
        <span class="w-0 h-0 border-l-8 border-l-current border-y-[5px] border-y-transparent"></span>Começar
    </button>
@endif
