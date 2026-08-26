import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { ErrorBanner } from "../components/ui/Feedback";
import { entrar, registrar } from "../services/authApi";
import { useSessao } from "../services/sessaoContexto";
import marcaNexo from "../assets/nexo-symbol.svg";

type Modo = "entrar" | "criar";

const CONVITES = [
  "Tarefas do dia",
  "Metas",
  "Lembretes",
  "Relatórios",
];

export function LoginPage() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { entrou } = useSessao();
  const navegar = useNavigate();

  const criando = modo === "criar";

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const conta = criando
        ? await registrar({ name: nome, email, password: senha })
        : await entrar({ email, password: senha });

      entrou(conta);
      navegar("/", { replace: true });
    } catch (falha) {
      setErro((falha as Error).message);
      setEnviando(false);
    }
  }

  function trocarModo(proximo: Modo) {
    setModo(proximo);
    setErro(null);
    setSenha("");
  }

  return (
    <main className="min-h-dvh bg-sidebar">
      <div className="mx-auto flex min-h-dvh max-w-[1080px] flex-col px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="-mx-2 flex w-fit items-center gap-2 rounded-pill px-2 py-2 text-[19px] font-semibold tracking-[-0.01em] text-ink"
        >
          <img
            src={marcaNexo}
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
          />
          Nexo
        </Link>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="anim-rise grid w-full items-center gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
            <Convite />

            <div className="mx-auto w-full max-w-[420px]">
              <div className="rounded-[24px] bg-surface p-6 shadow-[0_1px_3px_rgba(13,14,16,0.08),0_8px_28px_rgba(13,14,16,0.05)] sm:p-8">
                <Alternador
                  modo={modo}
                  onTrocar={trocarModo}
                  travado={enviando}
                />

                <h1 className="mt-6 text-[26px] leading-tight font-medium tracking-[-0.02em] text-ink">
                  {criando ? "Criar sua conta" : "Bem-vindo de volta"}
                </h1>
                <p className="mt-1.5 mb-6 text-sm text-ink-muted">
                  {criando
                    ? "Sua agenda já começa com as seis categorias padrão."
                    : "Entre para ver como está o seu dia."}
                </p>

                {erro && (
                  <div className="mb-4">
                    <ErrorBanner
                      message={erro}
                      onDismiss={() => setErro(null)}
                    />
                  </div>
                )}

                <form
                  onSubmit={(e) => void enviar(e)}
                  className="flex flex-col gap-4"
                  aria-busy={enviando}
                >
                  {criando && (
                    <Field label="Nome">
                      {(id, invalid) => (
                        <TextInput
                          id={id}
                          invalid={invalid}
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          autoComplete="name"
                          autoFocus
                          placeholder="Como você quer ser chamado"
                          required
                        />
                      )}
                    </Field>
                  )}

                  <Field label="E-mail">
                    {(id, invalid) => (
                      <TextInput
                        id={id}
                        invalid={invalid}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus={!criando}
                        placeholder="voce@ufape.br"
                        required
                      />
                    )}
                  </Field>

                  <Field
                    label="Senha"
                    hint={criando ? "Ao menos 8 caracteres." : undefined}
                  >
                    {(id, invalid) => (
                      <TextInput
                        id={id}
                        invalid={invalid}
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoComplete={
                          criando ? "new-password" : "current-password"
                        }
                        minLength={criando ? 8 : undefined}
                        required
                      />
                    )}
                  </Field>

                  <button
                    type="submit"
                    disabled={enviando}
                    className={
                      "mt-1 flex h-12 w-full items-center justify-center rounded-pill " +
                      "bg-accent text-[15px] font-semibold text-white transition-colors " +
                      "hover:bg-[#4a5890] disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    <span role="status">
                      {enviando
                        ? "Aguarde..."
                        : criando
                          ? "Criar conta e entrar"
                          : "Entrar"}
                    </span>
                  </button>
                </form>
              </div>

              <p className="mt-5 text-center text-sm text-ink-muted">
                {criando ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={enviando}
                  onClick={() => trocarModo(criando ? "entrar" : "criar")}
                >
                  {criando ? "Entrar" : "Criar agora"}
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Alternador({
  modo,
  onTrocar,
  travado,
}: {
  modo: Modo;
  onTrocar: (modo: Modo) => void;
  travado: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Entrar ou criar conta"
      className="flex gap-1 rounded-pill bg-sidebar p-1"
    >
      {(["entrar", "criar"] as const).map((opcao) => {
        const ativo = modo === opcao;
        return (
          <button
            key={opcao}
            type="button"
            role="tab"
            aria-selected={ativo}
            disabled={travado}
            onClick={() => onTrocar(opcao)}
            className={
              "h-10 flex-1 rounded-pill text-sm font-medium transition-colors " +
              "disabled:cursor-not-allowed " +
              (ativo
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(13,14,16,0.08)]"
                : "text-ink-muted hover:text-ink")
            }
          >
            {opcao === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        );
      })}
    </div>
  );
}

function Convite() {
  return (
    <div className="hidden flex-col gap-6 lg:flex">
      <h2 className="m-0 max-w-[420px] text-[40px] leading-[1.15] font-medium tracking-[-0.025em] text-balance text-ink">
        Um hub para organizar sua vida de{" "}
        <span className="relative inline-block whitespace-nowrap">
          tarefa
          <svg
            viewBox="0 0 240 92"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute top-[-0.42em] left-[-0.58em] h-[calc(100%+0.84em)] w-[calc(100%+1.16em)]"
          >
            <path
              d="M120 9 C192 7 231 27 229 47 C227 71 178 85 116 85 C52 85 11 69 11 45 C11 23 54 11 124 9 C186 8 218 18 224 32"
              pathLength={1}
              stroke="#55649E"
              strokeWidth="5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "nx-draw 1.3s ease-out 0.4s forwards",
              }}
            />
          </svg>
        </span>{" "}
        em tarefa
      </h2>

      <p className="m-0 max-w-[400px] text-[17px] leading-[1.5] text-pretty text-ink-soft">
        Tarefas, metas e lembretes num só lugar. Feito para o ritmo de quem
        estuda, estagia e ainda quer tempo livre.
      </p>

      <div className="flex flex-wrap gap-2">
        {CONVITES.map((texto) => (
          <span
            key={texto}
            className="rounded-pill bg-warm px-4 py-2 text-sm font-medium text-ink-soft"
          >
            {texto}
          </span>
        ))}
      </div>
    </div>
  );
}
