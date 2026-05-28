import AuthPage from "./AuthPage";

export default function RegisterPage({ onNavigate }) {
  return <AuthPage onNavigate={onNavigate} initialMode="register" />;
}
