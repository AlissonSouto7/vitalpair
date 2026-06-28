<?php

namespace App\Support;

/*
 * Mock data — substitui o backend até o Livewire entrar.
 * Tudo são stdClass/arrays simples pra as views (Blade) renderizarem.
 * Quando o backend chegar, troque estes métodos por Eloquent models
 * mantendo as MESMAS chaves que as views consomem.
 */
class MockData
{
    public static function user(): object
    {
        return (object) [
            'name'       => 'Alisson',
            'first_name' => 'Alisson',
            'role'       => 'Designer',
            'email'      => 'alisson@acme.com',
            'initials'   => 'AL',
        ];
    }

    /** Tarefas do dia (Meu Espaço) */
    public static function tasks(): array
    {
        return [
            (object) ['title' => 'Revisar proposta comercial', 'project' => 'Acme',     'status' => 'andamento', 'running' => true,  'elapsed' => '00:42:18', 'prazo' => null,       'assignee_initials' => 'AC', 'assignee_tone' => 'teal',    'done' => false],
            (object) ['title' => 'Subir copy da landing page',  'project' => 'Site Novo', 'status' => 'revisao',   'running' => false, 'elapsed' => null,       'prazo' => 'futuro',   'assignee_initials' => 'JM', 'assignee_tone' => 'indigo',  'done' => false],
            (object) ['title' => 'Enviar contrato p/ assinatura','project' => 'Beta Ltda','status' => 'pendente',  'running' => false, 'elapsed' => null,       'prazo' => 'atrasado', 'assignee_initials' => 'RS', 'assignee_tone' => 'amber',   'done' => false],
            (object) ['title' => 'Aprovar orçamento do trimestre','project' => 'Acme',    'status' => 'concluida', 'running' => false, 'elapsed' => null,       'prazo' => null,       'assignee_initials' => null, 'assignee_tone' => 'teal',    'done' => true],
        ];
    }

    /** Props prontas pra view meu-espaco */
    public static function meuEspaco(): array
    {
        return [
            'user'    => self::user(),
            'tasks'   => self::tasks(),
            'done'    => 3,
            'total'   => 5,
            'percent' => 58,
            'overdue' => 1,
            'next'    => (object) ['title' => 'Revisar proposta comercial', 'project' => 'Acme', 'step' => '2 de 4'],
        ];
    }

    public static function projects(): array
    {
        return [
            (object) ['id' => 'lancamento-acme', 'name' => 'Lançamento Acme', 'percent' => 62, 'health' => 'no-prazo',  'overdue' => 0],
            (object) ['id' => 'site-beta',       'name' => 'Site Beta',       'percent' => 38, 'health' => 'risco',     'overdue' => 2],
            (object) ['id' => 'app-flow',        'name' => 'App Flow',        'percent' => 85, 'health' => 'no-prazo',  'overdue' => 0],
        ];
    }

    public static function project(string $id): object
    {
        return (object) [
            'id'       => $id,
            'name'     => 'Lançamento Acme',
            'subtitle' => 'Site institucional + landing de campanha · entrega 12 jul',
            'percent'  => 62,
            'health'   => 'no-prazo',
            'done'     => 8,
            'total'    => 13,
            'members'  => [
                (object) ['initials' => 'AC', 'tone' => 'teal'],
                (object) ['initials' => 'JM', 'tone' => 'indigo'],
                (object) ['initials' => 'RS', 'tone' => 'amber'],
            ],
            'extra_members' => 2,
            'stages'   => [
                (object) ['name' => 'Descoberta',      'status' => 'concluida', 'done' => 3, 'total' => 3, 'percent' => 100, 'subtasks' => []],
                (object) ['name' => 'Design',          'status' => 'andamento', 'done' => 3, 'total' => 5, 'percent' => 60, 'subtasks' => [
                    (object) ['title' => 'Wireframes do app',   'status' => 'andamento', 'running' => true,  'elapsed' => '00:42:18', 'assignee_initials' => 'AC', 'assignee_tone' => 'teal'],
                    (object) ['title' => 'Copy da landing page','status' => 'revisao',   'running' => false, 'elapsed' => null,       'assignee_initials' => 'JM', 'assignee_tone' => 'indigo'],
                    (object) ['title' => 'Protótipo navegável', 'status' => 'pendente',  'running' => false, 'elapsed' => null,       'assignee_initials' => 'RS', 'assignee_tone' => 'amber'],
                ]],
                (object) ['name' => 'Desenvolvimento', 'status' => 'pendente',  'done' => 0, 'total' => 5, 'percent' => 0,  'subtasks' => []],
                (object) ['name' => 'Lançamento',      'status' => 'pendente',  'done' => 0, 'total' => 2, 'percent' => 0,  'subtasks' => []],
            ],
            // larguras relativas dos segmentos da barra-assinatura (proporção das etapas)
            'segments' => [
                ['v' => 100, 'tone' => 'success'],
                ['v' => 60,  'tone' => 'brand'],
                ['v' => 0,   'tone' => 'brand'],
                ['v' => 0,   'tone' => 'brand'],
            ],
        ];
    }

    public static function relatorios(): array
    {
        return [
            'summary' => [
                (object) ['label' => 'Concluídas',       'value' => '28',  'note' => '+6 vs. semana passada', 'tone' => 'success'],
                (object) ['label' => 'Horas registradas','value' => '47h', 'note' => '12 sessões',            'tone' => 'muted'],
                (object) ['label' => 'No prazo',          'value' => '4/5', 'note' => 'projetos saudáveis',    'tone' => 'success'],
                (object) ['label' => 'Atrasadas',         'value' => '3',   'note' => 'precisam de atenção',   'tone' => 'danger'],
            ],
            'projects' => self::projects(),
            'hours' => [
                (object) ['initials' => 'AC', 'tone' => 'teal',    'name' => 'Ana Costa',  'pct' => 90, 'hours' => '18h'],
                (object) ['initials' => 'JM', 'tone' => 'indigo',  'name' => 'João Melo',  'pct' => 70, 'hours' => '14h'],
                (object) ['initials' => 'RS', 'tone' => 'amber',   'name' => 'Rafa Souza', 'pct' => 45, 'hours' => '9h'],
                (object) ['initials' => 'AL', 'tone' => 'neutral', 'name' => 'Alisson',    'pct' => 30, 'hours' => '6h'],
            ],
        ];
    }
}
