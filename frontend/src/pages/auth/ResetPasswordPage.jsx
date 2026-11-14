import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import AgriLogo from "../../assets/sariaya-agri-logo.jpg";

export default function ResetPasswordPage() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            await api.post("/password-reset/confirm/", { uid, token, password });
            toast.success("Password Reset", { description: "You can now sign in with your new password." });
            navigate("/login", { replace: true });
        } catch (requestError) {
            const data = requestError.response?.data;
            setError(data?.password?.join(" ") || data?.detail || "Could not reset your password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 px-4 py-12 flex items-center justify-center">
            <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-7 shadow-xs">
                <Link to="/" className="mb-6 flex items-center gap-3 w-fit">
                    <img src={AgriLogo} alt="Sariaya Agriculture Logo" className="h-10 w-10 rounded-full object-cover" />
                    <span className="text-xl font-black uppercase tracking-tight text-stone-900">Farm<span className="text-green-700">Pass</span></span>
                </Link>
                <h1 className="text-xl font-black text-stone-900">Set a new password</h1>
                <p className="mt-1 text-sm text-stone-600">Choose a strong password for your account.</p>
                {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-600">New Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input type={showPassword ? "text" : "password"} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-10 text-sm outline-none focus:border-green-700" />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 cursor-pointer" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-600">Confirm Password</label>
                        <input type={showPassword ? "text" : "password"} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-green-700" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-green-700 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-green-600 disabled:opacity-50 cursor-pointer">{isSubmitting ? "Saving..." : "Reset Password"}</button>
                </form>
                <Link to="/login" className="mt-5 block text-center text-xs font-bold text-green-700">Back to login</Link>
            </div>
        </main>
    );
}
