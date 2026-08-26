import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { ErrorBanner } from "../components/ui/Feedback";
import { entrar, registrar } from "../services/authApi";
import { useSessao } from "../services/sessaoContexto";
import marcaNexo from "../assets/nexo-symbol.svg";

type Modo = "entrar" | "criar";

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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="anim-rise w-full max-w-[400px]">
        <div className="mb-7 flex items-center justify-center gap-[7px]">
          <img src={marcaNexo} alt="" aria-hidden="true" className="h-9 w-9" />
          <span className="text-[19px] font-semibold tracking-tight text-ink">
            Nexo
          </span>
        </div>

        <div className="rounded-[20px] bg-surface p-8 shadow-[0_1px_3px_rgba(13,14,16,0.06)]">
          <h1 className="text-2xl font-light tracking-[-0.02em] text-ink">
            {criando ? "Criar conta" : "Entrar"}
          </h1>
          <p className="mt-1 mb-6 text-sm text-ink-muted">
            {criando
              ? "Sua agenda começa com as seis categorias padrão."
              : "Use a conta que você criou para ver seu dia."}
          </p>

          {erro && (
            <div className="mb-4">
              <ErrorBanner message={erro} onDismiss={() => setErro(null)} />
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
                  autoComplete={criando ? "new-password" : "current-password"}
                  minLength={criando ? 8 : undefined}
                  required
                />
              )}
            </Field>

            <Button type="submit" fullWidth disabled={enviando}>
              <span role="status">
                {enviando
                  ? "Aguarde..."
                : criando
                  ? "Criar conta e entrar"
                  : "Entrar"}
              </span>
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-muted">
          {criando ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button
            type="button"
            disabled={enviando}
            onClick={() => trocarModo(criando ? "entrar" : "criar")}
            className="-my-1 rounded-soft px-1 py-3 font-medium text-ink underline underline-offset-4 transition-colors hover:text-accent"
          >
            {criando ? "Entrar" : "Criar agora"}
          </button>
        </p>
      </div>
    </main>
  );
}
