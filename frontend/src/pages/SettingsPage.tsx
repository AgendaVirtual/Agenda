import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "../components/AppShell";
import { DotBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, SectionTitle } from "../components/ui/Card";
import { Field, SelectInput, TextInput } from "../components/ui/Field";
import { ErrorBanner, LoadingState } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import {
  CATEGORY_EDIT_SUPPORTED,
  createCategory,
  getCategories,
} from "../services/categoryApi";
import {
  lerPreferencias,
  salvarPreferencias,
  type Preferencias,
} from "../services/preferencias";
import type { Category } from "../types/entities";
import { atualizarConta, trocarSenha } from "../services/authApi";
import { useSessao } from "../services/sessaoContexto";

const PALETA_SUGERIDA = [
  { hex: "#1971C2", nome: "Azul" },
  { hex: "#C92A2A", nome: "Vermelho" },
  { hex: "#37A34A", nome: "Verde" },
  { hex: "#D9770E", nome: "Âmbar" },
  { hex: "#8E44D0", nome: "Roxo" },
  { hex: "#11919E", nome: "Turquesa" },
];

const HORAS = Array.from({ length: 23 }, (_, i) => i + 1);

function primeiraCorLivre(usadas: string[]): string {
  const emUso = new Set(usadas.map((c) => c.toLowerCase()));

  const sugerida = PALETA_SUGERIDA.find((c) => !emUso.has(c.hex.toLowerCase()));
  if (sugerida) return sugerida.hex;

  for (let matiz = 0; matiz < 360; matiz += 15) {
    const hex = hslParaHex(matiz, 0.62, 0.42);
    if (!emUso.has(hex.toLowerCase())) return hex;
  }
  return "#5A6072";
}

function hslParaHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const canal = (n: number) => {
    const k = (n + h / 30) % 12;
    const cor = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(cor * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`.toUpperCase();
}

export function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferencias>(() => lerPreferencias());
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    getCategories()
      .then((lista) => ativo && setCategorias(lista))
      .catch((e: Error) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  function atualizar(parcial: Partial<Preferencias>) {
    setPrefs(salvarPreferencias(parcial));
  }

  async function criarCategoria(nome: string, cor: string) {
    const nova = await createCategory({ name: nome, color: cor });
    setCategorias((antes) => [...antes, nova]);
    setFormAberto(false);
    setErro(null);
  }

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Seus dados, suas categorias e como o Nexo organiza o seu dia."
      />

      {erro && (
        <div className="mb-6">
          <ErrorBanner message={erro} onDismiss={() => setErro(null)} />
        </div>
      )}

      <div className="anim-rise-late flex max-w-3xl flex-col gap-3">
        <Perfil />

        <Card>
          <SectionTitle
            action={
              <Button size="sm" onClick={() => setFormAberto(true)}>
                Nova categoria
              </Button>
            }
          >
            Categorias
          </SectionTitle>

          {carregando ? (
            <LoadingState label="Carregando categorias..." />
          ) : (
            <ListaDeCategorias categorias={categorias} />
          )}
        </Card>

        <Turnos prefs={prefs} onChange={atualizar} />
        <Seguranca />
        <Sessao />
      </div>

      <Modal
        open={formAberto}
        onClose={() => setFormAberto(false)}
        title="Nova categoria"
        description="A cor identifica a categoria nas tarefas, nas metas e nos relatórios."
      >
        <FormularioDeCategoria
          usadas={categorias.map((c) => c.color.toLowerCase())}
          onSubmit={criarCategoria}
          onCancel={() => setFormAberto(false)}
        />
      </Modal>
    </>
  );
}

function Perfil() {
  const { conta, atualizou } = useSessao();
  const [nome, setNome] = useState(conta?.name ?? "");
  const [email, setEmail] = useState(conta?.email ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const mudou = nome !== (conta?.name ?? "") || email !== (conta?.email ?? "");

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      atualizou(await atualizarConta({ name: nome, email }));
      setSalvo(true);
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Perfil</SectionTitle>

      {erro && (
        <div className="mb-4">
          <ErrorBanner message={erro} onDismiss={() => setErro(null)} />
        </div>
      )}

      <form onSubmit={(e) => void salvar(e)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome" hint="Aparece nas iniciais do avatar, na lateral.">
            {(id) => (
              <TextInput
                id={id}
                value={nome}
                placeholder="Como você quer ser chamado"
                onChange={(e) => {
                  setNome(e.target.value);
                  setSalvo(false);
                }}
                required
              />
            )}
          </Field>

          <Field label="E-mail" hint="É com ele que você entra.">
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={email}
                placeholder="voce@ufape.br"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSalvo(false);
                }}
                required
              />
            )}
          </Field>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" disabled={!mudou || salvando}>
            {salvando ? "Salvando..." : "Salvar perfil"}
          </Button>
          {salvo && !mudou && (
            <span className="text-[13px] text-ink-muted">Perfil salvo.</span>
          )}
        </div>
      </form>
    </Card>
  );
}
function ListaDeCategorias({ categorias }: { categorias: Category[] }) {
  if (categorias.length === 0) {
    return (
      <p className="py-4 text-sm font-light text-ink-muted">
        Nenhuma categoria ainda.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-hairline">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="flex min-h-14 flex-wrap items-center gap-3 py-1.5"
          >
            <DotBadge color={categoria.color}>{categoria.name}</DotBadge>
            <span className="tabular text-[13px] font-light text-ink-faint">
              {categoria.color.toUpperCase()}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled>
                Editar
              </Button>
              <Button variant="ghost-danger" size="sm" disabled>
                Remover
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {!CATEGORY_EDIT_SUPPORTED && (
        <p className="pt-3 text-[13px] font-light text-ink-faint">
          Editar e remover ficam disponíveis quando o backend expuser
          <code className="mx-1 rounded-xs bg-canvas px-1">PUT</code>e
          <code className="mx-1 rounded-xs bg-canvas px-1">DELETE</code>
          de categoria. Criar já funciona.
        </p>
      )}
    </>
  );
}

function Turnos({
  prefs,
  onChange,
}: {
  prefs: Preferencias;
  onChange: (p: Partial<Preferencias>) => void;
}) {
  const { tarde, noite } = prefs.turnos;

  return (
    <Card>
      <SectionTitle>Faixas de turno</SectionTitle>
      <p className="mb-4 text-sm font-light text-ink-muted">
        Definem em que seção uma tarefa com horário cai em Meu dia. A manhã vai
        do início do dia até o começo da tarde.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tarde começa às">
          {(id) => (
            <SelectInput
              id={id}
              value={tarde}
              onChange={(e) =>
                onChange({
                  turnos: { ...prefs.turnos, tarde: Number(e.target.value) },
                })
              }
            >
              {HORAS.filter((h) => h < noite).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label="Noite começa às">
          {(id) => (
            <SelectInput
              id={id}
              value={noite}
              onChange={(e) =>
                onChange({
                  turnos: { ...prefs.turnos, noite: Number(e.target.value) },
                })
              }
            >
              {HORAS.filter((h) => h > tarde).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>

      <p className="mt-4 text-[13px] font-light text-ink-faint">
        Vale só nesta tela por enquanto. O relatório de turno mais produtivo é
        calculado no servidor, que ainda usa 12:00 e 18:00 fixos, então os dois
        podem discordar até a preferência subir para lá.
      </p>
    </Card>
  );
}

function Seguranca() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await trocarSenha({ currentPassword: atual, newPassword: nova });
      setAtual("");
      setNova("");
      setPronto(true);
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Senha e segurança</SectionTitle>

      {erro && (
        <div className="mb-4">
          <ErrorBanner message={erro} onDismiss={() => setErro(null)} />
        </div>
      )}

      <form onSubmit={(e) => void salvar(e)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Senha atual">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                value={atual}
                autoComplete="current-password"
                onChange={(e) => {
                  setAtual(e.target.value);
                  setPronto(false);
                }}
                required
              />
            )}
          </Field>

          <Field label="Nova senha" hint="Ao menos 8 caracteres.">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                value={nova}
                autoComplete="new-password"
                minLength={8}
                onChange={(e) => {
                  setNova(e.target.value);
                  setPronto(false);
                }}
                required
              />
            )}
          </Field>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" disabled={salvando || !atual || nova.length < 8}>
            {salvando ? "Trocando..." : "Trocar senha"}
          </Button>
          {pronto && (
            <span className="text-[13px] text-ink-muted">
              Senha trocada. As outras sessões foram encerradas.
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

// No celular a lateral nao existe, entao este e o unico caminho para sair.
function Sessao() {
  const { conta, sair } = useSessao();
  const [saindo, setSaindo] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function encerrar() {
    setSaindo(true);
    setFalhou(false);
    try {
      await sair();
    } catch {
      setFalhou(true);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Sessão</SectionTitle>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-light text-ink-muted">
          Você está nesta conta como{" "}
          <span className="font-medium text-ink">
            {conta?.email ?? "sua conta"}
          </span>
          .
        </p>

        <Button
          variant="secondary"
          onClick={() => void encerrar()}
          disabled={saindo}
        >
          {saindo ? "Saindo..." : falhou ? "Não deu; tentar de novo" : "Sair"}
        </Button>
      </div>
    </Card>
  );
}

function FormularioDeCategoria({
  usadas,
  onSubmit,
  onCancel,
}: {
  usadas: string[];
  onSubmit: (nome: string, cor: string) => Promise<void>;
  onCancel: () => void;
}) {
  const primeiraLivre = useMemo(() => primeiraCorLivre(usadas), [usadas]);

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(primeiraLivre);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const corRepetida = usadas.includes(cor.toLowerCase());

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) {
      setErro("Dê um nome à categoria.");
      return;
    }

    setEnviando(true);
    try {
      await onSubmit(nome.trim(), cor);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para criar a categoria.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <Field label="Nome" error={erro ?? undefined}>
        {(id, invalido) => (
          <TextInput
            id={id}
            invalid={invalido}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Extensão"
          />
        )}
      </Field>

      <fieldset className="flex flex-col">
        <legend className="mb-2 text-sm font-medium text-ink">Cor</legend>

        <div className="flex flex-wrap gap-2">
          {PALETA_SUGERIDA.map((opcao) => {
            const emUso = usadas.includes(opcao.hex.toLowerCase());
            const escolhida = cor === opcao.hex;

            return (
              <button
                key={opcao.hex}
                type="button"
                disabled={emUso}
                onClick={() => setCor(opcao.hex)}
                aria-pressed={escolhida}
                aria-label={emUso ? `${opcao.nome} (já usada)` : opcao.nome}
                title={emUso ? `${opcao.nome} já está em uso` : opcao.nome}
                className={
                  "flex h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors " +
                  (escolhida
                    ? "bg-canvas font-medium text-ink"
                    : "text-ink-muted hover:bg-canvas/60 hover:text-ink") +
                  (emUso ? " cursor-not-allowed opacity-30" : "")
                }
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-pill"
                  style={{ backgroundColor: opcao.hex }}
                />
                {opcao.nome}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[13px] font-light text-ink-faint">
          Estas seis foram testadas para daltonismo. Cores em uso aparecem
          apagadas porque o servidor recusa cor repetida.
        </p>

        <label className="mt-3 flex h-11 w-fit items-center gap-2.5 rounded-md px-2.5 text-sm text-ink-muted transition-colors hover:bg-canvas/60 hover:text-ink">
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value.toUpperCase())}
            className="h-6 w-6 shrink-0 cursor-pointer rounded-sm border border-hairline bg-transparent p-0"
          />
          Outra cor
          <span className="tabular text-[13px] font-light text-ink-faint">
            {cor.toUpperCase()}
          </span>
        </label>

        {corRepetida && (
          <p role="alert" className="mt-2 text-[13px] font-light text-danger">
            Esta cor já pertence a outra categoria. Escolha outra em "Outra cor"
            para as duas não se confundirem nas telas.
          </p>
        )}
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando || corRepetida}>
          {enviando ? "Criando..." : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
