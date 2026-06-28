{{-- Meu Espaço — o herói-assinatura troca de forma com um gesto (a setinha):
     chevron p/ baixo = FLUXO (a correnteza do dia) · gira p/ cima = FOCO (o anel).
     Tudo client-side com Alpine; o corpo (abas + lista) é compartilhado pelas duas vistas. --}}
<x-layout title="Meu Espaço — Flowpj">
<div x-data="{ view: $persist('fluxo').as('meu-espaco-view') }">

    {{-- saudação + a setinha que reorganiza o dia --}}
    <div class="flex items-end justify-between mb-[22px]">
        <div>
            <h1 class="font-display font-extrabold text-[28px] leading-none tracking-tight">Bom dia, {{ $user->first_name }}</h1>
            <p class="text-[12.5px] font-medium text-muted mt-1.5">{{ now()->translatedFormat('l · j \d\e F') }}</p>
        </div>
        <button @click="view = (view === 'fluxo' ? 'foco' : 'fluxo')"
                class="w-10 h-10 rounded-full border border-hair bg-surface text-muted grid place-items-center cursor-pointer"
                title="Ver o dia de outro jeito">
            <span class="block w-[9px] h-[9px] border-r-2 border-b-2 border-current transition-transform duration-300"
                  :style="view === 'foco' ? 'transform:translateY(3px) rotate(225deg)' : 'transform:translateY(-2px) rotate(45deg)'"></span>
        </button>
    </div>

    {{-- ============ FLUXO : a correnteza ============ --}}
    <div x-show="view === 'fluxo'" x-transition.opacity class="enter">
        <div class="flex items-center gap-6 mb-2">
            <div class="shrink-0">
                <div class="font-display font-extrabold text-[46px] leading-[.85] tracking-tight">{{ $done }}<span class="text-node text-2xl">/{{ $total }}</span></div>
                <div class="text-[11px] font-semibold text-muted mt-1">concluídas</div>
            </div>
            <div class="flex-1 relative h-16">
                <div class="absolute top-[29px] inset-x-0 h-3 bg-track rounded-lg"></div>
                <div class="absolute top-[29px] left-0 h-3 rounded-lg overflow-hidden" style="width:{{ $percent }}%;background:linear-gradient(90deg,var(--brand),var(--brand-2))">
                    <span class="signature-sheen"></span>
                </div>
                {{-- nós: passado=verde, agora=âmbar pulsando, futuro=contorno --}}
                <span class="absolute top-7 w-3.5 h-3.5 rounded-full bg-success border-[3px] border-canvas" style="left:0"></span>
                <span class="absolute top-6 w-[22px] h-[22px] rounded-full bg-amber border-4 border-canvas is-running -translate-x-1/2" style="left:{{ $percent }}%"></span>
                <span class="absolute top-0 text-[10.5px] font-bold text-amber-ink -translate-x-1/2" style="left:{{ $percent }}%">agora</span>
            </div>
        </div>
    </div>

    {{-- ============ FOCO : o anel ============ --}}
    <div x-show="view === 'foco'" x-transition.opacity x-cloak class="enter">
        <div class="flex gap-7 items-center">
            <div class="relative shrink-0 w-[200px] h-[200px]">
                <svg width="200" height="200" viewBox="0 0 210 210">
                    <circle cx="105" cy="105" r="90" fill="none" stroke-width="16" style="stroke:var(--track)"></circle>
                    <circle cx="105" cy="105" r="90" fill="none" stroke-width="16" stroke-linecap="round"
                            stroke-dasharray="565" stroke-dashoffset="{{ 565 * (1 - $percent/100) }}"
                            transform="rotate(-90 105 105)" style="stroke:var(--brand)"></circle>
                </svg>
                <div class="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <div class="font-display font-extrabold text-[50px] leading-[.85] tracking-tight">{{ $done }}<span class="text-node text-[26px]">/{{ $total }}</span></div>
                        <div class="text-[11.5px] font-bold text-muted mt-1">concluídas hoje</div>
                    </div>
                </div>
            </div>
            <div class="flex-1">
                <p class="text-[13px] font-medium text-muted mb-4">Faça uma coisa de cada vez.</p>
                <div class="text-[10.5px] font-extrabold uppercase tracking-[.12em] text-amber-ink mb-1.5">Agora</div>
                <div class="font-display font-bold text-[19px] tracking-tight">{{ $next->title }}</div>
                <div class="text-xs font-medium text-muted mb-3.5">{{ $next->project }} · etapa {{ $next->step }}</div>
                <x-timer state="running" time="00:42:18" />
            </div>
        </div>
    </div>

    {{-- ============ corpo compartilhado : abas + lista do dia ============ --}}
    <div class="mt-[30px]">
        <div class="flex gap-1.5 mb-4 text-[12.5px] font-semibold flex-wrap">
            <a class="px-3.5 py-[7px] rounded-full bg-ink text-canvas">Hoje</a>
            <a class="px-3.5 py-[7px] rounded-full text-muted">Amanhã</a>
            <a class="px-3.5 py-[7px] rounded-full text-muted">Semana</a>
            <a class="px-3.5 py-[7px] rounded-full bg-danger-soft text-danger-ink">Atrasadas · {{ $overdue }}</a>
            <a class="px-3.5 py-[7px] rounded-full text-muted">Concluídas</a>
        </div>
        <div class="flex flex-col gap-[9px]">
            @foreach ($tasks as $task)
                <x-task-row
                    :title="$task->title" :project="$task->project"
                    :status="$task->status" :timer="$task->running ? $task->elapsed : null"
                    :prazo="$task->prazo" :assignee="$task->assignee_initials"
                    :tone="$task->assignee_tone" :done="$task->done" />
            @endforeach
        </div>
    </div>

    {{-- modal de criar tarefa (disparado pelo "+ Nova tarefa" do layout) --}}
    <x-modal name="nova-tarefa" title="Nova tarefa">
        <div class="px-6 pt-[18px] space-y-4">
            <x-field label="Título" name="title" placeholder="O que precisa ser feito?" />
            <div class="grid grid-cols-2 gap-3">
                <x-field label="Etapa" name="stage" value="Design" />
                <x-field label="Prazo" name="due" value="12 jul" />
            </div>
        </div>
        <div class="flex justify-end gap-2.5 px-6 py-5 mt-2">
            <x-button variant="secondary" x-on:click="open = false">Cancelar</x-button>
            <x-button variant="primary" type="submit">Criar tarefa</x-button>
        </div>
    </x-modal>

</div>
</x-layout>
