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
7. **Given** uma verificação já concluída e usada para abrir uma validade, **When** a mesma verificação é enviada de novo, **Then** ela é recusada e a falha é registrada.
8. **Given** um visitante verificado em uma aba, **When** ele abre a outra tela em uma nova aba do mesmo navegador, **Then** consulta sem nova verificação.
9. **Given** um visitante digitando na busca, **When** a verificação expira durante a digitação, **Then** a nova verificação acontece automaticamente e as sugestões aparecem para o texto digitado, sem apagá-lo.

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
7. **Given** 3 visitantes na mesma rede, cada um fazendo até 30 consultas por minuto, **When** usam as telas ao mesmo tempo, **Then** nenhum deles é bloqueado.
8. **Given** um acesso bloqueado, **When** ele tenta iniciar uma nova verificação, **Then** a tentativa também é recusada até o fim do bloqueio.

---

### Edge Cases

- **Várias abas**: o visitante abre as duas telas em abas diferentes; a verificação feita em uma vale para a outra enquanto estiver válida.
- **Expiração no meio da digitação**: a verificação expira enquanto o visitante digita na busca; a nova verificação acontece sem perder o texto digitado.
- **Navegador sem suporte**: o navegador não consegue executar a verificação (por exemplo, com recursos essenciais desativados); a tela explica o motivo e o que fazer.
- **Rede compartilhada**: várias pessoas acessam pela mesma rede (escola, empresa) e aparecem como um mesmo acesso; o limite comporta até 3 pessoas em uso normal simultâneo na mesma rede sem bloqueio.
- **Bloqueio durante a verificação**: um acesso bloqueado também não consegue iniciar novas verificações até o fim do bloqueio.
- **Robô que não se identifica**: não é recusado pela identificação; é contido pela verificação e pelo limite de consultas.
- **Verificação reaproveitada**: a mesma verificação concluída não pode ser usada para abrir uma segunda validade; a tentativa é recusada e registrada como falha.
- **Verificação copiada para outros acessos**: se a validade de um navegador for copiada para outros acessos, cada acesso continua sujeito ao próprio limite de consultas.
- **Aba em segundo plano**: ao voltar a uma aba cuja verificação expirou, a próxima consulta refaz a verificação automaticamente (FR-005).
- **JavaScript desativado**: a página informa que a consulta exige JavaScript ativado.
- **Falha ao gravar registros**: se os registros não puderem ser gravados, a verificação e o limite continuam funcionando.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema NÃO DEVE exigir cadastro, login, e-mail ou qualquer dado pessoal para consultar.
- **FR-002**: O sistema DEVE verificar automaticamente, ao abrir qualquer tela, que o acesso vem de um navegador em uso, sem exigir interação do visitante na maioria dos casos.
- **FR-003**: O sistema DEVE recusar consultas de acessos que não passaram pela verificação ou cuja verificação expirou.
- **FR-004**: A verificação DEVE valer por 30 minutos contados a partir da verificação (sem renovação pelo uso), para todas as telas e abas do mesmo navegador.
- **FR-005**: Ao expirar a verificação, o sistema DEVE refazê-la automaticamente e concluir a consulta pendente, sem perder o que o visitante digitou ou escolheu.
- **FR-006**: Durante a verificação, a tela DEVE exibir uma indicação discreta de que a verificação está em andamento, com os campos de consulta desabilitados e a explicação do motivo disponível para leitores de tela.
- **FR-007**: Em caso de falha na verificação, o sistema DEVE explicar o problema em português e oferecer uma forma de tentar de novo.
- **FR-008**: O sistema DEVE limitar cada acesso a 120 requisições por minuto, contando consultas e requisições da própria verificação; ao ultrapassar, o acesso fica bloqueado por 1 minuto a partir do momento do excesso.
- **FR-009**: Ao ultrapassar o limite, o sistema DEVE recusar as consultas do acesso até o fim do bloqueio e exibir mensagem em português informando que é preciso aguardar.
- **FR-010**: O limite DEVE comportar o uso normal das duas telas, incluindo as sugestões exibidas durante a digitação, sem que um visitante individual o atinja. Uso normal: até 30 consultas por minuto por visitante.
- **FR-011**: O sistema DEVE recusar acessos que se identificam como robôs de IA presentes na lista mantida pelo responsável (lista inicial no plano da funcionalidade).
- **FR-012**: O sistema DEVE publicar regras para robôs indicando que as consultas não devem ser acessadas por nenhum robô e que robôs de IA não devem acessar nenhuma página; robôs de busca comuns podem acessar as páginas.
- **FR-013**: A lista de robôs de IA recusados DEVE poder ser atualizada pelo responsável sem alterar o comportamento das telas.
- **FR-014**: Todos os textos exibidos pela verificação e pelo bloqueio DEVEM estar em português do Brasil.
- **FR-015**: A verificação e as mensagens de bloqueio DEVEM ser acessíveis por teclado e leitores de tela; a contagem regressiva do bloqueio é anunciada apenas no início e no fim, não a cada segundo.
- **FR-016**: O sistema DEVE registrar cada bloqueio por excesso de consultas e cada falha de verificação, com data, hora, tipo do evento e um identificador embaralhado do acesso, que permite reconhecer o mesmo acesso em eventos diferentes, mas não permite recuperar o endereço de rede sem a chave secreta da aplicação.
- **FR-017**: Os registros NÃO DEVEM conter o endereço de rede em claro nem qualquer outro dado que identifique o visitante, e DEVEM ser descartados após 7 dias, contados por dia civil em UTC.
- **FR-018**: O responsável DEVE conseguir consultar os registros dos últimos 7 dias para avaliar se o limite está adequado.
- **FR-019**: Nenhum outro registro da aplicação (registros de requisições do servidor e do servidor web) DEVE conter o endereço de rede do visitante.
- **FR-020**: Uma falha ao gravar os registros NÃO DEVE interromper a verificação nem o limite de consultas.
- **FR-021**: Após o fim do bloqueio, os campos voltam a funcionar sem recarregar a página; a consulta recusada não é repetida automaticamente.
- **FR-022**: Com JavaScript desativado, a página DEVE informar que a consulta exige JavaScript.

