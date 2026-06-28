{{-- Campo de formulário com label / erro / hint.
     <x-field label="E-mail" name="email" :value="old('email')" error="@error('email'){{ $message }}@enderror" />
     Foco com anel teal (ação criativa); erro com anel vermelho. --}}
@props([
    'label' => null,
    'type'  => 'text',
    'hint'  => null,
    'error' => null,
])
@php
    $ring = $error
        ? 'border-danger focus-within:border-danger'
        : 'border-hair focus-within:border-brand';
@endphp
<label class="block">
    @if ($label)
        <span class="block mb-[7px] text-[11px] font-bold uppercase tracking-[.07em] text-muted">{{ $label }}</span>
    @endif
    <span class="flex items-center gap-2 rounded-xl border-[1.5px] {{ $ring }} bg-canvas px-[13px] py-[11px] transition-colors">
        <input
            type="{{ $type }}"
            {{ $attributes->merge(['class' => 'flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold text-ink placeholder:text-muted/70']) }}
        />
        {{ $slot }} {{-- ícone opcional (ex.: olho de senha) --}}
    </span>
    @if ($error)
        <span class="block mt-[5px] text-[11px] font-semibold text-danger-ink">{{ $error }}</span>
    @elseif ($hint)
        <span class="block mt-[5px] text-[11px] text-muted">{{ $hint }}</span>
    @endif
</label>
