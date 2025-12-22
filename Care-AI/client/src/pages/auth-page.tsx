import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (isLogin) {
      login({ username, password }, {
        onSuccess: () => {
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          setLocation("/");
        },
        onError: (err) => {
          toast({ title: "Login failed", description: err.message, variant: "destructive" });
        }
      });
    } else {
      register({ username, password }, {
        onSuccess: () => {
          toast({ title: "Account created", description: "Please log in with your new account." });
          setIsLogin(true);
        },
        onError: (err) => {
          toast({ title: "Registration failed", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const isPending = isLoginPending || isRegisterPending;

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Hero Section */}
      <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-12 h-12" />
            <h1 className="text-4xl font-bold font-display">HealthDash</h1>
          </div>
          <p className="text-xl opacity-90 leading-relaxed">
            Your personal health companion. Track your vitals, manage medical reports, and share securely with your healthcare providers.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Sign in to your account" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? "Enter your credentials below" : "Get started with your health journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full font-semibold text-md h-11 bg-primary hover:bg-primary/90 transition-colors"
                disabled={isPending}
              >
                {isPending ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                type="button"
                className="font-medium text-primary hover:underline transition-all"
                onClick={() => setIsLogin(!isLogin)}
                disabled={isPending}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
