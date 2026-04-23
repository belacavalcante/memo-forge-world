import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ListChecks, Check, X, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function QuizView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("quizzes").select("*").eq("id", id).maybeSingle().then(({ data }) => setQuiz(data));
  }, [id]);

  if (!quiz) return <div className="container py-8">Carregando...</div>;
  const questions = (quiz.questions as any[]) || [];
  const q = questions[idx];

  const next = async () => {
    if (picked === null) return;
    const newAnswers = [...answers, picked];
    setAnswers(newAnswers);
    setPicked(null);
    if (idx + 1 >= questions.length) {
      setDone(true);
      const score = newAnswers.filter((a, i) => a === questions[i].correctIndex).length;
      if (user) {
        await supabase.from("quiz_attempts").insert({ quiz_id: quiz.id, user_id: user.id, score, total: questions.length, answers: newAnswers });
        await supabase.rpc("award_xp", { _user_id: user.id, _xp: score * 5, _activity: "quiz", _metadata: { quiz_id: quiz.id, score } as any });
      }
    } else setIdx(idx + 1);
  };

  if (done) {
    const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
    return (
      <div className="container max-w-2xl py-16 text-center animate-scale-in">
        <div className="gradient-primary inline-flex p-4 rounded-2xl shadow-glow mb-6"><Trophy className="h-10 w-10 text-primary-foreground" /></div>
        <h1 className="text-3xl font-semibold mb-2">{score} / {questions.length} corretas!</h1>
        <p className="text-muted-foreground mb-6">+{score * 5} XP</p>
        <Button onClick={() => { setIdx(0); setAnswers([]); setDone(false); }}>Refazer</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 animate-fade-in">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-semibold flex items-center gap-2 mb-2"><ListChecks className="h-6 w-6 text-primary" /> {quiz.title}</h1>
      <Progress value={(idx / questions.length) * 100} className="h-1.5 mb-6" />
      <Card className="p-6 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Pergunta {idx + 1} de {questions.length}</p>
        <h2 className="font-medium text-lg mb-4">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt: string, i: number) => {
            const isPicked = picked === i;
            const isCorrect = i === q.correctIndex;
            const showResult = picked !== null;
            return (
              <button key={i} onClick={() => picked === null && setPicked(i)} disabled={picked !== null}
                className={`w-full text-left p-3 rounded-lg border-2 transition-smooth flex items-center justify-between ${
                  showResult && isCorrect ? "border-success bg-success/10"
                  : showResult && isPicked && !isCorrect ? "border-destructive bg-destructive/10"
                  : isPicked ? "border-primary bg-primary-soft"
                  : "border-border hover:border-muted-foreground/40"
                }`}>
                <span className="text-sm">{opt}</span>
                {showResult && isCorrect && <Check className="h-4 w-4 text-success" />}
                {showResult && isPicked && !isCorrect && <X className="h-4 w-4 text-destructive" />}
              </button>
            );
          })}
        </div>
        {picked !== null && q.explanation && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">💡 {q.explanation}</div>
        )}
      </Card>
      <Button onClick={next} disabled={picked === null} className="w-full">
        {idx + 1 >= questions.length ? "Finalizar" : "Próxima"}
      </Button>
    </div>
  );
}