### Key Entities *(include if feature involves data)*

- **Verificação**: confirmação de que o acesso vem de um navegador em uso; tem momento de criação e validade; vale para todas as telas do mesmo navegador.
- **Acesso**: origem das consultas, usada para contar consultas por período: o endereço de rede de origem ou, em redes com muitos endereços por cliente, o bloco de endereços desse cliente; várias pessoas na mesma rede podem aparecer como um mesmo acesso.
- **Bloqueio**: período em que um acesso que ultrapassou o limite tem as consultas recusadas.
- **Regras para robôs**: orientação pública sobre o que robôs podem ou não acessar.
- **Registro de proteção**: evento de bloqueio ou de falha de verificação, com data, hora, tipo e identificador embaralhado do acesso; mantido por 7 dias.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nas versões atuais de Chrome, Firefox, Safari e Edge, em computador e em celular intermediário, a verificação termina em até 3 segundos em pelo menos 95% das aberturas de página, sem ação do visitante.
- **SC-002**: Um visitante fazendo até 30 consultas por minuto nas duas telas, por 10 minutos, não é bloqueado nem verificado mais de uma vez, a não ser pela expiração da verificação.
- **SC-003**: 100% das consultas feitas sem verificação válida são recusadas.
- **SC-004**: 100% das consultas acima do limite são recusadas até o fim do bloqueio, e voltam a ser aceitas depois dele.
- **SC-005**: 100% dos acessos que se identificam como um dos robôs de IA da lista mantida pelo responsável são recusados.
- **SC-006**: Após a expiração da verificação, o visitante conclui a consulta seguinte sem redigitar nada.
- **SC-007**: 100% dos bloqueios e das falhas de verificação ficam registrados; nenhum registro da aplicação contém o endereço de rede em claro, e nenhum registro de proteção tem mais de 7 dias.

## Clarifications

### Session 2026-09-25

- Q: Por quanto tempo a verificação vale? → A: 30 minutos.
- Q: Qual o limite de consultas e a duração do bloqueio? → A: 120 consultas por minuto por acesso; bloqueio de 1 minuto.
- Q: O responsável deve ver registros de bloqueios e falhas de verificação, e eles podem guardar o endereço de rede? → A: Registrar cada bloqueio e falha com data, hora e identificador embaralhado do acesso (sem o endereço real), por 7 dias.

### Session 2026-09-25 (revisão dos checklists)

- Q: As requisições da verificação contam no limite? → A: Sim; o limite conta todas as requisições do acesso.
- Q: A validade de 30 minutos é renovada pelo uso? → A: Não; conta a partir da verificação.
- Q: O identificador embaralhado é anônimo? → A: Não; é pseudonimizado e depende do sigilo da chave (ver Assumptions).

## Assumptions

- A aplicação roda localmente na primeira versão; a proteção é validada por testes, não por tráfego real.
- Modelo de ameaça: o objetivo é conter consultas automatizadas em massa (raspagem, carga excessiva) e robôs de IA declarados. Aceita-se que passem: um programa isolado que respeite o limite, navegadores automatizados que resolvam a verificação e robôs que não se identificam, dentro do limite de consultas.
- O identificador embaralhado é um dado pseudonimizado: quem tiver a chave secreta consegue testar endereços até encontrar o correspondente. Por isso ele ainda pode ser dado pessoal pela LGPD; a proteção depende de a chave permanecer em segredo e de o descarte em 7 dias ser cumprido.
- Ao expor a aplicação na internet, HTTPS e a validade transmitida apenas por conexão segura passam a ser obrigatórios (ADR 0016).
- Nenhum serviço de terceiros é usado; nenhum dado do visitante é enviado para fora da aplicação.
- O navegador do visitante precisa executar os recursos padrão da web para passar pela verificação.
- Os valores de validade da verificação, limite de consultas e duração do bloqueio podem ser ajustados pelo responsável sem mudar o comportamento descrito aqui.
- O visual da indicação de verificação e das mensagens é definido no plano de design; esta spec define apenas conteúdo e comportamento.
- Os fluxos de verificação, expiração e bloqueio são validados por testes de ponta a ponta próprios.
