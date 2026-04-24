import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Clock3,
  FileText,
  Layers,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const studyFlow = [
  { label: "Material bruto", value: "PDF • aula • anotação" },
  { label: "IA organiza", value: "resumo, mapa e quiz" },
  { label: "Memória ativa", value: "SRS + revisão guiada" },
];

const features = [
  {
    icon: FileText,
    title: "Transforme qualquer conteúdo",
    desc: "Suba aulas, PDFs e anotações para gerar resumos, flashcards, quizzes e planos de estudo em minutos.",
  },
  {
    icon: Brain,
    title: "Revisão espaçada inteligente",
    desc: "O SRS ajusta a frequência conforme seu esforço e traz de volta o conteúdo antes da curva do esquecimento.",
  },
  {
    icon: Layers,
    title: "Mapas mentais vivos",
    desc: "Conecte conceitos difíceis em diagramas visuais editáveis para enxergar a matéria inteira com clareza.",
  },
  {
    icon: Mic,
    title: "Prova oral com IA",
    desc: "Explique o tema em voz alta e receba feedback sobre precisão, clareza e domínio real do assunto.",
  },
];

const metrics = [
  { value: "4h", label: "revisão crítica" },
  { value: "82%", label: "domínio estimado" },
  { value: "12", label: "cards para hoje" },
];

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="container relative z-10 py-5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild className="shadow-glow">
            <Link to="/auth">Começar</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="container relative pt-8 pb-16 md:pt-14 md:pb-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] gradient-soft" />
          <div className="grid lg:grid-cols-[0.94fr_1.06fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-sm font-medium text-primary shadow-soft animate-fade-in">
                <Sparkles className="h-3.5 w-3.5" />
                Sistema de estudo para alta performance
              </div>

              <h1 className="mt-7 text-5xl md:text-7xl lg:text-8xl font-serif font-medium leading-[0.9] text-balance animate-fade-in">
                Estude com método. <span className="text-primary">Lembre com precisão.</span>
              </h1>

              <p className="mt-7 text-lg md:text-xl leading-relaxed text-muted-foreground text-balance max-w-xl mx-auto lg:mx-0 animate-fade-in">
                Mindy Academy transforma seus materiais em um fluxo de aprendizado ativo: organizar, entender, testar, revisar e dominar.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in">
                <Button size="lg" asChild className="h-12 px-8 text-base shadow-glow">
                  <Link to="/auth">
                    Criar meu sistema de estudo <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <Link to="/auth">Ver rotina de revisão</Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0 animate-fade-in">
                {metrics.map((item) => (
                  <div key={item.label} className="border bg-card/75 p-4 shadow-soft rounded-2xl">
                    <p className="text-2xl font-serif text-primary leading-none">{item.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-snug">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl animate-fade-in">
              <div className="rounded-[2rem] border bg-card p-3 shadow-soft">
                <div className="rounded-[1.5rem] bg-secondary/70 p-4 md:p-6 overflow-hidden">
                  <div className="flex items-center justify-between gap-4 border-b pb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sessão de foco</p>
                      <h2 className="text-2xl font-serif font-medium">Neurociência da memória</h2>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {studyFlow.map((step, index) => (
                      <div key={step.label} className="group rounded-2xl border bg-card p-4 shadow-soft transition-smooth hover:shadow-glow">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{step.label}</p>
                              <p className="text-sm text-muted-foreground">{step.value}</p>
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-success" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border bg-background/75 p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Domínio do tema</span>
                      <span>82%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-primary-soft overflow-hidden">
                      <div className="h-full w-[82%] rounded-full bg-primary" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                      <span className="rounded-xl bg-secondary px-2 py-2">Flashcards</span>
                      <span className="rounded-xl bg-secondary px-2 py-2">Quiz</span>
                      <span className="rounded-xl bg-secondary px-2 py-2">Mapa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card/55">
          <div className="container py-10 md:py-14">
            <div className="grid gap-5 md:grid-cols-4">
              {[
                "Aulas viram plano",
                "Resumos viram revisão",
                "Erros viram prioridade",
                "Rotina vira domínio",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary mb-3">Aprendizado ativo</p>
            <h2 className="text-4xl md:text-6xl font-serif font-medium leading-tight text-balance">
              Menos acúmulo de conteúdo. Mais domínio mensurável.
            </h2>
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="border bg-card p-6 shadow-soft rounded-2xl transition-smooth hover:shadow-glow">
                <div className="mb-5 inline-grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-20 md:pb-28">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center border-t pt-14">
            <div>
              <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-medium leading-tight text-balance">
                Uma rotina de estudo que te puxa de volta para o que importa.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl">
                A cada sessão, a Mindy mostra o que revisar, onde você está fraco e qual próximo passo gera mais progresso.
              </p>
              <Button size="lg" asChild className="mt-8 h-12 px-8 shadow-glow">
                <Link to="/auth">Começar minha rotina</Link>
              </Button>
            </div>

            <div className="grid gap-3">
              {[
                { icon: Clock3, title: "Agenda de revisão", text: "Revisões espaçadas por dificuldade e desempenho." },
                { icon: PenLine, title: "Estudo guiado", text: "Flashcards, quizzes e resumos conectados ao mesmo tema." },
                { icon: Sparkles, title: "Tutor Mindy", text: "IA para explicar, testar e corrigir seu raciocínio." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container py-8 text-center text-sm text-muted-foreground border-t">
        Mindy Academy — estudo ativo, memória treinada e evolução consistente.
      </footer>
    </div>
  );
};

export default Index;
