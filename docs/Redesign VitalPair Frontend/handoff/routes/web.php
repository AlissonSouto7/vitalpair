<?php

use Illuminate\Support\Facades\Route;
use App\Support\MockData;

/*
|--------------------------------------------------------------------------
| Flowpj — rotas (mock data, sem backend ainda)
|--------------------------------------------------------------------------
| Closures por enquanto pra rodar de imediato. Troque por controllers
| quando o Livewire entrar. Nomes batem com layouts/app.blade.php.
*/

Route::get('/', function () {
    return view('meu-espaco', MockData::meuEspaco());
})->name('home');

Route::get('/projetos', function () {
    return view('projetos', ['projects' => MockData::projects()]);
})->name('projects.index');

Route::get('/projetos/{project}', function (string $project) {
    return view('projeto', ['project' => MockData::project($project)]);
})->name('projects.show');

Route::get('/relatorios', function () {
    return view('relatorios', MockData::relatorios());
})->name('reports');

Route::get('/configuracoes', function () {
    return view('configuracoes', ['user' => MockData::user()]);
})->name('settings');

/*
| Páginas de erro standalone — em produção o Laravel resolve via
| resources/views/errors/{code}.blade.php automaticamente. Estas rotas
| existem só pra você previsualizar cada uma.
*/
foreach (['404', '500', '403', '419', '503'] as $code) {
    Route::get("/erro/{$code}", fn () => response()->view("errors.$code", [], (int) $code));
}

// Auth: gere com Laravel Breeze (Blade) e re-skine usando o mockup "Autenticação".
require __DIR__ . '/auth.php';
