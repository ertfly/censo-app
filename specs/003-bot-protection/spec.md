# Feature Specification: Proteção contra bots

**Feature Branch**: `003-bot-protection` (sem branch; trabalho direto na `main`)

**Created**: 2026-09-25

**Status**: Draft

**Input**: Histórias US05 e US06 de `docs/user-stories.md`: permitir consultas sem cadastro, com verificação automática que não atrapalhe o visitante, e limitar consultas automatizadas em massa. Transversal às telas "Busca de cidades" e "Busca por estado".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar sem cadastro, com verificação automática (Priority: P1)

O visitante abre qualquer uma das telas e começa a consultar sem criar conta nem informar e-mail. Ao abrir a página, uma verificação automática confirma que o acesso vem de um navegador em uso por uma pessoa. Na maioria dos casos, o visitante não precisa fazer nada. Depois de verificado, ele consulta à vontade durante o período de validade da verificação.

**Why this priority**: as consultas só ficam disponíveis após a verificação; sem ela funcionando, nenhuma das duas telas pode ser usada.

**Independent Test**: abrir cada tela em um navegador comum, confirmar que a verificação acontece sozinha e que as consultas funcionam em seguida; repetir após a verificação expirar; e tentar consultar sem ter passado pela verificação, confirmando a recusa.

**Acceptance Scenarios**:

1. **Given** um visitante que acabou de abrir uma das telas, **When** a página carrega, **Then** nenhuma tela pede cadastro, login ou e-mail, e a verificação acontece sem exigir ação do visitante.
2. **Given** a verificação em andamento, **When** o visitante olha a tela, **Then** vê uma indicação discreta de que a verificação está acontecendo, e os campos de consulta ficam disponíveis assim que ela termina.
3. **Given** um visitante verificado, **When** ele faz várias consultas seguidas nas duas telas, **Then** não é verificado de novo a cada consulta.
4. **Given** um visitante cuja verificação expirou, **When** ele faz uma nova consulta, **Then** a verificação acontece de novo automaticamente e a consulta é concluída, sem apagar o que ele tinha digitado ou escolhido.
5. **Given** uma verificação que falhou, **When** a falha acontece, **Then** a tela explica o que houve em português e oferece uma forma de tentar de novo.
6. **Given** um acesso que tenta consultar sem ter passado pela verificação, **When** a consulta é feita, **Then** ela é recusada.

---

### User Story 2 - Limitar acessos automatizados (Priority: P1)

O responsável pela aplicação quer que consultas em massa, feitas por programas, sejam limitadas, para que a aplicação continue disponível para os visitantes. Quem ultrapassa o limite de consultas por período fica bloqueado por um tempo. Robôs de IA que se identificam como tal são recusados.

**Why this priority**: sem limite, um único programa consultando em massa pode deixar a aplicação indisponível para todos.

**Independent Test**: disparar consultas acima do limite a partir de um mesmo acesso e confirmar o bloqueio temporário e a mensagem; aguardar o fim do bloqueio e confirmar que as consultas voltam a funcionar; simular o uso normal das duas telas e confirmar que o limite não é atingido; acessar se identificando como robô de IA e confirmar a recusa.

**Acceptance Scenarios**:

1. **Given** um mesmo acesso, **When** ele ultrapassa o limite de consultas por período, **Then** as consultas seguintes são recusadas até o fim do bloqueio.
2. **Given** um visitante bloqueado, **When** ele tenta consultar, **Then** vê uma mensagem em português informando que fez muitas consultas em pouco tempo e que deve aguardar.
3. **Given** o fim do período de bloqueio, **When** o visitante consulta de novo, **Then** a consulta funciona normalmente.
4. **Given** um visitante usando as telas normalmente (digitando nomes na busca, escolhendo UFs, trocando de município), **When** ele usa a aplicação por 10 minutos seguidos, **Then** nunca atinge o limite.
5. **Given** um acesso que se identifica como robô de IA, **When** ele tenta abrir qualquer página ou consultar, **Then** é recusado.
6. **Given** um robô de busca ou de IA que respeita as regras publicadas para robôs, **When** ele lê essas regras, **Then** encontra a indicação de que as consultas não devem ser acessadas por robôs.

---

### Edge Cases

