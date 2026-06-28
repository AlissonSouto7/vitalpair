{{-- Linha de tarefa — usada em Meu Espaço e dentro das etapas do Projeto.
     <x-task-row
        title="Wireframes do app" project="App Flow"
        status="andamento" timer="00:42:18"
        assignee="AC" tone="teal" /> --}}
@props([
    'title'    => '',
    'project'  => null,
    'status'   => 'pendente',   // pendente | andamento | revisao | concluida | bloqueada
    'timer'    => null,         // string de tempo se rodando
    'prazo'    => null,         // hoje | atrasado | futuro
    'prazoLabel' => null,
    'assignee' => null,         // iniciais
    'tone'     => 'teal',
    'done'     => false,
])
<div {{ $attributes->merge(['class' =>
    'flex items-center gap-[13px] rounded-2xl px-4 py-[13px] border '
    . ($status === 'bloqueada' || $prazo === 'atrasado' ? 'border-danger-soft ' : 'border-hair ')
    . ($done ? 'bg-transparent opacity-60' : 'bg-surface')]) }}>

    {{-- controle de status --}}
    @if ($done)
        <span class="w-[18px] h-[18px] rounded-md bg-success flex items-center justify-center text-white text-[11px] shrink-0">✓</span>
    @else
        <button class="w-[18px] h-[18px] rounded-md border-2 border-node shrink-0" aria-label="Concluir"></button>
    @endif

    {{-- título + projeto --}}
    <div class="flex-1 min-w-0">
        <div class="font-bold text-sm truncate {{ $done ? 'line-through text-muted' : 'text-ink' }}">{{ $title }}</div>
        @if ($project)<div class="text-xs font-medium text-muted mt-px truncate">{{ $project }}</div>@endif
    </div>

    {{-- badge de status --}}
    <x-badge :status="$status" />

    {{-- cronômetro rodando (âmbar) ou prazo --}}
    @if ($timer)
        <span class="inline-flex items-center gap-1.5 text-amber-ink font-mono font-bold text-xs">
            <span class="w-[7px] h-[7px] rounded-full bg-amber is-running"></span>{{ $timer }}
        </span>
    @elseif ($prazo)
        <x-badge :prazo="$prazo" :label="$prazoLabel" />
    @endif

    {{-- responsável --}}
    @if ($assignee)<x-avatar :initials="$assignee" :tone="$tone" :size="28" />@endif
</div>
