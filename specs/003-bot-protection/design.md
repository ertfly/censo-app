# Design: verificação e bloqueio

Elementos transversais às duas telas. Seguem o
[sistema visual](../../.harness/design-system.md). Plano feito com a skill
`frontend-design` (Princípio IX).

## Ideia

A proteção deve ser quase invisível. Nada de caixa de "não sou um robô" no
meio da tela: a verificação vive no menu fixo, no canto direito, como um
status discreto. Só ocupa espaço quando exige ação (falha ou bloqueio).

## Menu fixo com status

```
┌──────────────────────────────────────────────────────────────────────┐
│ Censo 2022      Busca de cidades   Busca por estado    ◌ Verificando │
└──────────────────────────────────────────────────────────────────────┘
                              após a verificação, o status some ─────┘
```

| Estado | No menu | Na tela |
|---|---|---|
| Verificando | "Verificando o navegador" em Tinta diluída, com indicador circular pequeno | Campos visíveis e desabilitados até concluir |
| Verificado | Nada | Campos habilitados |
| Reverificando (sessão expirou) | "Verificando o navegador" | Nada muda; a consulta pendente conclui sozinha |
| Falha | "Verificação não concluída" em Tinta azulada | Aviso acima do conteúdo com o botão "Tentar de novo" |
| Bloqueado | — | Aviso acima do conteúdo com contagem regressiva; campos desabilitados até o fim |

## Aviso de bloqueio

```
┌──────────────────────────────────────────────────────────────────────┐
│ Você fez muitas consultas em pouco tempo.                            │
│ Aguarde 42 segundos para consultar de novo.                          │
└──────────────────────────────────────────────────────────────────────┘
```

- Faixa em Folha com borda esquerda de 4px em Ciano de marcação; sem ícone de
  alerta vermelho (não é erro do visitante nem falha do sistema).
- A contagem regressiva é atualizada a cada segundo visualmente e anunciada
  a leitores de tela só no início e no fim.
- Ao terminar, o aviso some e os campos voltam a funcionar, sem recarregar.

## Aviso de falha

Mesmo formato, texto "A verificação automática não foi concluída." e botão
"Tentar de novo". Com navegador sem suporte, o texto explica o motivo e não há
botão.

## Celular

O status do menu vira só o indicador circular com rótulo acessível; os avisos
ocupam a largura total, acima do conteúdo.

## Acessibilidade

- Status do menu em região `aria-live="polite"`.
- Avisos de falha e bloqueio com `role="alert"` ao aparecer.
- Campos desabilitados com `aria-disabled` e explicação associada.