- **Várias abas**: o visitante abre as duas telas em abas diferentes; a verificação feita em uma vale para a outra enquanto estiver válida.
- **Expiração no meio da digitação**: a verificação expira enquanto o visitante digita na busca; a nova verificação acontece sem perder o texto digitado.
- **Navegador sem suporte**: o navegador não consegue executar a verificação (por exemplo, com recursos essenciais desativados); a tela explica o motivo e o que fazer.
- **Rede compartilhada**: várias pessoas acessam pela mesma rede (escola, empresa) e aparecem como um mesmo acesso; o limite precisa comportar esse uso sem bloquear visitantes legítimos na maioria dos casos.
- **Bloqueio durante a verificação**: um acesso bloqueado também não consegue iniciar novas verificações até o fim do bloqueio.
- **Robô que não se identifica**: não é recusado pela identificação; é contido pela verificação e pelo limite de consultas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema NÃO DEVE exigir cadastro, login, e-mail ou qualquer dado pessoal para consultar.
- **FR-002**: O sistema DEVE verificar automaticamente, ao abrir qualquer tela, que o acesso vem de um navegador em uso, sem exigir interação do visitante na maioria dos casos.
- **FR-003**: O sistema DEVE recusar consultas de acessos que não passaram pela verificação ou cuja verificação expirou.
- **FR-004**: A verificação DEVE valer por [NEEDS CLARIFICATION: quanto tempo a verificação vale antes de ser refeita? Ver pergunta Q1], para todas as telas e abas do mesmo navegador.
- **FR-005**: Ao expirar a verificação, o sistema DEVE refazê-la automaticamente e concluir a consulta pendente, sem perder o que o visitante digitou ou escolheu.
- **FR-006**: Durante a verificação, a tela DEVE exibir uma indicação discreta de que a verificação está em andamento.
- **FR-007**: Em caso de falha na verificação, o sistema DEVE explicar o problema em português e oferecer uma forma de tentar de novo.
- **FR-008**: O sistema DEVE limitar a quantidade de consultas por acesso a [NEEDS CLARIFICATION: qual o limite de consultas por período e quanto tempo dura o bloqueio? Ver pergunta Q2].
- **FR-009**: Ao ultrapassar o limite, o sistema DEVE recusar as consultas do acesso até o fim do bloqueio e exibir mensagem em português informando que é preciso aguardar.
- **FR-010**: O limite DEVE comportar o uso normal das duas telas, incluindo as sugestões exibidas durante a digitação, sem que um visitante individual o atinja.
- **FR-011**: O sistema DEVE recusar acessos que se identificam como robôs de IA conhecidos.
- **FR-012**: O sistema DEVE publicar regras para robôs indicando que as consultas não devem ser acessadas por robôs e que robôs de IA não devem acessar nenhuma página.
- **FR-013**: A lista de robôs de IA recusados DEVE poder ser atualizada pelo responsável sem alterar o comportamento das telas.
- **FR-014**: Todos os textos exibidos pela verificação e pelo bloqueio DEVEM estar em português do Brasil.
- **FR-015**: A verificação e as mensagens de bloqueio DEVEM ser acessíveis por teclado e leitores de tela.

### Key Entities *(include if feature involves data)*

- **Verificação**: confirmação de que o acesso vem de um navegador em uso; tem momento de criação e validade; vale para todas as telas do mesmo navegador.
- **Acesso**: origem das consultas, usada para contar consultas por período; várias pessoas na mesma rede podem aparecer como um mesmo acesso.
- **Bloqueio**: período em que um acesso que ultrapassou o limite tem as consultas recusadas.
- **Regras para robôs**: orientação pública sobre o que robôs podem ou não acessar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em navegadores atuais, a verificação termina em até 3 segundos em pelo menos 95% das aberturas de página, sem ação do visitante.
- **SC-002**: Um visitante usando as duas telas normalmente por 10 minutos não é bloqueado nem verificado mais de uma vez, a não ser pela expiração da verificação.
- **SC-003**: 100% das consultas feitas sem verificação válida são recusadas.
- **SC-004**: 100% das consultas acima do limite são recusadas até o fim do bloqueio, e voltam a ser aceitas depois dele.
- **SC-005**: 100% dos acessos que se identificam como os robôs de IA listados são recusados.
- **SC-006**: Após a expiração da verificação, o visitante conclui a consulta seguinte sem redigitar nada.

## Assumptions

- A aplicação roda localmente na primeira versão; a proteção é validada por testes, não por tráfego real.
- A proteção encarece o abuso, mas não impede um programa isolado e paciente de consultar; isso é aceito.
- Nenhum serviço de terceiros é usado; nenhum dado do visitante é enviado para fora da aplicação.
- O navegador do visitante precisa executar os recursos padrão da web para passar pela verificação.
- Os valores de validade da verificação, limite de consultas e duração do bloqueio podem ser ajustados pelo responsável sem mudar o comportamento descrito aqui.
- O visual da indicação de verificação e das mensagens é definido no plano de design; esta spec define apenas conteúdo e comportamento.
- Os fluxos de verificação, expiração e bloqueio são validados por testes de ponta a ponta próprios.
