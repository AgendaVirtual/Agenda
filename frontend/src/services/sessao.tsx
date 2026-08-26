import { useCallback, useEffect, useState, type ReactNode } from "react";
import { contaAtual, sair as sairNoServidor, type Conta } from "./authApi";
import { aoPerderSessao, ErroDeApi } from "./api";
import { ContextoDeSessao, type Sessao } from "./sessaoContexto";

export function ProvedorDeSessao({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<Conta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState<string | null>(null);

  const reconferir = useCallback(async () => {
    try {
      setConta(await contaAtual());
      setIndisponivel(null);
    } catch (erro) {
      setConta(null);
      const status = erro instanceof ErroDeApi ? erro.status : 0;
      setIndisponivel(status === 401 ? null : (erro as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void reconferir();
  }, [reconferir]);

  useEffect(
    () =>
      aoPerderSessao(() => {
        setConta(null);
        setIndisponivel(null);
      }),
    [],
  );

  const valor: Sessao = {
    conta,
    carregando,
    indisponivel,
    entrou: setConta,
    atualizou: setConta,
    sair: async () => {
      await sairNoServidor();
      setConta(null);
    },
    reconferir,
  };

  return (
    <ContextoDeSessao.Provider value={valor}>
      {children}
    </ContextoDeSessao.Provider>
  );
}
