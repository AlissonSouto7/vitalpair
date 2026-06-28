{{-- Badge de status e de prazo — a cor SEMPRE segue a lei das cores.
     <x-badge status="andamento" />            status
     <x-badge prazo="atrasado" label="2d" />   prazo --}}
@props([
    'status' => null,   // pendente | andamento | revisao | concluida | bloqueada
    'prazo'  => null,    // hoje | atrasado | futuro
    'label'  => null,    // texto opcional (sobrescreve o padrão)
])
@php
    // [texto, classe-de-texto, classe-de-fundo]
    $statusMap = [
        'pendente'  => ['Pendente',     'text-muted',       'bg-track'],
        'andamento' => ['Em andamento', 'text-amber-ink',   'bg-amber-soft'],
        'revisao'   => ['Em revisão',   'text-review-ink',  'bg-review-soft'],
        'concluida' => ['Concluída',    'text-success-ink', 'bg-success-soft'],
        'bloqueada' => ['Bloqueada',    'text-danger-ink',  'bg-danger-soft'],
    ];
    $prazoMap = [
        'hoje'     => ['Hoje',     'text-amber-ink',  'bg-amber-soft'],
        'atrasado' => ['Atrasado', 'text-danger-ink', 'bg-danger-soft'],
        'futuro'   => ['Futuro',   'text-muted',      'bg-track'],
    ];
    $def  = $status ? ($statusMap[$status] ?? $statusMap['pendente'])
                    : ($prazoMap[$prazo]   ?? $prazoMap['futuro']);
    [$text, $tc, $bc] = $def;
    $text = $label ?? $text;
@endphp
<span {{ $attributes->merge(['class' => "inline-flex items-center rounded-lg px-[11px] py-[5px] text-[11.5px] font-bold $tc $bc"]) }}>
    {{ $slot->isEmpty() ? $text : $slot }}
</span>
