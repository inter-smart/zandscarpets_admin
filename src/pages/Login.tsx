import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormData } from "@/schemas/loginSchema";
import { getRememberedUsername, setRememberedUsername, clearRememberedUsername } from "@/lib/rememberedUsername";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
const Logo =
  "https://cdn-lanhl.nitrocdn.com/BEDNLEoRmIKjWuHGWySaweMWUMbmbmac/assets/images/source/rev-b24f0bb/www.zandscarpets.com/assets/images/logo.svg";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    const remembered = getRememberedUsername();
    if (remembered) {
      form.setValue("username", remembered);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginFormData) => {
    setServerError("");
    try {
      await login(values.username, values.password);

      if (rememberMe) {
        setRememberedUsername(values.username);
      } else {
        clearRememberedUsername();
      }

      const from = (location.state as { from?: Location })?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <img src={Logo} alt="Z&S" className="mx-auto h-12 w-auto mb-6" />
          {/* <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1> */}
          {/* <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your Z&S content</p> */}
        </div>

        {/* Login Form */}
        <Card className="shadow-healthcare-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Email / Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your email / username"
                    autoComplete="username"
                    className="pl-10"
                    {...form.register("username")}
                  />
                </div>
                {form.formState.errors.username && <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
              </div> */}

              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Z&S. All rights reserved.</p>
        </div>
      </div>

      <ForgotPasswordDialog open={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
