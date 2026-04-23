import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Subjects from "./pages/Subjects.tsx";
import SubjectDetail from "./pages/SubjectDetail.tsx";
import DeckDetail from "./pages/DeckDetail.tsx";
import Study from "./pages/Study.tsx";
import Create from "./pages/Create.tsx";
import Chat from "./pages/Chat.tsx";
import Plan from "./pages/Plan.tsx";
import Groups from "./pages/Groups.tsx";
import GroupDetail from "./pages/GroupDetail.tsx";
import Achievements from "./pages/Achievements.tsx";
import SummaryView from "./pages/SummaryView.tsx";
import QuizView from "./pages/QuizView.tsx";
import { AppLayout } from "./components/AppLayout";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="subjects/:id" element={<SubjectDetail />} />
              <Route path="decks/:id" element={<DeckDetail />} />
              <Route path="study" element={<Study />} />
              <Route path="create" element={<Create />} />
              <Route path="chat" element={<Chat />} />
              <Route path="plan" element={<Plan />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="summaries/:id" element={<SummaryView />} />
              <Route path="quizzes/:id" element={<QuizView />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
