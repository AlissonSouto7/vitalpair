{{-- Barra de progresso — elemento-assinatura do produto.
     <x-progress :value="62" />                          barra simples (teal, com brilho)
     <x-progress :value="100" tone="success" />          concluído (verde)
     <x-progress :segments="[['v'=>100,'tone'=>'success'],['v'=>60],['v'=>0],['v'=>0]]" />  por etapa --}}
@props([
    'value'    => 0,
    'tone'     => 'brand',     // brand | success
    'segments' => null,        // array de ['v'=>0..100, 'tone'=>'brand'|'success'] para barra por etapa
])
@php
    $fill = fn($t) => $t === 'success' ? 'bg-success' : 'bg-brand';
@endphp

@if ($segments)
    <div class="flex gap-[5px] h-[11px]">
        @foreach ($segments as $seg)
            @php $v = $seg['v'] ?? 0; $t = $seg['tone'] ?? 'brand'; @endphp
            <div class="flex-1 bg-track rounded-md overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 {{ $fill($t) }} rounded-md" style="width: {{ $v }}%"></div>
            </div>
        @endforeach
    </div>
@else
    <div {{ $attributes->merge(['class' => 'relative h-[11px] bg-track rounded-md overflow-hidden']) }}>
        <div class="absolute inset-y-0 left-0 rounded-md overflow-hidden {{ $tone === 'brand' ? '' : $fill($tone) }}"
             @style(['width: '.$value.'%', 'background: linear-gradient(90deg, var(--brand), var(--brand-2))' => $tone === 'brand'])>
            @if ($tone === 'brand')<span class="signature-sheen"></span>@endif
        </div>
    </div>
@endif
