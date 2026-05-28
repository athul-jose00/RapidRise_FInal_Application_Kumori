import AuthPage from "./AuthPage";

export default function LoginPage({ onNavigate }) {
  return <AuthPage onNavigate={onNavigate} initialMode="login" />;
}
