import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain, Sparkles, Users, Target, Mic, FileUp, MessageSquare,
  Trophy, Zap, BookOpen, ArrowRight, Check
} from "lucide-react";

const features = [
  { icon: Brain, title: "Flashcards inteligentes", desc: "Repetição espaçada que se adapta. Cards difíceis voltam mais, fáceis somem." },
  { icon: Sparkles, title: "IA gera tudo por você", desc: "Cole um texto, link do YouTube ou PDF. A IA cria flashcards, resumos, quizzes e mapas mentais." },
  { icon: MessageSquare, title: "Tutor IA 24/7", desc: "Tire dúvidas, peça explicações, monte planos de estudo. Como ter um professor particular." },
  { icon: Mic, title: "Responda em áudio", desc: "Pratique pronunciando as respostas em voz alta — perfeito para idiomas e revisão ativa." },
  { icon: Users, title: "Galera estudando junto", desc: "Grupos por área (vestibular, IA, marketing). Compartilhe, compita, evolua junto." },
  { icon: Trophy, title: "XP, streak e níveis", desc: "Estudar todo dia vira hábito. Mantenha sua sequência e suba de nível." },
];

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen gradient-soft">
      <header className="container py-6 flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
          <Button asChild><Link to="/auth">Começar grátis</Link></Button>
        </div>
      </header>

      <section className="container pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          Estudar nunca foi tão leve
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-balance mb-6 animate-fade-in">
          Seu segundo cérebro<br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            para aprender de verdade.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance animate-fade-in">
          Flashcards com IA, resumos automáticos, tutor pessoal, grupos de estudo e gamificação.
          Tudo num só app, organizado do seu jeito.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in">
          <Button size="lg" asChild className="shadow-glow text-base h-12 px-8">
            <Link to="/auth">Começar agora — é grátis <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
            <Link to="/auth">Ver os grupos</Link>
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Sem cartão</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> IA inclusa</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Em português</span>
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
        <div className="bg-card border rounded-3xl p-12 text-center shadow-soft">
          <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-balance">Pronto para virar o jogo dos seus estudos?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Junte-se à galera que já está estudando todo dia com IA.</p>
          <Button size="lg" asChild className="shadow-glow h-12 px-8"><Link to="/auth">Criar minha conta</Link></Button>
        </div>
      </section>

      <footer className="container py-8 text-center text-sm text-muted-foreground border-t">
        Lumi — feito para estudantes que querem aprender de verdade.
      </footer>
    </div>
  );
};

export default Index;
