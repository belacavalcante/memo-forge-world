import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain, Sparkles, Users, Target, Mic, FileUp, MessageSquare,
  Trophy, Zap, BookOpen, ArrowRight, Check, Layers, Lock
} from "lucide-react";

const features = [
  { icon: Brain, title: "Memória treinada", desc: "SRS adaptativo que traz de volta o que importa antes de você esquecer." },
  { icon: Sparkles, title: "IA de performance", desc: "Transforme aulas, vídeos e anotações em planos, flashcards, quizzes e resumos vivos." },
  { icon: Layers, title: "Mapas mentais", desc: "Visualize ideias, hábitos e matérias em diagramas editáveis para conectar tudo." },
  { icon: Mic, title: "Domínio por voz", desc: "Explique em voz alta e receba feedback para clareza, precisão e confiança." },
  { icon: Users, title: "Comunidades Elite", desc: "Compartilhe materiais públicos, receba votos e construa reputação com curadoria." },
  { icon: Lock, title: "Privacidade total", desc: "Cada pasta, matéria ou conteúdo pode ser privado ou público com um toque." },
];

const ritual = ["capturar", "organizar", "testar", "revisar", "evoluir"];

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen gradient-soft overflow-hidden">
      <header className="container py-5 flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
          <Button asChild><Link to="/auth">Começar</Link></Button>
        </div>
      </header>

      <section className="container pt-8 pb-16 md:pt-14 md:pb-20">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          Desenvolvimento pessoal guiado por IA
        </div>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium tracking-normal text-balance mb-6 animate-fade-in leading-[0.86]">
          Mindy<br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Academy
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 text-balance animate-fade-in">
          Um app para estudar, pensar melhor e evoluir todos os dias. Transforme materiais brutos em rituais de aprendizado ativo com IA, SRS, mapas mentais, voz, comunidade e progresso real.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in">
          <Button size="lg" asChild className="shadow-glow text-base h-12 px-8">
            <Link to="/auth">Criar meu sistema <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
            <Link to="/auth">Explorar comunidade</Link>
          </Button>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> SRS adaptativo</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Tutor IA</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Público ou privado</span>
        </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-in">
            <div className="rounded-[2rem] border bg-card p-4 shadow-soft">
              <div className="aspect-[4/5] rounded-[1.5rem] bg-secondary p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>ritual diário</span>
                  <span>82%</span>
                </div>
                <div>
                  <p className="text-8xl md:text-9xl font-serif leading-none text-primary/25">grow</p>
                  <div className="grid grid-cols-2 gap-3 -mt-6">
                    {ritual.map((item, index) => (
                      <div key={item} className="rounded-xl border bg-card/80 p-3 shadow-soft">
                        <div className="mb-3 h-1.5 rounded-full bg-primary-soft overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${52 + index * 9}%` }} />
                        </div>
                        <p className="font-medium capitalize">{item}</p>
                        <p className="text-xs text-muted-foreground mt-1">Mindy AI</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-background/80 border p-4">
                  <p className="text-sm text-muted-foreground mb-2">Próxima revisão</p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">Hábitos, foco e repertório</p>
                    <Target className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-card border rounded-2xl p-6 shadow-soft hover:shadow-glow transition-smooth">
              <div className="bg-primary-soft text-primary inline-flex p-2.5 rounded-xl mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="bg-card border rounded-3xl p-8 md:p-12 shadow-soft grid md:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div>
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-balance">Seu crescimento, organizado em um sistema.</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">Mindy Academy junta foco, estudo, autoconsciência e comunidade em uma experiência minimalista feita para virar hábito.</p>
            <Button size="lg" asChild className="shadow-glow h-12 px-8"><Link to="/auth">Começar minha evolução</Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Flashcards", "Planos", "Quizzes", "Mapas", "Voz", "Reputação"].map((item) => (
              <div key={item} className="rounded-2xl border bg-secondary/60 p-4">
                <BookOpen className="h-4 w-4 text-primary mb-3" />
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="container py-8 text-center text-sm text-muted-foreground border-t">
        Mindy Academy — desenvolvimento pessoal com aprendizado ativo, IA e consistência.
      </footer>
    </div>
  );
};

export default Index;
