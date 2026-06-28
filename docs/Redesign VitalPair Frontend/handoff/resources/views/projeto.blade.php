{{-- Projeto (detalhe) — Projeto → Etapas → Subtarefas, com barra-assinatura
     segmentada por etapa e etapas expansíveis (Alpine). --}}
<x-layout :title="$project->name . ' — Flowpj'">

    <a href="{{ route('projects.index') }}" class="inline-block text-[12.5px] font-semibold text-muted mb-3.5">‹ Projetos</a>

    {{-- header: nome + membros --}}
    <div class="flex items-start justify-between gap-5 mb-[18px]">
        <div>
            <h1 class="font-display font-extrabold text-[30px] leading-none tracking-tight">{{ $project->name }}</h1>
            <p class="text-[13px] font-medium text-muted mt-2">{{ $project->subtitle }}</p>
        </div>
        <div class="flex shrink-0">
            @foreach ($project->members as $m)
                <span class="-ml-[9px] first:ml-0 rounded-full border-2 border-canvas">
                    <x-avatar :initials="$m->initials" :tone="$m->tone" :size="32" />
                </span>
            @endforeach
            @if ($project->extra_members)
                <x-avatar :initials="'+'.$project->extra_members" tone="neutral" :size="32" class="-ml-[9px] border-2 border-canvas" />
            @endif
        </div>
    </div>

    {{-- barra-assinatura: segmentada por etapa --}}
    <div class="bg-surface border border-hair rounded-2xl p-[18px_22px] mb-6">
        <div class="flex items-baseline justify-between mb-3">
            <div class="flex items-baseline gap-2.5">
                <span class="font-display font-extrabold text-[30px] leading-none tracking-tight">{{ $project->percent }}<span class="text-[17px]">%</span></span>
                <span class="text-[12.5px] font-semibold text-muted">{{ $project->done }} de {{ $project->total }} subtarefas</span>
            </div>
            <span class="text-xs font-bold text-success-ink">no prazo</span>
        </div>
        <x-progress :segments="$project->segments" />
        <div class="flex gap-[5px] mt-2 text-[10.5px] font-semibold text-muted">
            @foreach ($project->stages as $s)
                <div class="flex-1">{{ $s->name }}</div>
            @endforeach
        </div>
    </div>

    {{-- filtros --}}
    <div class="flex items-center gap-2 mb-4">
        <span class="text-xs font-semibold text-muted">Filtrar:</span>
        @foreach (['Responsável', 'Status', 'Prazo'] as $f)
            <button class="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-[7px] rounded-lg bg-surface border border-hair cursor-pointer">{{ $f }} <span class="opacity-50">▾</span></button>
        @endforeach
    </div>

    {{-- etapas (acordeão; começa com a "andamento" aberta) --}}
    <div x-data="{ open: '{{ collect($project->stages)->firstWhere('status','andamento')->name ?? '' }}' }" class="flex flex-col gap-2.5">
        @foreach ($project->stages as $stage)
            <div class="bg-surface border border-hair rounded-2xl overflow-hidden">
                <button @click="open = (open === '{{ $stage->name }}' ? null : '{{ $stage->name }}')"
                        class="w-full flex items-center gap-3.5 px-[18px] py-[15px] text-left cursor-pointer">
                    <span class="w-2 h-2 border-r-2 border-b-2 border-muted shrink-0 transition-transform duration-300"
                          :style="open === '{{ $stage->name }}' ? 'transform:translateY(2px) rotate(225deg)' : 'transform:translateY(-1px) rotate(45deg)'"></span>

                    @if ($stage->status === 'concluida')
                        <span class="w-[22px] h-[22px] rounded-md bg-success grid place-items-center text-white text-xs shrink-0">✓</span>
                    @elseif ($stage->status === 'andamento')
                        <span class="w-[22px] h-[22px] rounded-md border-2 border-amber grid place-items-center shrink-0"><span class="w-[7px] h-[7px] rounded-full bg-amber"></span></span>
                    @else
                        <span class="w-[22px] h-[22px] rounded-md border-2 border-node shrink-0"></span>
                    @endif

                    <div class="flex-1 min-w-0">
                        <div class="font-display font-bold text-[15px] tracking-tight">{{ $stage->name }}</div>
                        @if ($stage->status === 'andamento')
                            <div class="max-w-[220px] mt-[7px]"><x-progress :value="$stage->percent" class="!h-[5px]" /></div>
                        @endif
                    </div>

                    <x-badge :status="$stage->status" />
                    <span class="font-mono font-bold text-xs text-muted">{{ $stage->done }}/{{ $stage->total }}</span>
                </button>

                @if (count($stage->subtasks))
                    <div x-show="open === '{{ $stage->name }}'" x-collapse class="px-4 pb-3.5 pt-0.5">
                        <div class="flex flex-col gap-2">
                            @foreach ($stage->subtasks as $st)
                                <div class="flex items-center gap-3 bg-canvas border border-hair rounded-xl px-3.5 py-[11px]">
                                    <button class="w-[17px] h-[17px] rounded-md border-2 border-node shrink-0" aria-label="Concluir"></button>
                                    <div class="flex-1 min-w-0 font-semibold text-[13.5px] truncate">{{ $st->title }}</div>
                                    <x-badge :status="$st->status" />
                                    @if ($st->running)
                                        <span class="inline-flex items-center gap-1.5 text-amber-ink font-mono font-bold text-[11.5px]"><span class="w-[7px] h-[7px] rounded-full bg-amber is-running"></span>{{ $st->elapsed }}</span>
                                    @else
                                        <x-timer state="idle" class="!px-2.5 !py-2 scale-90 origin-right" />
                                    @endif
                                    <x-avatar :initials="$st->assignee_initials" :tone="$st->assignee_tone" :size="26" />
                                </div>
                            @endforeach
                            <button class="self-start mt-0.5 flex items-center gap-1.5 border border-dashed border-node text-muted font-semibold text-xs px-3.5 py-[9px] rounded-[10px] cursor-pointer">
                                <span class="text-[15px] leading-none -mt-px text-brand">+</span>Subtarefa
                            </button>
                        </div>
                    </div>
                @endif
            </div>
        @endforeach
    </div>

</x-layout>
